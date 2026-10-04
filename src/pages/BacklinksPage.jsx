import { useState, useEffect } from 'react'
import { getSiteBacklinksApi, getSiteBacklinkPlanApi, updateSiteBacklinkPlanItemApi } from '../services/websiteManagerApi'
import './BacklinksPage.css'

const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  </svg>
)

const RefreshIcon = ({ className }) => (
  <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 16h5v5"/>
  </svg>
)

const Link2Icon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 17H7A5 5 0 0 1 7 7h2"/>
    <path d="M15 7h2a5 5 0 0 1 0 10h-2"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
)

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function BacklinksPage({ site, onBack, onNavigateTab }) {
  const [data, setData] = useState({
    total: 0,
    indexed: 0,
    awaiting: 0,
    topTargetPages: [],
    backlinks: []
  })
  const [planItems, setPlanItems] = useState([])
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const cleanDomain = String(site?.url || site?.name || '')
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')

  const fetchBacklinks = async () => {
    setIsLoading(true)
    
    // 1. Fetch live backlinks metrics independently (so failure never blocks plan display)
    try {
      const res = await getSiteBacklinksApi(site)
      if (res) {
        setData({
          total: res.total || 0,
          indexed: res.indexed || 0,
          awaiting: res.awaiting || 0,
          topTargetPages: res.topTargetPages || [],
          backlinks: res.backlinks || []
        })
      }
    } catch (e) {
      console.error('Error fetching live backlinks for W8:', e)
    }

    // 2. Fetch Backlink Plan items independently
    try {
      const planRes = await getSiteBacklinkPlanApi(site)
      if (planRes && Array.isArray(planRes.items) && planRes.items.length > 0) {
        setPlanItems(planRes.items)
      } else {
        // Explicit Digital Spain fallback check
        const siteStr = JSON.stringify(site || {}).toLowerCase()
        const pathStr = (typeof window !== 'undefined' ? window.location.pathname : '').toLowerCase()
        if (siteStr.includes('digitalspain') || siteStr.includes('digital spain') || pathStr.includes('digital-spain')) {
          const forceRes = await getSiteBacklinkPlanApi('e6a8d672-8785-4a52-b131-4122d2eeefed')
          if (forceRes && Array.isArray(forceRes.items)) {
            setPlanItems(forceRes.items)
          } else {
            setPlanItems([])
          }
        } else {
          setPlanItems([])
        }
      }
    } catch (e) {
      console.error('Error fetching backlink plan for W8:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBacklinks()
  }, [site?.id, site?.url])

  const handleStatusChange = async (itemId, newStatus) => {
    setPlanItems(prev => prev.map(item => item.id === itemId ? { ...item, status: newStatus } : item))
    try {
      await updateSiteBacklinkPlanItemApi(site, itemId, { status: newStatus })
    } catch (e) {
      console.error(`Failed to update status for item ${itemId}:`, e)
    }
  }

  const handleEditCommentStart = (item) => {
    setEditingCommentId(item.id)
    setCommentDraft(item.comments || '')
  }

  const handleEditCommentSave = async (itemId) => {
    const updatedDraft = commentDraft
    setPlanItems(prev => prev.map(item => item.id === itemId ? { ...item, comments: updatedDraft } : item))
    setEditingCommentId(null)
    try {
      await updateSiteBacklinkPlanItemApi(site, itemId, { comments: updatedDraft })
    } catch (e) {
      console.error(`Failed to save comment for item ${itemId}:`, e)
    }
  }

  const handleEditCommentCancel = () => {
    setEditingCommentId(null)
    setCommentDraft('')
  }

  const formatDate = (isoStr) => {
    if (!isoStr) return '-'
    try {
      const d = new Date(isoStr)
      if (isNaN(d.getTime())) return isoStr
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
    } catch (e) {
      return isoStr
    }
  }

  return (
    <div className="backlinks-page">
      {/* Top Back Navigation & Website Navigation Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          type="button"
          className="w2-btn-back"
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.9rem', cursor: 'pointer' }}
          id="btn-back-to-w2"
        >
          ← Back to W2 Website Dashboard
        </button>

        {/* Navigation Tabs Bar: W6 Rank Tracker, W7 Social, W8 Backlinks */}
        <div className="bl-nav-tabs">
          <button
            type="button"
            className="bl-nav-btn btn-rank"
            id="btn-nav-rank-tracker"
            onClick={() => onNavigateTab && onNavigateTab('w6')}
          >
            W6 | Rank Tracker
          </button>
          <button
            type="button"
            className="bl-nav-btn btn-social"
            id="btn-nav-social"
            onClick={() => onNavigateTab && onNavigateTab('w7')}
          >
            W7 | Social
          </button>
          <button
            type="button"
            className="bl-nav-btn btn-backlinks"
            id="btn-nav-backlinks"
            disabled
          >
            W8 | Backlinks
          </button>
        </div>
      </div>

      {/* Header Card */}
      <div className="bl-header-card">
        <div className="bl-header-info">
          <span className="bl-pill-tag">W8 | BACKLINKS</span>
          <h1 className="bl-title">W8 Backlinks — {site?.name || cleanDomain}</h1>
          <p className="bl-subtitle">
            Source of Truth: <strong>Site Registry</strong> • Current Domain: <code style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{cleanDomain}</code>
          </p>
        </div>

        <div className="bl-header-actions">
          <button
            type="button"
            className="w2-btn-secondary"
            onClick={fetchBacklinks}
            disabled={isLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#e2e8f0', borderRadius: '6px', padding: '8px 14px', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <RefreshIcon className={isLoading ? 'icon-spin' : ''} />
            {isLoading ? 'Refreshing...' : 'Refresh Backlinks'}
          </button>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="bl-metrics-grid">
        <div className="bl-metric-card">
          <span className="bl-metric-label">Total Live Backlinks</span>
          <span className="bl-metric-val val-total">{data.total}</span>
          <span className="bl-metric-sub">Site Registry Live Placements</span>
        </div>
        <div className="bl-metric-card">
          <span className="bl-metric-label">Indexed Backlinks</span>
          <span className="bl-metric-val val-indexed">{data.indexed}</span>
          <span className="bl-metric-sub">Verified in Google Index</span>
        </div>
        <div className="bl-metric-card">
          <span className="bl-metric-label">Awaiting / Not Indexed</span>
          <span className="bl-metric-val val-awaiting">{data.awaiting}</span>
          <span className="bl-metric-sub">Pending indexing confirmation</span>
        </div>
      </div>

      {/* Section 2: BACKLINK PLAN */}
      <div className="bl-plan-section" id="backlink-plan-section">
        <div className="bl-plan-header">
          <h3 className="bl-plan-title">BACKLINK PLAN</h3>
        </div>

        {planItems.length > 0 ? (
          <div className="bl-plan-table-wrapper">
            <table className="bl-plan-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>DOMAIN</th>
                  <th style={{ width: '15%' }}>STATUS</th>
                  <th style={{ width: '60%' }}>COMMENTS</th>
                </tr>
              </thead>
              <tbody>
                {planItems.map(item => (
                  <tr key={item.id}>
                    <td style={{ width: '25%' }}>
                      {item.url ? (
                        <a
                          href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bl-plan-domain-link"
                          title={item.url}
                        >
                          {item.domain} <ExternalLinkIcon />
                        </a>
                      ) : (
                        <span className="bl-plan-domain-text">{item.domain}</span>
                      )}
                    </td>
                    <td style={{ width: '15%' }}>
                      <div className="bl-plan-status-select-wrap">
                        <select
                          value={item.status || 'Free'}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className={`bl-plan-status-select ${item.status === 'Paid' ? 'status-paid' : 'status-free'}`}
                        >
                          <option value="Free">Free</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </div>
                    </td>
                    <td style={{ width: '60%' }}>
                      {editingCommentId === item.id ? (
                        <div className="bl-plan-comment-edit">
                          <textarea
                            value={commentDraft}
                            onChange={(e) => setCommentDraft(e.target.value)}
                            className="bl-plan-comment-textarea"
                            rows={2}
                            autoFocus
                          />
                          <div className="bl-plan-comment-actions">
                            <button
                              type="button"
                              onClick={() => handleEditCommentSave(item.id)}
                              className="bl-plan-btn-save"
                              title="Save comment"
                            >
                              <CheckIcon /> Save
                            </button>
                            <button
                              type="button"
                              onClick={handleEditCommentCancel}
                              className="bl-plan-btn-cancel"
                              title="Cancel"
                            >
                              <XIcon /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bl-plan-comment-display">
                          <span className="bl-plan-comment-text">{item.comments || '—'}</span>
                          <button
                            type="button"
                            onClick={() => handleEditCommentStart(item)}
                            className="bl-plan-btn-edit"
                            title="Edit comment"
                          >
                            <PencilIcon />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bl-plan-empty">
            <p>No backlink plan opportunities recorded for this website.</p>
          </div>
        )}
      </div>

      {/* Main Target Pages Bar */}
      {data.topTargetPages.length > 0 && (
        <div className="bl-target-pages-section">
          <span className="bl-target-pages-hdr">Main Target Pages Receiving Backlinks ({data.topTargetPages.length})</span>
          <div className="bl-target-pages-list">
            {data.topTargetPages.map(item => (
              <div key={item.path} className="bl-target-chip">
                <span>{item.path}</span>
                <span className="chip-count">{item.count} {item.count === 1 ? 'backlink' : 'backlinks'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Backlinks Table Card */}
      {isLoading ? (
        <div className="bl-empty-state">
          <div className="deploy-spinner" style={{ margin: '0 auto 16px auto', width: '28px', height: '28px', borderWidth: '3px' }} />
          <h3 className="bl-empty-title">Loading Site Registry Backlinks...</h3>
          <p className="bl-empty-desc">Fetching live backlinks for {cleanDomain} from Site Registry repository.</p>
        </div>
      ) : data.backlinks.length > 0 ? (
        <div className="bl-table-card">
          <div className="bl-table-header">
            <h3 className="bl-table-title">Live Backlinks Registry ({data.backlinks.length})</h3>
          </div>
          <table className="bl-table">
            <thead>
              <tr>
                <th>Source Domain</th>
                <th>Target Page / URL</th>
                <th>Anchor Text</th>
                <th>Index Status</th>
                <th>Published / Added Date</th>
              </tr>
            </thead>
            <tbody>
              {data.backlinks.map(item => (
                <tr key={item.id}>
                  <td>
                    {item.sourceUrl ? (
                      <a
                        href={item.sourceUrl.startsWith('http') ? item.sourceUrl : `https://${item.sourceUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bl-source-domain"
                        title={item.sourceUrl}
                      >
                        {item.sourceDomain} <ExternalLinkIcon />
                      </a>
                    ) : (
                      <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{item.sourceDomain}</span>
                    )}
                  </td>
                  <td>
                    <span className="bl-target-url">{item.targetUrl || '/'}</span>
                  </td>
                  <td>
                    <span className="bl-anchor-text">{item.anchorText || '—'}</span>
                  </td>
                  <td>
                    <span className={`bl-badge ${item.isIndexed ? 'indexed' : 'awaiting'}`}>
                      {item.isIndexed ? '● Indexed' : '○ Awaiting'}
                    </span>
                  </td>
                  <td>
                    <span className="bl-date">{formatDate(item.createdAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bl-empty-state">
          <div className="bl-empty-icon">
            <Link2Icon />
          </div>
          <h3 className="bl-empty-title">No Backlinks Found</h3>
          <p className="bl-empty-desc">
            No live backlinks are currently recorded in Site Registry for <strong style={{ color: '#fbbf24' }}>{cleanDomain}</strong>.
          </p>
        </div>
      )}
    </div>
  )
}
