/**
 * Website Manager — Articles API Service
 */

import { API_BASE_URL } from './websiteManagerApi.js'

async function fetchJson(url, options = {}, timeoutMs = 45000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      let errDetail = `HTTP ${res.status}`
      try {
        const errJson = await res.json()
        errDetail = errJson.error || errJson.message || errDetail
      } catch (_e) {
        const text = await res.text()
        if (text) errDetail = text.slice(0, 150)
      }
      throw new Error(errDetail)
    }

    return await res.json()
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

/**
 * Fetch WordPress Categories for a site
 */
export async function getWordPressCategoriesApi(siteId) {
  return await fetchJson(`${API_BASE_URL}/websites/${encodeURIComponent(siteId)}/categories`)
}

/**
 * Propose an article opportunity for a target Hub/Landing page
 */
export async function suggestArticleOpportunityApi({ siteId, targetPage }) {
  return await fetchJson(`${API_BASE_URL}/articles/suggest-opportunity`, {
    method: 'POST',
    body: JSON.stringify({ siteId, targetPage })
  })
}

/**
 * Generate full AI article
 */
export async function generateArticleApi(payload) {
  return await fetchJson(`${API_BASE_URL}/articles/generate`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }, 60000) // 60s timeout for LLM generation
}

/**
 * Batch generate Hub Content for multiple websites (1 article per site)
 */
export async function batchGenerateHubContentApi({ siteIds, provider = 'claude', model = null }) {
  return await fetchJson(`${API_BASE_URL}/hub-content/batch-generate`, {
    method: 'POST',
    body: JSON.stringify({ siteIds, provider, model })
  }, 120000) // 120s timeout for batch generation
}

/**
 * Get all article drafts
 */
export async function getArticleDraftsApi(siteId = null) {
  const url = siteId
    ? `${API_BASE_URL}/articles/drafts?siteId=${encodeURIComponent(siteId)}`
    : `${API_BASE_URL}/articles/drafts`
  return await fetchJson(url)
}

/**
 * Save / update local draft
 */
export async function saveArticleDraftApi(draft) {
  return await fetchJson(`${API_BASE_URL}/articles/drafts`, {
    method: 'POST',
    body: JSON.stringify(draft)
  })
}

/**
 * Delete a draft article
 */
export async function deleteArticleDraftApi(draftId) {
  return await fetchJson(`${API_BASE_URL}/articles/drafts/${encodeURIComponent(draftId)}`, {
    method: 'DELETE'
  })
}

/**
 * Mark a draft article as Completed
 */
export async function completeArticleDraftApi(draftId) {
  return await fetchJson(`${API_BASE_URL}/articles/drafts/${encodeURIComponent(draftId)}/complete`, {
    method: 'POST'
  })
}

/**
 * Send draft article to WordPress as DRAFT
 */
export async function sendDraftToWordPressApi(draftId) {
  return await fetchJson(`${API_BASE_URL}/articles/drafts/${encodeURIComponent(draftId)}/send-to-wordpress`, {
    method: 'POST'
  })
}



