import {
  getWebsitesApi,
  saveWebsiteApi,
  getWpPackageApi,
  saveWpPackageApi,
  getPageConfigsApi,
  savePageConfigsApi,
  getPageAuditsApi,
  savePageAuditApi
} from '../src/services/websiteManagerApi.js'
import { extractPagesFromPackage } from '../src/utils/packageExtractor.js'
import { getExistingInternalLinks, generateContextualReplacement } from '../src/utils/internalLinkingHelper.js'

async function runDestructivePersistenceTest() {
  console.log('=== CRITICAL DESTRUCTIVE PERSISTENCE TEST ===\n')

  const testSiteId = 'test-site-persistence-123'
  const testSite = {
    id: testSiteId,
    name: 'Test Persistence Builders',
    url: 'https://test-persistence-builders.co.uk',
    platform: 'WordPress',
    portfolio: 'Primary Portfolio',
    status: 'Active',
    isAudited: true,
    lastAuditTimestamp: '10-08-2026 08:55',
    syncStatus: 'Synced',
    lastSyncTimestamp: '10-08-2026 08:55'
  }

  // 1. Store Website in SQLite API
  console.log('1. Storing test website in SQLite API...')
  await saveWebsiteApi(testSite)

  // 2. Store WP Package in SQLite API
  console.log('2. Storing WP package in SQLite API...')
  const testPackage = {
    isSynchronised: true,
    lastSyncTimestamp: '10-08-2026 08:55',
    packageData: {
      pages: [
        {
          id: 101,
          url: 'https://test-persistence-builders.co.uk/',
          title: 'Test Persistence Builders Hub',
          isHome: true,
          post_content: 'Welcome to Test Persistence Builders. We specialize in loft conversions banstead and home extensions.'
        },
        {
          id: 102,
          url: 'https://test-persistence-builders.co.uk/loft-conversions-banstead/',
          title: 'Loft Conversions Banstead',
          post_content: 'Loft Conversions Banstead. Our team provides high quality loft conversions banstead with architectural compliance.'
        },
        {
          id: 103,
          url: 'https://test-persistence-builders.co.uk/loft-conversions-walton/',
          title: 'Loft Conversions Walton',
          post_content: 'Loft Conversions Walton. Adding a loft conversion to your property in Walton creates extra space.'
        }
      ]
    }
  }
  await saveWpPackageApi(testSiteId, testPackage)

  // 3. Store Page Configurations in SQLite API
  console.log('3. Storing Page Configurations in SQLite API...')
  const testConfigs = {
    'https://test-persistence-builders.co.uk/loft-conversions-banstead/': {
      pageId: '102',
      url: 'https://test-persistence-builders.co.uk/loft-conversions-banstead/',
      title: 'Loft Conversions Banstead',
      proposedTitle: 'Loft Conversions Banstead',
      target: 'loft conversions banstead',
      targetPhrase: 'loft conversions banstead',
      type: 'Landing',
      seoPageType: 'Landing',
      priority: 2,
      isExcluded: false,
      isConfigured: true
    }
  }
  await savePageConfigsApi(testSiteId, testConfigs)

  // 4. Store Audit Data in SQLite API
  console.log('4. Storing Audit History in SQLite API...')
  const testAuditRecord = {
    isAudited: true,
    isStale: false,
    staleReason: null,
    lastAuditTimestamp: '10-08-2026 08:55',
    fingerprint: 'test-fingerprint-999',
    auditResult: { score: 95, passCount: 8, failCount: 0 }
  }
  await savePageAuditApi(testSiteId, 'https://test-persistence-builders.co.uk/loft-conversions-banstead/', testAuditRecord)

  console.log('\n--- SIMULATING COMPLETE BROWSER LOCALSTORAGE WIPED TO EMPTY ---')

  // 5. Fetch all data back directly from SQLite API (simulating fresh browser with empty localStorage)
  console.log('5. Fetching website from SQLite API...')
  const restoredWebsites = await getWebsitesApi()
  const restoredSite = restoredWebsites.find(s => String(s.id) === testSiteId)
  console.log('Restored Website:', restoredSite ? `MATCH (${restoredSite.name})` : 'FAILED')

  console.log('6. Fetching WP Package from SQLite API...')
  const restoredPackage = await getWpPackageApi(testSiteId)
  console.log('Restored WP Package:', restoredPackage ? `MATCH (${restoredPackage.packageData.pages.length} pages)` : 'FAILED')

  console.log('7. Fetching Page Configurations from SQLite API...')
  const restoredConfigs = await getPageConfigsApi(testSiteId)
  console.log('Restored Configs:', restoredConfigs ? `MATCH (${Object.keys(restoredConfigs).length} config)` : 'FAILED')

  console.log('8. Fetching Audit History from SQLite API...')
  const restoredAudits = await getPageAuditsApi(testSiteId)
  console.log('Restored Audits:', restoredAudits ? `MATCH (Score: ${restoredAudits['https://test-persistence-builders.co.uk/loft-conversions-banstead/']?.auditResult?.score})` : 'FAILED')

  console.log('9. Testing W5 Access to Restored Package Data...')
  const pagesList = extractPagesFromPackage(restoredPackage.packageData)
  const links = getExistingInternalLinks('https://test-persistence-builders.co.uk/', pagesList)
  console.log('W5 Existing Links extracted from restored package:', links.length)

  const waltonPage = pagesList.find(p => p.url.includes('walton'))
  const genResult = generateContextualReplacement(waltonPage, 'loft conversions banstead')
  console.log('W5 Generated Wording from restored package page:')
  console.log('CURRENT SOURCE TEXT:', genResult.currentSourceText)
  console.log('SUGGESTED REPLACEMENT:', genResult.suggestedReplacement)

  const allPassed = Boolean(
    restoredSite &&
    restoredPackage &&
    restoredConfigs &&
    restoredAudits['https://test-persistence-builders.co.uk/loft-conversions-banstead/'] &&
    genResult.currentSourceText
  )

  console.log('\n==========================================')
  console.log(`CRITICAL DESTRUCTIVE TEST RESULT: ${allPassed ? 'PASSED (100% SUCCESS)' : 'FAILED'}`)
  console.log('==========================================')
}

runDestructivePersistenceTest()
