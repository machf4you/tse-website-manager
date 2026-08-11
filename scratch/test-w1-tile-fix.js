import { extractPagesFromPackage } from '../src/utils/packageExtractor.js'
import { getSiteConfigsStorageKey, getSitePackageStorageKey, normalizeSiteId } from '../src/utils/siteKeyHelper.js'

async function testW1Fix() {
  console.log('=== TESTING W1 TILE FIX EXECUTION ===\n')

  const site = { id: 1, name: 'Ascent Builders', url: 'https://www.ascentbuilders.co.uk' }
  const siteId = normalizeSiteId(site)

  // Fetch package
  const pkgRes = await fetch(`https://api-website-manager.thesearchequation.co.uk/api/websites/${siteId}/package`)
  const pkgJson = await pkgRes.json()
  const rawPages = extractPagesFromPackage(pkgJson)

  // Fetch configs
  const configRes = await fetch(`https://api-website-manager.thesearchequation.co.uk/api/websites/${siteId}/page-configs`)
  const savedConfigs = await configRes.json()

  // Execute matching logic: URL first, then trailing slash variations, then ID fallback
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

  console.log(`Raw pages count: ${rawPages.length}`)
  console.log(`Configured pages count: ${configuredPagesCount}`)
  console.log(`Configured display string: ${configuredPagesCount} of ${rawPages.length}`)
}

testW1Fix()
