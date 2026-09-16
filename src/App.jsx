import { useState, useEffect } from 'react'
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

import AppsDashboard from './pages/AppsDashboard'
import GlobalDeploymentIndicator from './components/GlobalDeploymentIndicator'
import ErrorBoundary from './components/ErrorBoundary'
import { getAuthMe, logoutUser } from './services/authApi'

const LogOutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export function parseRoute(pathname) {
  const path = (pathname || (typeof window !== 'undefined' ? window.location.pathname : '/')).toLowerCase().replace(/\/+$/, '') || '/'

  if (path === '' || path === '/') {
    return {
      currentView: 'apps-dashboard',
      activeNavTab: 'websites',
      wPage: null,
      canonicalPath: '/'
    }
  }

  if (path === '/global-settings' || path === '/settings') {
    return {
      currentView: 'website-manager',
      activeNavTab: 'global-settings',
      wPage: null,
      canonicalPath: '/global-settings'
    }
  }

  if (path === '/w1-connected-sites' || path === '/w1' || path === '/websites') {
    return {
      currentView: 'website-manager',
      activeNavTab: 'websites',
      wPage: 'w1',
      canonicalPath: '/w1-connected-sites'
    }
  }

  if (path === '/w2-website-dashboard' || path === '/w2') {
    return {
      currentView: 'website-manager',
      activeNavTab: 'websites',
      wPage: 'w2',
      canonicalPath: '/w2-website-dashboard'
    }
  }

  if (path === '/w3-page-management' || path === '/w3' || path === '/w3-manage-pages') {
    return {
      currentView: 'website-manager',
      activeNavTab: 'websites',
      wPage: 'w3',
      canonicalPath: '/w3-page-management'
    }
  }

  if (path === '/w4-audit-results' || path === '/w4' || path === '/w4-page-audit' || path === '/w3-audit-results') {
    return {
      currentView: 'website-manager',
      activeNavTab: 'websites',
      wPage: 'w4',
      canonicalPath: '/w4-audit-results'
    }
  }

  if (path === '/w5-internal-linking' || path === '/w5' || path === '/w4-internal-linking' || path === '/w5-all-internal-links' || path === '/w5-review-links') {
    return {
      currentView: 'website-manager',
      activeNavTab: 'websites',
      wPage: 'w5',
      canonicalPath: '/w5-internal-linking'
    }
  }

  // Fallback to W1
  return {
    currentView: 'website-manager',
    activeNavTab: 'websites',
    wPage: 'w1',
    canonicalPath: '/w1-connected-sites'
  }
}

