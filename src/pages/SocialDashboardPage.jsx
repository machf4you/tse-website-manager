import { useState } from 'react'
import './SocialDashboardPage.css'

const Share2Icon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
)

export default function SocialDashboardPage({ site, onBack }) {
  return (
    <div className="social-dashboard-page">
      {/* Top-left Back Link */}
      <div>
        <button
          type="button"
          className="w2-btn-back"
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}
          id="btn-back-to-dashboard"
        >
          ← Back to Website Dashboard
        </button>
      </div>

      {/* Header Card */}
      <div className="sd-header-card">
        <div className="sd-header-info">
          <span className="sd-pill-tag">W7 | SOCIAL</span>
          <h1 className="sd-title">Social Dashboard — {site?.name}</h1>
          <p className="sd-subtitle">
            Create, schedule and publish social content for this website.
          </p>
        </div>
      </div>

      {/* Empty State Panel */}
      <div className="sd-empty-panel">
        <div className="sd-empty-icon-bg">
          <Share2Icon />
        </div>
        <h2 className="sd-empty-title">SOCIAL ACCOUNTS</h2>
        <p className="sd-empty-desc">No social accounts connected yet.</p>
      </div>
    </div>
  )
}
