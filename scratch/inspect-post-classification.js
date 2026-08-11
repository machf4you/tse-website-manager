import { classifyPageType, normalizeImportedPage } from '../src/utils/packageExtractor.js'

async function inspectPostClassification() {
  const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites/1/package')
  const json = await res.json()
  let pkg = json
  if (pkg.packageData) pkg = typeof pkg.packageData === 'string' ? JSON.parse(pkg.packageData) : pkg.packageData
  if (pkg.packageData) pkg = typeof pkg.packageData === 'string' ? JSON.parse(pkg.packageData) : pkg.packageData

  console.log('Posts count in package:', pkg.posts ? pkg.posts.length : 0)

  if (pkg.posts && pkg.posts.length > 0) {
    pkg.posts.forEach((post, i) => {
      console.log(`\n--- Post #${i + 1} ---`)
      console.log('Title:', post.title?.rendered || post.title || post.meta?.title || post.seo?.title)
      console.log('URL:', post.link || post.url)
      console.log('post.post_type:', post.post_type)
      console.log('post.type:', post.type)

      const normalized = normalizeImportedPage(post, 'https://ascentbuilders.co.uk')
      console.log('Normalized Result:')
      console.log('- normalized.type:', normalized.type)
      console.log('- normalized.seoPageType:', normalized.seoPageType)
      console.log('- normalized.priority:', normalized.priority)
    })
  }
}

inspectPostClassification()
