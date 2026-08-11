import { extractPagesFromPackage, extractPostsFromPackage } from '../src/utils/packageExtractor.js'

async function verifyAscentFix() {
  console.log('=== VERIFYING ASCENT POST FIX WITH PACKAGE EXTRACTOR ===\n')

  const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites/1/package')
  const json = await res.json()

  const extracted = extractPagesFromPackage(json)
  const posts = extractPostsFromPackage(json)

  console.log(`Total extracted items (pages + posts): ${extracted.length}`)
  console.log(`Total extracted raw posts: ${posts.length}`)

  const typeCounts = {}
  extracted.forEach(p => {
    typeCounts[p.type] = (typeCounts[p.type] || 0) + 1
  })

  console.log('\nPage Type Breakdown across all 60 items:')
  console.table(typeCounts)

  const articleItems = extracted.filter(p => p.type === 'Article' || p.seoPageType === 'Article')
  console.log(`\nArticle count: ${articleItems.length}`)

  if (articleItems.length > 0) {
    console.log('\nArticles found:')
    articleItems.forEach((art, i) => {
      console.log(`${i + 1}. [Priority ${art.priority}] "${art.title}" -> ${art.url}`)
    })
  }

  const passed = articleItems.length === 10 && articleItems.every(a => a.priority === 4)
  console.log(`\nVerification Result: ${passed ? 'PASSED (10 Articles classified at Priority 4)' : 'FAILED'}`)
}

verifyAscentFix()
