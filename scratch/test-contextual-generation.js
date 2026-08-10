import fs from 'fs'

function generateContextualReplacement(sourcePage, anchorText) {
  if (!sourcePage) return null

  const rawContent = (
    typeof sourcePage.content?.rendered === 'string' && sourcePage.content.rendered.trim() ? sourcePage.content.rendered.trim() :
    typeof sourcePage.content === 'string' && sourcePage.content.trim() ? sourcePage.content.trim() :
    typeof sourcePage.body_text === 'string' && sourcePage.body_text.trim() ? sourcePage.body_text.trim() :
    typeof sourcePage.html === 'string' && sourcePage.html.trim() ? sourcePage.html.trim() : ''
  )

  const bodyOnly = rawContent
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
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
  const anchorWords = anchorText.toLowerCase().split(/\s+/).filter(w => w.length > 3)

  // Try to find a sentence mentioning any key topic word
  if (sentences.length > 0) {
    chosenSentence = sentences.find(s => {
      const lower = s.toLowerCase()
      return anchorWords.some(w => lower.includes(w))
    }) || sentences[Math.min(1, sentences.length - 1)] || sentences[0]
  }

  if (!chosenSentence) {
    chosenSentence = `Our team provides dedicated construction and building services tailored to client specifications.`
  }

  // Create natural replacement sentence by integrating anchorText into chosenSentence
  let replacement = ''
  const sentenceLower = chosenSentence.toLowerCase()

  if (sentenceLower.includes(anchorText.toLowerCase())) {
    replacement = chosenSentence
  } else if (sentenceLower.includes('services') || sentenceLower.includes('solutions')) {
    replacement = chosenSentence.replace(/(services|solutions)/i, `$1, including specialized ${anchorText},`)
  } else if (sentenceLower.includes('our team') || sentenceLower.includes('we offer') || sentenceLower.includes('we provide')) {
    replacement = chosenSentence.replace(/\.$/, `, with a focus on ${anchorText}.`)
  } else {
    replacement = chosenSentence.replace(/\.$/, ` (featuring ${anchorText}).`)
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

const testSourcePage = pages[0]
console.log('Source Page Title:', testSourcePage.pageTitle || testSourcePage.title)

const result = generateContextualReplacement(testSourcePage, 'loft conversions banstead')
console.log('\n--- RESULT ---')
console.log('CURRENT SOURCE TEXT:\n', result.currentSourceText)
console.log('\nSUGGESTED REPLACEMENT:\n', result.suggestedReplacement)
