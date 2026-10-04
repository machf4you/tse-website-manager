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
    phrase_type TEXT DEFAULT 'primary',
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
    PRIMARY KEY(site_id, page_key, phrase_type),
    FOREIGN KEY(site_id) REFERENCES websites(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS social_generated_images (
    id TEXT PRIMARY KEY,
    site_id TEXT,
    prompt TEXT NOT NULL,
    model TEXT NOT NULL,
    file_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    mime_type TEXT DEFAULT 'image/jpeg',
    file_size INTEGER,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS social_generated_videos (
    id TEXT PRIMARY KEY,
    site_id TEXT,
    source_image_id TEXT,
    prompt TEXT NOT NULL,
    model TEXT NOT NULL,
    file_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    mime_type TEXT DEFAULT 'video/mp4',
    file_size INTEGER,
    created_at TEXT NOT NULL
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

  CREATE TABLE IF NOT EXISTS rank_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id TEXT NOT NULL,
    page_key TEXT NOT NULL,
    target_phrase TEXT NOT NULL,
    google_rank INTEGER DEFAULT NULL,
    is_top_100 INTEGER DEFAULT 0,
    ranking_url TEXT DEFAULT NULL,
    is_url_match INTEGER DEFAULT 0,
    search_volume INTEGER DEFAULT NULL,
    search_engine TEXT DEFAULT 'google.co.uk',
    location_code INTEGER DEFAULT 2826,
    device TEXT DEFAULT 'mobile',
    checked_at TEXT NOT NULL,
    FOREIGN KEY(site_id) REFERENCES websites(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_rank_history_site_page ON rank_history(site_id, page_key, checked_at);

  CREATE TABLE IF NOT EXISTS article_drafts (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    target_page_url TEXT NOT NULL,
    target_page_title TEXT,
    target_phrase TEXT,
    topic TEXT,
    title TEXT NOT NULL,
    meta_title TEXT,
    meta_description TEXT,
    slug TEXT,
    body_html TEXT NOT NULL,
    category_id INTEGER DEFAULT NULL,
    category_name TEXT DEFAULT NULL,
    primary_link_url TEXT,
    primary_link_anchor TEXT,
    secondary_links_json TEXT,
    status TEXT DEFAULT 'Generated',
    wp_post_id INTEGER DEFAULT NULL,
    wp_edit_url TEXT DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    completed_at TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(site_id) REFERENCES websites(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS first_audit_batch_state (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    started_at TEXT,
    completed_at TEXT,
    total_sites INTEGER DEFAULT 0,
    processed_sites INTEGER DEFAULT 0,
    successful_sites INTEGER DEFAULT 0,
    failed_sites INTEGER DEFAULT 0,
    current_site_id TEXT,
    current_site_name TEXT,
    current_page_index INTEGER DEFAULT 0,
    current_page_total INTEGER DEFAULT 0,
    current_page_url TEXT,
    site_states_json TEXT,
    logs_json TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS social_generated_final_videos (
    id TEXT PRIMARY KEY,
    site_id TEXT,
    source_video_id TEXT,
    subject TEXT,
    aspect_ratio TEXT DEFAULT '9:16',
    headline TEXT NOT NULL,
    cta TEXT NOT NULL,
    render_id TEXT,
    file_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    mime_type TEXT DEFAULT 'video/mp4',
    file_size INTEGER,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS social_publications (
    id TEXT PRIMARY KEY,
    site_id TEXT DEFAULT NULL,
    final_video_id TEXT,
    subject TEXT,
    platform TEXT NOT NULL,
    account_name TEXT,
    account_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    caption TEXT NOT NULL,
    status TEXT DEFAULT 'PUBLISHED',
    error_message TEXT,
    external_post_id TEXT,
    bundle_post_id TEXT,
    bundle_upload_id TEXT,
    published_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS w7_social_settings (
    site_id TEXT PRIMARY KEY,
    subject TEXT,
    prompt TEXT,
    format TEXT DEFAULT 'JPG',
    aspect_ratio TEXT DEFAULT '9:16',
    video_prompt TEXT,
    headline TEXT,
    cta TEXT,
    team_id TEXT,
    account_key TEXT,
    publish_caption TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(site_id) REFERENCES websites(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS website_backlink_docs (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS website_backlink_plan (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    url TEXT,
    status TEXT NOT NULL CHECK(status IN ('Free', 'Paid')),
    comments TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)

// Run database migration for page_rankings phrase_type and legacy full-URL page keys
try {
  const tableInfo = db.prepare("PRAGMA table_info(page_rankings)").all()
  const hasPhraseType = tableInfo.some(col => col.name === 'phrase_type')

  if (!hasPhraseType) {
    console.log('[MIGRATION] Migrating page_rankings schema to include phrase_type and updated PRIMARY KEY...')
    db.exec(`
      CREATE TABLE IF NOT EXISTS page_rankings_new (
        site_id TEXT NOT NULL,
        page_key TEXT NOT NULL,
        phrase_type TEXT DEFAULT 'primary',
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
        PRIMARY KEY(site_id, page_key, phrase_type),
        FOREIGN KEY(site_id) REFERENCES websites(id) ON DELETE CASCADE
      );

      INSERT INTO page_rankings_new (
        site_id, page_key, phrase_type, target_phrase, google_rank, is_top_100,
        ranking_url, is_url_match, search_volume, volume_checked_at, search_engine,
        location_code, device, last_checked_at, updated_at
      )
      SELECT
        site_id,
        CASE WHEN page_key LIKE '%_secondary' THEN SUBSTR(page_key, 1, LENGTH(page_key) - 10) ELSE page_key END,
        CASE WHEN page_key LIKE '%_secondary' THEN 'secondary' ELSE 'primary' END,
        target_phrase, google_rank, is_top_100, ranking_url, is_url_match,
        search_volume, volume_checked_at, search_engine, location_code, device,
        last_checked_at, updated_at
      FROM page_rankings;

      DROP TABLE page_rankings;
      ALTER TABLE page_rankings_new RENAME TO page_rankings;
    `)
    console.log('[MIGRATION] page_rankings schema migration complete.')
  }

  // Update existing rank_history page_key values ending in _secondary
  db.exec(`
    UPDATE rank_history
    SET page_key = SUBSTR(page_key, 1, LENGTH(page_key) - 10)
    WHERE page_key LIKE '%_secondary';
  `)

  // Migrate legacy full-URL rows in page_configurations (e.g. Digital Spain)
  const fullUrlRows = db.prepare("SELECT * FROM page_configurations WHERE page_key LIKE 'http://%' OR page_key LIKE 'https://%'").all()
  for (const row of fullUrlRows) {
    const siteId = row.site_id
    const phrase = (row.target_phrase || '').trim()
    if (phrase) {
      const homeRow = db.prepare("SELECT * FROM page_configurations WHERE site_id = ? AND page_key = 'home'").get(siteId)
      if (homeRow) {
        let parsedHome = {}
        try { parsedHome = JSON.parse(homeRow.config_json || '{}') } catch(e) {}
        if (!parsedHome.secondaryTargetPhrase) {
          parsedHome.secondaryTargetPhrase = phrase
          db.prepare("UPDATE page_configurations SET config_json = ?, updated_at = ? WHERE site_id = ? AND page_key = 'home'")
            .run(JSON.stringify(parsedHome), new Date().toISOString(), siteId)
        }
      }
    }
    db.prepare("DELETE FROM page_configurations WHERE site_id = ? AND page_key = ?").run(siteId, row.page_key)
  }
} catch (migErr) {
  console.error('[MIGRATION EXCEPTION]', migErr.message)
}

// Safe idempotent migration: ensure domain_id, total_pages, and registry_status columns exist on websites table
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
  const hasRegistryStatus = colCheck.some(col => col.name === 'registry_status')
  if (!hasRegistryStatus) {
    db.exec(`
      ALTER TABLE websites ADD COLUMN registry_status TEXT DEFAULT 'active';
    `)
  }
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_websites_domain_id ON websites(domain_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_websites_unique_domain_id ON websites(domain_id) WHERE domain_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_websites_registry_status ON websites(registry_status);
  `)
} catch (e) {
  console.error('Error ensuring schema columns exist on websites table:', e)
}

// Safe idempotent migration: ensure error_message, external_post_id, and site_id columns exist on social_publications table
try {
  const pubCols = db.pragma('table_info(social_publications)')
  if (!pubCols.some(col => col.name === 'error_message')) {
    db.exec(`ALTER TABLE social_publications ADD COLUMN error_message TEXT DEFAULT NULL;`)
  }
  if (!pubCols.some(col => col.name === 'external_post_id')) {
    db.exec(`ALTER TABLE social_publications ADD COLUMN external_post_id TEXT DEFAULT NULL;`)
  }
  if (!pubCols.some(col => col.name === 'site_id')) {
    db.exec(`ALTER TABLE social_publications ADD COLUMN site_id TEXT DEFAULT NULL;`)
  }
  // Associate legacy un-scoped W7 records with 'kitchen-test-site' so Kitchen setup is not broken
  db.exec(`
    UPDATE social_generated_images SET site_id = 'kitchen-test-site' WHERE site_id IS NULL OR site_id = '';
    UPDATE social_generated_videos SET site_id = 'kitchen-test-site' WHERE site_id IS NULL OR site_id = '';
    UPDATE social_generated_final_videos SET site_id = 'kitchen-test-site' WHERE site_id IS NULL OR site_id = '';
    UPDATE social_publications SET site_id = 'kitchen-test-site' WHERE site_id IS NULL OR site_id = '';
  `)
} catch (e) {
  console.error('Error ensuring schema columns exist on social_publications table:', e)
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

// Safe idempotent migration: ensure completed_at column exists on article_drafts
try {
  const draftCols = db.pragma('table_info(article_drafts)')
  if (!draftCols.some(col => col.name === 'completed_at')) {
    db.exec(`ALTER TABLE article_drafts ADD COLUMN completed_at TEXT DEFAULT NULL;`)
  }
} catch (e) {
  console.error('Error ensuring completed_at column exists on article_drafts table:', e)
}

// Safe idempotent migration: normalize any float-formatted page_keys (e.g. '1001.0' -> '1001') in page_rankings and page_configurations
try {
  db.exec(`
    UPDATE page_rankings
    SET page_key = substr(page_key, 1, length(page_key) - 2)
    WHERE page_key LIKE '%.0'
      AND (site_id, substr(page_key, 1, length(page_key) - 2)) NOT IN (SELECT site_id, page_key FROM page_rankings);

    UPDATE page_configurations
    SET page_key = substr(page_key, 1, length(page_key) - 2)
    WHERE page_key LIKE '%.0'
      AND (site_id, substr(page_key, 1, length(page_key) - 2)) NOT IN (SELECT site_id, page_key FROM page_configurations);
  `)
} catch (e) {
  console.error('Error normalizing page_key format in page_rankings / page_configurations:', e)
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

// Safe idempotent migration: ensure subject, format, and aspect_ratio columns exist on social_generated_images
try {
  const imgCols = db.pragma('table_info(social_generated_images)')
  if (!imgCols.some(col => col.name === 'subject')) {
    db.exec(`ALTER TABLE social_generated_images ADD COLUMN subject TEXT DEFAULT NULL;`)
  }
  if (!imgCols.some(col => col.name === 'format')) {
    db.exec(`ALTER TABLE social_generated_images ADD COLUMN format TEXT DEFAULT 'JPG';`)
  }
  if (!imgCols.some(col => col.name === 'aspect_ratio')) {
    db.exec(`ALTER TABLE social_generated_images ADD COLUMN aspect_ratio TEXT DEFAULT '9:16';`)
  }
} catch (e) {
  console.error('Error ensuring subject/format/aspect_ratio columns exist on social_generated_images table:', e)
}

// Safe idempotent migration: ensure subject and aspect_ratio columns exist on social_generated_videos
try {
  const videoCols = db.pragma('table_info(social_generated_videos)')
  if (!videoCols.some(col => col.name === 'subject')) {
    db.exec(`ALTER TABLE social_generated_videos ADD COLUMN subject TEXT DEFAULT NULL;`)
  }
  if (!videoCols.some(col => col.name === 'aspect_ratio')) {
    db.exec(`ALTER TABLE social_generated_videos ADD COLUMN aspect_ratio TEXT DEFAULT '9:16';`)
  }
} catch (e) {
  console.error('Error ensuring subject/aspect_ratio columns exist on social_generated_videos table:', e)
}

export function getW7SocialSettings(siteId) {
  if (!siteId) return null
  return db.prepare(`SELECT * FROM w7_social_settings WHERE site_id = ?`).get(String(siteId)) || null
}

export function saveW7SocialSettings(siteId, data) {
  if (!siteId) return null
  const stmt = db.prepare(`
    INSERT INTO w7_social_settings (site_id, subject, prompt, format, aspect_ratio, video_prompt, headline, cta, team_id, account_key, publish_caption, updated_at)
    VALUES (@site_id, @subject, @prompt, @format, @aspect_ratio, @video_prompt, @headline, @cta, @team_id, @account_key, @publish_caption, @updated_at)
    ON CONFLICT(site_id) DO UPDATE SET
      subject = excluded.subject,
      prompt = excluded.prompt,
      format = excluded.format,
      aspect_ratio = excluded.aspect_ratio,
      video_prompt = excluded.video_prompt,
      headline = excluded.headline,
      cta = excluded.cta,
      team_id = excluded.team_id,
      account_key = excluded.account_key,
      publish_caption = excluded.publish_caption,
      updated_at = excluded.updated_at
  `)
  stmt.run({
    site_id: String(siteId),
    subject: data.subject !== undefined ? data.subject : null,
    prompt: data.prompt !== undefined ? data.prompt : null,
    format: data.format || 'JPG',
    aspect_ratio: data.aspect_ratio || data.aspectRatio || '9:16',
    video_prompt: data.video_prompt !== undefined ? data.video_prompt : (data.videoPrompt !== undefined ? data.videoPrompt : null),
    headline: data.headline !== undefined ? data.headline : null,
    cta: data.cta !== undefined ? data.cta : null,
    team_id: data.team_id !== undefined ? data.team_id : (data.teamId !== undefined ? data.teamId : null),
    account_key: data.account_key !== undefined ? data.account_key : (data.accountKey !== undefined ? data.accountKey : null),
    publish_caption: data.publish_caption !== undefined ? data.publish_caption : (data.publishCaption !== undefined ? data.publishCaption : null),
    updated_at: new Date().toISOString()
  })
  return getW7SocialSettings(siteId)
}

export function saveSocialGeneratedImage(imgData) {
  const stmt = db.prepare(`
    INSERT INTO social_generated_images (id, site_id, subject, format, aspect_ratio, prompt, model, file_path, public_url, mime_type, file_size, created_at)
    VALUES (@id, @site_id, @subject, @format, @aspect_ratio, @prompt, @model, @file_path, @public_url, @mime_type, @file_size, @created_at)
  `)
  stmt.run({
    id: String(imgData.id),
    site_id: imgData.site_id ? String(imgData.site_id) : null,
    subject: imgData.subject ? String(imgData.subject).trim() : null,
    format: imgData.format ? String(imgData.format).toUpperCase() : 'JPG',
    aspect_ratio: imgData.aspect_ratio || imgData.aspectRatio || '9:16',
    prompt: imgData.prompt,
    model: imgData.model,
    file_path: imgData.file_path,
    public_url: imgData.public_url,
    mime_type: imgData.mime_type || 'image/jpeg',
    file_size: imgData.file_size || 0,
    created_at: imgData.created_at || new Date().toISOString()
  })
  return imgData
}

export function getSocialGeneratedImages(siteId = null) {
  if (siteId) {
    return db.prepare(`SELECT * FROM social_generated_images WHERE site_id = ? ORDER BY datetime(created_at) DESC`).all(String(siteId))
  }
  return []
}

export function saveSocialGeneratedVideo(videoData) {
  const stmt = db.prepare(`
    INSERT INTO social_generated_videos (id, site_id, source_image_id, subject, aspect_ratio, prompt, model, file_path, public_url, mime_type, file_size, created_at)
    VALUES (@id, @site_id, @source_image_id, @subject, @aspect_ratio, @prompt, @model, @file_path, @public_url, @mime_type, @file_size, @created_at)
  `)
  stmt.run({
    id: String(videoData.id),
    site_id: videoData.site_id ? String(videoData.site_id) : null,
    source_image_id: videoData.source_image_id ? String(videoData.source_image_id) : null,
    subject: videoData.subject ? String(videoData.subject).trim() : null,
    aspect_ratio: videoData.aspect_ratio || videoData.aspectRatio || '9:16',
    prompt: videoData.prompt,
    model: videoData.model,
    file_path: videoData.file_path,
    public_url: videoData.public_url,
    mime_type: videoData.mime_type || 'video/mp4',
    file_size: videoData.file_size || 0,
    created_at: videoData.created_at || new Date().toISOString()
  })
  return videoData
}

export function getSocialGeneratedVideos(siteId = null) {
  if (siteId) {
    return db.prepare(`SELECT * FROM social_generated_videos WHERE site_id = ? ORDER BY datetime(created_at) DESC`).all(String(siteId))
  }
  return []
}

export function saveSocialGeneratedFinalVideo(finalData) {
  const stmt = db.prepare(`
    INSERT INTO social_generated_final_videos (id, site_id, source_video_id, subject, aspect_ratio, headline, cta, render_id, file_path, public_url, mime_type, file_size, created_at)
    VALUES (@id, @site_id, @source_video_id, @subject, @aspect_ratio, @headline, @cta, @render_id, @file_path, @public_url, @mime_type, @file_size, @created_at)
  `)
  stmt.run({
    id: String(finalData.id),
    site_id: finalData.site_id ? String(finalData.site_id) : null,
    source_video_id: finalData.source_video_id ? String(finalData.source_video_id) : null,
    subject: finalData.subject ? String(finalData.subject).trim() : null,
    aspect_ratio: finalData.aspect_ratio || finalData.aspectRatio || '9:16',
    headline: String(finalData.headline).trim(),
    cta: String(finalData.cta).trim(),
    render_id: finalData.render_id ? String(finalData.render_id) : null,
    file_path: finalData.file_path,
    public_url: finalData.public_url,
    mime_type: finalData.mime_type || 'video/mp4',
    file_size: finalData.file_size || 0,
    created_at: finalData.created_at || new Date().toISOString()
  })
  return finalData
}

export function getSocialGeneratedFinalVideos(siteId = null) {
  if (siteId) {
    return db.prepare(`SELECT * FROM social_generated_final_videos WHERE site_id = ? ORDER BY datetime(created_at) DESC`).all(String(siteId))
  }
  return []
}

export function deleteSocialGeneratedImage(id) {
  const img = db.prepare(`SELECT * FROM social_generated_images WHERE id = ?`).get(String(id))
  if (!img) return false

  // Unset source_image_id reference in social_generated_videos so deleting source image doesn't delete videos created from it
  db.prepare(`UPDATE social_generated_videos SET source_image_id = NULL WHERE source_image_id = ?`).run(String(id))

  // Delete DB record
  db.prepare(`DELETE FROM social_generated_images WHERE id = ?`).run(String(id))

  // Unlink stored file from disk
  try {
    const fullPath = path.isAbsolute(img.file_path) ? img.file_path : path.resolve(__dirname, '..', img.file_path)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  } catch (e) {
    console.error('Error deleting image file from disk:', e)
  }
  return true
}

export function deleteSocialGeneratedVideo(id) {
  const vid = db.prepare(`SELECT * FROM social_generated_videos WHERE id = ?`).get(String(id))
  if (!vid) return false

  // Unset source_video_id reference in social_generated_final_videos so deleting source video doesn't delete final videos
  db.prepare(`UPDATE social_generated_final_videos SET source_video_id = NULL WHERE source_video_id = ?`).run(String(id))

  // Delete DB record
  db.prepare(`DELETE FROM social_generated_videos WHERE id = ?`).run(String(id))

  // Unlink stored file from disk
  try {
    const fullPath = path.isAbsolute(vid.file_path) ? vid.file_path : path.resolve(__dirname, '..', vid.file_path)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  } catch (e) {
    console.error('Error deleting video file from disk:', e)
  }
  return true
}

export function deleteSocialGeneratedFinalVideo(id) {
  const finalVid = db.prepare(`SELECT * FROM social_generated_final_videos WHERE id = ?`).get(String(id))
  if (!finalVid) return false

  // Delete DB record
  db.prepare(`DELETE FROM social_generated_final_videos WHERE id = ?`).run(String(id))

  // Unlink stored file from disk
  try {
    const fullPath = path.isAbsolute(finalVid.file_path) ? finalVid.file_path : path.resolve(__dirname, '..', finalVid.file_path)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  } catch (e) {
    console.error('Error deleting final video file from disk:', e)
  }
  return true
}

export function updateSocialGeneratedImageSubject(id, subject) {
  const cleanSubject = String(subject || '').trim() || 'Untitled Image'
  const result = db.prepare(`UPDATE social_generated_images SET subject = ? WHERE id = ?`).run(cleanSubject, String(id))
  return result.changes > 0
}

export function updateSocialGeneratedVideoSubject(id, subject) {
  const cleanSubject = String(subject || '').trim() || 'Untitled Video'
  const result = db.prepare(`UPDATE social_generated_videos SET subject = ? WHERE id = ?`).run(cleanSubject, String(id))
  return result.changes > 0
}

export function updateSocialGeneratedFinalVideoSubject(id, subject) {
  const cleanSubject = String(subject || '').trim() || 'Untitled Video'
  const result = db.prepare(`UPDATE social_generated_final_videos SET subject = ? WHERE id = ?`).run(cleanSubject, String(id))
  return result.changes > 0
}

export function saveSocialPublication(pubData) {
  const stmt = db.prepare(`
    INSERT INTO social_publications (id, site_id, final_video_id, subject, platform, account_name, account_id, team_id, caption, status, error_message, external_post_id, bundle_post_id, bundle_upload_id, published_at, created_at)
    VALUES (@id, @site_id, @final_video_id, @subject, @platform, @account_name, @account_id, @team_id, @caption, @status, @error_message, @external_post_id, @bundle_post_id, @bundle_upload_id, @published_at, @created_at)
  `)
  stmt.run({
    id: String(pubData.id),
    site_id: pubData.site_id ? String(pubData.site_id) : null,
    final_video_id: pubData.final_video_id ? String(pubData.final_video_id) : null,
    subject: pubData.subject ? String(pubData.subject).trim() : null,
    platform: String(pubData.platform || 'FACEBOOK').toUpperCase(),
    account_name: pubData.account_name ? String(pubData.account_name).trim() : null,
    account_id: String(pubData.account_id),
    team_id: String(pubData.team_id),
    caption: String(pubData.caption || '').trim(),
    status: pubData.status || 'PUBLISHED',
    error_message: pubData.error_message ? String(pubData.error_message).trim() : null,
    external_post_id: pubData.external_post_id ? String(pubData.external_post_id).trim() : null,
    bundle_post_id: pubData.bundle_post_id ? String(pubData.bundle_post_id) : null,
    bundle_upload_id: pubData.bundle_upload_id ? String(pubData.bundle_upload_id) : null,
    published_at: pubData.published_at || new Date().toISOString(),
    created_at: pubData.created_at || new Date().toISOString()
  })
  return pubData
}

export function updateSocialPublicationStatus(idOrBundlePostId, status, errorMessage = null, externalPostId = null) {
  const stmt = db.prepare(`
    UPDATE social_publications
    SET status = ?,
        error_message = ?,
        external_post_id = COALESCE(?, external_post_id)
    WHERE id = ? OR bundle_post_id = ?
  `)
  const cleanError = errorMessage ? String(errorMessage).trim() : null
  const cleanExtId = externalPostId ? String(externalPostId).trim() : null
  const result = stmt.run(String(status), cleanError, cleanExtId, String(idOrBundlePostId), String(idOrBundlePostId))
  return result.changes > 0
}

export function getSocialPublications(siteId = null) {
  if (siteId) {
    return db.prepare(`SELECT * FROM social_publications WHERE site_id = ? ORDER BY datetime(created_at) DESC LIMIT 50`).all(String(siteId))
  }
  return []
}

// ── W8 Backlink Reference Documents Helper Functions ──
export function normalizeSiteIdForDocs(siteId) {
  if (!siteId) return null
  const s = String(siteId).toLowerCase().trim()
  if (
    s === 'e6a8d672-8785-4a52-b131-4122d2eeefed' ||
    s === '3f69330c-6360-46f7-95a0-e0b58eac0eab' ||
    s === 'digital-spain' ||
    s === 'digital-services-spain' ||
    s.includes('digitalspain') ||
    s.includes('digital spain')
  ) {
    return 'e6a8d672-8785-4a52-b131-4122d2eeefed'
  }
  return s
}

export function getSiteBacklinkDocs(siteId) {
  const normId = normalizeSiteIdForDocs(siteId)
  if (!normId) return []

  let stmt
  if (normId === 'e6a8d672-8785-4a52-b131-4122d2eeefed') {
    stmt = db.prepare(`
      SELECT * FROM website_backlink_docs 
      WHERE site_id IN ('e6a8d672-8785-4a52-b131-4122d2eeefed', '3f69330c-6360-46f7-95a0-e0b58eac0eab', 'digital-spain', 'digitalspain')
      ORDER BY datetime(created_at) DESC
    `)
    return stmt.all()
  } else {
    stmt = db.prepare(`
      SELECT * FROM website_backlink_docs 
      WHERE site_id = ?
      ORDER BY datetime(created_at) DESC
    `)
    return stmt.all(normId)
  }
}

export function saveSiteBacklinkDoc(siteId, docData) {
  const normId = normalizeSiteIdForDocs(siteId)
  if (!normId) throw new Error('siteId is required')

  const id = docData.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  const title = docData.title || docData.filename
  const filename = docData.filename
  const filePath = docData.filePath || docData.file_path || `uploads/w8-backlinks/${filename}`
  const fileUrl = docData.fileUrl || docData.file_url || `/uploads/w8-backlinks/${filename}`
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO website_backlink_docs (id, site_id, title, filename, file_path, file_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      filename = excluded.filename,
      file_path = excluded.file_path,
      file_url = excluded.file_url,
      updated_at = excluded.updated_at
  `)

  stmt.run(id, normId, title, filename, filePath, fileUrl, now, now)
  return getSiteBacklinkDocs(normId).find(d => d.id === id)
}

// ── W8 Backlink Plan (Editable Table) Helper Functions ──
export const DEFAULT_DIGITAL_SPAIN_BACKLINK_PLAN = [
  { id: 'ds-plan-1', domain: 'JaveaTravelGuide.com', url: 'https://www.javeatravelguide.com', status: 'Free', comments: 'Hyper-local Jávea directory/article opportunity. Check current listing/article route and submit if an indexable website link is available.' },
  { id: 'ds-plan-2', domain: 'SpainEnglish.com', url: 'https://www.spainenglish.com', status: 'Free', comments: 'English-language Spain business exposure & digital-agency category. Confirm current submission route and Spanish-address requirement, then submit.' },
  { id: 'ds-plan-3', domain: 'SunClubNetwork.com', url: 'https://www.sunclubnetwork.com', status: 'Free', comments: 'Spain business directory with editorial review mentioned. Submit if active and indexable.' },
  { id: 'ds-plan-4', domain: 'BizPages.org', url: 'https://bizpages.org', status: 'Free', comments: 'General Spain company profile. Create profile if website link is allowed.' },
  { id: 'ds-plan-5', domain: 'Infobel', url: 'https://www.infobel.com', status: 'Free', comments: 'General citation and NAP support. Claim/add business and verify link.' },
  { id: 'ds-plan-6', domain: 'Páginas Amarillas', url: 'https://www.paginasamarillas.es', status: 'Free', comments: 'Major Spanish citation source & core business profile. Claim/create profile using exact NAP details matching Google Business Profile.' },
  { id: 'ds-plan-7', domain: 'Kompass Spain', url: 'https://es.kompass.com', status: 'Free', comments: 'Spanish and international B2B profile. Register/claim if free website link remains available.' },
  { id: 'ds-plan-8', domain: 'Europages', url: 'https://www.europages.com', status: 'Free', comments: 'European B2B directory relevant to agency services. Create company profile if current free tier includes link.' },
  { id: 'ds-plan-9', domain: 'eInforma / InfoCIF / Empresite', url: 'https://www.einforma.com', status: 'Free', comments: 'Spanish corporate/company-profile citations. Check whether Digital Spain is eligible and whether URL can be added.' },
  { id: 'ds-plan-10', domain: 'Cylex España / Hotfrog', url: 'https://www.cylex.es', status: 'Free', comments: 'Low-value individually but useful citation consistency. Add only after higher-value local/agency profiles.' },
  { id: 'ds-plan-11', domain: 'TechBehemoths', url: 'https://techbehemoths.com', status: 'Free', comments: 'Agency directory with Alicante web-design category noted. Create agency profile.' },
  { id: 'ds-plan-12', domain: 'DesignRush', url: 'https://www.designrush.com', status: 'Free', comments: 'Agency discovery/profile platform. Take free profile if available; avoid paying solely for link.' },
  { id: 'ds-plan-13', domain: 'Sortlist', url: 'https://www.sortlist.es', status: 'Free', comments: 'Agency marketplace; paid lead tier is separate. Create free profile; assess paid tier only for leads.' },
  { id: 'ds-plan-14', domain: 'Angloinfo Costa Blanca / Valencia', url: 'https://www.angloinfo.com/costa-blanca', status: 'Free', comments: 'Expat audience and regional business listings. Confirm current regional listing route.' },
  { id: 'ds-plan-15', domain: 'AlicanteSocial.com', url: 'https://alicantesocial.com', status: 'Free', comments: 'Expat/tourist audience mentioned in research. Confirm site/activity and submit if useful.' },
  { id: 'ds-plan-16', domain: 'CostaBlancaRated.com', url: 'https://costablancarated.com', status: 'Free', comments: 'Verified local-business profile opportunity. Check current activity and profile link.' },
  { id: 'ds-plan-17', domain: 'TheCostaBlancaGuide.com', url: 'https://thecostablancaguide.com', status: 'Free', comments: "English-speaking local guide. Source lists as 'Free/quote unclear'; confirm whether submission is free and indexable." },
  { id: 'ds-plan-18', domain: 'ValenciaCostaBlanca.com', url: 'https://valenciacostablanca.com', status: 'Free', comments: 'Regional directory. Reportedly closed; monitor only and do not spend time unless registration reopens.' },
  { id: 'ds-plan-19', domain: 'Clutch.co', url: 'https://clutch.co', status: 'Free', comments: 'Strong agency relevance; useful profile plus client-review potential. Create/complete free profile first; do not pay for sponsored placement solely for backlink.' },
  { id: 'ds-plan-20', domain: 'Javea.com / Xàbia.com', url: 'https://www.javea.com', status: 'Free', comments: 'Strong hyper-local relevance and local digitalisation angle. Pitch original local findings, awards or client success stories.' },
  { id: 'ds-plan-21', domain: 'Javea Grapevine', url: 'https://javeagrapevine.com', status: 'Free', comments: 'Community publication with potential byline attribution. Offer a useful article such as website essentials for Jávea SMEs.' },
  { id: 'ds-plan-22', domain: 'La Marina Plaza', url: 'https://lamarinaplaza.com', status: 'Free', comments: 'Marina Alta news relevance. Pitch original local data; do not assume a link is guaranteed.' },
  { id: 'ds-plan-23', domain: 'Xàbia al Dia', url: 'https://xabialdia.com', status: 'Paid', comments: 'Hyper-local Spanish/Jávea readership. Has both editorial & paid PR/publirreportaje options; ask about editorial or publirreportaje options and link policy.' },
  { id: 'ds-plan-24', domain: 'Alicante Plaza', url: 'https://alicanteplaza.es', status: 'Paid', comments: 'Province-wide business/economic audience. Offers paid PR/publirreportaje options; pitch a business/data story rather than a generic agency advert.' },
  { id: 'ds-plan-25', domain: 'Euro Weekly News', url: 'https://euroweeklynews.com', status: 'Paid', comments: 'Costa Blanca North exposure; primarily brand/referral value. Only consider if audience/lead value justifies cost.' },
  { id: 'ds-plan-26', domain: 'The Olive Press', url: 'https://www.theolivepress.es', status: 'Paid', comments: 'English-language Spain news with Jávea coverage. Get current sponsored-content terms before committing.' },
  { id: 'ds-plan-27', domain: 'Costa Blanca News / The Leader', url: 'https://costablancanews.es', status: 'Paid', comments: 'Regional English-language readership. Treat mainly as PR/referral opportunity; verify link attributes.' },
  { id: 'ds-plan-28', domain: 'CostaBlancaPeople.com', url: 'https://costablancapeople.com', status: 'Paid', comments: 'Local publication/business feature route. Ask whether feature includes permanent indexable link.' },
  { id: 'ds-plan-29', domain: 'CostaBlanca Magazin / Daily Costa Blanca', url: 'https://www.costablancamagazin.com', status: 'Paid', comments: 'Expat media exposure. Verify active audience, pricing and permanent-link terms first.' },
  { id: 'ds-plan-30', domain: 'Javea Connect', url: 'https://www.javeaconnect.co.uk', status: 'Paid', comments: 'Jávea Business Hub / local business exposure. Request current package, placement URL, renewal and link details.' },
  { id: 'ds-plan-31', domain: 'Xàbia Histórica / Port / Arenal associations', url: 'https://xabiahistorica.com', status: 'Paid', comments: 'Very local business relevance and prospecting value. Compare membership benefits and online member profile.' },
  { id: 'ds-plan-32', domain: 'CBBA.es', url: 'https://cbba.es', status: 'Paid', comments: 'Costa Blanca business association and networking. Check current annual cost and member-page link.' },
  { id: 'ds-plan-33', domain: 'BNI Marina Alta', url: 'https://bni.es', status: 'Paid', comments: 'Networking plus member profile; commercial value may exceed SEO value. Assess primarily for leads/networking, then backlink.' },
  { id: 'ds-plan-34', domain: 'British Chamber of Commerce in Spain', url: 'https://www.britishchamberspain.com', status: 'Paid', comments: 'Credible business organisation; member/news opportunities. Check eligibility, annual cost and digital profile/news benefits.' },
  { id: 'ds-plan-35', domain: 'Cámara Alicante', url: 'https://www.camaralicante.com', status: 'Paid', comments: 'Official provincial business body. Check associate/member directory options and link availability.' },
  { id: 'ds-plan-36', domain: 'CostaBlancaForum.com', url: 'https://costablancaforum.com', status: 'Paid', comments: 'Expat/local audience. Source documents report both paid and free routes; verify current business-directory package before action.' },
  { id: 'ds-plan-37', domain: 'Female Focus / FocusOn', url: 'https://femalefocusonline.com', status: 'Paid', comments: 'Directory/live-link opportunity cited with historical pricing. Confirm current rate and billing period.' },
  { id: 'ds-plan-38', domain: 'CostaBlanca.digital', url: 'https://costablanca.digital', status: 'Paid', comments: 'Reported directory/editorial/town-page opportunity. Source notes pricing/status as uncertain; only consider after checking indexation, traffic and current terms.' },
  { id: 'ds-plan-39', domain: 'Expat Exchange – Jávea', url: 'https://www.expatexchange.com', status: 'Paid', comments: 'Promoted local-business placements noted. Consider only if referral audience is worthwhile.' },
  { id: 'ds-plan-40', domain: 'GoJavea.com', url: 'https://gojavea.com', status: 'Paid', comments: 'Old pricing/activity noted for historic paid listing. First verify the site is active and indexed.' },
  { id: 'ds-plan-41', domain: 'Awwwards / CSS Design Awards', url: 'https://www.awwwards.com', status: 'Paid', comments: 'Design-industry credibility rather than local citation. Use only for genuinely award-worthy client work; not as routine link buying.' },
  { id: 'ds-plan-42', domain: 'Client websites', url: 'https://digitalspain.es', status: 'Free', comments: 'Natural agency attribution from completed work. Use subtle footer/project credits where agreed with client.' },
  { id: 'ds-plan-43', domain: 'Civion.es / Valuvillas and suitable owned businesses', url: 'https://civion.es', status: 'Free', comments: 'Locally relevant relationship/credit opportunities. Use only where a genuine relationship or website credit makes sense.' },
  { id: 'ds-plan-44', domain: 'Local charity/community site', url: 'https://digitalspain.es', status: 'Free', comments: 'Sponsor/partner credit plus community value. Offer useful web work to a suitable local cause rather than exchanging links mechanically.' },
  { id: 'ds-plan-45', domain: 'Local agencies / complementary suppliers', url: 'https://digitalspain.es', status: 'Free', comments: 'Potential referrals, resource links and joint projects. Approach for genuine collaboration; avoid reciprocal-link schemes.' },
  { id: 'ds-plan-46', domain: 'GitHub', url: 'https://github.com', status: 'Free', comments: 'Developer/company profile and useful open-source assets. Only publish real reusable code/resources; treat profile link as secondary.' },
  { id: 'ds-plan-47', domain: 'Kit Digital / Red.es route', url: 'https://www.red.es', status: 'Free', comments: 'One source proposed official digitalisation-program participation. Verify current programme eligibility and whether it actually provides a public backlink before treating it as an opportunity.' },
  { id: 'ds-plan-48', domain: 'MiaPropertyBoutique.com', url: 'https://miapropertyboutique.com', status: 'Free', comments: 'A property-site business directory was suggested, but relevance to a web agency is indirect. Check active directory, indexation and acceptance criteria first.' },
  { id: 'ds-plan-49', domain: 'Citrus-Iberia.com', url: 'https://citrus-iberia.com', status: 'Free', comments: 'Services directory mentioned in one source. Free basic / paid upgrade claimed; verify activity and whether the website link requires payment.' },
  { id: 'ds-plan-50', domain: 'DeniaOnline24 / JaveaOnline24', url: 'https://javeaonline24.com', status: 'Paid', comments: 'Local guide opportunity but naming/status varies between sources. Source indicates paid route; confirm the exact active domain, audience and package.' },
  { id: 'ds-plan-51', domain: 'SpainMadeSimple.com', url: 'https://spainmadesimple.com', status: 'Paid', comments: 'Web-design/SEO provider listing mentioned. Source indicates paid/unclear route; check current page quality and whether submissions are accepted.' },
  { id: 'ds-plan-52', domain: 'Competitor web agencies', url: 'https://digitalspain.es', status: 'Free', comments: 'Several local agencies were proposed as possible referral/resource partners. Pursue only genuine partnerships; do not seek artificial link exchanges.' },
  { id: 'ds-plan-53', domain: 'ThinkSpain', url: 'https://www.thinkspain.com', status: 'Free', comments: 'Association-directory route was suggested, not necessarily a normal commercial listing. Check eligibility before investing time.' },
  { id: 'ds-plan-54', domain: 'Xabia.org official portal', url: 'https://xabia.org', status: 'Free', comments: 'Official portal may list certain local entities/businesses. Confirm whether a commercial web agency can legitimately be listed.' },
  { id: 'ds-plan-55', domain: 'Local press research story', url: 'https://digitalspain.es', status: 'Free', comments: 'Potentially the strongest earned-link route because it can generate genuine local coverage. Create original Jávea data, e.g. an audit of 50–100 local business websites and pitch the findings.' }
]

export function seedDigitalSpainBacklinkPlan() {
  const dsSiteId = 'e6a8d672-8785-4a52-b131-4122d2eeefed'
  const countStmt = db.prepare(`SELECT count(*) as count FROM website_backlink_plan WHERE site_id IN (?, 'digital-spain')`)
  const { count } = countStmt.get(dsSiteId)
  
  if (count === 0) {
    const insertStmt = db.prepare(`
      INSERT INTO website_backlink_plan (id, site_id, domain, url, status, comments, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const now = new Date().toISOString()
    const insertMany = db.transaction((items) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        insertStmt.run(
          item.id,
          dsSiteId,
          item.domain,
          item.url || '',
          item.status === 'Paid' ? 'Paid' : 'Free',
          item.comments || '',
          i + 1,
          now,
          now
        )
      }
    })
    insertMany(DEFAULT_DIGITAL_SPAIN_BACKLINK_PLAN)
    console.log(`[SEED] Seeded Digital Spain backlink plan with ${DEFAULT_DIGITAL_SPAIN_BACKLINK_PLAN.length} master opportunities.`)
  }
}

export function getSiteBacklinkPlan(siteId) {
  const normId = normalizeSiteIdForDocs(siteId)
  if (!normId) return []

  // Ensure Digital Spain plan is seeded if needed
  if (normId === 'e6a8d672-8785-4a52-b131-4122d2eeefed') {
    seedDigitalSpainBacklinkPlan()
    const stmt = db.prepare(`
      SELECT * FROM website_backlink_plan 
      WHERE site_id IN ('e6a8d672-8785-4a52-b131-4122d2eeefed', '3f69330c-6360-46f7-95a0-e0b58eac0eab', 'digital-spain', 'digitalspain')
      ORDER BY sort_order ASC, datetime(created_at) ASC
    `)
    return stmt.all()
  } else {
    const stmt = db.prepare(`
      SELECT * FROM website_backlink_plan 
      WHERE site_id = ?
      ORDER BY sort_order ASC, datetime(created_at) ASC
    `)
    return stmt.all(normId)
  }
}

export function updateSiteBacklinkPlanItem(siteId, itemId, updates = {}) {
  const normId = normalizeSiteIdForDocs(siteId)
  if (!normId || !itemId) throw new Error('siteId and itemId are required')

  const now = new Date().toISOString()
  const currentItems = getSiteBacklinkPlan(normId)
  const existing = currentItems.find(i => i.id === itemId)
  if (!existing) throw new Error(`Backlink plan item ${itemId} not found`)

  const newStatus = updates.status && ['Free', 'Paid'].includes(updates.status) ? updates.status : existing.status
  const newComments = updates.comments !== undefined ? String(updates.comments) : existing.comments
  const newDomain = updates.domain !== undefined ? String(updates.domain) : existing.domain
  const newUrl = updates.url !== undefined ? String(updates.url) : existing.url

  const stmt = db.prepare(`
    UPDATE website_backlink_plan
    SET domain = ?,
        url = ?,
        status = ?,
        comments = ?,
        updated_at = ?
    WHERE id = ?
  `)
  stmt.run(newDomain, newUrl, newStatus, newComments, now, itemId)

  return getSiteBacklinkPlan(normId).find(i => i.id === itemId)
}

export function saveSiteBacklinkPlanItem(siteId, itemData) {
  const normId = normalizeSiteIdForDocs(siteId)
  if (!normId) throw new Error('siteId is required')

  const id = itemData.id || `plan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  const domain = itemData.domain || 'New Opportunity'
  const url = itemData.url || ''
  const status = itemData.status === 'Paid' ? 'Paid' : 'Free'
  const comments = itemData.comments || ''
  const sortOrder = itemData.sort_order || 999
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO website_backlink_plan (id, site_id, domain, url, status, comments, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      domain = excluded.domain,
      url = excluded.url,
      status = excluded.status,
      comments = excluded.comments,
      updated_at = excluded.updated_at
  `)

  stmt.run(id, normId, domain, url, status, comments, sortOrder, now, now)
  return getSiteBacklinkPlan(normId).find(i => i.id === id)
}

// Initial seed execution check
try {
  seedDigitalSpainBacklinkPlan()
} catch (e) {
  console.error('[SEED ERROR] Failed to seed Digital Spain backlink plan:', e)
}

export default db



