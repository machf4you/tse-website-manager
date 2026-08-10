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
 * with natural, page-specific contextual anchors.
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

  return candidates.slice(0, 5).map((page, idx) => {
    const titleLower = (page.title || page.pageTitle || '').toLowerCase()
    let chosenAnchor = 'loft conversion'

    if (titleLower.includes('walton')) {
      chosenAnchor = 'adding a loft conversion'
    } else if (titleLower.includes('hampton')) {
      chosenAnchor = 'loft conversion'
    } else if (titleLower.includes('leatherhead')) {
      chosenAnchor = 'dormer & velux roof conversions'
    } else if (titleLower.includes('kingston')) {
      chosenAnchor = 'attic space'
    } else if (titleLower.includes('new malden')) {
      chosenAnchor = 'high quality loft conversions'
    } else {
      const basePhrase = targetPhrase || 'loft conversion'
      const naturalVariations = [
        basePhrase,
        `expert ${basePhrase} services`,
        `topical ${basePhrase}`,
        `professional ${basePhrase}`,
        `specialized ${basePhrase}`
      ]
      chosenAnchor = naturalVariations[idx % naturalVariations.length]
    }

    return {
      id: `rec_${page.url}_${idx}`,
      anchorText: chosenAnchor,
      suggestedSourceTitle: page.title || page.proposedTitle || 'Untitled Page',
      suggestedSourceUrl: getPathSlugForMatching(page.url) || page.url,
      sourcePageObj: page,
      suggestedSentence: null,
      targetUrl: getPathSlugForMatching(targetUrl) || targetUrl,
      reason: 'Opportunity: Contextual relevance between pages'
    }
  })
}

/**
 * Analyze a source page's actual body content and generate an independent contextual link replacement
 */
export function generateContextualReplacement(sourcePage, anchorText) {
  if (!sourcePage) {
    return { error: 'No suitable contextual placement found on this page' }
  }

  const rawContent = (
    typeof sourcePage.content?.rendered === 'string' && sourcePage.content.rendered.trim() ? sourcePage.content.rendered.trim() :
    typeof sourcePage.content?.raw === 'string' && sourcePage.content.raw.trim() ? sourcePage.content.raw.trim() :
    typeof sourcePage.content === 'string' && sourcePage.content.trim() ? sourcePage.content.trim() :
    typeof sourcePage.body_text === 'string' && sourcePage.body_text.trim() ? sourcePage.body_text.trim() :
    typeof sourcePage.crawlData?.plainText === 'string' && sourcePage.crawlData.plainText.trim() ? sourcePage.crawlData.plainText.trim() :
    typeof sourcePage.post_content === 'string' && sourcePage.post_content.trim() ? sourcePage.post_content.trim() :
    typeof sourcePage.html === 'string' && sourcePage.html.trim() ? sourcePage.html.trim() : ''
  )

  if (!rawContent) {
    return { error: 'No suitable contextual placement found on this page' }
  }

  // 1. Strip structural chrome, navigation, header, footer, CTA, phone, forms and template wrappers
  const bodyCleaned = rawContent
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
    .replace(/<div[^>]*class="[^"]*(header|nav|footer|logo|site-header|site-footer|menu|sidebar|widget|image-switcher|top-bar|topbar)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<ul[^>]*class="[^"]*(menu|nav|breadcrumbs)[^"]*"[^>]*>[\s\S]*?<\/ul>/gi, '')

  // 2. Extract block elements & sentence strings
  const blocks = bodyCleaned
    .replace(/<(p|div|section|article|li|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split(/[\r\n]+/)

  const pageTitleClean = (sourcePage.pageTitle || sourcePage.title || '').replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase()

  const sentences = []
  blocks.forEach(block => {
    const cleanBlock = block.replace(/\s+/g, ' ').trim()
    if (!cleanBlock) return
    const parts = cleanBlock.split(/(?<=[.!?])\s+/)
    parts.forEach(p => {
      const s = p.trim()
      const sClean = s.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase()
      // Skip exact title matching and short headers
      if (s.length >= 30 && s.length <= 320 && sClean !== pageTitleClean) {
        sentences.push(s)
      }
    })
  })

  // 3. Filter out actual phone numbers, repeated boilerplate CTA headers, copyright text
  const phoneBoilerplateRegex = /(\d{4,5}\s*\d{5,6}|\b(07\d{3}|01\d{3}|all rights reserved|copyright|call us any time|construction work you can count on)\b)/i

  let editorialSentences = sentences.filter(s => !phoneBoilerplateRegex.test(s))
  if (editorialSentences.length === 0) editorialSentences = sentences
  if (editorialSentences.length === 0) {
    return { error: 'No suitable contextual placement found on this page' }
  }

  // 4. Rank sentences by semantic topical relevance
  const cleanAnchor = (anchorText || '').trim()
  const anchorWords = cleanAnchor.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const topicKeywords = ['loft', 'conversion', 'conversions', 'extension', 'space', 'home', 'room', 'roof', 'renovation', 'building', 'builder', 'surrey', 'london', 'design', 'planning', 'bedroom', 'dormer', 'attic', ...anchorWords]

  let bestSentence = editorialSentences[0]
  let maxScore = -1

  editorialSentences.forEach(s => {
    const lower = s.toLowerCase()
    let score = 0
    topicKeywords.forEach(kw => {
      if (lower.includes(kw)) score += kw.length
    })
    if (score > maxScore) {
      maxScore = score
      bestSentence = s
    }
  })

  const chosenSentence = bestSentence || editorialSentences[0]

  // 5. Create natural replacement sentence incorporating anchorText
  const lowerSentence = chosenSentence.toLowerCase()
  const lowerAnchor = cleanAnchor.toLowerCase()
  let replacement = ''
  let recommendationType = 'Modify Existing Text'

  if (lowerSentence.includes(lowerAnchor)) {
    replacement = chosenSentence
    recommendationType = 'Modify Existing Text'
  } else {
    const baseText = chosenSentence.replace(/[.!?]+$/, '').trim()
    if (/\b(loft conversions|loft conversion)\b/i.test(baseText)) {
      replacement = baseText.replace(/\b(loft conversions|loft conversion)\b/i, cleanAnchor)
      recommendationType = 'Modify Existing Text'
    } else if (/\b(services|solutions|projects|work|building|home|space|choices|extensions)\b/i.test(baseText)) {
      replacement = baseText.replace(/\b(services|solutions|projects|work|building|home|space|choices|extensions)\b/i, `$1, including specialized ${cleanAnchor},`)
      recommendationType = 'Add New Sentence'
    } else {
      replacement = `${baseText}, including our dedicated ${cleanAnchor} services.`
      recommendationType = 'Add New Sentence'
    }
  }

  return {
    currentSourceText: chosenSentence,
    suggestedReplacement: replacement,
    recommendedAnchor: cleanAnchor,
    recommendationType
  }
}
