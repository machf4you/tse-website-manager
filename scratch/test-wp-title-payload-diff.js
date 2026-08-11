import { getWebsitesApi } from '../src/services/websiteManagerApi.js'

async function testWpTitlePayloadDiff() {
  console.log('=== TESTING WORDPRESS PAGE TITLE vs META PAYLOAD DIFFERENCE ===\n')

  const sites = await getWebsitesApi()
  const ascent = sites.find(s => (s.name || '').toLowerCase().includes('ascent') || (s.url || '').toLowerCase().includes('ascent'))

  const user = ascent.wpUser || ascent.connectedUser
  const pass = ascent.wpPass
  const url = 'https://www.ascentbuilders.co.uk'
  const authHeader = 'Basic ' + btoa(`${user}:${pass}`)

  console.log('Site URL:', url)
  console.log('User:', user)
  console.log('Pass exists:', Boolean(pass))

  const newTestTitle = 'Loft Conversions Walton-On-Thames | Ascent Builders Test Title'

  console.log('\n--- TEST 1: Sending root { title } + { meta } to POST /wp-json/wp/v2/pages/2523 ---')

  try {
    const res = await fetch(`${url}/wp-json/wp/v2/pages/2523`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        title: newTestTitle,
        meta: {
          _yoast_wpseo_title: newTestTitle,
          rank_math_title: newTestTitle,
          _aioseop_title: newTestTitle,
        }
      })
    })

    console.log('Response Status:', res.status, res.statusText)
    const data = await res.json()
    console.log('Returned Page Title (rendered):', data.title?.rendered)
    console.log('Returned Yoast Title (yoast_head_json):', data.yoast_head_json?.title)

    console.log('\n--- VERIFYING LIVE PUBLIC GET ---')
    const checkRes = await fetch(`${url}/wp-json/wp/v2/pages/2523`)
    const checkData = await checkRes.json()
    console.log('Public GET Title (rendered):', checkData.title?.rendered)
    console.log('Public GET Yoast Title (yoast_head_json):', checkData.yoast_head_json?.title)

  } catch (e) {
    console.error('Test error:', e.message)
  }
}

testWpTitlePayloadDiff()
