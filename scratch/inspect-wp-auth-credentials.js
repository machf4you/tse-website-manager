import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'server', 'website_manager.db')

console.log('=== INSPECTING STORED WORDPRESS AUTH CREDENTIALS ===\n')

if (fs.existsSync(dbPath)) {
  const db = new Database(dbPath)
  const sites = db.prepare(`SELECT * FROM websites`).all()
  console.log(`Found ${sites.length} sites in SQLite DB:`)
  sites.forEach(s => {
    console.log(`\nSite ID: ${s.id}`)
    console.log(`  Name: ${s.name}`)
    console.log(`  URL: ${s.url}`)
    console.log(`  Platform: ${s.platform}`)
    console.log(`  Config Data: ${s.config_data}`)
  })
}

// Check backend API live sites endpoint
async function checkApiCredentials() {
  try {
    const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites')
    if (res.ok) {
      const sites = await res.json()
      console.log(`\nFound ${sites.length} sites in Production SQLite API:`)
      sites.forEach(s => {
        console.log(`\nProduction Site ID: ${s.id}`)
        console.log(`  Name: ${s.name}`)
        console.log(`  URL: ${s.url}`)
        console.log(`  wpUser / user: ${s.wpUser || s.connectedUser || s.username || 'Not set'}`)
        console.log(`  wpPass / appPassword: ${s.wpPass || s.applicationPassword ? '[STORED]' : 'Not set'}`)
        console.log(`  Keys in site object:`, Object.keys(s))
      })
    }
  } catch (e) {
    console.error('Production API check error:', e.message)
  }
}

checkApiCredentials()
