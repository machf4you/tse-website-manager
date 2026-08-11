async function inspectDeepPackage() {
  const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites/1/package')
  const json = await res.json()
  console.log('Top JSON:', Object.keys(json))

  let p = json
  let depth = 0
  while (p && (p.packageData || p.package_data) && depth < 5) {
    depth++
    console.log(`Unwrapping layer ${depth}...`)
    const raw = p.packageData || p.package_data
    p = typeof raw === 'string' ? JSON.parse(raw) : raw
    console.log(`Layer ${depth} keys:`, Object.keys(p))
  }

  console.log('\n--- FINAL UNWRAPPED PACKAGE ---')
  console.log('Final keys:', Object.keys(p))
  
  if (p.pages) console.log('p.pages count:', Array.isArray(p.pages) ? p.pages.length : typeof p.pages)
  if (p.posts) console.log('p.posts count:', Array.isArray(p.posts) ? p.posts.length : typeof p.posts)
  
  if (p.pages && Array.isArray(p.pages) && p.pages.length > 0) {
    console.log('\nSample page item:', p.pages[0])
    console.log('Page post_types:', [...new Set(p.pages.map(x => x.post_type || x.type))])
  }

  if (p.posts && Array.isArray(p.posts) && p.posts.length > 0) {
    console.log('\nSample post item:', p.posts[0])
    console.log('Post post_types:', [...new Set(p.posts.map(x => x.post_type || x.type))])
  } else {
    console.log('\nNO `posts` array found on final package object!')
  }
}

inspectDeepPackage()
