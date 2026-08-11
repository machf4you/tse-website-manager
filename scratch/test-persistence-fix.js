import { normalizeSiteId, getSiteConfigsStorageKey, getSiteAuditsStorageKey } from '../src/utils/siteKeyHelper.js'

function testPersistenceKeys() {
  console.log('=== TESTING SITE STORAGE KEY NORMALIZATION ===\n')

  const testSites = [
    { id: 1, name: 'Ascent Builders' },
    { id: '1', name: 'Ascent Builders String' },
    { id: 'site-1', name: 'Ascent Builders Site-1' },
    { id: undefined, name: 'Undefined' },
    null
  ]

  testSites.forEach((s, idx) => {
    const normId = normalizeSiteId(s)
    const configsKey = getSiteConfigsStorageKey(s)
    const auditsKey = getSiteAuditsStorageKey(s)
    console.log(`Test ${idx + 1}: input=${JSON.stringify(s)} -> normId="${normId}" | configsKey="${configsKey}" | auditsKey="${auditsKey}"`)
  })
}

testPersistenceKeys()
