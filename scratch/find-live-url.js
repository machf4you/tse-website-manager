async function testUrls() {
  const urls = [
    'https://machf4you.github.io/tse-website-manager/',
    'https://tse-website-manager.thesearchequation.co.uk/',
    'http://localhost:5173'
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const html = await res.text()
      const match = html.match(/index-[A-Za-z0-9_-]+\.js/)
      console.log(`[${url}] Status: ${res.status} | Bundle: ${match ? match[0] : 'None'}`)
    } catch (e) {
      console.log(`[${url}] Error: ${e.message}`)
    }
  }
}

testUrls()
