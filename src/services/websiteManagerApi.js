/**
 * Website Manager SQLite Backend Persistence API Client
 * Replaces pure localStorage operations with persistent REST API calls to Website Manager server.
 */

import { normalizeSiteId } from '../utils/siteKeyHelper.js'

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WEBSITE_MANAGER_API_URL)
  ? import.meta.env.VITE_WEBSITE_MANAGER_API_URL
  : 'https://api-website-manager.thesearchequation.co.uk/api'

async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`API error (${res.status}): ${errText}`)
    }
    return await res.json()
  } catch (e) {
    console.error(`[WM_API_ERROR] ${url}:`, e)
    throw e
  }
}

// 1. CONNECTED WEBSITES
export async function getWebsitesApi() {
  try {
    const sites = await fetchJson(`${API_BASE_URL}/websites`)
    const list = Array.isArray(sites) ? sites : []
    return list.map(s => {
      const cfg = s.configData || {}
      const restoredUser = s.wpUser || s.connectedUser || cfg.wpUser || ''
      const restoredPass = (s.wpPass !== undefined && s.wpPass !== '') ? s.wpPass : (cfg.wpPass || '')
      return {
        ...s,
        wpUser: restoredUser,
        wpPass: restoredPass,
        connectedUser: restoredUser
      }
    })
  } catch (e) {
    // Fallback to localStorage if server is offline during transition
    const raw = localStorage.getItem('tse_website_dashboard_sites')
    return raw ? JSON.parse(raw) : []
  }
}

export async function saveWebsiteApi(siteRecord) {
  const statusVal = typeof siteRecord.status === 'object' ? JSON.stringify(siteRecord.status) : siteRecord.status
  const existingCfg = siteRecord.configData || {}
  const wpUserVal = siteRecord.wpUser || siteRecord.connectedUser || existingCfg.wpUser || ''
  const wpPassVal = (siteRecord.wpPass !== undefined && siteRecord.wpPass !== '') ? siteRecord.wpPass : (existingCfg.wpPass || '')

  const configData = {
    ...existingCfg,
    wpUser: wpUserVal,
    wpPass: wpPassVal
  }

  const payload = {
    ...siteRecord,
    wpUser: wpUserVal,
    wpPass: wpPassVal,
    status: statusVal,
    configData
  }

  // Save to SQLite API
  try {
    await fetchJson(`${API_BASE_URL}/websites`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  } catch (e) {
    console.warn('Backend API save failed, updating localStorage fallback')
  }

  // Also maintain localStorage as local mirror
  try {
    const raw = localStorage.getItem('tse_website_dashboard_sites')
    let list = raw ? JSON.parse(raw) : []
    const idx = list.findIndex(s => String(s.id) === String(siteRecord.id))
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...payload }
    } else {
      list.push(payload)
    }
    localStorage.setItem('tse_website_dashboard_sites', JSON.stringify(list))
  } catch (err) {}
}

export async function saveWebsitesBatchApi(sitesList) {
  const sanitizedList = Array.isArray(sitesList) ? sitesList.map(s => {
    const existingCfg = s.configData || {}
    const wpUserVal = s.wpUser || s.connectedUser || existingCfg.wpUser || ''
    const wpPassVal = (s.wpPass !== undefined && s.wpPass !== '') ? s.wpPass : (existingCfg.wpPass || '')
    const configData = {
      ...existingCfg,
      wpUser: wpUserVal,
      wpPass: wpPassVal
    }
    return {
      ...s,
      wpUser: wpUserVal,
      wpPass: wpPassVal,
      status: typeof s.status === 'object' ? JSON.stringify(s.status) : s.status,
      configData
    }
  }) : []

  try {
    await fetchJson(`${API_BASE_URL}/websites/batch`, {
      method: 'POST',
      body: JSON.stringify(sanitizedList)
    })
  } catch (e) {}
  try {
    localStorage.setItem('tse_website_dashboard_sites', JSON.stringify(sanitizedList))
  } catch (err) {}
}

export async function deleteWebsiteApi(siteId) {
  try {
    await fetchJson(`${API_BASE_URL}/websites/${siteId}`, {
      method: 'DELETE'
    })
  } catch (e) {}
  try {
    const raw = localStorage.getItem('tse_website_dashboard_sites')
    if (raw) {
      const list = JSON.parse(raw).filter(s => String(s.id) !== String(siteId))
      localStorage.setItem('tse_website_dashboard_sites', JSON.stringify(list))
    }
  } catch (err) {}
}

// 2. WORDPRESS SYNC PACKAGES
export async function getWpPackageApi(siteId) {
  try {
    const res = await fetchJson(`${API_BASE_URL}/websites/${siteId}/package`)
    return res.packageData || null
  } catch (e) {
    const raw = localStorage.getItem(`tse_wp_package_${siteId}`)
    return raw ? JSON.parse(raw) : null
  }
}

