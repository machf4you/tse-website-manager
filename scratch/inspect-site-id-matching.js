import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../server/website_manager.db')

const db = new Database(dbPath)
const rows = db.prepare(`SELECT * FROM websites`).all()

console.log('All DB Sites:')
rows.forEach(r => {
  console.log(`ID: "${r.id}" | Name: "${r.name}" | URL: "${r.url}" | ConfigData:`, r.config_data)
})
