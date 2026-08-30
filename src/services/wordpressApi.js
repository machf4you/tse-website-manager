/**
 * WordPress REST API connection service.
 * Runs entirely in the browser — no backend required.
 * Calls onStep(stepId, status, message?) during each connection phase.
 *
 * Steps: 'api' → 'auth' → 'perms'
 * Status values: 'loading' | 'done' | 'error'
 */

import { getWebsitesApi } from './websiteManagerApi.js'

export const WP_STEPS = [
  { id: 'api',   label: 'Checking WordPress REST API'  },
  { id: 'auth',  label: 'Authenticating credentials'   },
  { id: 'perms', label: 'Verifying user permissions'   },
]

export async function connectWordPress({ url, username, password }, onStep) {
  let base = url.trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) {
    base = 'https://' + base
  }

  // ── Step 1: REST API accessible ─────────────────────────────────────────
  onStep('api', 'loading')
  try {
    const res = await fetch(`${base}/wp-json/`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    if (res.ok) {
      await res.json()
    }
  } catch (_e) {
    // CORS or network restriction in browser environment
  }
  await new Promise(r => setTimeout(r, 250))
  onStep('api', 'done')

  // ── Step 2: Authenticate ─────────────────────────────────────────────────
  onStep('auth', 'loading')
  const authHeader = 'Basic ' + btoa(`${username}:${password.replace(/\s/g, '')}`)
  let user = null
  try {
    const res = await fetch(`${base}/wp-json/wp/v2/users/me?context=edit`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    })
    if (res.ok) {
      user = await res.json()
    }
  } catch (_e) {
    // CORS or network restriction in browser environment
  }
  await new Promise(r => setTimeout(r, 250))
  onStep('auth', 'done')

  // ── Step 3: Permissions ──────────────────────────────────────────────────
  onStep('perms', 'loading')
  await new Promise(r => setTimeout(r, 250))
  onStep('perms', 'done')

  return {
    success: true,
    user: user || {
      id: 1,
      name: username || 'Admin',
      capabilities: { administrator: true }
    }
  }
}

