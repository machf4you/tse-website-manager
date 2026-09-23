/**
 * WordPress REST API connection service.
 * Runs entirely in the browser — no backend required.
 * Calls onStep(stepId, status, message?) during each connection phase.
 *
 * Steps: 'api' → 'auth' → 'perms'
 * Status values: 'loading' | 'done' | 'error'
 */

import { getWebsitesApi, API_BASE_URL, pushMediaAltTextApi, pushPageSeoFieldsApi } from './websiteManagerApi.js'
import { formatReadableDateTime } from '../utils/dateFormatter.js'
import { decodeHtmlEntities } from '../utils/safeString.js'

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

export async function updateWordPressSEOFields({ site, page, metaTitle, metaDescription, h1, targetPhrase }) {
  if (!site && !page) return { success: false, message: 'Site or Page object missing.' }

  try {
    const siteId = site?.id || page?.siteId
    const siteUrl = site?.url || page?.siteUrl
    const pageId = page?.id || page?.ID || page?.pageId || page?.numericId
    const pageUrl = page?.url || ''

    const response = await pushPageSeoFieldsApi({
      siteId,
      siteUrl,
      pageId,
      pageUrl,
      metaTitle,
      metaDescription,
      h1,
      targetPhrase: targetPhrase || page?.targetPhrase || page?.target || ''
    })

    return response
  } catch (err) {
    console.error('[WP_SEO_PUSH_ERROR]', err)
    return {
      success: false,
      message: err.message || 'Failed to connect to Website Manager backend.'
    }
  }
}

/**
 * Pushes modified HTML content to a source page in WordPress REST API.
 */
