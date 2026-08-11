import { extractPagesFromPackage } from '../src/utils/packageExtractor.js'
import { getSiteConfigsStorageKey, getSitePackageStorageKey, normalizeSiteId } from '../src/utils/siteKeyHelper.js'

async function testW1PackageHydration() {
  console.log('=== TESTING W1 PACKAGE API HYDRATION ===\n')

  const site = { id: 1, name: 'Ascent Builders' }
  const siteId = normalizeSiteId(site)

  // 1. Fetch package from API
  const pkgRes = await fetch(`https://api-website-manager.thesearchequation.co.uk/api/websites/${siteId}/package`)
  const pkgJson = await pkgRes.json()
  const pkgData = pkgJson.packageData || pkgJson

  // 2. Fetch page configs from API
  const configRes = await fetch(`https://api-website-manager.thesearchequation.co.uk/api/websites/${siteId}/page-configs`)
  const savedConfigs = await configRes.json()

  // 3. Extract pages
  const rawPages = extractPagesFromPackage(pkgData)
  const totalPages = rawPages.length

  // 4. Calculate configured pages count
  const configuredPagesCount = rawPages.filter(p => {
    const override = (p.url ? savedConfigs[p.url] : null) ||
                     (p.url ? savedConfigs[p.url.replace(/\/$/, '')] : null) ||
                     (p.url ? savedConfigs[p.url + '/'] : null) ||
                     (p.id ? savedConfigs[p.id] : null)

    const targetPhraseStr = (override?.targetPhrase || override?.target || p.targetPhrase || p.target || '').trim()
    const isConfigured = Boolean(targetPhraseStr.length > 0)
    const isExcluded = Boolean(override?.isExcluded || override?.type === 'Excluded' || p.isExcluded || p.type === 'Excluded')
    return isConfigured && !isExcluded
  }).length

  console.log(`Total Pages: ${totalPages}`)
  console.log(`Configured Pages: ${configuredPagesCount}`)
  console.log(`Formatted Tile Output: ${configuredPagesCount} of ${totalPages}`)
}

testW1PackageHydration()
