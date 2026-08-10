import fs from 'fs'

const raw = fs.readFileSync('c:/Antigravity/tse-audit-engine/src/exporter-data.json', 'utf8')
const data = JSON.parse(raw)
const siteKey = Object.keys(data)[0]
const pages = data[siteKey].pages

pages.slice(0, 3).forEach((p, idx) => {
  console.log(`\n=== PAGE ${idx + 1} ===`)
  console.log('Keys:', Object.keys(p))
  console.log('Title:', p.pageTitle || p.title || p.post_title)
  console.log('Content type:', typeof p.content, typeof p.body_text, typeof p.crawlData?.plainText)
  const sample = (
    typeof p.content?.rendered === 'string' ? p.content.rendered :
    typeof p.content === 'string' ? p.content :
    typeof p.body_text === 'string' ? p.body_text :
    typeof p.crawlData?.plainText === 'string' ? p.crawlData.plainText : ''
  )
  console.log('Sample content snippet (first 300 chars):', sample.slice(0, 300))
})
