import { updateWordPressSEOFields } from '../src/services/wordpressApi.js'

async function runRealAscentTest() {
  console.log('====================================================')
  console.log('  STAGE 2A TEST: REAL ASCENT BUILDERS PAGE WRITE  ')
  console.log('====================================================\n')

  // Real Page 1: Page ID 2523 (Loft Conversions Walton-On-Thames)
  const targetPage1 = {
    websiteUrl: 'https://www.ascentbuilders.co.uk',
    username: 'admin',
    applicationPassword: 'test_password_placeholder', // Application password
    pageId: 2523,
    url: 'https://www.ascentbuilders.co.uk/loft-conversions-walton-on-thames/',
    postType: 'pages',
    originalTitle: 'Loft Conversions Walton-On-Thames - Home Extensions - Ascent Builders',
    tempMetaTitle: 'Loft Conversions Walton-On-Thames | Ascent Builders Test',
  }

  // Real Page 2: Page ID 2884 (New Landing Page)
  const targetPage2 = {
    websiteUrl: 'https://www.ascentbuilders.co.uk',
    username: 'admin',
    applicationPassword: 'test_password_placeholder',
    pageId: 2884,
    url: 'https://www.ascentbuilders.co.uk/ascent-lp/',
    postType: 'pages',
    originalTitle: 'New Landing Page - Ascent Builders',
    tempMetaTitle: 'New Landing Page | Ascent Builders SEO Test',
  }

  console.log('Target Page Selected for Test:')
  console.log(`  - Page ID: ${targetPage1.pageId}`)
  console.log(`  - Page URL: ${targetPage1.url}`)
  console.log(`  - Post Type: ${targetPage1.postType}`)
  console.log(`  - Original Yoast Title: "${targetPage1.originalTitle}"`)
  console.log(`  - Temp Meta Title to Write: "${targetPage1.tempMetaTitle}"\n`)

  console.log('Attempting write-back via updateWordPressSEOFields()...')
  const result = await updateWordPressSEOFields({
    websiteUrl: targetPage1.websiteUrl,
    username: targetPage1.username,
    applicationPassword: targetPage1.applicationPassword,
    pageId: targetPage1.pageId,
    postType: targetPage1.postType,
    metaTitle: targetPage1.tempMetaTitle,
  })

  console.log('\n====================================================')
  console.log('  WRITE-BACK TEST VERIFICATION REPORT  ')
  console.log('====================================================')
  console.log('1. Page ID Confirmed:', result.pageId)
  console.log('2. Page URL Confirmed:', targetPage1.url)
  console.log('3. Post Type Confirmed:', targetPage1.postType)
  console.log('4. Endpoint Used:', result.endpoint)
  console.log('5. API HTTP Response Status:', result.status)
  console.log('6. Fields Being Updated:', result.fieldsUpdated)
  console.log('7. Response Payload:', JSON.stringify(result.responseData || {}, null, 2))
  console.log('8. Success Result:', result.success ? 'SUCCESS ✓' : 'REQUIRES AUTH / FAILS ✗')

  // Now verify live page Yoast title via public REST API endpoint / head scan
  console.log('\nVerifying live page title via public WP REST API...')
  try {
    const checkRes = await fetch(`https://www.ascentbuilders.co.uk/wp-json/wp/v2/pages/${targetPage1.pageId}`)
    if (checkRes.ok) {
      const liveData = await checkRes.json()
      console.log('Live Page Title (rendered):', liveData.title?.rendered)
      console.log('Live Yoast Title (yoast_head_json):', liveData.yoast_head_json?.title || 'N/A')
      console.log('Live Yoast Description (yoast_head_json):', liveData.yoast_head_json?.og_description || liveData.yoast_head_json?.description || 'Unchanged')
    }
  } catch (e) {
    console.error('Failed to fetch live page check:', e.message)
  }
}

runRealAscentTest()
