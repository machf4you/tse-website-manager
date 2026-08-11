async function checkProductionPackages() {
  console.log('Checking production backend packages...')
  const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites')
  const sites = await res.json()
  console.log('Production sites:', sites.map(s => ({ id: s.id, name: s.name, url: s.url })))

  for (const s of sites) {
    const pkgRes = await fetch(`https://api-website-manager.thesearchequation.co.uk/api/websites/${s.id}/package`)
    if (pkgRes.ok) {
      const pkgObj = await pkgRes.json()
      const rawPkg = pkgObj.packageData || pkgObj
      const pages = rawPkg.pages || []
      console.log(`Site ID ${s.id} (${s.name}) has ${pages.length} pages in package:`)
      const walton = pages.find(p => (p.url || p.link || '').includes('walton-on-thames'))
      if (walton) {
        console.log('  - Walton Page Object:', JSON.stringify(walton, null, 2))
      }
    } else {
      console.log(`Site ID ${s.id} package endpoint returned ${pkgRes.status}`)
    }
  }
}

checkProductionPackages()
