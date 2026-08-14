async function testLiveEndpoints() {
  console.log('=== CHECKING LIVE API ENDPOINTS ===')

  const base = 'https://api-website-manager.thesearchequation.co.uk/api'

  console.log('\n1. Testing GET /api/health')
  try {
    const res = await fetch(`${base}/health`)
    console.log(`  -> Status: ${res.status} ${res.statusText}`)
    console.log('  -> Body:', await res.text())
  } catch (e) { console.error(e) }

  console.log('\n2. Testing GET /api/websites')
  try {
    const res = await fetch(`${base}/websites`)
    console.log(`  -> Status: ${res.status} ${res.statusText}`)
    const list = await res.json()
    console.log(`  -> Websites count: ${list.length}`)
  } catch (e) { console.error(e) }

  console.log('\n3. Testing GET /api/websites/1/link-recommendations')
  try {
    const res = await fetch(`${base}/websites/1/link-recommendations`)
    console.log(`  -> Status: ${res.status} ${res.statusText}`)
    console.log('  -> Body:', await res.text())
  } catch (e) { console.error(e) }

  console.log('\n4. Testing GET /api/websites/ascent-builders-prod/link-recommendations')
  try {
    const res = await fetch(`${base}/websites/ascent-builders-prod/link-recommendations`)
    console.log(`  -> Status: ${res.status} ${res.statusText}`)
    console.log('  -> Body:', await res.text())
  } catch (e) { console.error(e) }

  console.log('\n5. Testing POST /api/migrate-localstorage')
  try {
    const res = await fetch(`${base}/migrate-localstorage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sites: [] })
    })
    console.log(`  -> Status: ${res.status} ${res.statusText}`)
    console.log('  -> Body:', await res.text())
  } catch (e) { console.error(e) }
}

testLiveEndpoints()
