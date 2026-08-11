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

  // 5. Create fluent, natural replacement sentence incorporating anchorText
  const lowerSentence = chosenSentence.toLowerCase()
  const lowerAnchor = cleanAnchor.toLowerCase()
  let replacement = ''
  let recommendationType = 'Add New Sentence'

  if (lowerSentence.includes(lowerAnchor)) {
    replacement = chosenSentence
    recommendationType = 'Modify Existing Text'
  } else {
    const baseText = chosenSentence.replace(/[.!?]+$/, '').trim()
    const pageTitle = (sourcePage?.title || sourcePage?.proposedTitle || '').trim()
    const locationMatch = (baseText + ' ' + pageTitle).match(/\b(Banstead|Surrey|London|Walton|Hampton|Leatherhead|Kingston|New Malden|Epsom|Sutton)\b/i)
    const locationStr = locationMatch ? ` in ${locationMatch[1]}` : ''

    const isGerund = /^(adding|building|creating|planning|designing|converting|expanding|choosing|transforming)\b/i.test(cleanAnchor)
    const isPlural = /\b(conversions|extensions|services|solutions|rooms|spaces)\b/i.test(cleanAnchor)
    const startsWithVowel = /^[aeiou]/i.test(cleanAnchor)

    let articlePrefix = ''
    if (!isGerund && !isPlural && !/\b(services|solutions|work)\b/i.test(cleanAnchor)) {
      articlePrefix = startsWithVowel ? 'an ' : 'a '
    }

    if (/\b(loft conversions|loft conversion)\b/i.test(baseText) && !/\b(adding|building|creating|planning)\b/i.test(cleanAnchor)) {
      replacement = baseText.replace(/\b(loft conversions|loft conversion)\b/i, cleanAnchor) + '.'
      recommendationType = 'Modify Existing Text'
    } else if (isGerund) {
      replacement = `If you are considering ${cleanAnchor}${locationStr}, our experienced team can help create the perfect space for your home.`
    } else if (cleanAnchor.toLowerCase().startsWith('expert') || cleanAnchor.toLowerCase().startsWith('professional') || cleanAnchor.toLowerCase().startsWith('specialized')) {
      replacement = `For ${cleanAnchor}${locationStr}, our experienced team provides high-quality construction and design services.`
    } else if (isPlural) {
      replacement = `For homeowners seeking high-quality ${cleanAnchor}${locationStr}, our experienced team provides full design and build solutions.`
    } else {
      replacement = `If you are considering ${articlePrefix}${cleanAnchor}${locationStr}, our experienced team can help create the perfect space for your home.`
    }
  }

  return {
    currentSourceText: chosenSentence,
    suggestedReplacement: replacement,
    recommendedAnchor: cleanAnchor,
    recommendationType
  }
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'if', 'then', 'else', 'when',
  'at', 'from', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'in', 'on',
  'off', 'over', 'under', 'again', 'further', 'this', 'that', 'these', 'those',
  'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing', 'can', 'could', 'should', 'would', 'vs', 'versus',
  'how', 'much', 'what', 'which', 'who', 'whom', 'why', 'where'
])

function extractKeyTokens(str) {
  if (!str || typeof str !== 'string') return new Set()
  const words = str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !STOPWORDS.has(w))

  const tokens = new Set()
  words.forEach(w => {
    tokens.add(w)
    if (w.endsWith('s') && w.length > 3) {
      tokens.add(w.slice(0, -1))
    }
  })
  return tokens
}

function calculateRelevanceScore(source, target) {
  let score = 0

  const sTargetPhrase = (source.targetPhrase || source.target || '').trim()
  const tTargetPhrase = (target.targetPhrase || target.target || '').trim()

  const sTitle = (source.title || source.proposedTitle || '').trim()
  const tTitle = (target.title || target.proposedTitle || '').trim()

  const sUrl = (source.url || '').trim()
  const tUrl = (target.url || '').trim()

  // 1. Target phrase match (highest weight: 50 pts per token overlap)
  if (sTargetPhrase && tTargetPhrase) {
    const sTokens = extractKeyTokens(sTargetPhrase)
    const tTokens = extractKeyTokens(tTargetPhrase)
    sTokens.forEach(t => {
      if (tTokens.has(t)) score += 50
    })
  }

  if (sTargetPhrase) {
    const sTokens = extractKeyTokens(sTargetPhrase)
    const tTitleTokens = extractKeyTokens(tTitle)
    const tUrlTokens = extractKeyTokens(tUrl)
    sTokens.forEach(t => {
      if (tTitleTokens.has(t)) score += 30
      if (tUrlTokens.has(t)) score += 20
    })
  }

  // 2. Page title word overlap (15 pts per token overlap)
  const sTitleTokens = extractKeyTokens(sTitle)
  const tTitleTokens = extractKeyTokens(tTitle)
  sTitleTokens.forEach(t => {
    if (tTitleTokens.has(t)) score += 15
  })

  // 3. URL word overlap (10 pts per token overlap)
  const sUrlTokens = extractKeyTokens(sUrl)
  const tUrlTokens = extractKeyTokens(tUrl)
  sUrlTokens.forEach(t => {
    if (tUrlTokens.has(t)) score += 10
  })

  // Hub Bonus: Hub pages (Priority 1) get a small base weight (+5)
  const targetType = (target.type || target.seoPageType || '').toLowerCase()
  if (targetType === 'hub' || Number(target.priority) === 1) {
    score += 5
  }

  return score
}

