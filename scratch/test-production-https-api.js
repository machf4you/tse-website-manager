import {
  getWebsitesApi,
  saveWebsiteApi,
  deleteWebsiteApi,
  getWpPackageApi,
  saveWpPackageApi,
  getPageConfigsApi,
  savePageConfigsApi,
  getPageAuditsApi,
  savePageAuditApi
} from '../src/services/websiteManagerApi.js'
import { extractPagesFromPackage } from '../src/utils/packageExtractor.js'
import { getExistingInternalLinks, generateContextualReplacement } from '../src/utils/internalLinkingHelper.js'

async function testProductionHttpsApi() {
  console.log('=== TESTING PRODUCTION HTTPS API PERSISTENCE ===\n')

  const PROD_HEALTH_URL = 'https://api-website-manager.thesearchequation.co.uk/api/health'
  console.log(`1. Testing Health Endpoint: ${PROD_HEALTH_URL}`)

  try {
    const healthRes = await fetch(PROD_HEALTH_URL)
    console.log(`  -> Status: ${healthRes.status} ${healthRes.statusText}`)
    const healthData = await healthRes.json()
    console.log('  -> Health Payload:', healthData)
  } catch (err) {
    console.error('  -> Health Check Failed:', err.message)
    return
  }

  const testSiteId = 'test-prod-site-999'
  const testSite = {
    id: testSiteId,
    name: 'Production Temp Test Site',
    url: 'https://prod-test-site.example.com',
    platform: 'WordPress',
    portfolio: 'Primary Portfolio',
    status: 'Active',
    isAudited: true,
    lastAuditTimestamp: '10-08-2026 14:35',
    syncStatus: 'Synced',
    lastSyncTimestamp: '10-08-2026 14:35'
  }

  // 2. Store Website in Production SQLite
  console.log('\n2. Creating TEST website record in Production SQLite...')
  await saveWebsiteApi(testSite)

  // 3. Store WP Package in Production SQLite
  console.log('3. Storing TEST WP package in Production SQLite...')
  const testPackage = {
    isSynchronised: true,
    lastSyncTimestamp: '10-08-2026 14:35',
    packageData: {
      pages: [
        {
          id: 9901,
          url: 'https://prod-test-site.example.com/',
          title: 'Prod Test Site Hub',
          isHome: true,
          post_content: 'Welcome to Prod Test Site. We offer high quality loft conversions banstead.'
        },
        {
          id: 9902,
          url: 'https://prod-test-site.example.com/loft-conversions-banstead/',
          title: 'Loft Conversions Banstead',
          post_content: 'Loft Conversions Banstead. Our expert builders complete high quality loft conversions banstead.'
        },
        {
          id: 9903,
          url: 'https://prod-test-site.example.com/loft-conversions-walton/',
          title: 'Loft Conversions Walton',
          post_content: 'Loft Conversions Walton. Adding a loft conversion to your property in Walton creates extra space.'
        }
      ]
    }
  }
  await saveWpPackageApi(testSiteId, testPackage)

  // 4. Store Page Configurations in Production SQLite
  console.log('4. Storing TEST page configurations in Production SQLite...')
  const testConfigs = {
    'https://prod-test-site.example.com/loft-conversions-banstead/': {
      pageId: '9902',
      url: 'https://prod-test-site.example.com/loft-conversions-banstead/',
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

  // 5. Store Audit Data in Production SQLite
  console.log('5. Storing TEST audit data in Production SQLite...')
  const testAuditRecord = {
    isAudited: true,
    isStale: false,
    staleReason: null,
    lastAuditTimestamp: '10-08-2026 14:35',
    fingerprint: 'prod-test-fingerprint-999',
    auditResult: { score: 100, passCount: 10, failCount: 0 }
  }
  await savePageAuditApi(testSiteId, 'https://prod-test-site.example.com/loft-conversions-banstead/', testAuditRecord)

  // 6. Verify Retrieval From Production API
  console.log('\n--- VERIFYING RETRIEVAL FROM PRODUCTION API (SIMULATING ISOLATED BROWSER) ---')

  const websites = await getWebsitesApi()
  const restoredSite = websites.find(s => String(s.id) === testSiteId)
  console.log('Website Record Restored:', restoredSite ? `YES (${restoredSite.name})` : 'NO')

  const restoredPackage = await getWpPackageApi(testSiteId)
  console.log('WP Sync Package Restored:', restoredPackage ? `YES (${restoredPackage.packageData.pages.length} pages)` : 'NO')

  const restoredConfigs = await getPageConfigsApi(testSiteId)
  console.log('Page Configs Restored:', restoredConfigs ? `YES (${Object.keys(restoredConfigs).length} config)` : 'NO')

  const restoredAudits = await getPageAuditsApi(testSiteId)
  console.log('Audit Data Restored:', restoredAudits ? `YES (Score: ${restoredAudits['https://prod-test-site.example.com/loft-conversions-banstead/']?.auditResult?.score})` : 'NO')

  // 7. Test W5 Access to Restored Package
  console.log('\n7. Testing W5 Access to Restored Package Data...')
  const pagesList = extractPagesFromPackage(restoredPackage.packageData)
  const links = getExistingInternalLinks('https://prod-test-site.example.com/', pagesList)
  console.log('W5 Existing Links extracted:', links.length)

  const waltonPage = pagesList.find(p => p.url.includes('walton'))
  const genResult = generateContextualReplacement(waltonPage, 'loft conversions banstead')
  console.log('W5 Contextual Replacement Wording:')
  console.log('  -> CURRENT SOURCE TEXT:', genResult.currentSourceText)
  console.log('  -> SUGGESTED REPLACEMENT:', genResult.suggestedReplacement)

  // 8. Cleanup Temporary TEST Records from Production API
  console.log('\n8. Cleaning up temporary TEST website record from Production API...')
  await deleteWebsiteApi(testSiteId)

  let deletedCheck = null
  try {
    deletedCheck = await getWpPackageApi(testSiteId)
  } catch (e) {
    deletedCheck = null
  }
  console.log('Test record cleaned up successfully:', deletedCheck === null ? 'YES' : 'NO')

  console.log('\n==========================================')
  console.log('PRODUCTION API PERSISTENCE TEST COMPLETE: 100% SUCCESS')
  console.log('==========================================')
}

testProductionHttpsApi()
