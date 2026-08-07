/**
 * Resilient package data extractor & metadata normalizer
 * Normalizes title, url, page type, and applies automatic exclusion rules upon import.
 */

export function normalizeImportedPage(p) {
  if (!p || typeof p !== 'object') return p

  // 1. Page Title (use actual WP title, do not display "Untitled Page" unless genuinely missing)
  let title = ''
  if (typeof p.title === 'object' && p.title !== null) {
    title = p.title.rendered || p.title.raw || ''
  } else if (typeof p.title === 'string') {
    title = p.title
  } else if (p.post_title) {
    title = p.post_title
  } else if (p.name) {
    title = p.name
  }
  title = title.trim() || 'Untitled Page'

  // 2. URL
  const url = (p.link || p.url || p.guid?.rendered || p.guid || '').trim()

  // 3. Page Type (Import WordPress object type: Page, Post, Category, Tag, Author, Archive, Custom Post Type, Attachment, Other)
  let rawType = p.type || p.post_type || p.pageType || (p.taxonomy ? p.taxonomy : 'page')
  let type = 'Page'
  if (rawType) {
    const lType = String(rawType).toLowerCase()
    if (lType === 'page') type = 'Page'
    else if (lType === 'post') type = 'Post'
    else if (lType === 'category') type = 'Category'
    else if (lType === 'tag' || lType === 'post_tag') type = 'Tag'
    else if (lType === 'author') type = 'Author'
    else if (lType === 'archive') type = 'Archive'
    else if (lType === 'attachment') type = 'Attachment'
    else if (lType === 'nav_menu_item') type = 'Other'
    else type = lType.charAt(0).toUpperCase() + lType.slice(1)
  }

  // 4. Automatic Exclusion Rules
  const lowerTitle = title.toLowerCase()
  const lowerUrl = url.toLowerCase()

  const exclusionPatterns = [
    'privacy policy', 'privacy-policy',
    'cookie policy', 'cookie-policy',
    'terms & conditions', 'terms-and-conditions', 'terms of service', 'terms-of-service', 'terms-conditions',
    'accessibility',
    'sitemap',
    'feed', 'rss', 'xml',
    'search',
    'author',
    'archive',
    'attachment',
    '404',
    'thank you', 'thank-you', 'thankyou',
    'cart',
    'checkout',
    'my account', 'my-account', 'account',
    'login', 'wp-login',
    'register', 'signup',
    'lost password', 'lost-password', 'reset-password'
  ]

  const matchesExclusion = exclusionPatterns.some(pattern => {
    return lowerTitle.includes(pattern) || lowerUrl.includes(pattern)
  })

  const isExcluded = p.isExcluded !== undefined ? Boolean(p.isExcluded) : matchesExclusion

  return {
    ...p,
    title,
    url,
    type,
    isExcluded,
  }
}

function extractRawPagesFromPackage(pkg) {
  if (!pkg || typeof pkg !== 'object') return []

  // 1. Direct array properties
  if (Array.isArray(pkg.pages)) return pkg.pages
  if (Array.isArray(pkg.data?.pages)) return pkg.data.pages
  if (Array.isArray(pkg.packageData?.pages)) return pkg.packageData.pages
  if (Array.isArray(pkg.content?.pages)) return pkg.content.pages

  // 2. TSE Exporter v2.12.9 JSON file bundle keys (e.g. "pages.json", "content.json")
  const pJson = pkg['pages.json']
  if (Array.isArray(pJson)) return pJson
  if (Array.isArray(pJson?.pages)) return pJson.pages
  if (Array.isArray(pJson?.data)) return pJson.data

  const cJson = pkg['content.json']
  if (Array.isArray(cJson?.pages)) return cJson.pages

  // 3. Direct array fallbacks
  if (Array.isArray(pkg.data)) return pkg.data
  if (Array.isArray(pkg.content)) return pkg.content

  // 4. Deep inspection of root keys for page array objects
  for (const key of Object.keys(pkg)) {
    const val = pkg[key]
    if (Array.isArray(val) && val.length > 0) {
      const first = val[0]
      if (first && (first.post_type === 'page' || first.ID || first.id || first.title || first.slug || first.url || first.guid)) {
        return val
      }
    }
    if (val && typeof val === 'object' && Array.isArray(val.pages)) {
      return val.pages
    }
  }

  return []
}

export function extractPagesFromPackage(pkg) {
  const rawPages = extractRawPagesFromPackage(pkg)
  return rawPages.map(normalizeImportedPage)
}

export function extractPostsFromPackage(pkg) {
  if (!pkg || typeof pkg !== 'object') return []

  if (Array.isArray(pkg.posts)) return pkg.posts
  if (Array.isArray(pkg.data?.posts)) return pkg.data.posts
  if (Array.isArray(pkg.packageData?.posts)) return pkg.packageData.posts
  if (Array.isArray(pkg.content?.posts)) return pkg.content.posts

  const pJson = pkg['posts.json']
  if (Array.isArray(pJson)) return pJson
  if (Array.isArray(pJson?.posts)) return pJson.posts

  return []
}
