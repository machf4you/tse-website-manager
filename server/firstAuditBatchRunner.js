/**
 * TSE Website Manager — Automated First Audit Batch Runner
 * Executes server-side sequential First Audits for eligible connected websites
 * without external paid APIs ($0.00 cost).
 */

import { extractPagesFromPackage, extractPostsFromPackage } from '../src/utils/packageExtractor.js'
import { generateProposedTargetPhrase, isUtilityPage } from '../src/utils/targetPhraseGenerator.js'
import { extractSafeString } from '../src/utils/safeString.js'

const KNOWN_MAGAZINE_DOMAINS = new Set([
  'bedesworld.co.uk',
  'searchcollision.com',
  'javeanews.com',
  'the-ecologist.org',
  'immaterial.co.uk',
  'impetuous.co.uk',
  'inevitably.co.uk',
  'jacklin.co.uk',
  'maniacs.co.uk',
  'minified.co.uk',
  'petrified.co.uk',
  'securely.co.uk',
  'tolerated.co.uk'
])

const KNOWN_EXCLUDED_DOMAINS = new Set([
  'smokingchilimedia.com',
  'www.smokingchilimedia.com'
])

function normalizeDomain(urlOrName = '') {
  return String(urlOrName || '')
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
}

export function isMagazineSite(site) {
  if (!site) return false
  const dom = normalizeDomain(site.url || site.name || '')
  if (KNOWN_MAGAZINE_DOMAINS.has(dom)) return true
  const platform = String(site.platform || site.platform_type || '').toLowerCase()
  if (platform === 'magazine' || platform === 'content') return true
  const portfolio = String(site.portfolio || '').toLowerCase()
  if (portfolio === 'magazine' || portfolio === 'content') return true
  return false
}

export function isSiteExcludedNotReady(site) {
  if (!site) return true
  const dom = normalizeDomain(site.url || site.name || '')
  if (KNOWN_EXCLUDED_DOMAINS.has(dom)) return true
  return false
}

export function evaluateSiteEligibility(site, db) {
  const dom = normalizeDomain(site.url || site.name || '')
  
  // 1. Check if site is already audited (Authoritative DB Check)
  const isAuditedFlag = Boolean(site.is_audited)
  const auditCountRow = db.prepare(`SELECT COUNT(*) as count FROM page_audits WHERE site_id = ? AND is_audited = 1`).get(site.id)
  const auditCount = auditCountRow ? auditCountRow.count : 0

  if (isAuditedFlag || auditCount > 0) {
    return {
      status: 'SKIPPED_ALREADY_AUDITED',
      statusLabel: 'SKIPPED — FIRST AUDIT ALREADY COMPLETE',
      eligible: false,
      reason: `First Audit Already Completed (${auditCount} pages audited in database)`
    }
  }

  // 2. Check if site is known excluded / unreachable host
  if (isSiteExcludedNotReady(site)) {
    return {
      status: 'NOT_READY_EXCLUDED',
      statusLabel: 'NOT READY — EXCLUDED',
      eligible: false,
      reason: 'Site unreachable / host firewall challenge (SG-Captcha 202)'
    }
  }

  // 3. Check if synced package data exists
  const pkgRow = db.prepare(`SELECT updated_at FROM wp_packages WHERE site_id = ?`).get(site.id)
  if (!pkgRow) {
    return {
      status: 'NOT_READY_EXCLUDED',
      statusLabel: 'NOT READY — EXCLUDED',
      eligible: false,
      reason: 'No synced package data available'
    }
  }

  // 4. Eligible site
  return {
    status: 'QUEUED',
    statusLabel: 'QUEUED',
    eligible: true,
    reason: 'Ready for automated First Audit'
  }
}

