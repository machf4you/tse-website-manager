/**
 * Helper utility to extract existing incoming internal links and generate candidate recommended links
 * for W4 | Internal Linking module using pagesList and site data.
 */

import { normalizeUrlForMatching, getPathSlugForMatching } from './urlUtils'

/**
 * Extract existing incoming internal links for a target URL from pagesList
 */
export function getExistingInternalLinks(targetUrl, pagesList) {
  if (!targetUrl || !Array.isArray(pagesList)) return []

  const targetNormUrl = normalizeUrlForMatching(targetUrl)
  const targetSlug = getPathSlugForMatching(targetUrl)
  const results = []

  pagesList.forEach(page => {
    if (!page || !page.url) return
    const pageNormUrl = normalizeUrlForMatching(page.url)

    // Exclude self links
    if (targetNormUrl && pageNormUrl && targetNormUrl === pageNormUrl) return

    const rawContent = (
      typeof page.content?.rendered === 'string' ? page.content.rendered :
      typeof page.content === 'string' ? page.content :
      typeof page.body_text === 'string' ? page.body_text : ''
    )

    if (!rawContent) return

    // Strip header, nav, footer chrome
    const bodyOnly = rawContent
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<div[^>]*class="[^"]*(header|nav|footer|logo|site-header|site-footer|menu)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')

    const linkRegex = /<a\s+[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
    let match
    while ((match = linkRegex.exec(bodyOnly)) !== null) {
      const href = match[1]
      const anchorText = match[2].replace(/<[^>]+>/g, '').trim()
      const normHref = normalizeUrlForMatching(href)
      const hrefSlug = getPathSlugForMatching(href)

      const isMatch = (
        (targetNormUrl && normHref === targetNormUrl) ||
        (targetSlug && targetSlug !== '/' && hrefSlug === targetSlug)
      )

      if (isMatch) {
        // Extract surrounding context snippet (~100 chars around anchor)
        const matchIdx = match.index
        const startIdx = Math.max(0, matchIdx - 60)
        const endIdx = Math.min(bodyOnly.length, matchIdx + match[0].length + 60)
        let snippet = bodyOnly.slice(startIdx, endIdx).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

        if (startIdx > 0) snippet = '...' + snippet
        if (endIdx < bodyOnly.length) snippet = snippet + '...'

        results.push({
          id: `${page.url}_${matchIdx}`,
          sourceTitle: page.title || page.proposedTitle || 'Untitled Page',
          sourceUrl: getPathSlugForMatching(page.url) || page.url,
          anchorText: anchorText || 'Contextual Link',
          linkContext: snippet,
          destinationUrl: getPathSlugForMatching(targetUrl) || targetUrl
        })
      }
    }
  })

  return results
}

/**
 * Identify candidate source pages and generate recommended internal link opportunities
 */
export function getRecommendedInternalLinks(targetUrl, targetPhrase, pagesList, existingLinks) {
  if (!targetUrl || !Array.isArray(pagesList)) return []

  const targetNormUrl = normalizeUrlForMatching(targetUrl)
  const existingSourceNorms = new Set((existingLinks || []).map(l => normalizeUrlForMatching(l.sourceUrl)))

  const candidates = pagesList.filter(p => {
    if (!p || !p.url) return false
    const pNorm = normalizeUrlForMatching(p.url)
    if (pNorm === targetNormUrl) return false
    if (existingSourceNorms.has(pNorm)) return false
    return true
  })

  const suggestedPhrase = targetPhrase || 'local seo services'

  return candidates.slice(0, 5).map((page, idx) => {
    const variations = [
      suggestedPhrase,
      `${suggestedPhrase} solutions`,
      `best ${suggestedPhrase}`,
      `expert ${suggestedPhrase}`,
      `${suggestedPhrase} support`
    ]
    const chosenAnchor = variations[idx % variations.length]

    return {
      id: `rec_${page.url}_${idx}`,
      anchorText: chosenAnchor,
      suggestedSourceTitle: page.title || page.proposedTitle || 'Untitled Page',
      suggestedSourceUrl: getPathSlugForMatching(page.url) || page.url,
      suggestedSentence: '"AI sentence will appear here."',
      targetUrl: getPathSlugForMatching(targetUrl) || targetUrl,
      reason: 'Opportunity: Contextual relevance between pages'
    }
  })
}
