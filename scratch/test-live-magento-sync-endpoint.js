async function testLiveEndpoint() {
  console.log('=== TESTING LIVE BACKEND ENDPOINT ===\n')

  const urls = [
    'https://api-website-manager.thesearchequation.co.uk/api/websites/1786704253814/magento-sync',
    'https://api-website-manager.thesearchequation.co.uk/api/websites/1/magento-sync'
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      })

      console.log(`[${url}] Status: ${res.status} ${res.statusText}`)
      const text = await res.text()
      console.log('  Content-Type Header:', res.headers.get('content-type'))
      console.log('  Response Snippet:', text.slice(0, 300))
    } catch (e) {
      console.log(`[${url}] Exception:`, e.message)
    }
    console.log('---')
  }
}

testLiveEndpoint()
