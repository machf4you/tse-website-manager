import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { restorePointIndexData as baselineRestorePoints } from '../src/data/restorePointData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const REGISTRY_FILE = path.join(__dirname, 'restore_points_registry.json')
const VPS_BACKUPS_DIR = '/opt/tse-apps/backups'

const DATA_JS_PATH = path.resolve(__dirname, '../src/data/restorePointData.js')
const INDEX_MD_PATH = path.resolve(__dirname, '../RESTORE-POINT-INDEX.md')

const MONTH_MAP = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
}

export function parseDateToTimestamp(dateStr) {
  if (!dateStr) return 0
  const clean = String(dateStr).replace(/[*`]/g, '').trim()

  // 1. DD-MM-YYYY [HH:MM] or DD/MM/YYYY [HH:MM] (TSE standard UK format)
  let m = clean.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/)
  if (m) {
    const day = parseInt(m[1], 10)
    const month = parseInt(m[2], 10) - 1
    const year = parseInt(m[3], 10)
    const hour = m[4] ? parseInt(m[4], 10) : 0
    const min = m[5] ? parseInt(m[5], 10) : 0
    return new Date(year, month, day, hour, min).getTime()
  }

  // 2. YYYY-MM-DD
  m = clean.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (m) {
    const year = parseInt(m[1], 10)
    const month = parseInt(m[2], 10) - 1
    const day = parseInt(m[3], 10)
    return new Date(year, month, day).getTime()
  }

  // 3. DD Month YYYY (e.g. "22 Sep 2026", "22 September 2026", "Tue, 22 Sep 2026")
  m = clean.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/)
  if (m) {
    const day = parseInt(m[1], 10)
    const monthKey = m[2].toLowerCase().slice(0, 3)
    const month = (MONTH_MAP[monthKey] ? MONTH_MAP[monthKey] - 1 : 8)
    const year = parseInt(m[3], 10)
    const hour = m[4] ? parseInt(m[4], 10) : 0
    const min = m[5] ? parseInt(m[5], 10) : 0
    return new Date(year, month, day, hour, min).getTime()
  }

  // 4. Native Date.parse() fallback (for ISO 8601, RFC 2822)
  const nativeTs = Date.parse(clean)
  if (!isNaN(nativeTs) && nativeTs > 0) {
    return nativeTs
  }

  return 0
}

/**
 * Scan filesystem for authoritative backup manifests on VPS
 */
function scanVpsBackupManifests() {
  const discovered = []
  if (!fs.existsSync(VPS_BACKUPS_DIR)) return discovered

  try {
    const apps = fs.readdirSync(VPS_BACKUPS_DIR)
    for (const appDir of apps) {
      const fullAppPath = path.join(VPS_BACKUPS_DIR, appDir)
      if (!fs.statSync(fullAppPath).isDirectory()) continue

      const backupFolders = fs.readdirSync(fullAppPath)
      for (const bFolder of backupFolders) {
        if (!bFolder.startsWith('20')) continue // e.g. 2026-09-18-full or 2026-09-22-v2.21-full
        const bPath = path.join(fullAppPath, bFolder)
        if (!fs.statSync(bPath).isDirectory()) continue

        let manifestFile = path.join(bPath, 'RESTORE-MANIFEST.md')
        if (!fs.existsSync(manifestFile)) {
          manifestFile = path.join(bPath, 'RESTORE.md')
        }

        if (fs.existsSync(manifestFile)) {
          try {
            const text = fs.readFileSync(manifestFile, 'utf-8')
            const dateMatch = text.match(/Backup Date:\s*([^\r\n]+)/i) || text.match(/Date:\s*([^\r\n]+)/i)
            const verMatch = text.match(/Version:\s*([^\r\n]+)/i)
            const commitMatch = text.match(/Production Commit:\s*`?([a-f0-9]+)`?/i) || text.match(/Git Commit:\s*`?([a-f0-9]+)`?/i)
            const tagMatch = text.match(/Git Tag:\s*`?([a-zA-Z0-9._-]+)`?/i) || text.match(/DR Tag:\s*`?([a-zA-Z0-9._-]+)`?/i)
            const titleMatch = text.match(/^#\s*([^\r\n]+)/m)

            // Format app name nicely
            let appName = appDir.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            if (appDir === 'website-manager') appName = 'Website Manager'
            else if (appDir === 'lead-gen') appName = 'Lead Generator'
            else if (appDir === 'site-registry') appName = 'Site Registry'
            else if (appDir === 'keyword-research') appName = 'Keyword Research'
            else if (appDir === 'website-builder') appName = 'Website Builder'
            else if (appDir === 'tse-auth-service') appName = 'Auth / Apps Hub'

            const tag = tagMatch ? tagMatch[1].trim() : ''
            const commit = commitMatch ? commitMatch[1].trim() : ''
            const version = verMatch ? verMatch[1].trim() : ''
            const rawDate = dateMatch ? dateMatch[1].trim() : ''
            const title = titleMatch ? titleMatch[1].trim() : `${appName} Full Disaster Recovery`

            if (tag || version) {
              let formattedDate = rawDate
              const ts = parseDateToTimestamp(rawDate)
              if (ts > 0) {
                const d = new Date(ts)
                const day = String(d.getDate()).padStart(2, '0')
                const month = String(d.getMonth() + 1).padStart(2, '0')
                const year = d.getFullYear()
                const hour = String(d.getHours()).padStart(2, '0')
                const min = String(d.getMinutes()).padStart(2, '0')
                formattedDate = `${day}-${month}-${year} ${hour}:${min}`
              }

              discovered.push({
                id: tag || `${appDir}-${version}`,
                app: appName,
                version: version || 'V1.0',
                gitTag: tag,
                commit: commit || '[AUTO]',
                date: formattedDate || '18-09-2026',
                title: title,
                description: `Authoritative disaster-recovery restore point verified from ${bFolder} backup manifest.`,
                location: `${appDir}/${bFolder}/`,
                status: 'Current',
                docFile: manifestFile
              })
            }
          } catch (e) {
            console.warn('[RESTORE_SCAN_ERROR]', manifestFile, e.message)
          }
        }
      }
    }
  } catch (err) {
    console.warn('[RESTORE_SCAN_FAILED]', err.message)
  }

  return discovered
}

/**
 * Synchronize all static files and markdown index
 */
function syncStaticRestorePoints(items) {
  // 1. Update restorePointData.js if exists
  if (fs.existsSync(path.dirname(DATA_JS_PATH))) {
    try {
      const jsContent = `/**
 * Master restore point data representing RESTORE-POINT-INDEX.md.
 * Authoritative single source of truth for the Restore Points manager.
 * AUTOMATICALLY GENERATED BY restorePointManager.js
 */
export const restorePointIndexData = ${JSON.stringify(items, null, 2)}
`
      fs.writeFileSync(DATA_JS_PATH, jsContent, 'utf-8')
    } catch (e) {
      console.warn('[SYNC_DATA_JS_ERROR]', e.message)
    }
  }

  // 2. Update RESTORE-POINT-INDEX.md if exists
  if (fs.existsSync(INDEX_MD_PATH)) {
    try {
      const lines = [
        '# Restore Point Index',
        '',
        'Master index of active restore points for the TSE ecosystem, grouped by application.',
        '',
        '---',
        '',
        '| Section | Version | Git Tag | Commit | Date | Summary | Status |',
        '|---|---|---|---|---|---|---|'
      ]
      for (const item of items) {
        const app = item.app || ''
        const ver = item.version || ''
        const tag = item.gitTag ? `\`${item.gitTag}\`` : '-'
        const commit = item.commit ? `\`${item.commit}\`` : '`[AUTO]`'
        const date = item.date || ''
        const desc = (item.title || item.description || '').replace(/\n/g, ' ')
        const status = item.status === 'Current' ? '**Current**' : 'Superseded'
        lines.append ? lines.push(`| ${app} | ${ver} | ${tag} | ${commit} | ${date} | ${desc} | ${status} |`) : lines.push(`| ${app} | ${ver} | ${tag} | ${commit} | ${date} | ${desc} | ${status} |`)
      }
      lines.push('')
      lines.push('---')
      lines.push('')
      fs.writeFileSync(INDEX_MD_PATH, lines.join('\n'), 'utf-8')
    } catch (e) {
      console.warn('[SYNC_INDEX_MD_ERROR]', e.message)
    }
  }
}

