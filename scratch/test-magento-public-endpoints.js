async function testPublicEndpoints() {
  console.log('=== TESTING GUEST / ANONYMOUS MAGENTO REST API ENDPOINTS ===\n')

  const urls = [
    'https://www.hf4you.co.uk/rest/all/V1/categories',
    'https://www.hf4you.co.uk/rest/default/V1/categories',
    'https://www.hf4you.co.uk/rest/V1/categories',
    'https://www.hf4you.co.uk/rest/all/V1/products?searchCriteria[pageSize]=10',
    'https://www.hf4you.co.uk/rest/default/V1/products?searchCriteria[pageSize]=10',
    'https://www.hf4you.co.uk/rest/V1/store/storeConfigs',
    'https://www.hf4you.co.uk/rest/default/V1/store/storeConfigs',
    'https://www.hf4you.co.uk/rest/all/V1/store/storeConfigs',
    'https://www.hf4you.co.uk/rest/all/V1/tse-site-exporter/export',
    'https://www.hf4you.co.uk/rest/V1/tse-site-exporter/export'
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
      console.log(`[${url}] Status: ${res.status} ${res.statusText}`)
      if (res.ok) {
        const data = await res.json()
        console.log('  SUCCESS Data:', JSON.stringify(data).slice(0, 200))
      } else {
        const text = await res.text()
        console.log('  Error Body:', text.slice(0, 150))
      }
    } catch (e) {
      console.log(`[${url}] Exception:`, e.message)
    }
    console.log('---')
  }
}

testPublicEndpoints()
