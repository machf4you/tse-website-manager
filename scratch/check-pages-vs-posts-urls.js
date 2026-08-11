import { extractPagesFromPackage, extractPostsFromPackage } from '../src/utils/packageExtractor.js'

async function checkDuplicates() {
  const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites/1/package')
  const json = await res.json()

  let pkg = json
  if (pkg.packageData) pkg = typeof pkg.packageData === 'string' ? JSON.parse(pkg.packageData) : pkg.packageData
  if (pkg.packageData) pkg = typeof pkg.packageData === 'string' ? JSON.parse(pkg.packageData) : pkg.packageData

  const rawPages = pkg.pages || []
  const rawPosts = pkg.posts || []

  console.log(`rawPages count: ${rawPages.length}`)
  console.log(`rawPosts count: ${rawPosts.length}`)

  const postUrls = new Set(rawPosts.map(p => (p.link || p.url || '').toLowerCase()))

  const matchesInPages = rawPages.filter(page => {
    const pageUrl = (page.link || page.url || '').toLowerCase()
    return postUrls.has(pageUrl)
  })

  console.log(`Matches of posts inside rawPages: ${matchesInPages.length}`)
  if (matchesInPages.length > 0) {
    console.log('Sample matched item inside rawPages:', {
      title: matchesInPages[0].title,
      url: matchesInPages[0].link || matchesInPages[0].url,
      type: matchesInPages[0].type,
      post_type: matchesInPages[0].post_type
    })
  }

  const allExtracted = extractPagesFromPackage(json)
  console.log(`\nTotal extracted by extractPagesFromPackage: ${allExtracted.length}`)
  const typeCounts = {}
  allExtracted.forEach(p => { typeCounts[p.type] = (typeCounts[p.type] || 0) + 1 })
  console.log('Type breakdown:', typeCounts)
}

checkDuplicates()
