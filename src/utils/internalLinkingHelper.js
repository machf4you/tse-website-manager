/**
 * Helper utility to extract existing incoming internal links and generate candidate recommended links
 * for W5 | Internal Linking module using pagesList and site data.
 * Reuses the exact contextual link algorithm as Page Auditor / W4.
 */

import { normalizeUrlForMatching, getPathSlugForMatching } from './urlUtils.js'

/**
 * Extract existing incoming internal links for a target URL from pagesList
 */
/**
 * Helper to strip non-editorial structural chrome, navigation, headers, footers, sidebars,
 * and navigation widgets without stripping genuine Elementor editorial blocks (e.g. elementor-widget).
 */
export function cleanEditorialHtml(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return ''
  return rawContent
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    // Exclude structural template wrappers, sidebars, navigation menus, and non-editorial widgets
    .replace(/<div[^>]*class="[^"]*(site-header|site-footer|main-navigation|nav-menu|elementor-nav-menu|sidebar|sidebar-widget|widget_nav_menu|widget_meta|widget_search|widget_categories|widget_archive|widget_recent_entries|widget_recent_comments|image-switcher|breadcrumb|breadcrumbs)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<ul[^>]*class="[^"]*(menu|nav|breadcrumbs)[^"]*"[^>]*>[\s\S]*?<\/ul>/gi, '')
}

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
    const pageSlug = getPathSlugForMatching(page.url)

    // Exclude self-referential links on the target page itself
    if (
      (targetNormUrl && pageNormUrl && targetNormUrl === pageNormUrl) ||
      (targetSlug && pageSlug && targetSlug === pageSlug) ||
      (targetUrl && page.url && targetUrl === page.url)
    ) {
      return
    }

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
    const bodyOnly = cleanEditorialHtml(rawContent)

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
 * Extract outgoing contextual internal links originating from sourcePage pointing to other internal pages
 */
export function getOutgoingInternalLinks(sourcePage, pagesList) {
  if (!sourcePage) return []

  const rawContent = (
    typeof sourcePage.content?.rendered === 'string' && sourcePage.content.rendered.trim() ? sourcePage.content.rendered.trim() :
    typeof sourcePage.content?.raw === 'string' && sourcePage.content.raw.trim() ? sourcePage.content.raw.trim() :
    typeof sourcePage.content === 'string' && sourcePage.content.trim() ? sourcePage.content.trim() :
    typeof sourcePage.post_content === 'string' && sourcePage.post_content.trim() ? sourcePage.post_content.trim() :
    typeof sourcePage.body_text === 'string' && sourcePage.body_text.trim() ? sourcePage.body_text.trim() :
    typeof sourcePage.html === 'string' && sourcePage.html.trim() ? sourcePage.html.trim() : ''
  )

  if (!rawContent) return []

  // Strip header, nav, footer, logo, menu, image-switcher, and structural template components
  const bodyOnly = cleanEditorialHtml(rawContent)

  const sourceNormUrl = normalizeUrlForMatching(sourcePage.url)
  const linkRegex = /<a\s+[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
  const results = []
  let match

  while ((match = linkRegex.exec(bodyOnly)) !== null) {
    const href = match[1]
    const rawAnchor = match[2]
    const cleanAnchor = rawAnchor.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

    // Exclude empty or non-content template links
    if (!cleanAnchor || cleanAnchor.toLowerCase() === 'contextual link' || cleanAnchor.toLowerCase().includes('client image-switcher')) {
      continue
    }
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      continue
    }

    const normHref = normalizeUrlForMatching(href)
    const hrefSlug = getPathSlugForMatching(href)
    const sourceSlug = getPathSlugForMatching(sourcePage.url)

    // Exclude self-referential links (both normalized and slug forms)
    if (
      (sourceNormUrl && normHref && sourceNormUrl === normHref) ||
      (sourceSlug && hrefSlug && sourceSlug === hrefSlug) ||
      (sourcePage.url && href && sourcePage.url === href)
    ) {
      continue
    }

    // Check if destination matches any internal page in pagesList
    const destPage = Array.isArray(pagesList) ? pagesList.find(p => {
      const pNorm = normalizeUrlForMatching(p.url)
      return pNorm && pNorm === normHref
    }) : null

    let isInternal = Boolean(destPage) || href.startsWith('/')
    if (!isInternal && sourcePage.url) {
      try {
        const u = sourcePage.url.startsWith('http') ? new URL(sourcePage.url) : new URL(sourcePage.url, 'https://example.com')
        if (href.includes(u.hostname)) isInternal = true
      } catch (e) {}
    }

    if (isInternal) {
      const matchIdx = match.index
      const startIdx = Math.max(0, matchIdx - 60)
      const endIdx = Math.min(bodyOnly.length, matchIdx + match[0].length + 60)
      let snippet = bodyOnly.slice(startIdx, endIdx).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (startIdx > 0) snippet = '...' + snippet
      if (endIdx < bodyOnly.length) snippet = snippet + '...'

      results.push({
        id: `out_${sourcePage.url}_${matchIdx}`,
        sourceUrl: getPathSlugForMatching(sourcePage.url) || sourcePage.url,
        destinationUrl: getPathSlugForMatching(href) || href,
        destinationTitle: destPage?.title || destPage?.proposedTitle || '',
        anchorText: cleanAnchor,
        linkContext: snippet
      })
    }
  }

  return results
}

