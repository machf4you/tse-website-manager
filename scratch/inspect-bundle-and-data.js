import fs from 'fs'

console.log('=== 1. Checking dist/ bundle JS file ===')
const distFiles = fs.readdirSync('c:/Antigravity/tse-website-manager/dist/assets')
const bundleFile = distFiles.find(f => f.endsWith('.js'))
console.log('Bundle file:', bundleFile)

if (bundleFile) {
  const bundleContent = fs.readFileSync(`c:/Antigravity/tse-website-manager/dist/assets/${bundleFile}`, 'utf8')
  console.log('Bundle contains sourcePageObj:', bundleContent.includes('sourcePageObj'))
  console.log('Bundle contains generateContextualReplacement:', bundleContent.includes('generateContextualReplacement'))
  console.log('Bundle contains phrase "Construction Work You Can Count On":', bundleContent.includes('Construction Work You Can Count On'))
}

console.log('\n=== 2. Checking c:/Antigravity/tse-audit-engine/src/exporter-data.json ===')
try {
  const expRaw = fs.readFileSync('c:/Antigravity/tse-audit-engine/src/exporter-data.json', 'utf8')
  console.log('exporter-data.json contains phrase "Construction Work You Can Count On":', expRaw.includes('Construction Work You Can Count On'))

  const data = JSON.parse(expRaw)
  const siteKey = Object.keys(data)[0]
  const pages = data[siteKey].pages

  pages.forEach(p => {
    const title = p.pageTitle || p.title
    const raw = (
      typeof p.content?.rendered === 'string' ? p.content.rendered :
      typeof p.content === 'string' ? p.content :
      typeof p.body_text === 'string' ? p.body_text :
      typeof p.crawlData?.plainText === 'string' ? p.crawlData.plainText : ''
    )
    if (raw.includes('Construction Work You Can Count On')) {
      console.log(`FOUND IN PAGE: "${title}" (${p.pageUrl || p.url})`)
    }
  })
} catch (e) {
  console.error('Error reading exporter data:', e.message)
}
