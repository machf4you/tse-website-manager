async function fetchLiveSites() {
  console.log('Fetching live sites from production API...')
  try {
    const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites')
    if (!res.ok) {
      console.error('API returned status:', res.status)
      return
    }
    const sites = await res.json()
    console.log(`Found ${sites.length} sites:`)
    for (const site of sites) {
      console.log(`\nSite ID: ${site.id} | Name: ${site.name} | URL: ${site.url}`)
      const pkgRes = await fetch(`https://api-website-manager.thesearchequation.co.uk/api/websites/${site.id}/package`)
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json()
        const rawPkg = pkgData.packageData || pkgData
        const pages = rawPkg.pages || []
        const posts = rawPkg.posts || []
        console.log(`  Package hydrated: ${pages.length} pages, ${posts.length} posts`)
        if (pages.length > 0) {
          console.log('  Sample Pages:')
          pages.slice(0, 5).forEach(p => {
            console.log(`    - ID: ${p.id || p.ID} | Title: "${p.title?.rendered || p.post_title || p.title}" | URL: ${p.link || p.url} | PostType: ${p.post_type || p.type}`)
          })
        }
      }
    }
  } catch (e) {
    console.error('Fetch exception:', e.message)
  }
}

fetchLiveSites()
