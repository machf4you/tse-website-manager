import { extractPagesFromPackage } from '../src/utils/packageExtractor.js'
import { getSiteConfigsStorageKey, getSitePackageStorageKey, normalizeSiteId } from '../src/utils/siteKeyHelper.js'

async function traceW1ConfiguredCount() {
  console.log('=== TRACING W1 CONFIGURED PAGE COUNT CALCULATION ===\n')

  const site = { id: 1, name: 'Ascent Builders', url: 'https://www.ascentbuilders.co.uk' }
  const siteId = normalizeSiteId(site)
  const pkgKey = getSitePackageStorageKey(site)
  const configKey = getSiteConfigsStorageKey(site)

  console.log(`Site ID: ${siteId}`)
  console.log(`Package Storage Key: ${pkgKey}`)
  console.log(`Config Storage Key: ${configKey}`)

  // 1. Fetch package data from backend API as WebsitesDashboard / WebsiteTile would
  try {
    const pkgRes = await fetch(`https://api-website-manager.thesearchequation.co.uk/api/websites/${siteId}/package`)
    const pkgJson = await pkgRes.json()
    console.log('\n1. Package API response keys:', Object.keys(pkgJson))

    const rawPages = extractPagesFromPackage(pkgJson)
    console.log(`Extracted rawPages count: ${rawPages.length}`)

    // 2. Fetch page configurations from backend API
    const configRes = await fetch(`https://api-website-manager.thesearchequation.co.uk/api/websites/${siteId}/page-configs`)
    const configsJson = await configRes.json()
    console.log('\n2. Page Configs API response entries count:', Object.keys(configsJson).length)
    console.log('Configured keys from API:', Object.keys(configsJson))

    // 3. Simulate WebsiteTile configured count calculation
    const configuredPages = rawPages.filter(p => {
      const pageKey = p.id || p.url
      const override = configsJson[pageKey] || (p.url ? configsJson[p.url] : null)
      const targetPhraseStr = (override?.targetPhrase || override?.target || p.targetPhrase || p.target || '').trim()
      const isConfigured = Boolean(targetPhraseStr.length > 0)
      const isExcluded = Boolean(override?.isExcluded || override?.type === 'Excluded' || p.isExcluded || p.type === 'Excluded')
      return isConfigured && !isExcluded
    })

    console.log(`\n3. WebsiteTile calculated configured count: ${configuredPages.length} of ${rawPages.length}`)
    if (configuredPages.length > 0) {
      console.log('Sample configured page:', configuredPages[0].url, '-> Target:', configuredPages[0].targetPhrase || configsJson[configuredPages[0].url]?.targetPhrase)
    }

  } catch (err) {
    console.error('Error during trace:', err)
  }
}

traceW1ConfiguredCount()
