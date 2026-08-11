import { extractPostsFromPackage, classifyPageType } from '../src/utils/packageExtractor.js'

async function tracePostItem() {
  const res = await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites/1/package')
  const json = await res.json()
  const rawPosts = extractPostsFromPackage(json)

  console.log(`Extracted rawPosts count: ${rawPosts.length}`)
  const sample = rawPosts[0]
  console.log('Sample raw post keys:', Object.keys(sample))
  console.log('Sample raw post:', {
    id: sample.id,
    type: sample.type,
    post_type: sample.post_type,
    title: sample.title
  })

  const classification = classifyPageType(sample, sample.title?.rendered || sample.title || '', sample.link || sample.url || '', false, false)
  console.log('Direct classifyPageType result:', classification)
}

tracePostItem()
