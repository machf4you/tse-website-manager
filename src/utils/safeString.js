/**
 * Authoritative Safe String Extractor & HTML Entity Decoder for Website Manager.
 * Safely extracts primitive string values from:
 * - primitive strings
 * - numbers / booleans
 * - WordPress REST AST objects { rendered: "...", raw: "..." }
 * - null / undefined / empty objects
 * Automatically decodes HTML entities (&amp;, &quot;, &#8211;, &#8217;, &#038;, etc.) into clean human-readable text.
 */

const NAMED_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#039;': "'",
  '&nbsp;': ' ',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&hellip;': '…',
  '&ndash;': '–',
  '&mdash;': '—',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&bull;': '•',
  '&pound;': '£',
  '&euro;': '€',
  '&yen;': '¥',
  '&cent;': '¢',
  '&plusmn;': '±',
  '&times;': '×',
  '&divide;': '÷',
  '&deg;': '°',
  '&frac12;': '½',
  '&frac14;': '¼',
  '&frac34;': '¾'
}

export function decodeHtmlEntities(val) {
  if (val === null || val === undefined) return ''
  let str = typeof val === 'string' ? val : String(val)
  if (!str || !str.includes('&')) return str

  // If in browser DOM environment, use textarea parser for complete spec coverage
  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea')
      textarea.innerHTML = str
      if (textarea.value) return textarea.value
    } catch {}
  }

  // Universal regex decoding for environments without DOMParser or as fallback
  let result = str
  for (const [entity, char] of Object.entries(NAMED_ENTITIES)) {
    result = result.replaceAll(entity, char)
  }

  // Decimal entities: &#(\d+);
  result = result.replace(/&#(\d+);/g, (_, dec) => {
    try {
      return String.fromCodePoint(parseInt(dec, 10))
    } catch {
      return _
    }
  })

  // Hex entities: &#x([0-9a-fA-F]+);
  result = result.replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
    try {
      return String.fromCodePoint(parseInt(hex, 16))
    } catch {
      return _
    }
  })

  return result
}

export function extractSafeString(val) {
  if (val === null || val === undefined) return ''
  let str = ''
  if (typeof val === 'string') str = val
  else if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  else if (typeof val === 'object') {
    if (typeof val.rendered === 'string') str = val.rendered
    else if (typeof val.raw === 'string') str = val.raw
    else if (typeof val.name === 'string') str = val.name
    else if (typeof val.title === 'string') str = val.title
    else str = ''
  } else {
    str = String(val || '')
  }
  return decodeHtmlEntities(str)
}

export function safeLower(val) {
  return extractSafeString(val).toLowerCase()
}

export function safeTrim(val) {
  return extractSafeString(val).trim()
}