/**
 * Dynamically extract natural anchor text variations taking into account
 * the target page's core entity, location, niche, and the source page context.
 */
export function generateNaturalAnchors(targetPage, sourcePage, index = 0) {
  const targetTitle = (targetPage?.title || targetPage?.proposedTitle || targetPage?.pageTitle || '').trim()
  const targetPhrase = (targetPage?.targetPhrase || targetPage?.target || '').trim()
  const targetSlug = getPathSlugForMatching(targetPage?.url || '') || ''

  // 1. Extract location dynamically
  let location = ''
  const locMatch = (targetSlug + ' ' + targetTitle + ' ' + targetPhrase).match(/\b(Bournemouth|Oxford|London|Exeter|Reading|Surrey|Banstead|Manchester|Birmingham|Leeds|Bristol|Southampton|Dorset|Reading|Epsom|Sutton)\b/i)
  if (locMatch) {
    location = locMatch[1].charAt(0).toUpperCase() + locMatch[1].slice(1).toLowerCase()
  }

  // 2. Extract niche / industry dynamically
  let niche = ''
  const nicheMatch = (targetTitle + ' ' + targetSlug + ' ' + targetPhrase).match(/\b(clinic|dentist|builder|law\s*firm|lawyer|solicitor|ecommerce|shopify|trades|healthcare|medical)\b/i)
  if (nicheMatch) {
    const rawNiche = nicheMatch[1].toLowerCase()
    if (rawNiche.includes('clinic')) niche = 'healthcare clinics'
    else if (rawNiche.includes('dentist')) niche = 'dental practices'
    else if (rawNiche.includes('builder')) niche = 'builders and contractors'
    else if (rawNiche.includes('law') || rawNiche.includes('solicitor')) niche = 'law firms'
    else if (rawNiche.includes('ecommerce') || rawNiche.includes('shopify')) niche = 'ecommerce stores'
    else niche = rawNiche
  }

  // 3. Extract core service
  let coreService = 'SEO'
  if (/local\s*seo/i.test(targetSlug + ' ' + targetTitle + ' ' + targetPhrase)) {
    coreService = 'local SEO'
  } else if (/google\s*business|gbp|maps/i.test(targetSlug + ' ' + targetTitle + ' ' + targetPhrase)) {
    coreService = 'Google Business Profile'
  } else if (/technical\s*seo/i.test(targetSlug + ' ' + targetTitle + ' ' + targetPhrase)) {
    coreService = 'technical SEO'
  } else if (/audit/i.test(targetSlug + ' ' + targetTitle + ' ' + targetPhrase)) {
    coreService = 'SEO audit'
  } else if (/web\s*design/i.test(targetSlug + ' ' + targetTitle + ' ' + targetPhrase)) {
    coreService = 'web design'
  } else if (/ai\s*growth|ai/i.test(targetSlug + ' ' + targetTitle + ' ' + targetPhrase)) {
    coreService = 'AI growth strategy'
  }

  const variations = []

  if (location) {
    // Location-based service page (e.g. SEO Bournemouth, SEO Oxford)
    variations.push(
      `SEO ${location}`,
      `SEO services in ${location}`,
      `${location} SEO services`,
      `local SEO support in ${location}`,
      `SEO specialists serving ${location}`,
      `local search optimisation in ${location}`,
      `targeted ${location} SEO campaigns`,
      `SEO consultants in ${location}`
    )
  } else if (niche) {
    // Industry/Niche service page (e.g. Clinic SEO, Dentist SEO)
    const singularWord = niche.split(' ')[0]
    const capSingular = singularWord.charAt(0).toUpperCase() + singularWord.slice(1)
    variations.push(
      `${capSingular} SEO`,
      `SEO services for ${niche}`,
      `${singularWord} search engine optimisation`,
      `specialist ${singularWord} SEO`,
      `local search visibility for ${niche}`,
      `tailored ${singularWord} SEO strategy`,
      `search marketing for ${niche}`
    )
  } else if (/google\s*business|gbp/i.test(coreService)) {
    variations.push(
      'Google Business Profile SEO',
      'Google Business Profile optimisation',
      'local Google Business Profile strategy',
      'optimising your Google Business Profile',
      'GBP management and local map rankings'
    )
  } else if (targetPhrase && targetPhrase.length > 2 && targetPhrase.toLowerCase() !== 'loft conversion') {
    const base = targetPhrase.trim()
    const cleanBase = base.replace(/^(the|a|an)\s+/i, '')
    variations.push(
      cleanBase,
      `${cleanBase} services`,
      `tailored ${cleanBase}`,
      `effective ${cleanBase} strategy`,
      `improving your ${cleanBase.toLowerCase()}`
    )
  } else if (targetTitle) {
    const cleanTitle = targetTitle.replace(/[-|:].*$/, '').trim()
    variations.push(
      cleanTitle,
      `${cleanTitle.toLowerCase()} services`,
      `tailored ${cleanTitle.toLowerCase()}`,
      `specialist ${cleanTitle.toLowerCase()} solutions`
    )
  } else {
    variations.push(
      'SEO services',
      'local search engine optimisation',
      'targeted organic SEO',
      'SEO consultancy'
    )
  }

  const unique = Array.from(new Set(variations.filter(Boolean)))
  return unique[index % unique.length] || unique[0] || 'SEO services'
}

