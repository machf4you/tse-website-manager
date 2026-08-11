import { extractPagesFromPackage, extractPostsFromPackage } from '../src/utils/packageExtractor.js'

async function traceAscentPackage() {
  console.log('=== TRACING ASCENT PACKAGE WITH PACKAGE EXTRACTOR ===\n')

  const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites/1/package')
  const json = await res.json()
  
  console.log('API Response top-level keys:', Object.keys(json))
  
  // Test passing top level json directly
  const pagesDirect = extractPagesFromPackage(json)
  const postsDirect = extractPostsFromPackage(json)
  console.log(`\nPassing top-level json:`)
  console.log(`- extractPagesFromPackage count: ${pagesDirect.length}`)
  console.log(`- extractPostsFromPackage count: ${postsDirect.length}`)

  // Test passing unwrapped packageData
  let pkgInner = json
  if (json.packageData || json.package_data) {
    const raw = json.packageData || json.package_data
    pkgInner = typeof raw === 'string' ? JSON.parse(raw) : raw
  }

  console.log(`\nPassing unwrapped pkgInner (keys: ${Object.keys(pkgInner)}):`)
  const pagesUnwrapped = extractPagesFromPackage(pkgInner)
  const postsUnwrapped = extractPostsFromPackage(pkgInner)
  console.log(`- extractPagesFromPackage count: ${pagesUnwrapped.length}`)
  console.log(`- extractPostsFromPackage count: ${postsUnwrapped.length}`)

  // Test passing double-unwrapped packageData if nested
  let pkgDouble = pkgInner
  if (pkgInner.packageData || pkgInner.package_data) {
    const raw = pkgInner.packageData || pkgInner.package_data
    pkgDouble = typeof raw === 'string' ? JSON.parse(raw) : raw
  }

  console.log(`\nPassing double-unwrapped pkgDouble (keys: ${Object.keys(pkgDouble)}):`)
  const pagesDouble = extractPagesFromPackage(pkgDouble)
  const postsDouble = extractPostsFromPackage(pkgDouble)
  console.log(`- extractPagesFromPackage count: ${pagesDouble.length}`)
  console.log(`- extractPostsFromPackage count: ${postsDouble.length}`)

  if (pagesDouble.length > 0) {
    console.log('\nBreakdown of page types in extracted pagesDouble:')
    const typeCounts = {}
    pagesDouble.forEach(p => {
      typeCounts[p.type] = (typeCounts[p.type] || 0) + 1
    })
    console.log(typeCounts)
    console.log('\nSample extracted items:')
    pagesDouble.slice(0, 5).forEach(p => {
      console.log(`- [${p.type}] (${p.post_type}) Title: "${p.title}" | URL: ${p.url}`)
    })
  }
}

traceAscentPackage()
