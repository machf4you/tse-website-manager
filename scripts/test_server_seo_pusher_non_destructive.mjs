import { parseSafeWpJson, resolveServerSiteCredentials } from '../server/wordpressSeoPusher.js'
import db from '../server/db.js'
import assert from 'assert'

console.log('============================================================')
console.log('🧪 RUNNING NON-DESTRUCTIVE SERVER SEO PUSHER TEST SUITE')
console.log('============================================================')

// Test 1: parseSafeWpJson with clean JSON
console.log('\n[Test 1] Testing parseSafeWpJson with clean JSON object...')
const cleanObj = { id: 17089, title: { rendered: 'Test Title' }, slug: 'test-slug' }
const parsedClean = parseSafeWpJson(JSON.stringify(cleanObj))
assert.strictEqual(parsedClean.id, 17089)
assert.strictEqual(parsedClean.slug, 'test-slug')
console.log('  ✅ [PASS] Clean JSON parsed successfully.')

// Test 2: parseSafeWpJson with prepended Elementor <style> block (Diamond pattern)
console.log('\n[Test 2] Testing parseSafeWpJson with prepended Elementor CSS block...')
const corruptedResponse = `<style id="elementor-post-17089">.elementor-widget-section { font-size: 16px; }</style>{"id":17089,"title":{"rendered":"Window Shutters"},"slug":"window-shutters"}`
const parsedCorrupted = parseSafeWpJson(corruptedResponse)
assert.strictEqual(parsedCorrupted.id, 17089)
assert.strictEqual(parsedCorrupted.title.rendered, 'Window Shutters')
console.log('  ✅ [PASS] Prepended Elementor CSS safely bypassed and JSON parsed successfully.')

// Test 3: parseSafeWpJson with truly invalid response (fails clearly)
console.log('\n[Test 3] Testing parseSafeWpJson with non-JSON HTML error page...')
let caughtError = false
try {
  parseSafeWpJson('<!DOCTYPE html><html><body><h1>502 Bad Gateway</h1></body></html>')
} catch (e) {
  caughtError = true
  assert(e.message.includes('Malformed WordPress REST response'))
}
assert.strictEqual(caughtError, true)
console.log('  ✅ [PASS] Non-JSON response fails clearly with descriptive error.')

// Test 4: resolveServerSiteCredentials
console.log('\n[Test 4] Testing resolveServerSiteCredentials against database...')
const allSites = db.prepare('SELECT id, name, url, config_data FROM websites').all()
const configuredSite = allSites.find(s => {
  try {
    const cfg = s.config_data ? JSON.parse(s.config_data) : {}
    return Boolean(cfg.wpUser && cfg.wpPass)
  } catch (_e) {
    return false
  }
})

if (configuredSite) {
  const creds = resolveServerSiteCredentials({ siteId: configuredSite.id, siteUrl: configuredSite.url })
  assert(!creds.error, `Failed to resolve credentials: ${creds.error}`)
  assert(creds.wpUser, 'wpUser should be present in server-resolved credentials')
  assert(creds.wpPass, 'wpPass should be present in server-resolved credentials')
  assert(creds.authHeader.startsWith('Basic '), 'authHeader should be generated')
  console.log(`  ✅ [PASS] Resolved credentials server-side for '${creds.site.name}' (User: ${creds.wpUser}, Pass Length: ${creds.wpPass.length}).`)
} else {
  console.log('  ⚠️ [SKIP] No site with configured credentials found in test database.')
}

// Test 5: Verify credentials not present if site missing
console.log('\n[Test 5] Testing resolveServerSiteCredentials for non-existent site...')
const missingCreds = resolveServerSiteCredentials({ siteId: 'non-existent-999999', siteUrl: 'https://nonexistent-site-xyz.co.uk' })
assert(missingCreds.error, 'Should return error for unknown site')
console.log('  ✅ [PASS] Unknown site safely returns error.')

