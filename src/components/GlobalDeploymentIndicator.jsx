import { useState, useEffect, useRef } from 'react'
import { CURRENT_BUILD_VERSION, CURRENT_BUILD_LABEL } from '../config/version'
import './GlobalDeploymentIndicator.css'

export default function GlobalDeploymentIndicator({ inline = false }) {
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

          if (!isMounted) return

          if (liveVer && liveVer !== CURRENT_BUILD_VERSION) {
            // Live version is newer -> READY state!
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

    // Poll live host URL every 10 seconds
    const interval = setInterval(checkLiveVersion, 10000)

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

  const containerClass = `global-deploy-indicator ${inline ? 'inline-mode' : 'fixed-mode'}`

  if (deployState === 'updating') {
    return (
      <div className={`${containerClass} global-deploy-updating`} role="status" aria-live="polite">
        <span className="deploy-spinner" aria-hidden="true" />
        <span className="deploy-text">Updating V{targetVersion}…</span>
        <span className="global-deploy-timer">{formatTimer(elapsedSeconds)}</span>
      </div>
    )
  }

  if (deployState === 'ready') {
    return (
      <div className={`${containerClass} global-deploy-ready`} role="status" aria-live="polite">
        <span className="deploy-ready-dot" aria-hidden="true" />
        <span className="deploy-text">🟢 V{targetVersion} READY</span>
        <span className="deploy-action-badge">Ctrl+F5</span>
      </div>
    )
  }

  // Idle state: Default to permanent live badge in header
  return (
    <div className={`${containerClass} global-deploy-idle`}>
      <span className="global-deploy-live-badge">
        <span className="deploy-live-dot">●</span> {CURRENT_BUILD_LABEL}
      </span>
    </div>
  )
}
