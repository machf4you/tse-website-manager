async function diagnoseHf4youW2Calls() {
  console.log('=== DIAGNOSING HF4YOU MAGENTO W2 API CALLS ===\n')

  // 1. Fetch HF4You record from production SQLite API
  const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites')
  const sites = await res.json()

  const hf4you = sites.find(s => s.name === 'HF4You' || s.platform === 'magento')

  if (!hf4you) {
    console.error('HF4You site record not found on API!')
    return
  }

  console.log('Stored Site Record:')
  console.log('  ID:', hf4you.id)
  console.log('  Name:', hf4you.name)
  console.log('  URL:', hf4you.url)
  console.log('  Platform:', hf4you.platform)
  console.log('  wpUser (username):', hf4you.wpUser || hf4you.configData?.wpUser)
  console.log('  wpPass (token present?):', Boolean(hf4you.wpPass || hf4you.configData?.wpPass))
  console.log('  configData:', JSON.stringify(hf4you.configData))

  const cfg = hf4you.configData || {}
  const token = hf4you.wpPass || cfg.wpPass || ''
  const apiBaseUrl = cfg.apiBaseUrl || `${hf4you.url}/rest/all/V1`
  const storeCode = cfg.mgStore || 'default'

  console.log('\n--- Magento Connection Parameters ---')
  console.log('  API Base URL:', apiBaseUrl)
  console.log('  Store Code:', storeCode)
  console.log('  Bearer Token (redacted):', token ? `${token.slice(0, 15)}...${token.slice(-10)} (Length: ${token.length})` : 'MISSING')

  // 2. Perform exact HTTP requests made during W2 Sync
  const headers = { 'Accept': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`
  }

  const endpointsToTest = [
    { label: 'Categories Endpoint', url: `${apiBaseUrl.replace(/\/+$/, '')}/categories` },
    { label: 'Products Endpoint', url: `${apiBaseUrl.replace(/\/+$/, '')}/products?searchCriteria[pageSize]=100` },
    { label: 'CMS Pages Endpoint', url: `${apiBaseUrl.replace(/\/+$/, '')}/cmsPage/search?searchCriteria[pageSize]=100` },
    { label: 'Store View Categories Endpoint', url: `https://www.hf4you.co.uk/rest/${storeCode}/V1/categories` },
    { label: 'Store View Products Endpoint', url: `https://www.hf4you.co.uk/rest/${storeCode}/V1/products?searchCriteria[pageSize]=100` },
    { label: 'Store View CMS Pages Endpoint', url: `https://www.hf4you.co.uk/rest/${storeCode}/V1/cmsPage/search?searchCriteria[pageSize]=100` },
  ]

  for (const ep of endpointsToTest) {
    console.log(`\nTesting [${ep.label}]: ${ep.url}`)
    console.log(`  Header Authorization Sent: ${headers['Authorization'] ? 'Yes (Bearer [REDACTED])' : 'No'}`)

    try {
      const response = await fetch(ep.url, { method: 'GET', headers })
      console.log(`  HTTP Status: ${response.status} ${response.statusText}`)

      const text = await response.text()
      console.log(`  Response Body Snippet: ${text.slice(0, 250)}`)

      let json = null
      try { json = JSON.parse(text) } catch (e) {}

      if (json) {
        if (json.items) {
          console.log(`  -> Array 'items' found! Length: ${json.items.length}`)
        } else if (Array.isArray(json)) {
          console.log(`  -> Top-level Array found! Length: ${json.length}`)
        } else if (json.id) {
          console.log(`  -> Root Category Node found! ID: ${json.id}, Name: "${json.name}", Children: ${json.children_data ? json.children_data.length : 0}`)
        } else if (json.message) {
          console.log(`  -> Error Message: "${json.message}"`)
        }
      }
    } catch (e) {
      console.log(`  Exception: ${e.message}`)
    }
  }
}

diagnoseHf4youW2Calls()
