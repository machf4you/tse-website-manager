#!/usr/bin/env node
/**
 * TSE Website Manager — Automated Weekly Mobile Google UK Rank Tracker Engine
 * Scheduled to run weekly on Sunday at 02:00 UTC via system crontab.
 * Updates shared page_rankings and rank_history tables used by W3 and W6.
 */

const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

// Determine database path
const sharedDbDir = path.resolve(__dirname, '..', 'shared_db')
let dbDir = process.env.PERSISTENT_STORAGE_DIR || (fs.existsSync(path.join(sharedDbDir, 'website_manager.db')) ? sharedDbDir : path.resolve(__dirname, '..', 'server'))
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}
const dbPath = path.join(dbDir, 'website_manager.db')
const db = new Database(dbPath)

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

function getDataForSeoCredentials() {
  const login = process.env.DATAFORSEO_LOGIN || 'mac@thesearchequation.com'
  const password = process.env.DATAFORSEO_PASSWORD || '58a36efd9275cbdf'
  return { login, password }
}

async function runWeeklyRankCheck() {
  const logPrefix = `[WEEKLY RANK TRACKER - ${new Date().toISOString()}]`
  console.log(`${logPrefix} Starting automated weekly rank check...`)

  const creds = getDataForSeoCredentials()
  if (!creds.login || !creds.password) {
    console.error(`${logPrefix} DataForSEO credentials missing. Aborting.`)
    process.exit(1)
  }

  const authHeader = 'Basic ' + Buffer.from(`${creds.login}:${creds.password}`).toString('base64')
  const sites = db.prepare('SELECT id, name, url FROM websites').all()
  console.log(`${logPrefix} Found ${sites.length} sites to evaluate.`)

  let totalPhrasesChecked = 0
  let totalErrors = 0

  const upsertRankingStmt = db.prepare(`
    INSERT INTO page_rankings (
      site_id, page_key, phrase_type, target_phrase, google_rank, is_top_100, ranking_url, is_url_match, search_engine, location_code, device, last_checked_at, updated_at
    ) VALUES (
      @site_id, @page_key, @phrase_type, @target_phrase, @google_rank, @is_top_100, @ranking_url, @is_url_match, 'google.co.uk', 2826, 'mobile', @last_checked_at, @updated_at
    )
    ON CONFLICT(site_id, page_key, phrase_type) DO UPDATE SET
      target_phrase = excluded.target_phrase,
      google_rank = excluded.google_rank,
      is_top_100 = excluded.is_top_100,
      ranking_url = excluded.ranking_url,
      is_url_match = excluded.is_url_match,
      device = 'mobile',
      last_checked_at = excluded.last_checked_at,
      updated_at = excluded.updated_at
  `)

  const insertHistoryStmt = db.prepare(`
    INSERT INTO rank_history (
      site_id, page_key, target_phrase, google_rank, is_top_100, ranking_url, is_url_match, search_engine, location_code, device, checked_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, 'google.co.uk', 2826, 'mobile', ?
    )
  `)

  for (const site of sites) {
    const siteDomain = extractHostnameFromUrl(site.url || site.name)
    if (!siteDomain) continue

    const configRows = db.prepare(`SELECT * FROM page_configurations WHERE site_id = ? AND (is_excluded = 0 OR is_excluded IS NULL)`).all(site.id)

    for (const c of configRows) {
      let parsed = {}
      try { parsed = JSON.parse(c.config_json || '{}') } catch(e) {}
      if (parsed.isExcluded || c.seo_page_type === 'Excluded' || parsed.type === 'Excluded') continue

      const rawKey = c.page_key || ''
      const cleanKey = rawKey.replace(/^\/+/, '').replace(/\/+$/, '')
      if (!cleanKey || rawKey.startsWith('/') || rawKey.startsWith('http://') || rawKey.startsWith('https://')) continue

      const phrasesToTest = []
      const primaryPhrase = (c.target_phrase || parsed.targetPhrase || parsed.target || '').trim()
      if (primaryPhrase) {
        phrasesToTest.push({ phrase: primaryPhrase, type: 'primary', configuredUrl: c.url || parsed.url || (cleanKey === 'home' ? '/' : `/${cleanKey}`) })
      }

      const secPhrase = (parsed.secondaryTargetPhrase || parsed.secondary_target_phrase || parsed.secondaryTarget || '').trim()
      if (secPhrase) {
        phrasesToTest.push({ phrase: secPhrase, type: 'secondary', configuredUrl: c.url || parsed.url || (cleanKey === 'home' ? '/' : `/${cleanKey}`) })
      }

      for (const pItem of phrasesToTest) {
        try {
          const serpPayload = [{
            keyword: pItem.phrase,
            location_code: 2826,
            language_code: 'en',
            se_domain: 'google.co.uk',
            device: 'mobile',
            os: 'android',
            depth: 100
          }]

          const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(serpPayload)
          })

          if (!res.ok) {
            totalErrors++
            continue
          }

          const data = await res.json()
          const task = data?.tasks?.[0]
          if (!task || task.status_code !== 20000) {
            totalErrors++
            continue
          }

          const items = task?.result?.[0]?.items || []
          let matchedItem = null
          for (const item of items) {
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
            const normConfigured = normalizeUrlForMatching(pItem.configuredUrl, site.url)
            isUrlMatch = (normRanking && normConfigured && normRanking === normConfigured) ? 1 : 0
          }

          upsertRankingStmt.run({
            site_id: site.id,
            page_key: cleanKey,
            phrase_type: pItem.type,
            target_phrase: pItem.phrase,
            google_rank: googleRank,
            is_top_100: isTop100,
            ranking_url: rankingUrl,
            is_url_match: isUrlMatch,
            last_checked_at: now,
            updated_at: now
          })

          insertHistoryStmt.run(site.id, cleanKey, pItem.phrase, googleRank, isTop100, rankingUrl, isUrlMatch, now)
          totalPhrasesChecked++

          // 500ms rate limit delay between API calls
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (err) {
          console.error(`${logPrefix} Error checking "${pItem.phrase}" for ${site.name}:`, err.message)
          totalErrors++
        }
      }
    }
  }

  console.log(`${logPrefix} Weekly rank check completed. Checked ${totalPhrasesChecked} phrases across ${sites.length} sites. Errors: ${totalErrors}.`)
}

if (require.main === module) {
  runWeeklyRankCheck().then(() => process.exit(0)).catch(e => {
    console.error('Fatal error in weekly rank check:', e)
    process.exit(1)
  })
}

module.exports = { runWeeklyRankCheck }
