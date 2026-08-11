async function queryAscentWpPages() {
  console.log('Querying live pages from https://www.ascentbuilders.co.uk/wp-json/wp/v2/pages ...')
  try {
    const res = await fetch('https://www.ascentbuilders.co.uk/wp-json/wp/v2/pages?per_page=20')
    if (res.ok) {
      const pages = await res.json()
      console.log(`Found ${pages.length} live pages on Ascent Builders:`)
      pages.forEach(p => {
        console.log(`  - Page ID: ${p.id} | Slug: "${p.slug}" | Title: "${p.title?.rendered || p.post_title}" | Link: ${p.link}`)
        if (p.yoast_head_json) {
          console.log(`    Yoast Title: "${p.yoast_head_json.title}"`)
        }
      })
    } else {
      console.error('Pages endpoint status:', res.status)
    }

    console.log('\nQuerying live posts from https://www.ascentbuilders.co.uk/wp-json/wp/v2/posts ...')
    const postsRes = await fetch('https://www.ascentbuilders.co.uk/wp-json/wp/v2/posts?per_page=20')
    if (postsRes.ok) {
      const posts = await postsRes.json()
      console.log(`Found ${posts.length} live posts on Ascent Builders:`)
      posts.forEach(p => {
        console.log(`  - Post ID: ${p.id} | Slug: "${p.slug}" | Title: "${p.title?.rendered || p.post_title}" | Link: ${p.link}`)
      })
    } else {
      console.error('Posts endpoint status:', postsRes.status)
    }
  } catch (e) {
    console.error('Exception querying WP REST:', e.message)
  }
}

queryAscentWpPages()
