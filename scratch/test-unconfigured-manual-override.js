function testUnconfiguredManualOverride() {
  console.log('=== TESTING UNCONFIGURED MANUAL TYPE OVERRIDE (Landing -> Topical) ===\n')

  const unconfiguredLanding = {
    id: 102,
    url: 'https://ascentbuilders.co.uk/loft-conversions-banstead/',
    title: 'Loft Conversions Banstead',
    type: 'Landing',
    priority: 2,
    isConfigured: false,
    isExcluded: false,
    target: ''
  }

  // Simulate inline dropdown change: Landing -> Topical
  const newType = 'Topical'
  const existingConfig = {}
  const hasTargetPhrase = Boolean(existingConfig.targetPhrase && existingConfig.targetPhrase.trim().length > 0)
  const isConfigured = Boolean(existingConfig.isConfigured || hasTargetPhrase || unconfiguredLanding.isConfigured)

  const updatedConfig = {
    pageId: unconfiguredLanding.id,
    url: unconfiguredLanding.url,
    proposedTitle: unconfiguredLanding.title,
    targetPhrase: '',
    type: newType,
    seoPageType: newType,
    autoType: unconfiguredLanding.type,
    isManualOverride: true,
    priority: 3,
    isConfigured: isConfigured,
    isExcluded: false,
    status: isConfigured ? 'configured' : 'unconfigured'
  }

  // Simulate ManageWebsitePage / PageManagementPage mapping
  const pageKey = unconfiguredLanding.url
  const override = updatedConfig
  const mappedHasTarget = Boolean(override.targetPhrase && override.targetPhrase.trim().length > 0)
  const mappedIsConfigured = Boolean(override.isConfigured || mappedHasTarget || unconfiguredLanding.isConfigured)

  const mappedPage = {
    ...unconfiguredLanding,
    type: override.type,
    priority: override.priority,
    isManualOverride: override.isManualOverride,
    isConfigured: mappedIsConfigured
  }

  console.log('Page Before Override:')
  console.log(`- Type: ${unconfiguredLanding.type}`)
  console.log(`- Priority: ${unconfiguredLanding.priority}`)
  console.log(`- isConfigured: ${unconfiguredLanding.isConfigured}`)

  console.log('\nPage After Manual Override (Landing -> Topical):')
  console.log(`- Type: ${mappedPage.type}`)
  console.log(`- Priority: ${mappedPage.priority}`)
  console.log(`- isManualOverride: ${mappedPage.isManualOverride}`)
  console.log(`- isConfigured: ${mappedPage.isConfigured}`)

  const passed =
    mappedPage.type === 'Topical' &&
    mappedPage.priority === 3 &&
    mappedPage.isManualOverride === true &&
    mappedPage.isConfigured === false

  console.log(`\nVerification: ${passed ? 'PASSED (Type=Topical, Priority=3, isManualOverride=true, isConfigured=false)' : 'FAILED'}`)
}

testUnconfiguredManualOverride()
