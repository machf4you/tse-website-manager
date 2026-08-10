import { extractPagesFromPackage } from '../utils/packageExtractor'
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
const INDICATOR = {
  connected:    { label: 'CONNECTED',    cls: 'status-connected'    },
  partial:      { label: 'PARTIAL',      cls: 'status-partial'      },
  disconnected: { label: 'DISCONNECTED', cls: 'status-disconnected' },
  pending:      { label: 'PENDING',      cls: 'status-pending'      },
  connecting:   { label: 'CONNECTING…',  cls: 'status-connecting'   },
}

export default function WebsiteTile({ site, onManage, onEdit }) {
  const isConnected = Boolean(site.isSynchronised || site.topIndicator === 'connected')
  const ind = isConnected ? INDICATOR.connected : (INDICATOR[site.topIndicator] || INDICATOR.disconnected)

  // 1. Calculate live pages & configured metrics
  const packageStorageKey = site.id ? `tse_wp_package_${site.id}` : 'tse_wp_package_default'
  let pkg = site.storedPackageData
  if (!pkg) {
    try {
      const savedPkg = localStorage.getItem(packageStorageKey)
      if (savedPkg) {
        const parsed = JSON.parse(savedPkg)
        if (parsed && parsed.packageData) pkg = parsed.packageData
      }
    } catch (e) {
      // ignore
    }
  }

  const rawPages = extractPagesFromPackage(pkg)
  const totalPages = rawPages.length

  const siteIdKey = site.id ? `tse_page_configs_${site.id}` : 'tse_page_configs_default'
  let savedConfigs = {}
  try {
    const saved = localStorage.getItem(siteIdKey)
    if (saved) savedConfigs = JSON.parse(saved)
  } catch (e) {
    // ignore
  }

  const configuredPagesCount = rawPages.filter(p => {
    const pageKey = p.id || p.url
    const override = savedConfigs[pageKey] || (p.url ? savedConfigs[p.url] : null)
    if (override) {
      return override.isConfigured === true && !override.isExcluded && override.type !== 'Excluded'
    }
    return Boolean(override && override.isConfigured === true && !override.isExcluded && override.type !== 'Excluded')
  }).length

  let configuredText = totalPages > 0 ? `${configuredPagesCount} of ${totalPages}` : 'Not Configured'
  let configuredVariant = totalPages > 0 ? (configuredPagesCount === totalPages ? 'green' : (configuredPagesCount > 0 ? 'amber' : 'grey')) : 'grey'

  // 2. Calculate live audited pages count (e.g. 1 of 60)
  const auditStorageKey = site.id ? `tse_page_audits_${site.id}` : 'tse_page_audits_default'
  let storedAudits = {}
  try {
    const savedAudits = localStorage.getItem(auditStorageKey)
    if (savedAudits) storedAudits = JSON.parse(savedAudits)
  } catch (e) {
    // ignore
  }

  const auditedPagesCount = rawPages.filter(p => {
    const pageKey = p.id || p.url
    const record = storedAudits[pageKey] || (p.url ? storedAudits[p.url] : null)
    return Boolean(record && record.isAudited && record.auditResult)
  }).length

  let auditedText = totalPages > 0 ? `${auditedPagesCount} of ${totalPages}` : (site.lastAuditTimestamp ? site.lastAuditTimestamp : 'Never')
  let auditedVariant = totalPages > 0 ? (auditedPagesCount === totalPages ? 'green' : (auditedPagesCount > 0 ? 'amber' : 'grey')) : (site.lastAuditTimestamp ? 'green' : 'grey')

  // 3. Calculate live outstanding tasks (0 when none exist)
  const taskCount = site.taskCount || 0
  const taskText = `${taskCount} Outstanding`
  const taskVariant = taskCount > 0 ? 'amber' : 'green'

  const liveStatusRows = [
    { label: 'Connection',       value: isConnected ? 'Connected' : 'Disconnected', variant: isConnected ? 'green' : 'red' },
    { label: 'WordPress API',    value: isConnected ? 'Securely Connected' : 'Not Connected', variant: isConnected ? 'green' : 'grey', icon: isConnected ? 'lock' : null },
    { label: 'Configured',       value: configuredText, variant: configuredVariant },
    { label: 'Audited',          value: auditedText, variant: auditedVariant },
    { label: 'Tasks Outstanding', value: taskText, variant: taskVariant },
  ]

  return (
    <div className="website-tile" role="article" aria-label={`${site.name} website tile`}>

      {/* ── Top row: connection status + task count ── */}
      <div className="tile-top-row">
        <span className={`connection-status ${ind.cls}`}>
          <span className="connection-dot" aria-hidden="true" />
          {ind.label}
        </span>
        <span className="task-count-badge">
          {taskCount} TASKS
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

        {liveStatusRows.map((row, i) => (
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
        onClick={() => onManage && onManage(site)}
      >
        Manage Website
      </button>

      {/* ── Secondary button ── */}
      <button
        type="button"
        className="tile-btn-secondary"
        id={`btn-edit-${site.id}`}
        onClick={() => onEdit && onEdit(site)}
      >
        Edit Website
      </button>

    </div>
  )
}