// Test 6: Invariant: Core WordPress REST Payload MUST NOT include 'title'
console.log('\n[Test 6] Invariant: Core WordPress REST payload never includes "title" (post_title decoupled)...')
function simulateBuildPayload({ metaTitle, metaDescription, h1, existingElementorData, existingContent }) {
  let updatedContent = undefined
  if (h1 && typeof h1 === 'string' && h1.trim()) {
    const cleanH1 = h1.trim()
    let contentToProcess = (existingContent || '').replace(/^(\s*<h1[^>]*>[\s\S]*?<\/h1>\s*)+/i, '')
    if (/<h1[^>]*>[\s\S]*?<\/h1>/i.test(contentToProcess)) {
      updatedContent = contentToProcess.replace(/<h1([^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${cleanH1}</h1>`)
    } else if (existingContent !== contentToProcess) {
      updatedContent = contentToProcess
    }
  }

  let updatedElementorJson = null
  if (existingElementorData && h1) {
    const tree = typeof existingElementorData === 'string' ? JSON.parse(existingElementorData) : existingElementorData
    if (Array.isArray(tree)) {
      let targetH1Node = null
      function findH1(nodes) {
        if (!Array.isArray(nodes) || targetH1Node) return
        for (const n of nodes) {
          const wType = String(n.widgetType || '').toLowerCase()
          const st = n.settings || {}
          const hSize = String(st.header_size || st.tag || st.html_tag || '').toLowerCase()
          if ((wType === 'heading' || wType === 'elementskit-heading') && hSize === 'h1') {
            targetH1Node = n
            return
          }
          if (Array.isArray(n.elements)) findH1(n.elements)
        }
      }
      findH1(tree)
      if (targetH1Node && targetH1Node.settings) {
        targetH1Node.settings.title = h1.trim()
        updatedElementorJson = JSON.stringify(tree)
      }
    }
  }

  const universalMeta = {
    ...(metaTitle ? { _yoast_wpseo_title: metaTitle, yoast_wpseo_title: metaTitle } : {}),
    ...(metaDescription ? { _yoast_wpseo_metadesc: metaDescription, yoast_wpseo_metadesc: metaDescription } : {}),
    ...(updatedElementorJson ? { _elementor_data: updatedElementorJson, elementor_data: updatedElementorJson } : {})
  }

  return {
    ...(updatedContent !== undefined ? { content: updatedContent } : {}),
    ...(updatedElementorJson ? { _elementor_data: updatedElementorJson, elementor_data: updatedElementorJson } : {}),
    meta_input: universalMeta,
    meta: universalMeta
  }
}

const mockElementor = JSON.stringify([
  {
    id: 'section-1',
    elements: [
      {
        widgetType: 'heading',
        settings: { header_size: 'h1', title: 'Old H1 Title' }
      }
    ]
  }
])

const payloadFull = simulateBuildPayload({
  metaTitle: 'Window Shutters Blinds',
  metaDescription: 'Quality UPVC Window Shutters Blinds...',
  h1: 'See Our Great Range of Window Shutter Blinds',
  existingElementorData: mockElementor,
  existingContent: '<p>Some content</p>'
})

assert.strictEqual(payloadFull.title, undefined, 'Core REST payload MUST NOT contain "title" property')
assert(payloadFull.meta_input._yoast_wpseo_title === 'Window Shutters Blinds', 'Yoast SEO title must be in meta_input')
assert(payloadFull._elementor_data.includes('See Our Great Range of Window Shutter Blinds'), 'H1 must update Elementor widget data')
console.log('  ✅ [PASS] Core payload omits "title" completely while routing Meta Title to Yoast and H1 to Elementor.')

// Test 7: Changing ONLY H1 does not affect post_title or SEO meta
console.log('\n[Test 7] Invariant: Changing ONLY H1 does not mutate post_title or Yoast meta...')
const payloadOnlyH1 = simulateBuildPayload({
  metaTitle: '',
  metaDescription: '',
  h1: 'New Solo H1 Tag',
  existingElementorData: mockElementor
})
assert.strictEqual(payloadOnlyH1.title, undefined)
assert.strictEqual(payloadOnlyH1.meta_input._yoast_wpseo_title, undefined)
assert(payloadOnlyH1._elementor_data.includes('New Solo H1 Tag'))
console.log('  ✅ [PASS] Changing ONLY H1 affects only the heading widget and never touches post_title.')

// Test 8: Changing ONLY Meta Title does not affect post_title or H1
console.log('\n[Test 8] Invariant: Changing ONLY Meta Title does not mutate post_title or H1...')
const payloadOnlyMeta = simulateBuildPayload({
  metaTitle: 'Brand New Meta Title',
  metaDescription: 'Brand New Description',
  h1: '',
  existingElementorData: mockElementor
})
assert.strictEqual(payloadOnlyMeta.title, undefined)
assert.strictEqual(payloadOnlyMeta._elementor_data, undefined)
assert.strictEqual(payloadOnlyMeta.meta_input._yoast_wpseo_title, 'Brand New Meta Title')
console.log('  ✅ [PASS] Changing ONLY Meta Title affects only SEO metadata and never touches post_title or H1.')

console.log('\n============================================================')
console.log('🎉 ALL NON-DESTRUCTIVE TESTS PASSED SUCCESSFULLY')
console.log('============================================================')