/**
 * Identify candidate source pages and generate recommended internal link opportunities
 * with natural, page-specific contextual anchors.
 */
export function getRecommendedInternalLinks(targetUrl, targetPhrase, pagesList, existingLinks) {
  if (!targetUrl || !Array.isArray(pagesList)) return []

  const targetNormUrl = normalizeUrlForMatching(targetUrl)
  const targetSlug = getPathSlugForMatching(targetUrl)
  const existingSourceNorms = new Set((existingLinks || []).map(l => normalizeUrlForMatching(l.sourceUrl)))
  const existingSourceSlugs = new Set((existingLinks || []).map(l => getPathSlugForMatching(l.sourceUrl)))

  const targetPage = pagesList.find(p => {
    const pNorm = normalizeUrlForMatching(p.url)
    const pSlug = getPathSlugForMatching(p.url)
    return (pNorm && pNorm === targetNormUrl) || (pSlug && pSlug === targetSlug)
  }) || { url: targetUrl, targetPhrase, title: targetPhrase || 'Target Page' }

  const candidates = pagesList.filter(p => {
    if (!p || !p.url) return false
    const pNorm = normalizeUrlForMatching(p.url)
    const pSlug = getPathSlugForMatching(p.url)
    if (pNorm === targetNormUrl || pSlug === targetSlug || p.url === targetUrl) return false
    if (existingSourceNorms.has(pNorm) || existingSourceSlugs.has(pSlug)) return false
    return !p.isExcluded
  })

  // Sort candidates by relevance score relative to targetPage
  const sortedCandidates = [...candidates].sort((a, b) => {
    const scoreB = calculateRelevanceScore(b, targetPage)
    const scoreA = calculateRelevanceScore(a, targetPage)
    if (scoreB !== scoreA) return scoreB - scoreA
    return (a.title || '').localeCompare(b.title || '')
  })

  const recs = sortedCandidates.slice(0, 5).map((page, idx) => {
    const chosenAnchor = generateNaturalAnchors(targetPage, page, idx)

    return {
      id: `rec_${page.url}_${idx}`,
      anchorText: chosenAnchor,
      suggestedSourceTitle: page.title || page.proposedTitle || 'Untitled Page',
      suggestedSourceUrl: getPathSlugForMatching(page.url) || page.url,
      sourcePageObj: page,
      targetPageObj: targetPage,
      suggestedSentence: null,
      targetTitle: targetPage.title || targetPage.proposedTitle || 'Target Page',
      targetUrl: getPathSlugForMatching(targetUrl) || targetUrl,
      reason: 'Opportunity: Contextual relevance between pages'
    }
  })

  recs.totalEligibleCount = sortedCandidates.length
  return recs
}

