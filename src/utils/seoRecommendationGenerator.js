/**
 * Deterministic SEO Recommendation Generator for W4 Optimise Page SEO.
 * Generates recommended Proposed Meta Title, Proposed Meta Description, and Proposed H1
 * based on target phrase, page topic, site name, and target length requirements.
 */

function cleanTopicText(str = '', siteName = '') {
  let s = (str || '').trim()
  if (!s) return ''

  // Remove common brand suffixes (e.g. "- Ascent Builders", "| Ascent Builders", "- HF4You")
  if (siteName) {
    const brandRegex = new RegExp(`\\s*[-|–—]\\s*${siteName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}.*`, 'i')
    s = s.replace(brandRegex, '')
  }
  s = s.replace(/\s*[-|–—]\s*(Ascent Builders|HF4You|TSE).*$/i, '')

  // Remove leading/trailing punctuation and excess whitespace
  s = s.replace(/^[-|–—\s:,]+/, '').replace(/[-|–—\s:,]+$/, '').trim()
  return s
}

function extractTopicFromUrl(url = '') {
  try {
    const path = new URL(url, 'https://example.com').pathname
    const segments = path.split('/').filter(Boolean)
    if (segments.length === 0) return ''
    let lastSegment = segments[segments.length - 1]
    lastSegment = lastSegment.replace(/\.(html|php|aspx?)$/i, '')
    return lastSegment
      .split(/[-_]+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  } catch (e) {
    return ''
  }
}

function containsPhrase(text = '', phrase = '') {
  if (!text || !phrase) return false
  return text.toLowerCase().includes(phrase.toLowerCase())
}

/**
 * Resolves whether a saved proposed value is a genuine user edit or an unedited legacy snapshot.
 * - If saved value is identical to actual live value (ignoring case & extra spaces), it is a legacy snapshot -> IGNORED.
 * - If saved value is empty, returns recommendation (or actual fallback).
 * - If saved value is DIFFERENT from actual live value -> preserved as a genuine user override!
 */
export function resolveProposedField(savedVal, actualVal, recVal) {
  const saved = (savedVal || '').replace(/\s+/g, ' ').trim()
  const actual = (actualVal || '').replace(/\s+/g, ' ').trim()
  const rec = (recVal || '').trim()

  if (!saved) return rec || actual
  if (saved.toLowerCase() === actual.toLowerCase()) return rec || actual
  return saved
}

export function generateSeoRecommendations({
  targetPhrase = '',
  actualMetaTitle = '',
  actualMetaDescription = '',
  actualH1 = '',
  pageUrl = '',
  pageTitle = '',
  siteName = ''
}) {
  const target = (targetPhrase || '').trim()
  const brand = (siteName || '').trim() || 'Ascent Builders'

  // Extract cleanest topic text
  let topic = cleanTopicText(actualH1, brand)
  if (!topic) topic = cleanTopicText(actualMetaTitle, brand)
  if (!topic) topic = cleanTopicText(pageTitle, brand)
  if (!topic) topic = extractTopicFromUrl(pageUrl)
  if (!topic) topic = 'Services Showcase'

  // Clean up formatting in topic
  topic = topic.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').replace(/^,\s*/, '').replace(/,\s*$/, '').trim()

  // Format topic nicely (e.g., "2 Bedroom, Bathroom Loft Conversion in Surbiton" -> "2 Bedroom Loft Conversion in Surbiton")
  let cleanTitleTopic = topic.replace(/,\s*bathroom/i, '')

  // 1. PROPOSED META TITLE (Target: 50–60 chars)
  let proposedTitle = ''
  if (target && containsPhrase(actualMetaTitle, target) && actualMetaTitle.length >= 45 && actualMetaTitle.length <= 65) {
    proposedTitle = actualMetaTitle
  } else if (!target) {
    proposedTitle = actualMetaTitle || `${topic} | ${brand}`
  } else {
    // Generate title using target phrase
    const cand1 = `${target}: ${cleanTitleTopic}`
    const cand2 = `${target} - ${cleanTitleTopic} | ${brand}`
    const cand3 = `${target} | ${cleanTitleTopic}`

    if (cand1.length >= 50 && cand1.length <= 60) {
      proposedTitle = cand1
    } else if (cand2.length >= 50 && cand2.length <= 60) {
      proposedTitle = cand2
    } else if (cand3.length >= 50 && cand3.length <= 60) {
      proposedTitle = cand3
    } else if (cand1.length < 50) {
      const cand1Brand = `${cand1} | ${brand}`
      if (cand1Brand.length >= 50 && cand1Brand.length <= 62) {
        proposedTitle = cand1Brand
      } else {
        proposedTitle = cand1
      }
    } else {
      const availLen = 58 - (target.length + 2)
      let shortTopic = cleanTitleTopic
      if (shortTopic.length > availLen) {
        shortTopic = shortTopic.substring(0, availLen).replace(/\s+\S*$/, '')
      }
      proposedTitle = `${target}: ${shortTopic}`
    }
  }

  // 2. PROPOSED META DESCRIPTION (Target: 150–160 chars)
  let proposedMetaDescription = ''
  if (target && containsPhrase(actualMetaDescription, target) && actualMetaDescription.length >= 140 && actualMetaDescription.length <= 165) {
    proposedMetaDescription = actualMetaDescription
  } else {
    let descTopic = topic.toLowerCase().replace(/,\s*/g, ' ')
    descTopic = descTopic.replace(/\s{2,}/g, ' ').trim()

    let descBase = `Explore our ${target} showcase featuring a ${descTopic}. Contact ${brand} today for expert building services.`

    if (descBase.length < 150) {
      descBase = `Explore our ${target} showcase featuring a ${descTopic}. Contact ${brand} today for expert building services and a free consultation.`
    }

    if (descBase.length > 160) {
      descBase = descBase.substring(0, 157).replace(/\s+\S*$/, '.')
    }

    proposedMetaDescription = descBase
  }

  // 3. PROPOSED H1 (Target: 20–70 chars)
  let proposedH1 = ''
  if (target && containsPhrase(actualH1, target) && actualH1.length >= 20 && actualH1.length <= 70) {
    proposedH1 = actualH1
  } else if (!target) {
    proposedH1 = actualH1 || topic
  } else {
    const h1Cand = `${target}: ${cleanTitleTopic}`
    if (h1Cand.length <= 70) {
      proposedH1 = h1Cand
    } else {
      const availH1Len = 67 - target.length
      let shortH1 = cleanTitleTopic.substring(0, availH1Len).replace(/\s+\S*$/, '')
      proposedH1 = `${target}: ${shortH1}`
    }
  }

  return {
    proposedTitle,
    proposedMetaDescription,
    proposedH1,
  }
}