export function getFullEstateEligibility(db) {
  const sites = db.prepare(`SELECT * FROM websites ORDER BY name ASC`).all()
  const siteList = sites.map(site => {
    let configData = {}
    try {
      if (site.config_data) configData = JSON.parse(site.config_data)
    } catch {}

    const eligibility = evaluateSiteEligibility(site, db)
    const isMag = isMagazineSite(site)

    // Count pages in package if available
    let totalPagesInPkg = site.total_pages || 0
    try {
      const pkgRow = db.prepare(`SELECT package_data FROM wp_packages WHERE site_id = ?`).get(site.id)
      if (pkgRow && pkgRow.package_data) {
        const pkg = JSON.parse(pkgRow.package_data)
        const pages = extractPagesFromPackage(pkg, site.url)
        const posts = extractPostsFromPackage(pkg)
        totalPagesInPkg = (pages ? pages.length : 0) + (posts ? posts.length : 0)
      }
    } catch {}

    const auditCountRow = db.prepare(`SELECT COUNT(*) as count FROM page_audits WHERE site_id = ? AND is_audited = 1`).get(site.id)
    const auditedPages = auditCountRow ? auditCountRow.count : 0

    return {
      id: site.id,
      name: site.name,
      url: site.url,
      platform: site.platform || 'wordpress',
      portfolio: site.portfolio || 'Other',
      isMagazine: isMag,
      siteType: isMag ? 'Magazine / Content' : 'Commercial',
      status: eligibility.status,
      statusLabel: eligibility.statusLabel,
      eligible: eligibility.eligible,
      reason: eligibility.reason,
      totalPages: totalPagesInPkg,
      auditedPages,
      lastAuditTimestamp: site.last_audit_timestamp || null,
      error: null
    }
  })

  const totalSites = siteList.length
  const eligibleSites = siteList.filter(s => s.eligible).length
  const alreadyAuditedSites = siteList.filter(s => s.status === 'SKIPPED_ALREADY_AUDITED').length
  const excludedSites = siteList.filter(s => s.status === 'NOT_READY_EXCLUDED').length

  return {
    totalSites,
    eligibleSites,
    alreadyAuditedSites,
    excludedSites,
    sites: siteList
  }
}

async function callPageAuditorApi({ siteId, pageId, url, siteUrl, targetPhrase, seoPageType }) {
  const pageAuditorBaseUrl = process.env.PAGE_AUDITOR_API_URL || 'http://127.0.0.1:8005/api'

  let resolvedUrl = (url || '').trim()
  if (resolvedUrl && !resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://')) {
    const baseDomain = (siteUrl || '').replace(/\/+$/, '')
    const relPath = resolvedUrl.startsWith('/') ? resolvedUrl : `/${resolvedUrl}`
    resolvedUrl = `${baseDomain}${relPath}`
  }

  const payload = {
    site_id: siteId || 'site-1',
    page_id: pageId || url,
    url: resolvedUrl,
    primary_phrase: targetPhrase || '',
    assigned_type: seoPageType || 'Unclassified',
    secondary_phrases: [],
    render_js: false,
    rules_parameters: {
      min_internal_links: 3,
      min_word_count: 300,
      meta_title_min: 50,
      meta_title_max: 65,
      meta_desc_min: 120,
      meta_desc_max: 160
    }
  }

  const response = await fetch(`${pageAuditorBaseUrl}/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Page Auditor HTTP ${response.status}: ${errText}`)
  }

  return await response.json()
}

class FirstAuditBatchRunner {
  constructor() {
    this.isRunning = false
    this.isStopping = false
    this.currentBatchId = null
    this.runnerPromise = null
  }

  getDbState(db) {
    const row = db.prepare(`SELECT * FROM first_audit_batch_state WHERE id = 'active_batch'`).get()
    if (!row) return null
    try {
      return {
        id: row.id,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        totalSites: row.total_sites,
        processedSites: row.processed_sites,
        successfulSites: row.successful_sites,
        failedSites: row.failed_sites,
        currentSiteId: row.current_site_id,
        currentSiteName: row.current_site_name,
        currentPageIndex: row.current_page_index,
        currentPageTotal: row.current_page_total,
        currentPageUrl: row.current_page_url,
        siteStates: row.site_states_json ? JSON.parse(row.site_states_json) : [],
        logs: row.logs_json ? JSON.parse(row.logs_json) : [],
        updatedAt: row.updated_at
      }
    } catch {
      return null
    }
  }

