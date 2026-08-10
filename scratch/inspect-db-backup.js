import fs from 'fs'

const backupPath = 'c:/Antigravity/tse-audit-engine/server/backups/db_backup_rp2_audit_engine_2026-07-25T07-04-05-846Z.json'
const content = JSON.parse(fs.readFileSync(backupPath, 'utf8'))

console.log('Keys in backup:', Object.keys(content))
if (content.sites) {
  console.log('Sites:', content.sites.map(s => s.name || s.domain || s.id))
}
if (content.audits) {
  console.log('Audits count:', content.audits.length)
}
if (content.pages) {
  console.log('Pages count:', content.pages.length)
}
