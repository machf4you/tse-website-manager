import { useState, useEffect, useRef } from 'react'
import { CURRENT_BUILD_VERSION, CURRENT_BUILD_LABEL } from '../config/version'
import './GlobalDeploymentIndicator.css'

export default function GlobalDeploymentIndicator() {
  const [deployState, setDeployState] = useState('idle') // 'idle' | 'updating' | 'ready'
  const [targetVersion, setTargetVersion] = useState(CURRENT_BUILD_VERSION)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  
  const timerRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    async function checkLiveVersion() {
      try {
        // Cache-busting fetch to check currently deployed version on host
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const liveVer = String(data.version || '').trim()
          const buildingVer = String(data.building || '').trim()

          if (!isMounted) return

          if (buildingVer && buildingVer !== liveVer && buildingVer !== CURRENT_BUILD_VERSION) {
            // Server build in progress -> UPDATING state with spinner & timer
            setTargetVersion(buildingVer)
            setDeployState('updating')
          } else if (liveVer && liveVer !== CURRENT_BUILD_VERSION) {
            // Live version deployed on host -> READY state with Ctrl+F5 badge
            setTargetVersion(liveVer)
            setDeployState('ready')
          } else {
            // Live version matches loaded version -> IDLE / LIVE state
            setDeployState('idle')
          }
        }
      } catch (_e) {
        // Fallback for offline or local dev environment
      }
    }

    // Initial check
    checkLiveVersion()

    // Poll live host URL every 3 seconds for instant deployment updates
    const interval = setInterval(checkLiveVersion, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Elapsed timer when in updating state
  useEffect(() => {
    if (deployState === 'updating') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else {
      setElapsedSeconds(0)
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [deployState])

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60)
    const remSec = sec % 60
    return `${String(mins).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`
  }

  if (deployState === 'updating') {
    return (
      <div className="global-deploy-indicator global-deploy-updating" role="status" aria-live="polite">
        <span className="deploy-spinner" aria-hidden="true" />
        <span className="deploy-text">Updating V{targetVersion}…</span>
        <span className="global-deploy-timer">{formatTimer(elapsedSeconds)}</span>
      </div>
    )
  }

  if (deployState === 'ready') {
    return (
      <div className="global-deploy-indicator global-deploy-ready" role="status" aria-live="polite">
        <span className="deploy-ready-dot" aria-hidden="true" />
        <span className="deploy-text">🟢 V{targetVersion} READY</span>
        <span className="deploy-action-badge">Ctrl+F5</span>
      </div>
    )
  }

  // Idle state: Permanent live badge in top application header
  return (
    <div className="global-deploy-indicator global-deploy-idle">
      <span className="global-deploy-live-badge">
        <span className="deploy-live-dot">●</span> {CURRENT_BUILD_LABEL}
      </span>
    </div>
  )
}
