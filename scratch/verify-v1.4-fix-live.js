async function verifyV14FixLive() {
  console.log('=== VERIFYING LIVE DEPLOYMENT OF V1.4 FIX ===\n')

  const expectedBundle = '/assets/index-D-WZJNat.js'
  let attempts = 0
  const maxAttempts = 15

  while (attempts < maxAttempts) {
    attempts++
    try {
      const res = await fetch(`https://tse-website-manager.thesearchequation.co.uk/?t=${Date.now()}`)
      const html = await res.text()
      const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/)
      const liveBundle = match ? match[1] : 'Unknown'

      console.log(`[Attempt ${attempts}/${maxAttempts}] Live Bundle: ${liveBundle}`)

      if (liveBundle === expectedBundle) {
        console.log('\nEXACT MATCH CONFIRMED!')
        console.log('Live web host is serving the new commit bundle b3916d1 (/assets/index-D-WZJNat.js)!')

        const healthRes = await fetch('https://api-website-manager.thesearchequation.co.uk/api/health')
        console.log('Production API Health:', healthRes.status, healthRes.statusText)

        return true
      }
    } catch (e) {
      console.error('Fetch error:', e.message)
    }

    await new Promise(r => setTimeout(r, 4000))
  }

  console.log('\nDeployment still updating on host...')
  return false
}

verifyV14FixLive()
