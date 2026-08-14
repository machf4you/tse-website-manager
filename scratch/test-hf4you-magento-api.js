async function testMagentoApi() {
  const token = 'eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ.eyJ1aWQiOjQ5LCJ1dHlwaWQiOjIsImlhdCI6MTc4NjcwMjg1OCwiZXhwIjoxNzg2NzA2NDU4fQ.lQBc2t-7bO0a1PcjFyw1ryoLilgrkHd4VF59v0lk'
  const baseUrl = 'https://www.hf4you.co.uk/rest/all/V1'
  const storeUrl = 'https://www.hf4you.co.uk/rest/default/V1'
  const rootApiUrl = 'https://www.hf4you.co.uk/rest/V1'

  console.log('=== TESTING HF4YOU MAGENTO REST API WITH REAL TOKEN ===\n')

  const endpoints = [
    { name: 'CMS Pages (all)', url: `${baseUrl}/cmsPage/search?searchCriteria[pageSize]=50` },
    { name: 'CMS Pages (default)', url: `${storeUrl}/cmsPage/search?searchCriteria[pageSize]=50` },
    { name: 'Categories (all)', url: `${baseUrl}/categories` },
    { name: 'Categories (default)', url: `${storeUrl}/categories` },
    { name: 'Products (all)', url: `${baseUrl}/products?searchCriteria[pageSize]=50` },
    { name: 'Products (default)', url: `${storeUrl}/products?searchCriteria[pageSize]=50` },
  ]

  for (const ep of endpoints) {
    try {
      const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      const res = await fetch(ep.url, { method: 'GET', headers })
      console.log(`[${ep.name}] (${ep.url})`)
      console.log(`  Status: ${res.status} ${res.statusText}`)
      if (res.ok) {
        const json = await res.json()
        console.log(`  Data Type: ${Array.isArray(json) ? 'Array' : typeof json}`)
        if (json.items) console.log(`  Items Count: ${json.items.length}`)
        else if (Array.isArray(json)) console.log(`  Array Length: ${json.length}`)
        else console.log(`  Keys:`, Object.keys(json))
        
        // Print first 2 sample items
        if (json.items && json.items.length > 0) {
          console.log(`  Sample 1:`, JSON.stringify(json.items[0]).slice(0, 150))
        } else if (Array.isArray(json) && json.length > 0) {
          console.log(`  Sample 1:`, JSON.stringify(json[0]).slice(0, 150))
        } else if (json.id) {
          console.log(`  Category Root ID: ${json.id}, Name: "${json.name}", Children Count: ${json.children_data ? json.children_data.length : 0}`)
        }
      } else {
        const text = await res.text()
        console.log(`  Error Output:`, text.slice(0, 150))
      }
    } catch (e) {
      console.log(`[${ep.name}] Exception:`, e.message)
    }
    console.log('---')
  }
}

testMagentoApi()
