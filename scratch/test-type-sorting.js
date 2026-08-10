function testTypeSorting() {
  console.log('=== TESTING W3 PAGE TYPE COLUMN SORTING ===\n')

  const pages = [
    { title: 'Page A (Auto)', type: 'Landing', isManualOverride: false, isConfigured: false },
    { title: 'Page B (Manual)', type: 'Article', isManualOverride: true, isConfigured: true },
    { title: 'Page C (Auto)', type: 'Article', isManualOverride: false, isConfigured: false },
    { title: 'Page D (Manual)', type: 'Landing', isManualOverride: true, isConfigured: true },
    { title: 'Page E (Auto)', type: 'Hub', isManualOverride: false, isConfigured: false },
    { title: 'Page F (Manual)', type: 'Hub', isManualOverride: true, isConfigured: true }
  ]

  // Type A-Z sorting
  const sortDirection = 'asc'
  const sorted = [...pages].sort((a, b) => {
    const valA = (a.type || '').toLowerCase()
    const valB = (b.type || '').toLowerCase()
    if (valA !== valB) {
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
    }
    return (a.title || '').localeCompare(b.title || '')
  })

  console.log('Sorted Type A-Z Result:')
  sorted.forEach(p => {
    console.log(`- ${p.title} | Type: ${p.type} | Manual: ${p.isManualOverride}`)
  })

  // Verify that Article pages (Auto & Manual) are grouped together, Hub pages together, Landing pages together
  const typesOrder = sorted.map(p => p.type)
  const isSortedAlphabetically = typesOrder.every((val, i, arr) => i === 0 || arr[i - 1].localeCompare(val) <= 0)

  console.log(`\nVerification: ${isSortedAlphabetically ? 'PASSED (Sorted strictly by Type string regardless of manual override)' : 'FAILED'}`)
}

testTypeSorting()
