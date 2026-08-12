import db from '../server/db.js'

function inspectDbRecords() {
  console.log('=== INVESTIGATING SQLITE DB RECORDS: BATHROOM UPGRADES vs ASCENT BUILDERS ===\n')

  // 1. Inspect websites table
  console.log('1. WEBSITES TABLE ROWS:')
  const websites = db.prepare(`SELECT id, name, url, sync_status, last_sync_timestamp, created_at, updated_at FROM websites`).all()
  console.table(websites)

  // 2. Inspect wp_packages table
  console.log('\n2. WP_PACKAGES TABLE ROWS:')
  const packages = db.prepare(`SELECT site_id, length(package_data) as json_length, updated_at FROM wp_packages`).all()
  console.table(packages)

  // 3. Check exact package contents for each site
  console.log('\n3. DETAILED PACKAGE INSPECTION:')
  for (const site of websites) {
    const pkgRow = db.prepare(`SELECT package_data, updated_at FROM wp_packages WHERE site_id = ?`).get(site.id)
    if (!pkgRow) {
      console.log(`   ❌ Site ID "${site.id}" (${site.name}): NO PACKAGE ROW FOUND IN wp_packages!`)
    } else {
      try {
        const parsed = JSON.parse(pkgRow.package_data)
        const pagesCount = Array.isArray(parsed.pages) ? parsed.pages.length : (Array.isArray(parsed.packageData?.pages) ? parsed.packageData.pages.length : 0)
        const postsCount = Array.isArray(parsed.posts) ? parsed.posts.length : (Array.isArray(parsed.packageData?.posts) ? parsed.packageData.posts.length : 0)
        console.log(`   ✓ Site ID "${site.id}" (${site.name}): Package Row Exists! Pages: ${pagesCount}, Posts: ${postsCount}, UpdatedAt: ${pkgRow.updated_at}`)
      } catch (e) {
        console.log(`   ⚠️ Site ID "${site.id}" (${site.name}): Package JSON Parse Error: ${e.message}`)
      }
    }
  }

  // 4. Check if there are orphaned packages or mismatch between ID strings / numbers
  console.log('\n4. ALL SITE IDS IN WP_PACKAGES:')
  const allPkgSiteIds = db.prepare(`SELECT DISTINCT site_id FROM wp_packages`).all()
  console.log(allPkgSiteIds)

  console.log('\n5. PAGE CONFIGURATIONS IN DB PER SITE:')
  const pageConfigs = db.prepare(`SELECT site_id, count(*) as count FROM page_configurations GROUP BY site_id`).all()
  console.table(pageConfigs)
}

inspectDbRecords()
