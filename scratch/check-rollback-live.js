async function checkRollbackLive() {
  console.log('=== CHECKING RESTORED LIVE DEPLOYMENT ===\n')

  const expectedBundle = '/assets/index-Bxgjvlsv.js'
  let attempts = 0
  const maxAttempts = 12

  while (attempts < maxAttempts) {
    attempts++
    try {
      const res = await fetch(`https://tse-website-manager.thesearchequation.co.uk/?cacheBust=${Date.now()}`)
      const html = await res.text()
      const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/)
      const liveBundle = match ? match[1] : 'Unknown'

      console.log(`[Attempt ${attempts}/${maxAttempts}] Live Bundle: ${liveBundle}`)

      if (liveBundle === expectedBundle) {
        console.log('\nEXACT MATCH CONFIRMED!')
        console.log('Live frontend is serving restored build from tag v1.4-production-persistence-working (6f75ba6)!')

        const healthRes = await fetch('https://api-website-manager.thesearchequation.co.uk/api/health')
        console.log('Production API Health Status:', healthRes.status, healthRes.statusText)
        const healthData = await healthRes.json()
        console.log('Production API Health Payload:', healthData)

        return
      }
    } catch (e) {
      console.error('Fetch error:', e.message)
    }

    await new Promise(r => setTimeout(r, 4000))
  }

  console.log('\nDeployment still updating on host...')
}

checkRollbackLive()
