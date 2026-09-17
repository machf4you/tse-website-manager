import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sharedDbDir = path.resolve(__dirname, '..', 'shared_db')
let dbDir = process.env.PERSISTENT_STORAGE_DIR || (fs.existsSync(path.join(sharedDbDir, 'website_manager.db')) ? sharedDbDir : __dirname)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}
const dbPath = path.join(dbDir, 'website_manager.db')

const db = new Database(dbPath)

// Enable WAL mode for high performance & reliability
db.pragma('journal_mode = WAL')

// Initialize SQLite Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS websites (
    id TEXT PRIMARY KEY,
    domain_id TEXT DEFAULT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    platform TEXT,
    portfolio TEXT,
    status TEXT,
    is_audited INTEGER DEFAULT 0,
    last_audit_timestamp TEXT,
    sync_status TEXT,
    last_sync_timestamp TEXT,
    total_pages INTEGER DEFAULT 0,
    config_data TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS wp_packages (
    site_id TEXT PRIMARY KEY,
    package_data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(site_id) REFERENCES websites(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS page_configurations (
    site_id TEXT NOT NULL,
    page_key TEXT NOT NULL,
    url TEXT,
    title TEXT,
    target_phrase TEXT,
    seo_page_type TEXT,
    priority INTEGER DEFAULT 0,
    is_excluded INTEGER DEFAULT 0,
    config_json TEXT,
    updated_at TEXT,
    PRIMARY KEY(site_id, page_key)
  );

  CREATE TABLE IF NOT EXISTS page_audits (
    site_id TEXT NOT NULL,
    page_key TEXT NOT NULL,
    is_audited INTEGER DEFAULT 1,
    is_stale INTEGER DEFAULT 0,
    stale_reason TEXT,
    last_audit_timestamp TEXT,
    fingerprint TEXT,
    audit_result_json TEXT,
    updated_at TEXT,
    PRIMARY KEY(site_id, page_key)
  );

  CREATE TABLE IF NOT EXISTS global_settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS link_recommendations (
    site_id TEXT NOT NULL,
    rec_key TEXT NOT NULL,
    source_url TEXT,
    target_url TEXT,
    anchor_text TEXT,
    saved_sentence TEXT,
    is_saved INTEGER DEFAULT 1,
    rec_json TEXT,
    updated_at TEXT,
    PRIMARY KEY(site_id, rec_key)
  );

  CREATE TABLE IF NOT EXISTS page_rankings (
    site_id TEXT NOT NULL,
    page_key TEXT NOT NULL,
    target_phrase TEXT NOT NULL,
    google_rank INTEGER DEFAULT NULL,
    is_top_100 INTEGER DEFAULT 0,
    ranking_url TEXT DEFAULT NULL,
    is_url_match INTEGER DEFAULT 0,
    search_volume INTEGER DEFAULT NULL,
    volume_checked_at TEXT DEFAULT NULL,
    search_engine TEXT DEFAULT 'google.co.uk',
    location_code INTEGER DEFAULT 2826,
    device TEXT DEFAULT 'mobile',
    last_checked_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(site_id, page_key),
    FOREIGN KEY(site_id) REFERENCES websites(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS serp_task_queue (
    task_id TEXT NOT NULL,
    site_id TEXT NOT NULL,
    page_key TEXT NOT NULL,
    target_phrase TEXT NOT NULL,
    configured_url TEXT,
    device TEXT DEFAULT 'mobile',
    status TEXT DEFAULT 'pending',
    submitted_at TEXT NOT NULL,
    completed_at TEXT,
    cost REAL DEFAULT 0,
    PRIMARY KEY(task_id, page_key)
  );
`)

// Safe idempotent migration: ensure domain_id column and index exist on websites table
try {
  const colCheck = db.pragma('table_info(websites)')
  const hasDomainId = colCheck.some(col => col.name === 'domain_id')
  if (!hasDomainId) {
    db.exec(`
      ALTER TABLE websites ADD COLUMN domain_id TEXT DEFAULT NULL;
    `)
  }
  const hasTotalPages = colCheck.some(col => col.name === 'total_pages')
  if (!hasTotalPages) {
    db.exec(`
      ALTER TABLE websites ADD COLUMN total_pages INTEGER DEFAULT 0;
    `)
  }
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_websites_domain_id ON websites(domain_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_websites_unique_domain_id ON websites(domain_id) WHERE domain_id IS NOT NULL;
  `)
} catch (e) {
  console.error('Error ensuring schema columns exist on websites table:', e)
}

// Safe idempotent migration: ensure search_volume and volume_checked_at columns exist on page_rankings
try {
  const rankingCols = db.pragma('table_info(page_rankings)')
  if (!rankingCols.some(col => col.name === 'search_volume')) {
    db.exec(`ALTER TABLE page_rankings ADD COLUMN search_volume INTEGER DEFAULT NULL;`)
  }
  if (!rankingCols.some(col => col.name === 'volume_checked_at')) {
    db.exec(`ALTER TABLE page_rankings ADD COLUMN volume_checked_at TEXT DEFAULT NULL;`)
  }
} catch (e) {
  console.error('Error ensuring search_volume columns exist on page_rankings table:', e)
}

export const getAllWebsitesStmt = db.prepare('SELECT * FROM websites')
export const getWebsiteByIdStmt = db.prepare('SELECT * FROM websites WHERE id = ?')
export const getWebsiteByDomainIdStmt = db.prepare('SELECT * FROM websites WHERE domain_id = ?')

export function getAllWebsitesFromDb() {
  return getAllWebsitesStmt.all()
}

export function getWebsiteByIdFromDb(id) {
  return getWebsiteByIdStmt.get(String(id))
}

export function getWebsiteByDomainIdFromDb(domainId) {
  return getWebsiteByDomainIdStmt.get(String(domainId))
}

export default db
