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

  // 1. Strip structural, chrome, navigation, CTA, phone, and template wrappers
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
      // Skip title matching and short headers
      if (s.length >= 35 && s.length <= 300 && sClean !== pageTitleClean) {
        sentences.push(s)
      }
    })
  })

  // 3. Filter out CTA, phone numbers, contact info, and generic template text
  const phoneCtaRegex = /(\d{4,5}\s*\d{5,6}|\b(call|phone|tel|contact|email|quote|07\d{3}|01\d{3}|click here|read more|call us|all rights reserved|construction work you can count on|call us any time)\b)/i

  const editorialSentences = sentences.filter(s => !phoneCtaRegex.test(s))

  if (editorialSentences.length === 0) {
    return { error: 'No suitable contextual placement found on this page' }
  }

  // 4. Select best candidate sentence
  const anchorWords = (anchorText || '').toLowerCase().split(/\s+/).filter(w => w.length > 3)
  let chosenSentence = editorialSentences.find(s => {
    const lower = s.toLowerCase()
    return anchorWords.some(w => lower.includes(w))
  })

  if (!chosenSentence) {
    chosenSentence = editorialSentences[0]
  }

  // 5. Create replacement incorporating anchorText
  const cleanAnchor = (anchorText || '').trim()
  const lowerSentence = chosenSentence.toLowerCase()
  const lowerAnchor = cleanAnchor.toLowerCase()
  let replacement = ''

  if (lowerSentence.includes(lowerAnchor)) {
    replacement = chosenSentence
  } else {
    // Strip trailing period if present
    const baseText = chosenSentence.replace(/[.!?]+$/, '').trim()
    if (/\b(services|solutions|projects|work|building|renovation|home|space|choices)\b/i.test(baseText)) {
      replacement = `${baseText}, including specialized ${cleanAnchor}.`
    } else {
      replacement = `${baseText}, featuring high quality ${cleanAnchor}.`
    }
  }

  return {
    currentSourceText: chosenSentence,
    suggestedReplacement: replacement
  }
}

const raw = fs.readFileSync('c:/Antigravity/tse-audit-engine/src/exporter-data.json', 'utf8')
const data = JSON.parse(raw)
const siteKey = Object.keys(data)[0]
const pages = data[siteKey].pages

console.log(`Testing against first 3 pages of ${siteKey}:\n`)
const targetAnchor = 'loft conversions banstead'

pages.slice(0, 3).forEach((page, i) => {
  console.log(`--- PAGE ${i + 1}: ${page.pageTitle || page.title} ---`)
  console.log(`URL: ${page.pageUrl || page.url}`)
  const res = generateContextualReplacement(page, targetAnchor)
  if (res.error) {
    console.log(`RESULT: ${res.error}\n`)
  } else {
    console.log(`CURRENT SOURCE TEXT:\n"${res.currentSourceText}"`)
    console.log(`SUGGESTED REPLACEMENT:\n"${res.suggestedReplacement}"\n`)
  }
})
