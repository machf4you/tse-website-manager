import express from 'express'
import cors from 'cors'
import db from './db.js'

const app = express()
const PORT = process.env.PORT || 3005

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'sqlite', timestamp: new Date().toISOString() })
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
      'testimonials'
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

// Save page audit record
app.post('/api/websites/:id/audits', (req, res) => {
  try {
    const { id } = req.params
    const { pageKey, auditRecord } = req.body
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
})

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
