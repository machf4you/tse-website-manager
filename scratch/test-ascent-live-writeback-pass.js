import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { updateWordPressSEOFields } from '../src/services/wordpressApi.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'server', 'website_manager.db')

async function runStage2ARealWritebackTest() {
  console.log('====================================================')
  console.log('  STAGE 2A WRITE-BACK TEST: ASCENT BUILDERS PAGE 2523  ')
  console.log('====================================================\n')

  let wpUser = ''
  let wpPass = ''
  let websiteUrl = 'https://www.ascentbuilders.co.uk'

  // 1. Check local SQLite DB for Ascent Builders credentials
  if (fs.existsSync(dbPath)) {
    const db = new Database(dbPath)
    const sites = db.prepare(`SELECT * FROM websites`).all()
    const ascent = sites.find(s => (s.name || '').toLowerCase().includes('ascent') || (s.url || '').toLowerCase().includes('ascent'))
    if (ascent && ascent.config_data) {
      try {
        const cfg = JSON.parse(ascent.config_data)
        wpUser = cfg.wpUser || cfg.connectedUser || ''
        wpPass = cfg.wpPass || ''
        if (ascent.url) websiteUrl = ascent.url
      } catch (e) {}
    }
  }

  // 2. Check Production API for Ascent Builders credentials
  if (!wpPass) {
    try {
      const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites')
      if (res.ok) {
        const apiSites = await res.json()
        const ascentApi = apiSites.find(s => (s.name || '').toLowerCase().includes('ascent') || (s.url || '').toLowerCase().includes('ascent'))
        if (ascentApi) {
          const cfg = ascentApi.configData || {}
          wpUser = ascentApi.wpUser || ascentApi.connectedUser || cfg.wpUser || ''
          wpPass = ascentApi.wpPass || cfg.wpPass || ''
          if (ascentApi.url) websiteUrl = ascentApi.url
        }
      }
    } catch (e) {}
  }

  console.log('Target Page Selected:')
  console.log('  - Page ID: 2523')
  console.log('  - URL: https://www.ascentbuilders.co.uk/loft-conversions-walton-on-thames/')
  console.log('  - Stored wpUser:', wpUser || '[NOT SET IN DB - NEEDS APPLICATION PASSWORD]')
  console.log('  - Stored wpPass:', wpPass ? `[STORED - Length ${wpPass.length}]` : '[NOT SET IN DB - NEEDS APPLICATION PASSWORD]')

  const testTitle = 'Loft Conversions Walton-On-Thames | Ascent Builders'

  console.log('\nExecuting updateWordPressSEOFields()...')
  const result = await updateWordPressSEOFields({
    websiteUrl,
    username: wpUser || 'admin',
    applicationPassword: wpPass || 'placeholder_pass',
    pageId: 2523,
    postType: 'pages',
    metaTitle: testTitle,
  })

  console.log('\n====================================================')
  console.log('  TEST RESULTS REPORT  ')
  console.log('====================================================')
  console.log('1. Endpoint Used:', result.endpoint)
  console.log('2. HTTP Response Status:', result.status || 'N/A')
  console.log('3. Success Status:', result.success ? 'ACCEPTED ✓' : 'REJECTED / AUTH REQUIRED ✗')
  console.log('4. Fields Sent:', result.fieldsUpdated)
  console.log('5. Raw Response Data:', JSON.stringify(result.responseData || {}, null, 2))

  // Fetch live page to check if title changed
  console.log('\n6. Checking Live WordPress Page Data via GET /wp-json/wp/v2/pages/2523...')
  try {
    const liveRes = await fetch('https://www.ascentbuilders.co.uk/wp-json/wp/v2/pages/2523')
    if (liveRes.ok) {
      const liveData = await liveRes.json()
      console.log('   - Live Page Title (rendered):', liveData.title?.rendered)
      console.log('   - Live Yoast Title (yoast_head_json):', liveData.yoast_head_json?.title || 'N/A')
      console.log('   - Live Yoast Description:', liveData.yoast_head_json?.og_description || liveData.yoast_head_json?.description || 'N/A')
    }
  } catch (e) {
    console.error('Failed to fetch live page data:', e.message)
  }
}

runStage2ARealWritebackTest()
