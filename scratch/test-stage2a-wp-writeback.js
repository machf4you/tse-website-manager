import { updateWordPressSEOFields } from '../src/services/wordpressApi.js'

async function runStage2ATest() {
  console.log('====================================================')
  console.log('  TESTING STAGE 2A WORDPRESS WRITE-BACK FUNCTION  ')
  console.log('====================================================\n')

  // Test target parameters
  const testParams = {
    websiteUrl: 'https://ascentbuilders.co.uk',
    username: 'test_admin',
    applicationPassword: 'test_app_password_1234',
    pageId: 42,
    postType: 'pages',
    metaTitle: 'Loft Conversions Surrey | Ascent Builders',
    metaDescription: 'Expert loft conversions in Surrey. High quality design & build service by Ascent Builders.',
  }

  const result = await updateWordPressSEOFields(testParams)

  console.log('\n====================================================')
  console.log('  STAGE 2A TEST RESULT SUMMARY  ')
  console.log('====================================================')
  console.log('Success Status:', result.success ? 'YES ✓' : 'NO ✗')
  console.log('Page ID:', result.pageId)
  console.log('Endpoint Used:', result.endpoint)
  console.log('HTTP Status:', result.status || 'N/A')
  console.log('Fields Updated:', result.fieldsUpdated)
  console.log('Response Payload:', JSON.stringify(result.responseData || {}, null, 2))
}

runStage2ATest()
