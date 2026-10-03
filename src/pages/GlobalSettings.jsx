import { useState, useEffect } from 'react'
import RestorePointsPage from './RestorePointsPage'
import DeploymentRecoveryPage from './DeploymentRecoveryPage'
import AppIntegrationsPage from './AppIntegrationsPage'
import UsersAccessPage from './UsersAccessPage'
import UrlExclusionsPage from './UrlExclusionsPage'
import WordPressImportRulesPage from './WordPressImportRulesPage'
import PageTypeClassificationsPage from './PageTypeClassificationsPage'
import InternalLinkingRulesPage from './InternalLinkingRulesPage'
import PageAuditorRulesPage from './PageAuditorRulesPage'
import ReferenceArchivePage from './ReferenceArchivePage'
import './GlobalSettings.css'

const SETTINGS_SECTIONS = [
  {
    sectionTitle: null,
    items: [
      { id: 'restore-points',            label: 'Restore Points',            icon: 'history' },
      { id: 'deployment-recovery',       label: 'Deployment & Recovery',     icon: 'shield' },
      { id: 'app-integrations',          label: 'App Integrations',          icon: 'layers' },
      { id: 'users-access',              label: 'Users & Access',            icon: 'users',    adminOnly: true },
      { id: 'url-exclusions',            label: 'URL Exclusions',            icon: 'slash' },
      { id: 'import-rules',              label: 'WordPress Import Rules',    icon: 'download' },
      { id: 'page-type-classifications', label: 'Page Type Classifications', icon: 'tag' },
      { id: 'internal-linking-rules',    label: 'Internal Linking Rules',    icon: 'link' },
      { id: 'page-auditor-rules',        label: 'Page Auditor Rules',        icon: 'file-text' },
      { id: 'general',                   label: 'General',                   icon: 'settings', disabled: true },
      { id: 'api-keys',                  label: 'API Credentials',           icon: 'key',      disabled: true },
      { id: 'defaults',                  label: 'Defaults',                  icon: 'sliders',  disabled: true },
    ]
  },
  {
    sectionTitle: 'REFERENCE ARCHIVE',
    sectionIcon: '📚',
    items: [
      { id: 'ref-fb-ig-connection', label: 'FB + IG Connection', icon: 'book' }
    ]
  }
]

export default function GlobalSettings({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin'
  const allItems = SETTINGS_SECTIONS.flatMap(s => s.items)
  const visibleItems = allItems.filter(item => !item.adminOnly || isAdmin)

  const [activeTab, setActiveTab] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const tabParam = urlParams.get('tab')
        if (tabParam && visibleItems.some(m => m.id === tabParam && !m.disabled)) {
          return tabParam
        }
        if (window.location.pathname.includes('app-integrations')) {
          return 'app-integrations'
        }
      }
      const saved = localStorage.getItem('tse_global_settings_tab_v1')
      if (saved && visibleItems.some(m => m.id === saved && !m.disabled)) {
        return saved
      }
    } catch (e) {
      // ignore
    }
    return 'restore-points'
  })

  // Fallback to restore-points if non-admin somehow has users-access active
  useEffect(() => {
    if (activeTab === 'users-access' && !isAdmin) {
      setActiveTab('restore-points')
    }
  }, [isAdmin, activeTab])

  useEffect(() => {
    try {
      localStorage.setItem('tse_global_settings_tab_v1', activeTab)
    } catch (e) {
      // ignore
    }
  }, [activeTab])

  return (
    <div className="global-settings-layout">

      {/* Settings Sub-Sidebar */}
      <aside className="gs-sidebar" aria-label="Global Settings navigation">
        <div className="gs-sidebar-title">Global Settings</div>
        <nav className="gs-menu">
          {SETTINGS_SECTIONS.map((section, idx) => {
            const sectionVisibleItems = section.items.filter(item => !item.adminOnly || isAdmin)
            if (sectionVisibleItems.length === 0) return null

            return (
              <div key={section.sectionTitle || `section-${idx}`} className="gs-section-group">
                {section.sectionTitle && (
                  <div className="gs-section-title">
                    {section.sectionIcon && <span>{section.sectionIcon}</span>}
                    <span>{section.sectionTitle}</span>
                  </div>
                )}
                {sectionVisibleItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`gs-menu-item ${activeTab === item.id ? 'gs-menu-item-active' : ''} ${item.disabled ? 'gs-menu-item-disabled' : ''}`}
                    onClick={() => {
                      if (!item.disabled) setActiveTab(item.id)
                    }}
                    disabled={item.disabled}
                    id={`gs-menu-${item.id}`}
                  >
                    {item.label}
                    {item.disabled && <span className="gs-badge-soon">Soon</span>}
                  </button>
                ))}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Main Settings Content */}
      <main className="gs-content">
        {activeTab === 'restore-points'            && <RestorePointsPage />}
        {activeTab === 'deployment-recovery'       && <DeploymentRecoveryPage />}
        {activeTab === 'app-integrations'          && <AppIntegrationsPage />}
        {activeTab === 'users-access'              && isAdmin && <UsersAccessPage currentUser={currentUser} />}
        {activeTab === 'url-exclusions'            && <UrlExclusionsPage />}
        {activeTab === 'import-rules'              && <WordPressImportRulesPage />}
        {activeTab === 'page-type-classifications' && <PageTypeClassificationsPage />}
        {activeTab === 'internal-linking-rules'    && <InternalLinkingRulesPage />}
        {activeTab === 'page-auditor-rules'        && <PageAuditorRulesPage />}
        {activeTab.startsWith('ref-')              && (
          <ReferenceArchivePage
            activeGuideId={activeTab.replace('ref-', '')}
            onSelectGuide={(guideId) => setActiveTab(`ref-${guideId}`)}
          />
        )}
      </main>

    </div>
  )
}
