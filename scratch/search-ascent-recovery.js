import fs from 'fs'
import path from 'path'

function searchDir(dir, pattern) {
  let matches = []
  try {
    const files = fs.readdirSync(dir)
    for (const f of files) {
      const full = path.join(dir, f)
      if (f === 'node_modules' || f === '.git' || f === 'dist') continue
      try {
        const stat = fs.statSync(full)
        if (stat.isDirectory()) {
          matches = matches.concat(searchDir(full, pattern))
        } else if (f.endsWith('.json') || f.endsWith('.js') || f.endsWith('.txt') || f.endsWith('.md')) {
          const content = fs.readFileSync(full, 'utf8')
          if (content.toLowerCase().includes(pattern)) {
            matches.push(full)
          }
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // ignore
  }
  return matches
}

console.log('Searching c:/Antigravity for ascentbuilders...')
const found = searchDir('c:/Antigravity', 'ascentbuilders')
console.log('Found in:', found)

console.log('Searching artifact dir for ascentbuilders...')
const foundArtifacts = searchDir('C:/Users/Admin/.gemini/antigravity/brain/20540df5-ba49-408b-b016-8d2c16cac22c', 'ascentbuilders')
console.log('Found in artifacts:', foundArtifacts)
