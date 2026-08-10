import fs from 'fs'

function inspectBundle() {
  const bundleContent = fs.readFileSync('dist/assets/index-DLFz3G48.js', 'utf8')
  const lines = bundleContent.split('\n')

  console.log('Total Lines in Bundle:', lines.length)
  const line142 = lines[141] || lines[142] || lines[lines.length - 1]
  console.log('Line 142 length:', line142 ? line142.length : 0)

  if (line142) {
    const targetOffset = 28501
    const start = Math.max(0, targetOffset - 300)
    const end = Math.min(line142.length, targetOffset + 300)
    console.log('\n--- SNIPPET AROUND OFFSET 28501 ---')
    console.log(line142.slice(start, end))
  }
}

inspectBundle()
