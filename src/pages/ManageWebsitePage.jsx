import './ManageWebsitePage.css'

const SECTIONS = [
  { id: 'connection',        title: 'Connection',        icon: 'plug' },
  { id: 'synchronisation',   title: 'Synchronisation',   icon: 'refresh-cw' },
  { id: 'pages',             title: 'Pages',             icon: 'file-text' },
  { id: 'site-information',  title: 'Site Information',  icon: 'info' },
  { id: 'audit',             title: 'Audit',             icon: 'check-square' },
  { id: 'settings',          title: 'Settings',          icon: 'sliders' },
]

export default function ManageWebsitePage({ site, onBack }) {
  if (!site) return null

  return (
    <div className="manage-website-page">

      {/* Top Banner / Header */}
      <div className="mwp-header">
        <button
          type="button"
          className="mwp-btn-back"
          onClick={onBack}
          id="btn-back-to-websites"
        >
          ← Back to Websites
        </button>

        <div className="mwp-site-meta">
          <div className="mwp-site-title-row">
            <h2 className="mwp-site-name">{site.name}</h2>
            <span className="mwp-badge-status mwp-badge-connected">
              {site.topIndicator ? site.topIndicator.toUpperCase() : 'CONNECTED'}
            </span>
          </div>

          <a
            href={site.url}
            target="_blank"
            rel="noreferrer"
            className="mwp-site-url"
          >
            {site.url} ↗
          </a>
        </div>
      </div>

      {/* Grid of Control Centre Sections */}
      <div className="mwp-sections-grid">
        {SECTIONS.map((section) => (
          <div key={section.id} className="mwp-section-card" id={`section-${section.id}`}>
            <h3 className="mwp-section-title">{section.title}</h3>
            <p className="mwp-section-placeholder">Not yet implemented.</p>
          </div>
        ))}
      </div>

    </div>
  )
}
