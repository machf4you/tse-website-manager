async function investigate() {
  const targetUrl = 'https://www.hf4you.co.uk/wp-json/tse-site-exporter/v1/export'
  const targetUrlSlash = 'https://www.hf4you.co.uk/wp-json/tse-site-exporter/v1/export/'
  const nonWwwUrl = 'https://hf4you.co.uk/wp-json/tse-site-exporter/v1/export'

  console.log('=== INVESTIGATING HF4YOU EXPORTER ENDPOINT REDIRECTS ===\n')

  const urlsToTest = [
    { label: 'Original URL (no slash)', url: targetUrl },
    { label: 'URL with Trailing Slash', url: targetUrlSlash },
    { label: 'Non-www URL', url: nonWwwUrl }
  ]

  for (const item of urlsToTest) {
    console.log(`--- Testing: ${item.label} (${item.url}) ---`)
    
    // 1. OPTIONS Preflight (redirect: 'manual')
    try {
      const optRes = await fetch(item.url, {
        method: 'OPTIONS',
        redirect: 'manual',
        headers: {
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization,content-type',
          'Origin': 'https://tse-website-manager.thesearchequation.co.uk'
        }
      })
      console.log(`  OPTIONS Status: ${optRes.status} ${optRes.statusText}`)
      console.log(`  OPTIONS Location Header: ${optRes.headers.get('location') || 'NONE'}`)
      console.log(`  OPTIONS Access-Control-Allow-Origin: ${optRes.headers.get('access-control-allow-origin') || 'NONE'}`)
      console.log(`  OPTIONS Server: ${optRes.headers.get('server') || 'NONE'}`)
    } catch (e) {
      console.log(`  OPTIONS Exception: ${e.message}`)
    }

    // 2. GET Request (redirect: 'manual')
    try {
      const getRes = await fetch(item.url, {
        method: 'GET',
        redirect: 'manual'
      })
      console.log(`  GET Status: ${getRes.status} ${getRes.statusText}`)
      console.log(`  GET Location Header: ${getRes.headers.get('location') || 'NONE'}`)
      console.log(`  GET Server: ${getRes.headers.get('server') || 'NONE'}`)
    } catch (e) {
      console.log(`  GET Exception: ${e.message}`)
    }

    console.log('\n')
  }
}

investigate()
