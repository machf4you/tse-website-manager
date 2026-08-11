import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'server', 'website_manager.db')

if (fs.existsSync(dbPath)) {
  const db = new Database(dbPath)
  const rows = db.prepare(`SELECT * FROM websites`).all()
  console.log('=== WEBSITES IN DB ===')
  rows.forEach(r => console.log(JSON.stringify(r, null, 2)))
}
