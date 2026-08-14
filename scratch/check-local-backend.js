async function checkLocalBackend() {
  console.log('=== CHECKING LOCAL BACKEND SERVERS ===')
  
  const localUrls = [
    'http://localhost:3001/api/websites',
    'http://localhost:3001/api/websites/1786704253814/magento-sync',
    'http://localhost:5000/health'
  ]

  for (const url of localUrls) {
    try {
      const res = await fetch(url, { method: url.includes('magento-sync') ? 'POST' : 'GET' })
      console.log(`[${url}] Status: ${res.status} ${res.statusText}`)
      console.log('  Body:', (await res.text()).slice(0, 150))
    } catch (e) {
      console.log(`[${url}] Exception: ${e.message}`)
    }
  }
}

checkLocalBackend()
