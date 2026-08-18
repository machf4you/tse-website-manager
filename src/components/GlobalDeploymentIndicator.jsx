import { useState, useEffect } from 'react'
import { CURRENT_BUILD_VERSION, CURRENT_BUILD_LABEL, CURRENT_BUILD_HASH, CURRENT_BUILD_TIMESTAMP } from '../config/version'
import { API_BASE_URL } from '../services/websiteManagerApi'
import './GlobalDeploymentIndicator.css'

export default function GlobalDeploymentIndicator() {
  const [deployState, setDeployState] = useState('normal') // 'normal' | 'updating' | 'update_ready'
  const [serverVersion, setServerVersion] = useState(CURRENT_BUILD_VERSION)

  useEffect(() => {
    let isMounted = true

    async function checkDeploymentStatus() {
      try {
        let isUpdating = false
        let serverHash = CURRENT_BUILD_HASH
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
            if (apiData.buildHash) serverHash = apiData.buildHash
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
            if (staticData.buildHash) serverHash = staticData.buildHash
            if (staticData.buildTimestamp) serverTimestamp = Number(staticData.buildTimestamp)
          }
        } catch (_e) {}

        if (!isMounted) return

        setServerVersion(serverVer || CURRENT_BUILD_VERSION)

        if (isUpdating) {
          // STATE 2: UPDATING -> Explicit DO NOT PRESS CTRL+F5
          setDeployState('updating')
        } else if (
          (serverHash && serverHash !== CURRENT_BUILD_HASH) ||
          (serverTimestamp && serverTimestamp > CURRENT_BUILD_TIMESTAMP) ||
          (serverVer && serverVer !== CURRENT_BUILD_VERSION)
        ) {
          // STATE 3: UPDATE READY -> Explicit PRESS CTRL+F5 - UPDATE READY
          setDeployState('update_ready')
        } else {
          // STATE 1: NORMAL -> Current loaded frontend matches live server
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
    window.location.reload(true)
  }

  if (deployState === 'updating') {
    return (
      <div className="global-deploy-indicator global-deploy-updating" role="status" aria-live="polite" title="Build/Deployment in progress - Do NOT refresh yet">
        <span className="deploy-spin-icon" aria-hidden="true">⏳</span>
        <span className="deploy-text-updating">V1.30 | UPDATING — DO NOT PRESS CTRL+F5</span>
      </div>
    )
  }

  if (deployState === 'update_ready') {
    return (
      <div 
        className="global-deploy-indicator global-deploy-ready" 
        role="button" 
        tabIndex={0}
        onClick={handleManualRefresh}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleManualRefresh()}
        title="New deployment is live! Click or press Ctrl+F5 to reload"
      >
        <span className="deploy-ready-pulse-dot" aria-hidden="true">⚡</span>
        <span className="deploy-text-ready">V1.30 | PRESS CTRL+F5 — UPDATE READY</span>
        <span className="deploy-action-badge">Refresh Now</span>
      </div>
    )
  }

  // STATE 1: NORMAL (Idle / Up-to-Date Live Badge)
  return (
    <div className="global-deploy-indicator global-deploy-normal">
      <span className="global-deploy-live-badge">
        <span className="deploy-live-dot">●</span> {CURRENT_BUILD_LABEL}
      </span>
    </div>
  )
}
