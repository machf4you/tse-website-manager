import { useState } from 'react'
import './PageManagementPage.css'

export default function PageManagementPage({ site, storedPackageData, onBack, onTabChange }) {
  const [filter, setFilter] = useState('all') // 'all' | 'configured' | 'action_required' | 'excluded'

  // Extract exported page inventory directly from storedPackageData.data.pages
  const pagesList = storedPackageData?.data?.pages || []
  const _postsList = storedPackageData?.data?.posts || []

  // Filter pages based on filter tab selection
  const filteredPages = pagesList.filter(p => {
    if (filter === 'configured') return p.isConfigured === true
    if (filter === 'action_required') return p.isConfigured !== true && !p.isExcluded
    if (filter === 'excluded') return p.isExcluded === true
    return true
  })

  return (
    <div className="w3-page-container">

      {/* ── Back to W2 Dashboard ── */}
      <div className="w3-back-row">
        <button
          type="button"
          className="w3-btn-back"
          onClick={onBack}
          id="btn-back-to-w2"
        >
          ← Back to W2 - Website Dashboard
        </button>
      </div>

      {/* ── Page Header ── */}
      <div className="w3-header">
        <div className="w3-header-meta">
          <span className="w3-pill-badge">W3 | PAGE MANAGEMENT</span>
          <h1 className="w3-site-name">{site.name}</h1>
          <a
            href={site.url}
            target="_blank"
            rel="noreferrer"
            className="w3-site-url"
          >
            {site.url}
          </a>
        </div>

        <div className="w3-header-actions">
          <button type="button" className="w3-btn-secondary" id="btn-w3-sync-wp">
            Sync from WordPress
          </button>
          <button type="button" className="w3-btn-emerald" id="btn-w3-run-audit">
            Run Audit ▷
          </button>
        </div>
      </div>

      {/* ── Main Module Navigation Tabs ── */}
      <div className="w3-module-tabs">
        <button
          type="button"
          className="w3-tab active"
          id="tab-w3-manage-pages"
        >
          W3 | Manage Pages
        </button>
        <button
          type="button"
          className="w3-tab"
          onClick={() => onTabChange && onTabChange('w4')}
          id="tab-w3-review-links"
        >
          W4 | Review Links
        </button>
        <button
          type="button"
          className="w3-tab"
          onClick={() => onTabChange && onTabChange('w5')}
          id="tab-w3-site-analysis"
        >
          W5 | Site Analysis
        </button>
        <button
          type="button"
          className="w3-tab"
          onClick={() => onTabChange && onTabChange('w6')}
          id="tab-w3-settings"
        >
          W6 | Website Settings
        </button>
      </div>

      {/* ── Sub Filter Tabs ── */}
      <div className="w3-filter-tabs">
        <button
          type="button"
          className={`w3-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
          id="filter-all"
        >
          All
        </button>
        <button
          type="button"
          className={`w3-filter-btn ${filter === 'configured' ? 'active' : ''}`}
          onClick={() => setFilter('configured')}
          id="filter-configured"
        >
          Configured
        </button>
        <button
          type="button"
          className={`w3-filter-btn ${filter === 'action_required' ? 'active' : ''}`}
          onClick={() => setFilter('action_required')}
          id="filter-action-required"
        >
          Action Required
        </button>
        <button
          type="button"
          className={`w3-filter-btn ${filter === 'excluded' ? 'active' : ''}`}
          onClick={() => setFilter('excluded')}
          id="filter-excluded"
        >
          Excluded
        </button>
      </div>

      {/* ── Exported Pages Table ── */}
      <div className="w3-table-wrapper">
        <table className="w3-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Target</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPages.length > 0 ? (
              filteredPages.map((page, idx) => (
                <tr key={page.id || idx}>
                  <td className="col-page">
                    <div className="w3-page-title">{page.title?.rendered || page.title || 'Untitled Page'}</div>
                    <div className="w3-page-slug">{page.slug || page.link || page.url || '-'}</div>
                  </td>
                  <td className="col-type">{page.type || page.pageType || '-'}</td>
                  <td className="col-priority">{page.priority || '-'}</td>
                  <td className="col-target">{page.target || '-'}</td>
                  <td className="col-status">
                    <span className={page.isConfigured ? 'status-configured' : 'status-unconfigured'}>
                      {page.isConfigured ? 'Configured' : 'Unconfigured'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <button
                      type="button"
                      className="btn-configure-page"
                      id={`btn-configure-page-${page.id || idx}`}
                    >
                      Configure
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="w3-empty-row">
                  No pages found in stored exporter package.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
