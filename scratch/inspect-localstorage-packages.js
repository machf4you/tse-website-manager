import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'server', 'website_manager.db')

if (fs.existsSync(dbPath)) {
  const db = new Database(dbPath)
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all()
  console.log('DB Tables:', tables.map(t => t.name))
  
  tables.forEach(t => {
    try {
      const rows = db.prepare(`SELECT * FROM ${t.name}`).all()
      console.log(`\nTable [${t.name}] row count: ${rows.length}`)
      if (rows.length > 0) {
        console.log('Sample row:', JSON.stringify(rows[0]).slice(0, 300))
      }
    } catch (e) {
      console.error(`Error reading table ${t.name}:`, e.message)
    }
  })
}
