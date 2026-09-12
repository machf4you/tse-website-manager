import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import db, { getAllWebsitesFromDb, getWebsiteByIdFromDb } from './db.js'

const app = express()
const PORT = process.env.PORT || 3005

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Deployment Status Endpoints
let inMemoryDeploymentStatus = {
  version: '2.12',
  buildHash: 'cleantiles212',
  buildTimestamp: 1788780000000,
  isDeploymentInProgress: false,
  lastDeployedAt: new Date().toISOString()
}

// Health check endpoints
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'website-manager-api' }))
app.get('/api/page-auditor-health', (req, res) => res.json({ status: 'ok', service: 'page-auditor-proxy' }))

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
      domainId: r.domain_id || null,
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
            updated_at = @now
          WHERE id = @siteId
        `).run({
          portfolio,
          platform,
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
          db.prepare(`UPDATE websites SET domain_id = ?, updated_at = ? WHERE id = ?`).run(
            masterId,
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
          id, domain_id, name, url, platform, portfolio, status, is_audited, last_audit_timestamp, sync_status, last_sync_timestamp, config_data, created_at, updated_at
        ) VALUES (
          @id, @domain_id, @name, @url, @platform, @portfolio, @status, 0, NULL, 'Unsynced', NULL, NULL, @created_at, @updated_at
        )
      `).run({
        id: newInternalId,
        domain_id: masterId,
        name: d.canonical_domain || d.domain_name || canonical,
        url: primaryUrl,
        platform,
        portfolio,
        status: shellStatusJson,
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

  // 2. Scan standard environment files on VPS & local project
  const envPaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'server', '.env'),
    path.join('c:', 'Antigravity', 'tse-keyword-research', 'server', '.env'),
    path.join('c:', 'Antigravity', 'tse-lead-finder', 'server', '.env'),
    '/var/www/www-root/data/www/api-website-manager.thesearchequation.co.uk/current/.env',
    '/var/www/www-root/data/www/api-website-manager.thesearchequation.co.uk/.env',
    '/var/www/www-root/data/www/api-page-auditor.thesearchequation.co.uk/.env',
    '/var/www/www-root/data/www/api-keyword-research.thesearchequation.co.uk/.env',
    '/var/www/www-root/data/www/api-backlinks.thesearchequation.co.uk/.env',
    '/var/www/www-root/data/www/shared/.env',
    '/root/.env'
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

// GET all stored rankings for a website
app.get('/api/websites/:id/rankings', (req, res) => {
  try {
    const { id } = req.params
    const rows = db.prepare(`SELECT * FROM page_rankings WHERE site_id = ?`).all(id)
    const result = {}
    rows.forEach(r => {
      result[r.page_key] = {
        siteId: r.site_id,
        pageKey: r.page_key,
        targetPhrase: r.target_phrase,
        googleRank: r.google_rank,
        isTop100: Boolean(r.is_top_100),
        rankingUrl: r.ranking_url,
        isUrlMatch: Boolean(r.is_url_match),
        searchEngine: r.search_engine || 'google.co.uk',
        locationCode: r.location_code || 2826,
        device: r.device || 'desktop',
        lastCheckedAt: r.last_checked_at,
        updatedAt: r.updated_at
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
    const pageKey = paramPageKey ? decodeURIComponent(paramPageKey) : (req.body?.pageKey || req.query?.pageKey)

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

    // 4. Query DataForSEO Google Organic SERP Live Advanced API
    const authHeader = 'Basic ' + Buffer.from(`${creds.login}:${creds.password}`).toString('base64')
    const serpPayload = [
      {
        keyword: targetPhrase,
        location_code: 2826,
        language_code: 'en',
        se_domain: 'google.co.uk',
        device: 'desktop',
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
        @site_id, @page_key, @target_phrase, @google_rank, @is_top_100, @ranking_url, @is_url_match, 'google.co.uk', 2826, 'desktop', @last_checked_at, @updated_at
      )
      ON CONFLICT(site_id, page_key) DO UPDATE SET
        target_phrase = excluded.target_phrase,
        google_rank = excluded.google_rank,
        is_top_100 = excluded.is_top_100,
        ranking_url = excluded.ranking_url,
        is_url_match = excluded.is_url_match,
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
      device: 'desktop',
      lastCheckedAt: now,
      cost: taskCost
    })
  } catch (err) {
    console.error('Error during DataForSEO rank check:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

app.post('/api/websites/:id/check-rank', handleSinglePhraseRankCheck)
app.post('/api/websites/:id/pages/:pageKey/check-rank', handleSinglePhraseRankCheck)

app.listen(PORT, () => {
  console.log(`[Website Manager SQLite API] Running on http://localhost:${PORT}`)
})
