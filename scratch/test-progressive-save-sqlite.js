async function testProgressiveSave() {
  console.log('=== TESTING PROGRESSIVE SAVE TO SQLITE BACKEND ===')

  const draftSite = {
    id: 'test-magento-draft-1',
    name: 'HF4You Partial Draft',
    url: 'https://www.hf4you.co.uk',
    platform: 'magento',
    portfolio: 'tse',
    wpUser: 'adminuser',
    wpPass: '', // empty password field (7 of 9 filled)
    connectedUser: 'adminuser',
    lifecycleStage: 2,
    topIndicator: 'pending',
    syncStatus: 'Draft Saved',
    configData: {
      wpUser: 'adminuser',
      wpPass: '',
      connectedUser: 'adminuser',
      mgBackendUrl: 'https://www.hf4you.co.uk/admin',
      apiBaseUrl: 'https://www.hf4you.co.uk/rest/all/V1',
      mgStore: 'default'
    }
  }

  // 1. Save draft
  const saveRes = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draftSite)
  })
  console.log('1. Save Draft Response:', saveRes.status, await saveRes.json())

  // 2. Fetch all sites back from SQLite
  const fetchRes = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites')
  const sites = await fetchRes.json()
  const found = sites.find(s => s.id === 'test-magento-draft-1')

  console.log('2. Retrieved Draft from Production API:')
  console.log('  ID:', found?.id)
  console.log('  Name:', found?.name)
  console.log('  URL:', found?.url)
  console.log('  Config Data:', found?.configData || found?.config_data)

  if (found && found.name === 'HF4You Partial Draft') {
    console.log('\nSUCCESS: Progressive save to SQLite database verified!')
  } else {
    console.error('\nFAILURE: Draft record not found or incomplete!')
  }
}

testProgressiveSave()
