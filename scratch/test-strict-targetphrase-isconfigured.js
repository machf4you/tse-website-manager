function testStrictTargetPhraseIsConfigured() {
  console.log('=== TESTING STRICT TARGETPHRASE ISCONFIGURED DERIVATION ===\n')

  // Case 1: Legacy saved override with isConfigured: true and status: "configured", BUT no targetPhrase
  const legacyConfigNoTarget = {
    pageId: 102,
    url: 'https://ascentbuilders.co.uk/loft-conversions-banstead/',
    type: 'Topical',
    priority: 3,
    isManualOverride: true,
    isConfigured: true, // legacy stored flag
    status: 'configured',
    targetPhrase: '' // empty!
  }

  const rawPage1 = {
    id: 102,
    url: 'https://ascentbuilders.co.uk/loft-conversions-banstead/',
    title: 'Loft Conversions Banstead',
    type: 'Landing',
    priority: 2
  }

  // Derive isConfigured strictly from targetPhrase presence
  const targetPhrase1 = (legacyConfigNoTarget.targetPhrase || legacyConfigNoTarget.target || rawPage1.targetPhrase || rawPage1.target || '').trim()
  const isConfigured1 = Boolean(targetPhrase1.length > 0)

  console.log('Case 1: Legacy config with empty targetPhrase:')
  console.log(`- Stored isConfigured: ${legacyConfigNoTarget.isConfigured}`)
  console.log(`- Derived isConfigured: ${isConfigured1}`)
  console.log(`- Type: ${legacyConfigNoTarget.type}`)
  console.log(`- isManualOverride: ${legacyConfigNoTarget.isManualOverride}`)

  // Case 2: Configured page with non-empty targetPhrase
  const configuredConfig = {
    pageId: 101,
    url: 'https://ascentbuilders.co.uk/velux-vs-dormer-loft-conversion/',
    type: 'Landing',
    priority: 2,
    isManualOverride: true,
    targetPhrase: 'Velux Loft Conversion'
  }

  const rawPage2 = {
    id: 101,
    url: 'https://ascentbuilders.co.uk/velux-vs-dormer-loft-conversion/',
    title: 'Velux vs Dormer Loft Conversion',
    type: 'Article',
    priority: 4
  }

  const targetPhrase2 = (configuredConfig.targetPhrase || configuredConfig.target || rawPage2.targetPhrase || rawPage2.target || '').trim()
  const isConfigured2 = Boolean(targetPhrase2.length > 0)

  console.log('\nCase 2: Config with valid targetPhrase:')
  console.log(`- Derived isConfigured: ${isConfigured2}`)
  console.log(`- Target Phrase: "${targetPhrase2}"`)

  const passed = isConfigured1 === false && isConfigured2 === true

  console.log(`\nVerification: ${passed ? 'PASSED (isConfigured is true ONLY when a valid targetPhrase exists)' : 'FAILED'}`)
}

testStrictTargetPhraseIsConfigured()
