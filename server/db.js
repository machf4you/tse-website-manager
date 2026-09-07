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

  CREATE TABLE IF NOT EXISTS app_progress (
    app_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    live_url TEXT,
    repo_ref TEXT,
    status TEXT NOT NULL DEFAULT 'DEVELOPMENT',
    version TEXT,
    completed_summary TEXT,
    current_work TEXT,
    next_action TEXT,
    blocked_by TEXT,
    deployment_status TEXT,
    notes TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_progress_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id TEXT NOT NULL,
    status TEXT NOT NULL,
    version TEXT,
    snapshot_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(app_id) REFERENCES app_progress(app_id) ON DELETE CASCADE
  );
`)

// Seed initial 7 application progress records if not present
const seedApps = [
  {
    app_id: 'APPS_DASHBOARD',
    name: 'TSE Apps Dashboard',
    live_url: 'https://apps.thesearchequation.co.uk/',
    repo_ref: 'machf4you/tse-website-manager',
    status: 'LIVE',
    version: 'v2.11-stable-apps-dashboard-hierarchy-confirmed',
    completed_summary: 'Central TSE Apps launchpad/dashboard is live. Application hierarchy and dashboard structure confirmed stable. App Progress facility now being added.',
    current_work: 'Adding permanent server-backed App Progress tracking.',
    next_action: 'Complete and deploy App Progress after verification.',
    blocked_by: '',
    deployment_status: 'Live on current TSE Apps infrastructure.',
    notes: ''
  },
  {
    app_id: 'WEBSITE_MANAGEMENT',
    name: 'TSE Website Manager',
    live_url: 'https://tse-website-manager.thesearchequation.co.uk/',
    repo_ref: 'machf4you/tse-website-manager',
    status: 'DEVELOPMENT',
    version: 'v2.11-stable-apps-dashboard-hierarchy-confirmed',
    completed_summary: 'Core Website Manager is operational. HF4You Magento hierarchy and audit workflow have previously been developed and verified. Apps Dashboard hierarchy is stable.',
    current_work: 'Website Manager development remains active. Magento HF and WordPress Ascent work are current areas being progressed.',
    next_action: 'Continue current Website Manager development after App Progress deployment.',
    blocked_by: '',
    deployment_status: 'Existing Website Manager application deployed.',
    notes: ''
  },
  {
    app_id: 'LEAD_GENERATOR',
    name: 'Lead Generator V2',
    live_url: 'https://lead-gen.thesearchequation.co.uk/',
    repo_ref: 'machf4you/lead-gen',
    status: 'LIVE',
    version: 'Unknown / Not Recorded',
    completed_summary: 'Lead Generator V2 is the current active lead generation application. Previous Lead Finder version is obsolete.',
    current_work: 'Current deployed Lead Generator is operational.',
    next_action: 'No immediate development action recorded.',
    blocked_by: '',
    deployment_status: 'Live application. Dedicated deployment service has been confirmed operational.',
    notes: ''
  },
  {
    app_id: 'SITE_REGISTRY',
    name: 'TSE Site Registry',
    live_url: 'https://site-registry.thesearchequation.co.uk/',
    repo_ref: 'machf4you/tse-site-registry',
    status: 'AWAITING ANKIT',
    version: 'v1.1-master-domain-schema-baseline',
    completed_summary: 'Development clone established against isolated DEV Supabase. Master Domain schema created and 126 domain records migrated. Read-only Site Registry interface created. Local development/build work completed.',
    current_work: 'Preparing first live DEV deployment of Site Registry.',
    next_action: 'Ankit must configure Site Registry on the NEW TSE Apps server 77.245.157.66. After server setup is confirmed, DNS and external deployment verification can be completed.',
    blocked_by: 'Awaiting Ankit server-side configuration on 77.245.157.66.',
    deployment_status: 'Not live yet. Server deployment pending.',
    notes: ''
  },
  {
    app_id: 'SITE_AUDITOR',
    name: 'TSE Site Analyzer',
    live_url: 'https://audit-dev.thesearchequation.co.uk/',
    repo_ref: 'machf4you/tse-site-audit-engine',
    status: 'DEVELOPMENT',
    version: 'Unknown / Not Recorded',
    completed_summary: 'Existing Site Analyzer / audit application exists and is deployed in development form.',
    current_work: 'No current active development task recorded.',
    next_action: 'Resume Site Analyzer development when prioritised.',
    blocked_by: '',
    deployment_status: 'Development application exists at audit-dev.',
    notes: ''
  },
  {
    app_id: 'PAGE_AUDITOR',
    name: 'Page Auditor',
    live_url: 'Integrated within Website Manager',
    repo_ref: 'Integrated component of machf4you/tse-website-manager',
    status: 'LIVE',
    version: 'Unknown / Not Recorded',
    completed_summary: 'Page-level audit workflow is integrated into Website Manager and has been used successfully.',
    current_work: 'No separate active development task recorded.',
    next_action: 'Maintain as part of Website Manager workflow.',
    blocked_by: '',
    deployment_status: 'Integrated within Website Manager.',
    notes: ''
  },
  {
    app_id: 'SOCIAL_AUTOMATION',
    name: 'TSE Social Automation',
    live_url: 'https://automation.thesearchequation.co.uk/',
    repo_ref: 'machf4you/tse-social-automation',
    status: 'DEVELOPMENT',
    version: 'Unknown / Not Recorded',
    completed_summary: 'n8n-based social automation system established. Facebook posting has worked. Pinterest Standard Access has been approved. Google Business Profile OAuth has worked, with API/access work previously pending.',
    current_work: 'Development is currently parked while Website Manager / Site Registry work is prioritised.',
    next_action: 'Resume Social Automation development later, including remaining platform integrations.',
    blocked_by: 'Currently parked by priority, not a technical blocker.',
    deployment_status: 'Automation infrastructure exists. Do not claim all social integrations are fully operational.',
    notes: ''
  }
]

const insertStmt = db.prepare(`
  INSERT INTO app_progress (app_id, name, live_url, repo_ref, status, version, completed_summary, current_work, next_action, blocked_by, deployment_status, notes, updated_at)
  VALUES (@app_id, @name, @live_url, @repo_ref, @status, @version, @completed_summary, @current_work, @next_action, @blocked_by, @deployment_status, @notes, CURRENT_TIMESTAMP)
  ON CONFLICT(app_id) DO UPDATE SET
    name = excluded.name,
    live_url = excluded.live_url,
    repo_ref = excluded.repo_ref,
    status = excluded.status,
    version = excluded.version,
    completed_summary = excluded.completed_summary,
    current_work = excluded.current_work,
    next_action = excluded.next_action,
    blocked_by = excluded.blocked_by,
    deployment_status = excluded.deployment_status,
    notes = excluded.notes,
    updated_at = CURRENT_TIMESTAMP
`)

const insertHistoryStmt = db.prepare(`
  INSERT INTO app_progress_history (app_id, status, version, snapshot_json, created_at)
  VALUES (@app_id, @status, @version, @snapshot_json, CURRENT_TIMESTAMP)
`)

db.transaction(() => {
  for (const app of seedApps) {
    const existing = db.prepare('SELECT id FROM app_progress_history WHERE app_id = ?').get(app.app_id)
    insertStmt.run(app)
    if (!existing) {
      insertHistoryStmt.run({
        app_id: app.app_id,
        status: app.status,
        version: app.version,
        snapshot_json: JSON.stringify(app)
      })
    }
  }
})()

export const getAllWebsitesStmt = db.prepare('SELECT * FROM websites')
export const getWebsiteByIdStmt = db.prepare('SELECT * FROM websites WHERE id = ?')

export function getAllWebsitesFromDb() {
  return getAllWebsitesStmt.all()
}

export function getWebsiteByIdFromDb(id) {
  return getWebsiteByIdStmt.get(String(id))
}

export default db