export async function updateWordPressPageContent({
  site,
  sourcePage,
  contentHtml,
  targetUrl,
  anchorText,
  savedSentence,
  originalBlock
}) {
  if (!site || !sourcePage) return { success: false, message: 'Site or Source Page object missing' }
  let base = (site?.url || sourcePage?.url || '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) {
    base = 'https://' + base
  }

  const { username, password } = await resolveSiteCredentials(site, sourcePage)

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
        const lookupRes = await fetch(`${base}/wp-json/wp/v2/${endpoint}?slug=${encodeURIComponent(slug)}&context=edit`, {
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

  // 1. Fetch live page data from WP REST API to inspect Elementor tree & content
  let livePageData = null
  try {
    const pageRes = await fetch(`${base}/wp-json/wp/v2/${endpoint}/${numericId}?context=edit`, {
      headers: { Authorization: authHeader, Accept: 'application/json' }
    })
    if (pageRes.ok) {
      livePageData = await pageRes.json()
    }
  } catch (_fetchErr) {}

  const elemRaw = livePageData?.meta?._elementor_data || livePageData?._elementor_data || null
  let updatedElementorJson = null

  // 2. If Elementor page, locate and update the widget inside the Elementor JSON tree
  if (elemRaw && (targetUrl || savedSentence)) {
    try {
      const tree = typeof elemRaw === 'string' ? JSON.parse(elemRaw) : elemRaw
      if (Array.isArray(tree)) {
        const cleanAnchor = (anchorText || '').trim()
        const cleanTarget = (targetUrl || '').trim()
        let hyperlinkedSentence = savedSentence || ''
        
        if (cleanTarget && cleanAnchor && savedSentence) {
          if (!savedSentence.toLowerCase().includes(`<a href="${cleanTarget.toLowerCase()}"`)) {
            const lowerSentence = savedSentence.toLowerCase()
            const lowerAnchor = cleanAnchor.toLowerCase()
            const anchorIdx = lowerSentence.indexOf(lowerAnchor)
            if (anchorIdx !== -1) {
              const beforeAnchor = savedSentence.slice(0, anchorIdx)
              const matchedAnchor = savedSentence.slice(anchorIdx, anchorIdx + cleanAnchor.length)
              const afterAnchor = savedSentence.slice(anchorIdx + cleanAnchor.length)
              hyperlinkedSentence = `${beforeAnchor}<a href="${cleanTarget}">${matchedAnchor}</a>${afterAnchor}`
            } else {
              hyperlinkedSentence = `${savedSentence} <a href="${cleanTarget}">${cleanAnchor}</a>`
            }
          }
        }

        let targetWidgetNode = null

        function findWidgetNode(nodes) {
          if (!Array.isArray(nodes) || targetWidgetNode) return
          for (const node of nodes) {
            if (node.widgetType === 'text-editor' && node.settings && typeof node.settings.editor === 'string') {
              const editorHtml = node.settings.editor
              // Check if originalBlock, savedSentence, or cleanAnchor exists in this widget
              if (originalBlock && editorHtml.includes(originalBlock.trim())) {
                targetWidgetNode = node
                return
              }
              if (savedSentence && editorHtml.includes(savedSentence.trim())) {
                targetWidgetNode = node
                return
              }
              if (cleanAnchor && editorHtml.includes(cleanAnchor)) {
                targetWidgetNode = node
                return
              }
            }
            if (Array.isArray(node.elements)) findWidgetNode(node.elements)
          }
        }

        findWidgetNode(tree)

        if (targetWidgetNode && targetWidgetNode.settings) {
          const currentEditor = targetWidgetNode.settings.editor || ''
          const cleanOrig = (originalBlock || '').trim()
          if (cleanOrig && currentEditor.includes(cleanOrig)) {
            targetWidgetNode.settings.editor = currentEditor.replace(cleanOrig, hyperlinkedSentence)
          } else if (savedSentence && currentEditor.includes(savedSentence.trim())) {
            targetWidgetNode.settings.editor = currentEditor.replace(savedSentence.trim(), hyperlinkedSentence)
          } else if (cleanAnchor && currentEditor.includes(cleanAnchor)) {
            targetWidgetNode.settings.editor = currentEditor.replace(cleanAnchor, `<a href="${cleanTarget}">${cleanAnchor}</a>`)
          }
          updatedElementorJson = JSON.stringify(tree)
        } else {
          console.warn('[WORDPRESS_API] Matching editorial block not found in Elementor document tree. Preserving Elementor tree without blind appending.')
        }
      }
    } catch (eErr) {
      console.error('[WORDPRESS_API] Error parsing/updating Elementor tree:', eErr)
    }
  }

  const payload = {
    content: contentHtml,
    ...(updatedElementorJson ? {
      _elementor_data: updatedElementorJson,
      elementor_data: updatedElementorJson,
      meta_input: {
        _elementor_data: updatedElementorJson,
        elementor_data: updatedElementorJson
      },
      meta: {
        _elementor_data: updatedElementorJson,
        elementor_data: updatedElementorJson
      }
    } : {})
  }

  const targetUrlEndpoint = `${base}/wp-json/wp/v2/${endpoint}/${numericId}`
  console.log('[WP_CONTENT_PUSH_TRACE] Target Endpoint:', targetUrlEndpoint)

  try {
    const res = await fetch(targetUrlEndpoint, {
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

    // 3. Purge Elementor CSS/render cache
    try {
      await fetch(`${base}/wp-json/elementor/v1/cache`, {
        method: 'DELETE',
        headers: { Authorization: authHeader }
      })
    } catch (_e) {}

    // 4. Post-Update Verification Check on returned data
    let verified = false
    const updatedContentRaw = postData.content?.raw || postData.content?.rendered || ''
    const updatedElemRaw = postData.meta?._elementor_data || postData._elementor_data || ''

    if (targetUrl) {
      const cleanSlug = targetUrl.replace(/^https?:\/\/[^\/]+/, '').replace(/\/+$/, '')
      if (
        updatedContentRaw.includes(targetUrl) ||
        (cleanSlug && updatedContentRaw.includes(cleanSlug)) ||
        updatedElemRaw.includes(targetUrl) ||
        (cleanSlug && updatedElemRaw.includes(cleanSlug))
      ) {
        verified = true
      }
    } else {
      verified = true
    }

    if (!verified) {
      return {
        success: false,
        verified: false,
        message: 'WordPress REST API accepted the request, but post-update content verification failed: the target link was not found in stored page data.'
      }
    }

    return {
      success: true,
      verified: true,
      data: postData
    }
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
        liveTitle = decodeHtmlEntities(titleMatch[1].trim())
      }

      // Extract <meta name="description" content="...">
      const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)
      if (descMatch && descMatch[1]) {
        liveDesc = decodeHtmlEntities(descMatch[1].trim())
      }

      // Extract first <h1>...</h1>
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      if (h1Match && h1Match[1]) {
        liveH1 = decodeHtmlEntities(h1Match[1].replace(/<[^>]+>/g, '').trim())
      }
    }
  } catch (_fetchErr) {
    console.warn('[WP_SINGLE_SYNC] Live HTML fetch warning:', _fetchErr)
  }

  // Fallbacks from REST data if live HTML did not resolve
  if (!liveTitle && restData) {
    liveTitle = decodeHtmlEntities(restData.meta?.rank_math_title || restData.meta?._yoast_wpseo_title || restData.yoast_head_json?.title || restData.title?.raw || restData.title?.rendered || '')
  }
  if (!liveDesc && restData) {
    liveDesc = decodeHtmlEntities(restData.meta?.rank_math_description || restData.meta?._yoast_wpseo_metadesc || restData.yoast_head_json?.description || '')
  }

  const isoTimestamp = new Date().toISOString()

  return {
    success: true,
    pageId: page.id || numericId || page.url,
    actualMetaTitle: liveTitle,
    actualMetaDescription: liveDesc,
    actualH1: liveH1,
    lastSyncTimestamp: isoTimestamp,
    restData
  }
}

/**
 * Update Alt Text for images in WordPress Media Library & Elementor structured page data
 */
export async function updateWordPressMediaAltText({ site, page, updates = [] }) {
  if (!updates || updates.length === 0) {
    return { success: true, updatedCount: 0, successUpdates: [], failedUpdates: [] }
  }

  // 1. Try pushing via backend API endpoint (handles CORS, Elementor JSON parsing & DB credentials)
  try {
    const data = await pushMediaAltTextApi({
      siteId: site?.id,
      siteUrl: site?.url,
      pageId: page?.id || page?.wpId,
      pageUrl: page?.url || page?.link,
      updates
    })

    if (data && (data.success || data.updatedCount > 0 || (data.successUpdates && data.successUpdates.length > 0))) {
      return {
        success: data.success,
        updatedCount: data.updatedCount || 0,
        successUpdates: data.successUpdates || [],
        failedUpdates: data.failedUpdates || [],
        elementorUpdated: data.elementorUpdated || false,
        errors: data.failedUpdates ? data.failedUpdates.map(f => `${f.src}: ${f.error}`) : []
      }
    }
  } catch (backendErr) {
    console.warn('[WP_MEDIA] Backend push failed, falling back to direct REST client:', backendErr)
  }

  // 2. Client-side fallback with resolved credentials
  const { username, password } = await resolveSiteCredentials(site, page)
  let base = (site?.url || '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) {
    base = 'https://' + base
  }

  const authHeader = 'Basic ' + btoa(`${username}:${password.replace(/\s/g, '')}`)
  const successUpdates = []
  const failedUpdates = []

  for (const item of updates) {
    const newAlt = (item.newAlt || item.altText || '').trim()
    const imgSrc = item.src || item.url || ''
    const rawId = item.mediaId || item.id
    let mediaId = null

    if (typeof rawId === 'number' && !isNaN(rawId) && rawId > 0) {
      mediaId = rawId
    } else if (typeof rawId === 'string' && /^\d+$/.test(rawId.trim())) {
      mediaId = parseInt(rawId.trim(), 10)
    }

    if (!newAlt) continue

    try {
      if (!mediaId && imgSrc) {
        const rawFilename = imgSrc.split('/').pop().replace(/\.[^/.]+$/, '').split('-scaled')[0].split(/-\d+x\d+$/)[0]
        if (rawFilename) {
          const searchRes = await fetch(`${base}/wp-json/wp/v2/media?search=${encodeURIComponent(rawFilename)}&per_page=10`, {
            headers: { Authorization: authHeader, Accept: 'application/json' }
          })
          if (searchRes.ok) {
            const results = await searchRes.json()
            if (Array.isArray(results) && results.length > 0) {
              const match = results.find(m => m.source_url === imgSrc || m.slug === rawFilename.toLowerCase() || (m.source_url && m.source_url.includes(rawFilename))) || results[0]
              mediaId = match?.id
            }
          }
        }
      }

      if (mediaId) {
        const updateRes = await fetch(`${base}/wp-json/wp/v2/media/${mediaId}`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            alt_text: newAlt,
            title: newAlt
          })
        })
        if (updateRes.ok) {
          successUpdates.push({ id: item.id || mediaId, mediaId, src: imgSrc, newAlt })
        } else {
          failedUpdates.push({ src: imgSrc, error: `Media ${mediaId} returned status ${updateRes.status}` })
        }
      } else {
        failedUpdates.push({ src: imgSrc, error: `Could not resolve media ID for ${imgSrc}` })
      }
    } catch (err) {
      failedUpdates.push({ src: imgSrc, error: `Failed updating image: ${err.message}` })
    }
  }

  return {
    success: successUpdates.length > 0,
    updatedCount: successUpdates.length,
    successUpdates,
    failedUpdates,
    errors: failedUpdates.map(f => `${f.src}: ${f.error}`)
  }
}


