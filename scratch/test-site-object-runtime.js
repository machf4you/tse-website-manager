import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../server/website_manager.db')

const db = new Database(dbPath)

console.log('=== CHECKING SITES IN SQLITE DB ===')
const rows = db.prepare(`SELECT * FROM websites`).all()
console.log('Found sites:', rows.length)

rows.forEach(r => {
  console.log(`\nSite ID: "${r.id}", Name: "${r.name}", URL: "${r.url}"`)
  console.log('config_data raw:', r.config_data)
  try {
    const parsed = JSON.parse(r.config_data || '{}')
    console.log('Parsed config_data:', {
      wpUser: parsed.wpUser,
      hasWpPass: Boolean(parsed.wpPass),
      connectedUser: parsed.connectedUser
    })
  } catch (e) {
    console.error('Failed to parse config_data:', e)
  }
})
