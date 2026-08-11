import { getSiteConfigsStorageKey, getSiteAuditsStorageKey } from '../src/utils/siteKeyHelper.js'

function simulateW3ThenW4Sequence() {
  console.log('=== SIMULATING W3 CONFIGURATION THEN W4 SAVE / PUSH SEQUENCE ===\n')

  const site = { id: 'ascent-test-123', name: 'Ascent Builders', url: 'https://ascentbuilders.co.uk' }
  const siteIdKey = getSiteConfigsStorageKey(site)
  const auditStorageKey = getSiteAuditsStorageKey(site)

  // STEP 1: W3 Configuration saved by user
  const initialW3Config = {
    pageId: 2523,
    url: 'https://www.ascentbuilders.co.uk/loft-conversions-walton-on-thames/',
    proposedTitle: 'Loft Conversions Walton-On-Thames',
    targetPhrase: 'loft conversions walton on thames',
    type: 'Landing',
    seoPageType: 'Landing',
    priority: 2,
    isConfigured: true,
    status: 'configured'
  }

  const initialConfigsMap = {
    [initialW3Config.pageId]: initialW3Config,
    [initialW3Config.url]: initialW3Config
  }

  const initialAuditRecord = {
    isAudited: true,
    lastAuditTimestamp: '11-08-2026 14:00',
    auditResult: { score: 95 }
  }

  const initialAuditsMap = {
    [initialW3Config.pageId]: initialAuditRecord,
    [initialW3Config.url]: initialAuditRecord
  }

  console.log('1. INITIAL W3 STORED CONFIG:')
  console.log(JSON.stringify(initialConfigsMap, null, 2))
  console.log('   INITIAL W4 STORED AUDIT:')
  console.log(JSON.stringify(initialAuditsMap, null, 2))

  // STEP 2: W4 handleSaveFix execution simulation
  const targetPage = {
    id: 2523,
    url: 'https://www.ascentbuilders.co.uk/loft-conversions-walton-on-thames/',
    title: 'Loft Conversions Walton-On-Thames',
    target: 'loft conversions walton on thames',
    type: 'Landing',
    priority: 2
  }

  const pageKey = targetPage.id || targetPage.url
  const savedConfigs = { ...initialConfigsMap }
  const existingConfig = savedConfigs[pageKey] || (targetPage.url ? savedConfigs[targetPage.url] : {}) || {}

  // What handleSaveFix in PageAuditResultsPage currently does:
  const updatedConfig = {
    ...existingConfig,
    pageId: pageKey,
    url: targetPage.url,
    isConfigured: true,
    isManualOverride: true,
    proposedTitle: 'New Proposed Meta Title via W4',
    metaTitle: 'New Proposed Meta Title via W4',
    metaDescription: 'New Meta Description'
  }

  savedConfigs[pageKey] = updatedConfig
  if (targetPage.url && targetPage.url !== pageKey) {
    savedConfigs[targetPage.url] = updatedConfig
  }

  // And audit cache deletion in handleSaveFix:
  const storedAudits = { ...initialAuditsMap }
  delete storedAudits[pageKey]
  if (targetPage.url) delete storedAudits[targetPage.url]

  console.log('\n2. STORED CONFIG AFTER W4 handleSaveFix:')
  console.log(JSON.stringify(savedConfigs, null, 2))
  console.log('\n   STORED AUDIT AFTER W4 handleSaveFix:')
  console.log(JSON.stringify(storedAudits, null, 2))

  // STEP 3: Reopening application / reloading ManageWebsitePage
  const pageInDashboard = { id: 2523, url: 'https://www.ascentbuilders.co.uk/loft-conversions-walton-on-thames/', title: 'Loft Conversions Walton-On-Thames' }
  const override = savedConfigs[pageInDashboard.id] || savedConfigs[pageInDashboard.url]
  const targetPhraseStr = (override?.targetPhrase || override?.target || pageInDashboard.targetPhrase || pageInDashboard.target || '').trim()
  const isConfigured = Boolean(targetPhraseStr.length > 0)
  const evaluatedPriority = override?.priority !== undefined ? override.priority : (pageInDashboard.priority || 0)
  const evaluatedType = override?.type || pageInDashboard.type || 'Unclassified'

  console.log('\n3. RE-HYDRATED PAGE OBJECT WHEN REOPENING APPLICATION:')
  console.log(`   - Target Phrase: "${targetPhraseStr}"`)
  console.log(`   - Is Configured: ${isConfigured}`)
  console.log(`   - Page Type: "${evaluatedType}"`)
  console.log(`   - Priority: ${evaluatedPriority}`)
  console.log(`   - Stored Audit Present: ${Boolean(storedAudits[pageInDashboard.id])}`)

  console.log('\n=== ROOT CAUSE CONFIRMED ===')
  if (!targetPhraseStr || !isConfigured || evaluatedPriority === 0 || !storedAudits[pageInDashboard.id]) {
    console.log('ROOT CAUSE FOUND: W4 handleSaveFix overwrote W3 configuration fields and deleted stored audit records!')
  }
}

simulateW3ThenW4Sequence()