/**
 * Analyze source page and target page context to generate an editorial, grammatically sound sentence
 */
export function generateContextualReplacement(sourceInput, anchorTextInput, targetInput) {
  let sourcePage = null
  let targetPage = null
  let anchorText = ''

  if (sourceInput && typeof sourceInput === 'object' && !sourceInput.url && sourceInput.sourcePage) {
    sourcePage = sourceInput.sourcePage
    targetPage = sourceInput.targetPage
    anchorText = sourceInput.anchorText || ''
  } else {
    sourcePage = sourceInput
    anchorText = anchorTextInput || ''
    targetPage = targetInput || null
  }

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

  const cleanAnchor = (anchorText || '').trim()

  // 1. Extract real body sentences from source page for candidate contextual placement
  const bodyCleaned = cleanEditorialHtml(rawContent)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')

  const blocks = bodyCleaned
    .replace(/<(p|div|section|article|li|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split(/[\r\n]+/)

  const sentences = []
  blocks.forEach(block => {
    const cleanBlock = block.replace(/\s+/g, ' ').trim()
    if (!cleanBlock) return
    const parts = cleanBlock.split(/(?<=[.!?])\s+/)
    parts.forEach(p => {
      const s = p.trim()
      if (s.length >= 35 && s.length <= 300 && !/all rights reserved|copyright|tel:|mailto:/i.test(s)) {
        sentences.push(s)
      }
    })
  })

  // 2. Determine source page topic and audience
  const sTitle = (sourcePage?.title || sourcePage?.proposedTitle || sourcePage?.pageTitle || '').replace(/[-|:].*$/, '').trim()
  const sSlug = getPathSlugForMatching(sourcePage?.url || '') || ''
  const tTitle = (targetPage?.title || targetPage?.proposedTitle || targetPage?.pageTitle || '').replace(/[-|:].*$/, '').trim()
  const tSlug = getPathSlugForMatching(targetPage?.url || '') || ''

  let sAudience = 'businesses and organisations'
  if (/clinic/i.test(sTitle + sSlug)) sAudience = 'healthcare clinics and medical practices'
  else if (/dentist/i.test(sTitle + sSlug)) sAudience = 'dental practices and specialists'
  else if (/builder/i.test(sTitle + sSlug)) sAudience = 'builders and construction contractors'
  else if (/law\s*firm|lawyer|solicitor/i.test(sTitle + sSlug)) sAudience = 'law firms and legal practices'
  else if (/shopify|ecommerce/i.test(sTitle + sSlug)) sAudience = 'ecommerce brands and online retailers'
  else if (/audit/i.test(sTitle + sSlug)) sAudience = 'companies auditing their search performance'
  else if (/pricing|cost/i.test(sTitle + sSlug)) sAudience = 'businesses evaluating their marketing budget'
  else if (/local\s*seo/i.test(sTitle + sSlug)) sAudience = 'companies targeting local search visibility'

  // 3. Extract target location / core focus
  const locMatch = (tSlug + ' ' + tTitle + ' ' + cleanAnchor).match(/\b(Bournemouth|Oxford|London|Exeter|Reading|Surrey|Banstead|Manchester|Birmingham|Leeds|Bristol|Southampton|Dorset)\b/i)
  const location = locMatch ? (locMatch[1].charAt(0).toUpperCase() + locMatch[1].slice(1).toLowerCase()) : ''

  const isPluralVerb = /\b(services|campaigns|specialists|solutions|consultants)\b/i.test(cleanAnchor)
  const verbProvide = isPluralVerb ? 'provide' : 'provides'
  const verbDeliver = isPluralVerb ? 'deliver' : 'delivers'

  // 4. Synthesize natural, fluent editorial sentence
  let replacement = ''
  let recommendationType = 'Add New Sentence'

  // Check if any existing sentence in source page already contains the clean anchor
  const matchingSentence = sentences.find(s => s.toLowerCase().includes(cleanAnchor.toLowerCase()))
  if (matchingSentence) {
    replacement = matchingSentence
    recommendationType = 'Modify Existing Text'
  } else if (location) {
    // Target is a location SEO page
    if (/specialists|team|experts|consultant/i.test(cleanAnchor)) {
      replacement = `For ${sAudience} seeking to grow their regional reach, partnering with ${cleanAnchor} ensures prominent placement across competitive local search queries.`
    } else if (/^SEO\s+[A-Z]/i.test(cleanAnchor)) {
      replacement = `For ${sAudience} looking to grow their regional visibility in Dorset and the South Coast, investing in dedicated ${cleanAnchor} significantly enhances local search rankings.`
    } else if (/services|support|campaigns|strategy/i.test(cleanAnchor)) {
      replacement = `For ${sAudience} looking to capture high-intent search traffic, tailored ${cleanAnchor} ${verbProvide} the authority and search presence needed to outpace local competitors.`
    } else if (/optimisation|optimization/i.test(cleanAnchor)) {
      replacement = `For ${sAudience} operating across the region, comprehensive ${cleanAnchor} ${verbDeliver} consistent inbound inquiries from nearby searchers.`
    } else {
      replacement = `For ${sAudience} aiming to strengthen their presence in the area, our ${cleanAnchor} ${verbProvide} the targeted visibility needed to attract qualified clients.`
    }
  } else if (/google\s*business|gbp|maps/i.test(tSlug + tTitle + cleanAnchor)) {
    replacement = `To complement overall organic growth, implementing a dedicated ${cleanAnchor} ensures maximum prominence in local map packs and high-converting search features.`
  } else if (/technical/i.test(tSlug + tTitle + cleanAnchor)) {
    replacement = `Alongside content and on-page improvements, maintaining robust ${cleanAnchor} ensures search engines can crawl, index, and rank key service pages without friction.`
  } else if (/pricing|cost/i.test(tSlug + tTitle + cleanAnchor)) {
    replacement = `Before launching a campaign, reviewing our ${cleanAnchor} helps clarify the expected investment and strategic deliverables needed for long-term organic ROI.`
  } else if (/audit/i.test(tSlug + tTitle + cleanAnchor)) {
    replacement = `To identify technical roadblocks and untapped ranking opportunities, conducting a thorough ${cleanAnchor} is the crucial first step in any organic strategy.`
  } else {
    replacement = `For ${sAudience} focused on scalable organic growth, integrating ${cleanAnchor} into your wider digital marketing strategy ${verbDeliver} sustainable search visibility.`
  }

  return {
    currentSourceText: sentences[0] || '',
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
      const anchorText = (target.targetPhrase || target.target || target.title || 'loft conversion').trim()
      recommendations.push({
        id: `rec_${source.url || source.id}_${target.url || target.id}_${idx}`,
        anchorText: anchorText,
        sourceTitle: source.title || source.proposedTitle || 'Untitled Page',
        sourceUrl: source.url,
        sourceType: sourceType,
        sourcePriority: source.priority !== undefined ? source.priority : 0,
        sourcePageObj: source,
        targetTitle: target.title || target.proposedTitle || 'Untitled Page',
        targetUrl: target.url,
        targetType: target.type || target.seoPageType || 'Unclassified',
        targetPriority: target.priority !== undefined ? target.priority : 0,
        targetPageObj: target,
        reason: reasonText
      })
    })
  })

  return recommendations
}

