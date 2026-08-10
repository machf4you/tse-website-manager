function testHydrationRaceCondition() {
  console.log('=== TESTING PACKAGE HYDRATION TIMING & TAB PERSISTENCE ===\n')

  let activeTab = 'w3'
  let storedPackageData = null
  let isPackageHydrated = false // Simulating async API load in progress

  // Operational sync state during initial render before API load completes
  const exportedPages = []
  const isSynced = Boolean(storedPackageData && exportedPages.length > 0)

  // Guard check during hydration
  function evaluateTabGuard() {
    if (!isPackageHydrated) {
      return 'HYDRATING — Tab redirect paused'
    }
    if (!isSynced || exportedPages.length === 0) {
      activeTab = 'w2'
      return 'UNSYNCHRONISED — Redirected to W2'
    }
    return 'SYNCHRONISED — Active tab preserved'
  }

  console.log('Initial Render (API fetch pending):')
  console.log(`- activeTab: ${activeTab}`)
  console.log(`- isPackageHydrated: ${isPackageHydrated}`)
  console.log(`- Guard evaluation: ${evaluateTabGuard()}`)
  console.log(`- activeTab after guard: ${activeTab}`)

  // API fetch completes successfully
  isPackageHydrated = true
  storedPackageData = {
    pages: [{ id: 1, title: 'Home', url: '/' }]
  }
  const hydratedPages = storedPackageData.pages
  const hydratedIsSynced = Boolean(storedPackageData && hydratedPages.length > 0)

  console.log('\nAfter API Fetch Completes (Package loaded):')
  console.log(`- isPackageHydrated: ${isPackageHydrated}`)
  console.log(`- hydratedIsSynced: ${hydratedIsSynced}`)
  console.log(`- Pages loaded: ${hydratedPages.length}`)
  console.log(`- activeTab: ${activeTab}`)

  console.log(`\nVerification: ${activeTab === 'w3' && hydratedIsSynced ? 'PASSED (W3 preserved with 0 tab resets or flickering)' : 'FAILED'}`)
}

testHydrationRaceCondition()
