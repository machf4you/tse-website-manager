process.env.VITE_WEBSITE_MANAGER_API_URL = 'https://api-website-manager.thesearchequation.co.uk/api'

const { updateWordPressPageContent } = await import('../src/services/wordpressApi.js')

async function testLiveWpContentPush() {
  console.log('=== TESTING W5 WORDPRESS CONTENT PUSH RESOLUTION LIVE ===')

  const site = {
    id: '1',
    name: 'Ascent Builders',
    url: 'https://www.ascentbuilders.co.uk'
  }

  const sourcePage = {
    id: 1068,
    type: 'post',
    url: 'https://www.ascentbuilders.co.uk/what-adds-more-value-a-kitchen-extension-or-loft-conversion/'
  }

  console.log('Calling updateWordPressPageContent for post 1068...')
  const res = await updateWordPressPageContent({
    site,
    sourcePage,
    contentHtml: undefined // Undefined payload so we don't alter live content during auth test
  })

  console.log('Result:', res)
}

testLiveWpContentPush()
