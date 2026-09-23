import db from './db.js'

/**
 * Safely parse WordPress REST JSON responses that may contain prepended HTML/CSS markup (e.g. Elementor <style> tags).
 */
export function parseSafeWpJson(rawText) {
  if (typeof rawText !== 'string') return rawText
  const trimmed = rawText.trim()
  if (!trimmed) return null

  // Fast path: clean JSON starting with { or [
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed)
    } catch (_fastErr) {}
  }

  // Scan candidate JSON start indices ({ or [)
  let idx = -1
  while (true) {
    const nextBrace = trimmed.indexOf('{', idx + 1)
    const nextBracket = trimmed.indexOf('[', idx + 1)
    if (nextBrace === -1 && nextBracket === -1) break
    if (nextBrace !== -1 && nextBracket !== -1) {
      idx = Math.min(nextBrace, nextBracket)
    } else if (nextBrace !== -1) {
      idx = nextBrace
    } else {
      idx = nextBracket
    }

    try {
      const candidate = trimmed.slice(idx)
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object') {
        return parsed
      }
    } catch (_parseErr) {
      // Continue searching next brace/bracket
    }
  }

  throw new Error(`Malformed WordPress REST response (no valid JSON object found): ${trimmed.slice(0, 150)}`)
}

const HTML_ENTITIES_MAP = {
  '&amp;': '&',
  '&#038;': '&',
  '&#38;': '&',
  '&quot;': '"',
  '&#039;': "'",
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&hellip;': '…',
  '&ndash;': '–',
  '&mdash;': '—',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&bull;': '•',
  '&pound;': '£',
  '&euro;': '€',
  '&yen;': '¥',
  '&cent;': '¢',
  '&plusmn;': '±',
  '&times;': '×',
  '&divide;': '÷',
  '&deg;': '°'
}

export function decodeHtmlEntities(val) {
  if (val === null || val === undefined) return ''
  let str = typeof val === 'string' ? val : String(val)
  if (!str || !str.includes('&')) return str

  let result = str
  for (const [entity, char] of Object.entries(HTML_ENTITIES_MAP)) {
    result = result.replaceAll(entity, char)
  }

  // Decimal numeric entities: &#(\d+); (e.g. &#8211;, &#8217;, &#38;)
  result = result.replace(/&#(\d+);/g, (_, dec) => {
    try {
      return String.fromCodePoint(parseInt(dec, 10))
    } catch {
      return _
    }
  })

  // Hexadecimal numeric entities: &#x([0-9a-fA-F]+); (e.g. &#x26;, &#x2013;)
  result = result.replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
    try {
      return String.fromCodePoint(parseInt(hex, 16))
    } catch {
      return _
    }
  })

  return result
}

/**
 * Resolve WordPress credentials server-side from SQLite `websites` table.
 */
