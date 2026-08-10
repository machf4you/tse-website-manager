function testPrioritySorting() {
  console.log('=== TESTING W3 PRIORITY COLUMN SORTING ===\n')

  const pages = [
    { title: 'Page A (Auto Landing)', type: 'Landing', priority: 2, isManualOverride: false, isConfigured: false },
    { title: 'Page B (Manual Topical)', type: 'Topical', priority: 3, isManualOverride: true, isConfigured: true },
    { title: 'Page C (Auto Hub)', type: 'Hub', priority: 1, isManualOverride: false, isConfigured: false },
    { title: 'Page D (Manual Article)', type: 'Article', priority: 4, isManualOverride: true, isConfigured: true },
    { title: 'Page E (Manual Hub)', type: 'Hub', priority: 1, isManualOverride: true, isConfigured: true },
    { title: 'Page F (Auto Topical)', type: 'Topical', priority: 3, isManualOverride: false, isConfigured: false }
  ]

  // Priority Ascending (1 -> 2 -> 3 -> 4)
  const sortDirection = 'asc'
  const sortedAsc = [...pages].sort((a, b) => {
    const pA = (a.priority !== undefined && Number(a.priority) > 0) ? Number(a.priority) : 999
    const pB = (b.priority !== undefined && Number(b.priority) > 0) ? Number(b.priority) : 999
    if (pA !== pB) {
      return sortDirection === 'asc' ? pA - pB : pB - pA
    }
    return (a.title || '').localeCompare(b.title || '')
  })

  console.log('Sorted Priority Ascending Result:')
  sortedAsc.forEach(p => {
    console.log(`- ${p.title} | Priority: ${p.priority} | Type: ${p.type} | Manual: ${p.isManualOverride}`)
  })

  const priorityOrderAsc = sortedAsc.map(p => p.priority)
  const isSortedNumerically = priorityOrderAsc.every((val, i, arr) => i === 0 || arr[i - 1] <= val)

  console.log(`\nVerification: ${isSortedNumerically ? 'PASSED (Sorted strictly by numeric Priority regardless of manual override)' : 'FAILED'}`)
}

testPrioritySorting()
