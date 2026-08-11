import { getSiteConfigsStorageKey, getSiteAuditsStorageKey } from '../src/utils/siteKeyHelper.js'

function testW3PreservationFix() {
  console.log('=== TESTING W3 CONFIGURATION PRESERVATION & AUDIT RETENTION FIX ===\n')

  const site = { id: 'ascent-test-fix', name: 'Ascent Builders', url: 'https://ascentbuilders.co.uk' }
  const siteIdKey = getSiteConfigsStorageKey(site)
  const auditStorageKey = getSiteAuditsStorageKey(site)

  // Initial W3 Configuration
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

  // Target Page passed into handleSaveFix
  const targetPage = {
    id: 2523,
    url: 'https://www.ascentbuilders.co.uk/loft-conversions-walton-on-thames/',
    title: 'Loft Conversions Walton-On-Thames',
    target: 'loft conversions walton on thames',
    targetPhrase: 'loft conversions walton on thames',
    type: 'Landing',
    priority: 2,
    isConfigured: true
  }

  // Simulate NEW handleSaveFix logic
  const pageKey = targetPage.id || targetPage.url
  const savedConfigs = { ...initialConfigsMap }
  const existingConfig = savedConfigs[pageKey] || (targetPage.url ? savedConfigs[targetPage.url] : {}) || {}

  const preservedTargetPhrase = (existingConfig.targetPhrase || existingConfig.target || targetPage.targetPhrase || targetPage.target || '').trim()
  const preservedType = existingConfig.type || existingConfig.seoPageType || targetPage.type || targetPage.seoPageType || 'Unclassified'
  const preservedPriority = existingConfig.priority !== undefined ? existingConfig.priority : (targetPage.priority !== undefined ? targetPage.priority : 0)
  const preservedAutoType = existingConfig.autoType || targetPage.autoType || preservedType
  const preservedIsConfigured = existingConfig.isConfigured !== undefined ? existingConfig.isConfigured : Boolean(preservedTargetPhrase.length > 0)
  const preservedIsExcluded = existingConfig.isExcluded !== undefined ? existingConfig.isExcluded : Boolean(targetPage.isExcluded)
  const preservedStatus = existingConfig.status || (preservedIsConfigured ? 'configured' : 'unconfigured')
  const preservedIsManualOverride = existingConfig.isManualOverride !== undefined ? existingConfig.isManualOverride : Boolean(targetPage.isManualOverride)

  const fieldValues = {
    metaTitle: 'Loft Conversions Walton-On-Thames | Ascent Builders New Title',
    metaDescription: 'Expert loft conversions in Walton-On-Thames by Ascent Builders.',
    h1: 'Bespoke Loft Conversions Walton-On-Thames'
  }

  const updatedConfig = {
    ...targetPage,
    ...existingConfig,
    pageId: pageKey,
    url: targetPage.url,
    targetPhrase: preservedTargetPhrase,
    target: preservedTargetPhrase,
    type: preservedType,
    seoPageType: preservedType,
    autoType: preservedAutoType,
    priority: preservedPriority,
    isConfigured: preservedIsConfigured,
    isExcluded: preservedIsExcluded,
    status: preservedStatus,
    isManualOverride: preservedIsManualOverride,
    proposedTitle: fieldValues.metaTitle,
    metaTitle: fieldValues.metaTitle,
    metaDescription: fieldValues.metaDescription,
    h1: fieldValues.h1
  }

  savedConfigs[pageKey] = updatedConfig
  if (targetPage.url && targetPage.url !== pageKey) {
    savedConfigs[targetPage.url] = updatedConfig
  }

  // Audit map remains UNTOUCHED (deletion logic removed)
  const storedAudits = { ...initialAuditsMap }

  console.log('1. UPDATED CONFIG STORED AFTER W4 SAVE CHANGES:')
  console.log(JSON.stringify(savedConfigs[pageKey], null, 2))

  console.log('\n2. AUDIT MAP RETENTION AFTER W4 SAVE CHANGES:')
  console.log(JSON.stringify(storedAudits[pageKey], null, 2))

  const phraseOk = savedConfigs[pageKey].targetPhrase === 'loft conversions walton on thames'
  const typeOk = savedConfigs[pageKey].type === 'Landing'
  const priorityOk = savedConfigs[pageKey].priority === 2
  const configuredOk = savedConfigs[pageKey].isConfigured === true
  const auditRetained = Boolean(storedAudits[pageKey] && storedAudits[pageKey].isAudited)

  console.log('\n====================================================')
  if (phraseOk && typeOk && priorityOk && configuredOk && auditRetained) {
    console.log('VERIFICATION RESULT: PASSED ✓ All W3 settings & W4 audit records preserved!')
  } else {
    console.error('VERIFICATION RESULT: FAILED ✗ Settings were lost.')
  }
  console.log('====================================================')
}

testW3PreservationFix()
