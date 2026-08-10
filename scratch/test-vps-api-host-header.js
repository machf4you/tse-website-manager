import http from 'http'
import https from 'https'

function testWithHostHeader(hostname, port, path, isHttps = false) {
  return new Promise((resolve) => {
    const mod = isHttps ? https : http
    console.log(`Testing ${isHttps ? 'HTTPS' : 'HTTP'} IP 185.87.254.94:${port}${path} with Host: ${hostname}...`)
    const req = mod.request({
      hostname: '185.87.254.94',
      port,
      path,
      method: 'GET',
      headers: {
        'Host': hostname
      },
      rejectUnauthorized: false,
      timeout: 5000
    }, (res) => {
      console.log(`  -> Response status: ${res.statusCode} ${res.statusMessage}`)
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        console.log(`  -> Body: ${body.slice(0, 200)}`)
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
  await testWithHostHeader('api-website-manager.thesearchequation.co.uk', 80, '/api/health')
  await testWithHostHeader('api-website-manager.thesearchequation.co.uk', 443, '/api/health', true)
  await testWithHostHeader('tse-website-manager.thesearchequation.co.uk', 443, '/api/health', true)
}

run()
