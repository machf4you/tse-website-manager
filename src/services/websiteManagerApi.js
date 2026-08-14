/**
 * Website Manager SQLite Backend Persistence API Client
 * Replaces pure localStorage operations with persistent REST API calls to Website Manager server.
 */

import { normalizeSiteId } from '../utils/siteKeyHelper.js'

const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.VITE_WEBSITE_MANAGER_API_URL)
  ? process.env.VITE_WEBSITE_MANAGER_API_URL
  : ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WEBSITE_MANAGER_API_URL)
      ? import.meta.env.VITE_WEBSITE_MANAGER_API_URL
      : 'http://localhost:3001/api')

async function fetchJson(url, options = {}, timeoutMs = 2500) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`API error (${res.status}): ${errText}`)
    }
    return await res.json()
  } catch (e) {
    clearTimeout(timeoutId)
    console.error(`[WM_API_ERROR] ${url}:`, e.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : e)
    throw e
  }
}

// 1. CONNECTED WEBSITES
export async function getWebsitesApi() {
  try {
    const list = await fetchJson(`${API_BASE_URL}/websites`)
    if (Array.isArray(list)) {
      return list.map(s => {
        let cfg = s.configData
        if (!cfg && s.config_data && typeof s.config_data === 'string') {
          try { cfg = JSON.parse(s.config_data) } catch (e) {}
        }
        cfg = cfg || {}
        return {
          ...s,
          configData: cfg,
          wpUser: s.wpUser || cfg.wpUser || s.connectedUser || cfg.connectedUser || '',
          wpPass: s.wpPass || cfg.wpPass || ''
        }
      })
    }
    return []
  } catch (e) {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem('tse_website_dashboard_sites') : null
    return raw ? JSON.parse(raw) : []
  }
}

export async function saveWebsiteApi(siteRecord) {
  if (!siteRecord || siteRecord.id === undefined) return
  const statusVal = typeof siteRecord.status === 'object' ? JSON.stringify(siteRecord.status) : siteRecord.status
  const configData = {
    ...(siteRecord.configData || {}),
    wpUser: siteRecord.wpUser || siteRecord.connectedUser || siteRecord.configData?.wpUser || '',
    wpPass: siteRecord.wpPass || siteRecord.configData?.wpPass || ''
  }

  const payload = {
    ...siteRecord,
    id: String(siteRecord.id),
    status: statusVal,
    configData
  }

  try {
    await fetchJson(`${API_BASE_URL}/websites`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  } catch (e) {
    console.warn('Backend API save failed:', e)
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('tse_website_dashboard_sites')
      let list = raw ? JSON.parse(raw) : []
      const idx = list.findIndex(s => String(s.id) === String(siteRecord.id))
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...payload }
      } else {
        list.push(payload)
      }
      localStorage.setItem('tse_website_dashboard_sites', JSON.stringify(list))
    }
  } catch (err) {}
}

export async function saveWebsitesBatchApi(sitesList) {
  if (!Array.isArray(sitesList) || sitesList.length === 0) return
  const sanitizedList = sitesList.map(s => {
    const statusVal = typeof s.status === 'object' ? JSON.stringify(s.status) : s.status
    const configData = {
      ...(s.configData || {}),
      wpUser: s.wpUser || s.connectedUser || s.configData?.wpUser || '',
      wpPass: s.wpPass || s.configData?.wpPass || ''
    }
    return {
      ...s,
      id: String(s.id),
      status: statusVal,
      configData
    }
  })

  try {
    await fetchJson(`${API_BASE_URL}/websites/batch`, {
      method: 'POST',
      body: JSON.stringify(sanitizedList)
    })
  } catch (e) {}
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tse_website_dashboard_sites', JSON.stringify(sanitizedList))
    }
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
    return res || null
  } catch (e) {
    const raw = localStorage.getItem(`tse_wp_package_${siteId}`)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      const cleanData = (parsed && parsed.packageData && (Array.isArray(parsed.packageData.pages) || Array.isArray(parsed.packageData.posts)))
        ? parsed.packageData
        : (parsed.pages || parsed.posts ? parsed : (parsed.packageData || parsed))

      return {
        siteId,
        isSynchronised: true,
        lastSyncTimestamp: parsed?.lastSyncTimestamp || null,
        packageData: cleanData
      }
    } catch (err) {
      return null
    }
  }
}

export async function saveWpPackageApi(siteId, packageData) {
  const cleanPackageData = (packageData && packageData.packageData && (Array.isArray(packageData.packageData.pages) || Array.isArray(packageData.packageData.posts)))
    ? packageData.packageData
    : (packageData.pages || packageData.posts ? packageData : (packageData.packageData || packageData))

  try {
    await fetchJson(`${API_BASE_URL}/websites/${siteId}/package`, {
      method: 'POST',
      body: JSON.stringify(cleanPackageData)
    })
  } catch (e) {}
  try {
    localStorage.setItem(`tse_wp_package_${siteId}`, JSON.stringify(cleanPackageData))
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
