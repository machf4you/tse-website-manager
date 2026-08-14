async function testDeployer() {
  console.log('=== TESTING DEPLOYER ENDPOINTS ===\n')

  const urls = [
    'https://deploy.thesearchequation.co.uk/',
    'https://deploy.thesearchequation.co.uk/status',
    'https://deploy.thesearchequation.co.uk/health',
    'https://api-website-manager.thesearchequation.co.uk/deploy',
    'https://api-website-manager.thesearchequation.co.uk/restart'
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url)
      console.log(`[${url}] Status: ${res.status} ${res.statusText}`)
      const text = await res.text()
      console.log(`  Body:`, text.slice(0, 200))
    } catch (e) {
      console.log(`[${url}] Exception:`, e.message)
    }
    console.log('---')
  }
}

testDeployer()
