/**
 * Authoritative Safe String Extractor for Website Manager.
 * Safely extracts primitive string values from:
 * - primitive strings
 * - numbers / booleans
 * - WordPress REST AST objects { rendered: "...", raw: "..." }
 * - null / undefined / empty objects
 */
export function extractSafeString(val) {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (typeof val === 'object') {
    if (typeof val.rendered === 'string') return val.rendered
    if (typeof val.raw === 'string') return val.raw
    if (typeof val.name === 'string') return val.name
    if (typeof val.title === 'string') return val.title
    return ''
  }
  return String(val || '')
}

export function safeLower(val) {
  return extractSafeString(val).toLowerCase()
}

export function safeTrim(val) {
  return extractSafeString(val).trim()
}
