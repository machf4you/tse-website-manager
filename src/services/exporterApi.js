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

  // 2. Prepare Headers
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
      return {
        success: false,
        status: response.status,
        error: `EXPORTER_HTTP_${response.status}`,
        message: `TSE Exporter endpoint returned status ${response.status} (${response.statusText}).`,
      }
    }

    const packageData = await response.json()

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
