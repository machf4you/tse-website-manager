async function getStoredToken() {
  const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites')
  const sites = await res.json()

  console.log('=== STORED WEBSITES ON PROD API ===')
  sites.forEach(s => {
    console.log(`ID: "${s.id}" | Name: "${s.name}" | Platform: "${s.platform}"`)
    console.log('  wpUser:', s.wpUser)
    console.log('  wpPass:', s.wpPass)
    console.log('  config_data (raw):', s.config_data)
    console.log('  configData (obj):', s.configData)
  })
}

getStoredToken()
