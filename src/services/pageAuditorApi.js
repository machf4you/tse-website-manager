/**
 * Service to interface with the separate TSE Page Auditor application engine (FastAPI @ http://localhost:8000/api).
 */

const PAGE_AUDITOR_API_BASE = (import.meta.env && import.meta.env.VITE_PAGE_AUDITOR_API_URL) || 'https://api-page-auditor.thesearchequation.co.uk/api'

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
  let rulesConfig = null
  try {
    const raw = localStorage.getItem('tse_page_auditor_rules_v1') || localStorage.getItem('tse_global_rules_config')
    if (raw) rulesConfig = JSON.parse(raw)
  } catch (e) {
    // ignore
  }

  const payload = {
    site_id: siteId || 'site-1',
    page_id: pageId || url,
    url: url,
    primary_phrase: targetPhrase || '',
    assigned_type: seoPageType || 'Unclassified',
    secondary_phrases: [],
    render_js: false,
    rules_parameters: rulesConfig || {
      min_internal_links: 3,
      min_word_count: 300,
      meta_title_min: 50,
      meta_title_max: 65,
      meta_desc_min: 120,
      meta_desc_max: 160,
    }
  }

  console.log('[AUDIT_TRACE_STEP_1] Issuing POST request to /api/audit with payload:', payload)

  const response = await fetch(`${PAGE_AUDITOR_API_BASE}/audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  console.log('[AUDIT_TRACE_STEP_2] Received HTTP status:', response.status)

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Page Auditor HTTP error ${response.status}: ${errText}`)
  }

  const jsonResult = await response.json()
  console.log('[AUDIT_TRACE_STEP_3] Raw response JSON immediately after parsing:', jsonResult)
  return jsonResult
}
