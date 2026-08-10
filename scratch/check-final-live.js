async function checkFinalLive() {
  const res = await fetch(`https://tse-website-manager.thesearchequation.co.uk/?t=${Date.now()}`)
  const html = await res.text()
  const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/)
  const liveBundle = match ? match[1] : 'Unknown'
  console.log('Live Bundle:', liveBundle)

  const healthRes = await fetch('https://api-website-manager.thesearchequation.co.uk/api/health')
  console.log('API Health:', healthRes.status, healthRes.statusText)
}

checkFinalLive()
