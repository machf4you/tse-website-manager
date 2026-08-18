/**
 * Resilient package data extractor & metadata normalizer
 * Normalizes title, url, SEO Page Type classification, and applies automatic exclusion rules upon import.
 */

export function classifyPageType(p, title, url, isExcluded, isHomePage) {
  // 1. Excluded pages -> Excluded
  if (isExcluded) return 'Excluded'

  // 2. Homepage -> Hub
  if (isHomePage) return 'Hub'

  // 3. Magento Category Rules (Authoritative Hierarchy Node)
  if (p && (p.post_type === 'category' || p.magentoCategoryId !== undefined)) {
    // Root container level <= 1 OR inactive category -> Excluded
    if ((p.level !== undefined && p.level <= 1) || p.is_active === false) {
      return 'Excluded'
    }
    // Active category level >= 2 -> Landing (Priority 2)
    if (p.level === undefined || p.level >= 2) {
      return 'Landing'
    }
  }

  // 4. Magento CMS Page Rules (Non-homepage, non-excluded -> Topical)
  if (p && p.post_type === 'cms_page') {
    return 'Topical'
  }

  // 5. WordPress Post -> Article
  if (p && (p.post_type === 'post' || p.type === 'post')) return 'Article'

  const lowerTitle = title.toLowerCase()
  const lowerUrl = url.toLowerCase()
  const cleanSlug = url.replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '').replace(/^\/+/, '').toLowerCase()

  // 3. Informational Intent Triggers (Topical Pages)
  const informationalStarters = [
    'how much', 'how to', 'do i need', 'what is', 'what are', 'can builders', 'can i', 'why ',
    'should i', 'when to', 'where to', 'is it worth', 'which one', 'best types', 'types of',
    'popular types', 'guide', 'tips', 'ideas', 'advice', 'checklist', 'faqs', 'faq',
    'everything you need to know', 'pros and cons', 'cost vs value', 'without planning permission',
    'reasons to', 'ways to', 'things to', 'what adds more value', 'ideas for'
  ]

  const isQuestionOrGuideTitle = informationalStarters.some(starter => lowerTitle.includes(starter) || lowerUrl.includes(starter))
  const isBlogPostType = p.post_type === 'post' || p.type === 'post' || lowerUrl.includes('/blog/') || lowerUrl.includes('/news/') || lowerUrl.includes('/insights/') || lowerUrl.includes('/articles/')
  const isArticleAuthority = p.authority?.strategic_type === 'article' || p.classification?.strategic_type === 'article' || p.intent === 'informational'

  let informationalScore = 0
  if (isQuestionOrGuideTitle) informationalScore += 4
  if (isBlogPostType) informationalScore += 3
  if (isArticleAuthority) informationalScore += 2

  // 4. Commercial Intent Triggers (Landing Pages)
  const commercialKeywords = [
    'loft conversion', 'loft conversions',
    'house extension', 'house extensions', 'home extension', 'home extensions',
    'garage conversion', 'garage conversions',
    'renovation', 'renovations', 'refurbishment', 'refurbishments',
    'kitchen fitting', 'kitchen fitters', 'kitchen installation',
    'bathroom installation', 'bathroom fitters', 'bathroom renovation',
    'builders', 'building services', 'architectural', 'planning support',
    'services', 'our services', 'service area', 'contractor', 'contractors',
    'carpentry', 'joinery', 'plastering', 'decorating', 'roofing', 'landscaping'
  ]

  const isServiceLandingSlug = [
    'loft-conversions', 'house-extensions', 'garage-conversions',
    'renovations-and-refurbishments', 'building-services', 'services',
    'our-services', 'architectural-planning-support', 'plastering-decorating',
    'kitchen-fitting', 'bathroom-installations', 'projects'
  ].some(slug => cleanSlug === slug || cleanSlug.endsWith('/' + slug))

  const isCommercialTitle = commercialKeywords.some(kw => lowerTitle.includes(kw) || lowerUrl.includes(kw))
  const isServiceAuthority = p.authority?.strategic_type === 'service' || p.authority?.strategic_type === 'landing' || p.post_type === 'service' || p.intent === 'commercial'

  let commercialScore = 0
  if (isServiceLandingSlug) commercialScore += 4
  if (isCommercialTitle && !isQuestionOrGuideTitle) commercialScore += 3
  if (isServiceAuthority) commercialScore += 2
  if (p.post_type === 'page' && !isQuestionOrGuideTitle && !isBlogPostType) commercialScore += 1

  // 5. Classification Decision Matrix (Strict Confidence Thresholds)
  if (informationalScore >= 3 && informationalScore > commercialScore) {
    return 'Topical'
  }
  if (commercialScore >= 2 && commercialScore > informationalScore) {
    return 'Landing'
  }

  // 6. Anything uncertain remains Unclassified
  return 'Unclassified'
}

