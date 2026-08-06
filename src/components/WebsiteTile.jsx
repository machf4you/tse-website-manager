import './WebsiteTile.css'

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M15 3h6v6"/><path d="M10 14 21 3"/>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  </svg>
)

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" className="lock-icon">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

/* ── Status badge variants ─────────────────────────────────────────────────── */
function StatusBadge({ value, variant, icon }) {
  return (
    <span className={`status-badge badge-${variant}`}>
      {icon === 'lock' && <LockIcon />}
      {value}
    </span>
  )
}

/* ── Main tile ─────────────────────────────────────────────────────────────── */
export default function WebsiteTile({ site }) {
  const isConnected = site.connectionStatus === 'connected'

  return (
    <div className="website-tile" role="article" aria-label={`${site.name} website tile`}>

      {/* ── Top row: connection status + task count ── */}
      <div className="tile-top-row">
        <span className={`connection-status ${isConnected ? 'status-connected' : 'status-disconnected'}`}>
          <span className="connection-dot" aria-hidden="true" />
          {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
        <span className="task-count-badge">
          {site.taskCount} TASKS
        </span>
      </div>

      {/* ── Site name ── */}
      <h3 className="tile-site-name">{site.name}</h3>

      {/* ── Site URL ── */}
      <a
        href={site.url}
        target="_blank"
        rel="noreferrer"
        className="tile-site-url"
        aria-label={`Visit ${site.url}`}
      >
        {site.url} <ExternalLinkIcon />
      </a>

      {/* ── Status panel ── */}
      <div className="tile-status-panel">
        <div className="status-panel-header">
          <span>STATUS</span>
        </div>

        {Object.values(site.status).map((row, i) => (
          <div key={i} className="status-row">
            <span className="status-row-label">{row.label}</span>
            <StatusBadge value={row.value} variant={row.variant} icon={row.icon} />
          </div>
        ))}
      </div>

      {/* ── Primary button ── */}
      <button
        type="button"
        className="tile-btn-primary"
        id={`btn-manage-${site.id}`}
      >
        Manage Website
      </button>

      {/* ── Secondary button ── */}
      <button
        type="button"
        className="tile-btn-secondary"
        id={`btn-edit-${site.id}`}
      >
        Edit Website
      </button>

    </div>
  )
}
