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

  // 2. Prepare Headers & Handle CGI/FastCGI Authorization Header Stripping
  const headers = {
    'Accept': 'application/json',
  }

  if (username && applicationPassword) {
    const cleanUser = username.trim()
    const cleanPass = applicationPassword.trim()
    // Strip spaces for Application Passwords if formatted with spaces
    const noSpacePass = cleanPass.replace(/\s+/g, '')

    const rawAuth = btoa(`${cleanUser}:${cleanPass}`)
    const altAuth = btoa(`${cleanUser}:${noSpacePass}`)

    // Standard Authorization header
    headers['Authorization'] = `Basic ${rawAuth}`

    // Fallback headers for CGI/FastCGI web servers (Apache/PHP-FPM) that strip Authorization
    headers['X-Authorization'] = `Basic ${rawAuth}`
    headers['X-HTTP-Authorization'] = `Basic ${rawAuth}`
    headers['X-WP-Authorization'] = `Basic ${altAuth}`
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
