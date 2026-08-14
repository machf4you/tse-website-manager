async function checkLiveDeployment() {
  console.log('=== CHECKING LIVE FRONTEND HOST DEPLOYMENT ===')
  try {
    const res = await fetch('https://machf4you.github.io/tse-website-manager/', { cache: 'no-store' })
    const html = await res.text()

    const match = html.match(/index-[A-Za-z0-9_-]+\.js/)
    const currentBundle = match ? match[0] : 'Unknown'

    console.log('Live index.html Bundle:', currentBundle)
    console.log('Expected v9.3 Bundle: index-8jS2szKW.js')

    if (currentBundle === 'index-8jS2szKW.js') {
      console.log('\nLIVE SITE IS UP TO DATE! (v9.3 is live now)')
    } else {
      console.log('\nLIVE SITE IS STILL BUILDING/DEPLOYING ON HOST (Wait ~30-60 seconds)')
    }
  } catch (e) {
    console.error('Error checking live deployment:', e.message)
  }
}

checkLiveDeployment()
