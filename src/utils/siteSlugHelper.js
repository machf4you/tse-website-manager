/**
 * Utility helper for converting website objects to URL slugs and resolving sites from slugs.
 */

export function getSiteSlug(site) {
  if (!site) return ''

  const siteId = String(site.id || '').toLowerCase()
  const domainId = String(site.domain_id || '').toLowerCase()
  const siteUrl = String(site.url || '').toLowerCase()
  const siteName = String(site.name || site.title || site.siteName || '').toLowerCase()

  // 1. Digital Spain explicit alias check
  if (
    siteId === 'e6a8d672-8785-4a52-b131-4122d2eeefed' ||
    domainId === '3f69330c-6360-46f7-95a0-e0b58eac0eab' ||
    siteUrl.includes('digitalspain') ||
    (siteName.includes('digital') && siteName.includes('spain'))
  ) {
    return 'digital-spain'
  }

  // 2. Kitchen explicit alias check
  if (
    siteId === 'kitchen-test-site' ||
    siteUrl.includes('iwantanewkitchen') ||
    siteName.includes('kitchen')
  ) {
    return 'i-want-a-new-kitchen'
  }

  // 3. Generic slug generation from site name or domain URL
  let sourceStr = siteName || ''
  if (!sourceStr && siteUrl) {
    sourceStr = siteUrl
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .split('.')[0]
  }

  const slug = sourceStr
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || siteId || 'website'
}

export function resolveSiteFromSlug(slug, sites) {
  if (!slug || !Array.isArray(sites) || sites.length === 0) {
    return null
  }

  const cleanSlug = String(slug).toLowerCase().trim()

  // 1. Check exact ID or domain_id match
  const exactIdMatch = sites.find(s =>
    String(s.id).toLowerCase() === cleanSlug ||
    (s.domain_id && String(s.domain_id).toLowerCase() === cleanSlug)
  )
  if (exactIdMatch) return exactIdMatch

  // 2. Check Digital Spain explicit aliases
  if (cleanSlug === 'digital-spain' || cleanSlug === 'digital-services-spain' || cleanSlug === 'digitalspain') {
    const dsMatch = sites.find(s => {
      const sId = String(s.id || '').toLowerCase()
      const dId = String(s.domain_id || '').toLowerCase()
      const sUrl = String(s.url || '').toLowerCase()
      const sName = String(s.name || '').toLowerCase()
      return (
        sId === 'e6a8d672-8785-4a52-b131-4122d2eeefed' ||
        dId === '3f69330c-6360-46f7-95a0-e0b58eac0eab' ||
        sUrl.includes('digitalspain') ||
        (sName.includes('digital') && sName.includes('spain'))
      )
    })
    if (dsMatch) return dsMatch
  }

  // 3. Check Kitchen explicit aliases
  if (cleanSlug === 'i-want-a-new-kitchen' || cleanSlug === 'kitchen' || cleanSlug === 'iwantanewkitchen') {
    const kitchenMatch = sites.find(s => {
      const sId = String(s.id || '').toLowerCase()
      const sUrl = String(s.url || '').toLowerCase()
      const sName = String(s.name || '').toLowerCase()
      return (
        sId === 'kitchen-test-site' ||
        sUrl.includes('iwantanewkitchen') ||
        sName.includes('kitchen')
      )
    })
    if (kitchenMatch) return kitchenMatch
  }

  // 4. Check getSiteSlug match
  const calculatedMatch = sites.find(s => getSiteSlug(s) === cleanSlug)
  if (calculatedMatch) return calculatedMatch

  // 5. Soft match by clean slug containment in name/url
  const textSlug = cleanSlug.replace(/-/g, ' ')
  const softMatch = sites.find(s => {
    const sName = String(s.name || '').toLowerCase()
    const sUrl = String(s.url || '').toLowerCase()
    return sName.includes(textSlug) || sUrl.includes(cleanSlug.replace(/-/g, ''))
  })
  if (softMatch) return softMatch

  return null
}
