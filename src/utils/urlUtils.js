/**
 * URL normalization and path slug extraction utilities
 */

export function normalizeUrlForMatching(url) {
  if (!url || typeof url !== 'string') return ''
  let norm = url.trim().toLowerCase()
  try {
    if (norm.startsWith('http://') || norm.startsWith('https://')) {
      const parsed = new URL(norm)
      norm = parsed.pathname
    }
  } catch (e) {
    // fallback string manipulation
  }
  if (!norm.startsWith('/')) norm = '/' + norm
  norm = norm.replace(/\/+$/, '')
  return norm === '' ? '/' : norm
}

export function getPathSlugForMatching(url) {
  if (!url || typeof url !== 'string') return '/'
  const norm = normalizeUrlForMatching(url)
  if (norm === '/') return '/'
  const slashIdx = norm.indexOf('/')
  if (slashIdx === -1) return '/'
  return norm.slice(slashIdx)
}
