import db from '../server/db.js'
import { extractPagesFromPackage } from '../src/utils/packageExtractor.js'

function testSqliteSyncPersistenceDirect() {
  console.log('=== DIRECT TEST OF SQLITE SYNC PERSISTENCE TRANSACTION ===\n')

  const testSiteId = 'ascent-builders-test-sqlite'
  const now = new Date().toISOString()

  // 1. Insert test website in SQLite DB
  db.prepare(`
    INSERT INTO websites (id, name, url, platform, portfolio, status, sync_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET sync_status = 'Unsynced'
  `).run(testSiteId, 'Ascent Builders Test', 'https://ascentbuilders.co.uk', 'WordPress', 'Primary Portfolio', 'Active', 'Unsynced', now, now)

  const initialRow = db.prepare(`SELECT sync_status, last_sync_timestamp FROM websites WHERE id = ?`).get(testSiteId)
  console.log('1. Initial DB Record:')
  console.log('   - sync_status:', initialRow.sync_status)
  console.log('   - last_sync_timestamp:', initialRow.last_sync_timestamp)

  // 2. Simulate POST /api/websites/:id/package transaction
  const cleanPackageData = {
    pages: [
      { id: 2523, title: 'Loft Conversions Walton-On-Thames', url: 'https://ascentbuilders.co.uk/loft-conversions-walton-on-thames/' },
      { id: 101, title: 'Home', url: 'https://ascentbuilders.co.uk/' }
    ]
  }

  const syncTime = new Date().toISOString()
  const syncTx = db.transaction(() => {
    db.prepare(`
      INSERT INTO wp_packages (site_id, package_data, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(site_id) DO UPDATE SET
        package_data = excluded.package_data,
        updated_at = excluded.updated_at
    `).run(testSiteId, JSON.stringify(cleanPackageData), syncTime)

    db.prepare(`
      UPDATE websites
      SET sync_status = 'Synced',
          last_sync_timestamp = ?,
          updated_at = ?
      WHERE id = ?
    `).run(syncTime, syncTime, testSiteId)
  })

  syncTx()

  // 3. Read back from websites table
  const updatedWebsitesRow = db.prepare(`SELECT sync_status, last_sync_timestamp FROM websites WHERE id = ?`).get(testSiteId)
  console.log('\n2. DB Record After Package Sync Transaction:')
  console.log('   - sync_status:', updatedWebsitesRow.sync_status)
  console.log('   - last_sync_timestamp:', updatedWebsitesRow.last_sync_timestamp)

  // 4. Read back from wp_packages table
  const packageRow = db.prepare(`SELECT package_data, updated_at FROM wp_packages WHERE site_id = ?`).get(testSiteId)
  const storedData = JSON.parse(packageRow.package_data)

  const extractedPages = extractPagesFromPackage(storedData)
  console.log('\n3. Read Back Package Data:')
  console.log('   - Has pages array:', Boolean(storedData.pages))
  console.log('   - Extracted pages count:', extractedPages.length)
  console.log('   - Page 1 Title:', extractedPages[0]?.title)

  console.log('\n====================================================')
  if (updatedWebsitesRow.sync_status === 'Synced' && extractedPages.length === 2) {
    console.log('VERIFICATION RESULT: PASSED ✓ SQLite DB transaction & clean package storage successful!')
  } else {
    console.error('VERIFICATION RESULT: FAILED ✗ Transaction failed.')
  }
  console.log('====================================================')
}

testSqliteSyncPersistenceDirect()
