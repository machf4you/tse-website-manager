async function inspectLiveSites() {
  const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites')
  const sites = await res.json()
  console.log('LIVE SITES FROM PROD API:', JSON.stringify(sites, null, 2))
}

inspectLiveSites()
