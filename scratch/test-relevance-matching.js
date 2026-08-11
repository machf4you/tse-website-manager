import { generateSimpleInternalLinkRecommendations } from '../src/utils/internalLinkingHelper.js'

function testRelevanceMatching() {
  console.log('=== TESTING RELEVANCE-BASED INTERNAL LINK RECOMMENDATIONS ===\n')

  const pages = [
    { id: 1, title: 'Ascent Builders Home', url: 'https://ascentbuilders.co.uk/', type: 'Hub', priority: 1 },
    { id: 2, title: 'Loft Conversions Banstead', url: 'https://ascentbuilders.co.uk/loft-conversions-banstead/', type: 'Landing', priority: 2, targetPhrase: 'Loft Conversions Banstead' },
    { id: 3, title: 'Kitchen Extensions Surrey', url: 'https://ascentbuilders.co.uk/kitchen-extensions-surrey/', type: 'Landing', priority: 2, targetPhrase: 'Kitchen Extensions' },
    { id: 4, title: 'House Extensions Banstead', url: 'https://ascentbuilders.co.uk/house-extensions-banstead/', type: 'Landing', priority: 2, targetPhrase: 'House Extensions' },
    { id: 5, title: 'How Much Does a Loft Conversion Cost?', url: 'https://ascentbuilders.co.uk/how-much-does-a-loft-conversion-cost/', type: 'Topical', priority: 3, targetPhrase: 'Loft Conversion Cost' },
    { id: 6, title: 'Velux vs Dormer Loft Conversion', url: 'https://ascentbuilders.co.uk/velux-vs-dormer-loft-conversion/', type: 'Article', priority: 4, targetPhrase: 'Velux vs Dormer Loft Conversion' }
  ]

  const recs = generateSimpleInternalLinkRecommendations(pages)

  console.log('Recommendations generated:\n')

  // Inspect recommendations for "Velux vs Dormer Loft Conversion" (Article)
  const veluxRecs = recs.filter(r => r.sourceTitle.includes('Velux vs Dormer'))

  console.log('Recommendations for "Velux vs Dormer Loft Conversion":')
  veluxRecs.forEach((r, i) => {
    console.log(`[${i + 1}] Target: "${r.targetTitle}" (${r.targetType}) | Reason: ${r.reason}`)
  })

  // Verify that Loft Conversions Banstead is ranked ABOVE Kitchen Extensions Surrey
  const loftIdx = veluxRecs.findIndex(r => r.targetTitle.includes('Loft Conversions'))
  const kitchenIdx = veluxRecs.findIndex(r => r.targetTitle.includes('Kitchen Extensions'))

  const relevanceOk = loftIdx !== -1 && (kitchenIdx === -1 || loftIdx < kitchenIdx)

  console.log(`\nRelevance Check: ${relevanceOk ? 'PASSED ("Loft Conversions Banstead" recommended ahead of "Kitchen Extensions")' : 'FAILED'}`)
}

testRelevanceMatching()
