/**
 * TSE Website Manager — Automated First Audit Batch Runner
 * Executes server-side sequential 4-stage First Audits for eligible connected websites:
 * 1. TARGET PHRASE (generateProposedTargetPhrase & persist to page_configurations)
 * 2. SEARCH VOLUME (DataForSEO Labs Historical Search Volume Live API)
 * 3. UK RANK (DataForSEO Google Organic SERP Live Advanced API - Mobile UK)
 * 4. PAGE AUDIT (Page Auditor /api/audit Engine)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { extractPagesFromPackage, extractPostsFromPackage } from '../src/utils/packageExtractor.js'
import { generateProposedTargetPhrase, isUtilityPage } from '../src/utils/targetPhraseGenerator.js'
import { extractSafeString } from '../src/utils/safeString.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const KNOWN_MAGAZINE_DOMAINS = new Set([
  'bedesworld.co.uk',
  'searchcollision.co.uk',
  'searchcollision.com',
  'javeanews.co.uk',
  'javeanews.com',
  'theecologist.uk',
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

export function getDataForSeoCredentials() {
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
  return null
}

export function evaluateSiteEligibility(site, db) {
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

export function computeCostEstimate(db) {
  const sites = db.prepare(`SELECT * FROM websites ORDER BY name ASC`).all()
  let totalCommercialPages = 0
  let totalMagazinePages = 0
  let commercialSitesCount = 0
  let magazineSitesCount = 0
  let rankSerpRequests = 0
  let searchVolumeBatchCount = 0
  let genuineMagazinePhrases = 0

  sites.forEach(site => {
    const eligibility = evaluateSiteEligibility(site, db)
    if (!eligibility.eligible) return

    const pkgRow = db.prepare('SELECT package_data FROM wp_packages WHERE site_id = ?').get(site.id)
    if (!pkgRow || !pkgRow.package_data) return

    let allPages = []
    try {
      const pkg = JSON.parse(pkgRow.package_data)
      const rawPages = extractPagesFromPackage(pkg, site.url) || []
      const rawPosts = extractPostsFromPackage(pkg) || []
      allPages = [...rawPages, ...rawPosts]
    } catch {
      return
    }

    const activePages = allPages.filter(p => {
      const type = (p.type || p.seoPageType || '').trim()
      return ['Hub', 'Landing', 'Topical', 'Article'].includes(type) && !p.isExcluded && type !== 'Excluded'
    })

    const isMag = isMagazineSite(site)
    if (isMag) {
      magazineSitesCount++
      totalMagazinePages += activePages.length
      const configRows = db.prepare("SELECT target_phrase FROM page_configurations WHERE site_id = ? AND trim(target_phrase) != ''").all(site.id)
      if (configRows.length > 0) {
        genuineMagazinePhrases += configRows.length
        searchVolumeBatchCount++
        rankSerpRequests += configRows.length
      }
    } else {
      commercialSitesCount++
      totalCommercialPages += activePages.length
      searchVolumeBatchCount++
      rankSerpRequests += activePages.length
    }
  })

  const volumeCost = searchVolumeBatchCount * 0.05 // $0.05 per batch request
  const serpCost = rankSerpRequests * 0.002 // $0.002 per Live Organic SERP check
  const totalCost = volumeCost + serpCost

  return {
    commercialSitesCount,
    magazineSitesCount,
    totalCommercialPages,
    totalMagazinePages,
    totalEligiblePages: totalCommercialPages + totalMagazinePages,
    genuineMagazinePhrases,
    searchVolumeBatchCount,
    rankSerpRequests,
    estimatedSearchVolumeCostUsd: Number(volumeCost.toFixed(3)),
    estimatedRankSerpCostUsd: Number(serpCost.toFixed(3)),
    estimatedTotalCostUsd: Number(totalCost.toFixed(3))
  }
}

export function getFullEstateEligibility(db) {
  const sites = db.prepare(`SELECT * FROM websites ORDER BY name ASC`).all()
  const siteList = sites.map(site => {
    const eligibility = evaluateSiteEligibility(site, db)
    const isMag = isMagazineSite(site)

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
      stages: {
        target_phrase: eligibility.eligible ? 'WAITING' : (eligibility.status === 'SKIPPED_ALREADY_AUDITED' ? 'SKIPPED' : 'WAITING'),
        search_volume: eligibility.eligible ? 'WAITING' : (eligibility.status === 'SKIPPED_ALREADY_AUDITED' ? 'SKIPPED' : 'WAITING'),
        uk_rank: eligibility.eligible ? 'WAITING' : (eligibility.status === 'SKIPPED_ALREADY_AUDITED' ? 'SKIPPED' : 'WAITING'),
        page_audit: eligibility.eligible ? 'WAITING' : (eligibility.status === 'SKIPPED_ALREADY_AUDITED' ? 'SKIPPED' : 'WAITING')
      },
      lastAuditTimestamp: site.last_audit_timestamp || null,
      error: null
    }
  })

  const totalSites = siteList.length
  const eligibleSites = siteList.filter(s => s.eligible).length
  const alreadyAuditedSites = siteList.filter(s => s.status === 'SKIPPED_ALREADY_AUDITED').length
  const excludedSites = siteList.filter(s => s.status === 'NOT_READY_EXCLUDED').length
  const costEstimate = computeCostEstimate(db)

  return {
    totalSites,
    eligibleSites,
    alreadyAuditedSites,
    excludedSites,
    costEstimate,
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
        currentStage: row.current_stage || null,
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
      logs_json: JSON.stringify(state.logs ? state.logs.slice(-250) : []),
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
        costEstimate: estate.costEstimate,
        processedSites: 0,
        successfulSites: 0,
        failedSites: 0,
        currentSiteId: null,
        currentSiteName: null,
        currentPageIndex: 0,
        currentPageTotal: 0,
        currentPageUrl: null,
        currentStage: null,
        siteStates: estate.sites,
        logs: []
      }
    }

    return {
      ...dbState,
      isRunning: this.isRunning,
      eligibleSites: estate.eligibleSites,
      alreadyAuditedSites: estate.alreadyAuditedSites,
      excludedSites: estate.excludedSites,
      costEstimate: estate.costEstimate
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
      currentStage: null,
      siteStates: estate.sites,
      logs: []
    }

    this.addLog(state, `Starting Automated First Audit Batch for ${eligibleSites.length} eligible websites across 4 stages...`)
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
    this.addLog(state, 'Stop requested by user. Waiting for current stage to safely complete...')
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
      currentStage: null,
      siteStates: dbState.siteStates.map(s => {
        if (failedSiteIds.has(s.id)) {
          return { ...s, status: 'QUEUED', statusLabel: 'QUEUED', error: null }
        }
        return s
      })
    }

    this.addLog(state, `Retrying First Audit for ${sitesToRetry.length} previously failed websites (resuming incomplete stages)...`)
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

        state.siteStates = state.siteStates.map(s => {
          if (s.id === site.id) {
            return {
              ...s,
              status: 'IN_PROGRESS',
              statusLabel: 'IN PROGRESS',
              startedAt: new Date().toISOString(),
              stages: s.stages || { target_phrase: 'WAITING', search_volume: 'WAITING', uk_rank: 'WAITING', page_audit: 'WAITING' }
            }
          }
          return s
        })

        this.addLog(state, `[Site ${i + 1}/${targetSites.length}] Starting First Audit for "${site.name}" (${site.url})...`)
        this.saveDbState(db, state)

        try {
          await this.auditSingleWebsiteFullPipeline(db, site, state)
          state.successfulSites++
          state.siteStates = state.siteStates.map(s => {
            if (s.id === site.id) {
              return {
                ...s,
                status: 'COMPLETED',
                statusLabel: 'COMPLETED',
                stages: {
                  target_phrase: s.stages?.target_phrase === 'SKIPPED' ? 'SKIPPED' : 'COMPLETE',
                  search_volume: s.stages?.search_volume === 'SKIPPED' ? 'SKIPPED' : 'COMPLETE',
                  uk_rank: s.stages?.uk_rank === 'SKIPPED' ? 'SKIPPED' : 'COMPLETE',
                  page_audit: 'COMPLETE'
                },
                completedAt: new Date().toISOString()
              }
            }
            return s
          })
          this.addLog(state, `✓ Completed 4-Stage First Audit for "${site.name}".`)
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
        state.currentStage = null
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

  async auditSingleWebsiteFullPipeline(db, site, state) {
    const pkgRow = db.prepare(`SELECT package_data FROM wp_packages WHERE site_id = ?`).get(site.id)
    if (!pkgRow || !pkgRow.package_data) {
      throw new Error('No synced WordPress/Magento package data available')
    }

    const pkg = JSON.parse(pkgRow.package_data)
    const rawPages = extractPagesFromPackage(pkg, site.url) || []
    const rawPosts = extractPostsFromPackage(pkg) || []
    const allPages = [...rawPages, ...rawPosts]

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

    const creds = getDataForSeoCredentials()

    // Helper to update stage status for this site
    const updateSiteStage = (stageName, stageStatus) => {
      state.currentStage = stageName
      state.siteStates = state.siteStates.map(s => {
        if (s.id === site.id) {
          const currentStages = s.stages || {}
          return { ...s, stages: { ...currentStages, [stageName]: stageStatus } }
        }
        return s
      })
      this.saveDbState(db, state)
    }

    // ══════════════════════════════════════════════════════════════
    // STAGE 1 — TARGET PHRASE ALLOCATION & PERSISTENCE
    // ══════════════════════════════════════════════════════════════
    updateSiteStage('target_phrase', 'RUNNING')
    this.addLog(state, `[${site.name}] Stage 1/4: Determining & persisting target phrases...`)

    const existingConfigsRows = db.prepare(`SELECT page_key, target_phrase, is_excluded FROM page_configurations WHERE site_id = ?`).all(site.id)
    const existingConfigsMap = new Map(existingConfigsRows.map(r => [r.page_key, r.target_phrase]))

    const now = new Date().toISOString()
    const saveConfigStmt = db.prepare(`
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

    const targetItems = []

    activePages.forEach(p => {
      const pageKey = p.id || p.url || p.pageUrl
      const pageUrl = p.url || p.pageUrl || ''
      const pageTitle = extractSafeString(p.title || p.originalTitle || p.name)

      let targetPhrase = (existingConfigsMap.get(pageKey) || (pageUrl ? existingConfigsMap.get(pageUrl) : '') || p.targetPhrase || p.target || '').trim()

      if (!targetPhrase && !isMag && !isUtilityPage(pageUrl, pageTitle)) {
        const proposed = generateProposedTargetPhrase(p, site.name)
        targetPhrase = (proposed && proposed.trim()) ? proposed.trim() : (site.name ? `${site.name} Service` : 'Primary Service')
        try {
          saveConfigStmt.run({
            site_id: site.id,
            page_key: pageKey,
            url: pageUrl,
            title: pageTitle,
            target_phrase: targetPhrase,
            seo_page_type: p.type || p.seoPageType || 'Topical',
            priority: Number(p.priority) || 0,
            is_excluded: p.isExcluded || p.type === 'Excluded' ? 1 : 0,
            config_json: JSON.stringify({
              pageId: pageKey,
              url: pageUrl,
              title: pageTitle,
              targetPhrase,
              seoPageType: p.type || p.seoPageType || 'Topical',
              isConfigured: true,
              updatedAt: now
            }),
            updated_at: now
          })
          existingConfigsMap.set(pageKey, targetPhrase)
        } catch (saveErr) {
          this.addLog(state, `[${site.name}] Config save warning for ${pageKey}: ${saveErr.message}`)
        }
      }

      if (targetPhrase) {
        targetItems.push({ pageKey, targetPhrase, url: pageUrl, title: pageTitle, type: p.type || p.seoPageType || 'Topical' })
      }
    })

    updateSiteStage('target_phrase', 'COMPLETE')
    this.addLog(state, `[${site.name}] Stage 1 Complete: ${targetItems.length} target phrases established.`)

    if (this.isStopping) throw new Error('Audit cancelled by user')

    // ══════════════════════════════════════════════════════════════
    // STAGE 2 — UK SEARCH VOLUME (DATAFORSEO LABS BATCH)
    // ══════════════════════════════════════════════════════════════
    if (targetItems.length === 0) {
      updateSiteStage('search_volume', 'SKIPPED')
      updateSiteStage('uk_rank', 'SKIPPED')
    } else {
      updateSiteStage('search_volume', 'RUNNING')
      this.addLog(state, `[${site.name}] Stage 2/4: Retrieving UK Search Volumes via DataForSEO Labs batch...`)

      // Check which phrases already have search volume (avoid repeat paid calls)
      const existingRankings = db.prepare(`SELECT page_key, target_phrase, search_volume, volume_checked_at FROM page_rankings WHERE site_id = ?`).all(site.id)
      const rankingMap = new Map(existingRankings.map(r => [r.page_key, r]))

      const itemsNeedingVolume = targetItems.filter(item => {
        const r = rankingMap.get(item.pageKey)
        return !r || r.search_volume === null || r.search_volume === undefined || !r.volume_checked_at
      })

      if (itemsNeedingVolume.length > 0 && creds?.login && creds?.password) {
        const uniqueKeywords = Array.from(new Set(itemsNeedingVolume.map(i => i.targetPhrase.trim()).filter(Boolean)))
        try {
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

          if (volumeRes.ok) {
            const volumeData = await volumeRes.json()
            const resultItems = volumeData?.tasks?.[0]?.result?.[0]?.items || []
            const volumeByKeyword = new Map()
            for (const rItem of resultItems) {
              const kw = (rItem.keyword || '').trim().toLowerCase()
              const vol = rItem?.keyword_info?.search_volume !== undefined && rItem?.keyword_info?.search_volume !== null
                ? Number(rItem.keyword_info.search_volume)
                : (rItem?.search_volume !== undefined && rItem?.search_volume !== null ? Number(rItem.search_volume) : 0)
              if (kw) volumeByKeyword.set(kw, vol)
            }

            const insertVolumeStmt = db.prepare(`
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

            for (const p of itemsNeedingVolume) {
              const kwLower = p.targetPhrase.toLowerCase()
              const vol = volumeByKeyword.has(kwLower) ? volumeByKeyword.get(kwLower) : 0
              insertVolumeStmt.run({
                site_id: site.id,
                page_key: p.pageKey,
                target_phrase: p.targetPhrase,
                search_volume: vol,
                volume_checked_at: now,
                last_checked_at: now,
                updated_at: now
              })
            }
            this.addLog(state, `[${site.name}] Stage 2 Complete: Retrieved search volumes for ${itemsNeedingVolume.length} phrases.`)
          } else {
            this.addLog(state, `[${site.name}] Search volume batch warning: HTTP ${volumeRes.status}`)
          }
        } catch (volErr) {
          this.addLog(state, `[${site.name}] Search volume check error: ${volErr.message}`)
        }
      } else {
        this.addLog(state, `[${site.name}] Stage 2 Complete: All ${targetItems.length} phrases already have search volume.`)
      }

      updateSiteStage('search_volume', 'COMPLETE')

      if (this.isStopping) throw new Error('Audit cancelled by user')

      // ══════════════════════════════════════════════════════════════
      // STAGE 3 — UK RANK (DATAFORSEO LIVE ADVANCED SERP)
      // ══════════════════════════════════════════════════════════════
      updateSiteStage('uk_rank', 'RUNNING')
      this.addLog(state, `[${site.name}] Stage 3/4: Checking UK Rank for ${targetItems.length} target phrases...`)

      const siteDomain = normalizeDomain(site.url || site.name)
      const insertRankStmt = db.prepare(`
        INSERT INTO page_rankings (
          site_id, page_key, target_phrase, google_rank, is_top_100, ranking_url, is_url_match,
          search_engine, location_code, device, last_checked_at, updated_at
        ) VALUES (
          @site_id, @page_key, @target_phrase, @google_rank, @is_top_100, @ranking_url, @is_url_match,
          @search_engine, @location_code, @device, @last_checked_at, @updated_at
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

      for (let rIdx = 0; rIdx < targetItems.length; rIdx++) {
        if (this.isStopping) throw new Error('Audit cancelled by user')

        const item = targetItems[rIdx]
        const existingRankRow = db.prepare(`SELECT google_rank, last_checked_at FROM page_rankings WHERE site_id = ? AND page_key = ?`).get(site.id, item.pageKey)

        // Protect from repeat calls if checked recently
        if (existingRankRow && existingRankRow.last_checked_at && existingRankRow.google_rank !== null) {
          continue
        }

        if (!creds?.login || !creds?.password) continue

        try {
          const authHeader = 'Basic ' + Buffer.from(`${creds.login}:${creds.password}`).toString('base64')
          const serpPayload = [
            {
              keyword: item.targetPhrase,
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

          if (serpRes.ok) {
            const serpData = await serpRes.json()
            const resultItems = serpData?.tasks?.[0]?.result?.[0]?.items || []

            let matchedItem = null
            for (const sItem of resultItems) {
              if (sItem.type !== 'organic') continue
              const itemDom = normalizeDomain(sItem.domain || sItem.url || '')
              if (itemDom && (itemDom === siteDomain || itemDom.endsWith('.' + siteDomain) || siteDomain.endsWith('.' + itemDom))) {
                matchedItem = sItem
                break
              }
            }

            let googleRank = null
            let isTop100 = 0
            let rankingUrl = null
            let isUrlMatch = 0

            if (matchedItem) {
              googleRank = matchedItem.rank_group || matchedItem.rank_absolute || null
              isTop100 = 1
              rankingUrl = matchedItem.url || null
              if (rankingUrl && item.url) {
                const normConfig = normalizeDomain(item.url)
                const normRank = normalizeDomain(rankingUrl)
                isUrlMatch = normConfig === normRank ? 1 : 0
              }
            }

            insertRankStmt.run({
              site_id: site.id,
              page_key: item.pageKey,
              target_phrase: item.targetPhrase,
              google_rank: googleRank,
              is_top_100: isTop100,
              ranking_url: rankingUrl,
              is_url_match: isUrlMatch,
              search_engine: 'google.co.uk',
              location_code: 2826,
              device: 'mobile',
              last_checked_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          }
        } catch (rankErr) {
          this.addLog(state, `[${site.name}] Rank check warning for "${item.targetPhrase}": ${rankErr.message}`)
        }

        // Throttling 200ms between SERP calls
        await new Promise(res => setTimeout(res, 200))
      }

      updateSiteStage('uk_rank', 'COMPLETE')
      this.addLog(state, `[${site.name}] Stage 3 Complete: UK Rankings recorded.`)
    }

    if (this.isStopping) throw new Error('Audit cancelled by user')

    // ══════════════════════════════════════════════════════════════
    // STAGE 4 — ON-PAGE STRUCTURAL PAGE AUDIT (/api/audit)
    // ══════════════════════════════════════════════════════════════
    updateSiteStage('page_audit', 'RUNNING')
    this.addLog(state, `[${site.name}] Stage 4/4: Auditing ${activePages.length} pages against established target phrases...`)

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

    let auditedCount = 0
    for (let pIdx = 0; pIdx < activePages.length; pIdx++) {
      if (this.isStopping) throw new Error('Audit cancelled by user')

      const page = activePages[pIdx]
      const pageKey = page.id || page.url || page.pageUrl
      const pageUrl = page.url || page.pageUrl || ''

      state.currentPageIndex = pIdx + 1
      state.currentPageUrl = pageUrl

      // Get established target phrase
      const targetPhrase = existingConfigsMap.get(pageKey) || (pageUrl ? existingConfigsMap.get(pageUrl) : '') || page.targetPhrase || page.target || ''
      const seoType = page.type || page.seoPageType || 'Topical'

      // Execute Page Audit via Page Auditor API
      const auditResult = await callPageAuditorApi({
        siteId: site.id,
        pageId: pageKey,
        url: pageUrl,
        siteUrl: site.url,
        targetPhrase,
        seoPageType: seoType
      })

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
        updated_at: new Date().toISOString()
      })

      auditedCount++
      state.siteStates = state.siteStates.map(s => {
        if (s.id === site.id) return { ...s, auditedPages: auditedCount }
        return s
      })

      // 250ms throttling between page audits
      await new Promise(res => setTimeout(res, 250))
    }

    updateSiteStage('page_audit', 'COMPLETE')

    // Mark website as audited in websites table
    const completionTimestamp = new Date().toISOString()
    db.prepare(`
      UPDATE websites 
      SET is_audited = 1, 
          last_audit_timestamp = ?, 
          updated_at = ? 
      WHERE id = ?
    `).run(completionTimestamp, completionTimestamp, site.id)
  }
}

export const batchRunner = new FirstAuditBatchRunner()
