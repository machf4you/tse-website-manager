function traceMetaTitleLoading() {
  console.log('=== TRACING META TITLE LOADING LOGIC ===\n')

  // Simulated live audit data from Page Auditor for bathroomupgrades
  const liveAuditData = {
    page_snapshot: {
      title: 'Luxury Bathroom Upgrades & Renovations | Surrey Specialists',
      meta_description: 'Transform your bathroom with luxury upgrades and bespoke renovations in Surrey.',
      h1: ['Luxury Bathroom Upgrades & Renovations']
    }
  }

  // Simulated raw page object from package
  const rawCurrentPage = {
    id: 101,
    url: 'https://bathroomupgrades.co.uk/services/',
    title: 'Services', // Page Name
    metaDescription: undefined,
    h1: undefined
  }

  const snap = liveAuditData.page_snapshot
  const overrideObj = {} // No manual overrides yet

  // Current code in PageAuditResultsPage.jsx (lines 97-101):
  const currentPageCurrent = {
    ...rawCurrentPage,
    ...overrideObj,
    title: overrideObj.proposedTitle || overrideObj.metaTitle || rawCurrentPage.proposedTitle || rawCurrentPage.title,
    proposedTitle: overrideObj.proposedTitle || overrideObj.metaTitle || rawCurrentPage.proposedTitle || rawCurrentPage.title,
    metaTitle: overrideObj.metaTitle || overrideObj.proposedTitle || rawCurrentPage.metaTitle || rawCurrentPage.proposedTitle || rawCurrentPage.title,
    metaDescription: overrideObj.metaDescription !== undefined ? overrideObj.metaDescription : rawCurrentPage.metaDescription,
    h1: overrideObj.h1 !== undefined ? overrideObj.h1 : rawCurrentPage.h1,
  }

  console.log('1. CURRENT RESOLVED currentPage OBJECT:')
  console.log('   - currentPage.title:', `"${currentPageCurrent.title}"`)
  console.log('   - currentPage.proposedTitle:', `"${currentPageCurrent.proposedTitle}"`)
  console.log('   - currentPage.metaTitle:', `"${currentPageCurrent.metaTitle}"`)
  console.log('   - currentPage.metaDescription:', currentPageCurrent.metaDescription)
  console.log('   - currentPage.h1:', currentPageCurrent.h1)

  // Current code in W4FixIssueDialog.jsx (lines 43-49):
  const dialogTitleValCurrent = currentPageCurrent.proposedTitle || currentPageCurrent.metaTitle || currentPageCurrent.title || ''
  const dialogDescValCurrent = currentPageCurrent.metaDescription || currentPageCurrent.meta_description || snap.meta_description || ''
  const dialogH1ValCurrent = currentPageCurrent.h1 || currentPageCurrent.h1_text || (Array.isArray(snap.h1) ? snap.h1[0] : snap.h1) || ''

  console.log('\n2. CURRENT W4 DIALOG PRE-FILLED VALUES:')
  console.log('   - Meta Title field value:', `"${dialogTitleValCurrent}"`, '(Loads Page Name "Services" instead of Audited Title!)')
  console.log('   - Meta Description field value:', `"${dialogDescValCurrent}"`, '(Loads Audited Meta Description!)')
  console.log('   - H1 field value:', `"${dialogH1ValCurrent}"`, '(Loads Audited H1!)')

  console.log('\n=== INVESTIGATION SUMMARY ===')
  console.log('WHY META TITLE SHOWS PAGE NAME:')
  console.log('1. `currentPage.metaTitle` includes `rawCurrentPage.title` (Page Name) at the end of its fallback chain.')
  console.log('2. `currentPage.metaTitle` does NOT include `snap.title` (live audit snapshot title).')
  console.log('3. In W4FixIssueDialog, `page.proposedTitle` is evaluated first. Since `proposedTitle` was initialized to `rawCurrentPage.title` ("Services"), it evaluates immediately before checking audited title data.')
}

traceMetaTitleLoading()