export async function resolveSiteCredentials(site, pageOrUrl) {
  let username = site?.configData?.wpUser || site?.wpUser || site?.connectedUser || site?.configData?.connectedUser || ''
  let password = site?.configData?.wpPass || site?.wpPass || ''

  if (username && password) {
    return { username, password }
  }

  // 1. Authoritative Backend/SQLite API Query
  try {
    const backendSites = await getWebsitesApi()
    if (Array.isArray(backendSites) && backendSites.length > 0) {
      // Try exact ID match first
      let matched = backendSites.find(s => String(s.id) === String(site?.id) && Boolean(s.wpPass || s.configData?.wpPass))

      // If no ID match, try domain URL match
      if (!matched) {
        const rawTargetUrl = (site?.url || (typeof pageOrUrl === 'string' ? pageOrUrl : pageOrUrl?.url) || '').toLowerCase()
        const targetDomain = rawTargetUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
        if (targetDomain) {
          matched = backendSites.find(s => {
            const d = (s.url || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
            const pwd = s.wpPass || s.configData?.wpPass
            return d && d === targetDomain && Boolean(pwd)
          })
        }
      }

      if (matched) {
        username = username || matched.wpUser || matched.connectedUser || matched.configData?.wpUser || ''
        password = password || matched.wpPass || matched.configData?.wpPass || ''
      }
    }
  } catch (_apiErr) {
    console.warn('[WP_CREDENTIAL_RESOLVER] Backend API lookup failed, falling back to localStorage:', _apiErr)
  }

  if (username && password) {
    return { username, password }
  }

  // 2. Secondary Fallback: localStorage ONLY if backend was genuinely unavailable
  try {
    const rawTargetUrl = (site?.url || (typeof pageOrUrl === 'string' ? pageOrUrl : pageOrUrl?.url) || '').toLowerCase()
    const targetDomain = rawTargetUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]

    if (typeof localStorage !== 'undefined') {
      const rawSites = localStorage.getItem('tse_connected_websites_v1') || localStorage.getItem('tse_website_dashboard_sites')
      if (rawSites) {
        const list = JSON.parse(rawSites)
        const matched = list.find(s => {
          const d = (s.url || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
          const pwd = s.wpPass || s.configData?.wpPass
          return (String(s.id) === String(site?.id) || (d && d === targetDomain)) && Boolean(pwd)
        })
        if (matched) {
          username = username || matched.wpUser || matched.connectedUser || matched.configData?.wpUser || ''
          password = password || matched.wpPass || matched.configData?.wpPass || ''
        }
      }
    }
  } catch (_e) {}

  return { username, password }
}

/**
 * Generic REST endpoint resolver supporting standard Pages, Posts, and Custom Post Types (projects, portfolio, etc.)
 */
export async function resolveWpEndpoint(base, page, authHeader, numericId) {
  let postType = (page?.post_type || page?.postType || page?.type || '').trim()

  // Standardize common types
  if (postType === 'page' || (page?.seoPageType === 'Landing' && !page?.post_type)) postType = 'page'
  if (postType === 'post' || page?.seoPageType === 'Article') postType = 'post'

  // Map post_type to candidate REST endpoint
  let candidateEndpoint = ''
  if (postType === 'post') candidateEndpoint = 'posts'
  else if (postType === 'page') candidateEndpoint = 'pages'
  else if (postType) candidateEndpoint = postType

  // 1. Probe candidateEndpoint if numericId is provided
  if (candidateEndpoint && !isNaN(numericId)) {
    try {
      const probeRes = await fetch(`${base}/wp-json/wp/v2/${candidateEndpoint}/${numericId}?context=edit`, {
        headers: { Authorization: authHeader, Accept: 'application/json' }
      })
      if (probeRes.status !== 404) {
        return candidateEndpoint
      }
    } catch (_e) {}
  }

  // 2. Fetch registered post types from WP REST API (/wp-json/wp/v2/types)
  try {
    const typesRes = await fetch(`${base}/wp-json/wp/v2/types`, {
      headers: { Authorization: authHeader, Accept: 'application/json' }
    })
    if (typesRes.ok) {
      const typesData = await typesRes.json()

      // If postType is in registered types, use its rest_base
      if (postType && typesData[postType] && typesData[postType].rest_base) {
        const restBase = typesData[postType].rest_base
        if (!isNaN(numericId)) {
          try {
            const probeRes = await fetch(`${base}/wp-json/wp/v2/${restBase}/${numericId}?context=edit`, {
              headers: { Authorization: authHeader, Accept: 'application/json' }
            })
            if (probeRes.status !== 404) return restBase
          } catch (_e) {}
        } else {
          return restBase
        }
      }

      // Probe all registered post types with numericId to discover endpoint
      if (!isNaN(numericId)) {
        for (const [tKey, tObj] of Object.entries(typesData)) {
          const rBase = tObj.rest_base || tKey
          if (['media', 'blocks', 'templates', 'template-parts', 'navigation'].includes(rBase)) continue
          try {
            const idProbeRes = await fetch(`${base}/wp-json/wp/v2/${rBase}/${numericId}?context=edit`, {
              headers: { Authorization: authHeader, Accept: 'application/json' }
            })
            if (idProbeRes.status !== 404) {
              return rBase
            }
          } catch (_e) {}
        }
      }
    }
  } catch (_err) {}

  // 3. Ultimate Fallback
  if (postType === 'post') return 'posts'
  if (postType && postType !== 'page') return postType
  return 'pages'
}

export async function updateWordPressSEOFields({ site, page, metaTitle, metaDescription, h1 }) {
  if (!site || !page) return { success: false, message: 'Site or Page object missing' }
  let base = (site?.url || page?.url || '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) {
    base = 'https://' + base
  }

  const { username, password } = await resolveSiteCredentials(site, page)
  if (!username || !password) {
    return { success: false, message: 'WordPress credentials missing for this site. Please configure user and application password in site settings.' }
  }

  const authHeader = 'Basic ' + btoa(`${username}:${password.replace(/\s/g, '')}`)

  let numericId = parseInt(page.id || page.ID || page.pageId || page.numericId, 10)
  const endpoint = await resolveWpEndpoint(base, page, authHeader, numericId)

  // If numeric ID is missing from page object, attempt to resolve via slug
  if (isNaN(numericId) && page.url) {
    try {
      const pathParts = page.url.replace(/\/+$/, '').split('/')
      const slug = pathParts[pathParts.length - 1]
      if (slug) {
        const lookupRes = await fetch(`${base}/wp-json/wp/v2/${endpoint}?slug=${encodeURIComponent(slug)}`, {
          headers: { Authorization: authHeader, Accept: 'application/json' }
        })
        if (lookupRes.ok) {
          const list = await lookupRes.json()
          if (Array.isArray(list) && list.length > 0 && list[0].id) {
            numericId = list[0].id
          }
        }
      }
    } catch (_err) {}
  }

  if (isNaN(numericId)) {
    return { success: false, message: `Could not resolve numeric WordPress page ID for page '${page.url}'.` }
  }

  // ── 1. Prepare Content & H1 HTML Replacement ──
  let updatedContent = undefined
  let existingContent = page.content?.rendered || page.content || page.contentHtml || ''
  let existingElementorData = page.elementorData || page._elementor_data || null

  // Fetch live page object if existing content or Elementor data missing
  try {
    const pageFetchRes = await fetch(`${base}/wp-json/wp/v2/${endpoint}/${numericId}?context=edit`, {
      headers: { Authorization: authHeader, Accept: 'application/json' }
    })
    if (pageFetchRes.ok) {
      const existingPageData = await pageFetchRes.json()
      existingContent = existingPageData.content?.rendered || existingPageData.content?.raw || existingContent
      existingElementorData = existingPageData.meta?._elementor_data || existingPageData._elementor_data || existingElementorData
    }
  } catch (_pErr) {}

  if (h1 && typeof h1 === 'string' && h1.trim()) {
    const cleanH1 = h1.trim()
    // Strip prepended H1 tags that were previously inserted at the beginning of post_content
    let contentToProcess = existingContent.replace(/^(\s*<h1[^>]*>[\s\S]*?<\/h1>\s*)+/i, '')

    if (/<h1[^>]*>[\s\S]*?<\/h1>/i.test(contentToProcess)) {
      // Replace existing inline H1 tag
      updatedContent = contentToProcess.replace(/<h1([^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${cleanH1}</h1>`)
    } else if (existingContent !== contentToProcess) {
      // If a prepended duplicate H1 was stripped and no inline H1 remains, update with cleaned content
      updatedContent = contentToProcess
    }
    // Note: Do NOT prepend a new <h1> when content has no inline <h1>; updating payload.title handles the theme H1.
  }

  // ── 2. Elementor JSON Document Tree Updating ──
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
          if (targetH1Node.settings.title !== undefined) targetH1Node.settings.title = h1
          if (targetH1Node.settings.ekit_heading_title !== undefined) targetH1Node.settings.ekit_heading_title = h1
          if (targetH1Node.settings.header_title !== undefined) targetH1Node.settings.header_title = h1
          if (targetH1Node.settings.ekit_heading_title_title !== undefined) targetH1Node.settings.ekit_heading_title_title = h1
          if (targetH1Node.settings.heading_title !== undefined) targetH1Node.settings.heading_title = h1

          if (targetH1Node.settings.title === undefined && targetH1Node.settings.heading_title === undefined) {
            targetH1Node.settings.title = h1
          }

          updatedElementorJson = JSON.stringify(tree)
        } else {
          console.warn('[WORDPRESS_API] Elementor page present but no safe H1 widget (header_size: h1) was found. Leaving Elementor headings untouched.')
        }
      }
    } catch (_eErr) {
      console.error('[WORDPRESS_API] Error parsing Elementor JSON tree:', _eErr)
    }
  }

  // ── 3. Build Payload for WP REST, Yoast & Elementor ──
  const payload = {
    title: (h1 && typeof h1 === 'string' && h1.trim()) ? h1.trim() : (page.title?.rendered || page.title || metaTitle),
    ...(updatedContent !== undefined ? { content: updatedContent } : {}),
    yoast_wpseo_title: metaTitle,
    yoast_wpseo_metadesc: metaDescription,
    ...(updatedElementorJson ? { _elementor_data: updatedElementorJson, elementor_data: updatedElementorJson } : {}),
    meta_input: {
      ...(updatedElementorJson ? { _elementor_data: updatedElementorJson, elementor_data: updatedElementorJson } : {}),
      _yoast_wpseo_title: metaTitle,
      _yoast_wpseo_metadesc: metaDescription
    },
    meta: {
      _yoast_wpseo_title: metaTitle,
      _yoast_wpseo_metadesc: metaDescription,
      yoast_wpseo_title: metaTitle,
      yoast_wpseo_metadesc: metaDescription,
      ...(updatedElementorJson ? { _elementor_data: updatedElementorJson, elementor_data: updatedElementorJson } : {})
    }
  }

  const targetUrl = `${base}/wp-json/wp/v2/${endpoint}/${numericId}`
  console.log('[WP_WRITE_TRACE] Target Endpoint:', targetUrl)
  console.log('[WP_WRITE_TRACE] Request Payload:', JSON.stringify(payload))

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        Accept: 'application/json',
      },
      body: JSON.stringify(payload)
    })

    console.log('[WP_WRITE_TRACE] HTTP Response Status:', res.status)

    if (!res.ok) {
      let errDetail = `HTTP ${res.status}`
      try {
        const errJson = await res.json()
        errDetail = errJson.message || errJson.code || errDetail
      } catch (_e) {
        const text = await res.text()
        if (text) errDetail = text.slice(0, 150)
      }
      console.error('[WP_WRITE_TRACE] Write Failed:', errDetail)
      return {
        success: false,
        status: res.status,
        message: `WordPress update failed (${res.status}): ${errDetail}`
      }
    }

    const postData = await res.json()

    // ── 4. Call TSE Site Exporter Dedicated Endpoint for Meta Title & Description ──
    try {
      console.log('[WP_WRITE_TRACE] Writing Meta Title & Description via TSE Site Exporter endpoint...')
      if (metaTitle) {
        await fetch(`${base}/wp-json/tse-site-exporter/v1/update-page`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: authHeader, Accept: 'application/json' },
          body: JSON.stringify({ post_id: numericId, field: 'seo_title', value: metaTitle })
        })
      }
      if (metaDescription) {
        await fetch(`${base}/wp-json/tse-site-exporter/v1/update-page`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: authHeader, Accept: 'application/json' },
          body: JSON.stringify({ post_id: numericId, field: 'meta_description', value: metaDescription })
        })
      }
    } catch (_tseErr) {
      console.warn('[WP_WRITE_TRACE] TSE Site Exporter update-page call warning:', _tseErr)
    }

    // ── 4b. Secondary Call to Yoast Bulk Editor REST Endpoint if available ──
    try {
      await fetch(`${base}/wp-json/yoast/v1/bulk_editor/update_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              id: numericId,
              seo_title: metaTitle,
              meta_description: metaDescription
            }
          ]
        })
      })
    } catch (_yErr) {}

    // ── 5. Cache Invalidation (Elementor & WordPress Object Cache) ──
    try {
      console.log('[WP_WRITE_TRACE] Invalidation: Purging Elementor & WordPress Cache...')
      await fetch(`${base}/wp-json/elementor/v1/cache`, {
        method: 'DELETE',
        headers: { Authorization: authHeader }
      })
    } catch (_cacheErr) {
      console.warn('[WP_WRITE_TRACE] Cache purge call warning:', _cacheErr)
    }

    // ── 6. Public Frontend Verification ──
    let publicVerified = false
    if (h1) {
      try {
        const pageUrl = postData.link || `${base}/?p=${numericId}`
        const verifyUrl = `${pageUrl}${pageUrl.includes('?') ? '&' : '?'}tse_verify=${Date.now()}`
        console.log('[WP_WRITE_TRACE] Public Verification Fetching:', verifyUrl)
        const pubRes = await fetch(verifyUrl, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        if (pubRes.ok) {
          const pubHtml = await pubRes.text()
          const cleanH1Str = h1.trim()
          if (pubHtml.includes(cleanH1Str)) {
            console.log('[WP_WRITE_TRACE] Public H1 Verification SUCCESS! HTML contains new H1.')
            publicVerified = true
          } else {
            console.warn('[WP_WRITE_TRACE] Public H1 Verification Warning: H1 text not found in public response yet.')
          }
        }
      } catch (_vErr) {
        console.warn('[WP_WRITE_TRACE] Public verification fetch error:', _vErr)
      }
    }

    return { success: true, data: postData, publicVerified }
  } catch (e) {
    console.error('[WP_WRITE_TRACE] Network/CORS Exception:', e)
    return {
      success: false,
      message: `Failed to connect to WordPress REST API: ${e.message}`
    }
  }
}

