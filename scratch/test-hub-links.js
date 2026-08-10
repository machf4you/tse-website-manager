import { normalizeUrlForMatching, getPathSlugForMatching } from '../src/utils/urlUtils.js'

function getExistingInternalLinks(targetUrl, pagesList) {
  if (!targetUrl || !Array.isArray(pagesList)) return []

  const targetNormUrl = normalizeUrlForMatching(targetUrl)
  const targetSlug = getPathSlugForMatching(targetUrl)
  const isHome = targetSlug === '/' || targetNormUrl === '/' || targetUrl === '/'
  const results = []

  pagesList.forEach(page => {
    if (!page || !page.url) return
    const pageNormUrl = normalizeUrlForMatching(page.url)

    // Exclude self links
    if (targetNormUrl && pageNormUrl && targetNormUrl === pageNormUrl) return

    const rawContent = (
      typeof page.content?.rendered === 'string' && page.content.rendered.trim() ? page.content.rendered.trim() :
      typeof page.content?.raw === 'string' && page.content.raw.trim() ? page.content.raw.trim() :
      typeof page.content === 'string' && page.content.trim() ? page.content.trim() :
      typeof page.post_content === 'string' && page.post_content.trim() ? page.post_content.trim() :
      typeof page.body_text === 'string' && page.body_text.trim() ? page.body_text.trim() :
      typeof page.html === 'string' && page.html.trim() ? page.html.trim() : ''
    )

    if (!rawContent) return

    // Strip header, nav, footer, logo, menu, image-switcher, and structural template components
    const bodyOnly = rawContent
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<div[^>]*class="[^"]*(header|nav|footer|logo|site-header|site-footer|menu|sidebar|widget|image-switcher|switcher|slider|carousel|banner|gallery|breadcrumb)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<ul[^>]*class="[^"]*(menu|nav|breadcrumbs)[^"]*"[^>]*>[\s\S]*?<\/ul>/gi, '')

    const linkRegex = /<a\s+[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
    let match
    while ((match = linkRegex.exec(bodyOnly)) !== null) {
      const href = match[1]
      const rawAnchor = match[2]
      const cleanAnchor = rawAnchor.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

      // Exclude empty or non-content template links (e.g. image-switcher)
      if (!cleanAnchor || cleanAnchor.toLowerCase() === 'contextual link' || cleanAnchor.toLowerCase().includes('client image-switcher')) {
        continue
      }

      const normHref = normalizeUrlForMatching(href)
      const hrefSlug = getPathSlugForMatching(href)

      const isMatch = isHome ? (
        (normHref === '/' && href !== '#' && href !== '') ||
        (hrefSlug === '/' && href !== '#' && href !== '')
      ) : (
        (targetNormUrl && normHref === targetNormUrl) ||
        (targetSlug && targetSlug !== '/' && hrefSlug === targetSlug)
      )

      if (isMatch) {
        // Extract surrounding context snippet (~100 chars around anchor)
        const matchIdx = match.index
        const startIdx = Math.max(0, matchIdx - 60)
        const endIdx = Math.min(bodyOnly.length, matchIdx + match[0].length + 60)
        let snippet = bodyOnly.slice(startIdx, endIdx).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

        if (startIdx > 0) snippet = '...' + snippet
        if (endIdx < bodyOnly.length) snippet = snippet + '...'

        results.push({
          id: `${page.url}_${matchIdx}`,
          sourceTitle: page.title || page.proposedTitle || 'Untitled Page',
          sourceUrl: getPathSlugForMatching(page.url) || page.url,
          anchorText: cleanAnchor,
          linkContext: snippet,
          destinationUrl: getPathSlugForMatching(targetUrl) || targetUrl
        })
      }
    }
  })

  return results
}

import fs from 'fs'
const raw = fs.readFileSync('c:/Antigravity/tse-audit-engine/src/exporter-data.json', 'utf8')
const data = JSON.parse(raw)
const siteKey = Object.keys(data)[0]
const pages = data[siteKey].pages.map(p => ({
  url: p.pageUrl || p.url,
  title: p.pageTitle || p.title,
  content: p.crawlData?.plainText || p.content || ''
}))

const homeLinks = getExistingInternalLinks('/', pages)
console.log('Hub Page ("/") Contextual Incoming Links Count:', homeLinks.length)
console.log('Sample links:', JSON.stringify(homeLinks.slice(0, 3), null, 2))
