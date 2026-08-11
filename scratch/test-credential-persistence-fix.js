import { saveWebsiteApi, getWebsitesApi } from '../src/services/websiteManagerApi.js'

async function testCredentialPersistenceFix() {
  console.log('=== TESTING WORDPRESS CREDENTIAL PERSISTENCE FIX ===\n')

  const testSite = {
    id: 'test-cred-site-999',
    name: 'Ascent Builders Test Credentials',
    url: 'https://ascentbuilders.co.uk',
    platform: 'wordpress',
    wpUser: 'admin_test_user',
    wpPass: 'secret_app_password_9999',
  }

  console.log('1. Saving site with credentials:')
  console.log('   - wpUser:', testSite.wpUser)
  console.log('   - wpPass:', '[STORED - Length ' + testSite.wpPass.length + ']')

  await saveWebsiteApi(testSite)

  console.log('\n2. Retrieving sites via getWebsitesApi()...')
  const retrievedSites = await getWebsitesApi()
  const retrieved = retrievedSites.find(s => String(s.id) === String(testSite.id))

  if (retrieved) {
    console.log('   - Found site ID:', retrieved.id)
    console.log('   - Restored wpUser:', retrieved.wpUser)
    console.log('   - Restored wpPass:', retrieved.wpPass ? '[RESTORED - Length ' + retrieved.wpPass.length + ']' : 'MISSING')
    console.log('   - Restored configData.wpUser:', retrieved.configData?.wpUser)
    console.log('   - Restored configData.wpPass:', retrieved.configData?.wpPass ? '[RESTORED IN CONFIGDATA]' : 'MISSING')

    const userPassed = retrieved.wpUser === 'admin_test_user'
    const passPassed = retrieved.wpPass === 'secret_app_password_9999'

    console.log('\nVERIFICATION RESULT:', (userPassed && passPassed) ? 'PASSED ✓ Credentials successfully persisted & restored!' : 'FAILED ✗')
  } else {
    console.error('   - Site not found in retrieved list.')
  }
}

testCredentialPersistenceFix()
