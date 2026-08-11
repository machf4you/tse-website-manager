async function checkAuditorHealth() {
  console.log('=== CHECKING TSE PAGE AUDITOR BACKEND HEALTH ON PORT 8000 ===\n')
  try {
    const res = await fetch('http://localhost:8000/api/')
    console.log(`Status: ${res.status} ${res.statusText}`)
    const json = await res.json()
    console.log('Response JSON:', json)
  } catch (err) {
    console.log(`Connection Failed: ${err.message}`)
  }
}

checkAuditorHealth()
