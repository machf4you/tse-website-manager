export function normalizeSiteId(siteOrId) {
  if (!siteOrId) return '1'
  let raw = typeof siteOrId === 'object' ? (siteOrId.id || siteOrId.siteId || '1') : siteOrId
  let str = String(raw).trim()
  if (!str || str === 'undefined' || str === 'null') return '1'
  if (/^site-\d+$/i.test(str)) {
    return str.replace(/^site-/i, '')
  }
  return str
}

export function getSiteConfigsStorageKey(siteOrId) {
  const normId = normalizeSiteId(siteOrId)
  return `tse_page_configs_${normId}`
}

export function getSiteAuditsStorageKey(siteOrId) {
  const normId = normalizeSiteId(siteOrId)
  return `tse_page_audits_${normId}`
}

export function getSitePackageStorageKey(siteOrId) {
  const normId = normalizeSiteId(siteOrId)
  return `tse_wp_package_${normId}`
}

export function getCandidatePageKeys(page, rawPage, selectedUrl) {
  const keys = new Set()
  const add = (val) => {
    if (val === undefined || val === null || val === '') return
    const s = String(val).trim()
    if (!s) return
    keys.add(s)
    const num = Number(s)
    if (!isNaN(num)) {
      keys.add(String(num))
      if (Number.isInteger(num)) {
        keys.add(`${num}.0`)
      }
    }
    if (s.startsWith('http://') || s.startsWith('https://')) {
      keys.add(s.endsWith('/') ? s.slice(0, -1) : `${s}/`)
      try {
        const parsed = new URL(s)
        if (parsed.pathname) {
          keys.add(parsed.pathname)
          keys.add(parsed.pathname.endsWith('/') ? parsed.pathname.slice(0, -1) : `${parsed.pathname}/`)
        }
      } catch (e) {}
    }
  }

  if (page) {
    add(page.url)
    add(page.id)
    add(page.pageId)
    add(page.slug)
  }
  if (rawPage) {
    add(rawPage.url)
    add(rawPage.id)
    add(rawPage.pageId)
    add(rawPage.slug)
  }
  if (selectedUrl) {
    add(selectedUrl)
  }
  return Array.from(keys)
}

export function findAuditRecordInMap(auditsMap, candidateKeys) {
  if (!auditsMap || typeof auditsMap !== 'object' || !Array.isArray(candidateKeys)) return null
  for (const k of candidateKeys) {
    if (auditsMap[k]) return auditsMap[k]
  }
  return null
}
