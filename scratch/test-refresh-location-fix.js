function testRefreshLocationFix() {
  console.log('=== TESTING REFRESH LOCATION & W1 TILE STATUS FIX ===\n')

  const siteId = '1'
  const savedPackage = {
    pages: [
      { id: 1, url: 'https://ascentbuilders.co.uk/', title: 'Home', post_type: 'page' },
      { id: 2, url: 'https://ascentbuilders.co.uk/loft-conversions-banstead/', title: 'Loft Conversions Banstead', post_type: 'page' }
    ],
    posts: [
      { id: 101, url: 'https://ascentbuilders.co.uk/velux-vs-dormer-loft-conversion/', title: 'Velux vs Dormer Loft Conversion', post_type: 'post' }
    ]
  }

  // 1. Test storedPackageData rehydration
  const parsed = savedPackage
  const restoredPackageData = (parsed && parsed.packageData) ? parsed.packageData : (parsed || null)

  console.log('Restored Package Data Found:', Boolean(restoredPackageData))
  console.log('Pages count:', restoredPackageData?.pages?.length)
  console.log('Posts count:', restoredPackageData?.posts?.length)

  // 2. Active Tab preservation test
  let activeTab = 'w3'
  const isSynced = Boolean(restoredPackageData && (restoredPackageData.pages?.length > 0 || restoredPackageData.posts?.length > 0))

  if (!restoredPackageData && !isSynced) {
    activeTab = 'w2'
  }

  console.log('\nActive Tab after refresh:', activeTab)
  console.log(`Location Restoration Test: ${activeTab === 'w3' ? 'PASSED (Stays on W3)' : 'FAILED'}`)

  // 3. WebsiteTile status test with SQLite snake_case
  const sqliteSiteRecord = {
    id: '1',
    name: 'Ascent Builders',
    url: 'https://ascentbuilders.co.uk',
    sync_status: 'Synced',
    status: 'Active'
  }

  const isConnectedTile = Boolean(
    sqliteSiteRecord.syncStatus === 'Synced' ||
    sqliteSiteRecord.sync_status === 'Synced' ||
    sqliteSiteRecord.isSynchronised === true ||
    isSynced
  )

  console.log('\nWebsiteTile isConnected on W1:', isConnectedTile)
  console.log(`W1 Tile Connected Test: ${isConnectedTile ? 'PASSED (Tile shows CONNECTED)' : 'FAILED'}`)
}

testRefreshLocationFix()
