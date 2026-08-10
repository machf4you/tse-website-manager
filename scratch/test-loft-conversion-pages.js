import fs from 'fs'

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

  // 1. Strip structural chrome, header, footer, nav, script, style, forms, and template wrappers
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
      // Skip exact title heading matching and very short snippets
      if (s.length >= 25 && s.length <= 320 && sClean !== pageTitleClean) {
        sentences.push(s)
      }
    })
  })

  // 3. Filter out actual phone numbers, repeated boilerplate CTA headers, copyright text
  const phoneBoilerplateRegex = /(\d{4,5}\s*\d{5,6}|\b(07\d{3}|01\d{3}|all rights reserved|copyright|call us any time|construction work you can count on)\b)/i

  let editorialSentences = sentences.filter(s => !phoneBoilerplateRegex.test(s))

  if (editorialSentences.length === 0) {
    editorialSentences = sentences
  }

  if (editorialSentences.length === 0) {
    return { error: 'No suitable contextual placement found on this page' }
  }

  // 4. Rank sentences by topical relevance to target niche keywords
  const cleanAnchor = (anchorText || '').trim()
  const anchorWords = cleanAnchor.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const topicKeywords = ['loft', 'conversion', 'conversions', 'extension', 'space', 'home', 'room', 'roof', 'renovation', 'building', 'builder', 'surrey', 'london', 'design', 'planning', ...anchorWords]

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

  // 5. Create natural replacement sentence by integrating anchorText into chosenSentence
  const lowerSentence = chosenSentence.toLowerCase()
  const lowerAnchor = cleanAnchor.toLowerCase()
  let replacement = ''

  if (lowerSentence.includes(lowerAnchor)) {
    replacement = chosenSentence
  } else {
    const baseText = chosenSentence.replace(/[.!?]+$/, '').trim()
    if (/\b(loft conversions|loft conversion)\b/i.test(baseText)) {
      replacement = baseText.replace(/\b(loft conversions|loft conversion)\b/i, cleanAnchor)
    } else if (/\b(services|solutions|projects|work|building|renovation|home|space|choices|extensions)\b/i.test(baseText)) {
      replacement = baseText.replace(/\b(services|solutions|projects|work|building|renovation|home|space|choices|extensions)\b/i, `$1, including specialized ${cleanAnchor},`)
    } else {
      replacement = `${baseText}, with specialized ${cleanAnchor}.`
    }
  }

  return {
    currentSourceText: chosenSentence,
    suggestedReplacement: replacement
  }
}

// Test against mock Loft Conversions source pages
const testPages = [
  {
    title: 'Loft Conversions Walton-On-Thames',
    url: '/loft-conversions-walton-on-thames/',
    content: 'Loft Conversions Walton-On-Thames. Adding a loft conversion to your property in Walton-On-Thames creates extra bedrooms, bathrooms, or home office space while increasing property value.'
  },
  {
    title: 'Loft Conversions Hampton',
    url: '/loft-conversions-hampton/',
    content: 'Loft Conversions Hampton. A loft conversion in Hampton is an ideal solution for expanding your living area without extending into your garden space.'
  },
  {
    title: 'Loft Conversions Leatherhead',
    url: '/loft-conversions-leatherhead/',
    content: 'Loft Conversions Leatherhead. Homeowners in Leatherhead choose loft conversions for dormer, mansard, and velux roof installations tailored to modern family living.'
  },
  {
    title: 'Loft Conversions Kingston upon Thames',
    url: '/loft-conversions-kingston-upon-thames/',
    content: 'Loft Conversions Kingston upon Thames. Transform unused attic space in Kingston upon Thames into beautiful master bedroom suites and functional home workspaces.'
  },
  {
    title: 'Loft Conversions New Malden',
    url: '/loft-conversions-new-malden/',
    content: 'Loft Conversions New Malden. Our expert builders complete high quality loft conversions in New Malden with full structural engineering and architectural compliance.'
  }
]

console.log('Testing 5 Loft Conversions source pages with target phrase "loft conversions banstead":\n')

testPages.forEach((p, idx) => {
  console.log(`--- PAGE ${idx + 1}: ${p.title} ---`)
  const res = generateContextualReplacement(p, 'loft conversions banstead')
  if (res.error) {
    console.log(`RESULT: ${res.error}\n`)
  } else {
    console.log(`CURRENT SOURCE TEXT:\n"${res.currentSourceText}"`)
    console.log(`SUGGESTED REPLACEMENT:\n"${res.suggestedReplacement}"\n`)
  }
})
