import { generateContextualReplacement } from '../src/utils/internalLinkingHelper.js'

function testNaturalSentenceGenerator() {
  console.log('=== TESTING W5 NATURAL SENTENCE GENERATOR ===\n')

  const mockSourcePage = {
    title: 'Construction Work Banstead',
    content: {
      rendered: '<p>Construction Work You Can Count On. We provide expert building services in Banstead.</p>'
    }
  }

  const testAnchors = [
    'adding a loft conversion',
    'loft conversion',
    'dormer & velux roof conversions',
    'expert loft conversion services',
    'attic space'
  ]

  testAnchors.forEach((anchor, i) => {
    const result = generateContextualReplacement(mockSourcePage, anchor)
    console.log(`[${i + 1}] Anchor: "${anchor}"`)
    console.log(`    Current Source Text: "${result.currentSourceText}"`)
    console.log(`    Suggested Replacement: "${result.suggestedReplacement}"`)
    console.log('---')
  })
}

testNaturalSentenceGenerator()
