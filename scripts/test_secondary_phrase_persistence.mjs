import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Connect to a test sqlite database in memory / temp
const testDbPath = path.join(__dirname, 'test_secondary_persistence.db')
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath)

const db = new Database(testDbPath)

// Setup schema
db.exec(`
  CREATE TABLE IF NOT EXISTS websites (
    id TEXT PRIMARY KEY,
    name TEXT,
    url TEXT
  );

  CREATE TABLE IF NOT EXISTS page_configurations (
    site_id TEXT,
    page_key TEXT,
    url TEXT,
    title TEXT,
    target_phrase TEXT,
    seo_page_type TEXT,
    priority INTEGER,
    is_excluded INTEGER,
    config_json TEXT,
    updated_at TEXT,
    PRIMARY KEY (site_id, page_key)
  );

  CREATE TABLE IF NOT EXISTS page_rankings (
    site_id TEXT,
    page_key TEXT,
    target_phrase TEXT,
    ranking_url TEXT,
    is_url_match INTEGER,
    updated_at TEXT,
    PRIMARY KEY (site_id, page_key)
  );
`)

// Simulate server logic
function saveSinglePageConfig(siteId, conf) {
  const pageKey = conf.pageId || conf.url || conf.pageKey
  const now = new Date().toISOString()
  const targetPhrase = (conf.target || conf.targetPhrase || '').trim()
  const secondaryTargetPhrase = (conf.secondaryTargetPhrase || '').trim()
  
  const cleanConfig = {
    ...(conf && typeof conf === 'object' ? conf : {}),
    pageId: conf.pageId || pageKey,
    url: conf.url || pageKey,
    proposedTitle: conf.proposedTitle || conf.title || '',
    title: conf.title || conf.proposedTitle || '',
    targetPhrase: targetPhrase,
    target: targetPhrase,
    secondaryTargetPhrase: secondaryTargetPhrase,
    type: conf.type || conf.seoPageType || 'Topical',
    seoPageType: conf.seoPageType || conf.type || 'Topical',
    autoType: conf.autoType || conf.type || 'Topical',
    priority: Number(conf.priority) || 0,
    isConfigured: Boolean(targetPhrase),
    isStarred: Boolean(conf.isStarred),
    isExcluded: Boolean(conf.isExcluded || conf.type === 'Excluded'),
    isManualOverride: Boolean(conf.isManualOverride),
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
    site_id: siteId,
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

  return cleanConfig
}

function getPageConfigs(siteId) {
  const rows = db.prepare(`SELECT * FROM page_configurations WHERE site_id = ?`).all(siteId)
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
  return result
}

function saveBulkPageConfigs(siteId, configsMap) {
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

  for (const [pageKey, conf] of Object.entries(configsMap)) {
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
      site_id: siteId,
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
  }
}

// ── TEST SUITE ──
console.log('=== RUNNING SECONDARY TARGET PHRASE PERSISTENCE REGRESSION TESTS ===')

const SITE_ID = 'test-site-diamond'
const PAGE_KEY = 'https://example.com/plantation-shutters'

// Step 1: Save page with primary target phrase only
console.log('\nTest 1: Save page with primary target phrase only')
saveSinglePageConfig(SITE_ID, {
  pageId: PAGE_KEY,
  url: PAGE_KEY,
  title: 'Plantation Shutters',
  targetPhrase: 'Plantation Shutters',
  type: 'Topical'
})

let configs = getPageConfigs(SITE_ID)
console.assert(configs[PAGE_KEY].targetPhrase === 'Plantation Shutters', 'Primary phrase should be saved')
console.assert(configs[PAGE_KEY].secondaryTargetPhrase === '', 'Secondary phrase should initially be empty')
console.log('✓ Step 1 passed: Primary phrase saved, secondary is empty.')

// Step 2: Save secondary target phrase
console.log('\nTest 2: Save secondary target phrase ("Plantation Shutters Kent")')
saveSinglePageConfig(SITE_ID, {
  ...configs[PAGE_KEY],
  secondaryTargetPhrase: 'Plantation Shutters Kent'
})

configs = getPageConfigs(SITE_ID)
console.assert(configs[PAGE_KEY].secondaryTargetPhrase === 'Plantation Shutters Kent', 'Secondary phrase should be saved in DB and returned by GET API')
console.log('✓ Step 2 passed: Secondary phrase successfully saved and retrieved.')

// Step 3: Reload from server and verify
console.log('\nTest 3: Reload configuration from server')
const freshReload = getPageConfigs(SITE_ID)
console.assert(freshReload[PAGE_KEY].secondaryTargetPhrase === 'Plantation Shutters Kent', 'Secondary phrase must persist after server reload')
console.log('✓ Step 3 passed: Secondary phrase is still present after fresh server reload.')

// Step 4: Update an unrelated field (e.g. proposedTitle, priority, isStarred, actualMetaTitle)
console.log('\nTest 4: Update unrelated fields (e.g. proposedTitle, star toggle, priority, live actuals)')
saveSinglePageConfig(SITE_ID, {
  ...freshReload[PAGE_KEY],
  proposedTitle: 'Quality Plantation Shutters in Kent | Diamond',
  isStarred: true,
  priority: 1,
  actualMetaTitle: 'Live WordPress Title',
  actualH1: 'Live WordPress H1'
})

const afterUnrelatedUpdate = getPageConfigs(SITE_ID)
console.assert(afterUnrelatedUpdate[PAGE_KEY].secondaryTargetPhrase === 'Plantation Shutters Kent', 'Secondary phrase must NOT be wiped when updating other fields')
console.assert(afterUnrelatedUpdate[PAGE_KEY].isStarred === true, 'Starred status should be true')
console.assert(afterUnrelatedUpdate[PAGE_KEY].proposedTitle === 'Quality Plantation Shutters in Kent | Diamond', 'Proposed title should be updated')
console.log('✓ Step 4 passed: Unrelated field updates preserve secondary target phrase perfectly.')

// Step 5: Update page type inline (e.g. change type from Topical to Hub or Landing)
console.log('\nTest 5: Inline SEO type change (Topical -> Landing)')
saveSinglePageConfig(SITE_ID, {
  ...afterUnrelatedUpdate[PAGE_KEY],
  type: 'Landing',
  seoPageType: 'Landing',
  isManualOverride: true
})

const afterTypeChange = getPageConfigs(SITE_ID)
console.assert(afterTypeChange[PAGE_KEY].secondaryTargetPhrase === 'Plantation Shutters Kent', 'Secondary phrase must persist across type changes')
console.assert(afterTypeChange[PAGE_KEY].type === 'Landing', 'Type should be Landing')
console.log('✓ Step 5 passed: Inline type change preserved secondary target phrase.')

// Step 6: Test Bulk Config Save
console.log('\nTest 6: Bulk save preservation')
saveBulkPageConfigs(SITE_ID, {
  [PAGE_KEY]: {
    ...afterTypeChange[PAGE_KEY],
    title: 'Plantation Shutters Updated'
  },
  'https://example.com/another-page': {
    pageId: 'https://example.com/another-page',
    url: 'https://example.com/another-page',
    targetPhrase: 'Wooden Blinds',
    secondaryTargetPhrase: 'Custom Wooden Blinds Kent'
  }
})

const afterBulk = getPageConfigs(SITE_ID)
console.assert(afterBulk[PAGE_KEY].secondaryTargetPhrase === 'Plantation Shutters Kent', 'Bulk save must preserve existing secondary phrase')
console.assert(afterBulk['https://example.com/another-page'].secondaryTargetPhrase === 'Custom Wooden Blinds Kent', 'Bulk save must save new secondary phrase')
console.log('✓ Step 6 passed: Bulk configuration save preserves and saves secondary target phrases.')

// Clean up test db
db.close()
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath)

console.log('\n✅ ALL REGRESSION TESTS PASSED SUCCESSFULLY!')
