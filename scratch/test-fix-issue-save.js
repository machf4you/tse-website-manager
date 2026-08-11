import { getSiteConfigsStorageKey } from '../src/utils/siteKeyHelper.js'

function testFixSavePersistence() {
  console.log('=== TESTING FIX ISSUE SAVE PERSISTENCE ===\n')

  const site = { id: 1 }
  const siteIdKey = getSiteConfigsStorageKey(site)
  const page = { url: 'https://ascentbuilders.co.uk/loft-conversions/', id: '31', title: 'Loft Conversions' }
  const pageKey = page.id || page.url

  const existingConfig = { targetPhrase: 'Loft conversions Surrey', isConfigured: true }
  const newMetaTitle = 'Loft Conversions Surrey | Leading Builders Surrey'

  const updatedConfig = {
    ...existingConfig,
    pageId: pageKey,
    url: page.url,
    proposedTitle: newMetaTitle,
    metaTitle: newMetaTitle,
    isManualOverride: true,
  }

  const updatedMap = {
    [pageKey]: updatedConfig,
    [page.url]: updatedConfig
  }

  console.log('Updated Map to save:', updatedMap)
  console.log('Target Storage Key:', siteIdKey)
}

testFixSavePersistence()
