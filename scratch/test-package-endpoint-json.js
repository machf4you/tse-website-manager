async function testPackageEndpoint() {
  console.log('=== TESTING POST /api/websites/1786704253814/package ===\n')

  try {
    const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites/1786704253814/package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        packageData: {
          site_info: { url: 'https://www.hf4you.co.uk', platform: 'magento' },
          pages: [
            { id: 'cms-home', title: 'HF4You Home', url: 'https://www.hf4you.co.uk', type: 'Hub' }
          ]
        }
      })
    })

    console.log('Status:', res.status, res.statusText)
    console.log('Content-Type:', res.headers.get('content-type'))
    const data = await res.json()
    console.log('JSON Output:', JSON.stringify(data).slice(0, 300))
  } catch (e) {
    console.error('Exception:', e.message)
  }
}

testPackageEndpoint()
