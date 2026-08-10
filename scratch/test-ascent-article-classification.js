import fs from 'fs'
import { extractPagesFromPackage, extractPostsFromPackage } from '../src/utils/packageExtractor.js'

async function testAscentArticleClassification() {
  console.log('=== TESTING ARTICLE CLASSIFICATION ON REAL ASCENT PACKAGE ===\n')

  let pkg = null

  // 1. Try to fetch package from production API for Ascent Builders
  try {
    const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites')
    const sites = await res.json()
    const ascentSite = sites.find(s => s.name?.toLowerCase().includes('ascent'))

    if (ascentSite) {
      console.log(`Found Ascent Builders site in production SQLite (ID: ${ascentSite.id})`)
      const pkgRes = await fetch(`https://api-website-manager.thesearchequation.co.uk/api/websites/${ascentSite.id}/package`)
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json()
        pkg = pkgData.packageData || pkgData
      }
    }
  } catch (e) {
    console.log('API fetch note:', e.message)
  }

  // 2. If no package in API yet, construct sample Ascent WordPress package with posts and pages
  if (!pkg) {
    console.log('Using representative Ascent WordPress package structure for test...')
    pkg = {
      pages: [
        { id: 1, url: 'https://ascentbuilders.co.uk/', title: 'Home', post_type: 'page', is_front_page: true },
        { id: 2, url: 'https://ascentbuilders.co.uk/loft-conversions-banstead/', title: 'Loft Conversions Banstead', post_type: 'page' },
        { id: 3, url: 'https://ascentbuilders.co.uk/house-extensions-banstead/', title: 'House Extensions Banstead', post_type: 'page' },
        { id: 4, url: 'https://ascentbuilders.co.uk/privacy-policy/', title: 'Privacy Policy', post_type: 'page' }
      ],
      posts: [
        { id: 101, url: 'https://ascentbuilders.co.uk/velux-vs-dormer-loft-conversion/', title: 'Velux vs Dormer Loft Conversion', post_type: 'post' },
        { id: 102, url: 'https://ascentbuilders.co.uk/how-much-does-a-loft-conversion-cost/', title: 'How Much Does a Loft Conversion Cost?', post_type: 'post' }
      ]
    }
  }

  const rawPages = pkg.pages || []
  const rawPosts = extractPostsFromPackage(pkg) || pkg.posts || []
  const extractedPages = extractPagesFromPackage(pkg, 'https://ascentbuilders.co.uk')

  console.log(`pkg.pages count: ${rawPages.length}`)
  console.log(`pkg.posts count: ${rawPosts.length}`)
  console.log(`Combined Total URLs: ${extractedPages.length}`)

  const articles = extractedPages.filter(p => p.type === 'Article')
  const hubs = extractedPages.filter(p => p.type === 'Hub')
  const landings = extractedPages.filter(p => p.type === 'Landing')
  const topicals = extractedPages.filter(p => p.type === 'Topical')
  const excluded = extractedPages.filter(p => p.type === 'Excluded' || p.isExcluded)

  console.log(`WordPress posts found: ${rawPosts.length}`)
  console.log(`Articles classified: ${articles.length}`)
  console.log(`Hub count: ${hubs.length}`)
  console.log(`Landing count: ${landings.length}`)
  console.log(`Topical count: ${topicals.length}`)
  console.log(`Excluded count: ${excluded.length}`)

  // Specific page verification: "Velux vs Dormer Loft Conversion"
  const veluxPost = extractedPages.find(p => p.title?.toLowerCase().includes('velux') || p.url?.toLowerCase().includes('velux'))
  console.log('\n--- VERIFICATION: "Velux vs Dormer Loft Conversion" ---')
  if (veluxPost) {
    console.log(`Title: "${veluxPost.title}"`)
    console.log(`URL: ${veluxPost.url}`)
    console.log(`post_type: ${veluxPost.post_type}`)
    console.log(`Type / seoPageType: ${veluxPost.type}`)
    console.log(`Priority: ${veluxPost.priority}`)
    console.log(`Verification: ${veluxPost.type === 'Article' && veluxPost.priority === 4 ? 'PASSED (Type = Article, Priority = 4)' : 'FAILED'}`)
  } else {
    console.log('Velux post not found in test dataset.')
  }
}

testAscentArticleClassification()
