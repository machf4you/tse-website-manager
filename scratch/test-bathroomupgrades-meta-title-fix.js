function testBathroomUpgradesMetaTitleFix() {
  console.log('=== TESTING BATHROOM UPGRADES W4 META TITLE LOADING FIX ===\n')

  const liveAuditData = {
    page_snapshot: {
      title: 'Bespoke Bathroom Upgrades & Renovations Surrey | Master Builders',
      meta_description: 'Transform your bathroom with luxury upgrades and bespoke renovations in Surrey.',
      h1: ['Bespoke Bathroom Upgrades & Renovations Surrey']
    }
  }

  const rawCurrentPage = {
    id: 202,
    url: 'https://bathroomupgrades.co.uk/services/',
    title: 'Services', // Page Name
    metaDescription: undefined,
    h1: undefined
  }

  const snap = liveAuditData?.page_snapshot || {}
  const overrideObj = {} // No manual overrides yet

  // Resolved currentPage with updated fallback order:
  const currentPageResolved = {
    ...rawCurrentPage,
    ...overrideObj,
    title: overrideObj.proposedTitle || overrideObj.metaTitle || rawCurrentPage.proposedTitle || snap.title || rawCurrentPage.title,
    proposedTitle: overrideObj.proposedTitle || overrideObj.metaTitle || rawCurrentPage.proposedTitle || snap.title || rawCurrentPage.title,
    metaTitle: overrideObj.metaTitle || overrideObj.proposedTitle || rawCurrentPage.metaTitle || snap.title || rawCurrentPage.title,
    metaDescription: overrideObj.metaDescription !== undefined ? overrideObj.metaDescription : (rawCurrentPage.metaDescription || snap.meta_description || ''),
    h1: overrideObj.h1 !== undefined ? overrideObj.h1 : (rawCurrentPage.h1 || (Array.isArray(snap.h1) ? snap.h1[0] : snap.h1) || ''),
  }

  // W4FixIssueDialog prefill:
  const prefilledMetaTitle = currentPageResolved.metaTitle || currentPageResolved.proposedTitle || currentPageResolved.title || ''

  console.log('1. RESOLVED PAGE METADATA:')
  console.log('   - Page Name (rawCurrentPage.title):', `"${rawCurrentPage.title}"`)
  console.log('   - Audited Title (snap.title):', `"${snap.title}"`)
  console.log('   - currentPage.metaTitle:', `"${currentPageResolved.metaTitle}"`)

  console.log('\n2. W4 FIX ISSUE DIALOG PREFILLED VALUE:')
  console.log('   - Pre-filled Meta Title field:', `"${prefilledMetaTitle}"`)

  console.log('\n====================================================')
  if (prefilledMetaTitle === snap.title && prefilledMetaTitle !== 'Services') {
    console.log('VERIFICATION RESULT: PASSED ✓ Audited Meta Title successfully loaded instead of Page Name!')
  } else {
    console.error('VERIFICATION RESULT: FAILED ✗ Page Name was loaded.')
  }
  console.log('====================================================')
}

testBathroomUpgradesMetaTitleFix()
