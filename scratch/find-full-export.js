import fs from 'fs'
import path from 'path'

function findFile(dir, filename) {
  let matches = []
  try {
    const files = fs.readdirSync(dir)
    for (const f of files) {
      const full = path.join(dir, f)
      if (f === 'node_modules' || f === '.git') continue
      try {
        const stat = fs.statSync(full)
        if (stat.isDirectory()) {
          matches = matches.concat(findFile(full, filename))
        } else if (f.toLowerCase() === filename.toLowerCase()) {
          matches.push(full)
        }
      } catch (e) {}
    }
  } catch (e) {}
  return matches
}

console.log('Searching for full-export.json in C:/Users/Admin/.gemini/antigravity...')
console.log(findFile('C:/Users/Admin/.gemini/antigravity', 'full-export.json'))
console.log(findFile('c:/Antigravity', 'full-export.json'))
