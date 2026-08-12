import db from '../server/db.js'

function inspectAllAuditRecords() {
  console.log('=== PAGE AUDITS ROWS ===')
  const audits = db.prepare(`SELECT * FROM page_audits`).all()
  console.log(audits)
}

inspectAllAuditRecords()
