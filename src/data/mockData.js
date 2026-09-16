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
export function buildWordPressSite({ id, domain_id, domainId, name, url, portfolio, serverType, elementorEnabled, user, wpUser, wpPass, configData }) {
  const resolvedDomainId = domain_id || domainId || null
  return {
    id: id || Date.now(),
    domain_id: resolvedDomainId,
    domainId: resolvedDomainId,
    name,
    url,
    platform: 'wordpress',
    portfolio: portfolio || 'tse',
    serverType: serverType || 'Unknown',
    elementorEnabled: Boolean(elementorEnabled),
    wpUser: wpUser || (user ? user.name : ''),
    wpPass: wpPass || '',
    connectedUser: user ? user.name : (wpUser || null),
    lifecycleStage: 3,
    topIndicator: 'connected',
    isSynchronised: false,
    lastSyncTimestamp: null,
    taskCount: 0,
    configData: {
      ...(configData || {}),
      domain_id: resolvedDomainId,
      domainId: resolvedDomainId,
      platform: 'wordpress',
      wpUser: wpUser || (user ? user.name : ''),
      wpPass: wpPass || '',
      connectedUser: user ? user.name : (wpUser || null),
      serverType: serverType || 'Unknown',
      elementorEnabled: Boolean(elementorEnabled)
    },
    status: {
      connection:       { label: 'Connected',         value: 'Connected',          variant: 'green'  },
      platformApi:      { label: 'WordPress API',     value: 'Securely Connected', variant: 'green', icon: 'lock' },
      configured:       { label: 'Configured',        value: 'Not Configured',     variant: 'grey'   },
      audited:          { label: 'Audited',           value: 'Not Audited',        variant: 'grey'   },
      tasksOutstanding: { label: 'Tasks Outstanding', value: '0 Outstanding',      variant: 'green'  },
    },
  }
}
