import { saveWpPackageApi, getWpPackageApi, getWebsitesApi, saveWebsiteApi } from '../src/services/websiteManagerApi.js'
import { extractPagesFromPackage } from '../src/utils/packageExtractor.js'

async function testSyncStatusBackendPersistence() {
  console.log('=== TESTING BACKEND SYNC STATUS PERSISTENCE & HYDRATION ===\n')

  const testSiteId = 'test-site-sync-persistence'

  // 1. Create site record in SQLite DB
  console.log('1. Creating test website record in SQLite DB...')
  await saveWebsiteApi({
    id: testSiteId,
    name: 'Bathroom Upgrades Test',
    url: 'https://bathroomupgrades.co.uk',
    platform: 'WordPress',
    status: 'Active'
  })

  // Verify initial sync status from GET /api/websites
  let sites = await getWebsitesApi()
  let siteObj = sites.find(s => String(s.id) === testSiteId)
  console.log('   - Initial DB sync_status:', siteObj?.syncStatus || siteObj?.sync_status || 'Unsynced')

  // 2. Perform package save via saveWpPackageApi
  console.log('\n2. Saving clean WP package to backend API via saveWpPackageApi()...')
  const cleanPackage = {
    pages: [
      { id: 1, title: 'Home', url: 'https://bathroomupgrades.co.uk/' },
      { id: 2, title: 'Luxury Bathroom Upgrades', url: 'https://bathroomupgrades.co.uk/services/' }
    ]
  }

  await saveWpPackageApi(testSiteId, cleanPackage)

  // 3. Verify SQLite DB updated websites.sync_status
  sites = await getWebsitesApi()
  siteObj = sites.find(s => String(s.id) === testSiteId)
  console.log('\n3. Verifying updated SQLite DB website record:')
  console.log('   - DB syncStatus:', siteObj?.syncStatus || siteObj?.sync_status)
  console.log('   - DB lastSyncTimestamp:', siteObj?.lastSyncTimestamp || siteObj?.last_sync_timestamp)

  // 4. Verify getWpPackageApi() response & extraction
  console.log('\n4. Verifying getWpPackageApi() response & package extraction:')
  const pkgRes = await getWpPackageApi(testSiteId)
  console.log('   - API isSynchronised:', pkgRes?.isSynchronised)
  console.log('   - API lastSyncTimestamp:', pkgRes?.lastSyncTimestamp)

  const extractedPages = extractPagesFromPackage(pkgRes?.packageData)
  console.log(`   - Extracted Pages Count: ${extractedPages.length}`)
  console.log(`   - Page 1 Title: "${extractedPages[0]?.title}"`)
  console.log(`   - Page 2 Title: "${extractedPages[1]?.title}"`)

  const isSyncedResult = Boolean(pkgRes?.packageData && extractedPages.length > 0)
  console.log(`   - Dynamic isSynced Evaluation: ${isSyncedResult}`)

  console.log('\n====================================================')
  if (siteObj?.syncStatus === 'Synced' && isSyncedResult && extractedPages.length === 2) {
    console.log('VERIFICATION RESULT: PASSED ✓ Backend sync persistence & package hydration successful!')
  } else {
    console.error('VERIFICATION RESULT: FAILED ✗ Sync status or package hydration failed.')
  }
  console.log('====================================================')
}

testSyncStatusBackendPersistence()
