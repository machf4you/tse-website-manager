import { useState } from 'react'
import { extractPagesFromPackage, extractPostsFromPackage } from '../utils/packageExtractor'
import './PageManagementPage.css'

export default function PageManagementPage({
  site,
  storedPackageData,
  onBack,
  onTabChange,
  onSyncFromWordPress,
  isSyncing,
}) {
  const [filter, setFilter] = useState('all') // 'all' | 'configured' | 'action_required' | 'excluded'
  const [sortColumn, setSortColumn] = useState('page') // 'page' | 'type' | 'priority'
  const [sortDirection, setSortDirection] = useState('asc') // 'asc' | 'desc'

  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(col)
      setSortDirection('asc')
    }
  }

  // Extract exported pages and posts using resilient package extractor
  const pkg = storedPackageData || site?.storedPackageData
  const pagesList = extractPagesFromPackage(pkg, site?.url)
  const _postsList = extractPostsFromPackage(pkg)

  // Filter pages based on filter tab selection
  const filteredPages = pagesList.filter(p => {
    if (filter === 'configured') return p.isConfigured === true
    if (filter === 'action_required') return p.isConfigured !== true && !p.isExcluded
    if (filter === 'excluded') return p.isExcluded === true
    return true
  })

  // Sort filtered pages based on sortColumn and sortDirection
  const sortedPages = [...filteredPages].sort((a, b) => {
    let valA = ''
    let valB = ''

    if (sortColumn === 'page') {
      valA = (a.title || '').toLowerCase()
      valB = (b.title || '').toLowerCase()
    } else if (sortColumn === 'type') {
      valA = (a.type || '').toLowerCase()
      valB = (b.type || '').toLowerCase()
    } else if (sortColumn === 'priority') {
      valA = String(a.priority || '').toLowerCase()
      valB = String(b.priority || '').toLowerCase()
    } else if (sortColumn === 'target') {
      valA = (a.target || '').toLowerCase()
      valB = (b.target || '').toLowerCase()
    } else if (sortColumn === 'status') {
      valA = (a.isExcluded ? 'Excluded' : (a.isConfigured ? 'Configured' : 'Included')).toLowerCase()
      valB = (b.isExcluded ? 'Excluded' : (b.isConfigured ? 'Configured' : 'Included')).toLowerCase()
    } else if (sortColumn === 'actions') {
      valA = String(a.id || '').toLowerCase()
      valB = String(b.id || '').toLowerCase()
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Calculate filter tab counts
  const allCount = pagesList.length
  const configuredCount = pagesList.filter(p => p.isConfigured === true).length
  const actionRequiredCount = pagesList.filter(p => !p.isConfigured && !p.isExcluded).length
  const excludedCount = pagesList.filter(p => p.isExcluded === true).length

  const renderSortIndicator = (col) => {
    if (sortColumn !== col) return <span className="sort-icon inactive">↕</span>
    return <span className="sort-icon active">{sortDirection === 'asc' ? '▲' : '▼'}</span>
  }

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
          <button
            type="button"
            className="w3-btn-secondary"
            id="btn-w3-sync-wp"
            onClick={onSyncFromWordPress}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing...' : 'Sync from WordPress'}
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
          id="tab-w3-website-settings"
        >
          W6 | Website Settings
        </button>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="w3-filter-tabs">
        <button
          type="button"
          className={`w3-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
          id="filter-all"
        >
          All ({allCount})
        </button>
        <button
          type="button"
          className={`w3-filter-btn ${filter === 'configured' ? 'active' : ''}`}
          onClick={() => setFilter('configured')}
          id="filter-configured"
        >
          Configured ({configuredCount})
        </button>
        <button
          type="button"
          className={`w3-filter-btn ${filter === 'action_required' ? 'active' : ''}`}
          onClick={() => setFilter('action_required')}
          id="filter-action-required"
        >
          Action Required ({actionRequiredCount})
        </button>
        <button
          type="button"
          className={`w3-filter-btn ${filter === 'excluded' ? 'active' : ''}`}
          onClick={() => setFilter('excluded')}
          id="filter-excluded"
        >
          Excluded ({excludedCount})
        </button>
      </div>

      {/* ── Exported Pages Table ── */}
      <div className="w3-table-wrapper">
        <table className="w3-table">
          <thead>
            <tr>
              <th className="sortable-th" onClick={() => handleSort('page')}>
                Page {renderSortIndicator('page')}
              </th>
              <th className="sortable-th" onClick={() => handleSort('type')}>
                Type {renderSortIndicator('type')}
              </th>
              <th className="sortable-th" onClick={() => handleSort('priority')}>
                Priority {renderSortIndicator('priority')}
              </th>
              <th className="sortable-th" onClick={() => handleSort('target')}>
                Target {renderSortIndicator('target')}
              </th>
              <th className="sortable-th" onClick={() => handleSort('status')}>
                Status {renderSortIndicator('status')}
              </th>
              <th className="sortable-th" onClick={() => handleSort('actions')}>
                Actions {renderSortIndicator('actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPages.length > 0 ? (
              sortedPages.map((page, idx) => (
                <tr key={page.id || idx}>
                  <td className="col-page">
                    <div className="w3-page-title">{page.title || 'Untitled Page'}</div>
                    <div className="w3-page-slug">{page.url || ''}</div>
                  </td>
                  <td className="col-type">
                    <span className={
                      page.type === 'Hub' ? 'type-hub' :
                      page.type === 'Landing' ? 'type-landing' :
                      page.type === 'Topical' ? 'type-topical' :
                      page.type === 'Excluded' ? 'type-excluded' :
                      'type-unclassified'
                    }>
                      {page.type || 'Unclassified'}
                    </span>
                  </td>
                  <td className="col-priority">{''}</td>
                  <td className="col-target">{''}</td>
                  <td className="col-status">
                    <span className={page.isExcluded ? 'status-excluded' : 'status-included'}>
                      {page.isExcluded ? 'Excluded' : 'Included'}
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
