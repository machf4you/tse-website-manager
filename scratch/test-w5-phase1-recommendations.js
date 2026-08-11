import { generateSimpleInternalLinkRecommendations } from '../src/utils/internalLinkingHelper.js'

function testW5Phase1Recommendations() {
  console.log('=== TESTING W5 PHASE 1 SIMPLE INTERNAL LINK RECOMMENDATIONS ===\n')

  const mockPages = [
    { id: 1, title: 'Ascent Builders Home', url: 'https://ascentbuilders.co.uk/', type: 'Hub', priority: 1, isExcluded: false },
    { id: 2, title: 'Loft Conversions Banstead', url: 'https://ascentbuilders.co.uk/loft-conversions-banstead/', type: 'Landing', priority: 2, isExcluded: false },
    { id: 3, title: 'House Extensions Banstead', url: 'https://ascentbuilders.co.uk/house-extensions-banstead/', type: 'Landing', priority: 2, isExcluded: false },
    { id: 4, title: 'How Much Does a Loft Conversion Cost?', url: 'https://ascentbuilders.co.uk/how-much-does-a-loft-conversion-cost/', type: 'Topical', priority: 3, isExcluded: false },
    { id: 5, title: 'Velux vs Dormer Loft Conversion', url: 'https://ascentbuilders.co.uk/velux-vs-dormer-loft-conversion/', type: 'Article', priority: 4, isExcluded: false }
  ]

  const recs = generateSimpleInternalLinkRecommendations(mockPages)

  console.log(`Generated ${recs.length} recommendations across ${mockPages.length} pages:\n`)

  recs.forEach((r, i) => {
    console.log(`[${i + 1}] Source: "${r.sourceTitle}" (${r.sourceType}, Prio ${r.sourcePriority})`)
    console.log(`    Target: "${r.targetTitle}" (${r.targetType}, Prio ${r.targetPriority})`)
    console.log(`    Reason: ${r.reason}`)
    console.log('---')
  })

  // Verification checks:
  const articleRec = recs.find(r => r.sourceType === 'Article')
  const topicalRec = recs.find(r => r.sourceType === 'Topical')
  const landingRec = recs.find(r => r.sourceType === 'Landing')
  const hubRec = recs.find(r => r.sourceType === 'Hub')

  const articleOk = articleRec && (articleRec.targetType === 'Landing' || articleRec.targetType === 'Hub')
  const topicalOk = topicalRec && (topicalRec.targetType === 'Landing' || topicalRec.targetType === 'Hub')
  const landingOk = landingRec && (landingRec.targetType === 'Hub' || landingRec.targetType === 'Landing')
  const hubOk = hubRec && (hubRec.targetType === 'Landing' || hubRec.targetType === 'Topical')

  const allOk = articleOk && topicalOk && landingOk && hubOk

  console.log(`\nVerification: ${allOk ? 'PASSED (All page type relationship recommendations built correctly)' : 'FAILED'}`)
}

testW5Phase1Recommendations()
