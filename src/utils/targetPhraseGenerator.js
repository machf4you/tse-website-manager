/**
 * Deterministic Target Phrase Generator for Unconfigured Pages.
 * Analyzes URL slug, H1, Meta Title, and Meta Description to propose a concise 2–5 word primary target phrase.
 * Filters out utility/policy/system pages.
 */

const UTILITY_PATTERNS = [
  /\/privacy(-policy)?/i,
  /\/terms(-and-conditions|-of-service)?/i,
  /\/cookie(-policy)?/i,
  /\/disclaimer/i,
  /\/sitemap/i,
  /\/contact(-us)?/i,
  /\/checkout/i,
  /\/cart/i,
  /\/basket/i,
  /\/my-account/i,
  /\/sample-page/i,
  /\/accessibility/i,
  /\/legal/i,
  /\/gdpr/i,
]

const UTILITY_TITLES = [
  /privacy policy/i,
  /terms & conditions/i,
  /terms and conditions/i,
  /terms of (use|service)/i,
  /cookie policy/i,
  /cookie settings/i,
  /disclaimer/i,
  /accessibility/i,
  /contact us/i,
  /checkout/i,
  /shopping cart/i,
  /my account/i,
  /site map/i,
  /404/i,
]

export function isUtilityPage(url = '', title = '') {
  if (UTILITY_PATTERNS.some(pat => pat.test(url))) return true
  if (UTILITY_TITLES.some(pat => pat.test(title))) return true
  return false
}

function cleanText(str = '', siteName = '') {
  let s = (str || '').trim()
  if (!s) return ''

  // Remove site / brand name suffixes e.g. " - Ascent Builders", " | Ascent Builders"
  if (siteName) {
    const brandRegex = new RegExp(`\\s*[-|–—:]\\s*${siteName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}.*`, 'i')
    s = s.replace(brandRegex, '')
  }
  s = s.replace(/\s*[-|–—:]\s*(Ascent Builders|HF4You|TSE|Smoking Chili Media|Civion).*$/i, '')

  // Remove common prefix fluff: "Welcome to", "The Best", "Top Rated", "Your Trusted", "Leading", "Expert"
  s = s.replace(/^(Welcome to|The Best|Top Rated|Your Trusted|Leading|Expert|About Us|Contact Us)\s+/i, '')

  // Clean trailing punctuation
  s = s.replace(/[-|–—\s:,.]+$/, '').replace(/^[-|–—\s:,.]+/, '').trim()
  return s
}

function extractSlugKeywords(url = '') {
  try {
    const parsed = new URL(url, 'https://example.com')
    const segments = parsed.pathname.split('/').filter(Boolean)
    if (segments.length === 0) return ''
    const last = segments[segments.length - 1].replace(/\.(html|php|aspx?)$/i, '')
    
    // Ignore numeric slugs or pure hashes
    if (/^\d+$/.test(last)) return ''

    // Convert hyphenated slug into title cased words
    const words = last.split(/[-_]+/).filter(w => w && !/^(the|a|an|in|on|at|for|of|and|to|with)$/i.test(w))
    if (words.length === 0) return ''

    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  } catch (e) {
    return ''
  }
}

function toTitleCase(str = '') {
  const smallWords = /^(a|an|and|as|at|but|by|for|if|in|nor|of|on|or|per|the|to|v.?|vs.?|via)$/i
  return str
    .split(/\s+/)
    .map((word, index, arr) => {
      if (index > 0 && index < arr.length - 1 && smallWords.test(word)) {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

function constrainWordCount(phrase = '', minWords = 2, maxWords = 5) {
  if (!phrase) return ''
  const words = phrase.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length <= maxWords) return phrase
  return words.slice(0, maxWords).join(' ')
}

export function generateProposedTargetPhrase(page = {}, siteName = '') {
  if (!page) return ''

  const url = page.url || ''
  const title = page.title || page.originalTitle || ''
  const h1 = page.h1 || page.actualH1 || ''
  const metaTitle = page.metaTitle || page.actualMetaTitle || ''
  const _metaDesc = page.metaDescription || page.actualMetaDescription || ''

  // 1. Exclude utility and policy pages
  if (isUtilityPage(url, title) || page.type === 'Excluded' || page.isExcluded) {
    return ''
  }

  // 2. Check if URL is root homepage
  const cleanPath = url.replace(/^https?:\/\/[^\/]+/, '').replace(/\/+$/, '')
  if (!cleanPath || cleanPath === '/' || cleanPath === '') {
    const cleanH1 = cleanText(h1, siteName)
    if (cleanH1) return toTitleCase(constrainWordCount(cleanH1, 2, 4))
    const cleanTitle = cleanText(title || metaTitle, siteName)
    if (cleanTitle) return toTitleCase(constrainWordCount(cleanTitle, 2, 4))
    return siteName ? `${siteName} Services` : 'Primary Services'
  }

  // 3. Signal A: URL Slug
  const slugWords = extractSlugKeywords(url)

  // 4. Signal B: Clean H1
  const cleanH1 = cleanText(h1, siteName)

  // 5. Signal C: Clean Page / Meta Title
  const cleanTitle = cleanText(title || metaTitle, siteName)

  // Determine best candidate:
  const slugCount = slugWords ? slugWords.split(/\s+/).length : 0
  if (slugWords && slugCount >= 2 && slugCount <= 5) {
    return toTitleCase(slugWords)
  }

  const h1Count = cleanH1 ? cleanH1.split(/\s+/).length : 0
  if (cleanH1 && h1Count >= 2 && h1Count <= 5) {
    return toTitleCase(cleanH1)
  }

  const titleCount = cleanTitle ? cleanTitle.split(/\s+/).length : 0
  if (cleanTitle && titleCount >= 2 && titleCount <= 5) {
    return toTitleCase(cleanTitle)
  }

  const candidate = slugWords || cleanH1 || cleanTitle || ''
  if (candidate) {
    return toTitleCase(constrainWordCount(candidate, 2, 5))
  }

  return ''
}
