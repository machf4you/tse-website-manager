/**
 * Resilient package data extractor & metadata normalizer
 * Normalizes title, url, SEO Page Type classification, and applies automatic exclusion rules upon import.
 */

export function normalizeImportedPage(p, siteUrl = '') {
  if (!p || typeof p !== 'object') return p

  // 1. Meta Title / Page Title resolution
  let title = ''

  // A. Check TSE Exporter nested meta title & content h1 (TSE Exporter v2.12.9 format)
  if (typeof p.meta?.title === 'string' && p.meta.title.trim()) {
    title = p.meta.title.trim()
  } else if (Array.isArray(p.content?.h1) && typeof p.content.h1[0] === 'string' && p.content.h1[0].trim()) {
    title = p.content.h1[0].trim()
  } else if (typeof p.h1 === 'string' && p.h1.trim()) {
    title = p.h1.trim()
  }

  // B. Check explicit meta title fields
  if (!title && typeof p.metaTitle === 'string' && p.metaTitle.trim()) title = p.metaTitle.trim()
  if (!title && typeof p.meta_title === 'string' && p.meta_title.trim()) title = p.meta_title.trim()
  if (!title && typeof p.seo_title === 'string' && p.seo_title.trim()) title = p.seo_title.trim()
  if (!title && typeof p.seoTitle === 'string' && p.seoTitle.trim()) title = p.seoTitle.trim()
  if (!title && typeof p.yoast_head_json?.title === 'string' && p.yoast_head_json.title.trim()) title = p.yoast_head_json.title.trim()
  if (!title && typeof p.rank_math_title === 'string' && p.rank_math_title.trim()) title = p.rank_math_title.trim()
  if (!title && typeof p._yoast_wpseo_title === 'string' && p._yoast_wpseo_title.trim()) title = p._yoast_wpseo_title.trim()

  // C. Primary WordPress post object title field (post_title)
  if (!title && typeof p.post_title === 'string' && p.post_title.trim()) {
    title = p.post_title.trim()
  }

  // D. WP REST API title field (title.rendered or string title)
  if (!title && p.title) {
    if (typeof p.title === 'string' && p.title.trim() && p.title.trim() !== 'Untitled Page') {
      title = p.title.trim()
    } else if (typeof p.title === 'object' && p.title !== null) {
      title = (p.title.rendered || p.title.raw || '').trim()
    }
  }

  // E. Fallbacks for slug/name (convert slug to title if needed)
  if (!title && typeof p.name === 'string' && p.name.trim()) {
    title = p.name.trim()
  }
  if (!title && typeof p.post_name === 'string' && p.post_name.trim()) {
    title = p.post_name.trim()
  }
  if (!title && typeof p.slug === 'string' && p.slug.trim()) {
    const cleanSlug = p.slug.replace(/[-_]+/g, ' ').trim()
    if (cleanSlug) {
      title = cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1)
    }
  }

  title = title || 'Untitled Page'

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

  // 2. TSE Exporter v2.12.9 JSON file bundle keys (full-export.json, pages.json, content.json)
  const fullExp = pkg['full-export.json']
  if (Array.isArray(fullExp)) return fullExp
  if (Array.isArray(fullExp?.pages)) return fullExp.pages
  if (Array.isArray(fullExp?.data?.pages)) return fullExp.data.pages

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
