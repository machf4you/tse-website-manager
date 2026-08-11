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
