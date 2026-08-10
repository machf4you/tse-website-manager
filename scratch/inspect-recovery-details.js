import fs from 'fs'

const backupPath = 'c:/Antigravity/tse-audit-engine/server/backups/db_backup_rp2_audit_engine_2026-07-25T07-04-05-846Z.json'
try {
  const content = fs.readFileSync(backupPath, 'utf8')
  console.log('Backup file size:', content.length)
  console.log('Includes ascentbuilders:', content.includes('ascentbuilders'))
} catch (e) {
  console.log('Backup read error:', e.message)
}

// Check mockData.js in tse-website-manager
const mockPath = 'c:/Antigravity/tse-website-manager/src/data/mockData.js'
try {
  const mockContent = fs.readFileSync(mockPath, 'utf8')
  console.log('mockData size:', mockContent.length)
  console.log('Includes ascentbuilders:', mockContent.includes('ascentbuilders'))
} catch (e) {
  console.log('mockData read error:', e.message)
}
