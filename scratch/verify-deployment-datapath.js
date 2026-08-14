import fetch from 'node-fetch'
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../server/website_manager.db')

console.log('=== 1. VERIFYING SQLITE DB SITES ===')
const db = new Database(dbPath)
const dbSites = db.prepare(`SELECT id, name, url, config_data FROM websites`).all()

dbSites.forEach(s => {
  console.log(`Site ID: "${s.id}" | Name: "${s.name}" | URL: "${s.url}"`)
  try {
    const parsed = JSON.parse(s.config_data || '{}')
    console.log(`  -> wpUser: ${parsed.wpUser ? 'PRESENT (' + parsed.wpUser + ')' : 'MISSING'}`)
    console.log(`  -> wpPass: ${parsed.wpPass ? 'PRESENT' : 'MISSING'}`)
  } catch (e) {
    console.log('  -> config_data: NULL/INVALID')
  }
})

console.log('\n=== 2. VERIFYING BACKEND API /api/websites ===')
try {
  const res = await fetch('http://localhost:3001/api/websites')
  if (res.ok) {
    const list = await res.json()
    console.log(`API returned ${list.length} websites:`)
    list.forEach(s => {
      console.log(`  ID: "${s.id}" | Name: "${s.name}" | wpUser: ${s.wpUser || s.configData?.wpUser || 'MISSING'} | wpPass: ${s.wpPass || s.configData?.wpPass ? 'PRESENT' : 'MISSING'}`)
    })
  } else {
    console.error(`API response failed: HTTP ${res.status}`)
  }
} catch (err) {
  console.error('API connection failed:', err.message)
}

console.log('\n=== 3. VERIFYING DIST BUNDLE CODE ===')
const distDir = path.join(__dirname, '../dist/assets')
if (fs.existsSync(distDir)) {
  const jsFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.js'))
  jsFiles.forEach(f => {
    const content = fs.readFileSync(path.join(distDir, f), 'utf8')
    const hasResolver = content.includes('resolveSiteCredentials') || content.includes('WP_CREDENTIAL_RESOLVER')
    console.log(`Bundle ${f}: contains resolveSiteCredentials / resolver logic = ${hasResolver}`)
  })
}
