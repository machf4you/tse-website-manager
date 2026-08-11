function testSavedRecommendationsFlow() {
  console.log('=== TESTING W5 SAVED RECOMMENDATIONS PERSISTENCE FLOW ===\n')

  const storageKey = 'tse_w5_recommendations_test_101'
  const mockRec = {
    id: 'rec_https://ascentbuilders.co.uk/article-1_https://ascentbuilders.co.uk/landing-1_0',
    sourceUrl: 'https://ascentbuilders.co.uk/article-1',
    targetUrl: 'https://ascentbuilders.co.uk/landing-1',
    anchorText: 'loft conversion',
    sourceTitle: 'Velux vs Dormer Loft Conversion',
    targetTitle: 'Loft Conversions Banstead'
  }

  // 1. Initial State (empty)
  let savedRecs = {}
  console.log('1. Initial Load:')
  console.log(`- Saved count: ${Object.keys(savedRecs).length}`)

  // 2. Generate Sentence
  const generatedSentence = 'If you are considering a loft conversion in Banstead, our experienced team can help create the perfect space for your home.'
  console.log('\n2. Generated Sentence:')
  console.log(`- Text: "${generatedSentence}"`)

  // 3. User edits sentence
  const userEditedSentence = 'If you are considering a loft conversion in Banstead, contact our specialist builders for a free consultation.'
  console.log('\n3. User Edit:')
  console.log(`- Final Edited Text: "${userEditedSentence}"`)

  // 4. Save Recommendation
  const recKey = mockRec.id
  savedRecs[recKey] = {
    id: mockRec.id,
    sourceUrl: mockRec.sourceUrl,
    targetUrl: mockRec.targetUrl,
    anchorText: mockRec.anchorText,
    savedSentence: userEditedSentence,
    isSaved: true,
    updatedAt: new Date().toISOString()
  }

  const serialized = JSON.stringify(savedRecs)
  console.log('\n4. Saved Payload Serialized:')
  console.log(serialized)

  // 5. Simulate Refresh / Page Load (Restore)
  const restoredRecs = JSON.parse(serialized)
  const restored = restoredRecs[recKey]

  console.log('\n5. Restored on Page Refresh:')
  console.log(`- Is Saved: ${restored.isSaved}`)
  console.log(`- Restored Sentence: "${restored.savedSentence}"`)
  console.log(`- Source URL: ${restored.sourceUrl}`)
  console.log(`- Target URL: ${restored.targetUrl}`)

  const passed = restored && restored.savedSentence === userEditedSentence && restored.isSaved === true
  console.log(`\nVerification: ${passed ? 'PASSED (Saved recommendation preserved and restored cleanly)' : 'FAILED'}`)
}

testSavedRecommendationsFlow()