export function resolveServerSiteCredentials({ siteId, siteUrl, pageUrl }) {
  let targetSite = null

  if (siteId) {
    const row = db.prepare('SELECT * FROM websites WHERE id = ?').get(String(siteId))
    if (row) targetSite = row
  }

  if (!targetSite) {
    const allSites = db.prepare('SELECT * FROM websites').all()
    const rawTarget = (siteUrl || pageUrl || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
    if (rawTarget) {
      targetSite = allSites.find(s => {
        const sDomain = (s.url || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
        return sDomain && (sDomain === rawTarget || sDomain.includes(rawTarget) || rawTarget.includes(sDomain))
      })
    }
  }

  if (!targetSite) {
    return { error: 'Site not found in Website Manager database.' }
  }

  let config = {}
  try {
    config = targetSite.config_data ? JSON.parse(targetSite.config_data) : {}
  } catch (_e) {}

  const wpUser = config.wpUser || targetSite.wpUser || targetSite.connectedUser || ''
  const wpPass = config.wpPass || targetSite.wpPass || ''

  if (!wpUser || !wpPass) {
    return { error: `WordPress credentials not configured for site '${targetSite.name || targetSite.url}'. Please configure username and application password.` }
  }

  let base = (targetSite.url || siteUrl || '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) {
    base = 'https://' + base
  }

  const authHeader = 'Basic ' + Buffer.from(`${wpUser}:${wpPass.replace(/\s/g, '')}`).toString('base64')

  return {
    base,
    wpUser,
    wpPass,
    authHeader,
    site: targetSite
  }
}

/**
 * Resolve numeric WordPress page ID and REST endpoint (pages / posts).
 */
async function resolvePageIdAndEndpoint(base, authHeader, { pageId, pageUrl, postType }) {
  let endpoint = postType === 'post' ? 'posts' : 'pages'
  let numericId = parseInt(pageId, 10)

  if (isNaN(numericId) && pageUrl) {
    const cleanUrl = pageUrl.replace(/\/+$/, '')
    const pathParts = cleanUrl.split('/')
    const slug = pathParts[pathParts.length - 1]
    if (slug) {
      // Try pages first
      try {
        const pageLookup = await fetch(`${base}/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&context=edit`, {
          headers: { Authorization: authHeader, Accept: 'application/json' },
          signal: AbortSignal.timeout(10000)
        })
        if (pageLookup.ok) {
          const raw = await pageLookup.text()
          const list = parseSafeWpJson(raw)
          if (Array.isArray(list) && list.length > 0 && list[0].id) {
            return { numericId: list[0].id, endpoint: 'pages' }
          }
        }
      } catch (_e) {}

      // Try posts second
      try {
        const postLookup = await fetch(`${base}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&context=edit`, {
          headers: { Authorization: authHeader, Accept: 'application/json' },
          signal: AbortSignal.timeout(10000)
        })
        if (postLookup.ok) {
          const raw = await postLookup.text()
          const list = parseSafeWpJson(raw)
          if (Array.isArray(list) && list.length > 0 && list[0].id) {
            return { numericId: list[0].id, endpoint: 'posts' }
          }
        }
      } catch (_e) {}
    }
  }

  return { numericId, endpoint }
}

/**
 * Execute server-side W4 Push to WordPress with multi-plugin support and mandatory live round-trip verification.
 */
export async function pushPageSeoFields({
  siteId,
  siteUrl,
  pageId,
  pageUrl,
  metaTitle,
  metaDescription,
  h1,
  targetPhrase
}) {
  // 1. Resolve site & credentials
  const creds = resolveServerSiteCredentials({ siteId, siteUrl, pageUrl })
  if (creds.error) {
    return { success: false, message: creds.error }
  }

  const { base, authHeader, site } = creds

  // 2. Resolve numeric ID and endpoint
  const { numericId, endpoint } = await resolvePageIdAndEndpoint(base, authHeader, { pageId, pageUrl })
  if (isNaN(numericId) || !numericId) {
    return { success: false, message: `Could not resolve numeric WordPress page ID for '${pageUrl || pageId}'.` }
  }

  const effectiveTargetPhrase = (targetPhrase || '').trim()

  // 3. Fetch existing page content & Elementor JSON for structured H1 updating
  let existingContent = ''
  let existingElementorData = null
  let existingTitle = ''

  try {
    const pageFetchRes = await fetch(`${base}/wp-json/wp/v2/${endpoint}/${numericId}?context=edit`, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000)
    })
    if (pageFetchRes.ok) {
      const rawText = await pageFetchRes.text()
      const existingPageData = parseSafeWpJson(rawText)
      if (existingPageData) {
        existingContent = existingPageData.content?.raw || existingPageData.content?.rendered || ''
        existingElementorData = existingPageData.meta?._elementor_data || existingPageData._elementor_data || null
        existingTitle = existingPageData.title?.raw || existingPageData.title?.rendered || ''
      }
    } else if (pageFetchRes.status === 401 || pageFetchRes.status === 403) {
      return { success: false, message: `WordPress authentication failed (HTTP ${pageFetchRes.status}): Application password was rejected by WordPress.` }
    }
  } catch (pErr) {
    console.warn('[SERVER_WP_SEO] Page fetch warning:', pErr.message)
  }

  // 4. Prepare Content & H1 HTML Replacement
  let updatedContent = undefined
  if (h1 && typeof h1 === 'string' && h1.trim()) {
    const cleanH1 = h1.trim()
    let contentToProcess = existingContent.replace(/^(\s*<h1[^>]*>[\s\S]*?<\/h1>\s*)+/i, '')
    if (/<h1[^>]*>[\s\S]*?<\/h1>/i.test(contentToProcess)) {
      updatedContent = contentToProcess.replace(/<h1([^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${cleanH1}</h1>`)
    } else if (existingContent !== contentToProcess) {
      updatedContent = contentToProcess
    }
  }

  // 5. Prepare Elementor JSON tree H1 update if applicable
  let updatedElementorJson = null
  if (existingElementorData && h1) {
    try {
      const tree = typeof existingElementorData === 'string' ? JSON.parse(existingElementorData) : existingElementorData
      if (Array.isArray(tree)) {
        let targetH1Node = null

        function findAndTargetElementorH1Widget(nodes) {
          if (!Array.isArray(nodes) || targetH1Node) return
          for (const node of nodes) {
            const wType = String(node.widgetType || '').toLowerCase()
            const settings = node.settings || {}
            const hSize = String(settings.header_size || settings.tag || settings.html_tag || '').toLowerCase()
            const isHeadingWidget = wType === 'heading' || wType === 'elementskit-heading' || wType === 'ekit-heading' || wType === 'theme-page-title' || Boolean(node.settings)
            if (isHeadingWidget && node.settings && hSize === 'h1') {
              targetH1Node = node
              return
            }
            if (Array.isArray(node.elements)) findAndTargetElementorH1Widget(node.elements)
          }
        }

        findAndTargetElementorH1Widget(tree)

        if (targetH1Node && targetH1Node.settings) {
          const cleanH1 = h1.trim()
          if (targetH1Node.settings.title !== undefined) targetH1Node.settings.title = cleanH1
          if (targetH1Node.settings.ekit_heading_title !== undefined) targetH1Node.settings.ekit_heading_title = cleanH1
          if (targetH1Node.settings.header_title !== undefined) targetH1Node.settings.header_title = cleanH1
          if (targetH1Node.settings.ekit_heading_title_title !== undefined) targetH1Node.settings.ekit_heading_title_title = cleanH1
          if (targetH1Node.settings.heading_title !== undefined) targetH1Node.settings.heading_title = cleanH1
          if (targetH1Node.settings.title === undefined && targetH1Node.settings.heading_title === undefined) {
            targetH1Node.settings.title = cleanH1
          }
          updatedElementorJson = JSON.stringify(tree)
        }
      }
    } catch (_eErr) {
      console.warn('[SERVER_WP_SEO] Elementor JSON tree parse error:', _eErr.message)
    }
  }

  // 6. Build Multi-Plugin Meta Payload
  const universalMeta = {
    // Rank Math
    ...(metaTitle ? { rank_math_title: metaTitle } : {}),
    ...(metaDescription ? { rank_math_description: metaDescription } : {}),
    ...(effectiveTargetPhrase ? { rank_math_focus_keyword: effectiveTargetPhrase } : {}),
    // Yoast SEO
    ...(metaTitle ? { _yoast_wpseo_title: metaTitle, yoast_wpseo_title: metaTitle } : {}),
    ...(metaDescription ? { _yoast_wpseo_metadesc: metaDescription, yoast_wpseo_metadesc: metaDescription } : {}),
    ...(effectiveTargetPhrase ? { _yoast_wpseo_focuskw: effectiveTargetPhrase } : {}),
    // AIOSEO
    ...(metaTitle ? { _aioseo_title: metaTitle } : {}),
    ...(metaDescription ? { _aioseo_description: metaDescription } : {}),
    // SEOPress
    ...(metaTitle ? { _seopress_titles_title: metaTitle } : {}),
    ...(metaDescription ? { _seopress_titles_desc: metaDescription } : {}),
    // Elementor
    ...(updatedElementorJson ? { _elementor_data: updatedElementorJson, elementor_data: updatedElementorJson } : {})
  }

  // Build WordPress Core payload — DO NOT include 'title' so WordPress post_title remains untouched
  const payload = {
    ...(updatedContent !== undefined ? { content: updatedContent } : {}),
    ...(updatedElementorJson ? { _elementor_data: updatedElementorJson, elementor_data: updatedElementorJson } : {}),
    meta_input: universalMeta,
    meta: universalMeta
  }

  // 7. Write to WordPress Core REST Endpoint
  const targetWpUrl = `${base}/wp-json/wp/v2/${endpoint}/${numericId}`
  try {
    const res = await fetch(targetWpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        Accept: 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000)
    })

    if (!res.ok) {
      let errDetail = `HTTP ${res.status}`
      try {
        const text = await res.text()
        const parsed = parseSafeWpJson(text)
        errDetail = parsed?.message || parsed?.code || text.slice(0, 150)
      } catch (_e) {}
      return {
        success: false,
        status: res.status,
        message: `WordPress update failed (${res.status}): ${errDetail}`
      }
    }
  } catch (netErr) {
    return {
      success: false,
      message: `Failed to connect to WordPress REST API: ${netErr.message}`
    }
  }

  // 8. TSE Site Exporter Dedicated Endpoint (Key for Yoast & Custom Fields)
  try {
    if (metaTitle) {
      await fetch(`${base}/wp-json/tse-site-exporter/v1/update-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader, Accept: 'application/json' },
        body: JSON.stringify({ post_id: numericId, field: 'seo_title', value: metaTitle }),
        signal: AbortSignal.timeout(10000)
      })
    }
    if (metaDescription) {
      await fetch(`${base}/wp-json/tse-site-exporter/v1/update-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader, Accept: 'application/json' },
        body: JSON.stringify({ post_id: numericId, field: 'meta_description', value: metaDescription }),
        signal: AbortSignal.timeout(10000)
      })
    }
  } catch (_tseErr) {
    console.warn('[SERVER_WP_SEO] TSE Site Exporter update-page call warning:', _tseErr.message)
  }

  // 9. Yoast Bulk Editor Dedicated Endpoint (Secondary Yoast Fallback)
  try {
    await fetch(`${base}/wp-json/yoast/v1/bulk_editor/update_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        Accept: 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            id: numericId,
            ...(metaTitle ? { seo_title: metaTitle } : {}),
            ...(metaDescription ? { meta_description: metaDescription } : {})
          }
        ]
      }),
      signal: AbortSignal.timeout(10000)
    })
  } catch (_yErr) {}

  // 10. Invalidate Elementor / WP-Rocket Cache
  try {
    await fetch(`${base}/wp-json/elementor/v1/cache`, {
      method: 'DELETE',
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(8000)
    })
  } catch (_cacheErr) {}

  // 11. MANDATORY ROUND-TRIP LIVE VERIFICATION
  let verifiedTitle = ''
  let verifiedDesc = ''
  let verifiedH1 = ''

  const pageTargetUrl = pageUrl || `${base}/?p=${numericId}`
  const fullTargetUrl = pageTargetUrl.startsWith('http') ? pageTargetUrl : `${base}${pageTargetUrl.startsWith('/') ? '' : '/'}${pageTargetUrl}`
  const verifyUrl = `${fullTargetUrl}${fullTargetUrl.includes('?') ? '&' : '?'}tse_verify=${Date.now()}`

  try {
    const pubRes = await fetch(verifyUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TSE-Website-Manager/Verification'
      },
      signal: AbortSignal.timeout(15000)
    })
    if (pubRes.ok) {
      const html = await pubRes.text()
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch && titleMatch[1]) {
        verifiedTitle = decodeHtmlEntities(titleMatch[1].trim())
      }
      const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
      if (descMatch && descMatch[1]) {
        verifiedDesc = decodeHtmlEntities(descMatch[1].trim())
      }
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      if (h1Match && h1Match[1]) {
        verifiedH1 = decodeHtmlEntities(h1Match[1].replace(/<[^>]+>/g, '').trim())
      }
    }
  } catch (vErr) {
    console.warn('[SERVER_WP_SEO] Public verification fetch warning:', vErr.message)
  }

  // Fallback REST verification for headless / SPA pages or themes
  if (!verifiedTitle || !verifiedDesc) {
    try {
      const restVRes = await fetch(`${base}/wp-json/wp/v2/${endpoint}/${numericId}?_fields=title,yoast_head,yoast_head_json,meta&tse_v=${Date.now()}`, {
        headers: { Authorization: authHeader, Accept: 'application/json' },
        signal: AbortSignal.timeout(10000)
      })
      if (restVRes.ok) {
        const raw = await restVRes.text()
        const vData = parseSafeWpJson(raw)
        if (vData) {
          if (!verifiedTitle) {
            verifiedTitle = decodeHtmlEntities(vData.yoast_head_json?.title || vData.meta?.rank_math_title || vData.title?.rendered || '')
          }
          if (!verifiedDesc) {
            verifiedDesc = decodeHtmlEntities(vData.yoast_head_json?.description || vData.meta?.rank_math_description || '')
          }
        }
      }
    } catch (_rvErr) {}
  }

  // Field-by-Field Verification Invariant
  const failedFields = []

  function cleanStr(s) {
    return decodeHtmlEntities(String(s || ''))
      .replace(/[\u2013\u2014\u2018\u2019\u201C\u201D"']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  }

  if (metaTitle && metaTitle.trim()) {
    const expT = cleanStr(metaTitle)
    const actT = cleanStr(verifiedTitle)
    if (!actT || (!actT.includes(expT) && !expT.includes(actT))) {
      failedFields.push({ field: 'Meta Title', expected: decodeHtmlEntities(metaTitle), actual: verifiedTitle || '[Empty/Not Found]' })
    }
  }

  if (metaDescription && metaDescription.trim()) {
    const expD = cleanStr(metaDescription)
    const actD = cleanStr(verifiedDesc)
    if (!actD || (!actD.includes(expD) && !expD.includes(actD))) {
      failedFields.push({ field: 'Meta Description', expected: decodeHtmlEntities(metaDescription), actual: verifiedDesc || '[Empty/Not Found]' })
    }
  }

  if (h1 && h1.trim()) {
    const expH = cleanStr(h1)
    const actH = cleanStr(verifiedH1)
    if (!actH || (!actH.includes(expH) && !expH.includes(actH))) {
      failedFields.push({ field: 'H1 Tag', expected: decodeHtmlEntities(h1), actual: verifiedH1 || '[Empty/Not Found]' })
    }
  }

  if (failedFields.length > 0) {
    const fieldList = failedFields.map(f => `${f.field} (Expected: "${f.expected}", Actual: "${f.actual}")`).join('; ')
    return {
      success: false,
      failedFields,
      verifiedActuals: {
        metaTitle: verifiedTitle || '',
        metaDescription: verifiedDesc || '',
        h1: verifiedH1 || ''
      },
      message: `WordPress Verification Failed — the following fields were NOT applied by WordPress: ${fieldList}`
    }
  }

  return {
    success: true,
    verifiedActuals: {
      metaTitle: verifiedTitle || decodeHtmlEntities(metaTitle),
      metaDescription: verifiedDesc || decodeHtmlEntities(metaDescription),
      h1: verifiedH1 || decodeHtmlEntities(h1)
    },
    message: 'All fields successfully updated and verified on live WordPress site.'
  }
}
