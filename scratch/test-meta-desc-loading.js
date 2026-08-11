function testMetaDescLoading() {
  console.log('=== TESTING META DESCRIPTION SOURCE MAPPING ===\n')

  const testCases = [
    {
      name: 'Audit Snapshot Meta Description',
      rawCurrentPage: { url: 'https://ascentbuilders.co.uk/', title: 'Ascent Builders' },
      snap: { meta_description: 'Leading building contractors in Surrey specializing in loft conversions.' },
      overrideObj: {}
    },
    {
      name: 'WP Package meta_description field',
      rawCurrentPage: { url: 'https://ascentbuilders.co.uk/', title: 'Ascent Builders', meta_description: 'Expert Surrey builders.' },
      snap: {},
      overrideObj: {}
    },
    {
      name: 'Saved Manual Override',
      rawCurrentPage: { url: 'https://ascentbuilders.co.uk/', title: 'Ascent Builders', meta_description: 'Old desc' },
      snap: { meta_description: 'Audit desc' },
      overrideObj: { metaDescription: 'New Manual Override Description' }
    }
  ]

  testCases.forEach(tc => {
    const { rawCurrentPage, snap, overrideObj } = tc
    const metaDescResult = overrideObj.metaDescription !== undefined
      ? overrideObj.metaDescription
      : (rawCurrentPage.metaDescription || rawCurrentPage.meta_description || snap.meta_description || rawCurrentPage.description || rawCurrentPage.snippet || '')

    console.log(`Case: [${tc.name}]`)
    console.log(`Resolved Meta Description: "${metaDescResult}"\n`)
  })
}

testMetaDescLoading()
