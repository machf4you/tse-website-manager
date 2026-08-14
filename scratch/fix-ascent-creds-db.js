import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../server/website_manager.db')

const db = new Database(dbPath)

const creds = JSON.stringify({ wpUser: 'manager', wpPass: 'Pcqf n3tZ fq72 hL6p mOQe' })

db.prepare(`
  UPDATE websites
  SET config_data = ?
  WHERE (id = 'ascent-builders-test-sqlite' OR url LIKE '%ascentbuilders%') AND (config_data IS NULL OR config_data = '')
`).run(creds)

console.log('Updated DB rows with credentials for Ascent Builders sites!')

const rows = db.prepare(`SELECT id, name, url, config_data FROM websites`).all()
console.log(rows)
