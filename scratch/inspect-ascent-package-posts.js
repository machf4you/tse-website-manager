import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'server', 'website_manager.db')

console.log('Reading DB from:', dbPath)
if (!fs.existsSync(dbPath)) {
  console.error('DB does not exist at:', dbPath)
  process.exit(1)
}

const db = new Database(dbPath)

const sites = db.prepare(`SELECT * FROM websites`).all()
console.log('Found sites in DB:', sites.map(s => ({ id: s.id, name: s.name, url: s.url })))

const ascentSite = sites.find(s => (s.name || '').toLowerCase().includes('ascent') || (s.url || '').toLowerCase().includes('ascent'))
console.log('Ascent Site found:', ascentSite ? { id: ascentSite.id, name: ascentSite.name, url: ascentSite.url } : 'NONE')

const packages = db.prepare(`SELECT * FROM wp_packages`).all()
console.log('Total packages in DB:', packages.length)

packages.forEach(pkgRow => {
  console.log(`\n--- Package site_id: ${pkgRow.site_id} (updated_at: ${pkgRow.updated_at}) ---`)
  try {
    const pkg = JSON.parse(pkgRow.package_data)
    console.log('Keys in package_data:', Object.keys(pkg))
    
    // Check pages
    if (pkg.pages) {
      console.log(`- pages count: ${Array.isArray(pkg.pages) ? pkg.pages.length : typeof pkg.pages}`)
      if (Array.isArray(pkg.pages) && pkg.pages.length > 0) {
        const samplePage = pkg.pages[0]
        console.log('  Sample page keys:', Object.keys(samplePage))
        console.log('  Sample page types found in pages array:', [...new Set(pkg.pages.map(p => p.post_type || p.type || p.postType))])
      }
    } else {
      console.log('- pkg.pages is MISSING/EMPTY')
    }

    // Check posts
    if (pkg.posts) {
      console.log(`- posts count: ${Array.isArray(pkg.posts) ? pkg.posts.length : typeof pkg.posts}`)
      if (Array.isArray(pkg.posts) && pkg.posts.length > 0) {
        const samplePost = pkg.posts[0]
        console.log('  Sample post keys:', Object.keys(samplePost))
        console.log('  Sample post_type in posts array:', [...new Set(pkg.posts.map(p => p.post_type || p.type || p.postType))])
      }
    } else {
      console.log('- pkg.posts is MISSING/UNDEFINED')
    }

    // Check if posts are inside pages or elsewhere in package
    console.log('- Site metadata:', pkg.site || pkg.metadata || 'N/A')
  } catch (e) {
    console.error('Error parsing package_data:', e.message)
  }
})
