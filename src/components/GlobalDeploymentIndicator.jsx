import { useState, useEffect } from 'react'
import { CURRENT_BUILD_VERSION, CURRENT_BUILD_LABEL, CURRENT_BUILD_HASH, CURRENT_BUILD_TIMESTAMP } from '../config/version'
import { API_BASE_URL } from '../services/websiteManagerApi'
import { useWebsiteManagerRealtime } from '../services/supabaseRealtime'
import './GlobalDeploymentIndicator.css'

export default function GlobalDeploymentIndicator() {
  const [deployState, setDeployState] = useState('normal') // 'normal' | 'updating' | 'update_ready'
  const [serverVersion, setServerVersion] = useState(CURRENT_BUILD_VERSION)

  useWebsiteManagerRealtime({
    onDeploymentStatusChanged: ({ deploymentStatus }) => {
      if (deploymentStatus) {
        if (deploymentStatus.isDeploymentInProgress) {
          setDeployState('updating')
        } else if (
          deploymentStatus.version && deploymentStatus.version !== CURRENT_BUILD_VERSION
        ) {
          setDeployState('update_ready')
        } else {
          setDeployState('normal')
        }
      }
    }
  })

  useEffect(() => {
    let isMounted = true

    function isServerNewer(sVer, sTimestamp) {
      if (!sVer || sVer === CURRENT_BUILD_VERSION) return false
      const sParts = String(sVer).split('.').map(n => parseInt(n, 10) || 0)
      const cParts = String(CURRENT_BUILD_VERSION).split('.').map(n => parseInt(n, 10) || 0)
      for (let i = 0; i < Math.max(sParts.length, cParts.length); i++) {
        const sNum = sParts[i] || 0
        const cNum = cParts[i] || 0
        if (sNum > cNum) return true
        if (sNum < cNum) return false
      }
      return false
    }

    async function checkDeploymentStatus() {
      try {
        let isUpdating = false
        let serverVer = CURRENT_BUILD_VERSION
        let serverTimestamp = CURRENT_BUILD_TIMESTAMP

        // 1. Primary check: Server API /api/deployment/status
        try {
          const apiRes = await fetch(`${API_BASE_URL}/deployment/status?_t=${Date.now()}`, {
            cache: 'no-store'
          })
          if (apiRes.ok) {
            const apiData = await apiRes.json()
            if (apiData.isDeploymentInProgress === true) {
              isUpdating = true
            }
            if (apiData.version) serverVer = apiData.version
            if (apiData.buildTimestamp) serverTimestamp = Number(apiData.buildTimestamp)
          }
        } catch (_e) {}

        // 2. Secondary check: /version.json static file served by web server
        try {
          const staticRes = await fetch(`/version.json?_t=${Date.now()}`, {
            cache: 'no-store',
            credentials: 'same-origin'
          })
          if (staticRes.ok) {
            const staticData = await staticRes.json()
            if (staticData.isDeploymentInProgress === true || (staticData.building && staticData.building !== staticData.version)) {
              isUpdating = true
            }
            if (staticData.version) serverVer = staticData.version
            if (staticData.buildTimestamp) serverTimestamp = Number(staticData.buildTimestamp)
          }
        } catch (_e) {}

        if (!isMounted) return

        setServerVersion(serverVer || CURRENT_BUILD_VERSION)

        if (isUpdating) {
          setDeployState('updating')
        } else if (isServerNewer(serverVer, serverTimestamp)) {
          setDeployState('update_ready')
        } else {
          setDeployState('normal')
        }
      } catch (_err) {
        // Fallback for offline / network errors
      }
    }

    checkDeploymentStatus()
    const interval = setInterval(checkDeploymentStatus, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const handleManualRefresh = () => {
    // Cache bust reload
    const url = new URL(window.location.href)
    url.searchParams.set('_v', Date.now().toString())
    window.location.href = url.toString()
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  if (deployState === 'updating') {
    return (
      <>
        <div className="global-updating-banner" role="status" aria-live="polite">
          <div className="global-update-banner-content">
            <span className="banner-message">
              <span className="deploy-spin-icon" aria-hidden="true">⏳</span>
              <strong>DEPLOYMENT IN PROGRESS:</strong> A new build is currently being deployed to Website Manager. Please wait and <em>DO NOT press Ctrl + F5 yet</em>.
            </span>
          </div>
        </div>
        <div className="global-deploy-indicator global-deploy-updating" role="status" aria-live="polite" title="Build/Deployment in progress - Do NOT refresh yet">
          <span className="deploy-spin-icon" aria-hidden="true">⏳</span>
          <span className="deploy-text-updating">V{serverVersion || CURRENT_BUILD_VERSION} | UPDATING — DO NOT PRESS CTRL+F5</span>
        </div>
      </>
    )
  }

  if (deployState === 'update_ready') {
    return (
      <button 
        type="button"
        className="global-deploy-indicator global-deploy-update-ready-btn" 
        onClick={handleManualRefresh}
        title="New version is live! Click to reload latest changes"
        id="btn-global-click-to-refresh"
      >
        <span className="deploy-ready-icon" aria-hidden="true">↻</span>
        <span className="deploy-ready-text">CLICK TO REFRESH</span>
      </button>
    )
  }

  // STATE 1: NORMAL (Idle / Up-to-Date Live Badge + Green Refresh Control)
  return (
    <div className="global-deploy-indicator global-deploy-normal">
      <span className="global-deploy-live-badge">
        <span className="deploy-live-dot">●</span> {CURRENT_BUILD_LABEL}
      </span>
      <button
        type="button"
        className="global-deploy-refresh-btn global-deploy-refresh-normal"
        onClick={handleManualRefresh}
        title="Reload application"
        id="btn-global-header-refresh"
      >
        <span className="refresh-icon" aria-hidden="true">↻</span> Refresh
      </button>
    </div>
  )
}

