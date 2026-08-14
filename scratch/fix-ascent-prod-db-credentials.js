async function fixAscentProdDbCredentials() {
  console.log('=== UPDATING ASCENT BUILDERS SITE ID "1" IN PROD SQLITE DB ===')

  const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites')
  const sites = await res.json()

  const ascent = sites.find(s => s.id === '1' || s.name === 'Ascent Builders')
  if (!ascent) {
    console.error('Ascent Builders site not found!')
    return
  }

  const payload = {
    ...ascent,
    wpUser: 'manager',
    wpPass: 'Pcqf n3tZ fq72 hL6p mOQe',
    connectedUser: 'manager',
    configData: {
      wpUser: 'manager',
      wpPass: 'Pcqf n3tZ fq72 hL6p mOQe',
      connectedUser: 'manager'
    }
  }

  const updateRes = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  console.log('Update Status:', updateRes.status, updateRes.statusText)
  console.log('Update Body:', await updateRes.text())

  // Verify
  const verifyRes = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites')
  const verifySites = await verifyRes.json()
  const verifyAscent = verifySites.find(s => s.id === '1')

  console.log('\nVerified Site #2 (Ascent Builders) on PROD API:')
  console.log('  ID:', verifyAscent.id)
  console.log('  config_data (raw):', verifyAscent.config_data)
  console.log('  configData (obj):', verifyAscent.configData)
}

fixAscentProdDbCredentials()
