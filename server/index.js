import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import db, { getAllWebsitesFromDb, getWebsiteByIdFromDb } from './db.js'
import { DEFAULT_EXCLUSION_RULES, normalizeUrlForExclusionCheck, testExclusionRule } from '../src/utils/urlExclusions.js'
import { suggestArticleOpportunity, suggestArticleOpportunityForSite, generateOnsiteArticle, parseArticleOutput, resolveAiApiKey } from './aiOnsiteArticleGenerator.js'
import { generateArticleDocxBuffer } from './docxGenerator.js'
import { getAllRestorePoints, registerNewRestorePoint } from './restorePointManager.js'
import { batchRunner, getFullEstateEligibility } from './firstAuditBatchRunner.js'
import { pushPageSeoFields } from './wordpressSeoPusher.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3005

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Deployment Status Endpoints
let inMemoryDeploymentStatus = {
  version: '2.42',
  buildHash: 'wm-init',
  buildTimestamp: Date.now(),
  isDeploymentInProgress: false,
  lastDeployedAt: new Date().toISOString()
}

// Health check endpoints
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'website-manager-api' }))
app.get('/api/page-auditor-health', (req, res) => res.json({ status: 'ok', service: 'page-auditor-proxy' }))

app.get('/api/deployment/status', (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  })
  try {
    const distVersionPath = path.join(__dirname, '..', 'dist', 'version.json')
    if (fs.existsSync(distVersionPath)) {
      const fileData = JSON.parse(fs.readFileSync(distVersionPath, 'utf-8'))
      const row = db.prepare(`SELECT value_json FROM global_settings WHERE key = 'deployment_status'`).get()
      const dbData = (row && row.value_json) ? JSON.parse(row.value_json) : {}
      return res.json({
        status: 'ok',
        version: fileData.version || dbData.version || '2.42',
        buildHash: fileData.buildHash || dbData.buildHash || 'wm-default',
        buildTimestamp: fileData.buildTimestamp || dbData.buildTimestamp || Date.now(),
        isDeploymentInProgress: dbData.isDeploymentInProgress || false,
        building: dbData.building || '',
        lastDeployedAt: fileData.lastDeployedAt || dbData.lastDeployedAt || new Date().toISOString()
      })
    }

    const row = db.prepare(`SELECT value_json FROM global_settings WHERE key = 'deployment_status'`).get()
    if (row && row.value_json) {
      const parsed = JSON.parse(row.value_json)
      return res.json({ status: 'ok', ...parsed })
    }
  } catch (e) {}
  res.json({ status: 'ok', ...inMemoryDeploymentStatus })
})

