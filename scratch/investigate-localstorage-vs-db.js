import db from '../server/db.js'

function inspectWebsiteManagerStore() {
  console.log('=== DEEP INSPECTION OF SQLITE DATABASE & PERSISTENCE MECHANISM ===\n')

  console.log('1. ALL WEBSITES IN SQLITE DATABASE:')
  const allWebsites = db.prepare(`SELECT id, name, url, sync_status, last_sync_timestamp FROM websites`).all()
  console.table(allWebsites)

  console.log('\n2. ALL WP_PACKAGES IN SQLITE DATABASE:')
  const allPackages = db.prepare(`SELECT site_id, length(package_data) as len, updated_at FROM wp_packages`).all()
  console.table(allPackages)

  console.log('\n3. ALL PAGE CONFIGURATIONS IN SQLITE DATABASE:')
  const allConfigs = db.prepare(`SELECT site_id, page_key, config_json FROM page_configurations`).all()
  console.table(allConfigs)
}

inspectWebsiteManagerStore()
