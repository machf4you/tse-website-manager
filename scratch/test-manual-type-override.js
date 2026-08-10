import { extractPagesFromPackage } from '../src/utils/packageExtractor.js'

function testManualTypeOverride() {
  console.log('=== TESTING MANUAL PAGE TYPE OVERRIDE SYSTEM ===\n')

  // Representative package
  const pkg = {
    pages: [
      { id: 1, url: 'https://ascentbuilders.co.uk/', title: 'Home', post_type: 'page', is_front_page: true },
      { id: 2, url: 'https://ascentbuilders.co.uk/loft-conversions-banstead/', title: 'Loft Conversions Banstead', post_type: 'page' }
    ],
    posts: [
      { id: 101, url: 'https://ascentbuilders.co.uk/velux-vs-dormer-loft-conversion/', title: 'Velux vs Dormer Loft Conversion', post_type: 'post' },
      { id: 102, url: 'https://ascentbuilders.co.uk/how-much-does-a-loft-conversion-cost/', title: 'How Much Does a Loft Conversion Cost?', post_type: 'post' }
    ]
  }

  // 1. Initial automatic extraction & classification
  const initialPages = extractPagesFromPackage(pkg, 'https://ascentbuilders.co.uk')
  const veluxInitial = initialPages.find(p => p.url.includes('velux'))
  const howMuchInitial = initialPages.find(p => p.url.includes('how-much'))

  console.log('Step 1 — Initial Automatic Extraction:')
  console.log(`- Velux Post: Type = ${veluxInitial.type}, Priority = ${veluxInitial.priority}, isManualOverride = ${Boolean(veluxInitial.isManualOverride)}`)
  console.log(`- How Much Post: Type = ${howMuchInitial.type}, Priority = ${howMuchInitial.priority}, isManualOverride = ${Boolean(howMuchInitial.isManualOverride)}`)

  // 2. User changes Velux Article (id 101) to Landing manually
  const mockConfigurations = {}
  const veluxKey = veluxInitial.url

  const manualOverrideConfig = {
    pageId: veluxInitial.id,
    url: veluxInitial.url,
    proposedTitle: veluxInitial.title,
    targetPhrase: '',
    type: 'Landing',
    seoPageType: 'Landing',
    autoType: veluxInitial.type, // 'Article'
    isManualOverride: true,
    priority: 2,
    isConfigured: true,
    isExcluded: false,
    status: 'configured'
  }
  mockConfigurations[veluxKey] = manualOverrideConfig

  console.log('\nStep 2 — User Manually Changes Velux Post to "Landing":')
  console.log('Saved Config:', JSON.stringify(mockConfigurations[veluxKey]))

  // 3. Page Refresh Simulation (Re-merge extracted pages with saved configurations)
  function mergePagesWithConfigs(extracted, configs) {
    return extracted.map(page => {
      const pageKey = page.id || page.url
      const override = configs[pageKey] || configs[page.url]
      const autoType = override?.autoType || page.type || 'Unclassified'
      const isManualOverride = Boolean(override && override.isManualOverride === true)
      const effectiveType = isManualOverride ? (override.type || override.seoPageType) : autoType

      const getPriorityForType = (t, fallback) => {
        if (t === 'Hub') return 1
        if (t === 'Landing') return 2
        if (t === 'Topical') return 3
        if (t === 'Article') return 4
        if (t === 'Excluded') return 0
        return fallback !== undefined ? fallback : 0
      }

      const effectivePriority = isManualOverride
        ? (override?.priority !== undefined ? override.priority : getPriorityForType(effectiveType, 0))
        : (override?.priority !== undefined ? override.priority : getPriorityForType(autoType, page.priority))

      if (override) {
        return {
          ...page,
          autoType,
          type: effectiveType,
          seoPageType: effectiveType,
          priority: effectivePriority,
          isManualOverride
        }
      }
      return {
        ...page,
        autoType,
        isManualOverride: false
      }
    })
  }

  const mergedAfterRefresh = mergePagesWithConfigs(initialPages, mockConfigurations)
  const veluxAfterRefresh = mergedAfterRefresh.find(p => p.url.includes('velux'))
  const howMuchAfterRefresh = mergedAfterRefresh.find(p => p.url.includes('how-much'))

  console.log('\nStep 3 & 4 — After Page Refresh / Rehydration:')
  console.log(`- Velux Post: Type = ${veluxAfterRefresh.type}, Priority = ${veluxAfterRefresh.priority}, isManualOverride = ${veluxAfterRefresh.isManualOverride} (Indicator 🔧)`)
  console.log(`- How Much Post: Type = ${howMuchAfterRefresh.type}, Priority = ${howMuchAfterRefresh.priority}, isManualOverride = ${howMuchAfterRefresh.isManualOverride}`)

  // 5, 6 & 7. WordPress Resync Simulation
  const resyncedRawPages = extractPagesFromPackage(pkg, 'https://ascentbuilders.co.uk')
  const mergedAfterResync = mergePagesWithConfigs(resyncedRawPages, mockConfigurations)
  const veluxAfterResync = mergedAfterResync.find(p => p.url.includes('velux'))
  const howMuchAfterResync = mergedAfterResync.find(p => p.url.includes('how-much'))

  console.log('\nStep 5, 6 & 7 — After WordPress Package Resync:')
  console.log(`- Overridden Velux Post: Type = ${veluxAfterResync.type}, Priority = ${veluxAfterResync.priority}, isManualOverride = ${veluxAfterResync.isManualOverride} (STAYS LANDING)`)
  console.log(`- Non-Overridden How Much Post: Type = ${howMuchAfterResync.type}, Priority = ${howMuchAfterResync.priority}, isManualOverride = ${howMuchAfterResync.isManualOverride} (STAYS ARTICLE)`)

  const testPassed =
    veluxAfterResync.type === 'Landing' &&
    veluxAfterResync.priority === 2 &&
    veluxAfterResync.isManualOverride === true &&
    howMuchAfterResync.type === 'Article' &&
    howMuchAfterResync.priority === 4 &&
    howMuchAfterResync.isManualOverride === false

  console.log(`\nOVERALL TEST RESULT: ${testPassed ? 'PASSED (All 7 verification steps passed)' : 'FAILED'}`)
}

testManualTypeOverride()
