import { useState, useEffect } from 'react'
import { extractPagesFromPackage, extractPostsFromPackage } from '../utils/packageExtractor'
import ConfigurePageDialog from '../components/ConfigurePageDialog'
import { getPageConfigsApi, savePageConfigsApi } from '../services/websiteManagerApi'
import './PageManagementPage.css'

export default function PageManagementPage({
  site,
  storedPackageData,
  onBack,
  onTabChange,
  onSyncFromWordPress,
  isSyncing,
  onViewAudit,
}) {
  const [filter, setFilter] = useState('all') // 'all' | 'configured' | 'action_required' | 'excluded'
  const [sortColumn, setSortColumn] = useState('priority') // 'priority' | 'page' | 'type'
  const [sortDirection, setSortDirection] = useState('asc') // 'asc' | 'desc'
  const [editingPage, setEditingPage] = useState(null)

  const [configurations, setConfigurations] = useState(() => {
    try {
      const siteIdKey = site?.id ? `tse_page_configs_${site.id}` : 'tse_page_configs_default'
      const saved = localStorage.getItem(siteIdKey)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load page configurations:', e)
    }
    return {}
  })

  useEffect(() => {
    let isMounted = true
    if (site?.id) {
      getPageConfigsApi(site.id).then(apiConfigs => {
        if (isMounted && apiConfigs && Object.keys(apiConfigs).length > 0) {
          setConfigurations(prev => ({ ...prev, ...apiConfigs }))
        }
      }).catch(() => {})
    }
    return () => { isMounted = false }
  }, [site?.id])

  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(col)
      setSortDirection('asc')
    }
  }

  const handleSavePageConfig = (config) => {
    const pageKey = config.pageId || config.url
    const updatedMap = {
      ...configurations,
      [pageKey]: config,
    }
    setConfigurations(updatedMap)
    if (site?.id) {
      savePageConfigsApi(site.id, updatedMap)
    }
    try {
      const siteIdKey = site?.id ? `tse_page_configs_${site.id}` : 'tse_page_configs_default'
      localStorage.setItem(siteIdKey, JSON.stringify(updatedMap))
    } catch (e) {
      console.error('Failed to save page configuration:', e)
    }
    setEditingPage(null)
  }

  const handleExcludePage = (page) => {
    const pageKey = page.id || page.url || page.pageUrl
    const urlKey = page.url || page.pageUrl || ''
    setConfigurations(prev => {
      const updated = {
        ...prev,
        [pageKey]: {
          ...(prev[pageKey] || {}),
          pageId: page.id,
          url: urlKey,
          isExcluded: true,
          type: 'Excluded',
          seoPageType: 'Excluded',
          priority: 0,
          isConfigured: true,
          status: 'configured',
        },
      }
      if (urlKey && urlKey !== pageKey) {
        updated[urlKey] = updated[pageKey]
      }
      try {
        const siteIdKey = site?.id ? `tse_page_configs_${site.id}` : 'tse_page_configs_default'
        localStorage.setItem(siteIdKey, JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save page configuration:', e)
      }
      return updated
    })
  }

  const handleIncludePage = (page) => {
    const pageKey = page.id || page.url || page.pageUrl
    const urlKey = page.url || page.pageUrl || ''
    setConfigurations(prev => {
      const updated = { ...prev }
      delete updated[pageKey]
      if (urlKey) delete updated[urlKey]
      try {
        const siteIdKey = site?.id ? `tse_page_configs_${site.id}` : 'tse_page_configs_default'
        localStorage.setItem(siteIdKey, JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save page configuration:', e)
      }
      return updated
    })
  }

  // Load stored page audit completions
  const auditStorageKey = site?.id ? `tse_page_audits_${site.id}` : 'tse_page_audits_default'
  const pageAudits = (() => {
    try {
      const saved = localStorage.getItem(auditStorageKey)
      return saved ? JSON.parse(saved) : {}
    } catch (e) {
      console.error('Failed to load page audits:', e)
      return {}
    }
  })()

  // Extract exported pages and merge user custom configurations and audit data
  const pkg = storedPackageData || site?.storedPackageData
  const rawPagesList = extractPagesFromPackage(pkg, site?.url)
  const _postsList = extractPostsFromPackage(pkg)

  const pagesList = rawPagesList.map(page => {
    const pageKey = page.id || page.url || page.pageUrl
    const urlKey = page.url || page.pageUrl || ''
    const override = configurations[pageKey] || (urlKey ? configurations[urlKey] : null)
    const auditRecord = pageAudits[pageKey] || (urlKey ? pageAudits[urlKey] : null)

    const isAudited = Boolean(auditRecord && auditRecord.isAudited && auditRecord.lastAuditTimestamp)
    const isStale = Boolean(auditRecord && auditRecord.isStale)
    const staleReason = auditRecord?.staleReason || null
    const lastAuditDate = isAudited ? auditRecord.lastAuditTimestamp : (override?.lastAuditDate || page.lastAuditDate || 'Never')

    if (override) {
      return {
        ...page,
        originalTitle: page.title,
        title: override.proposedTitle || page.title,
        proposedTitle: override.proposedTitle || page.title,
        target: override.targetPhrase || page.target || '',
        targetPhrase: override.targetPhrase || '',
        type: override.type || page.type,
        seoPageType: override.type || page.type,
        priority: override.priority !== undefined ? override.priority : page.priority,
        isConfigured: override.isConfigured !== undefined ? override.isConfigured : true,
        isExcluded: override.isExcluded !== undefined ? override.isExcluded : page.isExcluded,
        isAudited,
        isStale,
        staleReason,
        lastAuditDate,
        auditResult: auditRecord?.auditResult || null,
      }
    }
    return {
      ...page,
      originalTitle: page.title,
      proposedTitle: page.title,
      targetPhrase: page.target || '',
      isAudited,
      isStale,
      staleReason,
      lastAuditDate,
      auditResult: auditRecord?.auditResult || null,
    }
  })

  // Filter pages based on filter tab selection
  const filteredPages = pagesList.filter(p => {
    if (filter === 'configured') return p.isConfigured === true && !p.isExcluded && p.type !== 'Excluded'
    if (filter === 'action_required') return p.isConfigured !== true && !p.isExcluded && p.type !== 'Excluded'
    if (filter === 'excluded') return p.isExcluded === true || p.type === 'Excluded'
    // Default ('all'): hide excluded pages from table view (only active included pages are visible)
    return !p.isExcluded && p.type !== 'Excluded'
  })

  // Sort filtered pages: Configured pages list first, ordered by priority (1, 2, 3...)
  const sortedPages = [...filteredPages].sort((a, b) => {
    // 1. Primary ordering: Configured pages list first before unconfigured pages
    const isConfigA = Boolean(a.isConfigured && !a.isExcluded && a.type !== 'Excluded')
    const isConfigB = Boolean(b.isConfigured && !b.isExcluded && b.type !== 'Excluded')

    if (isConfigA !== isConfigB) {
      return isConfigA ? -1 : 1
    }

    // 2. Priority order for configured pages (Priority 1 -> Priority 2 -> Priority 3...)
    if (sortColumn === 'priority') {
      const pA = (a.priority !== undefined && Number(a.priority) > 0) ? Number(a.priority) : 999
      const pB = (b.priority !== undefined && Number(b.priority) > 0) ? Number(b.priority) : 999
      if (pA !== pB) {
        return sortDirection === 'asc' ? pA - pB : pB - pA
      }
      const tA = (a.title || '').toLowerCase()
      const tB = (b.title || '').toLowerCase()
      return tA.localeCompare(tB)
    }

    let valA = ''
    let valB = ''

    if (sortColumn === 'page') {
      valA = (a.title || '').toLowerCase()
      valB = (b.title || '').toLowerCase()
    } else if (sortColumn === 'type') {
      valA = (a.type || '').toLowerCase()
      valB = (b.type || '').toLowerCase()
    } else if (sortColumn === 'target') {
      valA = (a.target || a.targetPhrase || '').toLowerCase()
      valB = (b.target || b.targetPhrase || '').toLowerCase()
    } else if (sortColumn === 'lastAudit') {
      valA = (a.lastAuditDate || 'Never').toLowerCase()
      valB = (b.lastAuditDate || 'Never').toLowerCase()
    } else if (sortColumn === 'auditPage') {
      valA = (a.isAudited ? 'Audited' : (a.isConfigured ? 'Audit Page' : 'Available')).toLowerCase()
      valB = (b.isAudited ? 'Audited' : (b.isConfigured ? 'Audit Page' : 'Available')).toLowerCase()
    } else if (sortColumn === 'actions') {
      valA = String(a.id || '').toLowerCase()
      valB = String(b.id || '').toLowerCase()
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Calculate filter tab counts (All = Excluded + Configured + Action Required)
  const allCount = pagesList.length
  const configuredCount = pagesList.filter(p => p.isConfigured === true && !p.isExcluded && p.type !== 'Excluded').length
  const actionRequiredCount = pagesList.filter(p => !p.isConfigured && !p.isExcluded && p.type !== 'Excluded').length
  const excludedCount = pagesList.filter(p => p.isExcluded === true || p.type === 'Excluded').length

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
          onClick={() => onTabChange && onTabChange('w5')}
          id="tab-w3-all-internal-links"
        >
          W5 | All Internal Links
        </button>
        <button
          type="button"
          className="w3-tab"
          onClick={() => onTabChange && onTabChange('w6')}
          id="tab-w3-site-analysis"
        >
          W6 | Site Analysis
        </button>
        <button
          type="button"
          className="w3-tab"
          onClick={() => onTabChange && onTabChange('w7')}
          id="tab-w3-website-settings"
        >
          W7 | Website Settings
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
                Prio {renderSortIndicator('priority')}
              </th>
              <th className="sortable-th" onClick={() => handleSort('target')}>
                Target {renderSortIndicator('target')}
              </th>
              <th className="sortable-th" onClick={() => handleSort('lastAudit')}>
                Last Audit {renderSortIndicator('lastAudit')}
              </th>
              <th className="sortable-th" onClick={() => handleSort('auditPage')}>
                Audit Page {renderSortIndicator('auditPage')}
              </th>
              <th className="sortable-th" onClick={() => handleSort('actions')}>
                Actions {renderSortIndicator('actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPages.length > 0 ? (
              sortedPages.map((page, idx) => (
                <tr key={page.id || page.url || idx}>
                  <td className="col-page">
                    <div className="w3-page-title">{page.title || 'Untitled Page'}</div>
                    <div className="w3-page-slug">{page.url || ''}</div>
                  </td>
                  <td className="col-type">
                    <span className={
                      page.type === 'Hub' ? 'type-hub' :
                      page.type === 'Landing' ? 'type-landing' :
                      page.type === 'Topical' ? 'type-topical' :
                      page.type === 'Article' ? 'type-article' :
                      page.type === 'Excluded' ? 'type-excluded' :
                      'type-unclassified'
                    }>
                      {page.type || 'Unclassified'}
                    </span>
                  </td>
                  <td className="col-priority">{page.priority !== undefined ? page.priority : 0}</td>
                  <td className="col-target">
                    {(page.target || page.targetPhrase || '').trim() ? (
                      page.target || page.targetPhrase
                    ) : (
                      <span className="target-not-set">Not Set</span>
                    )}
                  </td>
                  <td className="col-last-audit">
                    {page.isAudited ? (
                      page.isStale ? (
                        <button
                          type="button"
                          className="btn-audit-stale-badge"
                          onClick={() => onViewAudit && onViewAudit(page)}
                          id={`btn-last-audit-${page.id || idx}`}
                          title={page.staleReason || 'WordPress data changed after last audit'}
                        >
                          🟡 Audit Stale ({page.lastAuditDate})
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-audit-completed-badge"
                          onClick={() => onViewAudit && onViewAudit(page)}
                          id={`btn-last-audit-${page.id || idx}`}
                          title="View completed audit results"
                        >
                          🟢 {page.lastAuditDate}
                        </button>
                      )
                    ) : (
                      <span className="w3-text-plain">Never</span>
                    )}
                  </td>
                  <td className="col-audit-page">
                    {page.isAudited ? (
                      page.isStale ? (
                        <button
                          type="button"
                          className="btn-audit-stale-action"
                          onClick={() => onViewAudit && onViewAudit(page)}
                          id={`btn-audit-page-${page.id || idx}`}
                          title="WordPress content modified after audit - Re-audit recommended"
                        >
                          Audit Required ?
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-audited-success"
                          onClick={() => onViewAudit && onViewAudit(page)}
                          id={`btn-audit-page-${page.id || idx}`}
                          title="View completed audit results"
                        >
                          Audited ✓
                        </button>
                      )
                    ) : page.isConfigured ? (
                      <button
                        type="button"
                        className="btn-table-audit-action btn-audit-active"
                        onClick={() => onViewAudit && onViewAudit(page)}
                        id={`btn-audit-page-${page.id || idx}`}
                      >
                        Audit Page
                      </button>
                    ) : (
                      <span className="w3-text-plain">Available</span>
                    )}
                  </td>
                  <td className="col-actions">
                    <button
                      type="button"
                      className={`btn-configure-page ${page.isConfigured ? 'btn-configured-state' : ''}`}
                      onClick={() => setEditingPage(page)}
                      id={`btn-configure-page-${page.id || idx}`}
                    >
                      {page.isConfigured ? 'Configured' : 'Configure'}
                    </button>
                    {page.isExcluded || page.type === 'Excluded' ? (
                      <button
                        type="button"
                        className="btn-row-include"
                        onClick={() => handleIncludePage(page)}
                        title="Include page back in active list"
                        id={`btn-include-page-${page.id || idx}`}
                      >
                        Include
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-row-exclude"
                        onClick={() => handleExcludePage(page)}
                        title="Exclude page with 1-click"
                        id={`btn-exclude-page-${page.id || idx}`}
                      >
                        Exclude
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="w3-empty-row">
                  No pages found in stored exporter package.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Configure Page Targeting Modal ── */}
      {editingPage && (
        <ConfigurePageDialog
          siteUrl={site?.url}
          page={editingPage}
          onClose={() => setEditingPage(null)}
          onSave={handleSavePageConfig}
        />
      )}

    </div>
  )
}
