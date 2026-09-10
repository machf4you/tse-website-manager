/**
 * Resilient package data extractor & metadata normalizer
 * Normalizes title, url, SEO Page Type classification, and applies automatic exclusion rules upon import.
 */

export function classifyPageType(p, title, url, isExcluded, isHomePage, hierarchyContext = null) {
  // 1. Homepage -> Hub (Priority 1) - Absolute rule taking precedence sitewide over all heuristics
  if (isHomePage) return 'Hub'

  // 2. Excluded pages -> Excluded (Priority 0)
  if (isExcluded) return 'Excluded'

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

  // 5. WordPress Posts -> Article (Priority 4)
  if (p && (p.post_type === 'post' || p.type === 'post')) return 'Article'

  const lowerTitle = (title || '').toLowerCase()
  let cleanUrlPath = (url || '').replace(/^https?:\/\/[^/]+/i, '')
  if (!cleanUrlPath.startsWith('/')) cleanUrlPath = '/' + cleanUrlPath
  const [pathnameRaw] = cleanUrlPath.split('?')
  const pathname = (pathnameRaw || '/').toLowerCase()
  const cleanSlug = pathname.replace(/\/+$/, '').replace(/^\/+/, '')

  // 6. Explicit Structural Landing Page Slugs (Priority 2)
  // /services/, /locations/, /areas/, /areas-we-cover/ explicitly classify as Landing
  const structuralLandingSlugs = [
    'services', 'locations', 'areas', 'areas-we-cover',
    'our-services', 'all-services', 'service-areas', 'our-locations',
    'treatments', 'our-treatments', 'all-treatments',
    'products', 'our-products', 'categories',
    'sectors', 'industries', 'practice-areas'
  ]
  if (structuralLandingSlugs.includes(cleanSlug)) {
    return 'Landing'
  }

  // 7. Informational / Topical Indexes & Content (Priority 3)
  const genericTopicalSlugs = [
    'blog', 'news', 'insights', 'articles', 'resources', 'knowledge-base',
    'guides', 'case-studies', 'faqs', 'faq'
  ]
  if (genericTopicalSlugs.includes(cleanSlug)) {
    return 'Topical'
  }

  const isBlogPostUrl = pathname.includes('/blog/') || pathname.includes('/news/') || pathname.includes('/insights/') || pathname.includes('/articles/')
  const isArticleAuthority = p?.authority?.strategic_type === 'article' || p?.classification?.strategic_type === 'article' || p?.intent === 'informational'

  const informationalStarters = [
    'how much', 'how to', 'do i need', 'what is', 'what are', 'can builders', 'can i', 'why ',
    'should i', 'when to', 'where to', 'is it worth', 'which one', 'best types', 'types of',
    'popular types', 'guide', 'tips', 'ideas', 'advice', 'checklist', 'faqs', 'faq',
    'everything you need to know', 'pros and cons', 'cost vs value', 'without planning permission',
    'reasons to', 'ways to', 'things to', 'what adds more value', 'ideas for'
  ]
  const isQuestionOrGuideTitle = informationalStarters.some(starter => lowerTitle.includes(starter) || pathname.includes(starter))

  if (isQuestionOrGuideTitle || (isBlogPostUrl && p?.post_type !== 'page') || isArticleAuthority) {
    return 'Topical'
  }

  // 7. Standard Commercial WordPress Pages & Section Landing Pages (Priority 2)
  // Handles /services/, /locations/, /areas/, /areas-we-cover/ and all child service/location pages
  const isWpPage = !p || p.post_type === 'page' || p.type === 'page' || !p.post_type || p.post_type === 'services' || p.post_type === 'service' || p.post_type === 'projects' || p.post_type === 'project'
  if (isWpPage) {
    return 'Landing'
  }

  // 8. Anything uncertain remains Unclassified
  return 'Unclassified'
}

