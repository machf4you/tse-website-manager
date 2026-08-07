/**
 * Integration Service: TSE WordPress Exporter API Client
 * Responsible ONLY for issuing the SYNCHRONISE request payload to the TSE Exporter.
 * Performs NO WordPress REST API calls directly inside Website Manager.
 */

// Configurable endpoint for the external TSE WordPress Exporter engine
export const TSE_EXPORTER_ENDPOINT_URL = import.meta.env?.VITE_TSE_EXPORTER_ENDPOINT || null

/**
 * Sends a synchronisation request to the TSE WordPress Exporter.
 *
 * Request Payload (strictly specified by architecture):
 * - websiteId
 * - websiteUrl
 * - username
 * - applicationPassword
 * - action = 'SYNCHRONISE'
 */
export async function callTseWordPressExporter({
  websiteId,
  websiteUrl,
  username,
  applicationPassword,
}) {
  // Requirement 4: Check if endpoint URL is defined
  if (!TSE_EXPORTER_ENDPOINT_URL) {
    return {
      success: false,
      error: 'EXPORTER_ENDPOINT_NOT_DEFINED',
      message: 'The TSE WordPress Exporter endpoint URL has not yet been defined in the environment configuration.',
      requiredInfo: [
        'TSE WordPress Exporter API Endpoint URL (e.g. https://exporter.thesearchequation.co.uk/api/export)',
        'Authentication method / API key for the Exporter service (if required)',
        'CORS policy / HTTP header requirements for cross-origin export requests',
      ],
    }
  }

  const payload = {
    websiteId,
    websiteUrl,
    username,
    applicationPassword,
    action: 'SYNCHRONISE',
  }

  try {
    const response = await fetch(TSE_EXPORTER_ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`TSE Exporter returned status ${response.status}`)
    }

    const packageData = await response.json()

    return {
      success: true,
      packageData,
    }
  } catch (error) {
    return {
      success: false,
      error: 'EXPORTER_REQUEST_FAILED',
      message: error.message || 'Failed to connect to TSE WordPress Exporter endpoint.',
    }
  }
}
