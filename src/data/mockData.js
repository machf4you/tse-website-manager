export const mockSiteTile = {
  id: 1,
  name: 'Ascent Builders',
  url: 'https://ascentbuilders.co.uk',
  platform: 'wordpress',
  serverType: 'Caddy',
  wpUser: 'admin',
  wpPass: '',
  lifecycleStage: 3,
  topIndicator: 'connected',
  isSynchronised: false,
  lastSyncTimestamp: null,
  lastAuditTimestamp: null,
  taskCount: 0,
  status: {
    connection:       { label: 'Connected',          value: 'Connected',          variant: 'green' },
    platformApi:      { label: 'WordPress API',      value: 'Securely Connected', variant: 'green', icon: 'lock' },
    configured:       { label: 'Configured',         value: 'Not Configured',     variant: 'grey'  },
    audited:          { label: 'Audited',            value: 'Never',              variant: 'grey'  },
    tasksOutstanding: { label: 'Tasks Outstanding',  value: '0 Outstanding',      variant: 'green' },
  },
}

// ── Factory: build a Stage 3 (Platform Connected) record after WP connection
export function buildWordPressSite({ name, url, portfolio, serverType, elementorEnabled, user, wpUser, wpPass }) {
  return {
    id: Date.now(),
    name,
    url,
    platform: 'wordpress',
    portfolio,
    serverType: serverType || 'Unknown',
    elementorEnabled,
    wpUser: wpUser || (user ? user.name : ''),
    wpPass: wpPass || '',
    connectedUser: user ? user.name : (wpUser || null),
    lifecycleStage: 3,
    topIndicator: 'connected',
    isSynchronised: false,
    lastSyncTimestamp: null,
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
