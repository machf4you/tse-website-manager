import fs from 'fs'

function investigateW4BlackScreen() {
  console.log('=== INVESTIGATING W4 BLACK SCREEN RUNTIME CAUSE ===\n')

  const managePageContent = fs.readFileSync('src/pages/ManageWebsitePage.jsx', 'utf-8')
  const auditPageContent = fs.readFileSync('src/pages/PageAuditResultsPage.jsx', 'utf-8')

  // Check 1: handleSyncFromWordPress usage in ManageWebsitePage.jsx
  const hasHandleSyncFromWordPressDef = managePageContent.includes('const handleSyncFromWordPress') || managePageContent.includes('function handleSyncFromWordPress')
  const handleSyncFromWordPressCallLine = managePageContent.split('\n').findIndex(l => l.includes('onSyncFromWordPress={handleSyncFromWordPress}')) + 1

  console.log(`1. Is 'handleSyncFromWordPress' defined in ManageWebsitePage.jsx? ${hasHandleSyncFromWordPressDef ? 'YES' : 'NO'}`)
  console.log(`2. Line in ManageWebsitePage.jsx passing undefined handleSyncFromWordPress: Line ${handleSyncFromWordPressCallLine}`)

  // Check 2: Actual sync function name in ManageWebsitePage.jsx
  const handleSyncClickLine = managePageContent.split('\n').findIndex(l => l.includes('handleSynchroniseClick')) + 1
  console.log(`3. Actual sync function defined in ManageWebsitePage.jsx: 'handleSynchroniseClick' (Line ${handleSyncClickLine})`)

  // Check 3: PageAuditResultsPage.jsx prop signature & onClick
  const auditPropSignatureLine = auditPageContent.split('\n').findIndex(l => l.includes('onSyncFromWordPress')) + 1
  console.log(`4. PageAuditResultsPage.jsx expects prop 'onSyncFromWordPress': Line ${auditPropSignatureLine}`)
}

investigateW4BlackScreen()
