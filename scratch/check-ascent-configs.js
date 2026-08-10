import fs from 'fs'

const backupPath = 'c:/Antigravity/tse-audit-engine/server/backups/db_backup_rp2_audit_engine_2026-07-25T07-04-05-846Z.json'
const content = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
const pageConfigs = content.tables.page_configurations || []

console.log('Total page_configurations in backup:', pageConfigs.length)
const ascentConfigs = pageConfigs.filter(row => JSON.stringify(row).toLowerCase().includes('ascent'))

console.log('Ascent configs in backup:', ascentConfigs.length)
ascentConfigs.forEach(c => {
  console.log(c)
})