  saveDbState(db, state) {
    const now = new Date().toISOString()
    const stmt = db.prepare(`
      INSERT INTO first_audit_batch_state (
        id, status, started_at, completed_at, total_sites, processed_sites,
        successful_sites, failed_sites, current_site_id, current_site_name,
        current_page_index, current_page_total, current_page_url,
        site_states_json, logs_json, updated_at
      ) VALUES (
        @id, @status, @started_at, @completed_at, @total_sites, @processed_sites,
        @successful_sites, @failed_sites, @current_site_id, @current_site_name,
        @current_page_index, @current_page_total, @current_page_url,
        @site_states_json, @logs_json, @updated_at
      )
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        started_at = excluded.started_at,
        completed_at = excluded.completed_at,
        total_sites = excluded.total_sites,
        processed_sites = excluded.processed_sites,
        successful_sites = excluded.successful_sites,
        failed_sites = excluded.failed_sites,
        current_site_id = excluded.current_site_id,
        current_site_name = excluded.current_site_name,
        current_page_index = excluded.current_page_index,
        current_page_total = excluded.current_page_total,
        current_page_url = excluded.current_page_url,
        site_states_json = excluded.site_states_json,
        logs_json = excluded.logs_json,
        updated_at = excluded.updated_at
    `)

    stmt.run({
      id: 'active_batch',
      status: state.status || 'idle',
      started_at: state.startedAt || null,
      completed_at: state.completedAt || null,
      total_sites: state.totalSites || 0,
      processed_sites: state.processedSites || 0,
      successful_sites: state.successfulSites || 0,
      failed_sites: state.failedSites || 0,
      current_site_id: state.currentSiteId || null,
      current_site_name: state.currentSiteName || null,
      current_page_index: state.currentPageIndex || 0,
      current_page_total: state.currentPageTotal || 0,
      current_page_url: state.currentPageUrl || null,
      site_states_json: JSON.stringify(state.siteStates || []),
      logs_json: JSON.stringify(state.logs ? state.logs.slice(-200) : []),
      updated_at: now
    })
  }

  addLog(state, message) {
    const entry = {
      timestamp: new Date().toISOString(),
      message
    }
    if (!state.logs) state.logs = []
    state.logs.push(entry)
    console.log(`[FIRST_AUDIT_BATCH] ${message}`)
  }

  getStatus(db) {
    const estate = getFullEstateEligibility(db)
    const dbState = this.getDbState(db)

    if (!dbState) {
      return {
        status: this.isRunning ? 'running' : 'idle',
        isRunning: this.isRunning,
        startedAt: null,
        completedAt: null,
        totalSites: estate.totalSites,
        eligibleSites: estate.eligibleSites,
        alreadyAuditedSites: estate.alreadyAuditedSites,
        excludedSites: estate.excludedSites,
        processedSites: 0,
        successfulSites: 0,
        failedSites: 0,
        currentSiteId: null,
        currentSiteName: null,
        currentPageIndex: 0,
        currentPageTotal: 0,
        currentPageUrl: null,
        siteStates: estate.sites,
        logs: []
      }
    }

    return {
      ...dbState,
      isRunning: this.isRunning,
      eligibleSites: estate.eligibleSites,
      alreadyAuditedSites: estate.alreadyAuditedSites,
      excludedSites: estate.excludedSites
    }
  }

  async start(db) {
    if (this.isRunning) {
      throw new Error('First Audit batch is already running')
    }

    const estate = getFullEstateEligibility(db)
    const eligibleSites = estate.sites.filter(s => s.eligible)

    if (eligibleSites.length === 0) {
      throw new Error('No eligible unaudited websites to process')
    }

    const now = new Date().toISOString()
    const state = {
      id: 'active_batch',
      status: 'running',
      startedAt: now,
      completedAt: null,
      totalSites: eligibleSites.length,
      processedSites: 0,
      successfulSites: 0,
      failedSites: 0,
      currentSiteId: null,
      currentSiteName: null,
      currentPageIndex: 0,
      currentPageTotal: 0,
      currentPageUrl: null,
      siteStates: estate.sites,
      logs: []
    }

    this.addLog(state, `Starting Automated First Audit Batch for ${eligibleSites.length} eligible websites...`)
    this.saveDbState(db, state)

    this.isRunning = true
    this.isStopping = false

    this.runnerPromise = this.runLoop(db, state, eligibleSites)
    return this.getStatus(db)
  }

  async stop(db) {
    if (!this.isRunning) {
      return this.getStatus(db)
    }

    this.isStopping = true
    const state = this.getDbState(db) || {}
    state.status = 'stopped'
    this.addLog(state, 'Stop requested by user. Waiting for current page audit to finish...')
    this.saveDbState(db, state)
    return this.getStatus(db)
  }

  async retryFailed(db) {
    if (this.isRunning) {
      throw new Error('Batch is currently running')
    }

    const dbState = this.getDbState(db)
    if (!dbState) {
      throw new Error('No batch state found to retry')
    }

    const failedSiteIds = new Set(
      (dbState.siteStates || [])
        .filter(s => s.status === 'FAILED')
        .map(s => s.id)
    )

    if (failedSiteIds.size === 0) {
      throw new Error('No failed websites found to retry')
    }

    const estate = getFullEstateEligibility(db)
    const sitesToRetry = estate.sites.filter(s => failedSiteIds.has(s.id))

    const state = {
      ...dbState,
      status: 'running',
      completedAt: null,
      totalSites: sitesToRetry.length,
      processedSites: 0,
      currentSiteId: null,
      currentSiteName: null,
      currentPageIndex: 0,
      currentPageTotal: 0,
      currentPageUrl: null,
      siteStates: dbState.siteStates.map(s => {
        if (failedSiteIds.has(s.id)) {
          return { ...s, status: 'QUEUED', statusLabel: 'QUEUED', error: null }
        }
        return s
      })
    }

    this.addLog(state, `Retrying First Audit for ${sitesToRetry.length} previously failed websites...`)
    this.saveDbState(db, state)

    this.isRunning = true
    this.isStopping = false

    this.runnerPromise = this.runLoop(db, state, sitesToRetry)
    return this.getStatus(db)
  }