export async function saveWpPackageApi(siteId, packageData) {
  try {
    await fetchJson(`${API_BASE_URL}/websites/${siteId}/package`, {
      method: 'POST',
      body: JSON.stringify(packageData)
    })
  } catch (e) {}
  try {
    localStorage.setItem(`tse_wp_package_${siteId}`, JSON.stringify(packageData))
  } catch (err) {}
}

// 3. PAGE CONFIGURATIONS
export async function getPageConfigsApi(rawSiteId) {
  const siteId = normalizeSiteId(rawSiteId)
  try {
    return await fetchJson(`${API_BASE_URL}/websites/${siteId}/page-configs`)
  } catch (e) {
    const raw = localStorage.getItem(`tse_page_configs_${siteId}`)
    return raw ? JSON.parse(raw) : {}
  }
}

export async function savePageConfigsApi(rawSiteId, configsMap) {
  const siteId = normalizeSiteId(rawSiteId)
  try {
    await fetchJson(`${API_BASE_URL}/websites/${siteId}/page-configs`, {
      method: 'POST',
      body: JSON.stringify(configsMap)
    })
  } catch (e) {}
  try {
    localStorage.setItem(`tse_page_configs_${siteId}`, JSON.stringify(configsMap))
  } catch (err) {}
}

// 4. PAGE AUDITS
export async function getPageAuditsApi(rawSiteId) {
  const siteId = normalizeSiteId(rawSiteId)
  try {
    return await fetchJson(`${API_BASE_URL}/websites/${siteId}/audits`)
  } catch (e) {
    const raw = localStorage.getItem(`tse_page_audits_${siteId}`)
    return raw ? JSON.parse(raw) : {}
  }
}

export async function savePageAuditApi(rawSiteId, pageKey, auditRecord) {
  const siteId = normalizeSiteId(rawSiteId)
  try {
    await fetchJson(`${API_BASE_URL}/websites/${siteId}/audits/${encodeURIComponent(pageKey)}`, {
      method: 'POST',
      body: JSON.stringify(auditRecord)
    })
  } catch (e) {}
  try {
    const raw = localStorage.getItem(`tse_page_audits_${siteId}`)
    const audits = raw ? JSON.parse(raw) : {}
    audits[pageKey] = auditRecord
    localStorage.setItem(`tse_page_audits_${siteId}`, JSON.stringify(audits))
  } catch (err) {}
}

export async function savePageAuditsBatchApi(rawSiteId, auditsMap) {
  const siteId = normalizeSiteId(rawSiteId)
  try {
    await fetchJson(`${API_BASE_URL}/websites/${siteId}/audits/batch`, {
      method: 'POST',
      body: JSON.stringify(auditsMap)
    })
  } catch (e) {}
  try {
    localStorage.setItem(`tse_page_audits_${siteId}`, JSON.stringify(auditsMap))
  } catch (err) {}
}

export async function getInternalLinkRecommendationsApi(siteId) {
  try {
    return await fetchJson(`${API_BASE_URL}/websites/${siteId}/link-recommendations`)
  } catch (e) {
    const raw = localStorage.getItem(`tse_w5_recommendations_${siteId}`)
    return raw ? JSON.parse(raw) : {}
  }
}

export async function saveInternalLinkRecommendationsApi(siteId, recsMap) {
  try {
    await fetchJson(`${API_BASE_URL}/websites/${siteId}/link-recommendations`, {
      method: 'POST',
      body: JSON.stringify(recsMap)
    })
  } catch (e) {}
  try {
    localStorage.setItem(`tse_w5_recommendations_${siteId}`, JSON.stringify(recsMap))
  } catch (err) {}
}

// 5. ONE-TIME MIGRATION UTILITY FROM LOCALSTORAGE
export async function migrateLocalStorageApi() {
  try {
    const sitesRaw = localStorage.getItem('tse_website_dashboard_sites')
    const rawSitesList = sitesRaw ? JSON.parse(sitesRaw) : []
    const sites = rawSitesList.map(s => ({
      ...s,
      status: typeof s.status === 'object' ? JSON.stringify(s.status) : s.status
    }))

    const packages = {}
    const pageConfigs = {}
    const pageAudits = {}

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      if (key.startsWith('tse_wp_package_')) {
        const siteId = key.replace('tse_wp_package_', '')
        try { packages[siteId] = JSON.parse(localStorage.getItem(key)) } catch (e) {}
      } else if (key.startsWith('tse_page_configs_')) {
        const siteId = key.replace('tse_page_configs_', '')
        try { pageConfigs[siteId] = JSON.parse(localStorage.getItem(key)) } catch (e) {}
      } else if (key.startsWith('tse_page_audits_')) {
        const siteId = key.replace('tse_page_audits_', '')
        try { pageAudits[siteId] = JSON.parse(localStorage.getItem(key)) } catch (e) {}
      }
    }

    const res = await fetchJson(`${API_BASE_URL}/migrate-localstorage`, {
      method: 'POST',
      body: JSON.stringify({ sites, packages, pageConfigs, pageAudits })
    })

    return res
  } catch (e) {
    console.error('Migration failed:', e)
    return null
  }
}

export async function triggerLocalStorageMigrationApi() {
  return migrateLocalStorageApi()
}
