async function fixLiveProdAscentCreds() {
  console.log('=== UPDATING ASCENT BUILDERS CREDENTIALS ON PRODUCTION API ===')

  const prodUrl = 'https://api-website-manager.thesearchequation.co.uk/api/websites'

  const res = await fetch(prodUrl)
  const sites = await res.json()
  const ascentSite = sites.find(s => s.id === '1' || s.name?.includes('Ascent'))

  if (!ascentSite) {
    console.error('Ascent Builders site not found on production!')
    return
  }

  console.log('Found Ascent site on PROD:', ascentSite.id, ascentSite.name)

  const updatedSite = {
    ...ascentSite,
    wpUser: 'manager',
    wpPass: 'Pcqf n3tZ fq72 hL6p mOQe',
    configData: {
      ...(ascentSite.configData || {}),
      wpUser: 'manager',
      wpPass: 'Pcqf n3tZ fq72 hL6p mOQe'
    }
  }

  const saveRes = await fetch(prodUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedSite)
  })

  console.log(`Save Response Status: ${saveRes.status} ${saveRes.statusText}`)
  console.log('Save Response Body:', await saveRes.text())

  // Verify
  const verifyRes = await fetch(prodUrl)
  const verifySites = await verifyRes.json()
  const verifyAscent = verifySites.find(s => s.id === '1' || s.name?.includes('Ascent'))
  console.log('\nVerified Ascent site on PROD:', {
    id: verifyAscent.id,
    name: verifyAscent.name,
    wpUser: verifyAscent.wpUser || verifyAscent.configData?.wpUser,
    hasWpPass: Boolean(verifyAscent.wpPass || verifyAscent.configData?.wpPass)
  })
}

fixLiveProdAscentCreds()
