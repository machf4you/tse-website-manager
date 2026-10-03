import { useState, useEffect, useMemo } from 'react'
import { appIntegrationsData as fallbackIntegrations } from '../data/appIntegrationsData.js'
import './AppIntegrationsPage.css'

export default function AppIntegrationsPage() {
  const [appsData, setAppsData] = useState(fallbackIntegrations)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAppFilter, setSelectedAppFilter] = useState('ALL')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL')

  useEffect(() => {
    let isMounted = true
    async function fetchIntegrations() {
      try {
        const res = await fetch('/api/app-integrations')
        if (res.ok) {
          const data = await res.json()
          if (data.success && Array.isArray(data.apps) && isMounted) {
            setAppsData(data.apps)
          }
        }
      } catch (e) {
        console.warn('[AppIntegrations] Using fallback local dataset:', e.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchIntegrations()
    return () => { isMounted = false }
  }, [])

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const totalApps = appsData.length
    let totalIntegrations = 0
    let activeCount = 0
    let configuredCount = 0
    const typesSet = new Set()

    appsData.forEach(app => {
      (app.integrations || []).forEach(item => {
        totalIntegrations++
        if (item.status === 'Active') activeCount++
        if (item.status === 'Configured') configuredCount++
        if (item.type) typesSet.add(item.type)
      })
    })

    return {
      totalApps,
      totalIntegrations,
      activeCount,
      configuredCount,
      allTypes: Array.from(typesSet).sort()
    }
  }, [appsData])

  // Filter logic
  const filteredApps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return appsData
      .filter(app => selectedAppFilter === 'ALL' || app.appId === selectedAppFilter)
      .map(app => {
        const matchingIntegrations = (app.integrations || []).filter(item => {
          const matchesType = selectedTypeFilter === 'ALL' || item.type === selectedTypeFilter
          const matchesSearch = !q || (
            app.appName.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q) ||
            (item.purpose || '').toLowerCase().includes(q) ||
            (item.type || '').toLowerCase().includes(q) ||
            (item.officialUrl || '').toLowerCase().includes(q)
          )
          return matchesType && matchesSearch
        })

        return {
          ...app,
          integrations: matchingIntegrations
        }
      })
      .filter(app => app.integrations.length > 0)
  }, [appsData, searchQuery, selectedAppFilter, selectedTypeFilter])

  return (
    <div className="ai-container">
      {/* Header Banner */}
      <header className="ai-header">
        <div className="ai-header-content">
          <div className="ai-title-row">
            <span className="ai-header-badge">LIVE REFERENCE</span>
            <h1 className="ai-title">App Integrations</h1>
          </div>
          <p className="ai-subtitle">
            Central authoritative directory of every LIVE TSE Application and every connected third-party service, API, platform, and external infrastructure engine.
          </p>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="ai-metrics-row">
        <div className="ai-metric-card">
          <span className="ai-metric-value">{metrics.totalApps}</span>
          <span className="ai-metric-label">Live TSE Production Apps</span>
        </div>
        <div className="ai-metric-card">
          <span className="ai-metric-value">{metrics.totalIntegrations}</span>
          <span className="ai-metric-label">Connected Third-Party Services</span>
        </div>
        <div className="ai-metric-card">
          <span className="ai-metric-value ai-metric-active">{metrics.activeCount}</span>
          <span className="ai-metric-label">Active Production Pipelines</span>
        </div>
        <div className="ai-metric-card">
          <span className="ai-metric-value ai-metric-configured">{metrics.configuredCount}</span>
          <span className="ai-metric-label">Configured / Standby APIs</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="ai-toolbar">
        <div className="ai-search-box">
          <svg className="ai-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="ai-search-input"
            placeholder="Search TSE app, third-party service, API type, or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="ai-clear-btn" onClick={() => setSearchQuery('')} type="button">×</button>
          )}
        </div>

        <div className="ai-filter-group">
          <select
            className="ai-select"
            value={selectedAppFilter}
            onChange={(e) => setSelectedAppFilter(e.target.value)}
          >
            <option value="ALL">All TSE Apps ({metrics.totalApps})</option>
            {appsData.map(app => (
              <option key={app.appId} value={app.appId}>
                {app.appName} ({(app.integrations || []).length})
              </option>
            ))}
          </select>

          <select
            className="ai-select"
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
          >
            <option value="ALL">All Integration Types</option>
            {metrics.allTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Apps List */}
      {filteredApps.length === 0 ? (
        <div className="ai-empty-state">
          <div className="ai-empty-icon">🔍</div>
          <h3>No matching integrations found</h3>
          <p>Try clearing search keywords or selecting different app filters.</p>
          <button
            className="ai-btn-reset"
            onClick={() => { setSearchQuery(''); setSelectedAppFilter('ALL'); setSelectedTypeFilter('ALL') }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="ai-apps-list">
          {filteredApps.map(app => (
            <section key={app.appId} className="ai-app-card" id={`app-${app.appId}`}>
              <div className="ai-app-header">
                <div className="ai-app-title-group">
                  <h2 className="ai-app-name">{app.appName}</h2>
                  {app.appDomain && (
                    <a
                      href={`https://${app.appDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ai-app-domain-link"
                      title={`Visit ${app.appName} live application`}
                    >
                      <span>https://{app.appDomain}</span>
                      <svg className="ai-ext-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  )}
                </div>
                <div className="ai-app-meta">
                  <span className="ai-count-badge">
                    {app.integrations.length} {app.integrations.length === 1 ? 'Integration' : 'Integrations'}
                  </span>
                </div>
              </div>

              {app.appDescription && (
                <p className="ai-app-desc">{app.appDescription}</p>
              )}

              {/* Integrations Table */}
              <div className="ai-table-wrapper">
                <table className="ai-table">
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>Third-Party Service / Platform</th>
                      <th style={{ width: '40%' }}>Purpose & Workflow</th>
                      <th style={{ width: '18%' }}>Integration Type</th>
                      <th style={{ width: '10%' }}>Status</th>
                      <th style={{ width: '10%', textAlign: 'right' }}>Official Site</th>
                    </tr>
                  </thead>
                  <tbody>
                    {app.integrations.map(item => (
                      <tr key={item.id} className="ai-table-row">
                        <td className="ai-service-cell">
                          <a
                            href={item.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ai-service-link"
                            title={`Visit official site: ${item.officialUrl}`}
                          >
                            <span className="ai-service-name">{item.name}</span>
                            <svg className="ai-ext-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                          </a>
                        </td>
                        <td className="ai-purpose-cell">
                          <span className="ai-purpose-text">{item.purpose}</span>
                        </td>
                        <td className="ai-type-cell">
                          <span className="ai-type-pill">{item.type}</span>
                        </td>
                        <td className="ai-status-cell">
                          <span className={`ai-status-pill ai-status-${(item.status || 'Active').toLowerCase()}`}>
                            <span className="ai-status-dot"></span>
                            {item.status || 'Active'}
                          </span>
                        </td>
                        <td className="ai-action-cell" style={{ textAlign: 'right' }}>
                          <a
                            href={item.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ai-visit-btn"
                          >
                            Visit Site ↗
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Security & Confidentiality Footer Note */}
      <footer className="ai-security-note">
        <div className="ai-security-icon">🔒</div>
        <div className="ai-security-text">
          <strong>Security Protocol:</strong> Credentials, API secret keys, tokens, and OAuth client secrets are strictly restricted to server environment configurations and are omitted from this public reference directory.
        </div>
      </footer>
    </div>
  )
}
