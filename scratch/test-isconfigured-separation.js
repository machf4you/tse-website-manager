function testIsConfiguredSeparation() {
  console.log('=== TESTING ISCONFIGURED & ISMANUALOVERRIDE SEPARATION ===\n')

  const unconfiguredArticle = {
    id: 101,
    url: 'https://ascentbuilders.co.uk/velux-vs-dormer-loft-conversion/',
    title: 'Velux vs Dormer Loft Conversion',
    type: 'Article',
    priority: 4,
    isConfigured: false,
    isExcluded: false
  }

  // 1. Perform manual type override from Article -> Landing
  const existingConfig = {}
  const pageKey = unconfiguredArticle.url
  const newType = 'Landing'

  const getPriorityForType = (t) => {
    if (t === 'Hub') return 1
    if (t === 'Landing') return 2
    if (t === 'Topical') return 3
    if (t === 'Article') return 4
    return 0
  }

  const wasConfigured = Boolean(existingConfig.isConfigured || unconfiguredArticle.isConfigured)

  const updatedConfig = {
    ...existingConfig,
    pageId: unconfiguredArticle.id,
    url: unconfiguredArticle.url,
    proposedTitle: existingConfig.proposedTitle || unconfiguredArticle.title,
    targetPhrase: existingConfig.targetPhrase || unconfiguredArticle.target || '',
    type: newType,
    seoPageType: newType,
    autoType: unconfiguredArticle.type,
    isManualOverride: true,
    priority: getPriorityForType(newType),
    isConfigured: wasConfigured,
    isExcluded: false,
    status: wasConfigured ? 'configured' : 'unconfigured'
  }

  console.log('Unconfigured Article Before Override:')
  console.log(`- Type: ${unconfiguredArticle.type}`)
  console.log(`- isConfigured: ${unconfiguredArticle.isConfigured}`)

  console.log('\nAfter Manual Override to "Landing":')
  console.log(`- Type: ${updatedConfig.type}`)
  console.log(`- priority: ${updatedConfig.priority}`)
  console.log(`- isManualOverride: ${updatedConfig.isManualOverride}`)
  console.log(`- isConfigured: ${updatedConfig.isConfigured}`)

  const passed =
    updatedConfig.type === 'Landing' &&
    updatedConfig.priority === 2 &&
    updatedConfig.isManualOverride === true &&
    updatedConfig.isConfigured === false

  console.log(`\nVerification: ${passed ? 'PASSED (isManualOverride is true and isConfigured remains false)' : 'FAILED'}`)
}

testIsConfiguredSeparation()
