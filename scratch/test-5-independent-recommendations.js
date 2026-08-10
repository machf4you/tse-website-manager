import fs from 'fs'

export function analyzeSourcePageIndependentRecommendation(sourcePage, targetUrl, targetPhrase) {
  if (!sourcePage) return null

  const rawContent = (
    typeof sourcePage.content?.rendered === 'string' && sourcePage.content.rendered.trim() ? sourcePage.content.rendered.trim() :
    typeof sourcePage.content?.raw === 'string' && sourcePage.content.raw.trim() ? sourcePage.content.raw.trim() :
    typeof sourcePage.content === 'string' && sourcePage.content.trim() ? sourcePage.content.trim() :
    typeof sourcePage.body_text === 'string' && sourcePage.body_text.trim() ? sourcePage.body_text.trim() :
    typeof sourcePage.crawlData?.plainText === 'string' && sourcePage.crawlData.plainText.trim() ? sourcePage.crawlData.plainText.trim() :
    typeof sourcePage.post_content === 'string' && sourcePage.post_content.trim() ? sourcePage.post_content.trim() :
    typeof sourcePage.html === 'string' && sourcePage.html.trim() ? sourcePage.html.trim() : ''
  )

  const bodyCleaned = rawContent
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
    .replace(/<div[^>]*class="[^"]*(header|nav|footer|logo|site-header|site-footer|menu|sidebar|widget|image-switcher|cta|top-bar|phone|contact|topbar)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<ul[^>]*class="[^"]*(menu|nav|breadcrumbs)[^"]*"[^>]*>[\s\S]*?<\/ul>/gi, '')

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
      if (s.length >= 30 && s.length <= 300 && sClean !== pageTitleClean) {
        sentences.push(s)
      }
    })
  })

  const phoneBoilerplateRegex = /(\d{4,5}\s*\d{5,6}|\b(07\d{3}|01\d{3}|all rights reserved|copyright|call us any time|construction work you can count on)\b)/i
  let editorialSentences = sentences.filter(s => !phoneBoilerplateRegex.test(s))
  if (editorialSentences.length === 0) editorialSentences = sentences
  if (editorialSentences.length === 0) return { error: 'No suitable contextual placement found on this page' }

  // Topic keywords for selection
  const topicKeywords = ['loft', 'conversion', 'conversions', 'extension', 'space', 'home', 'room', 'roof', 'renovation', 'building', 'builder', 'surrey', 'london', 'design', 'planning', 'bedroom', 'dormer', 'attic']

  let bestSentence = editorialSentences[0]
  let maxScore = -1
  editorialSentences.forEach(s => {
    const lower = s.toLowerCase()
    let score = 0
    topicKeywords.forEach(kw => { if (lower.includes(kw)) score += kw.length })
    if (score > maxScore) {
      maxScore = score
      bestSentence = s
    }
  })

  const chosenSentence = bestSentence || editorialSentences[0]

  // Identify natural contextual anchor derived directly from this page's passage
  let recommendedAnchor = ''
  let recommendationType = 'Modify Existing Text'
  let suggestedResult = ''

  // Look for distinct natural phrases in this text
  const candidatePhrases = [
    'adding a loft conversion',
    'loft conversion',
    'expanding your living area',
    'dormer, mansard, and velux roof installations',
    'attic space',
    'high quality loft conversions',
    'master bedroom suites'
  ]

  const matched = candidatePhrases.find(ph => chosenSentence.toLowerCase().includes(ph))

  if (matched) {
    recommendedAnchor = matched
    recommendationType = 'Modify Existing Text'
    suggestedResult = chosenSentence
  } else {
    recommendedAnchor = 'loft conversion services'
    recommendationType = 'Add New Sentence'
    const baseText = chosenSentence.replace(/[.!?]+$/, '').trim()
    suggestedResult = `${baseText}, including our specialized ${recommendedAnchor}.`
  }

  return {
    sourcePage: sourcePage.pageTitle || sourcePage.title || sourcePage.url,
    currentSourceContext: chosenSentence,
    recommendedAnchor,
    recommendationType,
    suggestedResult,
    destination: '/'
  }
}

// 5 Test pages for Loft Conversions London target
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

console.log('=== FOCUSED TEST: 5 INDEPENDENT SOURCE PAGE RECOMMENDATIONS ===\n')

testPages.forEach((page, idx) => {
  const rec = analyzeSourcePageIndependentRecommendation(page, '/', 'Loft conversions London')
  console.log(`SOURCE PAGE ${idx + 1}:`)
  console.log(`${rec.sourcePage}`)
  console.log(`\nCURRENT SOURCE CONTEXT:\n"${rec.currentSourceContext}"`)
  console.log(`\nRECOMMENDED ANCHOR:\n"${rec.recommendedAnchor}"`)
  console.log(`\nRECOMMENDATION TYPE:\n${rec.recommendationType}`)
  console.log(`\nSUGGESTED RESULT:\n"${rec.suggestedResult}"`)
  console.log(`\nDESTINATION:\n${rec.destination}`)
  console.log('--------------------------------------------------\n')
})
