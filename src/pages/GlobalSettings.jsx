import { useState, useEffect } from 'react'
import RestorePointsPage from './RestorePointsPage'
import WordPressImportRulesPage from './WordPressImportRulesPage'
import PageTypeClassificationsPage from './PageTypeClassificationsPage'
import PageAuditorRulesPage from './PageAuditorRulesPage'
import InternalLinkingRulesPage from './InternalLinkingRulesPage'
import DeploymentRecoveryPage from './DeploymentRecoveryPage'
import UsersAccessPage from './UsersAccessPage'
import './GlobalSettings.css'

const SETTINGS_MENU = [
  { id: 'restore-points',            label: 'Restore Points',            icon: 'history' },
  { id: 'deployment-recovery',       label: 'Deployment & Recovery',     icon: 'shield' },
  { id: 'users-access',              label: 'Users & Access',            icon: 'users',    adminOnly: true },
  { id: 'import-rules',              label: 'WordPress Import Rules',    icon: 'download' },
  { id: 'page-type-classifications', label: 'Page Type Classifications', icon: 'tag' },
  { id: 'internal-linking-rules',    label: 'Internal Linking Rules',    icon: 'link' },
  { id: 'page-auditor-rules',        label: 'Page Auditor Rules',        icon: 'file-text' },
  { id: 'general',                   label: 'General',                   icon: 'settings', disabled: true },
  { id: 'api-keys',                  label: 'API Credentials',           icon: 'key',      disabled: true },
  { id: 'defaults',                  label: 'Defaults',                  icon: 'sliders',  disabled: true },
]

export default function GlobalSettings({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin'
  const visibleMenu = SETTINGS_MENU.filter(item => !item.adminOnly || isAdmin)

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('tse_global_settings_tab_v1')
      if (saved && visibleMenu.some(m => m.id === saved && !m.disabled)) {
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
          {visibleMenu.map((item) => (
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
        </nav>
      </aside>

      {/* Main Settings Content */}
      <main className="gs-content">
        {activeTab === 'restore-points'            && <RestorePointsPage />}
        {activeTab === 'deployment-recovery'       && <DeploymentRecoveryPage />}
        {activeTab === 'users-access'              && isAdmin && <UsersAccessPage currentUser={currentUser} />}
        {activeTab === 'import-rules'              && <WordPressImportRulesPage />}
        {activeTab === 'page-type-classifications' && <PageTypeClassificationsPage />}
        {activeTab === 'internal-linking-rules'    && <InternalLinkingRulesPage />}
        {activeTab === 'page-auditor-rules'        && <PageAuditorRulesPage />}
      </main>

    </div>
  )
}
