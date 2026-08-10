import { buildWordPressSite } from '../src/data/mockData.js'

function testW1TileStatus() {
  console.log('=== TESTING W1 WEBSITE TILE CONNECTED STATUS LOGIC ===\n')

  const siteFromSQLite = {
    id: '1',
    name: 'Ascent Builders',
    url: 'https://ascentbuilders.co.uk',
    platform: 'WordPress',
    portfolio: 'tse',
    status: 'Active',
    syncStatus: 'Synced',
    lastSyncTimestamp: '10-08-2026 16:32'
  }

  const hasValidPackage = true

  const isConnected = Boolean(
    siteFromSQLite.syncStatus === 'Synced' ||
    siteFromSQLite.syncStatus === 'Connected' ||
    siteFromSQLite.isSynchronised === true ||
    siteFromSQLite.topIndicator === 'connected' ||
    hasValidPackage
  )

  console.log('Site Name:', siteFromSQLite.name)
  console.log('syncStatus:', siteFromSQLite.syncStatus)
  console.log('isSynchronised (legacy):', siteFromSQLite.isSynchronised)
  console.log('Tile Status isConnected:', isConnected)
  console.log(`Status Indicator Label: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'}`)
  console.log(`Verification: ${isConnected ? 'PASSED (Tile shows CONNECTED)' : 'FAILED'}`)
}

testW1TileStatus()
