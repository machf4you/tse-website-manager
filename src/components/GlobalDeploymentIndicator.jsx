import { useState, useEffect } from 'react'
import { CURRENT_BUILD_VERSION, CURRENT_BUILD_LABEL, CURRENT_BUILD_HASH, CURRENT_BUILD_TIMESTAMP } from '../config/version'
import { API_BASE_URL } from '../services/websiteManagerApi'
import { useWebsiteManagerRealtime } from '../services/supabaseRealtime'
import './GlobalDeploymentIndicator.css'

export function isServerNewer(sVer, sTimestamp, sHash) {
  if (!sVer && !sTimestamp && !sHash) return false

  // 1. Compare semantic/dot versions numerically (e.g. "2.42" vs "2.41")
  if (sVer && CURRENT_BUILD_VERSION) {
    const sParts = String(sVer).split('.').map(n => parseInt(n, 10) || 0)
    const cParts = String(CURRENT_BUILD_VERSION).split('.').map(n => parseInt(n, 10) || 0)
    const maxLen = Math.max(sParts.length, cParts.length)
    for (let i = 0; i < maxLen; i++) {
      const sNum = sParts[i] || 0
      const cNum = cParts[i] || 0
      if (sNum > cNum) return true // Server has higher version number
      if (sNum < cNum) return false // Client has higher version number
    }
  }

  // 2. If version numbers are identical, check build timestamp if available
  if (sTimestamp && CURRENT_BUILD_TIMESTAMP) {
    const sTime = Number(sTimestamp)
    const cTime = Number(CURRENT_BUILD_TIMESTAMP)
    if (!isNaN(sTime) && !isNaN(cTime)) {
      if (sTime > cTime) return true
      if (sTime < cTime) return false
    }
  }

  // 3. If hash differs and is present
  if (sHash && CURRENT_BUILD_HASH && sHash !== CURRENT_BUILD_HASH) {
    return true
  }

  return false
}

export default function GlobalDeploymentIndicator() {
  const [deployState, setDeployState] = useState('normal') // 'normal' | 'updating' | 'update_ready'

  useWebsiteManagerRealtime({
    onDeploymentStatusChanged: ({ deploymentStatus }) => {
      if (deploymentStatus) {
        if (deploymentStatus.isDeploymentInProgress) {
          setDeployState('updating')
        } else if (
          isServerNewer(deploymentStatus.version, deploymentStatus.buildTimestamp, deploymentStatus.buildHash)
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

    async function checkDeploymentStatus() {
      try {
        let isUpdating = false
        let serverVer = CURRENT_BUILD_VERSION
        let serverTimestamp = CURRENT_BUILD_TIMESTAMP
        let serverHash = CURRENT_BUILD_HASH

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
            if (apiData.buildHash) serverHash = apiData.buildHash
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
            if (staticData.buildHash) serverHash = staticData.buildHash
          }
        } catch (_e) {}

        if (!isMounted) return

        if (isUpdating) {
          setDeployState('updating')
        } else if (isServerNewer(serverVer, serverTimestamp, serverHash)) {
          setDeployState('update_ready')
        } else {
          setDeployState('normal')
        }
      } catch (_err) {}
    }

    checkDeploymentStatus()
    const interval = setInterval(checkDeploymentStatus, 2500)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const handleManualRefresh = async () => {
    try {
      if ('caches' in window) {
        try {
          const cacheKeys = await caches.keys()
          await Promise.all(cacheKeys.map(k => caches.delete(k)))
        } catch (_e) {}
      }
      const url = new URL(window.location.href)
      url.searchParams.set('_t', Date.now().toString())
      window.location.href = url.toString()
    } catch (_e) {
      window.location.reload()
    }
  }

  return (
    <>
      {/* 1. Full-Width Updating Banner (Deployment in progress) */}
      {deployState === 'updating' && (
        <div className="global-updating-banner" role="status" aria-live="polite">
          <div className="global-update-banner-content">
            <span className="banner-message">
              <span className="deploy-spin-icon" aria-hidden="true">⏳</span>
              <strong>DEPLOYMENT IN PROGRESS:</strong> A new build is currently being deployed to Website Manager. Please wait and <em>DO NOT press Ctrl + F5 yet</em>.
            </span>
          </div>
        </div>
      )}

      {/* 2. Full-Width New Version Ready Banner (Single Authoritative Update Notification) */}
      {deployState === 'update_ready' && (
        <div
          className="global-updating-banner global-update-ready-banner"
          role="status"
          aria-live="polite"
          onClick={handleManualRefresh}
          style={{ cursor: 'pointer' }}
          id="banner-new-version-ready"
        >
          <div className="global-update-banner-content">
            <span className="banner-message">
              <span className="deploy-ready-icon" aria-hidden="true">↻</span>
              <strong>NEW VERSION READY:</strong> An update has been deployed. <strong>Click here to refresh</strong> and load the latest changes.
            </span>
            <button
              type="button"
              className="banner-action-button"
              onClick={(e) => {
                e.stopPropagation()
                handleManualRefresh()
              }}
            >
              Refresh Now
            </button>
          </div>
        </div>
      )}

      {/* 3. Global Header Live Badge & Refresh Control */}
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
    </>
  )
}

