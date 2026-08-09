/**
 * Generates an SEO fingerprint for a page based on material SEO-impacting content.
 * 
 * Included:
 * - URL / Slug
 * - Meta Title / Proposed Title
 * - Target Phrase
 * - Meta Description / Excerpt
 * - H1 Headings
 * - H2 Headings
 * - Main Body Content length and sample text
 * - Image sources and alt text
 * 
 * Excluded:
 * - WordPress Author
 * - Modified date alone
 * - WP admin fields / comment counts
 */
export function generatePageSeoFingerprint(page) {
  if (!page) return ''

  const url = (page.url || page.link || page.pageUrl || '').trim().toLowerCase()
  const title = (page.proposedTitle || page.title || page.name || '').trim().toLowerCase()
  const targetPhrase = (page.targetPhrase || page.target || '').trim().toLowerCase()
  const metaDesc = (
    typeof page.meta_description === 'string'
      ? page.meta_description
      : (page.meta_description?.rendered || page.excerpt?.rendered || page.excerpt || '')
  ).trim().toLowerCase()

  // Extract raw content string
  const rawContent = typeof page.content === 'string'
    ? page.content
    : (page.content?.rendered || page.content?.raw || page.body_text || page.html || '')

  // Strip script/style tags and HTML tags to get clean body text
  const cleanBodyText = rawContent
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

  // Extract H1 headings
  const h1Matches = [...rawContent.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|')

  // Extract H2 headings
  const h2Matches = [...rawContent.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|')

  // Extract Image src & alt attributes
  const imgMatches = [...rawContent.matchAll(/<img[^>]*>/gi)]
    .map(m => {
      const srcMatch = m[0].match(/src=["']([^"']+)["']/i)
      const altMatch = m[0].match(/alt=["']([^"']+)["']/i)
      const src = srcMatch ? srcMatch[1].trim().toLowerCase() : ''
      const alt = altMatch ? altMatch[1].trim().toLowerCase() : ''
      return `${src}:${alt}`
    })
    .filter(s => s !== ':')
    .sort()
    .join('|')

  // Build composite SEO payload string
  const sourcePayload = [
    url,
    title,
    targetPhrase,
    metaDesc,
    h1Matches,
    h2Matches,
    imgMatches,
    cleanBodyText.length,
    cleanBodyText.slice(0, 400) + '||' + cleanBodyText.slice(-400),
  ].join(':::')

  // Compute DJB2 Hash
  let hash = 5381
  for (let i = 0; i < sourcePayload.length; i++) {
    hash = (hash * 33) ^ sourcePayload.charCodeAt(i)
  }

  return (hash >>> 0).toString(16)
}