export function normalizeImportedPage(p, siteUrl = '') {
  if (!p || typeof p !== 'object') return p

  // 1. Meta Title / Page Title resolution
  let title = ''

  // A. Check TSE Exporter nested seo.title, meta.title & content h1 (TSE Exporter v2.12.9 format)
  if (typeof p.seo?.title === 'string' && p.seo.title.trim()) {
    title = p.seo.title.trim()
  } else if (typeof p.meta?.title === 'string' && p.meta.title.trim()) {
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
  if (!title && typeof p.post_title === 'string' && p.post_title.trim() && p.post_title.trim().toLowerCase() !== 'home') {
    title = p.post_title.trim()
  }

  // D. WP REST API title field (title.rendered or string title)
  if (!title && p.title) {
    if (typeof p.title === 'string' && p.title.trim() && p.title.trim() !== 'Untitled Page' && p.title.trim().toLowerCase() !== 'home') {
      title = p.title.trim()
    } else if (typeof p.title === 'object' && p.title !== null) {
      title = (p.title.rendered || p.title.raw || '').trim()
    }
  }

  // E. Fallbacks for slug/name (convert slug to title if needed)
  if (!title && typeof p.post_title === 'string' && p.post_title.trim()) {
    title = p.post_title.trim()
  }
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
  let rawUrl = (p.link || p.url || p.guid?.rendered || (typeof p.guid === 'string' ? p.guid : '') || '').trim()
  if (rawUrl === 'https://' || rawUrl === 'http://' || rawUrl === 'https:///' || rawUrl === 'http:///') {
    rawUrl = siteUrl ? siteUrl.trim() : '/'
  }
  const url = rawUrl

  // 3. Automatic Exclusion Rules
  const lowerTitle = title.toLowerCase()
  const lowerUrl = url.toLowerCase()

  const exclusionPatterns = [
    // Legal / Policy Pages
    'privacy policy', 'privacy-policy',
    'cookie policy', 'cookie-policy',
    'terms & conditions', 'terms-and-conditions', 'terms of service', 'terms-of-service', 'terms-conditions',
    'disclaimer',
    'accessibility statement', 'accessibility',

    // Website Utility Pages
    'about us', 'about-us', 'about',
    'contact us', 'contact-us', 'contact',
    'thank you', 'thank-you', 'thankyou',
    'confirmation',
    'search results', 'search',
    '404', '404 page', 'not found',
    'login', 'wp-login',
    'register', 'signup', 'sign-up',
    'lost password', 'lost-password', 'reset-password',
    'my account', 'my-account',

    // WordPress / System Pages
    'author archive', 'author',
    'date archive', 'date',
    'tag archive', 'tag',
    'attachment', 'media attachment',
    'feed', 'rss', 'xml sitemap', 'sitemap',

    // Ecommerce / Transaction Pages
    'cart',
    'checkout',
    'basket',
    'wishlist',
    'compare',

    // Other Non-SEO Pages
    'internal search',
    'test page', 'test-page',
    'draft', 'staging', 'sample page',

    // Extended Utility / Policy & Store Information Pages
    'returns policy', 'returns-policy', 'orders & returns', 'orders-and-returns', 'orders-returns',
    'delivery information', 'delivery-information', 'delivery details', 'delivery-details',
    'payment information', 'payment-information', 'payment-options',
    'faq', 'faqs', 'f-a-q', "f.a.q's",
    'finance',
    'showroom', 'showrooms', 'store-finder', 'store-info', 'our-stores', 'store-locator',
    'price match', 'price-match',
    'pay later with klarna', 'klarna', 'pay-later',
    'partners',
    'testimonials',
    'customer service', 'customer-service',
    'enable cookies', 'enable-cookies', 'cookie-restriction-mode', 'cookie restriction',
    'further resources', 'further-resources'
  ]

  const matchesExclusion = exclusionPatterns.some(pattern => {
    return lowerTitle.includes(pattern) || lowerUrl.includes(pattern)
  })

  const isMagentoCategory = p.post_type === 'category' || p.magentoCategoryId !== undefined
  const isMagentoContainerOrInactive = isMagentoCategory && ((p.level !== undefined && p.level <= 1) || p.is_active === false)

  const isExcluded = p.isExcluded !== undefined ? Boolean(p.isExcluded) : (matchesExclusion || isMagentoContainerOrInactive)

  // 4. SEO Page Classification Rules
  const cleanUrlPath = url.replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '')
  const cleanSiteUrl = siteUrl ? siteUrl.trim().replace(/\/+$/, '') : ''
  const isHomePage =
    p.isHome === true ||
    p.is_front_page === true ||
    p.id === 'cms-home' ||
    cleanUrlPath === '' ||
    cleanUrlPath === '/' ||
    (cleanSiteUrl && url.replace(/\/+$/, '') === cleanSiteUrl) ||
    lowerTitle === 'home' ||
    lowerTitle === 'homepage'

  const seoPageType = classifyPageType(p, title, url, isExcluded, isHomePage)
  const type = seoPageType

  // 5. Priority Level Rule:
  // Hub -> Priority 1
  // Landing -> Priority 2
  // Topical -> Priority 3
  // Article -> Priority 4
  // Unclassified / Excluded -> Priority 0
  let priority = 0
  if (seoPageType === 'Hub') {
    priority = 1
  } else if (seoPageType === 'Landing') {
    priority = 2
  } else if (seoPageType === 'Topical') {
    priority = 3
  } else if (seoPageType === 'Article') {
    priority = 4
  } else {
    priority = 0
  }

  const extractContentText = (obj) => {
    if (!obj || typeof obj !== 'object') return ''
    if (typeof obj.content?.rendered === 'string' && obj.content.rendered.trim()) return obj.content.rendered.trim()
    if (typeof obj.content?.raw === 'string' && obj.content.raw.trim()) return obj.content.raw.trim()
    if (typeof obj.content === 'string' && obj.content.trim()) return obj.content.trim()
    if (typeof obj.post_content === 'string' && obj.post_content.trim()) return obj.post_content.trim()
    if (typeof obj.body_text === 'string' && obj.body_text.trim()) return obj.body_text.trim()
    if (typeof obj.html === 'string' && obj.html.trim()) return obj.html.trim()
    if (typeof obj.post_excerpt === 'string' && obj.post_excerpt.trim()) return obj.post_excerpt.trim()
    if (typeof obj.excerpt?.rendered === 'string' && obj.excerpt.rendered.trim()) return obj.excerpt.rendered.trim()
    if (typeof obj.excerpt === 'string' && obj.excerpt.trim()) return obj.excerpt.trim()
    return ''
  }

  const contentText = extractContentText(p)

  // Remove heavy WP REST AST objects (yoast_head_json, _links, acf) to ensure quota-safe localStorage persistence
  const cleanPage = { ...p }
  delete cleanPage.yoast_head_json
  delete cleanPage.yoast_head
  delete cleanPage._links
  delete cleanPage.acf
  delete cleanPage.meta
  delete cleanPage.class_list

  return {
    ...cleanPage,
    id: p.id || p.ID || url,
    title,
    url,
    link: url,
    content: contentText,
    body_text: contentText,
    type,
    seoPageType,
    priority,
    isExcluded,
    isHomePage,
  }
}

function unwrapPackageData(pkg) {
  if (!pkg || typeof pkg !== 'object') return pkg
  let current = pkg
  let depth = 0
  while (current && (current.packageData || current.package_data) && depth < 5) {
    depth++
    const raw = current.packageData || current.package_data
    if (!raw) break
    try {
      current = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch (e) {
      break
    }
  }
  return current || pkg
}

function extractRawPagesFromPackage(rawPkg) {
  const pkg = unwrapPackageData(rawPkg)
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
  const rawPosts = extractPostsFromPackage(pkg)
  const combined = [...rawPosts, ...rawPages]

  const seenUrls = new Set()
  const uniqueItems = []

  for (const item of combined) {
    const rawUrl = (item.link || item.url || item.guid?.rendered || (typeof item.guid === 'string' ? item.guid : '') || '').trim().toLowerCase()
    if (rawUrl && seenUrls.has(rawUrl)) {
      continue
    }
    if (rawUrl) {
      seenUrls.add(rawUrl)
    }
    uniqueItems.push(item)
  }

  return uniqueItems.map(page => normalizeImportedPage(page, siteUrl))
}

export function extractPostsFromPackage(rawPkg) {
  const pkg = unwrapPackageData(rawPkg)
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
