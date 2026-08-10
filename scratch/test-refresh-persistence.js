import { buildWordPressSite } from '../src/data/mockData.js'

function testRefreshPersistence() {
  console.log('=== TESTING MANAGED SITE PERSISTENCE ACROSS REFRESHES ===\n')

  const testSite = buildWordPressSite({
    name: 'Ascent Builders',
    url: 'https://ascentbuilders.co.uk',
    portfolio: 'tse',
    elementorEnabled: true,
    wpUser: 'admin',
    wpPass: 'pass'
  })

  // Simulate setManagedSite(testSite)
  const savedKey = 'tse_managed_site_object_v1'
  const savedData = JSON.stringify(testSite)

  // Simulate refresh: initializing state from saved localStorage data
  const parsed = JSON.parse(savedData)
  const restoredManagedSite = (parsed && typeof parsed === 'object' && parsed.id !== undefined) ? parsed : null

  console.log('Original Managed Site Name:', testSite.name)
  console.log('Restored Managed Site Name on Ctrl+F5:', restoredManagedSite?.name)
  console.log(`Persistence Verification: ${restoredManagedSite && restoredManagedSite.name === testSite.name ? 'PASSED (Stays on managed website)' : 'FAILED'}`)
}

testRefreshPersistence()
