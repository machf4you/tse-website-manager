/**
 * Website Manager SQLite Backend Persistence API Client
 * Replaces pure localStorage operations with persistent REST API calls to Website Manager server.
 */

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
    return await fetchJson(`${API_BASE_URL}/websites`)
  } catch (e) {
    // Fallback to localStorage if server is offline during transition
    const raw = localStorage.getItem('tse_website_dashboard_sites')
    return raw ? JSON.parse(raw) : []
  }
}

export async function saveWebsiteApi(siteRecord) {
  // Save to SQLite API
  try {
    await fetchJson(`${API_BASE_URL}/websites`, {
      method: 'POST',
      body: JSON.stringify(siteRecord)
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
      list[idx] = { ...list[idx], ...siteRecord }
    } else {
      list.push(siteRecord)
    }
    localStorage.setItem('tse_website_dashboard_sites', JSON.stringify(list))
  } catch (err) {}
}

export async function saveWebsitesBatchApi(sitesList) {
  try {
    await fetchJson(`${API_BASE_URL}/websites/batch`, {
      method: 'POST',
      body: JSON.stringify(sitesList)
    })
  } catch (e) {}
  try {
    localStorage.setItem('tse_website_dashboard_sites', JSON.stringify(sitesList))
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
export async function getPageConfigsApi(siteId) {
  try {
    return await fetchJson(`${API_BASE_URL}/websites/${siteId}/page-configs`)
  } catch (e) {
    const raw = localStorage.getItem(`tse_page_configs_${siteId}`)
    return raw ? JSON.parse(raw) : {}
  }
}

export async function savePageConfigsApi(siteId, configsMap) {
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
export async function getPageAuditsApi(siteId) {
  try {
    return await fetchJson(`${API_BASE_URL}/websites/${siteId}/audits`)
  } catch (e) {
    const raw = localStorage.getItem(`tse_page_audits_${siteId}`)
    return raw ? JSON.parse(raw) : {}
  }
}

export async function savePageAuditApi(siteId, pageKey, auditRecord) {
  try {
    await fetchJson(`${API_BASE_URL}/websites/${siteId}/audits`, {
      method: 'POST',
      body: JSON.stringify({ pageKey, auditRecord })
    })
  } catch (e) {}
  try {
    const raw = localStorage.getItem(`tse_page_audits_${siteId}`)
    const audits = raw ? JSON.parse(raw) : {}
    audits[pageKey] = auditRecord
    localStorage.setItem(`tse_page_audits_${siteId}`, JSON.stringify(audits))
  } catch (err) {}
}

export async function savePageAuditsBatchApi(siteId, auditsMap) {
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

// 5. ONE-TIME MIGRATION UTILITY FROM LOCALSTORAGE
export async function triggerLocalStorageMigrationApi() {
  try {
    const rawSites = localStorage.getItem('tse_website_dashboard_sites')
    const sites = rawSites ? JSON.parse(rawSites) : []

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

    if (sites.length === 0 && Object.keys(packages).length === 0 && Object.keys(pageConfigs).length === 0) {
      return { migrated: { sites: 0, packages: 0, configs: 0, audits: 0 } }
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
