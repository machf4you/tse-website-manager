import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { getWebsitesApi } from '../src/services/websiteManagerApi.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'server', 'website_manager.db')

async function inspectModalPayloadVsTest() {
  console.log('=== INVESTIGATING W4 MODAL PAYLOAD vs STAGE 2A TEST PAYLOAD ===\n')

  let sites = []
  try {
    sites = await getWebsitesApi()
  } catch (e) {}

  const ascentSite = sites.find(s => (s.name || '').toLowerCase().includes('ascent') || (s.url || '').toLowerCase().includes('ascent'))

  console.log('1. SITE OBJECT:')
  console.log('   - site.id:', ascentSite?.id)
  console.log('   - site.name:', ascentSite?.name)
  console.log('   - site.url:', ascentSite?.url)
  console.log('   - site.wpUser / connectedUser:', ascentSite?.wpUser || ascentSite?.connectedUser)
  console.log('   - site.wpPass exists:', Boolean(ascentSite?.wpPass))

  // Check stored package for Ascent Builders to see real page ID and url
  if (fs.existsSync(dbPath)) {
    const db = new Database(dbPath)
    const pkgRow = db.prepare(`SELECT * FROM wp_packages WHERE site_id = ?`).get(ascentSite?.id || '1')
    if (pkgRow && pkgRow.package_data) {
      try {
        const pkgObj = JSON.parse(pkgRow.package_data)
        const rawPkg = pkgObj.packageData || pkgObj
        const pages = rawPkg.pages || []
        console.log(`\n2. STORED PACKAGE PAGES (${pages.length} total):`)
        const waltonPage = pages.find(p => (p.url || p.link || '').includes('walton-on-thames'))
        if (waltonPage) {
          console.log('   - Walton Page in Package:')
          console.log('     * id:', waltonPage.id, '(Type:', typeof waltonPage.id, ')')
          console.log('     * ID:', waltonPage.ID)
          console.log('     * post_type / type:', waltonPage.post_type || waltonPage.type)
          console.log('     * url / link:', waltonPage.url || waltonPage.link)
          console.log('     * title:', waltonPage.title?.rendered || waltonPage.title)
        }
      } catch (e) {
        console.error('Error parsing package_data:', e.message)
      }
    }
  }

  console.log('\n3. COMPARISON CHECK:')
  console.log('   Stage 2A Test Sent:')
  console.log('     - pageId: 2523 (Number)')
  console.log('     - postType: "pages"')
  console.log('     - metaTitle: "Loft Conversions Walton-On-Thames | Ascent Builders Test"')
  console.log('     - metaDescription: undefined (not sent)')
  console.log('     - meta payload sent to WP:', { _yoast_wpseo_title: '...', rank_math_title: '...', _aioseop_title: '...' })
}

inspectModalPayloadVsTest()