export function normalizeImportedPage(p, siteUrl = '', hierarchyContext = null) {
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

  // 3. Automatic Exclusion Rules (Evaluated against URL Path/Slug & Specific Title Phrases — Domain Hostname is excluded)
  let cleanUrlPath = (url || '').replace(/^https?:\/\/[^/]+/i, '')
  if (!cleanUrlPath.startsWith('/')) cleanUrlPath = '/' + cleanUrlPath
  const cleanSiteUrl = siteUrl ? siteUrl.trim().replace(/\/+$/, '') : ''

  const [pathnameRaw, searchRaw] = cleanUrlPath.split('?')
  const pathname = (pathnameRaw || '/').toLowerCase()
  const searchParams = (searchRaw ? '?' + searchRaw : '').toLowerCase()
  const cleanSlug = pathname.replace(/\/+$/, '').replace(/^\/+/, '')
  const slugSegments = cleanSlug.split('/').filter(Boolean)
  const lowerTitle = (title || '').toLowerCase().trim()

  // A. Search Results (Explicit /search/ path, ?s= search parameter, or explicit search results title)
  const isSearchResultPage =
    pathname === '/search' ||
    pathname.startsWith('/search/') ||
    cleanSlug === 'search' ||
    searchParams.includes('?s=') ||
    searchParams.includes('&s=') ||
    lowerTitle === 'search results' ||
    lowerTitle === 'search' ||
    lowerTitle.startsWith('search results') ||
    lowerTitle.startsWith('search for')

  // B. Legal & Policy Pages
  const legalSlugs = [
    'privacy-policy', 'privacy', 'cookie-policy', 'cookies',
    'terms-and-conditions', 'terms-conditions', 'terms-of-service', 'terms', 'terms-of-use',
    'disclaimer', 'accessibility-statement', 'accessibility'
  ]
  const isLegalPage =
    legalSlugs.some(s => cleanSlug === s || slugSegments.includes(s)) ||
    lowerTitle.includes('privacy policy') || lowerTitle.includes('cookie policy') ||
    lowerTitle.includes('terms & conditions') || lowerTitle.includes('terms and conditions') ||
    lowerTitle.includes('terms of service') || lowerTitle.includes('terms of use') ||
    lowerTitle.includes('accessibility statement') || lowerTitle === 'disclaimer'

  // C. Website Utility Pages (About, Contact, Thank You, Sitemap, 404)
  const utilitySlugs = [
    'about-us', 'about', 'contact-us', 'contact',
    'thank-you', 'thankyou', 'confirmation',
    '404', '404-page', 'not-found',
    'sitemap', 'xml-sitemap'
  ]
  const isUtilityPage =
    utilitySlugs.some(s => cleanSlug === s || slugSegments.includes(s)) ||
    lowerTitle === 'about us' || lowerTitle === 'about' || lowerTitle.startsWith('about us') ||
    lowerTitle === 'contact us' || lowerTitle === 'contact' || lowerTitle.startsWith('contact us') ||
    lowerTitle === 'thank you' || lowerTitle === 'confirmation' ||
    lowerTitle === 'sitemap' || lowerTitle === 'xml sitemap' ||
    lowerTitle === '404' || lowerTitle === 'page not found' || lowerTitle === 'not found'

  // D. WordPress / System Pages (Author, Date, Tag, Attachment, Feed)
  const isSystemArchivePage =
    pathname.startsWith('/tag/') || cleanSlug === 'tag' ||
    pathname.startsWith('/author/') || cleanSlug === 'author' ||
    pathname.startsWith('/date/') || /^\/\d{4}\/\d{2}(\/\d{2})?(\/|$)/.test(pathname) ||
    pathname.startsWith('/attachment/') || cleanSlug === 'attachment' ||
    pathname === '/feed' || pathname.endsWith('/feed') || pathname.endsWith('/feed/') || pathname.endsWith('.xml') || pathname.endsWith('.rss') || cleanSlug === 'feed' || cleanSlug === 'rss' ||
    lowerTitle.startsWith('author archive') || lowerTitle.startsWith('date archive') || lowerTitle.startsWith('tag archive') ||
    lowerTitle === 'author' || lowerTitle === 'tag' || lowerTitle === 'date' || lowerTitle === 'attachment' || lowerTitle.includes('media attachment')

  // E. Ecommerce / Transactional / Store Information Pages
  const ecomSlugs = [
    'cart', 'checkout', 'basket', 'wishlist', 'compare',
    'login', 'wp-login', 'register', 'signup', 'sign-up',
    'lost-password', 'reset-password', 'my-account', 'account',
    'returns-policy', 'orders-and-returns', 'orders-returns',
    'delivery-information', 'delivery-details', 'payment-information', 'payment-options',
    'store-finder', 'store-locator', 'our-stores', 'price-match',
    'pay-later', 'klarna', 'customer-service', 'enable-cookies', 'cookie-restriction-mode'
  ]
  const isEcomPage =
    ecomSlugs.some(s => cleanSlug === s || slugSegments.includes(s)) ||
    lowerTitle === 'cart' || lowerTitle === 'checkout' || lowerTitle === 'basket' || lowerTitle === 'wishlist' ||
    lowerTitle === 'my account' || lowerTitle === 'login' || lowerTitle === 'register' || lowerTitle === 'sign up' ||
    lowerTitle === 'lost password' || lowerTitle === 'reset password' ||
    lowerTitle.includes('returns policy') || lowerTitle.includes('orders & returns') ||
    lowerTitle.includes('delivery information') || lowerTitle.includes('payment information') ||
    lowerTitle === 'store finder' || lowerTitle === 'store locator' || lowerTitle === 'price match' ||
    lowerTitle.includes('enable cookies') || lowerTitle.includes('cookie restriction')

  const matchesExclusion =
    isSearchResultPage ||
    isLegalPage ||
    isUtilityPage ||
    isSystemArchivePage ||
    isEcomPage

  const isMagentoCategory = p.post_type === 'category' || p.magentoCategoryId !== undefined
  const isMagentoContainerOrInactive = isMagentoCategory && ((p.level !== undefined && p.level <= 1) || p.is_active === false)

  // 4. SEO Page Classification Rules
  const isHomePage =
    p.isHome === true ||
    p.is_front_page === true ||
    p.id === 'cms-home' ||
    cleanSlug === '' ||
    pathname === '/' ||
    (cleanSiteUrl && url.replace(/\/+$/, '') === cleanSiteUrl) ||
    lowerTitle === 'home' ||
    lowerTitle === 'homepage'

  const isExcluded = isHomePage ? false : (matchesExclusion || isMagentoContainerOrInactive)

  const seoPageType = classifyPageType(p, title, url, isExcluded, isHomePage, hierarchyContext)
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

  // 6. Meta Title Resolution
  let metaTitle = ''
  if (typeof p.metaTitle === 'string' && p.metaTitle.trim()) metaTitle = p.metaTitle.trim()
  if (!metaTitle && typeof p.meta_title === 'string' && p.meta_title.trim()) metaTitle = p.meta_title.trim()
  if (!metaTitle && typeof p.seoTitle === 'string' && p.seoTitle.trim()) metaTitle = p.seoTitle.trim()
  if (!metaTitle && typeof p.seo_title === 'string' && p.seo_title.trim()) metaTitle = p.seo_title.trim()
  if (!metaTitle && typeof p.seo?.title === 'string' && p.seo.title.trim()) metaTitle = p.seo.title.trim()
  if (!metaTitle && typeof p.yoast_wpseo_title === 'string' && p.yoast_wpseo_title.trim()) metaTitle = p.yoast_wpseo_title.trim()
  if (!metaTitle && typeof p.meta?._yoast_wpseo_title === 'string' && p.meta._yoast_wpseo_title.trim()) metaTitle = p.meta._yoast_wpseo_title.trim()
  if (!metaTitle && typeof p.meta?.yoast_wpseo_title === 'string' && p.meta.yoast_wpseo_title.trim()) metaTitle = p.meta.yoast_wpseo_title.trim()
  if (!metaTitle && typeof p._yoast_wpseo_title === 'string' && p._yoast_wpseo_title.trim()) metaTitle = p._yoast_wpseo_title.trim()
  if (!metaTitle && typeof p.yoast_head_json?.title === 'string' && p.yoast_head_json.title.trim()) metaTitle = p.yoast_head_json.title.trim()
  if (!metaTitle) metaTitle = title

  // 7. Meta Description Resolution
  let metaDescription = ''
  if (typeof p.metaDescription === 'string' && p.metaDescription.trim()) metaDescription = p.metaDescription.trim()
  if (!metaDescription && typeof p.meta_description === 'string' && p.meta_description.trim()) metaDescription = p.meta_description.trim()
  if (!metaDescription && typeof p.seoDescription === 'string' && p.seoDescription.trim()) metaDescription = p.seoDescription.trim()
  if (!metaDescription && typeof p.seo?.description === 'string' && p.seo.description.trim()) metaDescription = p.seo.description.trim()
  if (!metaDescription && typeof p.yoast_wpseo_metadesc === 'string' && p.yoast_wpseo_metadesc.trim()) metaDescription = p.yoast_wpseo_metadesc.trim()
  if (!metaDescription && typeof p.meta?._yoast_wpseo_metadesc === 'string' && p.meta._yoast_wpseo_metadesc.trim()) metaDescription = p.meta._yoast_wpseo_metadesc.trim()
  if (!metaDescription && typeof p.meta?.yoast_wpseo_metadesc === 'string' && p.meta.yoast_wpseo_metadesc.trim()) metaDescription = p.meta.yoast_wpseo_metadesc.trim()
  if (!metaDescription && typeof p._yoast_wpseo_metadesc === 'string' && p._yoast_wpseo_metadesc.trim()) metaDescription = p._yoast_wpseo_metadesc.trim()
  if (!metaDescription && typeof p.yoast_head_json?.description === 'string' && p.yoast_head_json.description.trim()) metaDescription = p.yoast_head_json.description.trim()
  if (!metaDescription && typeof p.yoast_head_json?.og_description === 'string' && p.yoast_head_json.og_description.trim()) metaDescription = p.yoast_head_json.og_description.trim()
  if (!metaDescription && typeof p.post_excerpt === 'string' && p.post_excerpt.trim()) metaDescription = p.post_excerpt.trim()
  if (!metaDescription && typeof p.excerpt?.rendered === 'string' && p.excerpt.rendered.trim()) metaDescription = p.excerpt.rendered.replace(/<[^>]+>/g, '').trim()
  if (!metaDescription && typeof p.excerpt === 'string' && p.excerpt.trim()) metaDescription = p.excerpt.replace(/<[^>]+>/g, '').trim()

  // 8. H1 Resolution (Explicit H1, inline <h1> tag, or theme post_title fallback)
  let h1 = ''
  if (typeof p.h1 === 'string' && p.h1.trim()) {
    h1 = p.h1.trim()
  } else if (Array.isArray(p.h1) && typeof p.h1[0] === 'string' && p.h1[0].trim()) {
    h1 = p.h1[0].trim()
  } else if (Array.isArray(p.content?.h1) && typeof p.content.h1[0] === 'string' && p.content.h1[0].trim()) {
    h1 = p.content.h1[0].trim()
  } else if (typeof p.content?.h1 === 'string' && p.content.h1.trim()) {
    h1 = p.content.h1.trim()
  }

  if (!h1 && contentText) {
    const inlineH1Match = contentText.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
    if (inlineH1Match && inlineH1Match[1]) {
      const cleanInlineH1 = inlineH1Match[1].replace(/<[^>]+>/g, '').trim()
      if (cleanInlineH1) h1 = cleanInlineH1
    }
  }

  if (!h1) {
    h1 = title
  }

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
    originalTitle: (typeof p.originalTitle === 'string' ? p.originalTitle : '') ||
                   (typeof p.name === 'string' ? p.name : '') ||
                   (typeof p.title === 'string' ? p.title : '') ||
                   title,
    url,
    link: url,
    metaTitle,
    metaDescription,
    h1,
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

  const parentIdsWithChildren = new Set()
  for (const item of uniqueItems) {
    const parentId = item.parent || item.post_parent || item.parentId
    if (parentId && parentId !== 0 && parentId !== '0') {
      parentIdsWithChildren.add(String(parentId))
      parentIdsWithChildren.add(Number(parentId))
    }
  }
  const hierarchyContext = { parentIdsWithChildren, allItems: uniqueItems }

  return uniqueItems.map(page => normalizeImportedPage(page, siteUrl, hierarchyContext))
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
