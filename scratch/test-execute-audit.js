import { executePageAudit } from '../src/services/pageAuditorApi.js'

async function testAudit() {
  console.log('Testing executePageAudit with unconfigured target phrase...')
  try {
    const res = await executePageAudit({
      siteId: 'ascent-builders-prod',
      pageId: '101',
      url: 'https://www.ascentbuilders.co.uk/services/garage-conversions/',
      targetPhrase: '',
      seoPageType: 'Article'
    })
    console.log('Audit Success Result:', res)
  } catch (err) {
    console.error('Audit Failure Error:', err.message)
  }
}

testAudit()
