function testAuditElementsDescExtraction() {
  console.log('=== TESTING AUDIT ELEMENTS META DESCRIPTION EXTRACTION ===\n')

  const auditElements = [
    {
      id: 'meta_title',
      name: 'Meta Title',
      currentValue: 'Loft Conversions Surrey | Ascent Builders'
    },
    {
      id: 'meta_description',
      name: 'Meta Description',
      currentValue: 'Expert loft conversions in Surrey. High quality design & build service by Ascent Builders.'
    },
    {
      id: 'h1',
      name: 'H1',
      currentValue: 'Loft Conversions Surrey'
    }
  ]

  const page = {
    url: 'https://ascentbuilders.co.uk/',
    title: 'Ascent Builders'
    // Notice: page.metaDescription is empty!
  }

  const liveAuditData = {
    page_snapshot: {
      meta_description: 'Expert loft conversions in Surrey. High quality design & build service by Ascent Builders.'
    }
  }

  const metaDescFromAudit = auditElements.find(el => el.id === 'meta_description' || el.name === 'Meta Description')?.currentValue
  const cleanAuditDesc = (metaDescFromAudit && metaDescFromAudit !== '—') ? metaDescFromAudit : ''

  const initD = page.metaDescription || page.meta_description || page.metaDesc || cleanAuditDesc || (liveAuditData?.page_snapshot?.meta_description) || page.description || page.snippet || ''

  console.log('Extracted Meta Description:', `"${initD}"`)
}

testAuditElementsDescExtraction()