/**
 * Safely inserts a target hyperlink into source page content using the saved sentence & anchor text.
 * Preserves all surrounding HTML/content and prevents duplicate links.
 */
export function buildModifiedSourceContent(sourcePage, targetUrl, anchorText, savedSentence) {
  if (!sourcePage) {
    return { success: false, message: 'Source page object missing.' }
  }
  if (!targetUrl || !anchorText || !savedSentence) {
    return { success: false, message: 'Target URL, anchor text, or saved sentence missing.' }
  }

  const rawContent = (
    typeof sourcePage.content?.raw === 'string' && sourcePage.content.raw.trim() ? sourcePage.content.raw.trim() :
    typeof sourcePage.content?.rendered === 'string' && sourcePage.content.rendered.trim() ? sourcePage.content.rendered.trim() :
    typeof sourcePage.content === 'string' && sourcePage.content.trim() ? sourcePage.content.trim() :
    typeof sourcePage.post_content === 'string' && sourcePage.post_content.trim() ? sourcePage.post_content.trim() :
    typeof sourcePage.body_text === 'string' && sourcePage.body_text.trim() ? sourcePage.body_text.trim() :
    typeof sourcePage.html === 'string' && sourcePage.html.trim() ? sourcePage.html.trim() : ''
  )

  if (!rawContent) {
    return { success: false, message: `No HTML content found for source page '${sourcePage.title || sourcePage.url}'.` }
  }

  // 1. Check if duplicate link already exists on source page
  const targetNormUrl = normalizeUrlForMatching(targetUrl)
  const linkRegex = /<a\s+[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match
  let isAlreadyLinked = false
  while ((match = linkRegex.exec(rawContent)) !== null) {
    const href = match[1]
    if (normalizeUrlForMatching(href) === targetNormUrl) {
      isAlreadyLinked = true
      break
    }
  }

  if (isAlreadyLinked) {
    return {
      success: false,
      isAlreadyLinked: true,
      message: `The target URL '${targetUrl}' is already hyperlinked on this source page.`
    }
  }

  // 2. Build hyperlinked sentence string <a href="TARGET_URL">ANCHOR_TEXT</a>
  const cleanAnchor = anchorText.trim()

  let hyperlinkedSentence = savedSentence
  const lowerSentence = savedSentence.toLowerCase()
  const lowerAnchor = cleanAnchor.toLowerCase()

  if (savedSentence.toLowerCase().includes(`<a href="${targetUrl.toLowerCase()}"`)) {
    hyperlinkedSentence = savedSentence
  } else {
    const anchorIdx = lowerSentence.indexOf(lowerAnchor)
    if (anchorIdx !== -1) {
      const beforeAnchor = savedSentence.slice(0, anchorIdx)
      const matchedAnchor = savedSentence.slice(anchorIdx, anchorIdx + cleanAnchor.length)
      const afterAnchor = savedSentence.slice(anchorIdx + cleanAnchor.length)
      hyperlinkedSentence = `${beforeAnchor}<a href="${targetUrl}">${matchedAnchor}</a>${afterAnchor}`
    } else {
      hyperlinkedSentence = `${savedSentence} <a href="${targetUrl}">${cleanAnchor}</a>`
    }
  }

  // 3. Locate and replace in rawContent
  let newContent = rawContent
  if (rawContent.includes(savedSentence)) {
    newContent = rawContent.replace(savedSentence, hyperlinkedSentence)
  } else {
    const cleanSentenceStr = savedSentence.trim().replace(/\s+/g, ' ')
    if (rawContent.includes(cleanSentenceStr)) {
      newContent = rawContent.replace(cleanSentenceStr, hyperlinkedSentence)
    } else {
      const lowerRaw = rawContent.toLowerCase()
      const rawAnchorIdx = lowerRaw.indexOf(lowerAnchor)
      if (rawAnchorIdx !== -1) {
        const before = rawContent.slice(0, rawAnchorIdx)
        const matched = rawContent.slice(rawAnchorIdx, rawAnchorIdx + cleanAnchor.length)
        const after = rawContent.slice(rawAnchorIdx + cleanAnchor.length)
        newContent = `${before}<a href="${targetUrl}">${matched}</a>${after}`
      } else {
        newContent = `${rawContent}\n\n<p>${hyperlinkedSentence}</p>`
      }
    }
  }

  return {
    success: true,
    newContent,
    hyperlinkedSentence,
    originalContent: rawContent
  }
}

