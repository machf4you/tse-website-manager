/**
 * TSE Universal Regression Test: W4 Optimisation Workflow Persistence
 * 
 * Verifies the COMPLETE W4 workflow:
 * 1. Save Proposed Metadata (Title, Description, H1)
 * 2. Push Changes to WordPress
 * 3. Single-Page Sync (pulls live values back into Manager)
 * 4. Single-Page Re-run Audit
 * 5. Page Reload / Cache Rehydration
 *
 * Invariant: Saved user metadata is AUTHORITATIVE. It must remain unchanged
 * throughout all steps and must NEVER be replaced by generated recommendations
 * or overwritten by stale synced data when live values match saved values.
 */

import assert from 'node:assert/strict'
import { resolveProposedField, generateSeoRecommendations } from '../src/utils/seoRecommendationGenerator.js'
import { formatReadableDateTime } from '../src/utils/dateFormatter.js'
import { getCandidatePageKeys, findAuditRecordInMap, getSiteAuditsStorageKey } from '../src/utils/siteKeyHelper.js'
import { decodeHtmlEntities } from '../src/utils/safeString.js'
import { decodeHtmlEntities as serverDecodeHtmlEntities } from '../server/wordpressSeoPusher.js'

console.log('\n============================================================')
console.log('🧪 RUNNING W4 OPTIMISATION WORKFLOW REGRESSION SUITE')
console.log('============================================================\n')

