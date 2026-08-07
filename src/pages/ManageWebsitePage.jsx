import { useState } from 'react'
import './ManageWebsitePage.css'

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  </svg>
)

const FileTextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)

const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

const SlidersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/><line x1="18" y1="16" x2="22" y2="16"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const BrainIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.5 7.572A4 4 0 0 0 6 19a3.5 3.5 0 0 0 6 0 3.5 3.5 0 0 0 6 0 4 4 0 0 0 2.497-6.303 4 4 0 0 0-2.5-7.572A3 3 0 0 0 12 5z"/>
  </svg>
)

const RefreshCwIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 16h5v5"/>
  </svg>
)

export default function ManageWebsitePage({ site, onBack }) {
  const [isSynced, setIsSynced] = useState(() => {
    return Boolean(site && site.isSynchronised === true && site.lastSyncTimestamp)
  })

  if (!site) return null

  const handleSynchroniseClick = () => {
    setIsSynced(true)
  }

  return (
    <div className="w2-dashboard">

      {/* ── Top Back Button ── */}
      <div className="w2-back-row">
        <button
          type="button"
          className="w2-btn-back"
          onClick={onBack}
          id="btn-back-to-websites"
        >
          ← Back to All Connected Websites
        </button>
      </div>

      {/* ── Stage 3: Unsynchronised Prominent Banner ── */}
      {!isSynced && (
        <div className="w2-unsynced-banner" role="alert" id="banner-unsynchronised">
          <div className="w2-banner-text">
            <h2 className="w2-banner-heading">This website has not yet been synchronised.</h2>
            <p className="w2-banner-explanation">
              Synchronisation is required before pages, audits and other website data become available.
            </p>
          </div>
          <button
            type="button"
            className="w2-btn-sync-primary"
            id="btn-synchronise-website"
            onClick={handleSynchroniseClick}
          >
            <RefreshCwIcon />
            Synchronise Website
          </button>
        </div>
      )}

      {/* ── Header Title & Main Action Buttons ── */}
      <div className="w2-header">
        <div className="w2-header-title-meta">
          <span className="w2-pill-tag">W2 | WEBSITE DASHBOARD</span>
          <h1 className="w2-site-name">{site.name}</h1>
          <a
            href={site.url}
            target="_blank"
            rel="noreferrer"
            className="w2-site-url"
          >
            {site.url} <ExternalLinkIcon />
          </a>
        </div>

        <div className="w2-header-actions">
          <button type="button" className="w2-btn-secondary" id="btn-sync-from-other">
            Sync from Other
          </button>
          <button type="button" className="w2-btn-amber" id="btn-latest-audit-results">
            Latest Audit Results
          </button>
          <button type="button" className="w2-btn-emerald" id="btn-run-audit">
            Run Audit ▷
          </button>
        </div>
      </div>

      {/* ── 6 Stat Summary Metric Cards ── */}
      <div className="w2-stats-grid">
        <div className="w2-stat-card">
          <span className="w2-stat-label">WEBSITE STATUS</span>
          <span className="w2-stat-val val-connected">Connected</span>
        </div>
        <div className="w2-stat-card">
          <span className="w2-stat-label">TOTAL PAGES FOUND</span>
          <span className="w2-stat-val val-white">{isSynced ? '40' : '0'}</span>
        </div>
        <div className="w2-stat-card">
          <span className="w2-stat-label">CONFIGURED PAGES</span>
          <span className="w2-stat-val val-emerald">{isSynced ? '2' : '0'}</span>
        </div>
        <div className="w2-stat-card">
          <span className="w2-stat-label">UNCONFIGURED PAGES</span>
          <span className="w2-stat-val val-slate">{isSynced ? '27' : '0'}</span>
        </div>
        <div className="w2-stat-card">
          <span className="w2-stat-label">ACTION REQUIRED</span>
          <span className="w2-stat-val val-amber">{isSynced ? '29' : '0'}</span>
        </div>
        <div className="w2-stat-card">
          <span className="w2-stat-label">EXCLUDED PAGES</span>
          <span className="w2-stat-val val-slate">{isSynced ? '11' : '0'}</span>
        </div>
      </div>

      {/* ── 4 Main Feature Cards ── */}
      <div className="w2-feature-cards-grid">

        {/* Card 1: Manage Pages */}
        <div className={`w2-feature-card theme-emerald ${!isSynced ? 'card-locked' : ''}`}>
          <div className="w2-fc-header">
            <div className="w2-fc-icon-bg">
              <FileTextIcon />
            </div>
            <h3 className="w2-fc-title">Manage Pages</h3>
          </div>
          <p className="w2-fc-desc">
            Configure pages, targets, priorities and page settings.
          </p>
          <ul className="w2-fc-checklist">
            <li><span className="chk-icon">✓</span> Set target keywords and priorities</li>
            <li><span className="chk-icon">✓</span> Manage page configuration</li>
            <li><span className="chk-icon">✓</span> Include / exclude pages</li>
            <li><span className="chk-icon">✓</span> Bulk actions and exports</li>
          </ul>
          {isSynced ? (
            <button type="button" className="w2-fc-btn btn-open-emerald" id="btn-open-pages">
              Open Pages ›
            </button>
          ) : (
            <button type="button" className="w2-fc-btn btn-open-disabled" id="btn-open-pages" disabled>
              Locked (Requires Synchronisation)
            </button>
          )}
          <span className="w2-fc-tag">
            {isSynced ? 'W3 | PAGE MANAGEMENT' : 'W3 | PAGE MANAGEMENT (LOCKED)'}
          </span>
        </div>

        {/* Card 2: Review Links */}
        <div className="w2-feature-card theme-purple">
          <div className="w2-fc-header">
            <div className="w2-fc-icon-bg">
              <LinkIcon />
            </div>
            <h3 className="w2-fc-title">Review Links</h3>
          </div>
          <p className="w2-fc-desc">
            Review internal linking, orphan pages and AI recommendations.
          </p>
          <ul className="w2-fc-checklist">
            <li><span className="chk-icon">✓</span> Internal link analysis</li>
            <li><span className="chk-icon">✓</span> Orphan and weak pages</li>
            <li><span className="chk-icon">✓</span> AI link recommendations</li>
            <li><span className="chk-icon">✓</span> Link opportunities report</li>
          </ul>
          <button type="button" className="w2-fc-btn btn-open-purple" id="btn-open-links">
            Open Links ›
          </button>
          <span className="w2-fc-tag">W4 | INTERNAL LINKING</span>
        </div>

        {/* Card 3: Site Analysis */}
        <div className="w2-feature-card theme-blue">
          <div className="w2-fc-header">
            <div className="w2-fc-icon-bg">
              <ActivityIcon />
            </div>
            <h3 className="w2-fc-title">Site Analysis</h3>
          </div>
          <p className="w2-fc-desc">
            Review your site's structure, content and optimisation.
          </p>
          <ul className="w2-fc-checklist">
            <li><span className="chk-icon">✓</span> Site Structure</li>
            <li><span className="chk-icon">✓</span> Internal Links</li>
            <li><span className="chk-icon">✓</span> External Links</li>
            <li><span className="chk-icon">✓</span> Content Coverage</li>
          </ul>
          <button type="button" className="w2-fc-btn btn-open-blue" id="btn-open-site-analysis">
            Open Site Analysis ›
          </button>
          <span className="w2-fc-tag">W5 | SITE ANALYSIS</span>
        </div>

        {/* Card 4: Website Settings */}
        <div className="w2-feature-card theme-amber">
          <div className="w2-fc-header">
            <div className="w2-fc-icon-bg">
              <SlidersIcon />
            </div>
            <h3 className="w2-fc-title">Website Settings</h3>
          </div>
          <p className="w2-fc-desc">
            Manage website options, platform, portfolio and configuration.
          </p>
          <ul className="w2-fc-checklist">
            <li><span className="chk-icon">✓</span> Website classification</li>
            <li><span className="chk-icon">✓</span> Platform and API settings</li>
            <li><span className="chk-icon">✓</span> Portfolio management</li>
            <li><span className="chk-icon">✓</span> General configuration</li>
          </ul>
          <button type="button" className="w2-fc-btn btn-open-amber" id="btn-open-settings">
            Open Settings ›
          </button>
          <span className="w2-fc-tag">W6 | WEBSITE SETTINGS</span>
        </div>

      </div>

      {/* ── Section Title: WEBSITE INTELLIGENCE ── */}
      <div className="w2-section-heading">
        <h2>WEBSITE INTELLIGENCE</h2>
      </div>

      {/* ── 4 Intelligence Cards Grid ── */}
      <div className="w2-intel-grid">

        {/* Card 1: Recent Activity */}
        <div className="w2-intel-card">
          <div className="w2-ic-header">
            <span className="ic-title-wrap"><ClockIcon /> Recent Activity</span>
            <button type="button" className="ic-link">View All</button>
          </div>
          <div className="w2-activity-list">
            {isSynced ? (
              <>
                <div className="act-row">
                  <span className="act-label">WordPress sync completed</span>
                  <span className="act-time">07-08-2026 08:15</span>
                </div>
                <div className="act-row">
                  <span className="act-label">2 new pages discovered</span>
                  <span className="act-time">07-08-2026 08:15</span>
                </div>
                <div className="act-row">
                  <span className="act-label">Audit completed</span>
                  <span className="act-time">06-08-2026 14:32</span>
                </div>
                <div className="act-row">
                  <span className="act-label">Page configuration updated</span>
                  <span className="act-time">06-08-2026 11:05</span>
                </div>
              </>
            ) : (
              <div className="act-row">
                <span className="act-label">WordPress connection established</span>
                <span className="act-time">Just now</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Last Audit */}
        <div className="w2-intel-card">
          <div className="w2-ic-header">
            <span className="ic-title-wrap">📄 Last Audit</span>
            <button type="button" className="ic-link">View Report</button>
          </div>
          <div className="w2-audit-body">
            <div className="audit-gauge">
              <span className="gauge-score">{isSynced ? '78' : '—'}</span>
              <span className="gauge-max">{isSynced ? '/100' : ''}</span>
            </div>
            <div className="audit-details">
              <span className="audit-label">Overall Score</span>
              <span className="audit-rating">{isSynced ? 'Good' : 'Not Audited'}</span>
              <span className="audit-sub">
                {isSynced ? 'Audit completed: 06-08-2026 14:32' : 'Pending initial synchronisation'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: AI Recommendations */}
        <div className="w2-intel-card">
          <div className="w2-ic-header">
            <span className="ic-title-wrap">⚛ AI Recommendations</span>
            <button type="button" className="ic-link">View All</button>
          </div>
          <div className="w2-ai-body">
            <div className="ai-content">
              <span className="ai-count">{isSynced ? '12 Available' : '0 Available'}</span>
              <span className="ai-sub">Improve internal linking and technical SEO.</span>
              <button type="button" className="btn-ai-recs" disabled={!isSynced}>
                View Recommendations ›
              </button>
            </div>
            <div className="ai-icon-side">
              <BrainIcon />
            </div>
          </div>
        </div>

        {/* Card 4: Website Status */}
        <div className="w2-intel-card">
          <div className="w2-ic-header">
            <span className="ic-title-wrap">🖥 Website Status</span>
            <button type="button" className="ic-link">View Details</button>
          </div>
          <div className="w2-status-body">
            <div className="status-content">
              <span className="status-success-title">Connected</span>
              <span className="status-sub">
                {isSynced ? 'Last crawl: 07-08-2026 08:15' : 'Sync: Pending'}
              </span>
              <span className="status-sub">
                {isSynced ? 'Pages crawled: 40' : 'Pages: Not extracted'}
              </span>
              <span className="status-sub">
                {isSynced ? 'New pages found: 2' : 'Status: Ready to Sync'}
              </span>
            </div>
            <div className="status-icon-side">
              <CheckCircleIcon />
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
