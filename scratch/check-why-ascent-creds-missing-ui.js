async function compareSites() {
  const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites')
  const sites = await res.json()

  console.log('=== COMPARISON OF SITES ON PROD API ===\n')

  sites.forEach((s, idx) => {
    console.log(`[Site #${idx + 1}] ID: "${s.id}" | Name: "${s.name}" | URL: "${s.url}"`)
    console.log('  Top-level wpUser:', s.wpUser)
    console.log('  Top-level wpPass:', s.wpPass)
    console.log('  Top-level connectedUser:', s.connectedUser)
    console.log('  config_data (raw):', s.config_data)
    console.log('  configData (obj):', s.configData)
    console.log('---')
  })
}

compareSites()
