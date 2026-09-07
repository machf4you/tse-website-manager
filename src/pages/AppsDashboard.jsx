import React, { useState, useEffect } from 'react'
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

const ActivityIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

const EditIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const HistoryIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const STATUS_CONFIG = {
  'PLANNING': { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)' },
  'DEVELOPMENT': { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)' },
  'TESTING': { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)' },
  'BLOCKED': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)' },
  'AWAITING ANKIT': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)' },
  'READY TO DEPLOY': { color: '#059669', bg: 'rgba(5, 150, 105, 0.15)', border: '1px solid rgba(5, 150, 105, 0.35)' },
  'LIVE': { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)' },
  'MAINTENANCE': { color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', border: '1px solid rgba(100, 116, 139, 0.3)' }
}

export default function AppsDashboard({ onOpenWebsiteManager }) {
  const [activeSubTab, setActiveSubTab] = useState('launchpad') // 'launchpad' | 'app-progress'
  const [notification, setNotification] = useState(null)
  
  // App Progress Data
  const [appProgressList, setAppProgressList] = useState([])
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)
  const [editingApp, setEditingApp] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [isSavingProgress, setIsSavingProgress] = useState(false)
  
  // History Modal Data
  const [historyApp, setHistoryApp] = useState(null)
  const [historyRecords, setHistoryRecords] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3500)
  }

  const fetchAppProgress = async () => {
    setIsLoadingProgress(true)
    try {
      const res = await fetch('/api/app-progress')
      const data = await res.json()
      if (data.status === 'ok') {
        setAppProgressList(data.apps || [])
      }
    } catch (e) {
      console.error('Failed to load app progress:', e)
    } finally {
      setIsLoadingProgress(false)
    }
  }

  useEffect(() => {
    fetchAppProgress()
  }, [])

  const handleOpenEditModal = (app) => {
    setEditingApp(app)
    setEditFormData({
      status: app.status || 'DEVELOPMENT',
      version: app.version || '',
      completed_summary: app.completed_summary || '',
      current_work: app.current_work || '',
      next_action: app.next_action || '',
      blocked_by: app.blocked_by || '',
      deployment_status: app.deployment_status || '',
      notes: app.notes || '',
      live_url: app.live_url || '',
      repo_ref: app.repo_ref || ''
    })
  }

  const handleSaveProgress = async (e) => {
    e.preventDefault()
    if (!editingApp) return
    setIsSavingProgress(true)

    try {
      const res = await fetch(`/api/app-progress/${editingApp.app_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })
      const data = await res.json()
      if (data.status === 'ok') {
        showNotification(`Saved status record for ${editingApp.name}`)
        setEditingApp(null)
        await fetchAppProgress()
      } else {
        alert('Failed to save progress: ' + (data.error || 'Unknown error'))
      }
    } catch (e) {
      console.error(e)
      alert('Error saving progress: ' + e.message)
    } finally {
      setIsSavingProgress(false)
    }
  }

  const handleOpenHistoryModal = async (app) => {
    setHistoryApp(app)
    setHistoryRecords([])
    setIsLoadingHistory(true)
    try {
      const res = await fetch(`/api/app-progress/${app.app_id}/history`)
      const data = await res.json()
      if (data.status === 'ok') {
        setHistoryRecords(data.history || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Launchpad Cards
  const websiteManagerApp = {
    id: 'WEBSITE_MANAGEMENT',
    name: 'Website Management',
    roleTag: 'Primary Suite Application',
    description: 'Central hub for managing connected WordPress & Magento websites, keyword target phrase fits, priority rankings, and SEO audit workflows.',
    status: 'Live',
    version: 'v2.11',
    accentColor: '#10b981',
    IconComponent: GlobeIcon,
    onClick: onOpenWebsiteManager,
    isActionable: true,
    buttonText: 'Launch',
    liveUrl: 'https://tse-website-manager.thesearchequation.co.uk/',
    displayUrl: 'tse-website-manager.thesearchequation.co.uk',
    isDeployed: true
  }

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
      name: 'TSE Site Analyzer',
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

  const independentSections = [
    {
      sectionTitle: 'Lead Generation',
      sectionSubtitle: 'Prospect discovery and data extraction',
      app: {
        id: 'LEAD_GENERATOR',
        name: 'Lead Generator V2',
        roleTag: 'Standalone Application',
        description: 'Find local businesses, extract contact details, crawl websites, and prepare candidate sites for outreach and SEO auditing.',
        status: 'Live',
        version: 'v1.2-pre-auto-deployment',
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
        id: 'SITE_REGISTRY',
        name: 'TSE Site Registry',
        roleTag: 'Standalone Utility',
        description: 'WordPress exporter plugin data manager and sync agent for extracting structured page packages.',
        status: 'Live',
        version: 'v1.0.0',
        accentColor: '#8b5cf6',
        IconComponent: DownloadIcon,
        isActionable: true,
        buttonText: 'Launch',
        liveUrl: 'https://api-website-manager.thesearchequation.co.uk/',
        displayUrl: 'api-website-manager.thesearchequation.co.uk',
        isDeployed: true
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

  const renderStatusBadge = (statusStr) => {
    const cfg = STATUS_CONFIG[statusStr] || STATUS_CONFIG['DEVELOPMENT']
    return (
      <span
        className="progress-status-badge"
        style={{
          backgroundColor: cfg.bg,
          border: cfg.border,
          color: cfg.color
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.color }}></span>
        {statusStr}
      </span>
    )
  }

  return (
    <div className="apps-dashboard-container">
      {notification && (
        <div className="dashboard-notification-banner">
          {notification}
        </div>
      )}

      {/* Welcome Header & Navigation Subtabs */}
      <div className="dashboard-welcome-header">
        <div>
          <h1 className="dashboard-title">
            Welcome back, Mac 👋
          </h1>
          <p className="dashboard-subtitle">
            {activeSubTab === 'launchpad'
              ? 'Launch and manage your marketing and auditing applications.'
              : 'Central application status, progress milestones, and blocker tracking board.'}
          </p>
        </div>

        {/* Subtab Toggle Buttons */}
        <div className="dashboard-subtab-toggles">
          <button
            type="button"
            className={`subtab-btn ${activeSubTab === 'launchpad' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('launchpad')}
          >
            <LayoutGridIcon size={16} />
            Launchpad
          </button>
          <button
            type="button"
            className={`subtab-btn ${activeSubTab === 'app-progress' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('app-progress')}
          >
            <ActivityIcon size={16} />
            App Progress
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: APPLICATIONS LAUNCHPAD                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'launchpad' && (
        <>
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
                <span className="stat-number">5</span>
                <span className="stat-tag text-blue">Ready to use</span>
              </div>
            </div>

            <div className="stat-card stat-border-left">
              <div className="stat-icon-wrapper stat-amber">
                <LayersIcon size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Suite Structure</span>
                <span className="stat-number">1 Suite + 5 Apps</span>
                <span className="stat-tag text-amber">Hierarchical</span>
              </div>
            </div>

            <div className="stat-card stat-border-left">
              <div className="stat-icon-wrapper stat-purple">
                <CodeIcon size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Platform Version</span>
                <span className="stat-number">V2.11</span>
                <span className="stat-tag text-purple">Active</span>
              </div>
            </div>
          </div>

          {/* Section 1: Suite */}
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

            <div className="suite-tree-container">
              <div className="suite-parent-wrapper">
                {renderCard(websiteManagerApp, false, true)}
              </div>

              <div className="suite-connector-branch" aria-hidden="true">
                <div className="connector-vertical-stem"></div>
                <div className="connector-horizontal-bar"></div>
                <div className="connector-child-stems">
                  <div className="connector-stem-left"></div>
                  <div className="connector-stem-right"></div>
                </div>
              </div>

              <div className="suite-children-grid">
                {subordinateSuiteApps.map((app) => renderCard(app, true, false))}
              </div>
            </div>
          </div>

          {/* Section 2: Independent Apps */}
          <div className="dashboard-independent-sections">
            <div className="independent-master-header">
              <h2 className="independent-master-title">
                Independent Applications
              </h2>
              <p className="independent-master-subtitle">
                Standalone marketing, prospect extraction, communication, and automation clients.
              </p>
            </div>

            {independentSections.map((sec) => (
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
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: APP PROGRESS BOARD                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'app-progress' && (
        <div className="app-progress-board">
          {isLoadingProgress ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              Loading App Progress status records...
            </div>
          ) : (
            <div className="progress-cards-grid">
              {appProgressList.map((app) => (
                <div key={app.app_id} className="progress-card">
                  {/* Card Header */}
                  <div className="progress-card-header">
                    <div className="progress-app-info">
                      <h3 className="progress-app-name">{app.name}</h3>
                      <span className="progress-app-repo">{app.repo_ref || 'No repo'}</span>
                    </div>
                    <div>
                      {renderStatusBadge(app.status)}
                    </div>
                  </div>

                  {/* 3-Column Field Grid */}
                  <div className="progress-grid-fields">
                    <div className="progress-field-block">
                      <span className="field-label">Current Version / Restore Point</span>
                      <div className="field-value field-value-highlight">
                        {app.version || 'Not Recorded'}
                      </div>
                    </div>

                    <div className="progress-field-block">
                      <span className="field-label">Current Work</span>
                      <div className="field-value">
                        {app.current_work || 'Not Recorded'}
                      </div>
                    </div>

                    <div className="progress-field-block">
                      <span className="field-label">Next Action</span>
                      <div className="field-value">
                        {app.next_action || 'Not Recorded'}
                      </div>
                    </div>

                    <div className="progress-field-block">
                      <span className="field-label">Completed / What Works</span>
                      <div className="field-value">
                        {app.completed_summary || 'Not Recorded'}
                      </div>
                    </div>

                    <div className="progress-field-block">
                      <span className="field-label">Blocked By</span>
                      <div className={`field-value ${app.blocked_by ? 'field-value-blocker' : ''}`}>
                        {app.blocked_by || 'None'}
                      </div>
                    </div>

                    <div className="progress-field-block">
                      <span className="field-label">Deployment Status</span>
                      <div className="field-value">
                        {app.deployment_status || 'Not Recorded'}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="progress-card-actions">
                    <span className="updated-time-text">
                      Last Updated: {app.updated_at ? new Date(app.updated_at).toLocaleString() : 'Never'}
                    </span>
                    <div className="action-btns-group">
                      <button
                        type="button"
                        className="btn-secondary-action"
                        onClick={() => handleOpenHistoryModal(app)}
                      >
                        <HistoryIcon size={14} />
                        View History
                      </button>
                      <button
                        type="button"
                        className="btn-primary-edit"
                        onClick={() => handleOpenEditModal(app)}
                      >
                        <EditIcon size={14} />
                        Edit Progress
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* EDIT PROGRESS MODAL                                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {editingApp && (
        <div className="progress-modal-backdrop" onClick={() => setEditingApp(null)}>
          <div className="progress-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="progress-modal-header">
              <h2 className="progress-modal-title">
                Edit Progress — {editingApp.name}
              </h2>
              <button
                type="button"
                className="btn-close-icon"
                onClick={() => setEditingApp(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProgress}>
              <div className="progress-modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Current Status</label>
                    <select
                      className="form-select"
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    >
                      {Object.keys(STATUS_CONFIG).map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Current Version / Restore Point</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.version}
                      onChange={(e) => setEditFormData({ ...editFormData, version: e.target.value })}
                      placeholder="e.g. v1.2-pre-auto-deployment"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Current Work</label>
                  <textarea
                    className="form-textarea"
                    value={editFormData.current_work}
                    onChange={(e) => setEditFormData({ ...editFormData, current_work: e.target.value })}
                    placeholder="What is currently being worked on..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Next Action</label>
                  <textarea
                    className="form-textarea"
                    value={editFormData.next_action}
                    onChange={(e) => setEditFormData({ ...editFormData, next_action: e.target.value })}
                    placeholder="Next immediate step or priority..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Completed / What Works</label>
                  <textarea
                    className="form-textarea"
                    value={editFormData.completed_summary}
                    onChange={(e) => setEditFormData({ ...editFormData, completed_summary: e.target.value })}
                    placeholder="Summary of completed features and capabilities..."
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Blocked By</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.blocked_by}
                      onChange={(e) => setEditFormData({ ...editFormData, blocked_by: e.target.value })}
                      placeholder="Blocker details or leave blank if unblocked"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Deployment Status</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.deployment_status}
                      onChange={(e) => setEditFormData({ ...editFormData, deployment_status: e.target.value })}
                      placeholder="e.g. Deployed (Port 3005)"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Live URL</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.live_url}
                      onChange={(e) => setEditFormData({ ...editFormData, live_url: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Repository</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.repo_ref}
                      onChange={(e) => setEditFormData({ ...editFormData, repo_ref: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-textarea"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    placeholder="Additional context or notes..."
                  />
                </div>
              </div>

              <div className="progress-modal-footer">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setEditingApp(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-edit"
                  disabled={isSavingProgress}
                >
                  {isSavingProgress ? 'Saving...' : 'Save Progress Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* HISTORY / TIMELINE MODAL                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {historyApp && (
        <div className="progress-modal-backdrop" onClick={() => setHistoryApp(null)}>
          <div className="progress-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="progress-modal-header">
              <h2 className="progress-modal-title">
                Progress History — {historyApp.name}
              </h2>
              <button
                type="button"
                className="btn-close-icon"
                onClick={() => setHistoryApp(null)}
              >
                ✕
              </button>
            </div>

            <div className="progress-modal-body">
              {isLoadingHistory ? (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>Loading timeline history...</div>
              ) : historyRecords.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>No historical snapshots recorded yet.</div>
              ) : (
                <div className="history-timeline-list">
                  {historyRecords.map((item) => {
                    let snap = {}
                    try { snap = JSON.parse(item.snapshot_json) } catch (e) {}
                    return (
                      <div key={item.id} className="history-item-card">
                        <div className="history-item-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {renderStatusBadge(item.status)}
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#60a5fa' }}>
                              {item.version || 'No version'}
                            </span>
                          </div>
                          <span className="history-timestamp">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', color: '#cbd5e1' }}>
                          {snap.current_work && <div><strong>Work:</strong> {snap.current_work}</div>}
                          {snap.next_action && <div><strong>Next:</strong> {snap.next_action}</div>}
                          {snap.blocked_by && <div style={{ color: '#f87171' }}><strong>Blocked:</strong> {snap.blocked_by}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="progress-modal-footer">
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => setHistoryApp(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
