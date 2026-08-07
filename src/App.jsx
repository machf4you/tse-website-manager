import { useState } from 'react'
import './App.css'
import WebsitesDashboard from './pages/WebsitesDashboard'
import GlobalSettings from './pages/GlobalSettings'

const ArrowLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
)

const GlobeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
)

const SlidersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="4" x2="4" y1="21" y2="14" />
    <line x1="4" x2="4" y1="10" y2="3" />
    <line x1="12" x2="12" y1="21" y2="12" />
    <line x1="12" x2="12" y1="8" y2="3" />
    <line x1="20" x2="20" y1="21" y2="16" />
    <line x1="20" x2="20" y1="12" y2="3" />
    <line x1="2" x2="6" y1="14" y2="14" />
    <line x1="10" x2="14" y1="8" y2="8" />
    <line x1="18" x2="22" y1="16" y2="16" />
  </svg>
)

function App() {
  const [activeNavTab, setActiveNavTab] = useState('websites')

  return (
    <div className="app">
      <header className="app-header" role="banner">

        {/* Left: Back to Apps + Title */}
        <div className="header-left">
          <button
            type="button"
            className="back-to-apps"
            aria-label="Back to Apps"
          >
            <ArrowLeftIcon />
            <span className="back-label">Back to Apps</span>
          </button>

          <div className="header-divider" aria-hidden="true" />

          <div className="app-identity">
            <span className="app-name">
              <span className="app-name-accent">TSE</span> Website Management
            </span>
          </div>
        </div>

        {/* Centre: Navigation tabs */}
        <nav className="header-nav" aria-label="Primary navigation">
          <button
            type="button"
            className={`nav-tab ${activeNavTab === 'websites' ? 'active' : ''}`}
            aria-current={activeNavTab === 'websites' ? 'page' : undefined}
            id="nav-tab-websites"
            onClick={() => setActiveNavTab('websites')}
          >
            <GlobeIcon />
            Websites
          </button>
          <button
            type="button"
            className={`nav-tab ${activeNavTab === 'global-settings' ? 'active' : ''}`}
            aria-current={activeNavTab === 'global-settings' ? 'page' : undefined}
            id="nav-tab-global-settings"
            onClick={() => setActiveNavTab('global-settings')}
          >
            <SlidersIcon />
            Global Settings
          </button>
        </nav>

        {/* Right: empty spacer — keeps nav centred */}
        <div className="header-right" aria-hidden="true" />

      </header>

      <main
        className="app-content"
        id="main-content"
        role="main"
        aria-label="Main content"
      >
        {activeNavTab === 'websites' && <WebsitesDashboard />}
        {activeNavTab === 'global-settings' && <GlobalSettings />}
      </main>
    </div>
  )
}

export default App