  async reset(db) {
    if (this.isRunning) {
      throw new Error('Cannot reset while batch is running')
    }
    db.prepare(`DELETE FROM first_audit_batch_state WHERE id = 'active_batch'`).run()
    return this.getStatus(db)
  }

  async runLoop(db, state, targetSites) {
    try {
      for (let i = 0; i < targetSites.length; i++) {
        if (this.isStopping) {
          state.status = 'stopped'
          this.addLog(state, 'Batch execution stopped by user.')
          this.saveDbState(db, state)
          break
        }

        const siteSummary = targetSites[i]
        const site = db.prepare(`SELECT * FROM websites WHERE id = ?`).get(siteSummary.id)

        if (!site) {
          this.addLog(state, `Site ID ${siteSummary.id} not found in database. Skipping.`)
          continue
        }

        state.currentSiteId = site.id
        state.currentSiteName = site.name
        state.currentPageIndex = 0
        state.currentPageTotal = 0
        state.currentPageUrl = null

        // Update site state in array to IN_PROGRESS
        state.siteStates = state.siteStates.map(s => {
          if (s.id === site.id) {
            return { ...s, status: 'IN_PROGRESS', statusLabel: 'IN PROGRESS', startedAt: new Date().toISOString() }
          }
          return s
        })

        this.addLog(state, `[Site ${i + 1}/${targetSites.length}] Starting First Audit for "${site.name}" (${site.url})...`)
        this.saveDbState(db, state)

        try {
          await this.auditSingleWebsite(db, site, state)
          state.successfulSites++
          state.siteStates = state.siteStates.map(s => {
            if (s.id === site.id) {
              return {
                ...s,
                status: 'COMPLETED',
                statusLabel: 'COMPLETED',
                completedAt: new Date().toISOString()
              }
            }
            return s
          })
          this.addLog(state, `✓ Completed First Audit for "${site.name}".`)
        } catch (siteErr) {
          state.failedSites++
          state.siteStates = state.siteStates.map(s => {
            if (s.id === site.id) {
              return {
                ...s,
                status: 'FAILED',
                statusLabel: 'FAILED',
                error: siteErr.message,
                completedAt: new Date().toISOString()
              }
            }
            return s
          })
          this.addLog(state, `✗ Error auditing "${site.name}": ${siteErr.message}`)
        }

        state.processedSites++
        this.saveDbState(db, state)
      }

      if (!this.isStopping) {
        state.status = 'completed'
        state.completedAt = new Date().toISOString()
        state.currentSiteId = null
        state.currentSiteName = null
        state.currentPageIndex = 0
        state.currentPageTotal = 0
        state.currentPageUrl = null
        this.addLog(state, `🎉 First Audit Batch Completed! Total processed: ${state.processedSites}, Successful: ${state.successfulSites}, Failed: ${state.failedSites}`)
        this.saveDbState(db, state)
      }
    } catch (globalErr) {
      state.status = 'failed'
      this.addLog(state, `Fatal batch runner error: ${globalErr.message}`)
      this.saveDbState(db, state)
    } finally {
      this.isRunning = false
      this.isStopping = false
    }
  }

