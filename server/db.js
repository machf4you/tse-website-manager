import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbDir = process.env.PERSISTENT_STORAGE_DIR || __dirname
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
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    platform TEXT,
    portfolio TEXT,
    status TEXT,
    is_audited INTEGER DEFAULT 0,
    last_audit_timestamp TEXT,
    sync_status TEXT,
    last_sync_timestamp TEXT,
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
`)

export default db
