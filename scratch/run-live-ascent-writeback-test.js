import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { updateWordPressSEOFields } from '../src/services/wordpressApi.js'
import { getWebsitesApi } from '../src/services/websiteManagerApi.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'server', 'website_manager.db')

async function executeLiveAscentWriteback() {
  console.log('====================================================')
  console.log('  LIVE ASCENT BUILDERS WRITE-BACK TEST (PAGE 2523)  ')
  console.log('====================================================\n')

  let wpUser = ''
  let wpPass = ''
  let websiteUrl = 'https://www.ascentbuilders.co.uk'

  // 1. Check getWebsitesApi / SQLite
  try {
    const sites = await getWebsitesApi()
    console.log(`Found ${sites.length} sites via getWebsitesApi():`)
    const ascent = sites.find(s => (s.name || '').toLowerCase().includes('ascent') || (s.url || '').toLowerCase().includes('ascent'))
    if (ascent) {
      console.log(`  Ascent Site Found! (ID: ${ascent.id})`)
      wpUser = ascent.wpUser || ascent.connectedUser || ''
      wpPass = ascent.wpPass || ''
      if (ascent.url) websiteUrl = ascent.url
    }
  } catch (e) {
    console.error('getWebsitesApi error:', e.message)
  }

  // 2. Fallback check directly in SQLite DB
  if (!wpPass && fs.existsSync(dbPath)) {
    try {
      const db = new Database(dbPath)
      const rows = db.prepare(`SELECT * FROM websites`).all()
      const ascentRow = rows.find(r => (r.name || '').toLowerCase().includes('ascent') || (r.url || '').toLowerCase().includes('ascent'))
      if (ascentRow && ascentRow.config_data) {
        const cfg = JSON.parse(ascentRow.config_data)
        wpUser = wpUser || cfg.wpUser || cfg.connectedUser || ''
        wpPass = wpPass || cfg.wpPass || ''
        if (ascentRow.url) websiteUrl = ascentRow.url
      }
    } catch (e) {}
  }

  console.log('Credentials Summary:')
  console.log('  - Website URL:', websiteUrl)
  console.log('  - Target Page ID: 2523')
  console.log('  - Target Page URL: https://www.ascentbuilders.co.uk/loft-conversions-walton-on-thames/')
  console.log('  - wpUser:', wpUser || '[NOT SET]')
  console.log('  - wpPass:', wpPass ? `[STORED - Length ${wpPass.length}]` : '[NOT SET]')

  const testMetaTitle = 'Loft Conversions Walton-On-Thames | Ascent Builders Test'

  console.log(`\nExecuting updateWordPressSEOFields() with metaTitle: "${testMetaTitle}"...`)

  const result = await updateWordPressSEOFields({
    websiteUrl,
    username: wpUser,
    applicationPassword: wpPass,
    pageId: 2523,
    postType: 'pages',
    metaTitle: testMetaTitle,
  })

  console.log('\n====================================================')
  console.log('  WRITE-BACK RESPONSE REPORT  ')
  console.log('====================================================')
  console.log('1. Endpoint Used:', result.endpoint)
  console.log('2. HTTP Status:', result.status)
  console.log('3. Success Flag:', result.success ? 'ACCEPTED ✓' : 'FAILED ✗')
  console.log('4. Fields Updated:', result.fieldsUpdated)
  console.log('5. Response Data Payload:', JSON.stringify(result.responseData || {}, null, 2))

  // 3. Verify Live Page Data from WordPress REST API
  console.log('\n====================================================')
  console.log('  LIVE WORDPRESS DATA VERIFICATION  ')
  console.log('====================================================')
  try {
    const liveRes = await fetch('https://www.ascentbuilders.co.uk/wp-json/wp/v2/pages/2523')
    if (liveRes.ok) {
      const liveData = await liveRes.json()
      console.log('Live Page Object Read:')
      console.log('  - Post ID:', liveData.id)
      console.log('  - Post Title (rendered):', liveData.title?.rendered)
      console.log('  - Yoast Meta Title (yoast_head_json):', liveData.yoast_head_json?.title)
      console.log('  - Yoast Meta Description (yoast_head_json):', liveData.yoast_head_json?.og_description || liveData.yoast_head_json?.description)
      console.log('  - Raw Meta Object:', liveData.meta)
      
      const titleMatches = (liveData.yoast_head_json?.title || '').includes('Ascent Builders Test') || (liveData.meta?._yoast_wpseo_title === testMetaTitle)
      console.log(`\nVERIFICATION STATUS: ${titleMatches ? 'PASSED ✓ Live WordPress data updated!' : 'CHECK DETAILED PAYLOAD ABOVE'}`)
    } else {
      console.error('Failed to fetch live page status:', liveRes.status)
    }
  } catch (e) {
    console.error('Live verification fetch exception:', e.message)
  }
}

executeLiveAscentWriteback()
