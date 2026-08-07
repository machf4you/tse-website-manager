/**
 * Service to interface with the separate TSE Page Auditor application engine (FastAPI @ http://localhost:8000/api).
 */

const PAGE_AUDITOR_API_BASE = 'http://localhost:8000/api'

/**
 * Check if TSE Page Auditor API server is reachable
 */
export async function checkPageAuditorHealth() {
  try {
    const res = await fetch(`${PAGE_AUDITOR_API_BASE}/`, { method: 'GET' })
    if (res.ok) {
      const data = await res.json()
      return data.status === 'ok'
    }
  } catch (e) {
    console.warn('TSE Page Auditor API health check failed:', e)
  }
  return false
}

/**
 * Execute audit on TSE Page Auditor engine
 * Sends: websiteId, pageId, pageUrl, targetPhrase, seoPageType
 */
export async function executePageAudit({ siteId, pageId, url, targetPhrase, seoPageType }) {
  const payload = {
    site_id: siteId || 'site-1',
    page_id: pageId || url,
    url: url,
    primary_phrase: targetPhrase || '',
    assigned_type: seoPageType || 'Unclassified',
    secondary_phrases: [],
    render_js: false,
  }

  const response = await fetch(`${PAGE_AUDITOR_API_BASE}/audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Page Auditor HTTP error ${response.status}: ${errText}`)
  }

  return await response.json()
}
