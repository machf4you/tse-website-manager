/**
 * Resilient package data extractor & metadata normalizer
 * Normalizes title, url, SEO Page Type classification, and applies automatic exclusion rules upon import.
 */

export function normalizeImportedPage(p, siteUrl = '') {
  if (!p || typeof p !== 'object') return p

  // 1. Meta Title / Page Title (prioritizes Meta Title from SEO plugins, exporter payload, and WP Core title)
  let title = ''
  if (typeof p.metaTitle === 'string' && p.metaTitle.trim()) {
    title = p.metaTitle.trim()
  } else if (typeof p.meta_title === 'string' && p.meta_title.trim()) {
    title = p.meta_title.trim()
  } else if (typeof p.seo_title === 'string' && p.seo_title.trim()) {
    title = p.seo_title.trim()
  } else if (typeof p.seoTitle === 'string' && p.seoTitle.trim()) {
    title = p.seoTitle.trim()
  } else if (typeof p.yoast_head_json?.title === 'string' && p.yoast_head_json.title.trim()) {
    title = p.yoast_head_json.title.trim()
  } else if (typeof p.rank_math_title === 'string' && p.rank_math_title.trim()) {
    title = p.rank_math_title.trim()
  } else if (typeof p._yoast_wpseo_title === 'string' && p._yoast_wpseo_title.trim()) {
    title = p._yoast_wpseo_title.trim()
  } else if (typeof p.title === 'object' && p.title !== null) {
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

  // 3. Automatic Exclusion Rules
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

  // 4. SEO Page Classification (Website Manager SEO Page Type)
  // Rule 1: Home page -> Always classify as Hub
  const cleanUrlPath = url.replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '')
  const cleanSiteUrl = siteUrl ? siteUrl.trim().replace(/\/+$/, '') : ''
  const isHomePage =
    p.isHome === true ||
    p.is_front_page === true ||
    cleanUrlPath === '' ||
    cleanUrlPath === '/' ||
    (cleanSiteUrl && url.replace(/\/+$/, '') === cleanSiteUrl) ||
    lowerTitle === 'home' ||
    lowerTitle === 'homepage'

  let seoPageType = 'Unclassified'
  if (isExcluded) {
    seoPageType = 'Excluded'
  } else if (isHomePage) {
    seoPageType = 'Hub'
  } else {
    seoPageType = 'Unclassified'
  }

  // Set Type column to represent Website Manager SEO Classification
  const type = seoPageType

  return {
    ...p,
    title,
    url,
    type,
    seoPageType,
    isExcluded,
    isHomePage,
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

export function extractPagesFromPackage(pkg, siteUrl = '') {
  const rawPages = extractRawPagesFromPackage(pkg)
  return rawPages.map(page => normalizeImportedPage(page, siteUrl))
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
