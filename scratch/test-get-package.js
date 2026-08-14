async function testGetPackage() {
  console.log('=== TESTING GET /api/websites/1786704253814/package ===\n')

  try {
    const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites/1786704253814/package')
    console.log('Status:', res.status, res.statusText)
    console.log('Content-Type:', res.headers.get('content-type'))
    const data = await res.json()
    console.log('JSON Output:', JSON.stringify(data).slice(0, 300))
  } catch (e) {
    console.error('Exception:', e.message)
  }
}

testGetPackage()
