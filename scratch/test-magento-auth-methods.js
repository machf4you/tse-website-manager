async function testAuthMethods() {
  const token = 'eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ.eyJ1aWQiOjQ5LCJ1dHlwaWQiOjIsImlhdCI6MTc4NjcwMjg1OCwiZXhwIjoxNzg2NzA2NDU4fQ.lQBc2t-7bO0a1PcjFyw1ryoLilgrkHd4VF59v0lk'

  console.log('=== TESTING MAGENTO AUTHENTICATION METHODS ===\n')

  // 1. Test Bearer token
  console.log('1. Testing Bearer token header:')
  try {
    const res1 = await fetch('https://www.hf4you.co.uk/rest/all/V1/categories', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    console.log('  Status:', res1.status, await res1.text())
  } catch (e) { console.log('  Error:', e.message) }

  // 2. Test Token as query parameter or alternative header
  console.log('\n2. Testing Token via query param or header:')
  try {
    const res2 = await fetch('https://www.hf4you.co.uk/rest/all/V1/categories?token=' + encodeURIComponent(token), {
      headers: { 'Accept': 'application/json' }
    })
    console.log('  Status:', res2.status, await res2.text())
  } catch (e) { console.log('  Error:', e.message) }

  // 3. Test Integration token vs Admin token POST
  console.log('\n3. Testing admin token POST endpoint:')
  try {
    const res3 = await fetch('https://www.hf4you.co.uk/rest/all/V1/integration/admin/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ username: 'adminuser', password: token })
    })
    console.log('  Status:', res3.status, await res3.text())
  } catch (e) { console.log('  Error:', e.message) }
}

testAuthMethods()
