import React, { useState } from 'react'
import './AppsDashboard.css'

/* ── SVG Icons ── */
const GlobeIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
)

const DatabaseIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
)

const MessageSquareIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const DownloadIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const SearchIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const NetworkIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="16" y="16" width="6" height="6" rx="1" />
    <rect x="2" y="16" width="6" height="6" rx="1" />
    <rect x="9" y="2" width="6" height="6" rx="1" />
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
    <path d="M12 12V8" />
  </svg>
)

const MegaphoneIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 11 18-5v12L3 14v-3z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
)

const ChevronRightIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const LayoutGridIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
)

const RocketIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
)

const CodeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
)

const CalendarIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const ExternalLinkIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

export default function AppsDashboard({ onOpenWebsiteManager }) {
  const [notification, setNotification] = useState(null)

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  const applications = [
    {
      id: 'WEBSITE_MANAGEMENT',
      name: 'Website Management',
      description: 'Manage connected websites, crawl pages, run phrase fits, and track SEO audits.',
      status: 'Live',
      version: 'v2.05',
      accentColor: '#10b981',
      IconComponent: GlobeIcon,
      onClick: onOpenWebsiteManager,
      isActionable: true,
      buttonText: 'Open App',
      liveUrl: 'https://tse-website-manager.thesearchequation.co.uk/',
      displayUrl: 'tse-website-manager.thesearchequation.co.uk',
      isDeployed: true
    },
    {
      id: 'LEAD_GENERATOR',
      name: 'Lead Generator',
      description: 'Find local businesses, extract contact details and prepare websites for the Audit Engine.',
      status: 'Live',
      version: 'v1.0.0',
      accentColor: '#6366f1',
      IconComponent: DatabaseIcon,
      launchUrl: 'https://lead-gen.thesearchequation.co.uk/',
      isActionable: true,
      buttonText: 'Launch',
      liveUrl: 'https://lead-gen.thesearchequation.co.uk/',
      displayUrl: 'lead-gen.thesearchequation.co.uk',
      isDeployed: true
    },
    {
      id: 'CHATZA',
      name: 'Chatza',
      description: 'Real-time communication and video collaboration client.',
      status: 'Live',
      version: 'v1.0.0',
      accentColor: '#3b82f6',
      IconComponent: MessageSquareIcon,
      launchUrl: 'https://meet.chatza.app/',
      isActionable: true,
      buttonText: 'Launch',
      liveUrl: 'https://meet.chatza.app/',
      displayUrl: 'meet.chatza.app',
      isDeployed: true
    },
    {
      id: 'WP_EXPORTER',
      name: 'WP Exporter',
      description: 'WordPress site exporter plugin data manager and sync agent.',
      status: 'Coming Soon',
      version: 'v1.0.0',
      accentColor: '#8b5cf6',
      IconComponent: DownloadIcon,
      isActionable: false,
      buttonText: 'Coming Soon',
      liveUrl: null,
      displayUrl: 'Not deployed',
      isDeployed: false
    },
    {
      id: 'PAGE_AUDITOR',
      name: 'Page Auditor',
      description: 'Intelligent page-level SEO auditing and fitment engine (Integrated directly into Website Manager W4).',
      status: 'Live (W4)',
      version: 'v2.05',
      accentColor: '#f59e0b',
      IconComponent: SearchIcon,
      onClick: onOpenWebsiteManager,
      isActionable: true,
      buttonText: 'Open in W4',
      liveUrl: null,
      displayUrl: 'Not deployed',
      isDeployed: false
    },
    {
      id: 'SITE_AUDITOR',
      name: 'Site Auditor',
      description: 'Comprehensive site-wide link, layout, and structure auditor.',
      status: 'Development',
      version: 'v0.5.0-dev',
      accentColor: '#06b6d4',
      IconComponent: NetworkIcon,
      isActionable: false,
      buttonText: 'Coming Soon',
      liveUrl: null,
      displayUrl: 'Not deployed',
      isDeployed: false
    },
    {
      id: 'SOCIAL_AUTOMATION',
      name: 'Social Automation',
      description: 'Automated social media posting, scheduling, and analytics agent.',
      status: 'Live',
      version: 'v1.0.0',
      accentColor: '#ec4899',
      IconComponent: MegaphoneIcon,
      launchUrl: 'https://automation.thesearchequation.co.uk/',
      isActionable: true,
      buttonText: 'Launch',
      liveUrl: 'https://automation.thesearchequation.co.uk/',
      displayUrl: 'automation.thesearchequation.co.uk',
      isDeployed: true
    }
  ]

  return (
    <div className="apps-dashboard-container">
      {notification && (
        <div className="dashboard-notification-banner">
          {notification}
        </div>
      )}

      {/* Welcome Header */}
      <div className="dashboard-welcome-header">
        <div>
          <h1 className="dashboard-title">
            Welcome back, Mac 👋
          </h1>
          <p className="dashboard-subtitle">
            Launch and manage your marketing and auditing applications.
          </p>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="dashboard-stats-panel">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-emerald">
            <LayoutGridIcon size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Apps</span>
            <span className="stat-number">7</span>
            <span className="stat-tag text-emerald">All systems</span>
          </div>
        </div>

        <div className="stat-card stat-border-left">
          <div className="stat-icon-wrapper stat-blue">
            <RocketIcon size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Live Apps</span>
            <span className="stat-number">4</span>
            <span className="stat-tag text-blue">Ready to use</span>
          </div>
        </div>

        <div className="stat-card stat-border-left">
          <div className="stat-icon-wrapper stat-amber">
            <CodeIcon size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">In Development</span>
            <span className="stat-number">3</span>
            <span className="stat-tag text-amber">Building</span>
          </div>
        </div>

        <div className="stat-card stat-border-left">
          <div className="stat-icon-wrapper stat-purple">
            <CalendarIcon size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Platform Version</span>
            <span className="stat-number">V2.02</span>
            <span className="stat-tag text-purple">Active</span>
          </div>
        </div>
      </div>

      {/* Your Applications Header */}
      <div className="apps-section-header">
        <div>
          <h2 className="apps-section-title">
            Your Applications
          </h2>
          <p className="apps-section-subtitle">
            Access all your TSE applications from one place.
          </p>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="apps-grid">
        {applications.map((app) => {
          const isLive = app.status === 'Live' || app.status === 'Live (W4)'
          const badgeBg = isLive ? `${app.accentColor}12` : 'rgba(245, 158, 11, 0.08)'
          const badgeBorder = isLive ? `1px solid ${app.accentColor}30` : '1px solid rgba(245, 158, 11, 0.2)'
          const badgeColor = isLive ? app.accentColor : '#fbbf24'

          const handleCardClick = () => {
            if (app.launchUrl) {
              window.open(app.launchUrl, '_blank', 'noopener,noreferrer')
            } else if (app.onClick) {
              app.onClick()
            } else {
              showNotification(`${app.name} is currently in development.`)
            }
          }

          return (
            <div
              key={app.id}
              className="app-card"
              onClick={handleCardClick}
              style={{ '--app-accent': app.accentColor }}
            >
              <div className="app-card-top">
                <div className="app-card-header">
                  <div
                    className="app-icon-box"
                    style={{
                      backgroundColor: `${app.accentColor}12`,
                      borderColor: `${app.accentColor}30`,
                      color: app.accentColor
                    }}
                  >
                    <app.IconComponent size={22} />
                  </div>

                  <div className="app-title-group">
                    <div className="app-title-row">
                      <h3 className="app-name">{app.name}</h3>
                      <span
                        className="app-status-badge"
                        style={{
                          backgroundColor: badgeBg,
                          borderColor: badgeBorder,
                          color: badgeColor
                        }}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="app-description">
                  {app.description}
                </p>

                {/* URL row */}
                <div className="app-url-row">
                  <span className="app-url-label">URL</span>
                  {app.isDeployed && app.liveUrl ? (
                    <a
                      href={app.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="app-url-link"
                      onClick={(e) => e.stopPropagation()}
                      title={`Open ${app.liveUrl}`}
                    >
                      {app.displayUrl}
                    </a>
                  ) : (
                    <span className="app-url-muted">{app.displayUrl}</span>
                  )}
                </div>
              </div>

              <div className="app-card-footer">
                <span className="app-version-text">
                  {app.version}
                </span>

                <button
                  type="button"
                  className={`app-action-btn ${isLive ? 'btn-live' : 'btn-disabled'}`}
                  style={isLive ? { backgroundColor: app.accentColor, color: '#ffffff' } : {}}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCardClick()
                  }}
                >
                  {app.buttonText}
                  {app.launchUrl ? <ExternalLinkIcon size={13} /> : <ChevronRightIcon size={14} />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
