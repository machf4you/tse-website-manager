import { useState } from 'react'
import RestorePointsPage from './RestorePointsPage'
import WordPressImportRulesPage from './WordPressImportRulesPage'
import './GlobalSettings.css'

const SETTINGS_MENU = [
  { id: 'restore-points', label: 'Restore Points',        icon: 'history' },
  { id: 'import-rules',   label: 'WordPress Import Rules',icon: 'download' },
  { id: 'general',        label: 'General',               icon: 'settings', disabled: true },
  { id: 'api-keys',       label: 'API Credentials',       icon: 'key',      disabled: true },
  { id: 'defaults',       label: 'Defaults',              icon: 'sliders',  disabled: true },
]

export default function GlobalSettings() {
  const [activeTab, setActiveTab] = useState('restore-points')

  return (
    <div className="global-settings-layout">

      {/* Settings Sub-Sidebar */}
      <aside className="gs-sidebar" aria-label="Global Settings navigation">
        <div className="gs-sidebar-title">Global Settings</div>
        <nav className="gs-menu">
          {SETTINGS_MENU.map((item) => (
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
        {activeTab === 'restore-points' && <RestorePointsPage />}
        {activeTab === 'import-rules'   && <WordPressImportRulesPage />}
      </main>

    </div>
  )
}
