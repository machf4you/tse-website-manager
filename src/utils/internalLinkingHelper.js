/**
 * Helper utility to extract existing incoming internal links and generate candidate recommended links
 * for W5 | Internal Linking module using pagesList and site data.
 * Reuses the exact contextual link algorithm as Page Auditor / W4.
 */

import { normalizeUrlForMatching, getPathSlugForMatching } from './urlUtils.js'

/**
 * Extract existing incoming internal links for a target URL from pagesList
 */
export function getExistingInternalLinks(targetUrl, pagesList) {
  if (!targetUrl || !Array.isArray(pagesList)) return []

  const targetNormUrl = normalizeUrlForMatching(targetUrl)
  const targetSlug = getPathSlugForMatching(targetUrl)
  const isHome = targetSlug === '/' || targetNormUrl === '/' || targetUrl === '/'
  const results = []

  pagesList.forEach(page => {
    if (!page || !page.url) return
    const pageNormUrl = normalizeUrlForMatching(page.url)

    // Exclude self-referential links on the target page itself
    if (targetNormUrl && pageNormUrl && targetNormUrl === pageNormUrl) return

    const rawContent = (
      typeof page.content?.rendered === 'string' && page.content.rendered.trim() ? page.content.rendered.trim() :
      typeof page.content?.raw === 'string' && page.content.raw.trim() ? page.content.raw.trim() :
      typeof page.content === 'string' && page.content.trim() ? page.content.trim() :
      typeof page.post_content === 'string' && page.post_content.trim() ? page.post_content.trim() :
      typeof page.body_text === 'string' && page.body_text.trim() ? page.body_text.trim() :
      typeof page.html === 'string' && page.html.trim() ? page.html.trim() : ''
    )

    if (!rawContent) return

    // Strip header, nav, footer, logo, menu, image-switcher, and structural template components
    const bodyOnly = rawContent
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<div[^>]*class="[^"]*(header|nav|footer|logo|site-header|site-footer|menu|sidebar|widget|image-switcher|switcher|slider|carousel|banner|gallery|breadcrumb)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<ul[^>]*class="[^"]*(menu|nav|breadcrumbs)[^"]*"[^>]*>[\s\S]*?<\/ul>/gi, '')

    const linkRegex = /<a\s+[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
    let match
    while ((match = linkRegex.exec(bodyOnly)) !== null) {
      const href = match[1]
      const rawAnchor = match[2]
      const cleanAnchor = rawAnchor.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

      // Exclude empty or non-content template links (e.g. image-switcher)
      if (!cleanAnchor || cleanAnchor.toLowerCase() === 'contextual link' || cleanAnchor.toLowerCase().includes('client image-switcher')) {
        continue
      }

      const normHref = normalizeUrlForMatching(href)
      const hrefSlug = getPathSlugForMatching(href)

      const isMatch = isHome ? (
        (normHref === '/' && href !== '#' && href !== '') ||
        (hrefSlug === '/' && href !== '#' && href !== '')
      ) : (
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
          anchorText: cleanAnchor,
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
      suggestedSentence: null,
      targetUrl: getPathSlugForMatching(targetUrl) || targetUrl,
      reason: 'Opportunity: Contextual relevance between pages'
    }
  })
}

/**
 * Analyze a source page's actual body content and generate a contextual link replacement
 */
export function generateContextualReplacement(sourcePage, anchorText) {
  if (!sourcePage) {
    return {
      currentSourceText: 'No source page body text available.',
      suggestedReplacement: `Contact our team to discuss how our ${anchorText} can support your needs.`
    }
  }

  const rawContent = (
    typeof sourcePage.content?.rendered === 'string' && sourcePage.content.rendered.trim() ? sourcePage.content.rendered.trim() :
    typeof sourcePage.content?.raw === 'string' && sourcePage.content.raw.trim() ? sourcePage.content.raw.trim() :
    typeof sourcePage.content === 'string' && sourcePage.content.trim() ? sourcePage.content.trim() :
    typeof sourcePage.body_text === 'string' && sourcePage.body_text.trim() ? sourcePage.body_text.trim() :
    typeof sourcePage.html === 'string' && sourcePage.html.trim() ? sourcePage.html.trim() :
    typeof sourcePage.post_excerpt === 'string' && sourcePage.post_excerpt.trim() ? sourcePage.post_excerpt.trim() : ''
  )

  const bodyOnly = rawContent
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<div[^>]*class="[^"]*(header|nav|footer|logo|site-header|site-footer|menu|sidebar|widget|image-switcher)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const sentences = bodyOnly
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 25 && s.length < 280)

  let chosenSentence = ''
  const anchorWords = (anchorText || '').toLowerCase().split(/\s+/).filter(w => w.length > 3)

  if (sentences.length > 0) {
    chosenSentence = sentences.find(s => {
      const lower = s.toLowerCase()
      return anchorWords.some(w => lower.includes(w))
    }) || sentences[Math.min(1, sentences.length - 1)] || sentences[0]
  }

  if (!chosenSentence) {
    chosenSentence = `Our team provides dedicated property and building solutions tailored to client specifications.`
  }

  // Create natural replacement sentence by integrating anchorText into chosenSentence
  let replacement = ''
  const sentenceLower = chosenSentence.toLowerCase()
  const cleanAnchor = (anchorText || '').trim()

  if (sentenceLower.includes(cleanAnchor.toLowerCase())) {
    replacement = chosenSentence
  } else if (sentenceLower.includes('services') || sentenceLower.includes('solutions') || sentenceLower.includes('projects')) {
    replacement = chosenSentence.replace(/(services|solutions|projects)/i, `$1, including ${cleanAnchor},`)
  } else if (sentenceLower.includes('our team') || sentenceLower.includes('we offer') || sentenceLower.includes('we provide') || sentenceLower.includes('we specialise') || sentenceLower.includes('we specialize')) {
    replacement = chosenSentence.replace(/\.$/, `, offering ${cleanAnchor}.`)
  } else {
    replacement = chosenSentence.replace(/\.$/, ` featuring ${cleanAnchor}.`)
  }

  return {
    currentSourceText: chosenSentence,
    suggestedReplacement: replacement
  }
}
