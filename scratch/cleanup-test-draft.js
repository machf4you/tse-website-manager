async function cleanup() {
  await fetch('https://api-website-manager.thesearchequation.co.uk/api/websites/test-magento-draft-1', { method: 'DELETE' })
  console.log('Cleaned up test-magento-draft-1')
}
cleanup()
