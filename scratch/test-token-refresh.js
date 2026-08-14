async function testTokenRefresh() {
  console.log('=== TESTING MAGENTO ADMIN TOKEN AUTHENTICATION ===\n')

  const username = 'adminuser'
  // Let's test POST to token endpoint
  const tokenEndpoints = [
    'https://www.hf4you.co.uk/rest/all/V1/integration/admin/token',
    'https://www.hf4you.co.uk/rest/default/V1/integration/admin/token',
    'https://www.hf4you.co.uk/rest/V1/integration/admin/token'
  ]

  for (const ep of tokenEndpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          password: 'the_real_password_if_provided'
        })
      })
      console.log(`[${ep}] Status: ${res.status} ${res.statusText}`)
      console.log(`  Body:`, (await res.text()).slice(0, 200))
    } catch (e) {
      console.log(`[${ep}] Exception:`, e.message)
    }
  }
}

testTokenRefresh()
