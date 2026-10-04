import { useState, useEffect } from 'react'
import { getSiteBacklinksApi, getSiteBacklinkDocsApi } from '../services/websiteManagerApi'
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

const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
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
  const [refDocs, setRefDocs] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const cleanDomain = String(site?.url || site?.name || '')
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')

  const fetchBacklinks = async () => {
    setIsLoading(true)
    try {
      const [res, docsRes] = await Promise.all([
        getSiteBacklinksApi(site),
        getSiteBacklinkDocsApi(site)
      ])
      if (res) {
        setData({
          total: res.total || 0,
          indexed: res.indexed || 0,
          awaiting: res.awaiting || 0,
          topTargetPages: res.topTargetPages || [],
          backlinks: res.backlinks || []
        })
      }
      if (docsRes && Array.isArray(docsRes.docs)) {
        setRefDocs(docsRes.docs)
      } else {
        setRefDocs([])
      }
    } catch (e) {
      console.error('Error fetching backlinks for W8:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBacklinks()
  }, [site?.id, site?.url])

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

      {/* Section 2: BACKLINK PLAN / REFERENCE */}
      <div className="bl-ref-section" id="backlink-plan-reference-section">
        <div className="bl-ref-header">
          <div className="bl-ref-title-group">
            <h3 className="bl-ref-title">BACKLINK PLAN / REFERENCE</h3>
            <span className="bl-ref-subtitle">
              Website-specific backlink strategy & research documents
            </span>
          </div>
        </div>

        {refDocs.length > 0 ? (
          <div className="bl-ref-docs-list">
            {refDocs.map(doc => (
              <div key={doc.id} className="bl-ref-doc-card">
                <div className="bl-ref-doc-icon">
                  <FileTextIcon />
                </div>
                <div className="bl-ref-doc-details">
                  <span className="bl-ref-doc-name">{doc.filename || doc.title}</span>
                  <span className="bl-ref-doc-meta">
                    Master Backlink Strategy Document • Scoped to {site?.name || 'this site'}
                  </span>
                </div>
                <div className="bl-ref-doc-actions">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    download={doc.filename}
                    className="bl-ref-download-btn"
                  >
                    <DownloadIcon />
                    Open / Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bl-ref-empty">
            <p>No backlink reference documents added for this website.</p>
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