function App() {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      const parsed = parseRoute(window.location.pathname)
      if (window.location.pathname !== parsed.canonicalPath) {
        window.history.replaceState(null, '', parsed.canonicalPath)
      }
      return parsed.canonicalPath
    }
    return '/'
  })

  const initialRoute = parseRoute(currentPath)
  const [currentView, setCurrentViewState] = useState(initialRoute.currentView)
  const [activeNavTab, setActiveNavTabState] = useState(initialRoute.activeNavTab)

  const navigate = (path, replace = false) => {
    const parsed = parseRoute(path)
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== parsed.canonicalPath) {
        if (replace) {
          window.history.replaceState(null, '', parsed.canonicalPath)
        } else {
          window.history.pushState(null, '', parsed.canonicalPath)
        }
      }
    }
    setCurrentPath(parsed.canonicalPath)
    setCurrentViewState(parsed.currentView)
    setActiveNavTabState(parsed.activeNavTab)
    try {
      localStorage.setItem('tse_current_view_v1', parsed.currentView)
      localStorage.setItem('tse_active_nav_tab_v1', parsed.activeNavTab)
    } catch (e) {}
  }

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRoute(window.location.pathname)
      setCurrentPath(parsed.canonicalPath)
      setCurrentViewState(parsed.currentView)
      setActiveNavTabState(parsed.activeNavTab)
      try {
        localStorage.setItem('tse_current_view_v1', parsed.currentView)
        localStorage.setItem('tse_active_nav_tab_v1', parsed.activeNavTab)
      } catch (e) {}
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const setCurrentView = (view) => {
    if (view === 'apps-dashboard') {
      navigate('/')
    } else {
      navigate('/w1-connected-sites')
    }
  }

  const setActiveNavTab = (tab) => {
    if (tab === 'global-settings') {
      navigate('/global-settings')
    } else {
      navigate('/w1-connected-sites')
    }
  }

  const [currentUser, setCurrentUser] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    let isMounted = true
    getAuthMe().then(res => {
      if (isMounted && res.authenticated && res.user) {
        setCurrentUser(res.user)
      }
    })
    return () => { isMounted = false }
  }, [])

  const rawUsername = currentUser?.username || 'Mac'
  const displayUsername = rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1)
  const isAdmin = currentUser?.role === 'admin'

  return (
    <div className="app">
      <header className="app-header" role="banner">

        {/* Left: Back to Apps (when in Website Manager) + Title */}
        <div className="header-left">
          {currentView === 'website-manager' ? (
            <>
              <button
                type="button"
                className="back-to-apps"
                aria-label="Back to Apps"
                onClick={() => navigate('/')}
                id="btn-back-to-apps"
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
            </>
          ) : (
            <div className="app-identity">
              <span className="app-name">
                <span className="app-name-accent">TSE</span> Apps Platform
              </span>
            </div>
          )}
        </div>

        {/* Centre: Navigation tabs (when in Website Manager) */}
        <nav className="header-nav" aria-label="Primary navigation">
          {currentView === 'website-manager' && (
            <>
              <button
                type="button"
                className={`nav-tab ${activeNavTab === 'websites' ? 'active' : ''}`}
                aria-current={activeNavTab === 'websites' ? 'page' : undefined}
                id="nav-tab-websites"
                onClick={() => {
                  if (['/w1-connected-sites', '/w2-website-dashboard', '/w3-page-management', '/w4-audit-results', '/w5-internal-linking'].includes(currentPath)) {
                    navigate(currentPath)
                  } else {
                    navigate('/w1-connected-sites')
                  }
                }}
              >
                <GlobeIcon />
                Websites
              </button>
              <button
                type="button"
                className={`nav-tab ${activeNavTab === 'global-settings' ? 'active' : ''}`}
                aria-current={activeNavTab === 'global-settings' ? 'page' : undefined}
                id="nav-tab-global-settings"
                onClick={() => navigate('/global-settings')}
              >
                <SlidersIcon />
                Global Settings
              </button>
            </>
          )}
        </nav>

        {/* Right: Global Deployment + Account / Logout Menu */}
        <div className="header-right" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.875rem' }}>
          <GlobalDeploymentIndicator />

          {/* Account Dropdown */}
          <div className="account-dropdown-wrapper">
            <button
              type="button"
              className="account-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              id="btn-account-menu"
              aria-label="User Account Menu"
              aria-expanded={showUserMenu}
            >
              <div className="account-avatar">
                {rawUsername.charAt(0).toUpperCase()}
              </div>
              <span className="account-name">
                {displayUsername}
              </span>
              <ChevronDownIcon />
            </button>

            {showUserMenu && (
              <>
                <div className="account-backdrop" onClick={() => setShowUserMenu(false)} />
                <div className="account-menu-dropdown">
                  <div className="account-menu-header">
                    <div className="account-menu-username">{displayUsername}</div>
                    <div className="account-menu-email">{currentUser?.email || 'Authenticated User'}</div>
                    <span className={`account-role-pill ${isAdmin ? 'pill-admin' : 'pill-staff'}`}>
                      {isAdmin ? 'Admin' : 'Staff'}
                    </span>
                  </div>
                  <div className="account-menu-divider" />
                  <button
                    type="button"
                    className="account-menu-item item-logout"
                    onClick={() => {
                      setShowUserMenu(false)
                      logoutUser()
                    }}
                    id="btn-logout"
                  >
                    <LogOutIcon />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </header>

      <main
        className="app-content"
        id="main-content"
        role="main"
        aria-label="Main content"
      >
        <ErrorBoundary>
          {currentView === 'apps-dashboard' && (
            <AppsDashboard
              currentUser={currentUser}
              onOpenWebsiteManager={() => navigate('/w1-connected-sites')}
            />
          )}
          {currentView === 'website-manager' && activeNavTab === 'websites' && (
            <WebsitesDashboard currentPath={currentPath} navigate={navigate} />
          )}
          {currentView === 'website-manager' && activeNavTab === 'global-settings' && (
            <GlobalSettings currentUser={currentUser} currentPath={currentPath} navigate={navigate} />
          )}
        </ErrorBoundary>
      </main>
    </div>
  )
}

export default App
