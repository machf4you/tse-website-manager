// Master mock data for the single website tile
export const mockSiteTile = {
  id: 1,
  name: 'Bathroom Upgrades',
  url: 'https://www.bathroomupgrades.co.uk',
  connectionStatus: 'connected', // 'connected' | 'disconnected'
  taskCount: 4,
  status: {
    connected: { label: 'Connected', value: 'Connected', variant: 'green' },
    wordpressApi: { label: 'WordPress API', value: 'Securely Connected', variant: 'green', icon: 'lock' },
    configured: { label: 'Configured', value: 'Pages Configured (2/29)', variant: 'amber' },
    audited: { label: 'Audited', value: 'Audited (05 Jul 2026)', variant: 'green' },
    tasksOutstanding: { label: 'Tasks Outstanding', value: '3 Outstanding', variant: 'amber' },
  },
}
