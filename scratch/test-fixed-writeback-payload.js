import { updateWordPressSEOFields } from '../src/services/wordpressApi.js'
import { getWebsitesApi } from '../src/services/websiteManagerApi.js'

async function testFixedWritebackPayload() {
  console.log('=== TESTING FIXED WORDPRESS WRITE-BACK PAYLOAD ===\n')

  const sites = await getWebsitesApi()
  const ascent = sites.find(s => (s.name || '').toLowerCase().includes('ascent') || (s.url || '').toLowerCase().includes('ascent'))

  const user = ascent.wpUser || ascent.connectedUser
  const pass = ascent.wpPass
  const websiteUrl = ascent.url || 'https://www.ascentbuilders.co.uk'

  console.log('1. Target Parameters:')
  console.log('   - Site URL:', websiteUrl)
  console.log('   - User:', user)
  console.log('   - Pass Exists:', Boolean(pass))
  console.log('   - Page ID: 2523 (Numeric)')
  console.log('   - Post Type: "pages"')

  const testTitle = 'Loft Conversions Walton-On-Thames | Ascent Builders Test Title V2'
  const testDesc = 'Leading loft conversion and home extension specialists in Walton-On-Thames.'

  console.log('\n2. Calling updateWordPressSEOFields()...')
  const res = await updateWordPressSEOFields({
    websiteUrl,
    username: user,
    applicationPassword: pass,
    pageId: 2523,
    postType: 'pages',
    metaTitle: testTitle,
    metaDescription: testDesc,
  })

  console.log('\n3. Write-Back Result:')
  console.log('   - Success:', res.success ? 'PASSED ✓' : 'FAILED ✗')
  console.log('   - HTTP Status:', res.status)
  console.log('   - Endpoint Used:', res.endpoint)

  console.log('\n4. Verifying Live Public GET /wp-json/wp/v2/pages/2523...')
  const checkRes = await fetch('https://www.ascentbuilders.co.uk/wp-json/wp/v2/pages/2523')
  const checkData = await checkRes.json()

  console.log('   - Rendered Title:', checkData.title?.rendered)
  console.log('   - Yoast Head Title:', checkData.yoast_head_json?.title)

  const titleChanged = checkData.title?.rendered === testTitle || (checkData.title?.rendered || '').includes('V2')
  console.log('\n====================================================')
  console.log(`VERIFICATION RESULT: ${titleChanged ? 'PASSED ✓ Live WordPress Title Successfully Changed!' : 'FAILED ✗'}`)
  console.log('====================================================')
}

testFixedWritebackPayload()
