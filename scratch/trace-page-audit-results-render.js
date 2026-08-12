import db from '../server/db.js'
import { extractPagesFromPackage } from '../src/utils/packageExtractor.js'

function tracePageAuditResultsProps() {
  console.log('=== TRACING PageAuditResultsPage PROPS & EVALUATION ===\n')

  const siteId = 'bathroomupgrades-test-123'
  const siteRow = db.prepare(`SELECT * FROM websites WHERE id = ?`).get(siteId) || { id: siteId, name: 'Bathroom Upgrades', url: 'https://bathroomupgrades.co.uk/' }

  const pkgRow = db.prepare(`SELECT package_data FROM wp_packages WHERE site_id = ?`).get(siteId)
  const rawPkg = pkgRow ? JSON.parse(pkgRow.package_data) : { pages: [] }

  const exportedPages = extractPagesFromPackage(rawPkg)
  console.log('1. exportedPages count:', exportedPages.length)
  console.log('   exportedPages[0]:', exportedPages[0])

  const selectedPage = exportedPages[0] || {
    id: 202,
    title: 'Bathroom Services',
    url: 'https://bathroomupgrades.co.uk/services/',
    targetPhrase: 'luxury bathroom upgrades',
    type: 'Landing',
    priority: 2,
    isConfigured: true
  }

  console.log('\n2. Props passed to PageAuditResultsPage:')
  console.log('   site:', siteRow.name)
  console.log('   page:', selectedPage.title, selectedPage.url)
  console.log('   pagesList.length:', exportedPages.length)

  console.log('\n3. Evaluating PageAuditResultsPage internal state:')
  const selectedUrl = selectedPage.url
  const matchedFromList = exportedPages.find(p => p.url === selectedUrl)

  const rawCurrentPage = selectedPage || matchedFromList || exportedPages[0] || {}
  console.log('   rawCurrentPage:', rawCurrentPage.title, rawCurrentPage.url)

  const snap = {}
  const overrideObj = {}
  const currentPage = {
    ...rawCurrentPage,
    ...overrideObj,
    title: overrideObj.proposedTitle || overrideObj.metaTitle || rawCurrentPage.proposedTitle || snap.title || rawCurrentPage.title,
    proposedTitle: overrideObj.proposedTitle || overrideObj.metaTitle || rawCurrentPage.proposedTitle || snap.title || rawCurrentPage.title,
    metaTitle: overrideObj.metaTitle || overrideObj.proposedTitle || rawCurrentPage.metaTitle || snap.title || rawCurrentPage.title,
    metaDescription: overrideObj.metaDescription !== undefined ? overrideObj.metaDescription : (rawCurrentPage.metaDescription || snap.meta_description || ''),
    h1: overrideObj.h1 !== undefined ? overrideObj.h1 : (rawCurrentPage.h1 || (Array.isArray(snap.h1) ? snap.h1[0] : snap.h1) || ''),
  }

  console.log('   currentPage:', currentPage.title, currentPage.url)
  console.log('   currentPage.target:', currentPage.target || currentPage.targetPhrase)

  console.log('\n====================================================')
  console.log('TRACE COMPLETE - Check for any undefined / null crashes')
  console.log('====================================================')
}

tracePageAuditResultsProps()
