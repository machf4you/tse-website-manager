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
      // Fallback: Fetch public WordPress REST API pages directly
      try {
        const fallbackRes = await fetch(`${cleanUrl}/wp-json/wp/v2/pages?per_page=100`)
        if (fallbackRes.ok) {
          const fallbackPages = await fallbackRes.json()
          if (Array.isArray(fallbackPages) && fallbackPages.length > 0) {
            return {
              success: true,
              packageData: {
                pages: fallbackPages,
                site_info: { url: cleanUrl }
              }
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
      // Fallback to public REST API pages
      try {
        const fallbackRes = await fetch(`${cleanUrl}/wp-json/wp/v2/pages?per_page=100`)
        if (fallbackRes.ok) {
          const fallbackPages = await fallbackRes.json()
          if (Array.isArray(fallbackPages) && fallbackPages.length > 0) {
            return {
              success: true,
              packageData: {
                pages: fallbackPages,
                site_info: { url: cleanUrl }
              }
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
