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
        config_data = excluded.config_data,
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
        config_data = excluded.config_data,
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
    const packageData = JSON.parse(row.package_data)
    res.json({ siteId: id, packageData, updatedAt: row.updated_at })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Save WP package for site
app.post('/api/websites/:id/package', (req, res) => {
  try {
    const { id } = req.params
    const packageData = req.body
    if (!packageData) {
      return res.status(400).json({ error: 'Package data is required' })
    }

    const now = new Date().toISOString()
    const stmt = db.prepare(`
      INSERT INTO wp_packages (site_id, package_data, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(site_id) DO UPDATE SET
        package_data = excluded.package_data,
        updated_at = excluded.updated_at
    `)

    stmt.run(id, JSON.stringify(packageData), now)
    res.json({ success: true, siteId: id, updatedAt: now })
  } catch (e) {
    res.status(500).json({ error: e.message })
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
