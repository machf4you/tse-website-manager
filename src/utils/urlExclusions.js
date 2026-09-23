/**
 * Global URL Exclusion Rules Engine
 * Provides default standard rules and deterministic matching against URL path, slug, search params, and title.
 */

export const DEFAULT_EXCLUSION_RULES = [
  // ── Search Pages (4 rules) ──
  { id: 'ex-search-path', pattern: '/search', matchType: 'starts-with', category: 'Search', description: 'Search results path /search and /search/*' },
  { id: 'ex-search-slug', pattern: 'search', matchType: 'exact', category: 'Search', description: 'Search slug exact match' },
  { id: 'ex-search-param-s', pattern: '?s=', matchType: 'contains', category: 'Search', description: 'WordPress search query parameter (?s= / &s=)' },
  { id: 'ex-search-title', pattern: 'search results', matchType: 'title-match', category: 'Search', description: 'Page titles starting with Search Results or Search for' },

  // ── Legal & Policy Pages (13 rules) ──
  { id: 'ex-privacy-policy', pattern: 'privacy-policy', matchType: 'path-segment', category: 'Legal & Policy', description: 'Privacy policy slug or path segment' },
  { id: 'ex-privacy', pattern: 'privacy', matchType: 'path-segment', category: 'Legal & Policy', description: 'Privacy slug or path segment' },
  { id: 'ex-cookie-policy', pattern: 'cookie-policy', matchType: 'path-segment', category: 'Legal & Policy', description: 'Cookie policy slug or path segment' },
  { id: 'ex-cookies', pattern: 'cookies', matchType: 'path-segment', category: 'Legal & Policy', description: 'Cookies slug or path segment' },
  { id: 'ex-terms-and-conditions', pattern: 'terms-and-conditions', matchType: 'path-segment', category: 'Legal & Policy', description: 'Terms and conditions slug' },
  { id: 'ex-terms-conditions', pattern: 'terms-conditions', matchType: 'path-segment', category: 'Legal & Policy', description: 'Terms conditions slug' },
  { id: 'ex-terms-of-service', pattern: 'terms-of-service', matchType: 'path-segment', category: 'Legal & Policy', description: 'Terms of service slug' },
  { id: 'ex-terms', pattern: 'terms', matchType: 'path-segment', category: 'Legal & Policy', description: 'Terms slug or path segment' },
  { id: 'ex-terms-of-use', pattern: 'terms-of-use', matchType: 'path-segment', category: 'Legal & Policy', description: 'Terms of use slug' },
  { id: 'ex-disclaimer', pattern: 'disclaimer', matchType: 'path-segment', category: 'Legal & Policy', description: 'Disclaimer slug or path segment' },
  { id: 'ex-accessibility-statement', pattern: 'accessibility-statement', matchType: 'path-segment', category: 'Legal & Policy', description: 'Accessibility statement slug' },
  { id: 'ex-accessibility', pattern: 'accessibility', matchType: 'path-segment', category: 'Legal & Policy', description: 'Accessibility slug or path segment' },
  { id: 'ex-legal-titles', pattern: 'privacy policy|cookie policy|terms & conditions|terms and conditions|terms of service|terms of use|accessibility statement|disclaimer', matchType: 'title-match', category: 'Legal & Policy', description: 'Standard legal and policy page titles' },

  // ── Website Utility & Company Pages (12 rules) ──
  { id: 'ex-about-us', pattern: 'about-us', matchType: 'path-segment', category: 'Website Utility', description: 'About us slug or path segment' },
  { id: 'ex-about', pattern: 'about', matchType: 'path-segment', category: 'Website Utility', description: 'About slug or path segment' },
  { id: 'ex-contact-us', pattern: 'contact-us', matchType: 'path-segment', category: 'Website Utility', description: 'Contact us slug or path segment' },
  { id: 'ex-contact', pattern: 'contact', matchType: 'path-segment', category: 'Website Utility', description: 'Contact slug or path segment' },
  { id: 'ex-thank-you', pattern: 'thank-you', matchType: 'path-segment', category: 'Website Utility', description: 'Thank you slug or path segment' },
  { id: 'ex-thankyou', pattern: 'thankyou', matchType: 'path-segment', category: 'Website Utility', description: 'Thankyou slug or path segment' },
  { id: 'ex-confirmation', pattern: 'confirmation', matchType: 'path-segment', category: 'Website Utility', description: 'Confirmation slug or path segment' },
  { id: 'ex-404', pattern: '404', matchType: 'path-segment', category: 'Website Utility', description: '404 error slug' },
  { id: 'ex-404-page', pattern: '404-page', matchType: 'path-segment', category: 'Website Utility', description: '404 page slug' },
  { id: 'ex-not-found', pattern: 'not-found', matchType: 'path-segment', category: 'Website Utility', description: 'Not found slug' },
  { id: 'ex-sitemap', pattern: 'sitemap', matchType: 'path-segment', category: 'Website Utility', description: 'HTML Sitemap slug' },
  { id: 'ex-xml-sitemap', pattern: 'xml-sitemap', matchType: 'path-segment', category: 'Website Utility', description: 'XML Sitemap slug' },

  // ── WordPress / System Archives & Feeds (9 rules) ──
  { id: 'ex-tag-archive', pattern: '/tag/', matchType: 'starts-with', category: 'WordPress / System', description: 'WordPress tag archive path' },
  { id: 'ex-author-archive', pattern: '/author/', matchType: 'starts-with', category: 'WordPress / System', description: 'WordPress author archive path' },
  { id: 'ex-date-archive', pattern: '/date/', matchType: 'starts-with', category: 'WordPress / System', description: 'WordPress date archive path' },
  { id: 'ex-date-regex', pattern: '^/\\d{4}/\\d{2}(/\\d{2})?(/|$)', matchType: 'regex', category: 'WordPress / System', description: 'Year/Month date archive path regex' },
  { id: 'ex-attachment', pattern: '/attachment/', matchType: 'starts-with', category: 'WordPress / System', description: 'WordPress media attachment path' },
  { id: 'ex-feed', pattern: '/feed', matchType: 'ends-with', category: 'WordPress / System', description: 'RSS/Atom feed path /feed and */feed' },
  { id: 'ex-xml-feed', pattern: '.xml', matchType: 'ends-with', category: 'WordPress / System', description: 'XML feed files (.xml)' },
  { id: 'ex-rss-feed', pattern: '.rss', matchType: 'ends-with', category: 'WordPress / System', description: 'RSS feed files (.rss)' },
  { id: 'ex-system-titles', pattern: 'author archive|date archive|tag archive|attachment|media attachment', matchType: 'title-match', category: 'WordPress / System', description: 'WordPress archive titles' },

  // ── Ecommerce & Account Utility Pages (20 rules) ──
  { id: 'ex-cart', pattern: 'cart', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Shopping cart slug' },
  { id: 'ex-checkout', pattern: 'checkout', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Checkout slug' },
  { id: 'ex-basket', pattern: 'basket', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Basket slug' },
  { id: 'ex-wishlist', pattern: 'wishlist', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Wishlist slug' },
  { id: 'ex-compare', pattern: 'compare', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Product compare slug' },
  { id: 'ex-login', pattern: 'login', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Login slug' },
  { id: 'ex-wp-login', pattern: 'wp-login', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'WordPress login slug' },
  { id: 'ex-register', pattern: 'register', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Account registration slug' },
  { id: 'ex-signup', pattern: 'signup', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Sign up slug' },
  { id: 'ex-sign-up', pattern: 'sign-up', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Sign up slug' },
  { id: 'ex-lost-password', pattern: 'lost-password', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Lost password slug' },
  { id: 'ex-reset-password', pattern: 'reset-password', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Reset password slug' },
  { id: 'ex-my-account', pattern: 'my-account', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'My account slug' },
  { id: 'ex-account', pattern: 'account', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Account slug' },
  { id: 'ex-returns-policy', pattern: 'returns-policy', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Returns policy slug' },
  { id: 'ex-orders-returns', pattern: 'orders-and-returns', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Orders & returns slug' },
  { id: 'ex-delivery-info', pattern: 'delivery-information', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Delivery information slug' },
  { id: 'ex-payment-info', pattern: 'payment-information', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Payment information slug' },
  { id: 'ex-store-finder', pattern: 'store-finder', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Store finder slug' },
  { id: 'ex-klarna', pattern: 'klarna', matchType: 'path-segment', category: 'Ecommerce & Account', description: 'Klarna / Pay Later slug' },

  // ── Portfolio & Showcase Pages (2 rules) ──
  { id: 'ex-portfolio-slug', pattern: 'portfolio', matchType: 'path-segment', category: 'Portfolio & Showcase', description: 'Portfolio showcase path /portfolio/ or slug' },
  { id: 'ex-portfolios-slug', pattern: 'portfolios', matchType: 'path-segment', category: 'Portfolio & Showcase', description: 'Portfolios showcase path /portfolios/ or slug' },

  // ── Case Studies Pages (2 rules) ──
  { id: 'ex-case-study', pattern: 'case-study', matchType: 'path-segment', category: 'Case Studies', description: 'Case study path /case-study/ or slug' },
  { id: 'ex-case-studies', pattern: 'case-studies', matchType: 'path-segment', category: 'Case Studies', description: 'Case studies path /case-studies/ or slug' },

  // ── Marketing & Utility Exclusions (7 rules) ──
  { id: 'ex-downloads', pattern: 'downloads', matchType: 'path-segment', category: 'Marketing & Utility', description: 'Downloads path /downloads/ or slug' },
  { id: 'ex-rate-card', pattern: 'rate-card', matchType: 'slug-contains', category: 'Marketing & Utility', description: 'Rate card path or slug pattern' },
  { id: 'ex-get-a-quote', pattern: 'get-a-quote', matchType: 'slug-contains', category: 'Marketing & Utility', description: 'Get a quote path or slug pattern' },
  { id: 'ex-knowledge-hub', pattern: 'knowledge-hub', matchType: 'slug-contains', category: 'Marketing & Utility', description: 'Knowledge hub path or slug pattern' },
  { id: 'ex-newsletter', pattern: 'newsletter', matchType: 'slug-contains', category: 'Marketing & Utility', description: 'Newsletter path or slug pattern' },
  { id: 'ex-testimonials', pattern: 'testimonials', matchType: 'slug-contains', category: 'Marketing & Utility', description: 'Testimonials path or slug pattern' },
  { id: 'ex-checklist', pattern: 'checklist', matchType: 'slug-contains', category: 'Marketing & Utility', description: 'Checklist path or slug pattern' }
]

export function normalizeUrlForExclusionCheck(url = '') {
  let cleanUrlPath = String(url || '').replace(/^https?:\/\/[^/]+/i, '')
  if (!cleanUrlPath.startsWith('/')) cleanUrlPath = '/' + cleanUrlPath
  const [pathnameRaw, searchRaw] = cleanUrlPath.split('?')
  const pathname = (pathnameRaw || '/').toLowerCase()
  const searchParams = (searchRaw ? '?' + searchRaw : '').toLowerCase()
  const cleanSlug = pathname.replace(/\/+$/, '').replace(/^\/+/, '')
  const slugSegments = cleanSlug.split('/').filter(Boolean)
  return { pathname, searchParams, cleanSlug, slugSegments }
}

export function testExclusionRule(rule, urlInfo, lowerTitle = '') {
  if (!rule || !rule.pattern) return false
  const rawPattern = String(rule.pattern).trim()
  if (!rawPattern) return false

  const { pathname, searchParams, cleanSlug, slugSegments } = urlInfo
  const normPattern = rawPattern.toLowerCase().replace(/^\/+/, '').replace(/\/+$/, '')

  switch (rule.matchType) {
    case 'exact':
      return cleanSlug === normPattern || pathname === '/' + normPattern || pathname === '/' + normPattern + '/'
    case 'path-segment':
      return (
        cleanSlug === normPattern ||
        slugSegments.includes(normPattern) ||
        pathname.includes('/' + normPattern + '/') ||
        pathname.startsWith('/' + normPattern + '/') ||
        pathname.endsWith('/' + normPattern) ||
        pathname.endsWith('/' + normPattern + '/')
      )
    case 'slug-contains':
    case 'path-contains':
      return pathname.includes(normPattern) || cleanSlug.includes(normPattern)
    case 'starts-with': {
      const startsP = rawPattern.toLowerCase()
      return pathname.startsWith(startsP) || cleanSlug.startsWith(normPattern)
    }
    case 'ends-with': {
      const endsP = rawPattern.toLowerCase()
      return pathname.endsWith(endsP) || pathname.endsWith(endsP + '/') || cleanSlug.endsWith(normPattern)
    }
    case 'contains': {
      const contP = rawPattern.toLowerCase()
      return pathname.includes(contP) || searchParams.includes(contP) || cleanSlug.includes(normPattern)
    }
    case 'query-param': {
      const qp = rawPattern.toLowerCase()
      return searchParams.includes(qp)
    }
    case 'regex': {
      try {
        const re = new RegExp(rawPattern, 'i')
        return re.test(pathname) || re.test(cleanSlug)
      } catch (e) {
        return false
      }
    }
    case 'title-match': {
      const parts = rawPattern.toLowerCase().split('|').map(p => p.trim()).filter(Boolean)
      return parts.some(p => lowerTitle === p || lowerTitle.startsWith(p) || lowerTitle.includes(p))
    }
    default:
      return cleanSlug === normPattern || slugSegments.includes(normPattern) || pathname.includes('/' + normPattern + '/')
  }
}

let _cachedRules = null

export function setCachedUrlExclusions(rules) {
  if (Array.isArray(rules) && rules.length > 0) {
    _cachedRules = rules
  }
}

export function getCachedUrlExclusions() {
  return _cachedRules || DEFAULT_EXCLUSION_RULES
}

export function matchesUrlExclusion(url = '', title = '', rules = null) {
  const activeRules = Array.isArray(rules) && rules.length > 0 ? rules : (_cachedRules || DEFAULT_EXCLUSION_RULES)
  const urlInfo = normalizeUrlForExclusionCheck(url)
  const lowerTitle = String(title || '').toLowerCase().trim()

  for (const rule of activeRules) {
    if (testExclusionRule(rule, urlInfo, lowerTitle)) {
      return { matched: true, rule }
    }
  }

  return { matched: false, rule: null }
}
