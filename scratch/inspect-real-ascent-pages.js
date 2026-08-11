import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'server', 'website_manager.db')

if (!fs.existsSync(dbPath)) {
  console.error('DB does not exist at:', dbPath)
  process.exit(1)
}

const db = new Database(dbPath)

const sites = db.prepare(`SELECT * FROM websites`).all()
console.log('=== SITES IN DB ===')
sites.forEach(s => console.log(`Site ID: ${s.id} | Name: ${s.name} | URL: ${s.url}`))

const packages = db.prepare(`SELECT * FROM wp_packages`).all()
console.log('\n=== WP PACKAGES IN DB ===')
packages.forEach(pkgRow => {
  console.log(`Package Site ID: ${pkgRow.site_id} | Updated At: ${pkgRow.updated_at}`)
  try {
    const pkgData = JSON.parse(pkgRow.package_data)
    const rawPkg = pkgData.packageData || pkgData
    const pages = rawPkg.pages || []
    console.log(`Found ${pages.length} pages:`)
    pages.slice(0, 10).forEach(p => {
      console.log(`  - ID: ${p.id || p.ID} | Type: ${p.post_type || p.type || 'page'} | Title: "${p.title?.rendered || p.post_title || p.title}" | URL: ${p.link || p.url}`)
    })
  } catch (e) {
    console.error('Error parsing package:', e.message)
  }
})
