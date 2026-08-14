async function testBackendRoutes() {
  console.log('=== TESTING BACKEND ROUTE VARIANTS ===\n')

  const tests = [
    { label: 'GET Health', url: 'https://api-website-manager.thesearchequation.co.uk/api/health', method: 'GET' },
    { label: 'GET Websites', url: 'https://api-website-manager.thesearchequation.co.uk/api/websites', method: 'GET' },
    { label: 'POST Package (existing endpoint)', url: 'https://api-website-manager.thesearchequation.co.uk/api/websites/1786704253814/package', method: 'POST', body: { packageData: { pages: [] } } },
    { label: 'POST magento-sync (ID path)', url: 'https://api-website-manager.thesearchequation.co.uk/api/websites/1786704253814/magento-sync', method: 'POST' },
    { label: 'GET magento-sync (ID path)', url: 'https://api-website-manager.thesearchequation.co.uk/api/websites/1786704253814/magento-sync', method: 'GET' },
    { label: 'POST magento-sync (root path)', url: 'https://api-website-manager.thesearchequation.co.uk/api/magento-sync', method: 'POST' },
    { label: 'POST magento-sync (query param path)', url: 'https://api-website-manager.thesearchequation.co.uk/api/magento-sync?siteId=1786704253814', method: 'POST' }
  ]

  for (const t of tests) {
    try {
      const opts = {
        method: t.method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      }
      if (t.body) opts.body = JSON.stringify(t.body)

      const res = await fetch(t.url, opts)
      console.log(`[${t.label}] (${t.url})`)
      console.log(`  Status: ${res.status} ${res.statusText}`)
      const text = await res.text()
      console.log(`  Content-Type: ${res.headers.get('content-type')}`)
      console.log(`  Body Snippet: ${text.slice(0, 200)}`)
    } catch (e) {
      console.log(`[${t.label}] Exception:`, e.message)
    }
    console.log('---')
  }
}

testBackendRoutes()