/**
 * Load all restore points merging file registry, scanned VPS manifests, and baseline
 */
export function getAllRestorePoints() {
  let fileRegistry = []
  if (fs.existsSync(REGISTRY_FILE)) {
    try {
      fileRegistry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'))
    } catch (e) {
      console.warn('[REGISTRY_READ_ERROR]', e.message)
    }
  }

  const vpsManifests = scanVpsBackupManifests()
  const combined = [...fileRegistry, ...vpsManifests, ...baselineRestorePoints]

  // Deduplicate
  const seen = new Set()
  const unique = []

  for (const item of combined) {
    const cleanItem = {
      ...item,
      version: String(item.version || '').replace(/[*`]/g, '').trim(),
      date: String(item.date || '').replace(/[*`]/g, '').trim(),
      title: String(item.title || '').replace(/[*`]/g, '').trim()
    }

    const key = (cleanItem.gitTag && cleanItem.gitTag.length > 3)
      ? `${cleanItem.app}::${cleanItem.gitTag}`
      : `${cleanItem.app}::${cleanItem.version}::${cleanItem.commit || cleanItem.id}`

    if (!seen.has(key)) {
      seen.add(key)
      unique.push(cleanItem)
    }
  }

  // Group by application and sort chronologically descending
  const appGroups = {}
  for (const item of unique) {
    if (!appGroups[item.app]) appGroups[item.app] = []
    appGroups[item.app].push(item)
  }

  const result = []
  for (const app of Object.keys(appGroups)) {
    const group = appGroups[app]
    group.sort((a, b) => parseDateToTimestamp(b.date) - parseDateToTimestamp(a.date))
    group.forEach((item, idx) => {
      item.status = idx === 0 ? 'Current' : 'Superseded'
      result.push(item)
    })
  }

  return result
}

/**
 * Register a new DR restore point safely
 */
export function registerNewRestorePoint(entry) {
  const { app, version, gitTag, commit, title, description, date, location, verifyPath } = entry

  if (!app || !version || !title) {
    throw new Error('Missing required fields: app, version, title')
  }

  // Verification if path provided
  if (verifyPath && !fs.existsSync(verifyPath)) {
    throw new Error(`Integrity check failed: specified backup path does not exist: ${verifyPath}`)
  }

  const parsedTs = parseDateToTimestamp(date)
  let formattedDate = date
  if (parsedTs > 0) {
    const d = new Date(parsedTs)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hour = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    formattedDate = `${day}-${month}-${year} ${hour}:${min}`
  }

  const newEntry = {
    id: gitTag || `${app.toLowerCase().replace(/\s+/g, '-')}-${version.toLowerCase().replace(/\s+/g, '-')}`,
    app,
    version,
    gitTag: gitTag || '',
    commit: commit || '',
    date: formattedDate || new Date().toISOString(),
    title,
    description: description || '',
    location: location || '',
    status: 'Current',
    docFile: gitTag ? `RESTORE-POINT-${gitTag}.md` : `RESTORE-POINT-${version}.md`
  }

  let current = []
  if (fs.existsSync(REGISTRY_FILE)) {
    try {
      current = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'))
    } catch (e) {}
  }

  // Deduplicate
  const filtered = current.filter(item => {
    if (gitTag && item.gitTag === gitTag) return false
    if (item.app === app && item.version === version && item.commit === commit) return false
    return true
  })

  filtered.unshift(newEntry)
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(filtered, null, 2), 'utf-8')

  // Automatically sync all restore points across static and dynamic stores
  try {
    const all = getAllRestorePoints()
    syncStaticRestorePoints(all)
  } catch (e) {
    console.warn('[SYNC_STATIC_AFTER_REGISTER_ERROR]', e.message)
  }

  return newEntry
}
