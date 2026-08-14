async function inspectPlatform() {
  const res = await fetch('https://www.hf4you.co.uk/')
  const html = await res.text()

  console.log('=== PLATFORM INSPECTION OF HF4YOU.CO.UK ===')
  console.log('Is Magento:', html.includes('Mage') || html.includes('catalogsearch') || html.includes('varien') || html.includes('magento'))
  console.log('Is WordPress:', html.includes('wp-content') || html.includes('wp-includes'))

  const matches = html.match(/<meta name="generator" content="([^"]+)"/i)
  console.log('Generator Tag:', matches ? matches[1] : 'None found')
}

inspectPlatform()
