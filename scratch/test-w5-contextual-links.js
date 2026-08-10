import { extractPagesFromPackage } from '../src/utils/packageExtractor.js'
import { getExistingInternalLinks } from '../src/utils/internalLinkingHelper.js'
import fs from 'fs'

try {
  const raw = fs.readFileSync('c:/Antigravity/tse-audit-engine/src/exporter-data.json', 'utf8')
  const data = JSON.parse(raw)
  const siteKey = Object.keys(data)[0] // e.g. bathroom-upgrades or ascent-builders
  const pkg = data[siteKey]
  const pages = pkg.pages || []

  console.log(`Site: ${siteKey}, Total Pages: ${pages.length}`)
  
  pages.forEach(p => {
    p.url = p.pageUrl || p.url
    p.title = p.pageTitle || p.title
    p.content = p.crawlData?.plainText || p.content || ''
  })

  const targetUrl = '/'
  const existing = getExistingInternalLinks(targetUrl, pages)
  console.log(`Target URL: ${targetUrl}, Extracted Existing Links: ${existing.length}`)
  console.log('Existing Links:', JSON.stringify(existing, null, 2))
} catch (e) {
  console.error('Error in scratch script:', e)
}