app.post('/api/deployment/status', (req, res) => {
  try {
    const payload = req.body || {}
    inMemoryDeploymentStatus = {
      ...inMemoryDeploymentStatus,
      ...payload,
      updatedAt: new Date().toISOString()
    }
    const stmt = db.prepare(`
      INSERT INTO global_settings (key, value_json, updated_at)
      VALUES ('deployment_status', @value_json, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP
    `)
    stmt.run({ value_json: JSON.stringify(inMemoryDeploymentStatus) })
    res.json({ status: 'ok', deploymentStatus: inMemoryDeploymentStatus })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Restore Points API (Dynamic & Authoritative) ──
app.get('/api/restore-points', (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  })
  try {
    const points = getAllRestorePoints()
    res.json({ success: true, restorePoints: points })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

app.post('/api/restore-points/register', (req, res) => {
  try {
    const entry = req.body || {}
    const result = registerNewRestorePoint(entry)
    res.json({ success: true, item: result })
  } catch (e) {
    res.status(400).json({ success: false, error: e.message })
  }
})

// Extract genuine content images server-side (excludes logos, badges, background sliders, and third-party placeholders)
app.get('/api/images/extract', async (req, res) => {
  try {
    const targetUrl = (req.query.url || '').trim()
    if (!targetUrl) {
      return res.status(400).json({ success: false, error: 'URL parameter is required' })
    }

    const fetchRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'TSE-Website-Manager/2.52',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000)
    })

    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({ success: false, error: `Failed to fetch URL (${fetchRes.status})` })
    }

    const html = await fetchRes.text()

    const isExcluded = (src, alt, rawAttrs) => {
      const lowerSrc = (src || '').toLowerCase()
      const lowerAlt = (alt || '').toLowerCase()
      const lowerAttrs = (rawAttrs || '').toLowerCase()

      // Third party assets & placeholders
      if (/i\.ytimg\.com|youtube\.com|wp-rocket|plugins\/|gravatar\.com|svg\+xml/.test(lowerSrc)) return true

      // Logos (header, footer, mobile, branding)
      if (/logo|site-logo|brand-logo|custom-logo/.test(lowerSrc) || /logo/.test(lowerAlt) || /custom-logo|site-branding/.test(lowerAttrs)) return true

      // Trust badges & certifications
      if (/checkatrade|trustmark|master-builder|master-tradesman|google\.webp|accreditation|badge|client-logo/.test(lowerSrc) ||
          /checkatrade|trustmark|master builder|master tradesman|fmb|accreditation/.test(lowerAlt)) {
        return true
      }

      return false
    }

    const images = []
    const seen = new Set()

    // 1. Standard <img> elements
    const imgRegex = /<img\b([^>]+)>/gi
    let match
    while ((match = imgRegex.exec(html)) !== null) {
      const attrs = match[1]
      const srcMatch = attrs.match(/\b(?:data-lazy-src|data-src|src)=["']([^"']+)["']/i)
      if (!srcMatch || !srcMatch[1]) continue
      const src = srcMatch[1].trim()
      if (!src || src.startsWith('data:')) continue

      let absUrl = src
      try {
        absUrl = new URL(src, targetUrl).href
      } catch (e) {}

      if (seen.has(absUrl)) continue

      const altMatch = attrs.match(/\balt=["']([^"']*)["']/i)
      const alt = altMatch ? altMatch[1].trim() : ''

      if (isExcluded(absUrl, alt, attrs)) continue

      // Extract numeric WordPress Media ID directly from wp-image-(ID) class
      const wpImageMatch = attrs.match(/\bwp-image-(\d+)\b/i) || attrs.match(/\bclass=["'][^"']*wp-image-(\d+)[^"']*["']/i)
      const mediaId = wpImageMatch ? parseInt(wpImageMatch[1], 10) : null

      seen.add(absUrl)
      images.push({ id: mediaId ? String(mediaId) : undefined, mediaId, src: absUrl, alt, source: 'img' })
    }

    // 2. Elementor Gallery items (.e-gallery-image[data-thumbnail])
    const galRegex = /<div\b([^>]*class=["'][^"']*e-gallery-image[^"']*["'][^>]*)>/gi
    while ((match = galRegex.exec(html)) !== null) {
      const attrs = match[1]
      const thumbMatch = attrs.match(/\bdata-thumbnail=["']([^"']+)["']/i)
      if (!thumbMatch || !thumbMatch[1]) continue
      const src = thumbMatch[1].trim()
      if (!src || src.startsWith('data:')) continue

      let absUrl = src
      try {
        absUrl = new URL(src, targetUrl).href
      } catch (e) {}

      if (seen.has(absUrl)) continue

      const ariaMatch = attrs.match(/\baria-label=["']([^"']*)["']/i)
      const alt = ariaMatch ? ariaMatch[1].trim() : ''

      if (isExcluded(absUrl, alt, attrs)) continue

      const attachMatch = attrs.match(/\bdata-attachment-id=["'](\d+)["']/i) || attrs.match(/\bwp-image-(\d+)\b/i)
      const mediaId = attachMatch ? parseInt(attachMatch[1], 10) : null

      seen.add(absUrl)
      images.push({ id: mediaId ? String(mediaId) : undefined, mediaId, src: absUrl, alt, source: 'gallery' })
    }

    res.json({ success: true, count: images.length, images })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Dual-update Alt Text Push Pipeline: Updates WordPress Media Attachments & Structured Elementor Page Data
app.post('/api/wordpress/media/alt-text', async (req, res) => {
  try {
    const { siteId, siteUrl, pageId, pageUrl, updates = [] } = req.body || {}
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.json({ success: true, updatedCount: 0, successUpdates: [], failedUpdates: [] })
    }

    // 1. Resolve site & credentials from DB
    let targetSite = siteId ? getWebsiteByIdFromDb(siteId) : null
    if (!targetSite) {
      const allSites = getAllWebsitesFromDb()
      for (const s of allSites) {
        const sUrl = (s.url || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
        const cleanUrl = (siteUrl || pageUrl || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
        if (cleanUrl && sUrl && (sUrl === cleanUrl || sUrl.includes(cleanUrl) || cleanUrl.includes(sUrl))) {
          targetSite = s
          break
        }
      }
      if (!targetSite && allSites.length > 0) {
        targetSite = allSites[0]
      }
    }

    const config = targetSite?.config_data ? JSON.parse(targetSite.config_data) : {}
    const wpUser = config.wpUser || targetSite?.wpUser || targetSite?.connectedUser || ''
    const wpPass = config.wpPass || targetSite?.wpPass || ''

    if (!wpUser || !wpPass) {
      return res.status(400).json({ success: false, error: 'WordPress credentials not found for this site in database.' })
    }

    const base = (targetSite?.url || siteUrl || '').replace(/\/+$/, '')
    const authHeader = 'Basic ' + Buffer.from(`${wpUser}:${wpPass.replace(/\s/g, '')}`).toString('base64')

    const successUpdates = []
    const failedUpdates = []

    // 2. Update Media Attachments
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
        // Resolve mediaId if missing by strict exact filename matching
        if (!mediaId && imgSrc) {
          const parsedUrl = new URL(imgSrc, 'https://dummy.local')
          const fullFilename = parsedUrl.pathname.split('/').pop() || ''
          const baseSlug = fullFilename.replace(/\.[^/.]+$/, '').split('-scaled')[0].split(/-\d+x\d+$/)[0]

          if (baseSlug) {
            const sRes = await fetch(`${base}/wp-json/wp/v2/media?search=${encodeURIComponent(baseSlug)}&per_page=20`, {
              headers: { Authorization: authHeader, Accept: 'application/json' }
            })
            if (sRes.ok) {
              const sData = await sRes.json()
              if (Array.isArray(sData) && sData.length > 0) {
                // Strict exact match: exact source_url, exact filename with extension, or exact base slug
                const exactMatch = sData.find(m => {
                  if (!m.source_url) return false
                  const mFilename = m.source_url.split('/').pop() || ''
                  const mClean = mFilename.replace(/\.[^/.]+$/, '').split('-scaled')[0].split(/-\d+x\d+$/)[0]
                  return m.source_url === imgSrc || mFilename.toLowerCase() === fullFilename.toLowerCase() || mClean.toLowerCase() === baseSlug.toLowerCase()
                })
                mediaId = exactMatch?.id || null
              }
            }
          }
        }

        if (mediaId) {
          const mRes = await fetch(`${base}/wp-json/wp/v2/media/${mediaId}`, {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({
              alt_text: newAlt,
              title: newAlt
            })
          })

          if (mRes.ok) {
            successUpdates.push({ id: item.id || mediaId, mediaId, src: imgSrc, newAlt })
          } else {
            const errText = await mRes.text()
            failedUpdates.push({ src: imgSrc, error: `WordPress Media API returned ${mRes.status}: ${errText.slice(0, 100)}` })
          }
        } else {
          failedUpdates.push({ src: imgSrc, error: 'Could not resolve WordPress Media ID' })
        }
      } catch (err) {
        failedUpdates.push({ src: imgSrc, error: err.message })
      }
    }

    // 3. Update Structured Elementor Page Data if applicable
    let elementorUpdated = false
    let resolvedPageId = pageId
    if (!resolvedPageId && pageUrl) {
      const pSlug = pageUrl.replace(/\/+$/, '').split('/').pop()
      if (pSlug) {
        try {
          const pLookup = await fetch(`${base}/wp-json/wp/v2/pages?slug=${encodeURIComponent(pSlug)}&context=edit`, {
            headers: { Authorization: authHeader, Accept: 'application/json' }
          })
          if (pLookup.ok) {
            const pList = await pLookup.json()
            if (Array.isArray(pList) && pList.length > 0 && pList[0].id) {
              resolvedPageId = pList[0].id
            }
          }
        } catch (_e) {}
      }
    }

    if (resolvedPageId && successUpdates.length > 0) {
      try {
        const pageRes = await fetch(`${base}/wp-json/wp/v2/pages/${resolvedPageId}?context=edit`, {
          headers: { Authorization: authHeader, Accept: 'application/json' }
        })
        if (pageRes.ok) {
          const pageData = await pageRes.json()
          const elemRaw = pageData.meta?._elementor_data || pageData._elementor_data
          let contentRaw = pageData.content?.raw || pageData.content?.rendered || ''
          let tree = null
          let modified = false

          if (elemRaw) {
            tree = typeof elemRaw === 'string' ? JSON.parse(elemRaw) : elemRaw

            function updateTreeImages(nodes) {
              if (!Array.isArray(nodes)) return
              for (const node of nodes) {
                if (typeof node === 'object' && node !== null) {
                  const st = node.settings || {}
                  // Gallery widgets
                  if (Array.isArray(st.gallery)) {
                    for (const gItem of st.gallery) {
                      const match = successUpdates.find(u => u.mediaId === gItem.id || (gItem.url && gItem.url.includes(u.src.split('/').pop())))
                      if (match) {
                        gItem.alt = match.newAlt
                        gItem.title = match.newAlt
                        modified = true
                      }
                    }
                  }
                  // Standalone image widgets
                  if (st.image && typeof st.image === 'object') {
                    const match = successUpdates.find(u => u.mediaId === st.image.id || (st.image.url && st.image.url.includes(u.src.split('/').pop())))
                    if (match) {
                      st.image.alt = match.newAlt
                      modified = true
                    }
                  }
                  if (Array.isArray(node.elements)) {
                    updateTreeImages(node.elements)
                  }
                }
              }
            }

            updateTreeImages(tree)
          }

          // Also update static HTML in post_content for live visitor rendering
          if (contentRaw) {
            for (const item of successUpdates) {
              const filename = item.src.split('/').pop()
              const cleanFilename = filename.split('-scaled')[0].split(/-\d+x\d+$/)[0]
              const targetAlt = item.newAlt

              // 1. Replace aria-label in e-gallery-image divs
              contentRaw = contentRaw.replace(new RegExp(`(<div[^>]*class="[^"]*e-gallery-image[^"]*"[^>]*data-thumbnail="[^"]*(${cleanFilename}|${filename})[^"]*"[^>]*>)`, 'gi'), (tag) => {
                if (/aria-label="[^"]*"/i.test(tag)) {
                  return tag.replace(/aria-label="[^"]*"/i, `aria-label="${targetAlt}"`)
                }
                return tag.replace(/data-thumbnail=/i, `aria-label="${targetAlt}" data-thumbnail=`)
              })

              // 2. Replace lightbox title in <a> tags
              contentRaw = contentRaw.replace(new RegExp(`(<a[^>]*data-elementor-lightbox-title="[^"]*"[^>]*(${cleanFilename}|${filename})[^"]*>)`, 'gi'), (tag) => {
                return tag.replace(/data-elementor-lightbox-title="[^"]*"/i, `data-elementor-lightbox-title="${targetAlt}"`)
              })

              // 3. Replace alt in <img> tags
              contentRaw = contentRaw.replace(new RegExp(`(<img[^>]*(${cleanFilename}|${filename})[^>]*>)`, 'gi'), (tag) => {
                if (/alt="[^"]*"/i.test(tag)) {
                  return tag.replace(/alt="[^"]*"/i, `alt="${targetAlt}"`)
                }
                return tag.replace(/<img\s+/i, `<img alt="${targetAlt}" `)
              })
            }
          }

          // Save page with both updated post_content and updated _elementor_data
          const pageSavePayload = { content: contentRaw }
          if (tree && modified) {
            pageSavePayload.meta = { _elementor_data: JSON.stringify(tree) }
          }

          const saveRes = await fetch(`${base}/wp-json/wp/v2/pages/${resolvedPageId}`, {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify(pageSavePayload)
          })

          if (saveRes.ok) {
            elementorUpdated = true
          }

          // Purge Elementor CSS/render cache so changes immediately show on live frontend
          try {
            await fetch(`${base}/wp-json/elementor/v1/cache`, {
              method: 'DELETE',
              headers: { Authorization: authHeader }
            })
          } catch (_cErr) {}
        }
      } catch (elemErr) {
        console.warn('[WM_API] Elementor structured update error:', elemErr)
      }
    }

    res.json({
      success: successUpdates.length > 0,
      updatedCount: successUpdates.length,
      successUpdates,
      failedUpdates,
      elementorUpdated
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// W4 Server-Side Page SEO Fields Push Endpoint
app.post(['/api/wordpress/pages/seo-fields', '/api/wordpress/update-seo-fields'], async (req, res) => {
  try {
    const { siteId, siteUrl, pageId, pageUrl, metaTitle, metaDescription, h1, targetPhrase } = req.body || {}
    if (!siteId && !siteUrl && !pageUrl) {
      return res.status(400).json({ success: false, message: 'siteId, siteUrl or pageUrl is required.' })
    }

    const result = await pushPageSeoFields({
      siteId,
      siteUrl,
      pageId,
      pageUrl,
      metaTitle,
      metaDescription,
      h1,
      targetPhrase
    })

    if (!result.success) {
      return res.status(200).json(result)
    }

    res.json(result)
  } catch (err) {
    console.error('[SERVER_WP_SEO_ERROR]', err)
    res.status(500).json({ success: false, message: `Server error executing WordPress push: ${err.message}` })
  }
})

// ==========================================
// 1. CONNECTED WEBSITES ENDPOINTS
// ==========================================

// Get all connected websites
app.get('/api/websites', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT w.*,
        (SELECT COUNT(*) FROM page_configurations pc WHERE pc.site_id = w.id AND pc.is_excluded = 0 AND (pc.target_phrase IS NOT NULL AND pc.target_phrase != '')) AS configured_count
      FROM websites w
      ORDER BY w.created_at DESC
    `).all()

    const websites = rows.map(r => {
      let pageCount = r.total_pages || 0
      if (!pageCount) {
        try {
          const pkgRow = db.prepare(`SELECT package_data FROM wp_packages WHERE site_id = ?`).get(r.id)
          if (pkgRow && pkgRow.package_data) {
            const raw = JSON.parse(pkgRow.package_data)
            const pkg = raw.packageData || raw.data || raw
            const pages = Array.isArray(pkg.pages) ? pkg.pages.length : (Array.isArray(pkg['pages.json']) ? pkg['pages.json'].length : 0)
            const posts = Array.isArray(pkg.posts) ? pkg.posts.length : (Array.isArray(pkg['posts.json']) ? pkg['posts.json'].length : 0)
            const projects = Array.isArray(pkg.projects) ? pkg.projects.length : 0
            pageCount = pages || (pages + posts + projects)
            if (pageCount > 0) {
              db.prepare(`UPDATE websites SET total_pages = ? WHERE id = ?`).run(pageCount, r.id)
            }
          }
        } catch (_e) {}
      }

      const regStatus = (r.registry_status || 'active').toLowerCase()

      return {
        ...r,
        domainId: r.domain_id || null,
        registryStatus: regStatus,
        registry_status: regStatus,
        syncStatus: r.sync_status || r.syncStatus || 'Synced',
        lastSyncTimestamp: r.last_sync_timestamp || r.lastSyncTimestamp || null,
        totalPages: pageCount,
        total_pages: pageCount,
        configuredCount: r.configured_count || 0,
        configured_count: r.configured_count || 0,
        isAudited: Boolean(r.is_audited),
        lastAuditTimestamp: r.last_audit_timestamp,
        configData: r.config_data ? JSON.parse(r.config_data) : null
      }
    })
    res.json(websites)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Save / update connected website record
app.post('/api/websites', (req, res) => {
  try {
    const site = req.body
    if (!site || !site.id) {
      return res.status(400).json({ error: 'Site ID is required' })
    }

    const now = new Date().toISOString()
    const stmt = db.prepare(`
      INSERT INTO websites (
        id, domain_id, name, url, platform, portfolio, status, registry_status, is_audited, last_audit_timestamp, sync_status, last_sync_timestamp, total_pages, config_data, created_at, updated_at
      ) VALUES (
        @id, @domain_id, @name, @url, @platform, @portfolio, @status, @registry_status, @is_audited, @last_audit_timestamp, @sync_status, @last_sync_timestamp, @total_pages, @config_data, @created_at, @updated_at
      )
      ON CONFLICT(id) DO UPDATE SET
        domain_id = COALESCE(excluded.domain_id, websites.domain_id),
        name = excluded.name,
        url = excluded.url,
        platform = excluded.platform,
        portfolio = excluded.portfolio,
        status = excluded.status,
        registry_status = COALESCE(excluded.registry_status, websites.registry_status),
        is_audited = excluded.is_audited,
        last_audit_timestamp = excluded.last_audit_timestamp,
        sync_status = excluded.sync_status,
        last_sync_timestamp = excluded.last_sync_timestamp,
        total_pages = CASE
          WHEN excluded.total_pages > 0 THEN excluded.total_pages
          ELSE websites.total_pages
        END,
        config_data = CASE
          WHEN excluded.config_data IS NOT NULL AND excluded.config_data != '' AND excluded.config_data != '{"wpUser":"","wpPass":""}' THEN excluded.config_data
          ELSE websites.config_data
        END,
        updated_at = excluded.updated_at
    `)

    const statusVal = typeof site.status === 'object' ? JSON.stringify(site.status) : (site.status || 'Active')
    const totalPagesVal = Number(site.totalPages || site.total_pages || 0)
    const registryStatusVal = (site.registry_status || site.registryStatus || 'active').toLowerCase()

    stmt.run({
      id: String(site.id),
      domain_id: site.domain_id || site.domainId || null,
      name: site.name || 'Untitled Website',
      url: site.url || '',
      platform: site.platform || 'WordPress',
      portfolio: site.portfolio || 'Primary Portfolio',
      status: statusVal,
      registry_status: registryStatusVal,
      is_audited: site.isAudited ? 1 : 0,
      last_audit_timestamp: site.lastAuditTimestamp || null,
      sync_status: site.syncStatus || 'Synced',
      last_sync_timestamp: site.lastSyncTimestamp || null,
      total_pages: totalPagesVal,
      config_data: site.configData ? JSON.stringify(site.configData) : null,
      created_at: site.createdAt || now,
      updated_at: now
    })

    res.json({ success: true, id: site.id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Save list of websites in batch
app.post('/api/websites/batch', (req, res) => {
  try {
    const sites = req.body
    if (!Array.isArray(sites)) {
      return res.status(400).json({ error: 'Array of sites required' })
    }

    const now = new Date().toISOString()
    const stmt = db.prepare(`
      INSERT INTO websites (
        id, domain_id, name, url, platform, portfolio, status, is_audited, last_audit_timestamp, sync_status, last_sync_timestamp, config_data, created_at, updated_at
      ) VALUES (
        @id, @domain_id, @name, @url, @platform, @portfolio, @status, @is_audited, @last_audit_timestamp, @sync_status, @last_sync_timestamp, @config_data, @created_at, @updated_at
      )
      ON CONFLICT(id) DO UPDATE SET
        domain_id = COALESCE(excluded.domain_id, websites.domain_id),
        name = excluded.name,
        url = excluded.url,
        platform = excluded.platform,
        portfolio = excluded.portfolio,
        status = excluded.status,
        is_audited = excluded.is_audited,
        last_audit_timestamp = excluded.last_audit_timestamp,
        sync_status = excluded.sync_status,
        last_sync_timestamp = excluded.last_sync_timestamp,
        config_data = CASE
          WHEN excluded.config_data IS NOT NULL AND excluded.config_data != '' AND excluded.config_data != '{"wpUser":"","wpPass":""}' THEN excluded.config_data
          ELSE websites.config_data
        END,
        updated_at = excluded.updated_at
    `)

    const insertMany = db.transaction((list) => {
      for (const site of list) {
        const statusVal = typeof site.status === 'object' ? JSON.stringify(site.status) : (site.status || 'Active')
        stmt.run({
          id: String(site.id),
          domain_id: site.domain_id || site.domainId || null,
          name: site.name || 'Untitled Website',
          url: site.url || '',
          platform: site.platform || 'WordPress',
          portfolio: site.portfolio || 'Primary Portfolio',
          status: statusVal,
          is_audited: site.isAudited ? 1 : 0,
          last_audit_timestamp: site.lastAuditTimestamp || null,
          sync_status: site.syncStatus || 'Synced',
          last_sync_timestamp: site.lastSyncTimestamp || null,
          config_data: site.configData ? JSON.stringify(site.configData) : null,
          created_at: site.createdAt || now,
          updated_at: now
        })
      }
    })

    insertMany(sites)
    res.json({ success: true, count: sites.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Update website settings in config_data (site-specific options like articlesMode)
app.post('/api/websites/:id/settings', (req, res) => {
  try {
    const { id } = req.params
    const newSettings = req.body || {}
    const existing = db.prepare('SELECT config_data FROM websites WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ error: 'Website not found' })
    }
    const currentConfig = existing.config_data ? JSON.parse(existing.config_data) : {}
    const updatedConfig = { ...currentConfig, ...newSettings }
    const now = new Date().toISOString()
    db.prepare('UPDATE websites SET config_data = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(updatedConfig), now, id)
    res.json({ success: true, siteId: id, configData: updatedConfig })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Reconcile connected SQLite websites against Site Registry
export async function reconcileWebsitesWithRegistry() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cbdfjdxqhqajzjblysqd.supabase.co'
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Ys5D-QcdSw_gac9YkmKMZg_eLGCfmK5'

    const fetchRes = await fetch(`${supabaseUrl}/rest/v1/domains?select=id,canonical_domain,display_name,primary_url,admin_url,platform,portfolio,status&order=canonical_domain.asc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    if (!fetchRes.ok) return { success: false, error: `Supabase status ${fetchRes.status}` }
    const domains = await fetchRes.json()
    if (!Array.isArray(domains)) return { success: false, error: 'Invalid domains response' }

    const now = new Date().toISOString()
    const updateStmt = db.prepare(`
      UPDATE websites SET
        registry_status = @registry_status,
        domain_id = COALESCE(websites.domain_id, @domain_id),
        updated_at = @now
      WHERE id = @siteId
    `)

    let matchedCount = 0

    const normalizeDomain = (str) => {
      if (!str || typeof str !== 'string') return ''
      return str.trim().toLowerCase()
        .replace(/^https?:\/\//i, '')
        .replace(/\/.*$/, '')
        .replace(/^www\./i, '')
        .split(':')[0]
    }

    const localWebsites = db.prepare(`SELECT id, domain_id, url, name, config_data FROM websites`).all()

    for (const site of localWebsites) {
      let matchedDomain = null
      if (site.domain_id) {
        matchedDomain = domains.find(d => String(d.id) === String(site.domain_id))
      }

      if (!matchedDomain) {
        let cfgUrl = null
        if (site.config_data) {
          try {
            const parsed = JSON.parse(site.config_data)
            cfgUrl = parsed?.url
          } catch (e) {}
        }
        const siteCanonicals = [
          normalizeDomain(site.url),
          normalizeDomain(site.name),
          normalizeDomain(cfgUrl)
        ].filter(Boolean)

        matchedDomain = domains.find(d => {
          const dCanonical = normalizeDomain(d.canonical_domain || d.primary_url)
          return dCanonical && siteCanonicals.includes(dCanonical)
        })
      }

      if (matchedDomain) {
        let regStatus = (matchedDomain.status || 'active').toLowerCase()
        if (regStatus === 'hosted') regStatus = 'hosting'
        updateStmt.run({
          registry_status: regStatus,
          domain_id: matchedDomain.id ? String(matchedDomain.id) : site.domain_id,
          now,
          siteId: site.id
        })
        matchedCount++
      }
    }

    return { success: true, count: matchedCount, totalDomains: domains.length }
  } catch (err) {
    console.error('[RECONCILE_REGISTRY_ERROR]', err)
    return { success: false, error: err.message }
  }
}

// Active Domains from Site Registry
app.get('/api/registry/domains', async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cbdfjdxqhqajzjblysqd.supabase.co'
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Ys5D-QcdSw_gac9YkmKMZg_eLGCfmK5'
    const statusFilter = req.query.status || 'active'

    const url = statusFilter === 'all'
      ? `${supabaseUrl}/rest/v1/domains?select=id,canonical_domain,display_name,primary_url,admin_url,platform,portfolio,status&order=canonical_domain.asc`
      : `${supabaseUrl}/rest/v1/domains?status=eq.${encodeURIComponent(statusFilter)}&select=id,canonical_domain,display_name,primary_url,admin_url,platform,portfolio,status&order=canonical_domain.asc`

    const fetchRes = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({ success: false, error: `Supabase returned ${fetchRes.status}` })
    }
    const domains = await fetchRes.json()

    // Trigger non-blocking reconcile in background
    reconcileWebsitesWithRegistry().catch(() => {})

    res.json(domains)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Trigger explicit reconciliation
app.get('/api/registry/reconcile', async (req, res) => {
  try {
    const result = await reconcileWebsitesWithRegistry()
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Phase 2A Bridge: Link a website record to Master Domain UUID
app.post('/api/bridge/domains/link', (req, res) => {
  try {
    const { siteId, domainId } = req.body || {}
    if (!siteId || !domainId) {
      return res.status(400).json({ success: false, error: 'siteId and domainId are required' })
    }

    const info = db.prepare(`UPDATE websites SET domain_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(String(domainId), String(siteId))
    if (info.changes === 0) {
      return res.status(404).json({ success: false, error: `Website with id ${siteId} not found` })
    }

    res.json({ success: true, siteId, domainId, changes: info.changes })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// Phase 2A Bridge: Idempotent Sync / Shell Creation from Master Domains
app.post('/api/bridge/sync-master-domains', (req, res) => {
  try {
    let domains = req.body?.domains || req.body
    if (!Array.isArray(domains) && typeof domains === 'object' && domains !== null && domains.id) {
      domains = [domains]
    }
    if (!Array.isArray(domains)) {
      return res.status(400).json({ success: false, error: 'Array of domains is required' })
    }

    const now = new Date().toISOString()
    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      skippedIneligible: 0,
      conflicts: []
    }

    const normalizeDomain = (str) => {
      if (!str || typeof str !== 'string') return ''
      return str.trim().toLowerCase()
        .replace(/^https?:\/\//i, '')
        .replace(/\/.*$/, '')
        .replace(/^www\./i, '')
        .split(':')[0]
    }

    for (const d of domains) {
      if (!d || !d.id) continue
      results.processed++

      const masterId = String(d.id)
      const canonical = normalizeDomain(d.canonical_domain || d.domain_name || d.name || d.url)
      const status = (d.status || 'active').toLowerCase()
      const portfolio = d.portfolio || 'tse'
      const platform = d.platform || 'WordPress'
      const primaryUrl = d.primary_url || (canonical ? `https://${canonical}` : '')

      // Eligibility Rule: Automatically create Website Manager shells ONLY for active and development
      const isEligible = status === 'active' || status === 'development'

      // Tier A: Match by domain_id
      const existingByDomainId = db.prepare(`SELECT * FROM websites WHERE domain_id = ?`).get(masterId)

      if (existingByDomainId) {
        // Safe metadata update: do NOT delete history or touch credentials
        db.prepare(`
          UPDATE websites SET
            portfolio = COALESCE(@portfolio, portfolio),
            platform = COALESCE(@platform, platform),
            registry_status = @status,
            updated_at = @now
          WHERE id = @siteId
        `).run({
          portfolio,
          platform,
          status,
          now,
          siteId: existingByDomainId.id
        })
        results.updated++
        continue
      }

      // If domain is not eligible and no existing record is mapped, do not create shell
      if (!isEligible) {
        results.skippedIneligible++
        continue
      }

      // Tier B: Legacy fallback match (where domain_id is NULL)
      if (canonical) {
        const legacyMatches = db.prepare(`
          SELECT * FROM websites 
          WHERE domain_id IS NULL AND (LOWER(url) LIKE ? OR LOWER(name) LIKE ?)
        `).all(`%${canonical}%`, `%${canonical}%`)

        if (legacyMatches.length === 1) {
          db.prepare(`UPDATE websites SET domain_id = ?, registry_status = ?, updated_at = ? WHERE id = ?`).run(
            masterId,
            status,
            now,
            legacyMatches[0].id
          )
          results.updated++
          continue
        } else if (legacyMatches.length > 1) {
          results.conflicts.push({
            domain_id: masterId,
            canonical_domain: canonical,
            reason: 'Multiple ambiguous unlinked legacy rows found'
          })
          continue
        }
      }

      // Tier C: Create new lightweight Website Manager shell
      const newInternalId = `wm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      const shellStatusJson = JSON.stringify({
        connection: { label: 'Setup Required', value: 'Setup Required' },
        registryOrigin: true,
        registryStatus: status
      })

      db.prepare(`
        INSERT INTO websites (
          id, domain_id, name, url, platform, portfolio, status, registry_status, is_audited, last_audit_timestamp, sync_status, last_sync_timestamp, config_data, created_at, updated_at
        ) VALUES (
          @id, @domain_id, @name, @url, @platform, @portfolio, @status, @registry_status, 0, NULL, 'Unsynced', NULL, NULL, @created_at, @updated_at
        )
      `).run({
        id: newInternalId,
        domain_id: masterId,
        name: d.canonical_domain || d.domain_name || canonical,
        url: primaryUrl,
        platform,
        portfolio,
        status: shellStatusJson,
        registry_status: status,
        created_at: now,
        updated_at: now
      })

      results.created++
    }

    res.json({ success: true, ...results })
  } catch (e) {
    console.error('Error syncing master domains:', e)
    res.status(500).json({ success: false, error: e.message })
  }
})

// Phase 2A Bridge: Read-only SEO Context (Landing Pages & Target Phrases) by Master Domain UUID or domain string
app.get('/api/bridge/domains/:domain_or_id/seo-context', (req, res) => {
  try {
    const { domain_or_id } = req.params
    if (!domain_or_id) {
      return res.status(400).json({ success: false, error: 'Domain or Domain UUID parameter is required' })
    }

    // Clean search string
    let clean = domain_or_id.trim().toLowerCase()
    clean = clean.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/^www\./i, '')

    // Find website row by domain_id, id, or domain in url
    let site = db.prepare(`SELECT * FROM websites WHERE domain_id = ? OR id = ? OR LOWER(url) LIKE ?`).get(
      domain_or_id,
      domain_or_id,
      `%${clean}%`
    )

    if (!site) {
      return res.status(404).json({
        success: false,
        error: `No website record found in Website Manager matching domain or UUID "${domain_or_id}"`,
        domain_or_id
      })
    }

    // Retrieve configured landing pages from page_configurations
    const configRows = db.prepare(`SELECT * FROM page_configurations WHERE site_id = ? ORDER BY priority DESC, page_key ASC`).all(site.id)

    // Retrieve package data if available
    let packagePages = []
    try {
      const pkgRow = db.prepare(`SELECT package_data FROM wp_packages WHERE site_id = ?`).get(site.id)
      if (pkgRow && pkgRow.package_data) {
        const parsed = JSON.parse(pkgRow.package_data)
        packagePages = parsed.pages || parsed.items || []
      }
    } catch (e) {}

    // Retrieve latest page audit scores
    const auditRows = db.prepare(`SELECT page_key, audit_result_json, last_audit_timestamp FROM page_audits WHERE site_id = ?`).all(site.id)
    const auditMap = {}
    auditRows.forEach(a => {
      try {
        auditMap[a.page_key] = {
          lastAuditTimestamp: a.last_audit_timestamp,
          result: a.audit_result_json ? JSON.parse(a.audit_result_json) : null
        }
      } catch (e) {}
    })

    // Construct unified list of landing pages
    let landingPages = []

    if (configRows && configRows.length > 0) {
      landingPages = configRows.map(r => {
        const audit = auditMap[r.page_key] || {}
        let parsedConfig = {}
        try { if (r.config_json) parsedConfig = JSON.parse(r.config_json) } catch (e) {}

        return {
          page_key: r.page_key,
          url: r.url || parsedConfig.url || r.page_key,
          title: r.title || parsedConfig.title || parsedConfig.proposedTitle || '',
          target_phrase: r.target_phrase || parsedConfig.target || parsedConfig.targetPhrase || '',
          page_type: r.seo_page_type || parsedConfig.type || parsedConfig.seoPageType || 'Landing',
          priority: r.priority || 0,
          is_starred: Boolean(parsedConfig.isStarred || parsedConfig.starred),
          is_excluded: Boolean(r.is_excluded),
          last_audit_timestamp: audit.lastAuditTimestamp || null,
          audit_score: audit.result ? audit.result.score : null
        }
      })
    } else if (packagePages && packagePages.length > 0) {
      landingPages = packagePages.map(p => {
        const pageKey = p.url || p.link || p.slug || String(p.id)
        const audit = auditMap[pageKey] || {}
        return {
          page_key: pageKey,
          url: p.url || p.link || pageKey,
          title: p.title || p.name || '',
          target_phrase: p.targetPhrase || p.target || '',
          page_type: p.type || p.pageType || 'Landing',
          priority: p.priority || 0,
          is_starred: Boolean(p.isStarred || p.starred),
          is_excluded: Boolean(p.isExcluded),
          last_audit_timestamp: audit.lastAuditTimestamp || null,
          audit_score: audit.result ? audit.result.score : null
        }
      })
    }

    res.json({
      success: true,
      domain_id: site.domain_id || null,
      site_id: site.id,
      name: site.name,
      url: site.url,
      platform: site.platform,
      portfolio: site.portfolio,
      status: site.status,
      pages_count: landingPages.length,
      landing_pages: landingPages
    })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// Delete website record
app.delete('/api/websites/:id', (req, res) => {
  try {
    const { id } = req.params
    db.prepare(`DELETE FROM websites WHERE id = ?`).run(id)
    res.json({ success: true, id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ==========================================
// 2. WORDPRESS SYNC PACKAGES ENDPOINTS
// ==========================================

// Get WP package for site
app.get('/api/websites/:id/package', (req, res) => {
  try {
    const { id } = req.params
    const row = db.prepare(`SELECT package_data, updated_at FROM wp_packages WHERE site_id = ?`).get(id)
    if (!row) {
      return res.status(404).json({ error: 'Package not found for site' })
    }
    const rawData = JSON.parse(row.package_data)
    // Clean unwrapping if nested wrapper exists
    const cleanPackage = (rawData && rawData.packageData && (Array.isArray(rawData.packageData.pages) || Array.isArray(rawData.packageData.posts)))
      ? rawData.packageData
      : rawData

    const lastSyncTimestamp = rawData?.lastSyncTimestamp || row.updated_at

    res.json({
      siteId: id,
      isSynchronised: true,
      lastSyncTimestamp,
      packageData: cleanPackage,
      updatedAt: row.updated_at
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

function extractJsonFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') return null
  const trimmed = rawText.trim()
  try {
    return JSON.parse(trimmed)
  } catch (_e) {}

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1))
    } catch (_e) {}
  }

  const firstBracket = trimmed.indexOf('[')
  const lastBracket = trimmed.lastIndexOf(']')
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(trimmed.substring(firstBracket, lastBracket + 1))
    } catch (_e) {}
  }

  return null
}

// Save WP package for site
app.post('/api/websites/:id/package', (req, res) => {
  try {
    const { id } = req.params
    const rawBody = req.body
    if (!rawBody) {
      return res.status(400).json({ error: 'Package data is required' })
    }

    // Unwrap clean packageData if wrapper was passed
    const cleanPackageData = (rawBody && rawBody.packageData && (Array.isArray(rawBody.packageData.pages) || Array.isArray(rawBody.packageData.posts)))
      ? rawBody.packageData
      : (rawBody.pages || rawBody.posts ? rawBody : (rawBody.packageData || rawBody))

    // Calculate total pages
    const rawPages = Array.isArray(cleanPackageData?.pages) ? cleanPackageData.pages : (Array.isArray(cleanPackageData?.data?.pages) ? cleanPackageData.data.pages : (Array.isArray(cleanPackageData?.['full-export.json']) ? cleanPackageData['full-export.json'] : (Array.isArray(cleanPackageData?.['pages.json']) ? cleanPackageData['pages.json'] : [])))
    const rawPosts = Array.isArray(cleanPackageData?.posts) ? cleanPackageData.posts : (Array.isArray(cleanPackageData?.data?.posts) ? cleanPackageData.data.posts : (Array.isArray(cleanPackageData?.['posts.json']) ? cleanPackageData['posts.json'] : []))
    const rawProjects = Array.isArray(cleanPackageData?.projects) ? cleanPackageData.projects : []
    const totalPagesCount = rawPages.length || (rawPages.length + rawPosts.length + rawProjects.length)

    // SAFEGUARD: Never overwrite an existing populated package with an empty / 0-page payload
    const existingPkgRow = db.prepare(`SELECT package_data FROM wp_packages WHERE site_id = ?`).get(id)
    if (existingPkgRow && existingPkgRow.package_data) {
      try {
        const oldData = JSON.parse(existingPkgRow.package_data)
        const oldPkg = oldData.packageData || oldData.data || oldData
        const oldPages = Array.isArray(oldPkg.pages) ? oldPkg.pages : (Array.isArray(oldPkg['full-export.json']) ? oldPkg['full-export.json'] : (Array.isArray(oldPkg['pages.json']) ? oldPkg['pages.json'] : []))
        const oldTotal = oldPages.length || (Array.isArray(oldPkg.posts) ? oldPkg.posts.length : 0)
        if (totalPagesCount === 0 && oldTotal > 0) {
          console.warn(`[SafeGuard] Refusing to overwrite package for site ${id} (${oldTotal} existing pages) with 0-page payload.`)
          return res.status(400).json({
            error: 'REFUSE_EMPTY_PACKAGE',
            message: `Refusing to overwrite existing package containing ${oldTotal} pages with an empty payload. Existing package preserved.`
          })
        }
      } catch (_e) {}
    }

    const now = new Date().toISOString()
    const syncTx = db.transaction(() => {
      // 1. Save clean package to wp_packages table
      db.prepare(`
        INSERT INTO wp_packages (site_id, package_data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(site_id) DO UPDATE SET
          package_data = excluded.package_data,
          updated_at = excluded.updated_at
      `).run(id, JSON.stringify(cleanPackageData), now)

      // 2. Update websites table sync_status, total_pages, and last_sync_timestamp
      db.prepare(`
        UPDATE websites
        SET sync_status = 'Synced',
            total_pages = CASE WHEN ? > 0 THEN ? ELSE total_pages END,
            last_sync_timestamp = ?,
            updated_at = ?
        WHERE id = ?
      `).run(totalPagesCount, totalPagesCount, now, now, id)
    })

    syncTx()

    res.json({
      success: true,
      siteId: id,
      isSynchronised: true,
      lastSyncTimestamp: now,
      packageData: cleanPackageData,
      updatedAt: now
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Native Static HTML Page Discovery & Sync Endpoint via Sitemap.xml
app.post('/api/websites/:id/static-sync', async (req, res) => {
  try {
    const { id } = req.params
    const { websiteUrl } = req.body || {}

    // 1. Get website from DB if URL not provided
    const site = getWebsiteByIdFromDb(id)
    const targetUrl = (websiteUrl || site?.url || '').trim().replace(/\/+$/, '')
    if (!targetUrl) {
      return res.status(400).json({ error: 'MISSING_URL', message: 'Website URL is required for static HTML discovery.' })
    }

    console.log(`[StaticSync] Discovering pages for ${id} (${targetUrl})...`)

    // 2. Fetch sitemap.xml
    const sitemapUrls = [
      `${targetUrl}/sitemap.xml`,
      `${targetUrl.replace('www.', '')}/sitemap.xml`,
      `${targetUrl}/sitemap_index.xml`
    ]

    let sitemapText = null
    let fetchedSitemapUrl = null

    for (const smUrl of sitemapUrls) {
      try {
        const resp = await fetch(smUrl, {
          headers: { 'User-Agent': 'TSE-Website-Manager/2.52 (Static HTML Discovery)' },
          signal: AbortSignal.timeout(10000)
        })
        if (resp.ok) {
          const txt = await resp.text()
          if (txt && (txt.includes('<urlset') || txt.includes('<loc>'))) {
            sitemapText = txt
            fetchedSitemapUrl = smUrl
            break
          }
        }
      } catch (err) {
        console.warn(`[StaticSync] Sitemap check failed for ${smUrl}:`, err.message)
      }
    }

    const discoveredUrls = []

    if (sitemapText) {
      // Parse <loc> entries
      const locMatches = sitemapText.match(/<loc>\s*([^<]+)\s*<\/loc>/gi) || []
      for (const locTag of locMatches) {
        const urlMatch = locTag.match(/<loc>\s*([^<]+)\s*<\/loc>/i)
        if (urlMatch && urlMatch[1]) {
          const rawUrl = urlMatch[1].trim()
          if (rawUrl && !discoveredUrls.includes(rawUrl)) {
            discoveredUrls.push(rawUrl)
          }
        }
      }
    }

    if (discoveredUrls.length === 0) {
      // Fallback: at minimum discover the root homepage
      discoveredUrls.push(`${targetUrl}/`)
    }

    // Helper: Convert slug to clean title
    const slugToTitle = (slug) => {
      if (!slug || slug === '/' || slug === '') return 'Home'
      const clean = slug.replace(/^\/+|\/+$/g, '')
      return clean
        .split(/[-_]/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }

    // 3. Construct standard pages array with live HTML metadata extraction
    const pages = await Promise.all(discoveredUrls.map(async (pageUrl, idx) => {
      let pathName = pageUrl.replace(/^https?:\/\/[^/]+/i, '')
      if (!pathName) pathName = '/'
      const cleanSlug = pathName.replace(/^\/+|\/+$/g, '')
      const isHome = pathName === '/' || pathName === '' || cleanSlug === ''
      const pageTitle = isHome ? 'Home' : slugToTitle(cleanSlug)
      let metaTitle = ''
      let metaDescription = ''
      let h1 = ''

      let pageHtml = ''
      try {
        const resp = await fetch(pageUrl, {
          headers: { 'User-Agent': 'TSE-Website-Manager/2.52 (Static HTML Discovery)' },
          signal: AbortSignal.timeout(6000)
        })
        if (resp.ok) {
          pageHtml = await resp.text()
          const titleMatch = pageHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
          if (titleMatch && titleMatch[1]) {
            metaTitle = titleMatch[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
          }
          const descMatch = pageHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                            pageHtml.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)
          if (descMatch && descMatch[1]) {
            metaDescription = descMatch[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').trim()
          }
          const h1Match = pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
          if (h1Match && h1Match[1]) {
            h1 = h1Match[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').trim()
          }
        }
      } catch (err) {
        console.warn(`[StaticSync] Metadata fetch failed for ${pageUrl}:`, err.message)
      }

      return {
        id: isHome ? 'home' : (cleanSlug || `page-${idx + 1}`),
        title: pageTitle,
        originalTitle: pageTitle,
        metaTitle: metaTitle || pageTitle,
        metaDescription: metaDescription || '',
        h1: h1 || pageTitle,
        url: pageUrl,
        slug: cleanSlug,
        post_type: 'page',
        type: 'page',
        pageType: isHome ? 'Home' : 'Page',
        status: 'publish',
        content: {
          rendered: pageHtml,
          raw: pageHtml
        },
        html: pageHtml,
        modified: new Date().toISOString()
      }
    }))

    const packageData = {
      siteInfo: {
        id: site?.id || id,
        name: site?.name || 'Digital Spain',
        url: targetUrl,
        platform: 'static_html',
        portfolio: site?.portfolio || 'TSE',
        discoveredFrom: fetchedSitemapUrl || 'root'
      },
      pages,
      total_pages: pages.length
    }

    console.log(`[StaticSync] Successfully discovered ${pages.length} pages from ${fetchedSitemapUrl || 'fallback'}`)

    // 4. Save to wp_packages and update website record in SQLite
    const now = new Date().toISOString()
    const syncTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO wp_packages (site_id, package_data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(site_id) DO UPDATE SET
          package_data = excluded.package_data,
          updated_at = excluded.updated_at
      `).run(id, JSON.stringify(packageData), now)

      db.prepare(`
        UPDATE websites
        SET sync_status = 'Synced',
            platform = 'static_html',
            total_pages = ?,
            last_sync_timestamp = ?,
            updated_at = ?
        WHERE id = ?
      `).run(pages.length, now, now, id)
    })

    syncTx()

    res.json({
      success: true,
      siteId: id,
      discoveredCount: pages.length,
      packageData
    })
  } catch (err) {
    console.error('[StaticSync] Discovery error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// Server-side Magento REST Token generation endpoint
app.post('/api/websites/:id/magento-token', async (req, res) => {
  try {
    const { id } = req.params
    const { username, password, apiBaseUrl } = req.body || {}

    const siteRow = db.prepare('SELECT * FROM websites WHERE id = ?').get(id)
    if (!siteRow) {
      return res.status(404).json({ success: false, message: `Website ID '${id}' not found.` })
    }

    let configData = {}
    try { if (siteRow.config_data) configData = JSON.parse(siteRow.config_data) } catch (_e) {}

    const websiteUrl = siteRow.url || ''
    const cleanSiteUrl = websiteUrl.trim().replace(/\/+$/, '')
    const baseApi = (apiBaseUrl || configData.apiBaseUrl || `${cleanSiteUrl}/rest/all/V1`).trim().replace(/\/+$/, '')
    const tokenUrl = baseApi.replace(/\/rest\/(all\/)?V1\/?$/, '/rest/V1') + '/integration/admin/token'

    const adminUser = username || siteRow.wp_user || configData.wpUser
    const adminPass = password || siteRow.wp_pass || configData.wpPass

    if (!adminUser || !adminPass) {
      return res.status(400).json({ success: false, message: 'Magento admin username or password is required.' })
    }

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ username: adminUser, password: adminPass })
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      let parsedErr = 'Magento Admin Authentication Failed (HTTP 401).'
      try {
        const json = JSON.parse(errText)
        if (json.message) parsedErr = json.message
      } catch (_e) {}
      return res.status(tokenRes.status).json({ success: false, status: tokenRes.status, message: parsedErr })
    }

    const token = await tokenRes.json()
    const tokenStr = typeof token === 'string' ? token : String(token)

    // Securely update SQLite database with fresh Magento Bearer token
    configData.wpUser = adminUser
    configData.wpPass = tokenStr
    configData.connectedUser = adminUser
    configData.tokenGeneratedAt = new Date().toISOString()

    const now = new Date().toISOString()
    db.prepare('UPDATE websites SET config_data = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify(configData), now, id)

    res.json({ success: true, token: tokenStr, message: 'Magento Admin token successfully authorized and saved.' })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// Server-side Magento REST API proxy sync endpoint (Category Structure focus)
app.post('/api/websites/:id/magento-sync', async (req, res) => {
  try {
    const { id } = req.params

    // 1. Fetch website record & credentials directly from SQLite database
    const siteRow = db.prepare('SELECT * FROM websites WHERE id = ?').get(id)
    if (!siteRow) {
      return res.status(404).json({ success: false, error: 'SITE_NOT_FOUND', message: `Website ID '${id}' not found in database.` })
    }

    let configData = {}
    try {
      if (siteRow.config_data) configData = JSON.parse(siteRow.config_data)
    } catch (_e) {}

    const websiteUrl = siteRow.url || ''
    const cleanSiteUrl = websiteUrl.trim().replace(/\/+$/, '')

    const apiBaseUrl = (configData.apiBaseUrl || `${cleanSiteUrl}/rest/all/V1`).trim().replace(/\/+$/, '')
    const storeCode = configData.mgStore || 'default'

    const user = configData.wpUser || siteRow.connected_user || 'tse_audit'
    const rawPassOrToken = siteRow.wp_pass || configData.wpPass || ''

    if (!cleanSiteUrl) {
      return res.status(400).json({ success: false, error: 'MISSING_URL', message: 'Website URL is missing from website record.' })
    }

    // 2. Acquire or validate Admin Bearer Token
    let bearerToken = rawPassOrToken
    if (user && rawPassOrToken) {
      try {
        const tokenRes = await fetch(`${apiBaseUrl}/integration/admin/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          },
          body: JSON.stringify({ username: user, password: rawPassOrToken })
        })
        if (tokenRes.ok) {
          const acquiredToken = await tokenRes.json()
          if (typeof acquiredToken === 'string' && acquiredToken.trim()) {
            bearerToken = acquiredToken.trim()
          }
        }
      } catch (tokenErr) {
        console.warn('Magento token acquisition attempt error:', tokenErr.message)
      }
    }

    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken.trim()}`
    }

    // Issue server-side HTTP requests to Magento REST API (Categories list & CMS pages)
    const [catListRes, catTreeRes, cmsRes] = await Promise.all([
      fetch(`${apiBaseUrl}/categories/list?searchCriteria[pageSize]=250`, { method: 'GET', headers }).catch(() => null),
      fetch(`${apiBaseUrl}/categories`, { method: 'GET', headers }).catch(() => null),
      fetch(`${apiBaseUrl}/cmsPage/search?searchCriteria[pageSize]=100`, { method: 'GET', headers }).catch(() => null)
    ])

    // Check for HTTP 401 Unauthorized
    if (catListRes?.status === 401 && catTreeRes?.status === 401) {
      return res.status(401).json({
        success: false,
        status: 401,
        error: 'MAGENTO_AUTH_FAILED',
        message: 'Magento REST API Authentication Failed (HTTP 401). Please verify Magento admin credentials in Global Settings.'
      })
    }

    const catListData = catListRes && catListRes.ok ? await catListRes.json() : null
    const catTreeData = catTreeRes && catTreeRes.ok ? await catTreeRes.json() : null
    const cmsPagesJson = cmsRes && cmsRes.ok ? await cmsRes.json() : null

    const rawCats = catListData?.items || []
    const pages = []

    if (rawCats.length > 0) {
      // Build lookup map of category ID to category entity
      const catMap = {}
      rawCats.forEach(cat => {
        if (cat && cat.id) catMap[String(cat.id)] = cat
      })

      // Canonical Category URL Resolver: constructs clean canonical URLs (Level 2 top slug + leaf slug)
      function resolveCanonicalCategoryUrl(cat) {
        if (!cat || !cat.name) return cleanSiteUrl

        const attrs = {}
        if (Array.isArray(cat.custom_attributes)) {
          cat.custom_attributes.forEach(a => {
            if (a && a.attribute_code) attrs[a.attribute_code] = a.value
          })
        }

        const catPath = attrs.path || (cat.path ? String(cat.path) : '')
        const parts = catPath.split('/').filter(Boolean)
        const level = cat.level !== undefined ? Number(cat.level) : (parts.length - 1)

        const urlKey = attrs.url_key || cat.url_key || ''
        const cleanNameSlug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        const leafSlug = urlKey || cleanNameSlug

        // Root container (Level 1, e.g. ID: 2 Hf4you)
        if (level <= 1 || parts.length <= 2) {
          return cleanSiteUrl
        }

        // Level 2 (Top-level product category: Beds, Bed Frames, Divan Beds, Headboards, Mattresses)
        if (level === 2 || parts.length === 3) {
          return `${cleanSiteUrl}/${leafSlug}`
        }

        // Level 3 or 4 descendant: Resolve the Level 2 top parent
        // parts format: ['1', '2', '<top_level_id>', ..., '<leaf_id>']
        const topLevelId = parts[2]
        const topCat = topLevelId ? catMap[String(topLevelId)] : null
        let topSlug = ''
        if (topCat) {
          const topAttrs = {}
          if (Array.isArray(topCat.custom_attributes)) {
            topCat.custom_attributes.forEach(a => {
              if (a && a.attribute_code) topAttrs[a.attribute_code] = a.value
            })
          }
          topSlug = topAttrs.url_key || topCat.url_key || topCat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        }

        if (topSlug) {
          return `${cleanSiteUrl}/${topSlug}/${leafSlug}`
        }
        return `${cleanSiteUrl}/${leafSlug}`
      }

      // Process detailed categories list with Canonical Category URL Resolver
      rawCats.forEach(cat => {
        if (!cat.id || !cat.name) return
        const attrs = {}
        if (Array.isArray(cat.custom_attributes)) {
          cat.custom_attributes.forEach(a => {
            if (a && a.attribute_code) attrs[a.attribute_code] = a.value
          })
        }

        // Hierarchy filter: ONLY include categories that belong to the HF4You store tree (path starting with '1/2/' or equal to '1/2')
        // Exclude foreign stores like Cheap Bed Sale ('1/226/...') or Mattress Time ('1/225/...')
        const catPath = attrs.path || (cat.path ? String(cat.path) : '')
        if (catPath && !catPath.startsWith('1/2/') && catPath !== '1/2') {
          return // Skip foreign store category
        }

        const fullCatUrl = resolveCanonicalCategoryUrl(cat)

        const isContainerOrInactive = (cat.level !== undefined && cat.level <= 1) || Boolean(cat.is_active) === false
        const catType = isContainerOrInactive ? 'Excluded' : 'Landing'
        const catPriority = isContainerOrInactive ? 0 : 2

        pages.push({
          id: `cat-${cat.id}`,
          title: cat.name,
          url: fullCatUrl,
          link: fullCatUrl,
          type: catType,
          priority: catPriority,
          isExcluded: isContainerOrInactive,
          post_type: 'category',
          is_active: Boolean(cat.is_active),
          level: cat.level,
          magentoCategoryId: cat.id,
          parentId: cat.parent_id,
          position: cat.position,
          meta_title: attrs.meta_title || cat.name,
          meta_description: attrs.meta_description || '',
          content: attrs.description || attrs.category_top_custom_text || ''
        })
      })
    } else if (catTreeData) {
      // Fallback to recursive category tree if /categories/list is unavailable
      // Find the HF4You root store tree node (ID: 2 or name: 'hf4you')
      let hf4youTreeNode = catTreeData
      if (catTreeData.id === 1 && Array.isArray(catTreeData.children_data)) {
        hf4youTreeNode = catTreeData.children_data.find(ch => String(ch.id) === '2' || ch.name?.toLowerCase() === 'hf4you') || catTreeData
      }

      function processCategoryNode(node, topLevelSlug = '') {
        if (!node) return
        if (node.name && node.id) {
          if (node.path && !String(node.path).startsWith('1/2/') && String(node.path) !== '1/2') {
            return
          }
          const catSlug = (node.url_key || node.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
          const currentTopSlug = node.level === 2 ? catSlug : topLevelSlug
          const fullCatUrl = node.level <= 1
            ? cleanSiteUrl
            : (node.level === 2 ? `${cleanSiteUrl}/${catSlug}` : (currentTopSlug ? `${cleanSiteUrl}/${currentTopSlug}/${catSlug}` : `${cleanSiteUrl}/${catSlug}`))

          const isContainerOrInactive = (node.level !== undefined && node.level <= 1) || Boolean(node.is_active) === false
          const catType = isContainerOrInactive ? 'Excluded' : 'Landing'
          const catPriority = isContainerOrInactive ? 0 : 2

          pages.push({
            id: `cat-${node.id}`,
            title: node.name,
            url: fullCatUrl,
            link: fullCatUrl,
            type: catType,
            priority: catPriority,
            isExcluded: isContainerOrInactive,
            post_type: 'category',
            is_active: Boolean(node.is_active),
            level: node.level,
            magentoCategoryId: node.id,
            parentId: node.parent_id,
            parentName: node.level > 2 ? currentTopSlug : null,
            position: node.position
          })

          if (Array.isArray(node.children_data)) {
            node.children_data.forEach(child => processCategoryNode(child, currentTopSlug))
          }
        }
      }
      processCategoryNode(hf4youTreeNode)
    }

    // 2. Process CMS Pages (Preserves Homepage Hub Classification & Policy Exclusions)
    const exclusionPatterns = [
      'privacy policy', 'privacy-policy', 'terms & conditions', 'terms-and-conditions', 'terms-conditions',
      'disclaimer', 'accessibility', 'about us', 'about-us', 'contact us', 'contact-us',
      '404', 'no-route', 'evoque_404', 'cart', 'checkout', 'my-account',
      'returns policy', 'returns-policy', 'orders & returns', 'orders-and-returns', 'orders-returns',
      'delivery information', 'delivery-information', 'delivery details', 'delivery-details',
      'payment information', 'payment-information', 'payment-options',
      'faq', 'faqs', 'f-a-q', "f.a.q's",
      'finance',
      'showroom', 'showrooms', 'store-finder', 'store-info', 'our-stores', 'store-locator',
      'price match', 'price-match',
      'pay later with klarna', 'klarna', 'pay-later',
      'partners',
      'testimonials',
      'customer service', 'customer-service',
      'enable cookies', 'enable-cookies', 'cookie-restriction-mode', 'cookie restriction',
      'further resources', 'further-resources'
    ]

    if (cmsPagesJson && Array.isArray(cmsPagesJson.items)) {
      cmsPagesJson.items.forEach(p => {
        const slug = p.identifier || ''
        const title = p.title || p.identifier || ''
        const lowerTitle = title.toLowerCase()
        const lowerSlug = slug.toLowerCase()

        const pageUrl = slug === 'home' || slug === '' ? cleanSiteUrl : `${cleanSiteUrl}/${slug}`
        const isHome = slug === 'home' || pageUrl === cleanSiteUrl || pageUrl === `${cleanSiteUrl}/`
        const matchesExclusion = exclusionPatterns.some(pattern => lowerTitle.includes(pattern) || lowerSlug.includes(pattern))

        let pageType = 'Topical'
        let pagePriority = 3
        let pageExcluded = false

        if (isHome) {
          pageType = 'Hub'
          pagePriority = 1
          pageExcluded = false
        } else if (matchesExclusion) {
          pageType = 'Excluded'
          pagePriority = 0
          pageExcluded = true
        }

        pages.push({
          id: `cms-${p.id}`,
          title: title,
          url: pageUrl,
          link: pageUrl,
          type: pageType,
          priority: pagePriority,
          isExcluded: pageExcluded,
          post_type: 'cms_page',
          content: p.content || '',
          meta_title: p.meta_title || p.title,
          meta_description: p.meta_description || ''
        })
      })
    }

    const packageData = {
      site_info: {
        url: cleanSiteUrl,
        platform: 'magento',
        store_code: storeCode
      },
      pages,
      categories: catTreeData || catListData,
      cms_pages: cmsPagesJson?.items || []
    }

    res.json({
      success: true,
      packageData
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SERVER_MAGENTO_SYNC_ERROR',
      message: `Backend failed to sync with Magento REST API: ${error.message}`
    })
  }
})

// Helper to fetch paginated WordPress items
async function fetchWordPressItemsPaginated(baseUrl, endpointPath, authHeader) {
  const items = []
  let page = 1
  const perPage = 20
  const maxPages = 50 // Cap at 1000 items per post type for safety

  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'TSE-Website-Manager/2.52'
  }
  if (authHeader) {
    headers['Authorization'] = authHeader
  }

  while (page <= maxPages) {
    const url = `${baseUrl}/wp-json/wp/v2/${endpointPath}?per_page=${perPage}&page=${page}&_fields=id,date,modified,slug,status,type,link,title,content,excerpt,yoast_head,yoast_head_json,parent`
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(15000)
      })
      if (!res.ok) {
        if (page === 1 && (res.status === 404 || res.status === 400 || res.status === 401)) {
          break
        }
        if (page > 1 && (res.status === 400 || res.status === 404)) {
          break
        }
        break
      }
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) {
        break
      }
      items.push(...data)
      const totalPagesHeader = res.headers.get('x-wp-totalpages')
      if (totalPagesHeader && page >= parseInt(totalPagesHeader, 10)) {
        break
      }
      if (data.length < perPage) {
        break
      }
      page++
    } catch (err) {
      console.warn(`[WP Sync] Error fetching ${endpointPath} page ${page}:`, err.message)
      break
    }
  }

  return items
}

function normalizeWordPressBaseUrl(rawUrl) {
  if (!rawUrl) return ''
  let clean = String(rawUrl).trim()
  if (!/^https?:\/\//i.test(clean)) {
    clean = 'https://' + clean
  }
  clean = clean.replace(/\/wp-admin(?:\/.*)?$/i, '')
  clean = clean.replace(/\/wp-login\.php(?:\/.*)?$/i, '')
  clean = clean.replace(/\/+$/, '')
  return clean
}

// Server-side WordPress Sync function
async function syncWordPressSite(rawSiteUrl, username, password) {
  const cleanSiteUrl = normalizeWordPressBaseUrl(rawSiteUrl)
  if (!cleanSiteUrl) {
    return { success: false, error: 'MISSING_URL', message: 'Website URL is invalid or missing.' }
  }

  let authHeader = null
  if (username && password) {
    const cleanUser = String(username).trim()
    const cleanPass = String(password).trim().replace(/\s+/g, '')
    authHeader = 'Basic ' + Buffer.from(`${cleanUser}:${cleanPass}`).toString('base64')
  }

  const defaultHeaders = {
    'Accept': 'application/json',
    'User-Agent': 'TSE-Website-Manager/2.52'
  }
  if (authHeader) {
    defaultHeaders['Authorization'] = authHeader
  }

  // 1. Try TSE Exporter endpoint first
  try {
    const exporterRes = await fetch(`${cleanSiteUrl}/wp-json/tse-site-exporter/v1/export`, {
      method: 'GET',
      headers: defaultHeaders,
      signal: AbortSignal.timeout(15000)
    })
    if (exporterRes.ok) {
      const rawText = await exporterRes.text()
      const pkg = extractJsonFromText(rawText)
      if (pkg && (Array.isArray(pkg.pages) || Array.isArray(pkg.data?.pages) || Array.isArray(pkg.packageData?.pages) || Array.isArray(pkg['full-export.json']) || Array.isArray(pkg['pages.json']))) {
        return { success: true, packageData: pkg, source: 'tse-exporter' }
      }
    }
  } catch (_expErr) {
    // TSE Exporter not active or timed out, fallback to paginated WP REST API
  }

  // 2. Paginated WP REST API fallback
  const [pages, posts, projects] = await Promise.all([
    fetchWordPressItemsPaginated(cleanSiteUrl, 'pages', authHeader),
    fetchWordPressItemsPaginated(cleanSiteUrl, 'posts', authHeader),
    fetchWordPressItemsPaginated(cleanSiteUrl, 'projects', authHeader)
  ])

  const combinedPages = [
    ...(Array.isArray(pages) ? pages : []),
    ...(Array.isArray(posts) ? posts : []),
    ...(Array.isArray(projects) ? projects : [])
  ]

  if (combinedPages.length === 0 || !Array.isArray(pages) || pages.length === 0) {
    return {
      success: false,
      error: 'NO_PAGES_FOUND',
      message: `Failed to retrieve standard pages from WordPress REST API for ${cleanSiteUrl}. Authentication may be required.`
    }
  }

  const packageData = {
    site_info: {
      url: cleanSiteUrl,
      platform: 'wordpress'
    },
    pages: combinedPages,
    posts: posts || [],
    projects: projects || []
  }

  return { success: true, packageData, source: 'wp-rest-paginated' }
}

// Server-side WordPress sync endpoint
app.post('/api/websites/:id/wordpress-sync', async (req, res) => {
  try {
    const { id } = req.params
    const siteRow = getWebsiteByIdFromDb(id)
    if (!siteRow) {
      return res.status(404).json({ success: false, error: 'SITE_NOT_FOUND', message: `Website ID '${id}' not found in database.` })
    }

    let configData = {}
    try {
      if (siteRow.config_data) configData = JSON.parse(siteRow.config_data)
    } catch (_e) {}

    const websiteUrl = siteRow.url || req.body?.websiteUrl || ''
    const cleanSiteUrl = normalizeWordPressBaseUrl(websiteUrl)
    if (!cleanSiteUrl) {
      return res.status(400).json({ success: false, error: 'MISSING_URL', message: 'Website URL is missing.' })
    }

    const username = configData.wpUser || siteRow.connected_user || req.body?.username || ''
    const password = siteRow.wp_pass || configData.wpPass || req.body?.applicationPassword || ''

    const result = await syncWordPressSite(cleanSiteUrl, username, password)
    if (!result.success) {
      return res.status(500).json(result)
    }

    const pagesCount = Array.isArray(result.packageData?.pages) ? result.packageData.pages.length : (Array.isArray(result.packageData?.['full-export.json']) ? result.packageData['full-export.json'].length : 0)
    const postsCount = Array.isArray(result.packageData?.posts) ? result.packageData.posts.length : 0
    const projectsCount = Array.isArray(result.packageData?.projects) ? result.packageData.projects.length : 0
    const totalPagesCount = pagesCount || (pagesCount + postsCount + projectsCount)

    // SAFEGUARD: Never overwrite an existing populated package with an empty / 0-page payload
    const existingPkgRow = db.prepare(`SELECT package_data FROM wp_packages WHERE site_id = ?`).get(id)
    if (existingPkgRow && existingPkgRow.package_data) {
      try {
        const oldData = JSON.parse(existingPkgRow.package_data)
        const oldPkg = oldData.packageData || oldData.data || oldData
        const oldPages = Array.isArray(oldPkg.pages) ? oldPkg.pages : (Array.isArray(oldPkg['full-export.json']) ? oldPkg['full-export.json'] : (Array.isArray(oldPkg['pages.json']) ? oldPkg['pages.json'] : []))
        const oldTotal = oldPages.length || (Array.isArray(oldPkg.posts) ? oldPkg.posts.length : 0)
        if (totalPagesCount === 0 && oldTotal > 0) {
          console.warn(`[SafeGuard] Refusing to overwrite package for site ${id} (${oldTotal} existing pages) with 0-page payload.`)
          return res.status(400).json({
            error: 'REFUSE_EMPTY_PACKAGE',
            message: `Refusing to overwrite existing package containing ${oldTotal} pages with an empty payload. Existing package preserved.`
          })
        }
      } catch (_e) {}
    }

    const now = new Date().toISOString()
    // Save to wp_packages table
    db.prepare(`
      INSERT INTO wp_packages (site_id, package_data, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(site_id) DO UPDATE SET
        package_data = excluded.package_data,
        updated_at = excluded.updated_at
    `).run(String(id), JSON.stringify(result.packageData), now)

    // Update website sync status, total_pages, and normalized url
    db.prepare(`
      UPDATE websites
      SET url = ?, sync_status = 'Synced', total_pages = CASE WHEN ? > 0 THEN ? ELSE total_pages END, last_sync_timestamp = ?, updated_at = ?
      WHERE id = ?
    `).run(cleanSiteUrl, totalPagesCount, totalPagesCount, now, now, String(id))

    res.json({
      success: true,
      totalPages: totalPagesCount,
      packageData: result.packageData,
      source: result.source
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SERVER_WP_SYNC_ERROR',
      message: `Backend WordPress sync failed: ${error.message}`
    })
  }
})

// Generic WordPress sync endpoint (by payload if ID is not in DB)
app.post('/api/wordpress/sync', async (req, res) => {
  try {
    const { websiteUrl, username, applicationPassword } = req.body || {}
    const cleanSiteUrl = (websiteUrl || '').trim().replace(/\/+$/, '')
    if (!cleanSiteUrl) {
      return res.status(400).json({ success: false, error: 'MISSING_URL', message: 'Website URL is required.' })
    }

    const result = await syncWordPressSite(cleanSiteUrl, username, applicationPassword)
    if (!result.success) {
      return res.status(500).json(result)
    }

    res.json({
      success: true,
      packageData: result.packageData,
      source: result.source
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SERVER_WP_SYNC_ERROR',
      message: `Backend WordPress sync failed: ${error.message}`
    })
  }
})

// ==========================================
// 3. PAGE CONFIGURATIONS ENDPOINTS
// ==========================================

// Get all page configurations for a website
app.get('/api/websites/:id/page-configs', (req, res) => {
  try {
    const { id } = req.params
    const rows = db.prepare(`SELECT * FROM page_configurations WHERE site_id = ?`).all(id)
    const result = {}
    rows.forEach(r => {
      const parsedConfig = r.config_json ? JSON.parse(r.config_json) : {}
      result[r.page_key] = {
        ...parsedConfig,
        url: r.url,
        title: r.title,
        target: r.target_phrase || parsedConfig.target || '',
        targetPhrase: r.target_phrase || parsedConfig.targetPhrase || '',
        secondaryTargetPhrase: parsedConfig.secondaryTargetPhrase || '',
        type: r.seo_page_type || parsedConfig.type,
        seoPageType: r.seo_page_type || parsedConfig.seoPageType,
        priority: r.priority,
        isExcluded: Boolean(r.is_excluded)
      }
    })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Save a single page configuration for a website
app.post('/api/websites/:id/page-configs/single', (req, res) => {
  try {
    const { id } = req.params
    const conf = req.body
    if (!conf || typeof conf !== 'object') {
      return res.status(400).json({ error: 'Configuration object is required' })
    }

    const rawPageKey = conf.pageId || conf.url || conf.pageKey
    const pageKey = normalizeDbPageKey(rawPageKey)
    if (!pageKey) {
      return res.status(400).json({ error: 'pageId or url is required' })
    }

    const now = new Date().toISOString()
    const existingRow = db.prepare(`SELECT * FROM page_configurations WHERE site_id = ? AND page_key = ?`).get(id, pageKey)
    let existingJson = {}
    if (existingRow?.config_json) {
      try { existingJson = JSON.parse(existingRow.config_json) } catch (_) {}
    }

    const targetPhrase = (conf.target !== undefined ? conf.target : (conf.targetPhrase !== undefined ? conf.targetPhrase : (existingJson.targetPhrase || existingRow?.target_phrase || ''))).trim()
    const secondaryTargetPhrase = (conf.secondaryTargetPhrase !== undefined ? conf.secondaryTargetPhrase : (existingJson.secondaryTargetPhrase || '')).trim()
    const resolvedType = conf.type || conf.seoPageType || existingJson.type || existingJson.seoPageType || existingRow?.seo_page_type || ''
    const resolvedPriority = conf.priority !== undefined ? Number(conf.priority) : (existingJson.priority !== undefined ? Number(existingJson.priority) : (existingRow?.priority || 0))
    const resolvedIsStarred = conf.isStarred !== undefined ? Boolean(conf.isStarred) : Boolean(existingJson.isStarred)
    const resolvedIsExcluded = conf.isExcluded !== undefined ? Boolean(conf.isExcluded) : Boolean(existingJson.isExcluded || existingRow?.is_excluded)
    const resolvedIsManualOverride = conf.isManualOverride !== undefined ? Boolean(conf.isManualOverride) : Boolean(existingJson.isManualOverride)

    const cleanConfig = {
      ...existingJson,
      ...(conf && typeof conf === 'object' ? conf : {}),
      pageId: conf.pageId || existingJson.pageId || pageKey,
      url: conf.url || existingJson.url || pageKey,
      proposedTitle: conf.proposedTitle || conf.title || existingJson.proposedTitle || existingJson.title || existingRow?.title || '',
      title: conf.title || conf.proposedTitle || existingJson.title || existingJson.proposedTitle || existingRow?.title || '',
      targetPhrase: targetPhrase,
      target: targetPhrase,
      secondaryTargetPhrase: secondaryTargetPhrase,
      type: resolvedType,
      seoPageType: resolvedType,
      autoType: conf.autoType || existingJson.autoType || resolvedType,
      priority: resolvedPriority,
      isConfigured: Boolean(targetPhrase),
      isStarred: resolvedIsStarred,
      isExcluded: resolvedIsExcluded,
      isManualOverride: resolvedIsManualOverride,
      status: targetPhrase ? 'configured' : 'unconfigured',
      updatedAt: now
    }

    const stmt = db.prepare(`
      INSERT INTO page_configurations (
        site_id, page_key, url, title, target_phrase, seo_page_type, priority, is_excluded, config_json, updated_at
      ) VALUES (
        @site_id, @page_key, @url, @title, @target_phrase, @seo_page_type, @priority, @is_excluded, @config_json, @updated_at
      )
      ON CONFLICT(site_id, page_key) DO UPDATE SET
        url = excluded.url,
        title = excluded.title,
        target_phrase = excluded.target_phrase,
        seo_page_type = excluded.seo_page_type,
        priority = excluded.priority,
        is_excluded = excluded.is_excluded,
        config_json = excluded.config_json,
        updated_at = excluded.updated_at
    `)

    stmt.run({
      site_id: id,
      page_key: pageKey,
      url: cleanConfig.url,
      title: cleanConfig.title,
      target_phrase: targetPhrase,
      seo_page_type: cleanConfig.seoPageType,
      priority: cleanConfig.priority,
      is_excluded: cleanConfig.isExcluded ? 1 : 0,
      config_json: JSON.stringify(cleanConfig),
      updated_at: now
    })

    // If page already has a stored ranking URL, re-evaluate is_url_match
    const rankRow = db.prepare(`SELECT ranking_url FROM page_rankings WHERE site_id = ? AND page_key = ?`).get(id, pageKey)
    if (rankRow && rankRow.ranking_url) {
      const siteRow = getWebsiteByIdFromDb(id)
      const siteUrl = siteRow?.url || ''
      const normRanking = normalizeUrlForMatching(rankRow.ranking_url, siteUrl)
      const normConfigured = normalizeUrlForMatching(cleanConfig.url || pageKey, siteUrl)
      const isMatch = (normRanking && normConfigured && normRanking === normConfigured) ? 1 : 0
      db.prepare(`UPDATE page_rankings SET is_url_match = ?, updated_at = ? WHERE site_id = ? AND page_key = ?`).run(isMatch, now, id, pageKey)
    }

    res.json({ success: true, siteId: id, pageKey, config: cleanConfig })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Save all page configurations for a website (bulk object map)
app.post('/api/websites/:id/page-configs', (req, res) => {
  try {
    const { id } = req.params
    const configsMap = req.body
    if (!configsMap || typeof configsMap !== 'object') {
      return res.status(400).json({ error: 'Configurations map object is required' })
    }

    const now = new Date().toISOString()
    const stmt = db.prepare(`
      INSERT INTO page_configurations (
        site_id, page_key, url, title, target_phrase, seo_page_type, priority, is_excluded, config_json, updated_at
      ) VALUES (
        @site_id, @page_key, @url, @title, @target_phrase, @seo_page_type, @priority, @is_excluded, @config_json, @updated_at
      )
      ON CONFLICT(site_id, page_key) DO UPDATE SET
        url = excluded.url,
        title = excluded.title,
        target_phrase = excluded.target_phrase,
        seo_page_type = excluded.seo_page_type,
        priority = excluded.priority,
        is_excluded = excluded.is_excluded,
        config_json = excluded.config_json,
        updated_at = excluded.updated_at
    `)

    const insertMany = db.transaction((map) => {
      for (const [pageKey, conf] of Object.entries(map)) {
        if (!conf) continue
        const confObj = typeof conf === 'object' ? conf : {}
        const tp = (confObj.target || confObj.targetPhrase || '').trim()
        const stp = (confObj.secondaryTargetPhrase || '').trim()
        const cleanConf = {
          ...confObj,
          target: tp,
          targetPhrase: tp,
          secondaryTargetPhrase: stp
        }
        stmt.run({
          site_id: id,
          page_key: pageKey,
          url: confObj.url || pageKey,
          title: confObj.title || confObj.proposedTitle || '',
          target_phrase: tp,
          seo_page_type: confObj.type || confObj.seoPageType || '',
          priority: Number(confObj.priority) || 0,
          is_excluded: confObj.isExcluded || confObj.type === 'Excluded' ? 1 : 0,
          config_json: JSON.stringify(cleanConf),
          updated_at: now
        })

        // If page already has a stored ranking URL, re-evaluate is_url_match without DataForSEO call
        const rankRow = db.prepare(`SELECT ranking_url FROM page_rankings WHERE site_id = ? AND page_key = ?`).get(id, pageKey)
        if (rankRow && rankRow.ranking_url) {
          const siteRow = getWebsiteByIdFromDb(id)
          const siteUrl = siteRow?.url || ''
          const normRanking = normalizeUrlForMatching(rankRow.ranking_url, siteUrl)
          const normConfigured = normalizeUrlForMatching(conf.url || pageKey, siteUrl)
          const isMatch = (normRanking && normConfigured && normRanking === normConfigured) ? 1 : 0
          db.prepare(`UPDATE page_rankings SET is_url_match = ?, updated_at = ? WHERE site_id = ? AND page_key = ?`).run(isMatch, now, id, pageKey)
        }
      }
    })

    insertMany(configsMap)
    res.json({ success: true, siteId: id, count: Object.keys(configsMap).length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ==========================================
// 4. PAGE AUDITS ENDPOINTS
// ==========================================

// Get all page audits for a website
app.get('/api/websites/:id/audits', (req, res) => {
  try {
    const { id } = req.params
    const rows = db.prepare(`SELECT * FROM page_audits WHERE site_id = ?`).all(id)
    const result = {}
    rows.forEach(r => {
      result[r.page_key] = {
        isAudited: Boolean(r.is_audited),
        isStale: Boolean(r.is_stale),
        staleReason: r.stale_reason || null,
        lastAuditTimestamp: r.last_audit_timestamp,
        fingerprint: r.fingerprint,
        auditResult: r.audit_result_json ? JSON.parse(r.audit_result_json) : null
      }
    })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Save page audit record (supports body { pageKey, auditRecord } or param /:pageKey)
function handleSaveAuditRecord(req, res) {
  try {
    const { id, pageKey: paramPageKey } = req.params
    const pageKey = paramPageKey ? decodeURIComponent(paramPageKey) : req.body?.pageKey
    const auditRecord = req.body?.auditRecord || req.body
    if (!pageKey || !auditRecord) {
      return res.status(400).json({ error: 'pageKey and auditRecord required' })
    }

    const now = new Date().toISOString()
    const stmt = db.prepare(`
      INSERT INTO page_audits (
        site_id, page_key, is_audited, is_stale, stale_reason, last_audit_timestamp, fingerprint, audit_result_json, updated_at
      ) VALUES (
        @site_id, @page_key, @is_audited, @is_stale, @stale_reason, @last_audit_timestamp, @fingerprint, @audit_result_json, @updated_at
      )
      ON CONFLICT(site_id, page_key) DO UPDATE SET
        is_audited = excluded.is_audited,
        is_stale = excluded.is_stale,
        stale_reason = excluded.stale_reason,
        last_audit_timestamp = excluded.last_audit_timestamp,
        fingerprint = excluded.fingerprint,
        audit_result_json = excluded.audit_result_json,
        updated_at = excluded.updated_at
    `)

    stmt.run({
      site_id: id,
      page_key: pageKey,
      is_audited: auditRecord.isAudited ? 1 : 0,
      is_stale: auditRecord.isStale ? 1 : 0,
      stale_reason: auditRecord.staleReason || null,
      last_audit_timestamp: auditRecord.lastAuditTimestamp || null,
      fingerprint: auditRecord.fingerprint || '',
      audit_result_json: auditRecord.auditResult ? JSON.stringify(auditRecord.auditResult) : null,
      updated_at: now
    })

    res.json({ success: true, siteId: id, pageKey })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

app.post('/api/websites/:id/audits', handleSaveAuditRecord)
app.post('/api/websites/:id/audits/:pageKey', handleSaveAuditRecord)

// Bulk save audits
app.post('/api/websites/:id/audits/batch', (req, res) => {
  try {
    const { id } = req.params
    const auditsMap = req.body
    if (!auditsMap || typeof auditsMap !== 'object') {
      return res.status(400).json({ error: 'Audits map object required' })
    }

    const now = new Date().toISOString()
    const stmt = db.prepare(`
      INSERT INTO page_audits (
        site_id, page_key, is_audited, is_stale, stale_reason, last_audit_timestamp, fingerprint, audit_result_json, updated_at
      ) VALUES (
        @site_id, @page_key, @is_audited, @is_stale, @stale_reason, @last_audit_timestamp, @fingerprint, @audit_result_json, @updated_at
      )
      ON CONFLICT(site_id, page_key) DO UPDATE SET
        is_audited = excluded.is_audited,
        is_stale = excluded.is_stale,
        stale_reason = excluded.stale_reason,
        last_audit_timestamp = excluded.last_audit_timestamp,
        fingerprint = excluded.fingerprint,
        audit_result_json = excluded.audit_result_json,
        updated_at = excluded.updated_at
    `)

    const insertMany = db.transaction((map) => {
      for (const [pageKey, auditRecord] of Object.entries(map)) {
        if (!auditRecord) continue
        stmt.run({
          site_id: id,
          page_key: pageKey,
          is_audited: auditRecord.isAudited ? 1 : 0,
          is_stale: auditRecord.isStale ? 1 : 0,
          stale_reason: auditRecord.staleReason || null,
          last_audit_timestamp: auditRecord.lastAuditTimestamp || null,
          fingerprint: auditRecord.fingerprint || '',
          audit_result_json: auditRecord.auditResult ? JSON.stringify(auditRecord.auditResult) : null,
          updated_at: now
        })
      }
    })

    insertMany(auditsMap)
    res.json({ success: true, siteId: id, count: Object.keys(auditsMap).length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ==========================================
// 5. W5 LINK RECOMMENDATIONS ENDPOINTS
// ==========================================

app.get('/api/websites/:id/link-recommendations', (req, res) => {
  try {
    const { id } = req.params
    const rows = db.prepare(`SELECT * FROM link_recommendations WHERE site_id = ?`).all(id)
    const result = {}
    rows.forEach(r => {
      const parsed = r.rec_json ? JSON.parse(r.rec_json) : {}
      result[r.rec_key] = {
        ...parsed,
        id: r.rec_key,
        sourceUrl: r.source_url || parsed.sourceUrl,
        targetUrl: r.target_url || parsed.targetUrl,
        anchorText: r.anchor_text || parsed.anchorText,
        savedSentence: r.saved_sentence || parsed.savedSentence,
        isSaved: Boolean(r.is_saved),
        updatedAt: r.updated_at
      }
    })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/websites/:id/link-recommendations', (req, res) => {
  try {
    const { id } = req.params
    const recsMap = req.body
    if (!recsMap || typeof recsMap !== 'object') {
      return res.status(400).json({ error: 'Recommendations map object required' })
    }

    const now = new Date().toISOString()
    const stmt = db.prepare(`
      INSERT INTO link_recommendations (
        site_id, rec_key, source_url, target_url, anchor_text, saved_sentence, is_saved, rec_json, updated_at
      ) VALUES (
        @site_id, @rec_key, @source_url, @target_url, @anchor_text, @saved_sentence, @is_saved, @rec_json, @updated_at
      )
      ON CONFLICT(site_id, rec_key) DO UPDATE SET
        source_url = excluded.source_url,
        target_url = excluded.target_url,
        anchor_text = excluded.anchor_text,
        saved_sentence = excluded.saved_sentence,
        is_saved = excluded.is_saved,
        rec_json = excluded.rec_json,
        updated_at = excluded.updated_at
    `)

    const insertMany = db.transaction((map) => {
      for (const [recKey, conf] of Object.entries(map)) {
        if (!conf) continue
        stmt.run({
          site_id: id,
          rec_key: recKey,
          source_url: conf.sourceUrl || '',
          target_url: conf.targetUrl || '',
          anchor_text: conf.anchorText || '',
          saved_sentence: conf.savedSentence || '',
          is_saved: conf.isSaved !== false ? 1 : 0,
          rec_json: JSON.stringify(conf),
          updated_at: now
        })
      }
    })

    insertMany(recsMap)
    res.json({ success: true, siteId: id, count: Object.keys(recsMap).length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ==========================================
// 5. ONE-TIME MIGRATION MECHANISM FROM LOCALSTORAGE
// ==========================================

app.post('/api/migrate-localstorage', (req, res) => {
  try {
    const { sites, packages, pageConfigs, pageAudits } = req.body
    let sitesCount = 0
    let packagesCount = 0
    let configsCount = 0
    let auditsCount = 0

    const now = new Date().toISOString()

    // 1. Migrate Websites
    if (Array.isArray(sites) && sites.length > 0) {
      const stmtSite = db.prepare(`
        INSERT INTO websites (
          id, name, url, platform, portfolio, status, is_audited, last_audit_timestamp, sync_status, last_sync_timestamp, config_data, created_at, updated_at
        ) VALUES (
          @id, @name, @url, @platform, @portfolio, @status, @is_audited, @last_audit_timestamp, @sync_status, @last_sync_timestamp, @config_data, @created_at, @updated_at
        )
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          url = excluded.url,
          platform = excluded.platform,
          portfolio = excluded.portfolio,
          status = excluded.status,
          is_audited = excluded.is_audited,
          last_audit_timestamp = excluded.last_audit_timestamp,
          sync_status = excluded.sync_status,
          last_sync_timestamp = excluded.last_sync_timestamp,
          config_data = excluded.config_data,
          updated_at = excluded.updated_at
      `)

      const insertSites = db.transaction((list) => {
        for (const site of list) {
          const statusVal = typeof site.status === 'object' ? JSON.stringify(site.status) : (site.status || 'Active')
          stmtSite.run({
            id: String(site.id),
            name: site.name || 'Untitled Website',
            url: site.url || '',
            platform: site.platform || 'WordPress',
            portfolio: site.portfolio || 'Primary Portfolio',
            status: statusVal,
            is_audited: site.isAudited ? 1 : 0,
            last_audit_timestamp: site.lastAuditTimestamp || null,
            sync_status: site.syncStatus || 'Synced',
            last_sync_timestamp: site.lastSyncTimestamp || null,
            config_data: site.configData ? JSON.stringify(site.configData) : null,
            created_at: site.createdAt || now,
            updated_at: now
          })
          sitesCount++
        }
      })
      insertSites(sites)
    }

    // 2. Migrate Packages
    if (packages && typeof packages === 'object') {
      const stmtPkg = db.prepare(`
        INSERT INTO wp_packages (site_id, package_data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(site_id) DO UPDATE SET
          package_data = excluded.package_data,
          updated_at = excluded.updated_at
      `)

      const insertPkgs = db.transaction((map) => {
        for (const [siteId, pkg] of Object.entries(map)) {
          if (!pkg) continue
          stmtPkg.run(siteId, JSON.stringify(pkg), now)
          packagesCount++
        }
      })
      insertPkgs(packages)
    }

    // 3. Migrate Page Configs
    if (pageConfigs && typeof pageConfigs === 'object') {
      const stmtConf = db.prepare(`
        INSERT INTO page_configurations (
          site_id, page_key, url, title, target_phrase, seo_page_type, priority, is_excluded, config_json, updated_at
        ) VALUES (
          @site_id, @page_key, @url, @title, @target_phrase, @seo_page_type, @priority, @is_excluded, @config_json, @updated_at
        )
        ON CONFLICT(site_id, page_key) DO UPDATE SET
          url = excluded.url,
          title = excluded.title,
          target_phrase = excluded.target_phrase,
          seo_page_type = excluded.seo_page_type,
          priority = excluded.priority,
          is_excluded = excluded.is_excluded,
          config_json = excluded.config_json,
          updated_at = excluded.updated_at
      `)

      const insertConfigs = db.transaction((siteMap) => {
        for (const [siteId, configsObj] of Object.entries(siteMap)) {
          if (!configsObj || typeof configsObj !== 'object') continue
          for (const [pageKey, conf] of Object.entries(configsObj)) {
            if (!conf) continue
            stmtConf.run({
              site_id: siteId,
              page_key: pageKey,
              url: conf.url || pageKey,
              title: conf.title || conf.proposedTitle || '',
              target_phrase: conf.target || conf.targetPhrase || '',
              seo_page_type: conf.type || conf.seoPageType || '',
              priority: Number(conf.priority) || 0,
              is_excluded: conf.isExcluded || conf.type === 'Excluded' ? 1 : 0,
              config_json: JSON.stringify(conf),
              updated_at: now
            })
            configsCount++
          }
        }
      })
      insertConfigs(pageConfigs)
    }

    // 4. Migrate Page Audits
    if (pageAudits && typeof pageAudits === 'object') {
      const stmtAudit = db.prepare(`
        INSERT INTO page_audits (
          site_id, page_key, is_audited, is_stale, stale_reason, last_audit_timestamp, fingerprint, audit_result_json, updated_at
        ) VALUES (
          @site_id, @page_key, @is_audited, @is_stale, @stale_reason, @last_audit_timestamp, @fingerprint, @audit_result_json, @updated_at
        )
        ON CONFLICT(site_id, page_key) DO UPDATE SET
          is_audited = excluded.is_audited,
          is_stale = excluded.is_stale,
          stale_reason = excluded.stale_reason,
          last_audit_timestamp = excluded.last_audit_timestamp,
          fingerprint = excluded.fingerprint,
          audit_result_json = excluded.audit_result_json,
          updated_at = excluded.updated_at
      `)

      const insertAudits = db.transaction((siteMap) => {
        for (const [siteId, auditsObj] of Object.entries(siteMap)) {
          if (!auditsObj || typeof auditsObj !== 'object') continue
          for (const [pageKey, auditRecord] of Object.entries(auditsObj)) {
            if (!auditRecord) continue
            stmtAudit.run({
              site_id: siteId,
              page_key: pageKey,
              is_audited: auditRecord.isAudited ? 1 : 0,
              is_stale: auditRecord.isStale ? 1 : 0,
              stale_reason: auditRecord.staleReason || null,
              last_audit_timestamp: auditRecord.lastAuditTimestamp || null,
              fingerprint: auditRecord.fingerprint || '',
              audit_result_json: auditRecord.auditResult ? JSON.stringify(auditRecord.auditResult) : null,
              updated_at: now
            })
            auditsCount++
          }
        }
      })
      insertAudits(pageAudits)
    }

    res.json({
      success: true,
      migrated: {
        sites: sitesCount,
        packages: packagesCount,
        configs: configsCount,
        audits: auditsCount
      }
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ==========================================
// 6. GOOGLE RANKINGS (DATAFORSEO LIVE SERP)
// ==========================================

function getDataForSeoCredentials() {
  // 1. Check direct process environment variables
  let login = process.env.DATAFORSEO_LOGIN || process.env.DATAFORSEO_API_LOGIN || ''
  let password = process.env.DATAFORSEO_PASSWORD || process.env.DATAFORSEO_API_PASSWORD || ''

  if (login && password) {
    return { login: login.trim(), password: password.trim() }
  }

  // 2. Scan Website Manager environment files on VPS & local project
  const envPaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'server', '.env'),
    path.join(__dirname, '.env'),
    path.join(__dirname, '..', '.env'),
    '/opt/tse-apps/website-manager/.env',
    '/opt/tse-apps/website-manager/server/.env'
  ]

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8')
        const lines = content.split('\n')
        let fLogin = ''
        let fPass = ''
        for (const line of lines) {
          const clean = line.trim()
          if (!clean || clean.startsWith('#')) continue
          const eqIdx = clean.indexOf('=')
          if (eqIdx > 0) {
            const k = clean.slice(0, eqIdx).trim()
            const v = clean.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
            if (k === 'DATAFORSEO_LOGIN' || k === 'DATAFORSEO_API_LOGIN') fLogin = v
            if (k === 'DATAFORSEO_PASSWORD' || k === 'DATAFORSEO_API_PASSWORD') fPass = v
          }
        }
        if (fLogin && fPass) {
          return { login: fLogin, password: fPass }
        }
      }
    } catch (_e) {}
  }

  // 3. Check SQLite global_settings
  try {
    const row = db.prepare(`SELECT value_json FROM global_settings WHERE key = 'dataforseo_credentials'`).get()
    if (row && row.value_json) {
      const parsed = JSON.parse(row.value_json)
      if (parsed.login && parsed.password) {
        return { login: parsed.login, password: parsed.password }
      }
    }
  } catch (_e) {}

  return null
}

function extractHostnameFromUrl(urlOrDomain) {
  if (!urlOrDomain) return ''
  let clean = String(urlOrDomain).trim().toLowerCase()
  clean = clean.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/^www\./i, '').split(':')[0]
  return clean
}

function normalizeUrlForMatching(url, baseSiteUrl) {
  if (!url) return ''
  let u = String(url).trim().toLowerCase()
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    const base = (baseSiteUrl || '').replace(/\/+$/, '')
    const rel = u.startsWith('/') ? u : `/${u}`
    u = `${base}${rel}`
  }
  u = u.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/#.*$/, '').replace(/\?.*$/, '').replace(/\/+$/, '')
  return u
}

function normalizeDbPageKey(key) {
  if (key === undefined || key === null) return ''
  const str = String(key).trim()
  if (/^\d+\.0$/.test(str)) {
    return str.slice(0, -2)
  }
  return str
}

// GET all stored rankings for a website
app.get('/api/websites/:id/rankings', (req, res) => {
  try {
    const { id } = req.params
    const rows = db.prepare(`SELECT * FROM page_rankings WHERE site_id = ?`).all(id)
    const result = {}
    rows.forEach(r => {
      const cleanKey = normalizeDbPageKey(r.page_key)
      const record = {
        siteId: r.site_id,
        pageKey: cleanKey || r.page_key,
        targetPhrase: r.target_phrase,
        googleRank: r.google_rank,
        isTop100: Boolean(r.is_top_100),
        rankingUrl: r.ranking_url,
        isUrlMatch: Boolean(r.is_url_match),
        searchVolume: r.search_volume !== null && r.search_volume !== undefined ? Number(r.search_volume) : null,
        volumeCheckedAt: r.volume_checked_at,
        searchEngine: r.search_engine || 'google.co.uk',
        locationCode: r.location_code || 2826,
        device: r.device || 'desktop',
        lastCheckedAt: r.last_checked_at,
        updatedAt: r.updated_at
      }
      result[r.page_key] = record
      if (cleanKey && cleanKey !== r.page_key) {
        result[cleanKey] = record
      }
      if (r.ranking_url) {
        result[r.ranking_url] = record
      }
    })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Check rank for a single page Target Phrase via DataForSEO Live Advanced SERP API
async function handleSinglePhraseRankCheck(req, res) {
  try {
    const { id, pageKey: paramPageKey } = req.params
    const rawPageKey = paramPageKey ? decodeURIComponent(paramPageKey) : (req.body?.pageKey || req.query?.pageKey)
    const pageKey = normalizeDbPageKey(rawPageKey)

    if (!id || !pageKey) {
      return res.status(400).json({ success: false, error: 'siteId and pageKey are required' })
    }

    // 1. Fetch website record to determine domain
    const site = getWebsiteByIdFromDb(id)
    if (!site) {
      return res.status(404).json({ success: false, error: `Website with ID '${id}' not found` })
    }

    const siteDomain = extractHostnameFromUrl(site.url || site.name)
    if (!siteDomain) {
      return res.status(400).json({ success: false, error: 'Could not resolve domain from website record' })
    }

    // 2. Fetch page configuration to determine target phrase & URL
    let targetPhrase = (req.body?.targetPhrase || req.body?.target || '').trim()
    let configuredUrl = (req.body?.url || req.body?.configuredUrl || '').trim()

    if (!targetPhrase || !configuredUrl) {
      const configRow = db.prepare(`SELECT * FROM page_configurations WHERE site_id = ? AND page_key = ?`).get(id, pageKey)
      if (configRow) {
        if (!targetPhrase) targetPhrase = (configRow.target_phrase || '').trim()
        if (!configuredUrl) configuredUrl = (configRow.url || '').trim()
      }
    }

    if (!configuredUrl) {
      configuredUrl = pageKey.startsWith('http://') || pageKey.startsWith('https://') || pageKey.startsWith('/') ? pageKey : (site.url || '')
    }

    if (!targetPhrase) {
      return res.status(400).json({ success: false, error: 'Target phrase is not configured for this page' })
    }

    // 3. Resolve DataForSEO Credentials
    const creds = getDataForSeoCredentials()
    if (!creds || !creds.login || !creds.password) {
      return res.status(500).json({
        success: false,
        error: 'DataForSEO credentials not configured on server. Please ensure DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are set.'
      })
    }

    // 4. Query DataForSEO Google Organic SERP Live Advanced API (Mobile Google UK)
    const authHeader = 'Basic ' + Buffer.from(`${creds.login}:${creds.password}`).toString('base64')
    const serpPayload = [
      {
        keyword: targetPhrase,
        location_code: 2826,
        language_code: 'en',
        se_domain: 'google.co.uk',
        device: 'mobile',
        os: 'android',
        depth: 100
      }
    ]

    const serpRes = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(serpPayload),
      signal: AbortSignal.timeout(45000)
    })

    if (!serpRes.ok) {
      const errText = await serpRes.text()
      return res.status(serpRes.status).json({
        success: false,
        error: `DataForSEO API error (${serpRes.status}): ${errText.slice(0, 200)}`
      })
    }

    const serpData = await serpRes.json()
    const task = serpData?.tasks?.[0]

    if (!task || task.status_code !== 20000) {
      return res.status(502).json({
        success: false,
        error: `DataForSEO task failed: ${task?.status_message || 'Unknown error'}`
      })
    }

    const taskCost = task.cost !== undefined ? task.cost : null
    const resultItems = task?.result?.[0]?.items || []

    // 5. Search organic results for target website domain
    let matchedItem = null
    for (const item of resultItems) {
      if (item.type !== 'organic') continue
      const itemDomain = extractHostnameFromUrl(item.domain || item.url || '')
      if (itemDomain && (itemDomain === siteDomain || itemDomain.endsWith('.' + siteDomain) || siteDomain.endsWith('.' + itemDomain))) {
        matchedItem = item
        break
      }
    }

    const now = new Date().toISOString()
    let googleRank = null
    let isTop100 = 0
    let rankingUrl = null
    let isUrlMatch = 0

    if (matchedItem) {
      googleRank = matchedItem.rank_absolute || matchedItem.rank_group || null
      rankingUrl = matchedItem.url || null
      isTop100 = 1

      const normRanking = normalizeUrlForMatching(rankingUrl, site.url)
      const normConfigured = normalizeUrlForMatching(configuredUrl, site.url)
      isUrlMatch = (normRanking && normConfigured && normRanking === normConfigured) ? 1 : 0
    }

    // 6. Save result to page_rankings table
    const stmt = db.prepare(`
      INSERT INTO page_rankings (
        site_id, page_key, target_phrase, google_rank, is_top_100, ranking_url, is_url_match, search_engine, location_code, device, last_checked_at, updated_at
      ) VALUES (
        @site_id, @page_key, @target_phrase, @google_rank, @is_top_100, @ranking_url, @is_url_match, 'google.co.uk', 2826, 'mobile', @last_checked_at, @updated_at
      )
      ON CONFLICT(site_id, page_key) DO UPDATE SET
        target_phrase = excluded.target_phrase,
        google_rank = excluded.google_rank,
        is_top_100 = excluded.is_top_100,
        ranking_url = excluded.ranking_url,
        is_url_match = excluded.is_url_match,
        device = 'mobile',
        last_checked_at = excluded.last_checked_at,
        updated_at = excluded.updated_at
    `)

    stmt.run({
      site_id: id,
      page_key: pageKey,
      target_phrase: targetPhrase,
      google_rank: googleRank,
      is_top_100: isTop100,
      ranking_url: rankingUrl,
      is_url_match: isUrlMatch,
      last_checked_at: now,
      updated_at: now
    })

    // 7. Return clean JSON response
    res.json({
      success: true,
      siteId: id,
      pageKey,
      targetPhrase,
      googleRank,
      isTop100: Boolean(isTop100),
      rankingUrl,
      configuredUrl,
      isUrlMatch: Boolean(isUrlMatch),
      searchEngine: 'google.co.uk',
      locationCode: 2826,
      device: 'mobile',
      lastCheckedAt: now,
      cost: taskCost
    })
  } catch (err) {
    console.error('Error during DataForSEO rank check:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Check UK monthly search volume for a single page Target Phrase via DataForSEO Labs Historical Search Volume API
async function handleSinglePhraseVolumeCheck(req, res) {
  try {
    const { id, pageKey: paramPageKey } = req.params
    const rawPageKey = paramPageKey ? decodeURIComponent(paramPageKey) : (req.body?.pageKey || req.query?.pageKey)
    const pageKey = normalizeDbPageKey(rawPageKey)

    if (!id || !pageKey) {
      return res.status(400).json({ success: false, error: 'siteId and pageKey are required' })
    }

    // 1. Fetch website record
    const site = getWebsiteByIdFromDb(id)
    if (!site) {
      return res.status(404).json({ success: false, error: `Website with ID '${id}' not found` })
    }

    // 2. Fetch page configuration to determine target phrase
    let targetPhrase = (req.body?.targetPhrase || req.body?.target || '').trim()
    if (!targetPhrase) {
      const configRow = db.prepare(`SELECT * FROM page_configurations WHERE site_id = ? AND page_key = ?`).get(id, pageKey)
      if (configRow) {
        targetPhrase = (configRow.target_phrase || '').trim()
      }
    }

    if (!targetPhrase) {
      return res.status(400).json({ success: false, error: 'Target phrase is not configured for this page' })
    }

    // 3. Resolve DataForSEO Credentials
    const creds = getDataForSeoCredentials()
    if (!creds || !creds.login || !creds.password) {
      return res.status(500).json({
        success: false,
        error: 'DataForSEO credentials not configured on server. Please ensure DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are set.'
      })
    }

    // 4. Query DataForSEO Historical Search Volume API
    const authHeader = 'Basic ' + Buffer.from(`${creds.login}:${creds.password}`).toString('base64')
    const volumePayload = [
      {
        keywords: [targetPhrase],
        location_code: 2826,
        language_code: 'en'
      }
    ]

    const volumeRes = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/historical_search_volume/live', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(volumePayload),
      signal: AbortSignal.timeout(30000)
    })

    if (!volumeRes.ok) {
      const errText = await volumeRes.text()
      return res.status(volumeRes.status).json({
        success: false,
        error: `DataForSEO API error (${volumeRes.status}): ${errText.slice(0, 200)}`
      })
    }

    const volumeData = await volumeRes.json()
    const task = volumeData?.tasks?.[0]

    if (!task || task.status_code !== 20000) {
      return res.status(502).json({
        success: false,
        error: `DataForSEO task failed: ${task?.status_message || 'Unknown error'}`
      })
    }

    const taskCost = task.cost !== undefined ? task.cost : null
    const item = task?.result?.[0]?.items?.[0]
    const searchVolume = item?.keyword_info?.search_volume !== undefined && item?.keyword_info?.search_volume !== null
      ? Number(item.keyword_info.search_volume)
      : (item?.search_volume !== undefined && item?.search_volume !== null ? Number(item.search_volume) : null)

    const now = new Date().toISOString()

    // 5. Save result to page_rankings table
    const stmt = db.prepare(`
      INSERT INTO page_rankings (
        site_id, page_key, target_phrase, search_volume, volume_checked_at, last_checked_at, updated_at
      ) VALUES (
        @site_id, @page_key, @target_phrase, @search_volume, @volume_checked_at, @last_checked_at, @updated_at
      )
      ON CONFLICT(site_id, page_key) DO UPDATE SET
        target_phrase = excluded.target_phrase,
        search_volume = excluded.search_volume,
        volume_checked_at = excluded.volume_checked_at,
        updated_at = excluded.updated_at
    `)

    stmt.run({
      site_id: id,
      page_key: pageKey,
      target_phrase: targetPhrase,
      search_volume: searchVolume,
      volume_checked_at: now,
      last_checked_at: now,
      updated_at: now
    })

    // 6. Return response
    res.json({
      success: true,
      siteId: id,
      pageKey,
      targetPhrase,
      searchVolume,
      volumeCheckedAt: now,
      cost: taskCost
    })
  } catch (err) {
    console.error('Error during DataForSEO volume check:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Batch Check Search Volume across configured target phrases (1 single DataForSEO Labs request)
async function handleBatchVolumeCheck(req, res) {
  try {
    const { id } = req.params
    const site = getWebsiteByIdFromDb(id)
    if (!site) {
      return res.status(404).json({ success: false, error: `Website with ID '${id}' not found` })
    }

    // 1. Collect target phrases to check
    let items = req.body?.items
    if (!items || !Array.isArray(items) || items.length === 0) {
      const configRows = db.prepare(`
        SELECT page_key, target_phrase, url
        FROM page_configurations
        WHERE site_id = ? AND is_excluded = 0 AND trim(target_phrase) != ''
      `).all(id)
      items = configRows.map(r => ({
        pageKey: r.page_key,
        targetPhrase: r.target_phrase.trim(),
        url: r.url
      }))
    }

    if (items.length === 0) {
      return res.json({ success: true, count: 0, message: 'No target phrases found to check' })
    }

    const creds = getDataForSeoCredentials()
    if (!creds || !creds.login || !creds.password) {
      return res.status(500).json({ success: false, error: 'DataForSEO credentials not configured on server.' })
    }

    // Deduplicate keyword list
    const uniqueKeywords = Array.from(new Set(items.map(i => i.targetPhrase.trim()).filter(Boolean)))
    if (uniqueKeywords.length === 0) {
      return res.json({ success: true, count: 0, message: 'No valid target phrases found' })
    }

    const authHeader = 'Basic ' + Buffer.from(`${creds.login}:${creds.password}`).toString('base64')
    const volumePayload = [
      {
        keywords: uniqueKeywords,
        location_code: 2826,
        language_code: 'en'
      }
    ]

    const volumeRes = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/historical_search_volume/live', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(volumePayload),
      signal: AbortSignal.timeout(60000)
    })

    if (!volumeRes.ok) {
      const errText = await volumeRes.text()
      return res.status(volumeRes.status).json({
        success: false,
        error: `DataForSEO API error (${volumeRes.status}): ${errText.slice(0, 200)}`
      })
    }

    const volumeData = await volumeRes.json()
    const task = volumeData?.tasks?.[0]
    if (!task || task.status_code !== 20000) {
      return res.status(502).json({
        success: false,
        error: `DataForSEO batch task failed: ${task?.status_message || 'Unknown error'}`
      })
    }

    const taskCost = task.cost !== undefined ? task.cost : null
    const resultItems = task?.result?.[0]?.items || []

    // Build map keyword -> search volume
    const volumeByKeyword = new Map()
    for (const rItem of resultItems) {
      const kw = (rItem.keyword || '').trim().toLowerCase()
      const vol = rItem?.keyword_info?.search_volume !== undefined && rItem?.keyword_info?.search_volume !== null
        ? Number(rItem.keyword_info.search_volume)
        : (rItem?.search_volume !== undefined && rItem?.search_volume !== null ? Number(rItem.search_volume) : 0)
      if (kw) {
        volumeByKeyword.set(kw, vol)
      }
    }

    const now = new Date().toISOString()
    const stmt = db.prepare(`
      INSERT INTO page_rankings (
        site_id, page_key, target_phrase, search_volume, volume_checked_at, last_checked_at, updated_at
      ) VALUES (
        @site_id, @page_key, @target_phrase, @search_volume, @volume_checked_at, @last_checked_at, @updated_at
      )
      ON CONFLICT(site_id, page_key) DO UPDATE SET
        target_phrase = excluded.target_phrase,
        search_volume = excluded.search_volume,
        volume_checked_at = excluded.volume_checked_at,
        updated_at = excluded.updated_at
    `)

    const updateMany = db.transaction((pageItems) => {
      for (const p of pageItems) {
        const kwLower = p.targetPhrase.toLowerCase()
        const vol = volumeByKeyword.has(kwLower) ? volumeByKeyword.get(kwLower) : null
        const cleanKey = normalizeDbPageKey(p.pageKey)
        stmt.run({
          site_id: id,
          page_key: cleanKey || p.pageKey,
          target_phrase: p.targetPhrase,
          search_volume: vol,
          volume_checked_at: now,
          last_checked_at: now,
          updated_at: now
        })
      }
    })

    updateMany(items)

    res.json({
      success: true,
      siteId: id,
      phrasesChecked: uniqueKeywords.length,
      pagesUpdated: items.length,
      cost: taskCost,
      timestamp: now
    })
  } catch (err) {
    console.error('Error during DataForSEO batch volume check:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Submit Batch of Mobile Rank Tasks via DataForSEO Standard Queue (POST /v3/serp/google/organic/task_post)
// Deduplicates identical target phrases across the site so exactly ONE task is submitted per phrase
async function handleSubmitRankBatch(req, res) {
  try {
    const { id } = req.params
    const site = getWebsiteByIdFromDb(id)
    if (!site) {
      return res.status(404).json({ success: false, error: `Website with ID '${id}' not found` })
    }

    let items = req.body?.items
    if (!items || !Array.isArray(items) || items.length === 0) {
      const configRows = db.prepare(`
        SELECT page_key, target_phrase, url
        FROM page_configurations
        WHERE site_id = ? AND is_excluded = 0 AND trim(target_phrase) != ''
      `).all(id)
      items = configRows.map(r => ({
        pageKey: r.page_key,
        targetPhrase: r.target_phrase.trim(),
        configuredUrl: r.url || r.page_key
      }))
    }

    if (items.length === 0) {
      return res.json({ success: true, count: 0, message: 'No target phrases found to queue' })
    }

    const creds = getDataForSeoCredentials()
    if (!creds || !creds.login || !creds.password) {
      return res.status(500).json({ success: false, error: 'DataForSEO credentials not configured on server.' })
    }

    // Group items by normalized target phrase (case-insensitive deduplication)
    const phraseGroupMap = new Map()
    for (const item of items) {
      const phrase = (item.targetPhrase || '').trim()
      if (!phrase) continue
      const phraseKey = phrase.toLowerCase()
      if (!phraseGroupMap.has(phraseKey)) {
        phraseGroupMap.set(phraseKey, {
          targetPhrase: phrase,
          pages: []
        })
      }
      phraseGroupMap.get(phraseKey).pages.push(item)
    }

    const uniquePhraseGroups = Array.from(phraseGroupMap.values())
    if (uniquePhraseGroups.length === 0) {
      return res.json({ success: true, count: 0, message: 'No valid target phrases found' })
    }

    const authHeader = 'Basic ' + Buffer.from(`${creds.login}:${creds.password}`).toString('base64')
    const now = new Date().toISOString()

    // Up to 100 unique tasks per batch
    const taskPayload = uniquePhraseGroups.slice(0, 100).map((group, index) => ({
      keyword: group.targetPhrase,
      location_code: 2826,
      language_code: 'en',
      se_domain: 'google.co.uk',
      device: 'mobile',
      os: 'android',
      depth: 100,
      tag: String(index)
    }))

    const postRes = await fetch('https://api.dataforseo.com/v3/serp/google/organic/task_post', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(taskPayload),
      signal: AbortSignal.timeout(45000)
    })

    if (!postRes.ok) {
      const errText = await postRes.text()
      return res.status(postRes.status).json({
        success: false,
        error: `DataForSEO API error (${postRes.status}): ${errText.slice(0, 200)}`
      })
    }

    const postData = await postRes.json()
    const tasks = postData?.tasks || []
    let totalCost = 0

    const queueStmt = db.prepare(`
      INSERT INTO serp_task_queue (
        task_id, site_id, page_key, target_phrase, configured_url, device, status, submitted_at, cost
      ) VALUES (
        @task_id, @site_id, @page_key, @target_phrase, @configured_url, 'mobile', 'pending', @submitted_at, @cost
      )
      ON CONFLICT(task_id, page_key) DO UPDATE SET
        status = 'pending',
        submitted_at = excluded.submitted_at
    `)

    const insertedTaskIds = []
    const queueTx = db.transaction(() => {
      tasks.forEach((t, i) => {
        if (t && t.id && uniquePhraseGroups[i]) {
          const group = uniquePhraseGroups[i]
          const cost = t.cost || 0
          totalCost += cost
          insertedTaskIds.push(t.id)

          // Insert a queue record for EVERY page sharing this target phrase
          for (const pageItem of group.pages) {
            queueStmt.run({
              task_id: t.id,
              site_id: id,
              page_key: pageItem.pageKey,
              target_phrase: group.targetPhrase,
              configured_url: pageItem.configuredUrl || pageItem.pageKey,
              submitted_at: now,
              cost: cost
            })
          }
        }
      })
    })

    queueTx()

    res.json({
      success: true,
      siteId: id,
      uniquePhrasesQueued: insertedTaskIds.length,
      pagesMapped: items.length,
      totalCost,
      taskIds: insertedTaskIds
    })
  } catch (err) {
    console.error('Error during DataForSEO submit rank batch:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Collect Completed Standard Queue SERP Tasks (GET /v3/serp/google/organic/task_get/advanced/{id})
async function handleCollectRankBatch(req, res) {
  try {
    const { id } = req.params
    const site = getWebsiteByIdFromDb(id)
    if (!site) {
      return res.status(404).json({ success: false, error: `Website with ID '${id}' not found` })
    }

    const siteDomain = extractHostnameFromUrl(site.url || site.name)
    const creds = getDataForSeoCredentials()
    if (!creds || !creds.login || !creds.password) {
      return res.status(500).json({ success: false, error: 'DataForSEO credentials not configured on server.' })
    }

    const authHeader = 'Basic ' + Buffer.from(`${creds.login}:${creds.password}`).toString('base64')

    // Find pending queue records
    const pendingRows = db.prepare(`
      SELECT * FROM serp_task_queue
      WHERE site_id = ? AND status = 'pending'
      ORDER BY submitted_at ASC
    `).all(id)

    if (pendingRows.length === 0) {
      return res.json({ success: true, message: 'No pending tasks found for site', completedCount: 0, pendingCount: 0 })
    }

    // Group pending rows by task_id
    const taskGroups = new Map()
    for (const row of pendingRows) {
      if (!taskGroups.has(row.task_id)) {
        taskGroups.set(row.task_id, [])
      }
      taskGroups.get(row.task_id).push(row)
    }

    const completed = []
    const stillPending = []
    const now = new Date().toISOString()

    const upsertRankingStmt = db.prepare(`
      INSERT INTO page_rankings (
        site_id, page_key, target_phrase, google_rank, is_top_100, ranking_url, is_url_match, search_engine, location_code, device, last_checked_at, updated_at
      ) VALUES (
        @site_id, @page_key, @target_phrase, @google_rank, @is_top_100, @ranking_url, @is_url_match, 'google.co.uk', 2826, 'mobile', @last_checked_at, @updated_at
      )
      ON CONFLICT(site_id, page_key) DO UPDATE SET
        target_phrase = excluded.target_phrase,
        google_rank = excluded.google_rank,
        is_top_100 = excluded.is_top_100,
        ranking_url = excluded.ranking_url,
        is_url_match = excluded.is_url_match,
        device = 'mobile',
        last_checked_at = excluded.last_checked_at,
        updated_at = excluded.updated_at
    `)

    const updateQueueStmt = db.prepare(`
      UPDATE serp_task_queue
      SET status = 'completed', completed_at = ?
      WHERE task_id = ?
    `)

    for (const [taskId, queueRows] of taskGroups.entries()) {
      try {
        const getRes = await fetch(`https://api.dataforseo.com/v3/serp/google/organic/task_get/advanced/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(30000)
        })

        if (!getRes.ok) {
          stillPending.push(taskId)
          continue
        }

        const getData = await getRes.json()
        const taskObj = getData?.tasks?.[0]
        if (!taskObj || taskObj.status_code !== 20000 || !taskObj.result) {
          stillPending.push(taskId)
          continue
        }

        const resultItems = taskObj.result?.[0]?.items || []
        let matchedItem = null
        // 1. Iterate organic results in ranking order
        for (const item of resultItems) {
          if (item.type !== 'organic') continue
          const itemDomain = extractHostnameFromUrl(item.domain || item.url || '')
          // 2. Find the FIRST/HIGHEST result belonging to the website domain
          if (itemDomain && siteDomain && (itemDomain === siteDomain || itemDomain.endsWith('.' + siteDomain) || siteDomain.endsWith('.' + itemDomain))) {
            matchedItem = item
            break
          }
        }

        let googleRank = null
        let isTop100 = 0
        let rankingUrl = null

        if (matchedItem) {
          // 3. Highest site result sets google_rank and ranking_url
          googleRank = matchedItem.rank_absolute || matchedItem.rank_group || null
          rankingUrl = matchedItem.url || null
          isTop100 = 1
        }

        // 4. Distribute this single site rank to EVERY page row configured with this target phrase
        for (const qTask of queueRows) {
          let isUrlMatch = 0
          if (matchedItem && rankingUrl && qTask.configured_url) {
            const normRanking = normalizeUrlForMatching(rankingUrl, site.url)
            const normConfigured = normalizeUrlForMatching(qTask.configured_url, site.url)
            isUrlMatch = (normRanking && normConfigured && normRanking === normConfigured) ? 1 : 0
          }

          upsertRankingStmt.run({
            site_id: id,
            page_key: qTask.page_key,
            target_phrase: qTask.target_phrase,
            google_rank: googleRank,
            is_top_100: isTop100,
            ranking_url: rankingUrl,
            is_url_match: isUrlMatch,
            last_checked_at: now,
            updated_at: now
          })

          completed.push({
            pageKey: qTask.page_key,
            targetPhrase: qTask.target_phrase,
            googleRank,
            isTop100: Boolean(isTop100),
            rankingUrl,
            isUrlMatch: Boolean(isUrlMatch)
          })
        }

        updateQueueStmt.run(now, taskId)
      } catch (err) {
        console.error(`Error retrieving task ${taskId}:`, err)
        stillPending.push(taskId)
      }
    }

    res.json({
      success: true,
      siteId: id,
      completedCount: completed.length,
      pendingCount: stillPending.length,
      completed,
      stillPending
    })
  } catch (err) {
    console.error('Error during DataForSEO collect rank batch:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

app.post('/api/websites/:id/check-rank', handleSinglePhraseRankCheck)
app.post('/api/websites/:id/pages/:pageKey/check-rank', handleSinglePhraseRankCheck)
app.post('/api/websites/:id/check-volume', handleSinglePhraseVolumeCheck)
app.post('/api/websites/:id/pages/:pageKey/check-volume', handleSinglePhraseVolumeCheck)
app.post('/api/websites/:id/batch-volume-check', handleBatchVolumeCheck)
app.post('/api/websites/:id/tasks/submit-rank-batch', handleSubmitRankBatch)
app.post('/api/websites/:id/tasks/collect-rank-batch', handleCollectRankBatch)

// ==========================================
// GLOBAL SETTINGS: URL EXCLUSIONS
// ==========================================

function getStoredUrlExclusions() {
  let activeRules = DEFAULT_EXCLUSION_RULES
  try {
    const row = db.prepare(`SELECT value_json FROM global_settings WHERE key = 'url_exclusions'`).get()
    if (row && row.value_json) {
      const parsed = JSON.parse(row.value_json)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge any new default rules that might not be in the stored array
        const existingIds = new Set(parsed.map(r => r.id))
        const missingDefaults = DEFAULT_EXCLUSION_RULES.filter(r => !existingIds.has(r.id))
        if (missingDefaults.length > 0) {
          activeRules = [...parsed, ...missingDefaults]
          const now = new Date().toISOString()
          db.prepare(`
            UPDATE global_settings SET value_json = ?, updated_at = ? WHERE key = 'url_exclusions'
          `).run(JSON.stringify(activeRules), now)
        } else {
          activeRules = parsed
        }
        return activeRules
      }
    }
  } catch (e) {
    console.error('Error fetching stored url exclusions:', e)
  }
  // If not present in DB, initialize with default rules and persist
  try {
    const now = new Date().toISOString()
    db.prepare(`
      INSERT INTO global_settings (key, value_json, updated_at)
      VALUES ('url_exclusions', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `).run(JSON.stringify(DEFAULT_EXCLUSION_RULES), now)
  } catch (e) {
    console.error('Error seeding default url exclusions:', e)
  }
  return DEFAULT_EXCLUSION_RULES
}

export function applyGlobalExclusionsToDatabase() {
  try {
    const rules = getStoredUrlExclusions()
    const now = new Date().toISOString()
    const pageRows = db.prepare(`SELECT site_id, page_key, url, title, is_excluded, seo_page_type FROM page_configurations`).all()
    const updatePageStmt = db.prepare(`
      UPDATE page_configurations
      SET is_excluded = 1,
          seo_page_type = 'Excluded',
          priority = 0,
          updated_at = ?
      WHERE site_id = ? AND page_key = ?
    `)

    const restorePageStmt = db.prepare(`
      UPDATE page_configurations
      SET is_excluded = 0,
          seo_page_type = 'Landing',
          priority = 2,
          updated_at = ?
      WHERE site_id = ? AND page_key = ? AND (seo_page_type = 'Excluded' OR is_excluded = 1)
    `)

    let updatedCount = 0
    for (const row of pageRows) {
      const urlInfo = normalizeUrlForExclusionCheck(row.url || row.page_key || '')
      const lowerTitle = String(row.title || '').toLowerCase().trim()
      const isCaseStudy = urlInfo.pathname.includes('/case-study/') || urlInfo.pathname.includes('/case-studies/') || urlInfo.cleanSlug === 'case-studies' || urlInfo.cleanSlug === 'case-study' || urlInfo.slugSegments.includes('case-studies') || urlInfo.slugSegments.includes('case-study')
      const isPortfolio = urlInfo.pathname.includes('/portfolio/') || urlInfo.pathname.includes('/portfolios/') || urlInfo.cleanSlug === 'portfolio' || urlInfo.cleanSlug === 'portfolios' || urlInfo.slugSegments.includes('portfolio') || urlInfo.slugSegments.includes('portfolios')

      let shouldExclude = isPortfolio || isCaseStudy
      if (!shouldExclude) {
        for (const rule of rules) {
          if (testExclusionRule(rule, urlInfo, lowerTitle)) {
            shouldExclude = true
            break
          }
        }
      }

      if (shouldExclude && (row.is_excluded !== 1 || row.seo_page_type !== 'Excluded')) {
        updatePageStmt.run(now, row.site_id, row.page_key)
        updatedCount++
      } else if (!shouldExclude && row.is_excluded === 1 && row.seo_page_type === 'Excluded' && row.url && row.url.includes('portfolio-websites-for-designers')) {
        restorePageStmt.run(now, row.site_id, row.page_key)
        updatedCount++
      }
    }
    if (updatedCount > 0) {
      console.log(`[URL_EXCLUSIONS] Retroactive classification applied: ${updatedCount} pages updated in database.`)
    }
    return updatedCount
  } catch (err) {
    console.error('[URL_EXCLUSIONS] Error applying exclusions to database:', err)
    return 0
  }
}

// Run initial exclusion synchronization on database load
applyGlobalExclusionsToDatabase()

// GET /api/global-settings/url-exclusions
app.get('/api/global-settings/url-exclusions', (req, res) => {
  try {
    const rules = getStoredUrlExclusions()
    res.json({ success: true, rules })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// POST /api/global-settings/url-exclusions/recalculate
app.post('/api/global-settings/url-exclusions/recalculate', (req, res) => {
  try {
    const updatedCount = applyGlobalExclusionsToDatabase()
    res.json({ success: true, updatedCount })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// POST /api/global-settings/url-exclusions
app.post('/api/global-settings/url-exclusions', (req, res) => {
  try {
    const { pattern, matchType, category, description } = req.body || {}
    if (!pattern || !String(pattern).trim()) {
      return res.status(400).json({ success: false, error: 'Pattern is required.' })
    }

    const cleanPattern = String(pattern).trim()
    const newRule = {
      id: `ex-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      pattern: cleanPattern,
      matchType: matchType || 'path-segment',
      category: category || 'Custom',
      description: description ? String(description).trim() : `Custom rule for ${cleanPattern}`
    }

    const currentRules = getStoredUrlExclusions()
    const updatedRules = [newRule, ...currentRules]
    const now = new Date().toISOString()

    // 1. Save updated rules to global_settings table
    db.prepare(`
      INSERT INTO global_settings (key, value_json, updated_at)
      VALUES ('url_exclusions', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `).run(JSON.stringify(updatedRules), now)

    // 2. Immediate Retroactive Re-classification across all websites in database
    let retroactivelyExcludedCount = 0

    // Scan page_configurations table
    try {
      const pageRows = db.prepare(`SELECT site_id, page_key, url, title, is_excluded, seo_page_type FROM page_configurations`).all()
      const updatePageStmt = db.prepare(`
        UPDATE page_configurations
        SET is_excluded = 1,
            seo_page_type = 'Excluded',
            priority = 0,
            updated_at = ?
        WHERE site_id = ? AND page_key = ?
      `)

      for (const row of pageRows) {
        if (row.is_excluded === 1 && row.seo_page_type === 'Excluded') continue
        const urlInfo = normalizeUrlForExclusionCheck(row.url || '')
        const lowerTitle = String(row.title || '').toLowerCase().trim()
        if (testExclusionRule(newRule, urlInfo, lowerTitle)) {
          updatePageStmt.run(now, row.site_id, row.page_key)
          retroactivelyExcludedCount++
        }
      }
    } catch (e) {
      console.error('Error scanning page_configurations for retroactive exclusion:', e)
    }

    // Also scan websites config_data where pageConfigurations or pageOverrides might exist
    try {
      const websites = db.prepare(`SELECT id, config_data FROM websites`).all()
      const updateWebsitesStmt = db.prepare(`UPDATE websites SET config_data = ?, updated_at = ? WHERE id = ?`)

      for (const site of websites) {
        if (!site.config_data) continue
        try {
          const config = JSON.parse(site.config_data)
          let modified = false
          if (config.pageConfigurations && typeof config.pageConfigurations === 'object') {
            for (const [key, pConf] of Object.entries(config.pageConfigurations)) {
              if (pConf.isExcluded && pConf.seoPageType === 'Excluded') continue
              const urlInfo = normalizeUrlForExclusionCheck(pConf.url || pConf.link || key)
              const lowerTitle = String(pConf.title || '').toLowerCase().trim()
              if (testExclusionRule(newRule, urlInfo, lowerTitle)) {
                config.pageConfigurations[key] = {
                  ...pConf,
                  isExcluded: true,
                  seoPageType: 'Excluded',
                  type: 'Excluded',
                  priority: 0
                }
                modified = true
                retroactivelyExcludedCount++
              }
            }
          }
          if (config.pageOverrides && typeof config.pageOverrides === 'object') {
            for (const [key, pConf] of Object.entries(config.pageOverrides)) {
              if (pConf.isExcluded && pConf.seoPageType === 'Excluded') continue
              const urlInfo = normalizeUrlForExclusionCheck(pConf.url || pConf.link || key)
              const lowerTitle = String(pConf.title || '').toLowerCase().trim()
              if (testExclusionRule(newRule, urlInfo, lowerTitle)) {
                config.pageOverrides[key] = {
                  ...pConf,
                  isExcluded: true,
                  seoPageType: 'Excluded',
                  type: 'Excluded',
                  priority: 0
                }
                modified = true
              }
            }
          }
          if (modified) {
            updateWebsitesStmt.run(JSON.stringify(config), now, site.id)
          }
        } catch (_siteErr) {}
      }
    } catch (e) {
      console.error('Error scanning websites config_data for retroactive exclusion:', e)
    }

    res.json({
      success: true,
      rule: newRule,
      rules: updatedRules,
      retroactivelyExcludedCount
    })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// DELETE /api/global-settings/url-exclusions/:id
app.delete('/api/global-settings/url-exclusions/:id', (req, res) => {
  try {
    const { id } = req.params
    const currentRules = getStoredUrlExclusions()
    const updatedRules = currentRules.filter(r => r.id !== id)
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO global_settings (key, value_json, updated_at)
      VALUES ('url_exclusions', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `).run(JSON.stringify(updatedRules), now)

    // Note: Per requirement 8, removing a global exclusion does NOT turn previously excluded pages back into target pages
    res.json({ success: true, rules: updatedRules })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// ==========================================
// ON-SITE ARTICLE AUTOMATION ENDPOINTS
// ==========================================

function getWebsiteWpCredentials(siteId) {
  const site = getWebsiteByIdFromDb(siteId)
  if (!site) return { site: null, username: '', password: '', siteUrl: '' }
  let configData = {}
  try {
    if (site.config_data) configData = JSON.parse(site.config_data)
  } catch (_e) {}

  const username = configData.wpUser || site.wp_user || configData.connectedUser || ''
  const password = configData.wpPass || site.wp_pass || ''
  const siteUrl = (site.url || '').trim().replace(/\/+$/, '')

  return { site, username, password, siteUrl }
}

// GET /api/websites/:id/categories
app.get('/api/websites/:id/categories', async (req, res) => {
  try {
    const { id } = req.params
    const { site, username, password, siteUrl } = getWebsiteWpCredentials(id)
    if (!site) return res.status(404).json({ success: false, error: `Website ${id} not found.` })
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'WordPress credentials not configured for this website.' })
    }

    const authHeader = 'Basic ' + Buffer.from(`${username}:${password.replace(/\s/g, '')}`).toString('base64')
    const catUrl = `${siteUrl}/wp-json/wp/v2/categories?per_page=100&context=view`

    const wpRes = await fetch(catUrl, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json'
      }
    })

    if (!wpRes.ok) {
      return res.status(wpRes.status).json({ success: false, error: `WordPress categories API returned status ${wpRes.status}` })
    }

    const categories = await wpRes.json()
    const cleanList = Array.isArray(categories) ? categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: c.count,
      parent: c.parent
    })) : []

    res.json({ success: true, siteId: id, categories: cleanList })
  } catch (err) {
    console.error('Error fetching WP categories:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/articles/suggest-opportunity
app.post('/api/articles/suggest-opportunity', (req, res) => {
  try {
    const { siteId, targetPage } = req.body || {}
    if (!siteId || !targetPage) {
      return res.status(400).json({ success: false, error: 'siteId and targetPage are required.' })
    }

    const site = getWebsiteByIdFromDb(siteId)
    if (!site) return res.status(404).json({ success: false, error: `Website ${siteId} not found.` })

    let existingPosts = []
    try {
      const pkgRow = db.prepare('SELECT package_data FROM wp_packages WHERE site_id = ?').get(siteId)
      if (pkgRow && pkgRow.package_data) {
        const parsed = JSON.parse(pkgRow.package_data)
        existingPosts = Array.isArray(parsed.posts) ? parsed.posts : (Array.isArray(parsed.packageData?.posts) ? parsed.packageData.posts : [])
      }
    } catch (_e) {}

    const opp = suggestArticleOpportunity({ targetPage, site, existingPosts })
    res.json({ success: true, opportunity: opp })
  } catch (err) {
    console.error('Error suggesting article opportunity:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/hub-content/batch-generate & POST /api/articles/batch-generate
const handleBatchGenerateArticles = async (req, res) => {
  try {
    const { siteIds = [], provider, model } = req.body || {}
    if (!Array.isArray(siteIds) || siteIds.length === 0) {
      return res.status(400).json({ success: false, error: 'siteIds array is required.' })
    }

    const results = []
    const errors = []

    for (const siteId of siteIds) {
      try {
        const site = getWebsiteByIdFromDb(siteId)
        if (!site) {
          errors.push({ siteId, error: `Website ${siteId} not found in database.` })
          continue
        }

        const cleanSiteUrl = (site.url || '').trim().replace(/\/+$/, '')
        const siteDomain = cleanSiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]

        // 1. Get existing posts for deduplication
        let existingPosts = []
        try {
          const pkgRow = db.prepare('SELECT package_data FROM wp_packages WHERE site_id = ?').get(siteId)
          if (pkgRow && pkgRow.package_data) {
            const parsed = JSON.parse(pkgRow.package_data)
            existingPosts = Array.isArray(parsed.posts) ? parsed.posts : (Array.isArray(parsed.packageData?.posts) ? parsed.packageData.posts : [])
          }
        } catch (_e) {}

        // 2. Get page configs and rankings
        let pageConfigs = []
        try {
          pageConfigs = db.prepare('SELECT * FROM page_configurations WHERE site_id = ? AND is_excluded = 0').all(siteId) || []
        } catch (_e) {}

        if (pageConfigs.length === 0) {
          try {
            const pkgRow = db.prepare('SELECT package_data FROM wp_packages WHERE site_id = ?').get(siteId)
            if (pkgRow && pkgRow.package_data) {
              const parsed = JSON.parse(pkgRow.package_data)
              const rawPages = Array.isArray(parsed.pages) ? parsed.pages : (Array.isArray(parsed.packageData?.pages) ? parsed.packageData.pages : [])
              pageConfigs = rawPages.map(p => ({
                url: p.url || p.link,
                title: p.title || p.name,
                target_phrase: p.targetPhrase || p.target,
                is_starred: Boolean(p.isStarred || p.starred),
                is_excluded: Boolean(p.isExcluded)
              }))
            }
          } catch (_e) {}
        }

        let pageRankings = []
        try {
          pageRankings = db.prepare('SELECT * FROM page_rankings WHERE site_id = ?').all(siteId) || []
        } catch (_e) {}

        // 3. Formulate opportunity automatically with priority pages & clean business name
        const opp = suggestArticleOpportunityForSite({ site, existingPosts, pageConfigs, pageRankings })

        // 4. Generate AI article
        const genResult = await generateOnsiteArticle({
          promptData: {
            businessName: opp.businessName,
            siteDomain: opp.siteDomain,
            proposedTitle: opp.proposedTitle,
            primaryTopic: opp.primaryTopic,
            priorityPages: opp.priorityPages,
            targetPageUrl: opp.targetHubUrl,
            targetAnchor: opp.suggestedAnchor || opp.targetPhrase || 'our services',
            targetPhrase: opp.targetPhrase,
            notes: ''
          },
          provider: provider || 'claude',
          model
        })

        const draftId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        const now = new Date().toISOString()
        const internalLinksJson = JSON.stringify(genResult.internalLinksAdded || [])

        db.prepare(`
          INSERT INTO article_drafts (
            id, site_id, target_page_url, target_page_title, target_phrase, topic,
            title, meta_title, meta_description, slug, body_html,
            primary_link_url, primary_link_anchor, secondary_links_json, status, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, 'Draft', ?, ?
          )
        `).run(
          draftId,
          siteId,
          opp.targetHubUrl,
          opp.targetHubTitle || '',
          opp.targetPhrase || '',
          opp.primaryTopic || '',
          genResult.title,
          genResult.metaTitle,
          genResult.metaDescription,
          genResult.slug,
          genResult.bodyHtml,
          opp.targetHubUrl,
          opp.suggestedAnchor || opp.targetPhrase || '',
          internalLinksJson,
          now,
          now
        )

        results.push({
          siteId,
          siteName: opp.businessName,
          businessName: opp.businessName,
          domain: opp.siteDomain,
          siteUrl: cleanSiteUrl,
          draftId,
          targetPageUrl: opp.targetHubUrl,
          targetPhrase: opp.targetPhrase,
          title: genResult.title,
          metaTitle: genResult.metaTitle,
          metaDescription: genResult.metaDescription,
          slug: genResult.slug,
          bodyHtml: genResult.bodyHtml,
          internalLinksAdded: genResult.internalLinksAdded || [],
          secondaryLinksJson: internalLinksJson,
          status: 'Draft',
          createdAt: now
        })
      } catch (siteErr) {
        console.error(`Error generating article for site ${siteId}:`, siteErr)
        errors.push({ siteId, error: siteErr.message || 'Generation error' })
      }
    }

    res.json({
      success: true,
      results,
      errors,
      totalRequested: siteIds.length,
      totalGenerated: results.length
    })
  } catch (err) {
    console.error('Batch generate error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

app.post('/api/hub-content/batch-generate', handleBatchGenerateArticles)
app.post('/api/articles/batch-generate', handleBatchGenerateArticles)

// POST /api/articles/generate
app.post('/api/articles/generate', async (req, res) => {
  try {
    const {
      siteId,
      targetPageUrl,
      targetPageTitle,
      targetPhrase,
      proposedTitle,
      primaryTopic,
      targetAnchor,
      notes,
      provider,
      model
    } = req.body || {}

    if (!siteId || !targetPageUrl || !proposedTitle) {
      return res.status(400).json({ success: false, error: 'siteId, targetPageUrl, and proposedTitle are required.' })
    }

    const site = getWebsiteByIdFromDb(siteId)
    if (!site) return res.status(404).json({ success: false, error: `Website ${siteId} not found.` })

    const cleanSiteUrl = (site.url || '').trim().replace(/\/+$/, '')
    const siteDomain = cleanSiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]

    const genResult = await generateOnsiteArticle({
      promptData: {
        siteDomain,
        proposedTitle,
        primaryTopic,
        targetPageUrl,
        targetAnchor: targetAnchor || targetPhrase || 'our services',
        targetPhrase,
        notes
      },
      provider: provider || 'claude',
      model
    })

    const draftId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO article_drafts (
        id, site_id, target_page_url, target_page_title, target_phrase, topic,
        title, meta_title, meta_description, slug, body_html,
        primary_link_url, primary_link_anchor, status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, 'Generated', ?, ?
      )
    `).run(
      draftId,
      siteId,
      targetPageUrl,
      targetPageTitle || '',
      targetPhrase || '',
      primaryTopic || '',
      genResult.title,
      genResult.metaTitle,
      genResult.metaDescription,
      genResult.slug,
      genResult.bodyHtml,
      targetPageUrl,
      targetAnchor || targetPhrase || '',
      now,
      now
    )

    res.json({
      success: true,
      draftId,
      ...genResult,
      primaryLinkUrl: targetPageUrl,
      primaryLinkAnchor: targetAnchor || targetPhrase || '',
      status: 'Generated',
      createdAt: now
    })
  } catch (err) {
    console.error('Error generating article:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// Helper to enrich draft with authoritative website record
const enrichDraftWithSite = (d) => {
  if (!d) return d
  const site = getWebsiteByIdFromDb(d.site_id)
  const cleanDomain = site?.url ? site.url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') : (
    d.target_page_url ? d.target_page_url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') : ''
  )
  return {
    ...d,
    siteName: site?.name || cleanDomain,
    businessName: site?.name || cleanDomain,
    domain: cleanDomain,
    siteUrl: site?.url || ''
  }
}

// GET /api/articles/drafts & GET /api/hub-content/drafts
const handleGetDrafts = (req, res) => {
  try {
    const { siteId } = req.query
    let rows
    if (siteId) {
      rows = db.prepare('SELECT * FROM article_drafts WHERE site_id = ? ORDER BY created_at DESC').all(siteId)
    } else {
      rows = db.prepare('SELECT * FROM article_drafts ORDER BY created_at DESC').all()
    }
    const enriched = rows.map(enrichDraftWithSite)
    res.json({ success: true, drafts: enriched })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
app.get('/api/articles/drafts', handleGetDrafts)
app.get('/api/hub-content/drafts', handleGetDrafts)

// GET /api/articles/drafts/:id & GET /api/hub-content/drafts/:id
const handleGetDraftById = (req, res) => {
  try {
    const { id } = req.params
    const draft = db.prepare('SELECT * FROM article_drafts WHERE id = ?').get(id)
    if (!draft) return res.status(404).json({ success: false, error: 'Draft not found.' })
    res.json({ success: true, draft: enrichDraftWithSite(draft) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
app.get('/api/articles/drafts/:id', handleGetDraftById)
app.get('/api/hub-content/drafts/:id', handleGetDraftById)

// POST /api/articles/drafts & POST /api/hub-content/drafts
const handleSaveDraft = (req, res) => {
  try {
    const draft = req.body || {}
    if (!draft.id || !draft.siteId || !draft.title) {
      return res.status(400).json({ success: false, error: 'id, siteId, and title are required.' })
    }

    const now = new Date().toISOString()
    db.prepare(`
      INSERT INTO article_drafts (
        id, site_id, target_page_url, target_page_title, target_phrase, topic,
        title, meta_title, meta_description, slug, body_html,
        category_id, category_name, primary_link_url, primary_link_anchor,
        secondary_links_json, status, wp_post_id, wp_edit_url, error_message,
        completed_at, created_at, updated_at
      ) VALUES (
        @id, @siteId, @targetPageUrl, @targetPageTitle, @targetPhrase, @topic,
        @title, @metaTitle, @metaDescription, @slug, @bodyHtml,
        @categoryId, @categoryName, @primaryLinkUrl, @primaryLinkAnchor,
        @secondaryLinksJson, @status, @wpPostId, @wpEditUrl, @errorMessage,
        @completedAt, @createdAt, @updatedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        meta_title = excluded.meta_title,
        meta_description = excluded.meta_description,
        slug = excluded.slug,
        body_html = excluded.body_html,
        category_id = excluded.category_id,
        category_name = excluded.category_name,
        primary_link_url = excluded.primary_link_url,
        primary_link_anchor = excluded.primary_link_anchor,
        secondary_links_json = excluded.secondary_links_json,
        status = excluded.status,
        wp_post_id = excluded.wp_post_id,
        wp_edit_url = excluded.wp_edit_url,
        error_message = excluded.error_message,
        completed_at = COALESCE(excluded.completed_at, article_drafts.completed_at),
        updated_at = excluded.updated_at
    `).run({
      id: draft.id,
      siteId: draft.siteId,
      targetPageUrl: draft.targetPageUrl || '',
      targetPageTitle: draft.targetPageTitle || '',
      targetPhrase: draft.targetPhrase || '',
      topic: draft.topic || '',
      title: draft.title,
      metaTitle: draft.metaTitle || draft.meta_title || '',
      metaDescription: draft.metaDescription || draft.meta_description || '',
      slug: draft.slug || '',
      bodyHtml: draft.bodyHtml || draft.body_html || '',
      categoryId: draft.categoryId || draft.category_id || null,
      categoryName: draft.categoryName || draft.category_name || null,
      primaryLinkUrl: draft.primaryLinkUrl || draft.primary_link_url || '',
      primaryLinkAnchor: draft.primaryLinkAnchor || draft.primary_link_anchor || '',
      secondaryLinksJson: draft.secondaryLinksJson || draft.secondary_links_json || null,
      status: draft.status || 'Draft',
      wpPostId: draft.wpPostId || draft.wp_post_id || null,
      wpEditUrl: draft.wpEditUrl || draft.wp_edit_url || null,
      errorMessage: draft.errorMessage || draft.error_message || null,
      completedAt: draft.completedAt || draft.completed_at || null,
      createdAt: draft.createdAt || draft.created_at || now,
      updatedAt: now
    })

    const saved = db.prepare('SELECT * FROM article_drafts WHERE id = ?').get(draft.id)
    res.json({ success: true, draft: saved })
  } catch (err) {
    console.error('Error saving draft:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
app.post('/api/articles/drafts', handleSaveDraft)
app.post('/api/hub-content/drafts', handleSaveDraft)

// POST /api/articles/drafts/:id/complete & POST /api/hub-content/drafts/:id/complete
const handleCompleteDraft = (req, res) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ success: false, error: 'Draft ID is required.' })

    const draft = db.prepare('SELECT * FROM article_drafts WHERE id = ?').get(id)
    if (!draft) return res.status(404).json({ success: false, error: `Draft ${id} not found.` })

    const now = new Date().toISOString()
    db.prepare(`
      UPDATE article_drafts
      SET status = 'Completed',
          completed_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(now, now, id)

    const updated = db.prepare('SELECT * FROM article_drafts WHERE id = ?').get(id)
    res.json({ success: true, draft: updated, message: 'Article marked as Completed.' })
  } catch (err) {
    console.error('Error completing draft:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
app.post('/api/articles/drafts/:id/complete', handleCompleteDraft)
app.post('/api/hub-content/drafts/:id/complete', handleCompleteDraft)

// GET /api/articles/drafts/:id/docx & GET /api/hub-content/drafts/:id/docx
const handleDownloadDocx = async (req, res) => {
  try {
    const { id } = req.params
    const draft = db.prepare('SELECT * FROM article_drafts WHERE id = ?').get(id)
    if (!draft) return res.status(404).json({ success: false, error: `Draft ${id} not found.` })

    const site = getWebsiteByIdFromDb(draft.site_id)
    const domain = site?.url ? site.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : 'website'
    const businessName = site?.name || domain
    const buffer = await generateArticleDocxBuffer({
      ...draft,
      domain,
      businessName,
      bodyHtml: draft.body_html,
      metaTitle: draft.meta_title,
      metaDescription: draft.meta_description
    })

    const slug = draft.slug || 'article'
    const filename = `${domain}-${slug}.docx`

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`
    })
    res.send(buffer)
  } catch (err) {
    console.error('Error generating docx download:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
app.get('/api/articles/drafts/:id/docx', handleDownloadDocx)
app.get('/api/hub-content/drafts/:id/docx', handleDownloadDocx)

// DELETE /api/articles/drafts/:id & DELETE /api/hub-content/drafts/:id
const handleDeleteDraft = (req, res) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ success: false, error: 'Draft ID is required.' })

    const result = db.prepare('DELETE FROM article_drafts WHERE id = ?').run(id)
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: `Draft ${id} not found.` })
    }

    res.json({ success: true, deletedId: id, message: 'Draft deleted successfully.' })
  } catch (err) {
    console.error('Error deleting draft:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
app.delete('/api/articles/drafts/:id', handleDeleteDraft)
app.delete('/api/hub-content/drafts/:id', handleDeleteDraft)

// POST /api/articles/drafts/:id/send-to-wordpress
app.post('/api/articles/drafts/:id/send-to-wordpress', async (req, res) => {
  try {
    const { id } = req.params
    const draft = db.prepare('SELECT * FROM article_drafts WHERE id = ?').get(id)
    if (!draft) return res.status(404).json({ success: false, error: `Draft ${id} not found.` })

    if (draft.status === 'Sent to WordPress' && draft.wp_post_id) {
      return res.json({
        success: true,
        alreadySent: true,
        wpPostId: draft.wp_post_id,
        wpEditUrl: draft.wp_edit_url,
        message: `Article was already sent to WordPress as Draft #${draft.wp_post_id}.`
      })
    }

    const { site, username, password, siteUrl } = getWebsiteWpCredentials(draft.site_id)
    if (!site) return res.status(404).json({ success: false, error: `Website ${draft.site_id} not found.` })
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'WordPress credentials not configured for this website.' })
    }

    const authHeader = 'Basic ' + Buffer.from(`${username}:${password.replace(/\s/g, '')}`).toString('base64')
    const postsUrl = `${siteUrl}/wp-json/wp/v2/posts`

    const wpPayload = {
      title: draft.title,
      content: draft.body_html,
      slug: draft.slug || undefined,
      status: 'draft', // STRICT SAFETY MANDATE: ALWAYS DRAFT
      excerpt: draft.meta_description || undefined,
      categories: draft.category_id ? [parseInt(draft.category_id, 10)] : undefined,
      meta: {
        _yoast_wpseo_title: draft.meta_title || draft.title,
        _yoast_wpseo_metadesc: draft.meta_description || '',
        yoast_wpseo_title: draft.meta_title || draft.title,
        yoast_wpseo_metadesc: draft.meta_description || '',
        rank_math_title: draft.meta_title || draft.title,
        rank_math_description: draft.meta_description || ''
      }
    }

    console.log('[WP_POST_CREATE] Creating Draft Post on:', postsUrl)
    const createRes = await fetch(postsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        Accept: 'application/json'
      },
      body: JSON.stringify(wpPayload)
    })

    if (!createRes.ok) {
      let errText = `HTTP ${createRes.status}`
      try {
        const errJson = await createRes.json()
        errText = errJson.message || errJson.code || errText
      } catch (_e) {
        const text = await createRes.text()
        if (text) errText = text.slice(0, 150)
      }
      return res.status(createRes.status).json({ success: false, error: `WordPress post creation failed: ${errText}` })
    }

    const postData = await createRes.json()
    const wpPostId = postData.id
    const wpEditUrl = `${siteUrl}/wp-admin/post.php?post=${wpPostId}&action=edit`

    try {
      if (draft.meta_title) {
        await fetch(`${siteUrl}/wp-json/tse-site-exporter/v1/update-page`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: authHeader },
          body: JSON.stringify({ post_id: wpPostId, field: 'seo_title', value: draft.meta_title })
        })
      }
      if (draft.meta_description) {
        await fetch(`${siteUrl}/wp-json/tse-site-exporter/v1/update-page`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: authHeader },
          body: JSON.stringify({ post_id: wpPostId, field: 'meta_description', value: draft.meta_description })
        })
      }
    } catch (_tseErr) {}

    const now = new Date().toISOString()
    db.prepare(`
      UPDATE article_drafts
      SET status = 'Sent to WordPress',
          wp_post_id = ?,
          wp_edit_url = ?,
          updated_at = ?
      WHERE id = ?
    `).run(wpPostId, wpEditUrl, now, id)

    res.json({
      success: true,
      wpPostId,
      wpEditUrl,
      status: 'Sent to WordPress',
      message: 'Draft post created successfully in WordPress.'
    })
  } catch (err) {
    console.error('Error sending draft to WordPress:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ==========================================
// 12. AUTOMATED FIRST AUDIT BATCH RUNNER
// ==========================================

// Get batch status & estate eligibility
app.get('/api/first-audit-batch/status', (req, res) => {
  try {
    const status = batchRunner.getStatus(db)
    res.json({ success: true, ...status })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Start automated batch execution
app.post('/api/first-audit-batch/start', async (req, res) => {
  try {
    const status = await batchRunner.start(db)
    res.json({ success: true, ...status })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

// Stop automated batch execution
app.post('/api/first-audit-batch/stop', async (req, res) => {
  try {
    const status = await batchRunner.stop(db)
    res.json({ success: true, ...status })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Retry only failed sites
app.post('/api/first-audit-batch/retry-failed', async (req, res) => {
  try {
    const status = await batchRunner.retryFailed(db)
    res.json({ success: true, ...status })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

// Reset batch state back to dynamic calculation
app.post('/api/first-audit-batch/reset', async (req, res) => {
  try {
    const status = await batchRunner.reset(db)
    res.json({ success: true, ...status })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Serve frontend static files and handle SPA clean route fallback if dist exists
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' })
    }
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`[Website Manager SQLite API] Running on http://localhost:${PORT}`)
  // Run non-blocking background reconciliation against Site Registry on startup
  reconcileWebsitesWithRegistry().then(res => {
    console.log('[REGISTRY_RECONCILE] Startup sync completed:', res)
  }).catch(err => {
    console.warn('[REGISTRY_RECONCILE] Startup sync warning:', err)
  })
})
