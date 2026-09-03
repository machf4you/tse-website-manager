/**
 * Global Deterministic Target-Phrase Intent Matcher (PASS / IMPROVE / FAIL)
 * Shared rule across WordPress, Magento, and all Website Manager platforms.
 */

const DIM_PATTERNS = [
  { pat: /\b(\d+)\s*(?:'|ft|foot|feet)\s*(\d+)\s*(?:\"|''|in|inch|inches)?\b/gi, repl: ' $1ft $2 ' },
  { pat: /\b(\d+)\s*'\s*(\d+)\s*\"?/g, repl: ' $1ft $2 ' },
  { pat: /\b(\d+)\s*(?:'|ft|foot|feet)\b/gi, repl: ' $1ft ' },
  { pat: /\b(\d+)\s*(?:\"|''|in|inch|inches)\b/gi, repl: ' $1in ' }
]

const STOPS = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'for', 'to', 'and', 'or', 'with', 'across', 'at', 'by', 'from', 'our', 'your'
])

import { extractSafeString } from './safeString'
export { extractSafeString }

export function stemWord(w = '') {
  const word = extractSafeString(w).toLowerCase().trim()
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y'
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1)
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3)
  return word
}

export function normalizePhraseText(s = '') {
  const safeStr = extractSafeString(s)
  if (!safeStr) return ''
  let text = safeStr.toLowerCase()
  text = text.replace(/&/g, ' and ')
  for (const { pat, repl } of DIM_PATTERNS) {
    text = text.replace(pat, repl)
  }
  text = text.replace(/[^\w\s]/g, ' ')
  return text.replace(/\s+/g, ' ').trim()
}

export function matchTargetPhraseIntent(haystack = '', targetPhrase = '') {
  if (!haystack || !targetPhrase) {
    return {
      status: 'FAIL',
      score: 0,
      matchType: 'EMPTY',
      coverage: 0,
      detail: 'Target phrase or element text is empty.'
    }
  }

  const hayNorm = normalizePhraseText(haystack)
  const targetNorm = normalizePhraseText(targetPhrase)

  if (targetNorm && hayNorm.includes(targetNorm)) {
    return {
      status: 'PASS',
      score: 100,
      matchType: 'EXACT',
      coverage: 1,
      detail: 'Exact target phrase match found.'
    }
  }

  const targetWords = targetNorm.split(' ').filter(Boolean)
  let targetTokens = targetWords.filter(w => !STOPS.has(w)).map(stemWord)
  if (targetTokens.length === 0) {
    targetTokens = targetWords.map(stemWord)
  }

  const hayWords = hayNorm.split(' ').filter(Boolean)
  const hayTokensStemmed = hayWords.map(stemWord)
  const hayTokenSet = new Set(hayTokensStemmed)

  if (targetTokens.length === 0) {
    return {
      status: 'FAIL',
      score: 0,
      matchType: 'EMPTY_TOKENS',
      coverage: 0,
      detail: 'No valid tokens in target phrase.'
    }
  }

  const matchedTokens = targetTokens.filter(t => hayTokenSet.has(t))
  const coverage = matchedTokens.length / targetTokens.length

  if (coverage === 1.0) {
    const positions = []
    hayTokensStemmed.forEach((t, i) => {
      if (targetTokens.includes(t)) positions.push(i)
    })

    if (positions.length > 0) {
      const windowSize = Math.max(...positions) - Math.min(...positions) + 1
      const maxAllowedWindow = Math.max(targetTokens.length + 6, targetTokens.length * 2 + 2)
      if (windowSize <= maxAllowedWindow) {
        return {
          status: 'PASS',
          score: 90,
          matchType: 'CLOSE_VARIANT',
          coverage: 1.0,
          detail: 'Target intent fully matched as a natural close variant.'
        }
      } else {
        return {
          status: 'IMPROVE',
          score: 70,
          matchType: 'DISTANT_TOKENS',
          coverage: 1.0,
          detail: 'All target words present, but separated across too wide a span.'
        }
      }
    }

    return {
      status: 'PASS',
      score: 85,
      matchType: 'CLOSE_VARIANT',
      coverage: 1.0,
      detail: 'Target intent fully matched.'
    }
  }

  if (targetTokens.length >= 2 && matchedTokens.length <= 1) {
    return {
      status: 'FAIL',
      score: 20,
      matchType: 'GENERIC_PARTIAL',
      coverage,
      detail: `Only 1 generic token matched out of ${targetTokens.length} required target words.`
    }
  }

  if (coverage >= 0.6) {
    return {
      status: 'IMPROVE',
      score: 60,
      matchType: 'PARTIAL_COVERAGE',
      coverage,
      detail: `Partial target phrase coverage (${matchedTokens.length}/${targetTokens.length} core terms present).`
    }
  }

  return {
    status: 'FAIL',
    score: 10,
    matchType: 'MISSING_INTENT',
    coverage,
    detail: `Target phrase intent is missing (${matchedTokens.length}/${targetTokens.length} core terms present).`
  }
}
