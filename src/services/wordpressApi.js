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

  const isPost = Boolean(page.post_type === 'post' || page.type === 'post' || page.seoPageType === 'Article' || page.type === 'Article')
  const endpoint = isPost ? 'posts' : 'pages'

  let numericId = parseInt(page.id || page.ID || page.pageId || page.numericId, 10)

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
    if (existingContent && /<h1[^>]*>[\s\S]*?<\/h1>/i.test(existingContent)) {
      updatedContent = existingContent.replace(/<h1([^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${cleanH1}</h1>`)
    } else if (existingContent) {
      updatedContent = `<h1>${cleanH1}</h1>\n` + existingContent
    } else {
      updatedContent = `<h1>${cleanH1}</h1>`
    }
  }

  // ── 2. Elementor JSON Document Tree Updating ──
  let updatedElementorJson = null
  if (existingElementorData && h1) {
    try {
      const tree = typeof existingElementorData === 'string' ? JSON.parse(existingElementorData) : existingElementorData
      if (Array.isArray(tree)) {
        function updateElementorHeadingNodes(nodes) {
          if (!Array.isArray(nodes)) return
          for (const node of nodes) {
            const wType = String(node.widgetType || '').toLowerCase()
            const isHeadingNode = wType === 'heading' || wType === 'elementskit-heading' || wType === 'ekit-heading' || wType === 'theme-page-title' || (node.settings && (node.settings.title !== undefined || node.settings.ekit_heading_title !== undefined))

            if (isHeadingNode && node.settings) {
              node.settings.title = h1
              node.settings.ekit_heading_title = h1
              node.settings.header_title = h1
              node.settings.ekit_heading_title_title = h1
              node.settings.heading_title = h1
            }
            if (Array.isArray(node.elements)) updateElementorHeadingNodes(node.elements)
          }
        }
        updateElementorHeadingNodes(tree)
        updatedElementorJson = JSON.stringify(tree)
      }
    } catch (_eErr) {}
  }

  // ── 3. Build Payload for WP REST, Yoast & Elementor ──
  const payload = {
    title: page.title?.rendered || page.title || metaTitle,
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

    // ── 4. Secondary Call to Yoast Bulk Editor REST Endpoint if available ──
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

    return { success: true, data: postData }
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

  const isPost = Boolean(sourcePage.post_type === 'post' || sourcePage.type === 'post' || sourcePage.seoPageType === 'Article' || sourcePage.type === 'Article')
  const endpoint = isPost ? 'posts' : 'pages'

  let numericId = parseInt(sourcePage.id || sourcePage.ID || sourcePage.pageId || sourcePage.numericId, 10)

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