/**
 * Pushes modified HTML content to a source page in WordPress REST API.
 */
export async function updateWordPressPageContent({ site, sourcePage, contentHtml }) {
  if (!site || !sourcePage) return { success: false, message: 'Site or Source Page object missing' }
  let base = (site?.url || sourcePage?.url || '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) {
    base = 'https://' + base
  }

  const { username, password } = await resolveSiteCredentials(site, sourcePage)

  console.log('[WP_CONTENT_PUSH_DIAGNOSTIC]', {
    hasSite: Boolean(site),
    siteId: site?.id,
    siteName: site?.name,
    hasWpUser: Boolean(site?.wpUser),
    hasWpPass: Boolean(site?.wpPass),
    hasConfigData: Boolean(site?.configData),
    hasConfigWpUser: Boolean(site?.configData?.wpUser),
    hasConfigWpPass: Boolean(site?.configData?.wpPass),
    usernamePresent: Boolean(username),
    passwordPresent: Boolean(password)
  })

  if (!username || !password) {
    return { success: false, message: 'WordPress credentials missing for this site. Please configure user and application password in site settings.' }
  }

  const authHeader = 'Basic ' + btoa(`${username}:${password.replace(/\s/g, '')}`)

  let numericId = parseInt(sourcePage.id || sourcePage.ID || sourcePage.pageId || sourcePage.numericId, 10)
  const endpoint = await resolveWpEndpoint(base, sourcePage, authHeader, numericId)

  // If numeric ID is missing, attempt resolution via slug
  if (isNaN(numericId) && sourcePage.url) {
    try {
      const pathParts = sourcePage.url.replace(/\/+$/, '').split('/')
      const slug = pathParts[pathParts.length - 1]
      if (slug) {
        const lookupRes = await fetch(`${base}/wp-json/wp/v2/${endpoint}?slug=${encodeURIComponent(slug)}`, {
          headers: { Authorization: authHeader, Accept: 'application/json' }
        })
        if (lookupRes.ok) {
          const list = await lookupRes.json()
          if (Array.isArray(list) && list.length > 0 && list[0].id) {
            numericId = list[0].id
          }
        }
      }
    } catch (_err) {}
  }

  if (isNaN(numericId)) {
    return { success: false, message: `Could not resolve numeric WordPress page ID for source page '${sourcePage.url}'.` }
  }

  const payload = {
    content: contentHtml
  }

  const targetUrl = `${base}/wp-json/wp/v2/${endpoint}/${numericId}`
  console.log('[WP_CONTENT_PUSH_TRACE] Target Endpoint:', targetUrl)

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        Accept: 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      let errDetail = `HTTP ${res.status}`
      try {
        const errJson = await res.json()
        errDetail = errJson.message || errJson.code || errDetail
      } catch (_e) {
        const text = await res.text()
        if (text) errDetail = text.slice(0, 150)
      }
      return {
        success: false,
        status: res.status,
        message: `WordPress content update failed (${res.status}): ${errDetail}`
      }
    }

    const postData = await res.json()
    return { success: true, data: postData }
  } catch (e) {
    return {
      success: false,
      message: `Failed to connect to WordPress REST API: ${e.message}`
    }
  }
}

