// ── Master mock tile — Stage 7: First Audit Completed ───────────────────
// Matches the reference: audit-dev.thesearchequation.co.uk
export const mockSiteTile = {
  id: 1,
  name: 'Bathroom Upgrades',
  url: 'https://www.bathroomupgrades.co.uk',
  platform: 'wordpress',
  lifecycleStage: 7,
  topIndicator: 'connected', // connected | partial | disconnected | pending | connecting
  taskCount: 4,
  status: {
    connection:       { label: 'Connected',          value: 'Connected',          variant: 'green'  },
    platformApi:      { label: 'WordPress API',      value: 'Securely Connected', variant: 'green', icon: 'lock' },
    configured:       { label: 'Configured',         value: 'Pages Configured (2/29)', variant: 'amber' },
    audited:          { label: 'Audited',            value: 'Audited (05-07-2026)', variant: 'green' },
    tasksOutstanding: { label: 'Tasks Outstanding',  value: '3 Outstanding',      variant: 'amber'  },
  },
}

// ── Factory: build a Stage 3 (Platform Connected) record after WP connection
export function buildWordPressSite({ name, url, portfolio, elementorEnabled, user }) {
  return {
    id: Date.now(),
    name,
    url,
    platform: 'wordpress',
    portfolio,
    elementorEnabled,
    connectedUser: user ? user.name : null,
    lifecycleStage: 3,
    topIndicator: 'connected',
    taskCount: 0,
    status: {
      connection:       { label: 'Connected',         value: 'Connected',          variant: 'green'  },
      platformApi:      { label: 'WordPress API',     value: 'Securely Connected', variant: 'green', icon: 'lock' },
      configured:       { label: 'Configured',        value: 'Not Configured',     variant: 'grey'   },
      audited:          { label: 'Audited',           value: 'Not Audited',        variant: 'grey'   },
      tasksOutstanding: { label: 'Tasks Outstanding', value: '0 Outstanding',      variant: 'green'  },
    },
  }
}
