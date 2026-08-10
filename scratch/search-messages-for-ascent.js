import fs from 'fs'

const messages = fs.readdirSync('C:/Users/Admin/.gemini/antigravity/brain/20540df5-ba49-408b-b016-8d2c16cac22c/.system_generated/messages')

let count = 0
messages.forEach(mFile => {
  const content = fs.readFileSync(`C:/Users/Admin/.gemini/antigravity/brain/20540df5-ba49-408b-b016-8d2c16cac22c/.system_generated/messages/${mFile}`, 'utf8')
  if (content.toLowerCase().includes('ascentbuilders.co.uk') || content.toLowerCase().includes('ascent builders')) {
    count++
    console.log(`File ${mFile} mentions Ascent Builders (len: ${content.length})`)
  }
})

console.log(`Total message files mentioning Ascent: ${count}`)
