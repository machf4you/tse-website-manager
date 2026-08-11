function simulateConfigureDialogSaveFix() {
  console.log('=== SIMULATING CONFIGURE PAGE DIALOG SUBMIT WITH FIX ===\n')

  const page = {
    id: 'page-1',
    url: 'https://ascentbuilders.co.uk/accessible-bathrooms',
    title: 'Accessible Bathrooms',
    type: 'Landing',
    isManualOverride: false
  }

  const proposedTitle = 'Accessible Bathrooms Surrey'
  const targetPhrase = 'accessible bathrooms'
  const pageType = 'Landing'

  let errorCaught = null
  let updatedConfig = null

  try {
    let normalizedType = 'Unclassified'
    if (pageType.includes('Hub')) normalizedType = 'Hub'
    else if (pageType.includes('Landing')) normalizedType = 'Landing'
    else if (pageType.includes('Topical')) normalizedType = 'Topical'
    else if (pageType.includes('Article')) normalizedType = 'Article'
    else if (pageType.includes('Excluded')) normalizedType = 'Excluded'

    const initialAutoType = page.autoType || page.type || 'Unclassified'
    const initialType = page.type || page.seoPageType || ''
    const isTypeChanged = Boolean(initialType && normalizedType !== initialType)

    const targetPhraseStr = targetPhrase.trim()
    const isConfigured = Boolean(targetPhraseStr.length > 0)

    updatedConfig = {
      pageId: page.id || page.url,
      url: page.url,
      proposedTitle: proposedTitle.trim(),
      targetPhrase: targetPhraseStr,
      type: normalizedType,
      seoPageType: normalizedType,
      autoType: initialAutoType,
      isManualOverride: isTypeChanged || Boolean(page.isManualOverride),
      priority: 2,
      isConfigured,
      isExcluded: normalizedType === 'Excluded',
      status: isConfigured ? 'configured' : 'unconfigured',
    }
  } catch (err) {
    errorCaught = err
  }

  console.log('Error Caught:', errorCaught ? errorCaught.stack : 'NONE')
  console.log('Updated Config Payload:', updatedConfig)
}

simulateConfigureDialogSaveFix()
