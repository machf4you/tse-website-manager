import './WebsiteCard.css'

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
)

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

const ManageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
  </svg>
)

const ScanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M7 12h10" /><path d="M12 7v10" />
  </svg>
)

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

function formatRelativeTime(isoString) {
  if (!isoString) return 'Never'
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (hours < 1) return `${mins}m ago`
  if (days < 1) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(isoString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getDomainInitials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function WebsiteCard({ website }) {
  const isActive = website.status === 'active'

  return (
    <article className="website-card" aria-label={`${website.name} website card`}>
      {/* Header */}
      <div className="wc-header">
        <div className="wc-identity">
          <div className="wc-avatar" aria-hidden="true">
            {getDomainInitials(website.name)}
          </div>
          <div className="wc-info">
            <h3 className="wc-name">{website.name}</h3>
            <a
              href={`https://${website.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="wc-domain"
              aria-label={`Visit ${website.domain}`}
            >
              {website.domain} <ExternalLinkIcon />
            </a>
          </div>
        </div>
        <div className={`wc-status-badge ${isActive ? 'status-active' : 'status-inactive'}`}>
          <span className="status-dot" aria-hidden="true" />
          {isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      {/* Stats Row */}
      <div className="wc-stats">
        <div className="wc-stat">
          <span className="wc-stat-icon"><FileIcon /></span>
          <span className="wc-stat-value">{website.totalPages.toLocaleString()}</span>
          <span className="wc-stat-label">pages</span>
        </div>
        <div className="wc-stat-divider" aria-hidden="true" />
        <div className="wc-stat">
          <span className="wc-stat-icon"><ClockIcon /></span>
          <span className="wc-stat-value">{formatRelativeTime(website.lastUpdated)}</span>
          <span className="wc-stat-label">updated</span>
        </div>
        <div className="wc-stat-divider" aria-hidden="true" />
        <div className="wc-stat">
          <span className="wc-stat-icon"><ScanIcon /></span>
          <span className="wc-stat-value">{formatRelativeTime(website.lastScanned)}</span>
          <span className="wc-stat-label">scanned</span>
        </div>
      </div>

      {/* Category Tag */}
      <div className="wc-meta">
        <span className="wc-category">{website.category}</span>
      </div>

      {/* Actions */}
      <div className="wc-actions">
        <button type="button" className="wc-btn wc-btn-manage" id={`btn-manage-${website.id}`}>
          <ManageIcon /> Manage
        </button>
        <button type="button" className="wc-btn wc-btn-scan" id={`btn-scan-${website.id}`}>
          <ScanIcon /> Scan
        </button>
        <button type="button" className="wc-btn wc-btn-settings" id={`btn-settings-${website.id}`} aria-label="Settings">
          <SettingsIcon />
        </button>
      </div>
    </article>
  )
}
