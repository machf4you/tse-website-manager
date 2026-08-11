import { getWebsitesApi } from '../src/services/websiteManagerApi.js'
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'server', 'website_manager.db')

async function traceModalRuntimePayload() {
  console.log('=== TRACING RUNTIME PAGE OBJECT IN PAGE AUDIT RESULTS PAGE ===\n')

  let sites = await getWebsitesApi()
  const site = sites.find(s => (s.name || '').toLowerCase().includes('ascent') || (s.url || '').toLowerCase().includes('ascent'))

  if (!fs.existsSync(dbPath)) {
    console.log('DB missing')
    return
  }

  const db = new Database(dbPath)
  const pkgRow = db.prepare(`SELECT * FROM wp_packages WHERE site_id = ?`).get(site?.id || '1')
  if (!pkgRow) {
    console.log('No package row found')
    return
  }

  const pkgData = JSON.parse(pkgRow.package_data)
  const rawPkg = pkgData.packageData || pkgData
  const pages = rawPkg.pages || []

  const walton = pages.find(p => (p.url || p.link || '').includes('walton-on-thames'))

  console.log('1. Raw Walton Page object in package:')
  console.log(JSON.stringify(walton, null, 2))

  console.log('\n2. Evaluating ID fields:')
  console.log('   - walton.id:', walton?.id)
  console.log('   - walton.ID:', walton?.ID)
  console.log('   - walton.pageId:', walton?.pageId)
  console.log('   - targetPageId evaluated by modal (page?.id || page?.ID):', walton?.id || walton?.ID)
  console.log('   - postType evaluated by modal (page?.post_type || page?.type || "pages"):', walton?.post_type || walton?.type || 'pages')
}

traceModalRuntimePayload()
