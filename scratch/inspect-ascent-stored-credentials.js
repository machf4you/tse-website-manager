import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { connectWordPress } from '../src/services/wordpressApi.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'server', 'website_manager.db')

async function inspectAscentCredentials() {
  console.log('=== 1. CHECKING SQLITE DATABASE STORED SITES ===\n')

  if (!fs.existsSync(dbPath)) {
    console.error('DB does not exist at:', dbPath)
    return
  }

  const db = new Database(dbPath)
  const sites = db.prepare(`SELECT * FROM websites`).all()

  console.log(`Total sites in SQLite DB: ${sites.length}`)

  for (const s of sites) {
    console.log(`\nSite ID: "${s.id}" | Name: "${s.name}" | URL: "${s.url}"`)
    console.log(`  Raw config_data:`, s.config_data)

    let parsedConfig = null
    if (s.config_data) {
      try {
        parsedConfig = JSON.parse(s.config_data)
        console.log('  Parsed config_data keys:', Object.keys(parsedConfig))
        console.log('  wpUser:', parsedConfig.wpUser || parsedConfig.connectedUser || 'NOT_STORED')
        console.log('  wpPass:', parsedConfig.wpPass ? `[STORED - Length ${parsedConfig.wpPass.length}]` : 'NOT_STORED')
      } catch (e) {
        console.error('  Failed to parse config_data:', e.message)
      }
    }
  }

  // Also query production backend API endpoints for stored site credentials
  console.log('\n=== 2. CHECKING PRODUCTION API BACKEND STORED SITES ===\n')
  try {
    const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites')
    if (res.ok) {
      const apiSites = await res.json()
      console.log(`Found ${apiSites.length} sites in Production API:`)

      for (const site of apiSites) {
        console.log(`\nProduction Site ID: "${site.id}" | Name: "${site.name}" | URL: "${site.url}"`)
        console.log('  wpUser:', site.wpUser || site.connectedUser || site.user?.name || 'NOT_STORED')
        console.log('  wpPass:', site.wpPass ? `[STORED - Length ${site.wpPass.length}]` : 'NOT_STORED')

        const hasPass = Boolean(site.wpPass && site.wpPass.trim().length > 0)
        const user = site.wpUser || site.connectedUser || site.user?.name || ''
        const url = site.url || ''

        console.log('  Credential Check:')
        console.log(`    - URL Correct: ${url.includes('ascentbuilders') ? 'YES ✓' : 'NO ✗'} (${url})`)
        console.log(`    - wpUser Exists: ${user ? `YES ✓ (${user})` : 'NO ✗'}`)
        console.log(`    - wpPass/AppPass Exists: ${hasPass ? 'YES ✓' : 'NO ✗'}`)

        if (hasPass && user && url) {
          console.log('\n  Running connectWordPress() verification with stored credentials...')
          try {
            const verifyRes = await connectWordPress({
              url,
              username: user,
              password: site.wpPass
            }, (step, status) => console.log(`    [Verify Step] ${step}: ${status}`))

            console.log('  Verification Result:', verifyRes)
          } catch (vErr) {
            console.error('  Verification exception:', vErr.message)
          }
        } else {
          console.log('  [NOTICE] Cannot run connectWordPress() verification: Application Password is missing/NOT stored.')
        }
      }
    }
  } catch (e) {
    console.error('Production API fetch error:', e.message)
  }
}

inspectAscentCredentials()
