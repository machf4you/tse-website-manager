import http from 'http'
import https from 'https'

function testHttp(hostname, port, path, isHttps = false) {
  return new Promise((resolve) => {
    const mod = isHttps ? https : http
    console.log(`Testing ${isHttps ? 'HTTPS' : 'HTTP'} http://${hostname}:${port}${path}...`)
    const req = mod.request({
      hostname,
      port,
      path,
      method: 'GET',
      timeout: 4000
    }, (res) => {
      console.log(`  -> Response status: ${res.statusCode} ${res.statusMessage}`)
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        console.log(`  -> Body: ${body.slice(0, 150)}`)
        resolve(res.statusCode)
      })
    })
    req.on('error', (err) => {
      console.log(`  -> Connection error: ${err.message} (${err.code})`)
      resolve(null)
    })
    req.on('timeout', () => {
      req.destroy()
      console.log('  -> Connection timed out')
      resolve(null)
    })
    req.end()
  })
}

async function run() {
  await testHttp('185.87.254.94', 80, '/')
  await testHttp('api-website-manager.thesearchequation.co.uk', 80, '/api/health')
  await testHttp('api-website-manager.thesearchequation.co.uk', 443, '/api/health', true)
}

run()
