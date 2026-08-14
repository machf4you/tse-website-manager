import fs from 'fs'

try {
  const code = fs.readFileSync('src/pages/ManageWebsitePage.jsx', 'utf-8')
  
  // Check references to SYNC_STAGES
  const matches = code.match(/SYNC_STAGES/g) || []
  console.log('=== EMPIRICAL PROOF OF BLACK SCREEN RUNTIME ERROR ===')
  console.log('SYNC_STAGES occurrences in ManageWebsitePage.jsx:', matches.length)

  const lines = code.split('\n')
  lines.forEach((line, idx) => {
    if (line.includes('SYNC_STAGES')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`)
    }
  })
} catch (e) {
  console.error(e.message)
}
