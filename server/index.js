import express from 'express'
import cors from 'cors'
import db, { getAllWebsitesFromDb, getWebsiteByIdFromDb } from './db.js'

const app = express()
const PORT = process.env.PORT || 3005

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Deployment Status Endpoints
let inMemoryDeploymentStatus = {
  version: '1.86',
  buildHash: 'w4dedupechecklist86',
  buildTimestamp: 1788200000000,
  isDeploymentInProgress: false,
  lastDeployedAt: new Date().toISOString()
}

app.get('/api/deployment/status', (req, res) => {
  try {
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

// Extract genuine content images server-side (excludes logos, badges, background sliders, and third-party placeholders)
app.get('/api/images/extract', async (req, res) => {
  try {
    const targetUrl = (req.query.url || '').trim()
    if (!targetUrl) {
      return res.status(400).json({ success: false, error: 'URL parameter is required' })
    }

    const fetchRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
      const aria = ariaMatch ? ariaMatch[1].trim() : ''
      const alt = aria && !aria.toLowerCase().startsWith('ascent') ? aria : ''

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

// ==========================================
// 1. CONNECTED WEBSITES ENDPOINTS
// ==========================================

// Get all connected websites
app.get('/api/websites', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM websites ORDER BY created_at DESC`).all()
    const websites = rows.map(r => ({
      ...r,
      syncStatus: r.sync_status || r.syncStatus || 'Synced',
      lastSyncTimestamp: r.last_sync_timestamp || r.lastSyncTimestamp || null,
      isAudited: Boolean(r.is_audited),
      lastAuditTimestamp: r.last_audit_timestamp,
      configData: r.config_data ? JSON.parse(r.config_data) : null
    }))
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
        config_data = CASE
          WHEN excluded.config_data IS NOT NULL AND excluded.config_data != '' AND excluded.config_data != '{"wpUser":"","wpPass":""}' THEN excluded.config_data
          ELSE websites.config_data
        END,
        updated_at = excluded.updated_at
    `)

    const statusVal = typeof site.status === 'object' ? JSON.stringify(site.status) : (site.status || 'Active')

    stmt.run({
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

      // 2. Update websites table sync_status and last_sync_timestamp
      db.prepare(`
        UPDATE websites
        SET sync_status = 'Synced',
            last_sync_timestamp = ?,
            updated_at = ?
        WHERE id = ?
      `).run(now, now, id)
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

    // Server-side token read from SQLite database (never exposed to browser)
    const token = siteRow.wp_pass || configData.wpPass || ''

    if (!cleanSiteUrl) {
      return res.status(400).json({ success: false, error: 'MISSING_URL', message: 'Website URL is missing from website record.' })
    }

    const headers = { 'Accept': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`
    }

    // Issue server-side HTTP requests to Magento REST API (Categories & CMS pages only)
    const [catRes, cmsRes] = await Promise.all([
      fetch(`${apiBaseUrl}/categories`, { method: 'GET', headers }).catch(() => null),
      fetch(`${apiBaseUrl}/cmsPage/search?searchCriteria[pageSize]=100`, { method: 'GET', headers }).catch(() => null)
    ])

    // Check for HTTP 401 Unauthorized
    if (catRes?.status === 401 || cmsRes?.status === 401) {
      return res.status(401).json({
        success: false,
        status: 401,
        error: 'MAGENTO_AUTH_FAILED',
        message: 'Magento REST API Authentication Failed (HTTP 401). Bearer token rejected by Magento.'
      })
    }

    const categoriesJson = catRes && catRes.ok ? await catRes.json() : null
    const cmsPagesJson = cmsRes && cmsRes.ok ? await cmsRes.json() : null

    const pages = []

    // 1. Process Categories Structure
    function processCategoryNode(node, parentName = '') {
      if (!node) return
      if (node.name && node.id) {
        const catSlug = node.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        const fullCatUrl = `${cleanSiteUrl}/${catSlug}`
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
          parentName: parentName || null,
          position: node.position
        })
      }
      if (Array.isArray(node.children_data)) {
        node.children_data.forEach(child => processCategoryNode(child, node.name))
      }
    }
    if (categoriesJson) processCategoryNode(categoriesJson)

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
      categories: categoriesJson,
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
        target: r.target_phrase || parsedConfig.target,
        targetPhrase: r.target_phrase || parsedConfig.targetPhrase,
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
        stmt.run({
          site_id: id,
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

app.listen(PORT, () => {
  console.log(`[Website Manager SQLite API] Running on http://localhost:${PORT}`)
})
