import React, { useState, useEffect, useRef } from 'react'
import {
  getFirstAuditBatchStatusApi,
  startFirstAuditBatchApi,
  stopFirstAuditBatchApi,
  retryFailedFirstAuditBatchApi,
  resetFirstAuditBatchApi
} from '../services/websiteManagerApi'
import './BulkFirstAuditDialog.css'

export default function BulkFirstAuditDialog({ isOpen, onClose, onRefreshWebsites }) {
  const [batchData, setBatchData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [filterType, setFilterType] = useState('all') // 'all' | 'eligible' | 'completed' | 'skipped' | 'excluded' | 'failed'
  const [searchQuery, setSearchQuery] = useState('')
  const [errorMsg, setErrorMsg] = useState(null)
  const logContainerRef = useRef(null)

  const fetchStatus = async () => {
    try {
      const data = await getFirstAuditBatchStatusApi()
      if (data && data.success) {
        setBatchData(data)
      }
    } catch (err) {
      console.error('Failed to fetch batch status:', err)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetchStatus().finally(() => setLoading(false))

    // Auto-poll status
    const interval = setInterval(() => {
      fetchStatus()
    }, 2000)

    return () => clearInterval(interval)
  }, [isOpen])

  // Scroll logs to bottom on update
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [batchData?.logs])

  if (!isOpen) return null

  const isRunning = Boolean(batchData?.isRunning || batchData?.status === 'running')
  const isCompleted = batchData?.status === 'completed'
  const isStopped = batchData?.status === 'stopped'
  const sites = batchData?.siteStates || []

  const totalSites = batchData?.totalSites || sites.length
  const eligibleSites = batchData?.eligibleSites || sites.filter(s => s.eligible || s.status === 'QUEUED' || s.status === 'IN_PROGRESS').length
  const alreadyAuditedSites = batchData?.alreadyAuditedSites || sites.filter(s => s.status === 'SKIPPED_ALREADY_AUDITED').length
  const excludedSites = batchData?.excludedSites || sites.filter(s => s.status === 'NOT_READY_EXCLUDED').length
  const failedSites = (batchData?.failedSites !== undefined) ? batchData.failedSites : sites.filter(s => s.status === 'FAILED').length
  const completedSites = sites.filter(s => s.status === 'COMPLETED').length

  const handleStartBatch = async () => {
    if (isRunning || actionLoading) return
    if (!window.confirm(`Are you ready to run the automated First Audit batch for ${eligibleSites} eligible websites?\n\nThis will process websites sequentially (250ms throttling) with $0 external API costs.`)) {
      return
    }
    setActionLoading(true)
    setErrorMsg(null)
    try {
      const res = await startFirstAuditBatchApi()
      if (res && res.success) {
        setBatchData(res)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to start batch')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStopBatch = async () => {
    if (!isRunning || actionLoading) return
    setActionLoading(true)
    try {
      const res = await stopFirstAuditBatchApi()
      if (res && res.success) {
        setBatchData(res)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to stop batch')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRetryFailed = async () => {
    if (isRunning || actionLoading) return
    setActionLoading(true)
    setErrorMsg(null)
    try {
      const res = await retryFailedFirstAuditBatchApi()
      if (res && res.success) {
        setBatchData(res)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to retry failed sites')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReset = async () => {
    if (isRunning || actionLoading) return
    setActionLoading(true)
    setErrorMsg(null)
    try {
      const res = await resetFirstAuditBatchApi()
      if (res && res.success) {
        setBatchData(res)
      }
      if (onRefreshWebsites) onRefreshWebsites()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset batch state')
    } finally {
      setActionLoading(false)
    }
  }

  // Filter site list
  const filteredSites = sites.filter(site => {
    if (filterType === 'eligible') return site.eligible || site.status === 'QUEUED' || site.status === 'IN_PROGRESS'
    if (filterType === 'completed') return site.status === 'COMPLETED'
    if (filterType === 'skipped') return site.status === 'SKIPPED_ALREADY_AUDITED'
    if (filterType === 'excluded') return site.status === 'NOT_READY_EXCLUDED'
    if (filterType === 'failed') return site.status === 'FAILED'
    return true
  }).filter(site => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      (site.name && site.name.toLowerCase().includes(q)) ||
      (site.url && site.url.toLowerCase().includes(q)) ||
      (site.portfolio && site.portfolio.toLowerCase().includes(q)) ||
      (site.statusLabel && site.statusLabel.toLowerCase().includes(q))
    )
  })

  const getStatusBadge = (site) => {
    if (site.status === 'SKIPPED_ALREADY_AUDITED') {
      return <span className="batch-status-badge badge-skipped">SKIPPED — FIRST AUDIT ALREADY COMPLETE</span>
    }
    if (site.status === 'NOT_READY_EXCLUDED') {
      return <span className="batch-status-badge badge-excluded">NOT READY — EXCLUDED</span>
    }
    if (site.status === 'COMPLETED') {
      return <span className="batch-status-badge badge-completed">✓ FIRST AUDIT COMPLETE</span>
    }
    if (site.status === 'IN_PROGRESS') {
      return (
        <span className="batch-status-badge badge-running">
          <span className="batch-spinner">⏳</span> IN PROGRESS
        </span>
      )
    }
    if (site.status === 'FAILED') {
      return <span className="batch-status-badge badge-failed" title={site.error || 'Audit Failed'}>✗ FAILED</span>
    }
    return <span className="batch-status-badge badge-queued">QUEUED</span>
  }

  const overallPercent = batchData?.totalSites > 0
    ? Math.round(((batchData.processedSites || 0) / batchData.totalSites) * 100)
    : 0

  const pagePercent = batchData?.currentPageTotal > 0
    ? Math.round(((batchData.currentPageIndex || 0) / batchData.currentPageTotal) * 100)
    : 0

  return (
    <div className="batch-audit-modal-backdrop" onClick={onClose}>
      <div className="batch-audit-modal-content" onClick={e => e.stopPropagation()}>
        
        {/* ── Modal Header ── */}
        <div className="batch-modal-header">
          <div className="batch-header-title-wrap">
            <span className="batch-pill-badge">W1 | AUTOMATED BATCH RUNNER</span>
            <h2 className="batch-title">Automated First Audit Batch Runner</h2>
            <p className="batch-subtitle">
              Dynamic eligibility detection for all connected websites. Audits eligible sites sequentially with zero paid API costs ($0.00).
            </p>
          </div>
          <button type="button" className="batch-btn-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* ── Estate Summary Cards ── */}
        <div className="batch-summary-cards">
          <div className="batch-card card-total">
            <span className="batch-card-num">{totalSites}</span>
            <span className="batch-card-label">Total Sites</span>
          </div>
          <div className="batch-card card-eligible">
            <span className="batch-card-num">{eligibleSites}</span>
            <span className="batch-card-label">Eligible To Audit</span>
          </div>
          <div className="batch-card card-completed">
            <span className="batch-card-num">{alreadyAuditedSites + completedSites}</span>
            <span className="batch-card-label">Audited / Complete</span>
          </div>
          <div className="batch-card card-excluded">
            <span className="batch-card-num">{excludedSites}</span>
            <span className="batch-card-label">Excluded / Not Ready</span>
          </div>
          {failedSites > 0 && (
            <div className="batch-card card-failed">
              <span className="batch-card-num">{failedSites}</span>
              <span className="batch-card-label">Failed</span>
            </div>
          )}
        </div>

        {/* ── Controls Bar ── */}
        <div className="batch-controls-bar">
          <div className="batch-controls-left">
            {!isRunning ? (
              <button
                type="button"
                className="batch-btn-primary"
                onClick={handleStartBatch}
                disabled={actionLoading || eligibleSites === 0}
              >
                <span className="batch-btn-icon">⚡</span>
                <span>Start First Audit Batch ({eligibleSites})</span>
              </button>
            ) : (
              <button
                type="button"
                className="batch-btn-danger"
                onClick={handleStopBatch}
                disabled={actionLoading}
              >
                <span className="batch-btn-icon">⏹</span>
                <span>Stop Batch Execution</span>
              </button>
            )}

            {failedSites > 0 && !isRunning && (
              <button
                type="button"
                className="batch-btn-warning"
                onClick={handleRetryFailed}
                disabled={actionLoading}
              >
                <span>↺ Retry Failed ({failedSites})</span>
              </button>
            )}

            <button
              type="button"
              className="batch-btn-secondary"
              onClick={fetchStatus}
              disabled={actionLoading}
            >
              <span>↻ Refresh</span>
            </button>

            {(isCompleted || isStopped) && !isRunning && (
              <button
                type="button"
                className="batch-btn-ghost"
                onClick={handleReset}
                disabled={actionLoading}
              >
                <span>Reset Runner</span>
              </button>
            )}
          </div>

          <div className="batch-status-indicator">
            {isRunning && (
              <span className="status-live-pill">
                <span className="status-pulse-dot" /> RUNNING
              </span>
            )}
            {isCompleted && <span className="status-complete-pill">✓ COMPLETED</span>}
            {isStopped && <span className="status-stopped-pill">⏹ STOPPED</span>}
            {!isRunning && !isCompleted && !isStopped && (
              <span className="status-idle-pill">IDLE — READY</span>
            )}
          </div>
        </div>

        {/* ── Error Banner ── */}
        {errorMsg && (
          <div className="batch-error-banner">
            <span>⚠️ {errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg(null)}>×</button>
          </div>
        )}

        {/* ── Live Progress Section ── */}
        {isRunning && (
          <div className="batch-progress-section">
            <div className="batch-progress-row">
              <div className="batch-progress-meta">
                <span className="batch-progress-title">
                  <strong>Overall Batch Progress:</strong> Site {batchData?.processedSites + 1} of {batchData?.totalSites}
                  {batchData?.currentSiteName && ` (${batchData.currentSiteName})`}
                </span>
                <span className="batch-progress-percent">{overallPercent}%</span>
              </div>
              <div className="batch-progress-track">
                <div className="batch-progress-bar" style={{ width: `${overallPercent}%` }} />
              </div>
            </div>

            {batchData?.currentPageTotal > 0 && (
              <div className="batch-progress-row sub-progress">
                <div className="batch-progress-meta">
                  <span className="batch-sub-title">
                    Auditing Page {batchData.currentPageIndex} of {batchData.currentPageTotal}
                    {batchData.currentPageUrl && `: ${batchData.currentPageUrl}`}
                  </span>
                  <span className="batch-progress-percent">{pagePercent}%</span>
                </div>
                <div className="batch-progress-track sub-track">
                  <div className="batch-progress-bar sub-bar" style={{ width: `${pagePercent}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Estate Table & Filters ── */}
        <div className="batch-table-container">
          <div className="batch-table-header">
            <div className="batch-filter-tabs">
              <button
                type="button"
                className={`batch-tab-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All ({sites.length})
              </button>
              <button
                type="button"
                className={`batch-tab-btn ${filterType === 'eligible' ? 'active' : ''}`}
                onClick={() => setFilterType('eligible')}
              >
                Eligible ({eligibleSites})
              </button>
              <button
                type="button"
                className={`batch-tab-btn ${filterType === 'completed' ? 'active' : ''}`}
                onClick={() => setFilterType('completed')}
              >
                Completed ({completedSites})
              </button>
              <button
                type="button"
                className={`batch-tab-btn ${filterType === 'skipped' ? 'active' : ''}`}
                onClick={() => setFilterType('skipped')}
              >
                Skipped / Audited ({alreadyAuditedSites})
              </button>
              <button
                type="button"
                className={`batch-tab-btn ${filterType === 'excluded' ? 'active' : ''}`}
                onClick={() => setFilterType('excluded')}
              >
                Excluded ({excludedSites})
              </button>
              {failedSites > 0 && (
                <button
                  type="button"
                  className={`batch-tab-btn tab-failed ${filterType === 'failed' ? 'active' : ''}`}
                  onClick={() => setFilterType('failed')}
                >
                  Failed ({failedSites})
                </button>
              )}
            </div>

            <input
              type="text"
              className="batch-search-input"
              placeholder="Filter by name or domain..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="batch-table-scroll">
            <table className="batch-table">
              <thead>
                <tr>
                  <th>Website</th>
                  <th>Portfolio</th>
                  <th>Type</th>
                  <th>Pages</th>
                  <th>First Audit Status</th>
                  <th>Reason / Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map(site => (
                  <tr key={site.id} className={`batch-row ${site.status === 'IN_PROGRESS' ? 'row-active' : ''}`}>
                    <td className="col-site-info">
                      <div className="site-name-cell">{site.name}</div>
                      <div className="site-url-cell">{site.url}</div>
                    </td>
                    <td className="col-portfolio">
                      <span className="portfolio-tag">{site.portfolio || 'Other'}</span>
                    </td>
                    <td className="col-type">
                      <span className={`type-tag ${site.isMagazine ? 'tag-mag' : 'tag-comm'}`}>
                        {site.siteType || (site.isMagazine ? 'Magazine' : 'Commercial')}
                      </span>
                    </td>
                    <td className="col-pages">
                      {site.auditedPages > 0 ? (
                        <span className="pages-count count-audited">{site.auditedPages} / {site.totalPages || site.auditedPages}</span>
                      ) : (
                        <span className="pages-count count-unaudited">{site.totalPages || 0} pages</span>
                      )}
                    </td>
                    <td className="col-status">
                      {getStatusBadge(site)}
                    </td>
                    <td className="col-reason">
                      <span className="reason-text" title={site.error || site.reason}>
                        {site.error ? `Error: ${site.error}` : (site.reason || '—')}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredSites.length === 0 && (
                  <tr>
                    <td colSpan="6" className="batch-empty-cell">
                      No websites match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Live Log Output ── */}
        <div className="batch-logs-section">
          <div className="batch-logs-header">
            <span className="batch-logs-title">📋 Activity Log</span>
            <span className="batch-logs-count">{(batchData?.logs || []).length} events</span>
          </div>
          <div className="batch-logs-console" ref={logContainerRef}>
            {(batchData?.logs || []).length === 0 ? (
              <div className="batch-log-empty">No batch log activity recorded yet. Click Start First Audit Batch to begin.</div>
            ) : (
              batchData.logs.map((log, idx) => (
                <div key={idx} className="batch-log-entry">
                  <span className="log-time">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className="log-msg">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="batch-modal-footer">
          <div className="batch-footer-note">
            <span>💡 <strong>Pipeline Guarantee:</strong> First Audit reuses the existing Page Auditor engine with $0 external paid API calls.</span>
          </div>
          <button type="button" className="batch-btn-close-bottom" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
