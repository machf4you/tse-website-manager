import fs from 'fs'

const file1 = 'C:/Users/Admin/.gemini/antigravity/brain/20540df5-ba49-408b-b016-8d2c16cac22c/.system_generated/messages/e090cab2-14f9-4cf6-8781-1525e3be4c28.json'
const file2 = 'C:/Users/Admin/.gemini/antigravity/brain/20540df5-ba49-408b-b016-8d2c16cac22c/.system_generated/messages/012e6de9-9578-409c-9061-4bf339c7ccc8.json'

try {
  const c1 = fs.readFileSync(file1, 'utf8')
  console.log('--- FILE 1 ---')
  console.log(c1.slice(0, 1500))
} catch (e) {}

try {
  const c2 = fs.readFileSync(file2, 'utf8')
  console.log('\n--- FILE 2 ---')
  console.log(c2.slice(0, 1500))
} catch (e) {}
