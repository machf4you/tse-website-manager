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

const LayersIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
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
    setTimeout(() => setNotification(null), 3500)
  }

  // 1. Primary Website Management Card
  const websiteManagerApp = {
    id: 'WEBSITE_MANAGEMENT',
    name: 'Website Management',
    roleTag: 'Primary Suite Application',
    description: 'Central hub for managing connected WordPress & Magento websites, keyword target phrase fits, priority rankings, and SEO audit workflows.',
    status: 'Live',
    version: 'v2.10',
    accentColor: '#10b981',
    IconComponent: GlobeIcon,
    onClick: onOpenWebsiteManager,
    isActionable: true,
    buttonText: 'Open App',
    liveUrl: 'https://tse-website-manager.thesearchequation.co.uk/',
    displayUrl: 'tse-website-manager.thesearchequation.co.uk',
    isDeployed: true
  }

  // 2. Subordinate Suite Tools (Page Auditor & Site Auditor)
  const subordinateSuiteApps = [
    {
      id: 'PAGE_AUDITOR',
      name: 'Page Auditor',
      roleTag: 'Subordinate Engine',
      description: 'Intelligent page-level SEO auditing and fitment engine. Integrated directly into Website Manager for deep single-page audit analysis.',
      status: 'Integrated',
      version: 'v2.10',
      accentColor: '#f59e0b',
      IconComponent: SearchIcon,
      onClick: () => showNotification('Page Auditor is integrated into Website Manager (W4) and executes per-page audits automatically.'),
      isActionable: true,
      buttonText: 'Used in Website Manager',
      liveUrl: null,
      displayUrl: 'Not deployed (Integrated in W4)',
      isDeployed: false
    },
    {
      id: 'SITE_AUDITOR',
      name: 'Site Auditor',
      roleTag: 'Subordinate Engine',
      description: 'Comprehensive site-wide link, layout, and internal structure auditor designed as a supporting component for Website Manager.',
      status: 'Development',
      version: 'v0.5.0-dev',
      accentColor: '#06b6d4',
      IconComponent: NetworkIcon,
      isActionable: false,
      buttonText: 'In Development',
      liveUrl: null,
      displayUrl: 'Not deployed',
      isDeployed: false
    }
  ]

  // 3. Standalone Independent Applications
  const independentSections = [
    {
      sectionTitle: 'Lead Generation',
      sectionSubtitle: 'Prospect discovery and data extraction',
      app: {
        id: 'LEAD_GENERATOR',
        name: 'Lead Generator',
        roleTag: 'Standalone Application',
        description: 'Find local businesses, extract contact details, crawl websites, and prepare candidate sites for outreach and SEO auditing.',
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
      }
    },
    {
      sectionTitle: 'Real-Time Communication',
      sectionSubtitle: 'Video meeting and live communication client',
      app: {
        id: 'CHATZA',
        name: 'Chatza',
        roleTag: 'Standalone Application',
        description: 'Real-time communication, messaging, and high-performance browser-based video collaboration client.',
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
      }
    },
    {
      sectionTitle: 'Social Media Automation',
      sectionSubtitle: 'Autonomous marketing and scheduled social publishing',
      app: {
        id: 'SOCIAL_AUTOMATION',
        name: 'Social Automation',
        roleTag: 'Standalone Application',
        description: 'Automated social media posting, multi-channel scheduling, campaign management, and engagement analytics agent.',
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
    },
    {
      sectionTitle: 'WordPress Utilities',
      sectionSubtitle: 'WordPress exporter plugin data manager and sync agent',
      app: {
        id: 'WP_EXPORTER',
        name: 'WP Exporter',
        roleTag: 'Standalone Utility',
        description: 'WordPress site exporter plugin data manager and sync agent for extracting structured page packages.',
        status: 'Coming Soon',
        version: 'v1.0.0',
        accentColor: '#8b5cf6',
        IconComponent: DownloadIcon,
        isActionable: false,
        buttonText: 'Coming Soon',
        liveUrl: null,
        displayUrl: 'Not deployed',
        isDeployed: false
      }
    }
  ]

  const renderCard = (app, isSubordinate = false, isHero = false) => {
    const isLive = app.status === 'Live' || app.status === 'Integrated'
    const badgeBg = isLive ? `${app.accentColor}14` : 'rgba(245, 158, 11, 0.08)'
    const badgeBorder = isLive ? `1px solid ${app.accentColor}35` : '1px solid rgba(245, 158, 11, 0.2)'
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
        className={`app-card ${isHero ? 'app-card-hero' : ''} ${isSubordinate ? 'app-card-subordinate' : ''}`}
        onClick={handleCardClick}
        style={{ '--app-accent': app.accentColor }}
      >
        <div className="app-card-top">
          <div className="app-card-header">
            <div
              className="app-icon-box"
              style={{
                backgroundColor: `${app.accentColor}14`,
                borderColor: `${app.accentColor}35`,
                color: app.accentColor
              }}
            >
              <app.IconComponent size={isSubordinate ? 20 : 22} />
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
              {app.roleTag && (
                <span className="app-role-tag">{app.roleTag}</span>
              )}
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
  }

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
            <LayersIcon size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Suite Structure</span>
            <span className="stat-number">1 Suite + 4 Apps</span>
            <span className="stat-tag text-amber">Hierarchical</span>
          </div>
        </div>

        <div className="stat-card stat-border-left">
          <div className="stat-icon-wrapper stat-purple">
            <CodeIcon size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Platform Version</span>
            <span className="stat-number">V2.10</span>
            <span className="stat-tag text-purple">Active</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: WEBSITE MANAGEMENT SUITE (PARENT & SUBORDINATES)    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="dashboard-suite-section">
        <div className="suite-section-header">
          <div>
            <div className="suite-badge-label">
              <span className="suite-badge-dot"></span>
              CORE PLATFORM SUITE
            </div>
            <h2 className="suite-section-title">
              Website Management Suite
            </h2>
            <p className="suite-section-subtitle">
              Central SEO management platform with integrated page fitment and site audit engines.
            </p>
          </div>
        </div>

        {/* Tree Container */}
        <div className="suite-tree-container">
          {/* Primary Parent Card */}
          <div className="suite-parent-wrapper">
            {renderCard(websiteManagerApp, false, true)}
          </div>

          {/* Visual Connector Lines */}
          <div className="suite-connector-branch" aria-hidden="true">
            <div className="connector-vertical-stem"></div>
            <div className="connector-horizontal-bar"></div>
            <div className="connector-child-stems">
              <div className="connector-stem-left"></div>
              <div className="connector-stem-right"></div>
            </div>
          </div>

          {/* Subordinate Children Grid */}
          <div className="suite-children-grid">
            {subordinateSuiteApps.map((app) => renderCard(app, true, false))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: STANDALONE INDEPENDENT APPLICATIONS (SEPARATE ROWS) */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="dashboard-independent-sections">
        <div className="independent-master-header">
          <h2 className="independent-master-title">
            Independent Applications
          </h2>
          <p className="independent-master-subtitle">
            Standalone marketing, prospect extraction, communication, and automation clients.
          </p>
        </div>

        {independentSections.map((sec, idx) => (
          <div key={sec.app.id} className="independent-row-section">
            <div className="independent-row-header">
              <h3 className="independent-row-title">{sec.sectionTitle}</h3>
              <span className="independent-row-subtitle">{sec.sectionSubtitle}</span>
            </div>
            <div className="independent-card-wrapper">
              {renderCard(sec.app, false, false)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
