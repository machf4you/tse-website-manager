/**
 * Integration Service: TSE WordPress Exporter Client
 * Connects to the TSE WordPress Exporter REST endpoint.
 *
 * Endpoint: GET {websiteUrl}/wp-json/tse-site-exporter/v1/export
 * Authentication: WordPress Application Password (Basic Auth)
 */

export async function fetchTseWordPressExportPackage({
  websiteUrl,
  username,
  applicationPassword,
}) {
  if (!websiteUrl) {
    return { success: false, error: 'MISSING_URL', message: 'Website URL is required.' }
  }

  // 1. Normalize Website Base URL
  const cleanUrl = websiteUrl.trim().replace(/\/+$/, '')
  const endpoint = `${cleanUrl}/wp-json/tse-site-exporter/v1/export`

  // 2. Prepare Standard Request Headers
  const headers = {
    'Accept': 'application/json',
  }

  if (username && applicationPassword) {
    const authString = btoa(`${username.trim()}:${applicationPassword.trim()}`)
    headers['Authorization'] = `Basic ${authString}`
  }

  // 3. Issue GET Request
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      // Fallback: Fetch public WordPress REST API pages, posts, and projects directly
      try {
        const [pagesRes, postsRes, projRes] = await Promise.all([
          fetch(`${cleanUrl}/wp-json/wp/v2/pages?per_page=100`),
          fetch(`${cleanUrl}/wp-json/wp/v2/posts?per_page=100`),
          fetch(`${cleanUrl}/wp-json/wp/v2/projects?per_page=100`)
        ])

        const pages = pagesRes.ok ? await pagesRes.json() : []
        const posts = postsRes.ok ? await postsRes.json() : []
        const projects = projRes.ok ? await projRes.json() : []

        const combinedPages = [
          ...(Array.isArray(pages) ? pages : []),
          ...(Array.isArray(posts) ? posts : []),
          ...(Array.isArray(projects) ? projects : [])
        ]

        if (combinedPages.length > 0) {
          return {
            success: true,
            packageData: {
              pages: combinedPages,
              posts,
              site_info: { url: cleanUrl }
            }
          }
        }
      } catch (fbError) {
        console.error('WP REST fallback failed:', fbError)
      }

      let customMsg = `TSE Exporter endpoint returned status ${response.status} (${response.statusText}).`
      if (response.status === 401) {
        customMsg = 'WordPress Authentication Failed: Invalid Username or Application Password (HTTP 401).'
      }
      return {
        success: false,
        status: response.status,
        error: `EXPORTER_HTTP_${response.status}`,
        message: customMsg,
      }
    }

    const packageData = await response.json()

    // If WordPress returns a WP_Error payload (e.g. { code: '...', message: '...' })
    if (packageData && packageData.code && packageData.message && !packageData.pages && !packageData.data?.pages) {
      // Fallback to public REST API pages, posts, and projects
      try {
        const [pagesRes, postsRes, projRes] = await Promise.all([
          fetch(`${cleanUrl}/wp-json/wp/v2/pages?per_page=100`),
          fetch(`${cleanUrl}/wp-json/wp/v2/posts?per_page=100`),
          fetch(`${cleanUrl}/wp-json/wp/v2/projects?per_page=100`)
        ])

        const pages = pagesRes.ok ? await pagesRes.json() : []
        const posts = postsRes.ok ? await postsRes.json() : []
        const projects = projRes.ok ? await projRes.json() : []

        const combinedPages = [
          ...(Array.isArray(pages) ? pages : []),
          ...(Array.isArray(posts) ? posts : []),
          ...(Array.isArray(projects) ? projects : [])
        ]

        if (combinedPages.length > 0) {
          return {
            success: true,
            packageData: {
              pages: combinedPages,
              posts,
              site_info: { url: cleanUrl }
            }
          }
        }
      } catch (fbError) {
        console.error('WP REST fallback failed:', fbError)
      }

      return {
        success: false,
        error: packageData.code,
        message: `WordPress Error (${packageData.code}): ${packageData.message}`,
      }
    }

    return {
      success: true,
      packageData,
    }
  } catch (error) {
    return {
      success: false,
      error: 'EXPORTER_NETWORK_ERROR',
      message: error.message || 'Failed to reach TSE WordPress Exporter endpoint.',
    }
  }
}

/**
 * Backward compatible alias for exporterApi service caller
 */
export async function callTseWordPressExporter({
  websiteId,
  websiteUrl,
  username,
  applicationPassword,
}) {
  const result = await fetchTseWordPressExportPackage({
    websiteUrl,
    username,
    applicationPassword,
  })

  if (result.success && result.packageData) {
    return {
      success: true,
      websiteId,
      packageData: result.packageData,
    }
  }

  return result
}

import { API_BASE_URL } from './websiteManagerApi.js'

/**
 * Integration Service: Server-Side Magento REST API Exporter Client
 * Connects to Website Manager backend proxy endpoint:
 * POST /api/websites/{siteId}/magento-sync
 *
 * The browser does NOT call hf4you.co.uk/rest/... directly and does NOT expose tokens.
 * All Magento REST API calls are issued server-side by the backend.
 */
export async function fetchMagentoExportPackage({
  websiteId,
  site
}) {
  const targetId = websiteId || site?.id || '1786704253814'

  try {
    const response = await fetch(`${API_BASE_URL}/websites/${encodeURIComponent(targetId)}/magento-sync`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      }
    })

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      return {
        success: false,
        status: response.status,
        error: 'NON_JSON_RESPONSE',
        message: `Backend endpoint returned non-JSON (${response.status}): ${text.slice(0, 150)}`
      }
    }

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        status: response.status,
        error: data.error || 'MAGENTO_SYNC_FAILED',
        message: data.message || `Backend Magento synchronisation failed (HTTP ${response.status}).`
      }
    }

    return {
      success: true,
      packageData: data.packageData
    }
  } catch (error) {
    return {
      success: false,
      error: 'BACKEND_NETWORK_ERROR',
      message: `Failed to connect to Website Manager backend for Magento sync: ${error.message}`
    }
  }
}
