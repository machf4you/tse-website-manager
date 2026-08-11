import fs from 'fs'

function traceW1TileCauses() {
  console.log('=== TRACING W1 WEBSITE TILE CONFIGURED COUNT CAUSES ===\n')

  const tileCode = fs.readFileSync('src/components/WebsiteTile.jsx', 'utf-8')
  const dashboardCode = fs.readFileSync('src/pages/WebsitesDashboard.jsx', 'utf-8')

  console.log('1. Does WebsitesDashboard or WebsiteTile fetch page configs from API (getPageConfigsApi)?')
  const tileHasApiCall = tileCode.includes('getPageConfigsApi')
  const dashboardHasApiCall = dashboardCode.includes('getPageConfigsApi')
  console.log(`   - WebsiteTile.jsx: ${tileHasApiCall ? 'YES' : 'NO'}`)
  console.log(`   - WebsitesDashboard.jsx: ${dashboardHasApiCall ? 'YES' : 'NO'}`)

  console.log('\n2. How WebsiteTile reads savedConfigs:')
  console.log('   WebsiteTile reads ONLY from local localStorage.getItem(siteIdKey).')
  console.log('   If page configs were saved via API or if localStorage is empty/cleared on W1, WebsiteTile sees an empty object {}.')

  console.log('\n3. How WebsiteTile looks up page overrides:')
  console.log('   const pageKey = p.id || p.url')
  console.log('   const override = savedConfigs[pageKey] || (p.url ? savedConfigs[p.url] : null) || (p.id ? savedConfigs[p.id] : null)')

  console.log('\n4. Where W1 gets its page list (rawPages):')
  console.log('   WebsiteTile reads package from site.storedPackageData or localStorage `tse_wp_package_${site.id}`.')
}

traceW1TileCauses()
