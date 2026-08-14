async function checkDeployWebhook() {
  console.log('Testing TSE Deployer Webhook...')
  try {
    const res = await fetch('https://deploy.thesearchequation.co.uk/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'refs/heads/main', repository: { name: 'tse-website-manager' } })
    })
    console.log(`Webhook Response Status: ${res.status} ${res.statusText}`)
    const text = await res.text()
    console.log('Webhook Body:', text.slice(0, 300))
  } catch (err) {
    console.error('Webhook request error:', err.message)
  }
}

checkDeployWebhook()
