import fs from 'fs'

const backupPath = 'c:/Antigravity/tse-audit-engine/server/backups/db_backup_rp2_audit_engine_2026-07-25T07-04-05-846Z.json'
const content = JSON.parse(fs.readFileSync(backupPath, 'utf8'))

console.log('Tables:', Object.keys(content.tables))
for (const [table, rows] of Object.entries(content.tables)) {
  console.log(`Table ${table}: ${Array.isArray(rows) ? rows.length : typeof rows} items`)
  if (Array.isArray(rows) && rows.length > 0) {
    const sampleStr = JSON.stringify(rows.slice(0, 2))
    if (sampleStr.toLowerCase().includes('ascent')) {
      console.log(`  -> Contains Ascent in ${table}`)
    }
  }
}