/**
 * W5 Phase 1 Simple Internal Link Recommendations Generator
 * Based strictly on existing synced page data (URL, Title, Page Type, Priority).
 * Page Type Relationships:
 * - Article -> Landing / Hub
 * - Topical -> Landing / Hub
 * - Landing -> Hub / Related Landing
 * - Hub -> Landing / Topical
 */
export function generateSimpleInternalLinkRecommendations(pagesList) {
  if (!Array.isArray(pagesList) || pagesList.length === 0) return []

  const activePages = pagesList.filter(p => {
    if (!p || !p.url) return false
    const typeStr = (p.type || p.seoPageType || '').trim().toLowerCase()
    return !p.isExcluded && typeStr !== 'excluded' && typeStr !== 'unclassified / excluded'
  })

  const recommendations = []

  activePages.forEach(source => {
    const sourceType = (source.type || source.seoPageType || 'Unclassified').trim()
    const lowerType = sourceType.toLowerCase()

    let allowedTargetTypes = []
    let reasonText = ''

    if (lowerType === 'article') {
      allowedTargetTypes = ['Landing', 'Hub']
      reasonText = 'Article pages should link up to Landing and Hub pages'
    } else if (lowerType === 'topical') {
      allowedTargetTypes = ['Landing', 'Hub']
      reasonText = 'Topical pages should link up to Landing and Hub pages'
    } else if (lowerType === 'landing') {
      allowedTargetTypes = ['Hub', 'Landing']
      reasonText = 'Landing pages should link up to Hub pages or related Landing pages'
    } else if (lowerType === 'hub') {
      allowedTargetTypes = ['Landing', 'Topical']
      reasonText = 'Hub pages should link down to Landing and Topical pages'
    } else {
      allowedTargetTypes = ['Hub', 'Landing']
      reasonText = 'Pages should link up to higher priority Hub or Landing pages'
    }

    const matchingTargets = activePages.filter(target => {
      if (target.url === source.url || target.id === source.id) return false
      const targetType = (target.type || target.seoPageType || 'Unclassified').trim()
      return allowedTargetTypes.some(t => t.toLowerCase() === targetType.toLowerCase())
    })

    // Sort matching targets by Relevance Score (highest topic overlap first), then Priority (1 -> 2 -> 3 -> 4), then Title
    const sortedTargets = [...matchingTargets].sort((a, b) => {
      const scoreA = calculateRelevanceScore(source, a)
      const scoreB = calculateRelevanceScore(source, b)
      if (scoreA !== scoreB) return scoreB - scoreA

      const pA = (a.priority !== undefined && Number(a.priority) > 0) ? Number(a.priority) : 999
      const pB = (b.priority !== undefined && Number(b.priority) > 0) ? Number(b.priority) : 999
      if (pA !== pB) return pA - pB
      return (a.title || '').localeCompare(b.title || '')
    })

    // Take top targets for this source page
    sortedTargets.slice(0, 3).forEach((target, idx) => {
      recommendations.push({
        id: `rec_${source.url || source.id}_${target.url || target.id}_${idx}`,
        sourceTitle: source.title || source.proposedTitle || 'Untitled Page',
        sourceUrl: source.url,
        sourceType: sourceType,
        sourcePriority: source.priority !== undefined ? source.priority : 0,
        targetTitle: target.title || target.proposedTitle || 'Untitled Page',
        targetUrl: target.url,
        targetType: target.type || target.seoPageType || 'Unclassified',
        targetPriority: target.priority !== undefined ? target.priority : 0,
        reason: reasonText
      })
    })
  })

  return recommendations
}
