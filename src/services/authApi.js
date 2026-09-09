/**
 * TSE Apps Central Authentication & User Management API Service
 * Interacts with tse-auth-service (https://auth.thesearchequation.co.uk/api)
 */

export const AUTH_API_BASE = 'https://auth.thesearchequation.co.uk/api'
export const AUTH_LOGOUT_URL = 'https://auth.thesearchequation.co.uk/logout'
export const AUTH_LOGIN_URL = 'https://auth.thesearchequation.co.uk/'

/**
 * Fetch current authenticated user profile
 */
export async function getAuthMe() {
  try {
    const res = await fetch(`${AUTH_API_BASE}/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!res.ok) {
      if (res.status === 401) {
        return { authenticated: false, user: null }
      }
      throw new Error(`Auth check failed with status ${res.status}`)
    }

    const data = await res.json()
    return {
      authenticated: Boolean(data?.success && data?.user),
      user: data?.user || null
    }
  } catch (err) {
    console.warn('[AUTH] Session verification error:', err)
    return { authenticated: false, user: null, error: err.message }
  }
}

/**
 * Perform logout and redirect to login screen
 */
export async function logoutUser() {
  try {
    await fetch(`${AUTH_API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (e) {
    console.warn('[AUTH] Logout API warning:', e)
  }
  // Redirect to central auth logout URL to ensure cookie clearing and login form display
  window.location.href = AUTH_LOGOUT_URL
}

/**
 * Fetch list of all registered users (Admin only)
 */
export async function getAdminUsers() {
  const res = await fetch(`${AUTH_API_BASE}/admin/users`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json'
    }
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `Failed to fetch users (${res.status})`)
  }

  const data = await res.json()
  return data.users || []
}

/**
 * Create a new user (Admin only)
 */
export async function createAdminUser({ username, email, password, role, allowed_apps }) {
  const res = await fetch(`${AUTH_API_BASE}/admin/users`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      username,
      email,
      password,
      role: role || 'staff',
      allowed_apps: allowed_apps || []
    })
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to create user (${res.status})`)
  }

  return data.user
}

/**
 * Update an existing user (Admin only)
 */
export async function updateAdminUser(userId, { username, email, role, allowed_apps, password }) {
  const payload = {}
  if (username !== undefined) payload.username = username
  if (email !== undefined) payload.email = email
  if (role !== undefined) payload.role = role
  if (allowed_apps !== undefined) payload.allowed_apps = allowed_apps
  if (password && password.trim().length > 0) payload.password = password.trim()

  const res = await fetch(`${AUTH_API_BASE}/admin/users/${userId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to update user (${res.status})`)
  }

  return data.user
}

/**
 * Delete a user (Admin only)
 */
export async function deleteAdminUser(userId) {
  const res = await fetch(`${AUTH_API_BASE}/admin/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Accept': 'application/json'
    }
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to delete user (${res.status})`)
  }

  return data
}
