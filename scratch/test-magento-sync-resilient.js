async function testResilientSync() {
  const API_BASE_URL = 'https://api-website-manager.thesearchequation.co.uk/api'
  const targetId = '1786704253814'

  console.log('=== TESTING RESILIENT MAGENTO SYNC BACKEND CALL ===\n')

  try {
    let response = await fetch(`${API_BASE_URL}/websites/${encodeURIComponent(targetId)}/magento-sync`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' }
    })

    console.log(`[Primary Endpoint] Status: ${response.status} ${response.statusText}`)
    const contentType = response.headers.get('content-type') || ''
    console.log(`[Primary Endpoint] Content-Type: ${contentType}`)

    if (!response.ok && (response.status === 404 || contentType.includes('text/html'))) {
      console.log('-> HTML 404 detected on primary endpoint. Triggering live package endpoint fallback...')

      response = await fetch(`${API_BASE_URL}/websites/${encodeURIComponent(targetId)}/package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          action: 'magento_sync',
          packageData: {
            site_info: { url: 'https://www.hf4you.co.uk', platform: 'magento' },
            pages: [
              { id: 'cms-home', title: 'HF4You Home', url: 'https://www.hf4you.co.uk', type: 'Hub' }
            ]
          }
        })
      })

      console.log(`[Fallback Endpoint] Status: ${response.status} ${response.statusText}`)
      console.log(`[Fallback Endpoint] Content-Type: ${response.headers.get('content-type')}`)
    }

    const data = await response.json()
    console.log('\nFinal JSON Received by Client:', JSON.stringify(data).slice(0, 300))
  } catch (e) {
    console.error('Exception:', e.message)
  }
}

testResilientSync()
