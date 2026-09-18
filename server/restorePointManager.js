import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { restorePointIndexData as baselineRestorePoints } from '../src/data/restorePointData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const REGISTRY_FILE = path.join(__dirname, 'restore_points_registry.json')
const VPS_BACKUPS_DIR = '/opt/tse-apps/backups'

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
        if (!bFolder.startsWith('20')) continue // e.g. 2026-09-18-full
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
              // Ensure date is standardized (e.g. 18-09-2026)
              let formattedDate = rawDate
              if (rawDate.toLowerCase().includes('sep')) {
                formattedDate = rawDate.replace(/(\d+)\s+sep(?:tember)?\s+(\d+)/i, '$1-09-$2')
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
  const combined = [...vpsManifests, ...fileRegistry, ...baselineRestorePoints]

  // Deduplicate
  const seen = new Set()
  const unique = []

  for (const item of combined) {
    const key = (item.gitTag && item.gitTag.length > 3)
      ? `${item.app}::${item.gitTag}`
      : `${item.app}::${item.version}::${item.commit || item.id}`

    if (!seen.has(key)) {
      seen.add(key)
      unique.push(item)
    }
  }

  // Group by application and assign Current to the newest item, Superseded to others
  const appGroups = {}
  for (const item of unique) {
    if (!appGroups[item.app]) appGroups[item.app] = []
    appGroups[item.app].push(item)
  }

  const result = []
  for (const app of Object.keys(appGroups)) {
    const group = appGroups[app]
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

  const newEntry = {
    id: gitTag || `${app.toLowerCase().replace(/\s+/g, '-')}-${version.toLowerCase().replace(/\s+/g, '-')}`,
    app,
    version,
    gitTag: gitTag || '',
    commit: commit || '',
    date: date || new Date().toISOString(),
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

  return newEntry
}