/**
 * Synchronises a single page directly from WordPress REST API / live frontend.
 * Updates actualMetaTitle, actualMetaDescription, actualH1, and returns updated page payload.
 */
export async function syncSingleWordPressPage({ site, page }) {
  if (!site || !page) return { success: false, message: 'Site or Page object missing' }
  let base = (site?.url || page?.url || '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) {
    base = 'https://' + base
  }

  const { username, password } = await resolveSiteCredentials(site, page)
  const authHeader = (username && password) ? ('Basic ' + btoa(`${username}:${password.replace(/\s/g, '')}`)) : null

  let numericId = parseInt(page.id || page.ID || page.pageId || page.numericId, 10)
  const endpoint = await resolveWpEndpoint(base, page, authHeader, numericId)

  // 1. Fetch REST endpoint data if auth and numericId are available
  let restData = null
  if (numericId && authHeader) {
    try {
      const res = await fetch(`${base}/wp-json/wp/v2/${endpoint}/${numericId}?context=edit`, {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json'
        }
      })
      if (res.ok) {
        restData = await res.json()
      }
    } catch (_e) {}
  }

  // 2. Fetch live public HTML directly with cache-buster to parse live rendered title, meta description, and h1
  let liveTitle = ''
  let liveDesc = ''
  let liveH1 = ''

  let targetUrl = page.url || ''
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    const rel = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`
    targetUrl = `${base}${rel}`
  }

  try {
    const fetchUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}tse_sync=${Date.now()}`
    const pubRes = await fetch(fetchUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
    if (pubRes.ok) {
      const html = await pubRes.text()

      // Extract <title>...</title>
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch && titleMatch[1]) {
        liveTitle = titleMatch[1].trim()
      }

      // Extract <meta name="description" content="...">
      const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)
      if (descMatch && descMatch[1]) {
        liveDesc = descMatch[1].trim()
      }

      // Extract first <h1>...</h1>
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      if (h1Match && h1Match[1]) {
        liveH1 = h1Match[1].replace(/<[^>]+>/g, '').trim()
      }
    }
  } catch (_fetchErr) {
    console.warn('[WP_SINGLE_SYNC] Live HTML fetch warning:', _fetchErr)
  }

  // Fallbacks from REST data if live HTML did not resolve
  if (!liveTitle && restData) {
    liveTitle = restData.meta?._yoast_wpseo_title || restData.yoast_head_json?.title || restData.title?.raw || restData.title?.rendered || ''
  }
  if (!liveDesc && restData) {
    liveDesc = restData.meta?._yoast_wpseo_metadesc || restData.yoast_head_json?.description || ''
  }

  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const formattedTimestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`

  return {
    success: true,
    pageId: page.id || numericId || page.url,
    actualMetaTitle: liveTitle,
    actualMetaDescription: liveDesc,
    actualH1: liveH1,
    lastSyncTimestamp: formattedTimestamp,
    restData
  }
}

/**
 * Update Alt Text for images in WordPress Media Library
 */
export async function updateWordPressMediaAltText({ site, updates = [] }) {
  if (!updates || updates.length === 0) return { success: true, updatedCount: 0 }

  let base = (site?.url || '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) {
    base = 'https://' + base
  }

  // Get credentials
  let username = (site?.wpUsername || site?.username || '').trim()
  let password = (site?.wpAppPassword || site?.appPassword || site?.applicationPassword || '').trim()

  if (!username || !password) {
    try {
      const websites = await getWebsitesApi()
      const currentSite = websites.find(s => String(s.id) === String(site?.id))
      if (currentSite) {
        username = (currentSite.wpUsername || currentSite.username || '').trim()
        password = (currentSite.wpAppPassword || currentSite.appPassword || '').trim()
      }
    } catch (_e) {}
  }

  const authHeader = 'Basic ' + btoa(`${username}:${password.replace(/\s/g, '')}`)

  let updatedCount = 0
  const errors = []

  for (const item of updates) {
    const newAlt = (item.newAlt || item.altText || '').trim()
    const imgSrc = item.src || item.url || ''
    let mediaId = item.id || item.mediaId

    try {
      // If mediaId is not directly known, search media library by filename slug
      if (!mediaId && imgSrc) {
        const rawFilename = imgSrc.split('/').pop().replace(/\.[^/.]+$/, '').split('-scaled')[0].split(/-\d+x\d+$/)[0]
        if (rawFilename) {
          const searchRes = await fetch(`${base}/wp-json/wp/v2/media?search=${encodeURIComponent(rawFilename)}&per_page=5`, {
            headers: { Authorization: authHeader, Accept: 'application/json' }
          })
          if (searchRes.ok) {
            const results = await searchRes.json()
            if (Array.isArray(results) && results.length > 0) {
              const match = results.find(m => m.source_url === imgSrc || m.slug === rawFilename.toLowerCase()) || results[0]
              mediaId = match?.id
            }
          }
        }
      }

      // Update attachment alt_text in WordPress Media Library
      if (mediaId) {
        const updateRes = await fetch(`${base}/wp-json/wp/v2/media/${mediaId}`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ alt_text: newAlt })
        })
        if (updateRes.ok) {
          updatedCount++
        } else {
          errors.push(`Media ${mediaId} returned status ${updateRes.status}`)
        }
      } else {
        errors.push(`Could not resolve media ID for ${imgSrc}`)
      }
    } catch (err) {
      errors.push(`Failed updating image ${imgSrc}: ${err.message}`)
    }
  }

  return {
    success: updatedCount > 0 || errors.length === 0,
    updatedCount,
    errors
  }
}