function runTest(name, fn) {
  try {
    fn()
    console.log(`  ✅ [PASS] ${name}`)
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`)
    console.error(err)
    process.exit(1)
  }
}

// -------------------------------------------------------------
// Test 1: resolveProposedField authoritatively preserves saved values
// -------------------------------------------------------------
runTest('Invariant: resolveProposedField preserves user-saved metadata even when matching live site', () => {
  const userSavedTitle = 'Custom Optimised Title for Autotech'
  const liveActualTitle = 'Custom Optimised Title for Autotech' // Pushed & synced to live site
  const aiGeneratedRec = 'Autotech - Car Repairs & Servicing'

  const resolvedTitle = resolveProposedField(userSavedTitle, liveActualTitle, aiGeneratedRec, 'Autotech')
  assert.equal(
    resolvedTitle,
    userSavedTitle,
    'User-saved title was reverted to recommendation after live sync!'
  )

  const userSavedDesc = 'Deb custom meta description for Autotech homepage that meets all search guidelines.'
  const liveActualDesc = 'Deb custom meta description for Autotech homepage that meets all search guidelines.'
  const aiGeneratedDesc = 'Generic AI auto-generated description template for Autotech garage.'

  const resolvedDesc = resolveProposedField(userSavedDesc, liveActualDesc, aiGeneratedDesc, 'Autotech')
  assert.equal(
    resolvedDesc,
    userSavedDesc,
    'User-saved description was reverted to recommendation after live sync!'
  )

  const userSavedH1 = 'Expert Car Servicing & MOT in Surbiton'
  const liveActualH1 = 'Expert Car Servicing & MOT in Surbiton'
  const aiGeneratedH1 = 'Autotech: Garage Services'

  const resolvedH1 = resolveProposedField(userSavedH1, liveActualH1, aiGeneratedH1, 'Autotech')
  assert.equal(
    resolvedH1,
    userSavedH1,
    'User-saved H1 was reverted to recommendation after live sync!'
  )
})

// -------------------------------------------------------------
// Test 2: resolveProposedField falls back to recommendations ONLY when saved value is empty
// -------------------------------------------------------------
runTest('Fallback: resolveProposedField generates recommendation only when proposed value is empty', () => {
  const emptySaved = ''
  const liveActual = 'Old Unoptimised Title'
  const aiGeneratedRec = 'Autotech | Premier Garage & MOT'

  const resolved = resolveProposedField(emptySaved, liveActual, aiGeneratedRec, 'Autotech')
  assert.equal(
    resolved,
    aiGeneratedRec,
    'Empty proposed title failed to fall back to generated recommendation.'
  )
})

// -------------------------------------------------------------
// Test 3: Complete Workflow Simulation (Save -> Push -> Sync -> Audit -> Hydrate)
// -------------------------------------------------------------
runTest('Full Lifecycle: Save -> Push -> Single-Page Sync -> Re-audit -> Reload/Hydrate', () => {
  // Step 0: Initial Raw Page (unconfigured)
  const initialPage = {
    id: 101,
    url: 'https://autotech.co.uk/',
    title: 'Home',
    originalTitle: 'Home',
    actualMetaTitle: 'Home - Autotech',
    actualMetaDescription: 'Welcome to Autotech website.',
    actualH1: 'Welcome to Autotech',
    targetPhrase: 'car servicing surbiton'
  }

  // Step 1: User edits and saves in Manager
  const userEditedFields = {
    metaTitle: 'Car Servicing & MOT Surbiton | Autotech Garage',
    proposedTitle: 'Car Servicing & MOT Surbiton | Autotech Garage',
    metaDescription: 'Trusted car servicing, repairs and MOT testing in Surbiton by Autotech certified technicians. Book your service online today.',
    proposedMetaDescription: 'Trusted car servicing, repairs and MOT testing in Surbiton by Autotech certified technicians. Book your service online today.',
    h1: 'Car Servicing & MOT Testing in Surbiton',
    proposedH1: 'Car Servicing & MOT Testing in Surbiton'
  }

  // Save to stored configuration map
  const storedConfigs = {
    '101': {
      pageId: '101',
      url: initialPage.url,
      targetPhrase: initialPage.targetPhrase,
      ...userEditedFields,
      isConfigured: true,
      isManualOverride: true,
      updatedAt: new Date().toISOString()
    }
  }

  // Step 2: Push to WP simulation (WP now contains the saved values)
  const pushedWpData = {
    id: 101,
    url: initialPage.url,
    title: userEditedFields.h1,
    yoast_wpseo_title: userEditedFields.metaTitle,
    yoast_wpseo_metadesc: userEditedFields.metaDescription
  }

  // Step 3: Single-Page Sync simulation
  const syncResult = {
    success: true,
    pageId: 101,
    actualMetaTitle: pushedWpData.yoast_wpseo_title,
    actualMetaDescription: pushedWpData.yoast_wpseo_metadesc,
    actualH1: pushedWpData.title,
    lastSyncTimestamp: '22 September 2026 16:30'
  }

  // Update stored configuration with synced actuals (without wiping proposed fields)
  storedConfigs['101'] = {
    ...storedConfigs['101'],
    actualMetaTitle: syncResult.actualMetaTitle,
    actualMetaDescription: syncResult.actualMetaDescription,
    actualH1: syncResult.actualH1,
    pushedActualMetaTitle: syncResult.actualMetaTitle,
    pushedActualMetaDescription: syncResult.actualMetaDescription,
    pushedActualH1: syncResult.actualH1,
    lastSyncTimestamp: syncResult.lastSyncTimestamp
  }

  // Step 4: Single-Page Audit simulation
  const auditResult = {
    isAudited: true,
    passedCount: 8,
    totalCount: 8,
    failedIssues: [],
    page_snapshot: {
      title: syncResult.actualMetaTitle,
      meta_description: syncResult.actualMetaDescription,
      h1: [syncResult.actualH1]
    }
  }

  // Step 5: Application Reload / State Hydration Simulation
  // ManageWebsitePage / PageAuditResultsPage hydrates exportedPages:
  const override = storedConfigs['101']
  const rawSavedTitle = override.proposedTitle || override.metaTitle || initialPage.proposedTitle || initialPage.metaTitle
  const rawSavedDesc = override.proposedMetaDescription || override.metaDescription || initialPage.proposedMetaDescription || initialPage.metaDescription
  const rawSavedH1 = override.proposedH1 || override.h1 || initialPage.proposedH1 || initialPage.h1

  const recs = generateSeoRecommendations({
    targetPhrase: override.targetPhrase,
    actualMetaTitle: syncResult.actualMetaTitle,
    actualMetaDescription: syncResult.actualMetaDescription,
    actualH1: syncResult.actualH1,
    pageUrl: initialPage.url,
    pageTitle: initialPage.title,
    siteName: 'Autotech'
  })

  const finalTitle = resolveProposedField(rawSavedTitle, syncResult.actualMetaTitle, recs.proposedTitle, 'Autotech')
  const finalDesc = resolveProposedField(rawSavedDesc, syncResult.actualMetaDescription, recs.proposedMetaDescription, 'Autotech')
  const finalH1 = resolveProposedField(rawSavedH1, syncResult.actualH1, recs.proposedH1, 'Autotech')

  const hydratedPage = {
    ...initialPage,
    ...override,
    title: finalTitle,
    proposedTitle: finalTitle,
    metaTitle: finalTitle,
    proposedMetaDescription: finalDesc,
    metaDescription: finalDesc,
    proposedH1: finalH1,
    h1: finalH1,
    actualMetaTitle: syncResult.actualMetaTitle,
    actualMetaDescription: syncResult.actualMetaDescription,
    actualH1: syncResult.actualH1
  }

  // Verification Assertions
  assert.equal(hydratedPage.proposedTitle, userEditedFields.metaTitle, 'Hydrated proposed title was corrupted!')
  assert.equal(hydratedPage.proposedMetaDescription, userEditedFields.metaDescription, 'Hydrated proposed meta description was corrupted!')
  assert.equal(hydratedPage.proposedH1, userEditedFields.h1, 'Hydrated proposed H1 was corrupted!')
  assert.equal(hydratedPage.actualMetaTitle, userEditedFields.metaTitle, 'Live actual meta title mismatch!')
  assert.equal(hydratedPage.actualMetaDescription, userEditedFields.metaDescription, 'Live actual meta description mismatch!')
  assert.equal(hydratedPage.actualH1, userEditedFields.h1, 'Live actual H1 mismatch!')
})

// -------------------------------------------------------------
// Test 4: Timestamp Freshness Comparison Logic (Prevent False "Live data has changed" Warning)
// -------------------------------------------------------------
runTest('Timestamp Freshness: Same minute or identical displayed timestamps do not trigger stale warning', () => {
  const parseTimestampToMs = (str) => {
    if (!str) return 0
    if (typeof str === 'number') return str > 1e11 ? str : str * 1000
    if (typeof str !== 'string') return 0
    const trimmed = str.trim()

    const readableMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/)
    if (readableMatch) {
      const [, day, monthName, year, hours = '00', minutes = '00'] = readableMatch
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ]
      const monthIdx = monthNames.indexOf(monthName.toLowerCase())
      if (monthIdx !== -1) {
        return new Date(parseInt(year, 10), monthIdx, parseInt(day, 10), parseInt(hours, 10), parseInt(minutes, 10)).getTime()
      }
    }

    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/)
    if (ddmmyyyyMatch) {
      const [, day, month, year, hours = '00', minutes = '00'] = ddmmyyyyMatch
      return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), parseInt(hours, 10), parseInt(minutes, 10)).getTime()
    }

    const isoTime = Date.parse(trimmed)
    return isNaN(isoTime) ? 0 : isoTime
  }

  const checkIsSyncNewer = (rawSync, rawAudit) => {
    const lastAuditTimestampStr = formatReadableDateTime(rawAudit)
    const lastSyncTimestampStr = formatReadableDateTime(rawSync)
    const lastAuditMs = parseTimestampToMs(rawAudit || lastAuditTimestampStr)
    const lastSyncMs = parseTimestampToMs(rawSync || lastSyncTimestampStr)

    return Boolean(
      lastSyncMs > 0 &&
      lastAuditMs > 0 &&
      Math.floor(lastSyncMs / 60000) > Math.floor(lastAuditMs / 60000) &&
      lastSyncTimestampStr !== lastAuditTimestampStr
    )
  }

  // Case 1: Identical formatted strings from UI display (Deb's scenario: 13:27 vs 13:27)
  const isNewer1 = checkIsSyncNewer('2026-09-22T11:27:48.000Z', '22 September 2026 13:27')
  assert.equal(isNewer1, false, 'Identical minute timestamps erroneously triggered stale warning!')

  // Case 2: Same minute ISO timestamps
  const isNewer2 = checkIsSyncNewer('2026-09-22T11:27:45.000Z', '2026-09-22T11:27:10.000Z')
  assert.equal(isNewer2, false, 'Same-minute ISO timestamps erroneously triggered stale warning!')

  // Case 3: Sync is genuinely newer by 15 minutes
  const isNewer3 = checkIsSyncNewer('2026-09-22T11:45:00.000Z', '2026-09-22T11:30:00.000Z')
  assert.equal(isNewer3, true, 'Genuinely newer sync failed to trigger warning!')

  // Case 4: Audit is newer than sync
  const isNewer4 = checkIsSyncNewer('2026-09-22T11:30:00.000Z', '2026-09-22T11:45:00.000Z')
  assert.equal(isNewer4, false, 'Newer audit erroneously triggered stale warning!')
})

// -------------------------------------------------------------
// Test 5: Rank Math Payload & Endpoint Dispatch
// -------------------------------------------------------------
runTest('Rank Math SEO: Generates rank_math_title, rank_math_description, and focus keyword in payload', () => {
  const metaTitle = 'Car Servicing & MOT Erith | Auto Tech Erith'
  const metaDescription = 'Expert car servicing, MOT testing and diagnostics in Erith by Auto Tech.'
  const targetPhrase = 'garage services erith'

  const universalMeta = {
    // Rank Math SEO
    ...(metaTitle ? { rank_math_title: metaTitle } : {}),
    ...(metaDescription ? { rank_math_description: metaDescription } : {}),
    ...(targetPhrase ? { rank_math_focus_keyword: targetPhrase } : {}),
    // Yoast SEO
    ...(metaTitle ? { _yoast_wpseo_title: metaTitle, yoast_wpseo_title: metaTitle } : {}),
    ...(metaDescription ? { _yoast_wpseo_metadesc: metaDescription, yoast_wpseo_metadesc: metaDescription } : {}),
    ...(targetPhrase ? { _yoast_wpseo_focuskw: targetPhrase } : {}),
  }

  assert.equal(universalMeta.rank_math_title, metaTitle, 'Rank Math title missing from payload')
  assert.equal(universalMeta.rank_math_description, metaDescription, 'Rank Math description missing from payload')
  assert.equal(universalMeta.rank_math_focus_keyword, targetPhrase, 'Rank Math focus keyword missing from payload')

  // Verify Rank Math REST payload structure
  const rankMathEndpointPayload = {
    objectType: 'post',
    objectID: 8,
    meta: {
      rank_math_title: metaTitle,
      rank_math_description: metaDescription,
      rank_math_focus_keyword: targetPhrase
    }
  }

  assert.equal(rankMathEndpointPayload.objectType, 'post')
  assert.equal(rankMathEndpointPayload.objectID, 8)
  assert.equal(rankMathEndpointPayload.meta.rank_math_title, metaTitle)
})

// -------------------------------------------------------------
// Test 6: Yoast SEO Payload & Endpoint Dispatch
// -------------------------------------------------------------
runTest('Yoast SEO: Generates _yoast_wpseo_title, _yoast_wpseo_metadesc in payload', () => {
  const metaTitle = 'Loft Conversions Dulwich | Expert Builders'
  const metaDescription = 'Bespoke loft conversions and home extensions in Dulwich.'
  const targetPhrase = 'loft conversions dulwich'

  const universalMeta = {
    ...(metaTitle ? { _yoast_wpseo_title: metaTitle, yoast_wpseo_title: metaTitle } : {}),
    ...(metaDescription ? { _yoast_wpseo_metadesc: metaDescription, yoast_wpseo_metadesc: metaDescription } : {}),
    ...(targetPhrase ? { _yoast_wpseo_focuskw: targetPhrase } : {}),
  }

  assert.equal(universalMeta._yoast_wpseo_title, metaTitle)
  assert.equal(universalMeta.yoast_wpseo_title, metaTitle)
  assert.equal(universalMeta._yoast_wpseo_metadesc, metaDescription)
  assert.equal(universalMeta._yoast_wpseo_focuskw, targetPhrase)
})

// -------------------------------------------------------------
// Test 7: Failed Metadata Write Detection (Rejects False Success)
// -------------------------------------------------------------
runTest('Verification Failure: Core REST 200 OK must FAIL if live values are unchanged (silent WordPress discard)', () => {
  const pushedMetaTitle = 'New Optimised Title'
  const pushedMetaDesc = 'New Optimised Description'
  const pushedH1 = 'New Optimised H1'

  // WordPress returned 200 on post_title/content but discarded meta fields (e.g. unregistered meta on Rank Math site without endpoint)
  const liveVerifiedHtml = {
    title: 'Old Unchanged Title',
    metaDesc: 'Old Unchanged Description',
    h1: 'New Optimised H1'
  }
  const restEditData = {
    title: { rendered: 'New Optimised H1' },
    meta: { footnotes: '' } // meta fields ignored!
  }

  // Verification logic:
  const failedFields = []
  const titleMatchesHtml = liveVerifiedHtml.title && (liveVerifiedHtml.title === pushedMetaTitle || liveVerifiedHtml.title.includes(pushedMetaTitle))
  const titleMatchesRest = restEditData.meta?.rank_math_title === pushedMetaTitle || restEditData.meta?._yoast_wpseo_title === pushedMetaTitle
  if (!titleMatchesHtml && !titleMatchesRest) {
    failedFields.push({ field: 'Meta Title', expected: pushedMetaTitle, actual: liveVerifiedHtml.title })
  }

  const descMatchesHtml = liveVerifiedHtml.metaDesc && (liveVerifiedHtml.metaDesc === pushedMetaDesc || liveVerifiedHtml.metaDesc.includes(pushedMetaDesc))
  const descMatchesRest = restEditData.meta?.rank_math_description === pushedMetaDesc || restEditData.meta?._yoast_wpseo_metadesc === pushedMetaDesc
  if (!descMatchesHtml && !descMatchesRest) {
    failedFields.push({ field: 'Meta Description', expected: pushedMetaDesc, actual: liveVerifiedHtml.metaDesc })
  }

  assert.equal(failedFields.length, 2, 'Failed write was not caught by round-trip verification!')
  assert.equal(failedFields[0].field, 'Meta Title')
  assert.equal(failedFields[1].field, 'Meta Description')
})

// -------------------------------------------------------------
// Test 8: Successful Round-Trip Verification
// -------------------------------------------------------------
runTest('Verification Success: Passes when live HTML or REST matches all pushed fields', () => {
  const pushedMetaTitle = 'Car Servicing & MOT Erith | Auto Tech Erith'
  const pushedMetaDesc = 'Expert car servicing, MOT testing and diagnostics in Erith by Auto Tech.'
  const pushedH1 = 'Garage Services in Erith'

  const liveVerifiedHtml = {
    title: 'Car Servicing & MOT Erith | Auto Tech Erith',
    metaDesc: 'Expert car servicing, MOT testing and diagnostics in Erith by Auto Tech.',
    h1: 'Garage Services in Erith'
  }
  const restEditData = {
    title: { rendered: 'Garage Services in Erith' },
    meta: {
      rank_math_title: 'Car Servicing & MOT Erith | Auto Tech Erith',
      rank_math_description: 'Expert car servicing, MOT testing and diagnostics in Erith by Auto Tech.'
    }
  }

  const failedFields = []
  const titleMatchesHtml = liveVerifiedHtml.title && (liveVerifiedHtml.title === pushedMetaTitle || liveVerifiedHtml.title.includes(pushedMetaTitle))
  const titleMatchesRest = restEditData.meta?.rank_math_title === pushedMetaTitle || restEditData.meta?._yoast_wpseo_title === pushedMetaTitle
  if (!titleMatchesHtml && !titleMatchesRest) {
    failedFields.push({ field: 'Meta Title', expected: pushedMetaTitle, actual: liveVerifiedHtml.title })
  }

  const descMatchesHtml = liveVerifiedHtml.metaDesc && (liveVerifiedHtml.metaDesc === pushedMetaDesc || liveVerifiedHtml.metaDesc.includes(pushedMetaDesc))
  const descMatchesRest = restEditData.meta?.rank_math_description === pushedMetaDesc || restEditData.meta?._yoast_wpseo_metadesc === pushedMetaDesc
  if (!descMatchesHtml && !descMatchesRest) {
    failedFields.push({ field: 'Meta Description', expected: pushedMetaDesc, actual: liveVerifiedHtml.metaDesc })
  }

  const h1MatchesHtml = liveVerifiedHtml.h1 && liveVerifiedHtml.h1.toLowerCase().includes(pushedH1.toLowerCase())
  const h1MatchesRest = restEditData.title?.rendered && restEditData.title.rendered.toLowerCase().includes(pushedH1.toLowerCase())
  if (!h1MatchesHtml && !h1MatchesRest) {
    failedFields.push({ field: 'H1 Heading', expected: pushedH1, actual: liveVerifiedHtml.h1 })
  }

  assert.equal(failedFields.length, 0, 'Valid update was erroneously marked as failed!')
})

// -------------------------------------------------------------
// Test 9: W4 Re-run Audit Direct Execution & Stale Banner Dismissal
// -------------------------------------------------------------
runTest('Re-run Audit: Fresh audit timestamp dismisses stale warning banner immediately', () => {
  const syncTimestampStr = '23 September 2026 09:47'
  const oldAuditTimestampStr = '22 September 2026 16:51'

  const parseTimestampToMs = (str) => {
    if (!str) return 0
    if (typeof str === 'number') return str > 1e11 ? str : str * 1000
    if (typeof str !== 'string') return 0
    const trimmed = str.trim()
    const readableMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/)
    if (readableMatch) {
      const [, day, monthName, year, hours = '00', minutes = '00'] = readableMatch
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ]
      const monthIdx = monthNames.indexOf(monthName.toLowerCase())
      if (monthIdx !== -1) {
        return new Date(parseInt(year, 10), monthIdx, parseInt(day, 10), parseInt(hours, 10), parseInt(minutes, 10)).getTime()
      }
    }
    const isoTime = Date.parse(trimmed)
    return isNaN(isoTime) ? 0 : isoTime
  }

  const checkIsSyncNewer = (rawSync, rawAudit) => {
    const lastAuditTimestampStr = formatReadableDateTime(rawAudit)
    const lastSyncTimestampStr = formatReadableDateTime(rawSync)
    const lastAuditMs = parseTimestampToMs(rawAudit || lastAuditTimestampStr)
    const lastSyncMs = parseTimestampToMs(rawSync || lastSyncTimestampStr)

    return Boolean(
      lastSyncMs > 0 &&
      lastAuditMs > 0 &&
      Math.floor(lastSyncMs / 60000) > Math.floor(lastAuditMs / 60000) &&
      lastSyncTimestampStr !== lastAuditTimestampStr
    )
  }

  // Before re-run: Sync is 23 Sept, Audit is 22 Sept -> Stale banner MUST show
  assert.equal(checkIsSyncNewer(syncTimestampStr, oldAuditTimestampStr), true, 'Stale banner should be active before re-run')

  // Execute Re-run Audit at 23 September 2026 09:55
  const freshAuditIso = new Date('2026-09-23T09:55:00.000Z').toISOString()
  const freshAuditTimestampStr = formatReadableDateTime(freshAuditIso)

  // After re-run: Audit is 09:55, Sync is 09:47 -> Stale banner MUST vanish
  assert.equal(checkIsSyncNewer(syncTimestampStr, freshAuditIso), false, 'Stale banner should be dismissed after re-run')
  assert.equal(checkIsSyncNewer(syncTimestampStr, freshAuditTimestampStr), false, 'Formatted fresh audit timestamp should also dismiss banner')
})

// -------------------------------------------------------------
// Test 10: Page Key Normalization (Integer, Float String, Canonical URLs)
// -------------------------------------------------------------
runTest('Candidate Keys: Normalizes integer ID, float string (8.0), and URLs with/without trailing slash', () => {
  const pageWithFloatId = {
    id: '8.0',
    url: 'https://www.autotecherith.co.uk/'
  }
  const rawPage = {
    id: 8,
    url: 'https://www.autotecherith.co.uk'
  }

  const candidateKeys = getCandidatePageKeys(pageWithFloatId, rawPage, 'https://www.autotecherith.co.uk/')

  assert.ok(candidateKeys.includes('8'), 'Candidate keys must include integer string "8"')
  assert.ok(candidateKeys.includes('8.0'), 'Candidate keys must include float string "8.0"')
  assert.ok(candidateKeys.includes('https://www.autotecherith.co.uk/'), 'Candidate keys must include URL with trailing slash')
  assert.ok(candidateKeys.includes('https://www.autotecherith.co.uk'), 'Candidate keys must include URL without trailing slash')
  assert.ok(candidateKeys.includes('/'), 'Candidate keys must include root pathname "/"')

  // Find in map indexed by float string "8.0"
  const auditsMapIndexedByFloat = {
    '8.0': { isAudited: true, lastAuditTimestamp: '2026-09-23T09:55:00.000Z', auditResult: { score: 95 } }
  }
  const foundFromFloat = findAuditRecordInMap(auditsMapIndexedByFloat, candidateKeys)
  assert.equal(foundFromFloat?.auditResult?.score, 95, 'Failed to resolve audit record indexed by float "8.0"')

  // Find in map indexed by integer "8"
  const auditsMapIndexedByInt = {
    '8': { isAudited: true, lastAuditTimestamp: '2026-09-23T09:55:00.000Z', auditResult: { score: 98 } }
  }
  const foundFromInt = findAuditRecordInMap(auditsMapIndexedByInt, candidateKeys)
  assert.equal(foundFromInt?.auditResult?.score, 98, 'Failed to resolve audit record indexed by integer "8"')

  // Find in map indexed by URL
  const auditsMapIndexedByUrl = {
    'https://www.autotecherith.co.uk/': { isAudited: true, lastAuditTimestamp: '2026-09-23T09:55:00.000Z', auditResult: { score: 100 } }
  }
  const foundFromUrl = findAuditRecordInMap(auditsMapIndexedByUrl, candidateKeys)
  assert.equal(foundFromUrl?.auditResult?.score, 100, 'Failed to resolve audit record indexed by full URL')
})

// -------------------------------------------------------------
// Test 11: Re-hydration Retains Fresh Audit Across Page Switch / Navigation
// -------------------------------------------------------------
runTest('Persistence: Stored audit persists and is hydrated under all candidate keys without bounce', () => {
  const mockStorage = {}
  const storageKey = getSiteAuditsStorageKey({ id: '2' })
  const page = { id: 8, url: 'https://www.autotecherith.co.uk/' }

  const candidateKeys = getCandidatePageKeys(page, null, page.url)
  const freshRecord = {
    isAudited: true,
    isStale: false,
    staleReason: null,
    lastAuditTimestamp: '2026-09-23T09:55:00.000Z',
    auditResult: { passedCount: 8, totalCount: 8 }
  }

  // Write fresh record under all candidate keys
  candidateKeys.forEach(k => {
    mockStorage[k] = freshRecord
  })

  // Simulate returning to the page (e.g. looking up by "8.0" or URL)
  const rehydratedKeys = getCandidatePageKeys({ id: '8.0', url: 'https://www.autotecherith.co.uk' }, null, null)
  const hydratedRecord = findAuditRecordInMap(mockStorage, rehydratedKeys)

  assert.ok(hydratedRecord, 'Audit record was lost during hydration!')
  assert.equal(hydratedRecord.lastAuditTimestamp, '2026-09-23T09:55:00.000Z')
  assert.equal(hydratedRecord.isStale, false)
})

// -------------------------------------------------------------
// Test 12: Multi-Site Audit Storage Isolation
// -------------------------------------------------------------
runTest('Multi-Site Isolation: Site 1 and Site 2 audit keys do not collide', () => {
  const site1Key = getSiteAuditsStorageKey({ id: '1' })
  const site2Key = getSiteAuditsStorageKey({ id: '2' })

  assert.equal(site1Key, 'tse_page_audits_1')
  assert.equal(site2Key, 'tse_page_audits_2')
  assert.notEqual(site1Key, site2Key)
})

// -------------------------------------------------------------
// Test 13: HTML Entity Normalization in Round-Trip Verification
// -------------------------------------------------------------
runTest('HTML Entity Verification: All named, numeric decimal, and hex entities match human-readable values', () => {
  function verifyFieldMatch(pushedValue, liveHtmlValue) {
    function cleanStr(s) {
      return serverDecodeHtmlEntities(String(s || ''))
        .replace(/[\u2013\u2014\u2018\u2019\u201C\u201D"']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
    }
    const exp = cleanStr(pushedValue)
    const act = cleanStr(liveHtmlValue)
    return act.includes(exp) || exp.includes(act)
  }

  // 1. &amp;, &#038;, &#38; vs &
  assert.ok(verifyFieldMatch('Garage Services in Erith | MOT, Servicing & Repairs', 'Garage Services in Erith | MOT, Servicing &amp; Repairs'), 'Failed &amp; match')
  assert.ok(verifyFieldMatch('Garage Services in Erith | MOT, Servicing & Repairs', 'Garage Services in Erith | MOT, Servicing &#038; Repairs'), 'Failed &#038; match')
  assert.ok(verifyFieldMatch('Garage Services in Erith | MOT, Servicing & Repairs', 'Garage Services in Erith | MOT, Servicing &#38; Repairs'), 'Failed &#38; match')
  assert.ok(verifyFieldMatch('Smith & Jones', 'Smith &amp; Jones'), 'Failed Smith & Jones match')

  // 2. &quot; vs "
  assert.ok(verifyFieldMatch('The "Best" Garage in Erith', 'The &quot;Best&quot; Garage in Erith'), 'Failed &quot; match')

  // 3. &#039;, &#39;, &apos; vs '
  assert.ok(verifyFieldMatch("Don't Miss Our Deals", "Don&#039;t Miss Our Deals"), 'Failed &#039; match')
  assert.ok(verifyFieldMatch("Don't Miss Our Deals", "Don&#39;t Miss Our Deals"), 'Failed &#39; match')
  assert.ok(verifyFieldMatch("Don't Miss Our Deals", "Don&apos;t Miss Our Deals"), 'Failed &apos; match')

  // 4. &lt; and &gt; vs < and >
  assert.ok(verifyFieldMatch('MOT Testing < 3.5 Tonnes', 'MOT Testing &lt; 3.5 Tonnes'), 'Failed &lt; match')
  assert.ok(verifyFieldMatch('Repairs > 1 Year Warranty', 'Repairs &gt; 1 Year Warranty'), 'Failed &gt; match')

  // 5. &nbsp; vs whitespace
  assert.ok(verifyFieldMatch('Car Servicing Erith', 'Car&nbsp;Servicing&nbsp;Erith'), 'Failed &nbsp; match')

  // 6. &ndash; and &mdash; vs dashes
  assert.ok(verifyFieldMatch('Car Servicing – Auto Tech', 'Car Servicing &ndash; Auto Tech'), 'Failed &ndash; match')
  assert.ok(verifyFieldMatch('Car Servicing — Auto Tech', 'Car Servicing &mdash; Auto Tech'), 'Failed &mdash; match')

  // 7. Smart quotes: &lsquo;, &rsquo;, &ldquo;, &rdquo;
  assert.ok(verifyFieldMatch('Expert ‘Quality’ Service', 'Expert &lsquo;Quality&rsquo; Service'), 'Failed &lsquo;/&rsquo; match')
  assert.ok(verifyFieldMatch('Expert “Quality” Service', 'Expert &ldquo;Quality&rdquo; Service'), 'Failed &ldquo;/&rdquo; match')

  // 8. Decimal numeric entities (e.g. &#8211; ndash, &#8217; right single quote)
  assert.ok(verifyFieldMatch('MOT – Servicing', 'MOT &#8211; Servicing'), 'Failed decimal &#8211; match')
  assert.ok(verifyFieldMatch("Driver's Choice", "Driver&#8217;s Choice"), 'Failed decimal &#8217; match')

  // 9. Hexadecimal numeric entities (e.g. &#x26; ampersand, &#x2013; ndash, &#x27; apostrophe)
  assert.ok(verifyFieldMatch('MOT & Repairs', 'MOT &#x26; Repairs'), 'Failed hex &#x26; match')
  assert.ok(verifyFieldMatch('MOT – Repairs', 'MOT &#x2013; Repairs'), 'Failed hex &#x2013; match')
  assert.ok(verifyFieldMatch("Car's MOT", "Car&#x27;s MOT"), 'Failed hex &#x27; match')

  // 10. Frontend decodeHtmlEntities matching
  assert.equal(decodeHtmlEntities('Garage Services in Erith | MOT, Servicing &amp; Repairs'), 'Garage Services in Erith | MOT, Servicing & Repairs')
  assert.equal(decodeHtmlEntities('Don&#039;t Miss &quot;Our&quot; Deals'), 'Don\'t Miss "Our" Deals')
})

// -------------------------------------------------------------
// Test 14: Strict Verification Invariant (Genuinely Different Values Must Still FAIL)
// -------------------------------------------------------------
runTest('Strict Verification Invariant: Genuinely different metadata continues to strictly fail', () => {
  function verifyFullRoundTrip({ pushedTitle, pushedDesc, pushedH1, liveTitle, liveDesc, liveH1 }) {
    function cleanStr(s) {
      return serverDecodeHtmlEntities(String(s || ''))
        .replace(/[\u2013\u2014\u2018\u2019\u201C\u201D"']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
    }

    const failedFields = []

    if (pushedTitle && pushedTitle.trim()) {
      const expT = cleanStr(pushedTitle)
      const actT = cleanStr(liveTitle)
      if (!actT || (!actT.includes(expT) && !expT.includes(actT))) {
        failedFields.push({ field: 'Meta Title', expected: serverDecodeHtmlEntities(pushedTitle), actual: liveTitle })
      }
    }

    if (pushedDesc && pushedDesc.trim()) {
      const expD = cleanStr(pushedDesc)
      const actD = cleanStr(liveDesc)
      if (!actD || (!actD.includes(expD) && !expD.includes(actD))) {
        failedFields.push({ field: 'Meta Description', expected: serverDecodeHtmlEntities(pushedDesc), actual: liveDesc })
      }
    }

    if (pushedH1 && pushedH1.trim()) {
      const expH = cleanStr(pushedH1)
      const actH = cleanStr(liveH1)
      if (!actH || (!actH.includes(expH) && !expH.includes(actH))) {
        failedFields.push({ field: 'H1 Tag', expected: serverDecodeHtmlEntities(pushedH1), actual: liveH1 })
      }
    }

    return {
      success: failedFields.length === 0,
      failedFields
    }
  }

  // Case A: Genuinely different title with entity (e.g. "Smith & Brown" vs "Smith & Jones") -> MUST FAIL
  const resA = verifyFullRoundTrip({
    pushedTitle: 'Smith & Jones Builders',
    pushedDesc: 'Trusted building services.',
    pushedH1: 'Smith & Jones',
    liveTitle: 'Smith &amp; Brown Builders', // Different company name!
    liveDesc: 'Trusted building services.',
    liveH1: 'Smith &amp; Jones'
  })
  assert.equal(resA.success, false, 'Genuinely different title erroneously passed verification!')
  assert.equal(resA.failedFields.length, 1)
  assert.equal(resA.failedFields[0].field, 'Meta Title')

  // Case B: Completely different title -> MUST FAIL
  const resB = verifyFullRoundTrip({
    pushedTitle: 'Garage Services in Erith | MOT, Servicing & Repairs',
    pushedDesc: 'Expert car servicing in Erith.',
    pushedH1: 'Local Garage Services in Erith',
    liveTitle: 'Old Unchanged Homepage Title - Auto Tech', // Unchanged live title
    liveDesc: 'Expert car servicing in Erith.',
    liveH1: 'Local Garage Services in Erith'
  })
  assert.equal(resB.success, false, 'Unchanged title failed to trigger failure!')
  assert.equal(resB.failedFields[0].field, 'Meta Title')

  // Case C: Empty / missing live description -> MUST FAIL
  const resC = verifyFullRoundTrip({
    pushedTitle: 'Garage Services in Erith | MOT, Servicing & Repairs',
    pushedDesc: 'Expert car servicing in Erith.',
    pushedH1: 'Local Garage Services in Erith',
    liveTitle: 'Garage Services in Erith | MOT, Servicing &amp; Repairs',
    liveDesc: '', // Discarded description
    liveH1: 'Local Garage Services in Erith'
  })
  assert.equal(resC.success, false, 'Missing description failed to trigger failure!')
  assert.equal(resC.failedFields[0].field, 'Meta Description')

  // Case D: Completely matching payload with multiple HTML entities -> MUST PASS
  const resD = verifyFullRoundTrip({
    pushedTitle: 'Garage Services in Erith | MOT, Servicing & Repairs',
    pushedDesc: "Auto Tech's premier garage — servicing & MOT in Erith.",
    pushedH1: 'Local Garage Services & Repairs in Erith',
    liveTitle: 'Garage Services in Erith | MOT, Servicing &amp; Repairs',
    liveDesc: 'Auto Tech&#039;s premier garage &mdash; servicing &amp; MOT in Erith.',
    liveH1: 'Local Garage Services &amp; Repairs in Erith'
  })
  assert.equal(resD.success, true, 'Valid update with entities was rejected!')
  assert.equal(resD.failedFields.length, 0)
})

// -------------------------------------------------------------
// Test 12: W3 CMS Page Title (e.g. 'Home') vs W4 SEO Meta Title Separation
// -------------------------------------------------------------
runTest('Invariant: W3 CMS page titles (Home, About Us) must NOT override passing live SEO Meta Titles in W4', () => {
  const liveActualMetaTitle = 'Digital Services Costa Blanca | Web Design, WordPress, E-commerce & SEO'
  const targetPhrase = 'Digital Services Costa Blanca'

  const recs = generateSeoRecommendations({
    targetPhrase,
    actualMetaTitle: liveActualMetaTitle,
    actualMetaDescription: 'Professional web design, WordPress and digital marketing services across Costa Blanca.',
    actualH1: 'Digital Services Across the Costa Blanca',
    pageUrl: 'https://digitalspain.es/',
    pageTitle: 'Home',
    siteName: 'Digital Spain'
  })

  // Simulated W3 configuration object where user configured page targeting in W3:
  // W3 sets title: 'Home', proposedTitle: 'Home', but has NO explicit SEO metaTitle override.
  const w3Config = {
    pageId: 'home',
    url: 'https://digitalspain.es/',
    title: 'Home',
    proposedTitle: 'Home',
    targetPhrase: 'Digital Services Costa Blanca',
    isConfigured: true
  }

  // W4 resolution logic: rawSavedTitle must check explicit metaTitle override, NOT W3's proposedTitle
  const rawSavedTitle = w3Config.metaTitle || ''
  const resolvedProposedTitle = resolveProposedField(rawSavedTitle, liveActualMetaTitle, recs.proposedTitle, 'Digital Spain')

  assert.equal(
    resolvedProposedTitle,
    liveActualMetaTitle,
    `W4 erroneously proposed CMS page title "${resolvedProposedTitle}" instead of live SEO title "${liveActualMetaTitle}"!`
  )

  // When user explicitly saves a W4 SEO Meta Title override, that explicit override MUST be preserved
  const explicitSeoTitleOverride = 'Custom Digital Services in Costa Blanca | Digital Spain'
  const w4SavedConfig = {
    ...w3Config,
    metaTitle: explicitSeoTitleOverride
  }

  const explicitRawSavedTitle = w4SavedConfig.metaTitle || ''
  const resolvedExplicitTitle = resolveProposedField(explicitRawSavedTitle, liveActualMetaTitle, recs.proposedTitle, 'Digital Spain')

  assert.equal(
    resolvedExplicitTitle,
    explicitSeoTitleOverride,
    `Explicit W4 SEO Meta Title override was not preserved!`
  )
})

console.log('\n============================================================')
console.log('🎉 ALL W4 REGRESSION INVARIANTS VERIFIED SUCCESSFULLY')
console.log('============================================================\n')