  async auditSingleWebsite(db, site, state) {
    // 1. Fetch package data
    const pkgRow = db.prepare(`SELECT package_data FROM wp_packages WHERE site_id = ?`).get(site.id)
    if (!pkgRow || !pkgRow.package_data) {
      throw new Error('No synced WordPress/Magento package data available')
    }

    const pkg = JSON.parse(pkgRow.package_data)
    const rawPages = extractPagesFromPackage(pkg, site.url) || []
    const rawPosts = extractPostsFromPackage(pkg) || []
    const allPages = [...rawPages, ...rawPosts]

    // 2. Identify active SEO pages (Hub, Landing, Topical, Article; not Excluded)
    const isMag = isMagazineSite(site)
    const activePages = allPages.filter(p => {
      const type = (p.type || p.seoPageType || '').trim()
      const isSeoType = ['Hub', 'Landing', 'Topical', 'Article'].includes(type)
      return isSeoType && !p.isExcluded && type !== 'Excluded'
    })

    if (activePages.length === 0) {
      throw new Error('No active SEO pages (Hub, Landing, Topical, Article) found to audit')
    }

    state.currentPageTotal = activePages.length
    state.siteStates = state.siteStates.map(s => {
      if (s.id === site.id) return { ...s, totalPages: activePages.length }
      return s
    })

    // 3. Target phrase handling
    const existingConfigsRows = db.prepare(`SELECT page_key, target_phrase FROM page_configurations WHERE site_id = ?`).all(site.id)
    const existingConfigsMap = new Map(existingConfigsRows.map(r => [r.page_key, r.target_phrase]))

    const now = new Date().toISOString()
    const saveConfigStmt = db.prepare(`
      INSERT INTO page_configurations (
        site_id, page_key, url, title, target_phrase, seoPageType, priority, is_excluded, config_json, updated_at
      ) VALUES (
        @site_id, @page_key, @url, @title, @target_phrase, @seoPageType, @priority, @is_excluded, @config_json, @updated_at
      )
      ON CONFLICT(site_id, page_key) DO UPDATE SET
        target_phrase = excluded.target_phrase,
        updated_at = excluded.updated_at
    `)

    const saveAuditStmt = db.prepare(`
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

    // 4. Audit each active page sequentially
    let auditedCount = 0
    for (let pIdx = 0; pIdx < activePages.length; pIdx++) {
      if (this.isStopping) {
        throw new Error('Audit cancelled by user')
      }

      const page = activePages[pIdx]
      const pageKey = page.id || page.url || page.pageUrl
      const pageUrl = page.url || page.pageUrl || ''
      const pageTitle = extractSafeString(page.title || page.originalTitle || page.name)

      state.currentPageIndex = pIdx + 1
      state.currentPageUrl = pageUrl

      // Determine target phrase
      let targetPhrase = existingConfigsMap.get(pageKey) || (pageUrl ? existingConfigsMap.get(pageUrl) : '') || page.targetPhrase || page.target || ''
      
      // Commercial sites: propose target phrase if unconfigured
      if (!targetPhrase && !isMag && !isUtilityPage(pageUrl, pageTitle)) {
        const proposed = generateProposedTargetPhrase(page, site.name)
        targetPhrase = (proposed && proposed.trim()) ? proposed.trim() : (site.name ? `${site.name} Service` : '')
        if (targetPhrase) {
          try {
            saveConfigStmt.run({
              site_id: site.id,
              page_key: pageKey,
              url: pageUrl,
              title: pageTitle,
              target_phrase: targetPhrase,
              seoPageType: page.type || page.seoPageType || 'Topical',
              priority: page.priority || 0,
              is_excluded: 0,
              config_json: JSON.stringify({
                pageId: pageKey,
                url: pageUrl,
                title: pageTitle,
                targetPhrase,
                seoPageType: page.type || page.seoPageType || 'Topical',
                isConfigured: true,
                updatedAt: now
              }),
              updated_at: now
            })
          } catch {}
        }
      }

      // Execute Page Audit via Page Auditor API
      const seoType = page.type || page.seoPageType || 'Topical'
      const auditResult = await callPageAuditorApi({
        siteId: site.id,
        pageId: pageKey,
        url: pageUrl,
        siteUrl: site.url,
        targetPhrase,
        seoPageType: seoType
      })

      // Format readable timestamp e.g. "18-09-2026 15:30"
      const d = new Date()
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const formattedTimestamp = `${day}-${month}-${year} ${hours}:${minutes}`

      saveAuditStmt.run({
        site_id: site.id,
        page_key: pageKey,
        is_audited: 1,
        is_stale: 0,
        stale_reason: null,
        last_audit_timestamp: formattedTimestamp,
        fingerprint: '',
        audit_result_json: JSON.stringify(auditResult),
        updated_at: now
      })

      auditedCount++
      state.siteStates = state.siteStates.map(s => {
        if (s.id === site.id) return { ...s, auditedPages: auditedCount }
        return s
      })

      // Throttling: 250ms between page audits
      await new Promise(res => setTimeout(res, 250))
    }

    // Mark website as audited
    db.prepare(`
      UPDATE websites 
      SET is_audited = 1, 
          last_audit_timestamp = ?, 
          updated_at = ? 
      WHERE id = ?
    `).run(now, now, site.id)
  }
}

export const batchRunner = new FirstAuditBatchRunner()
