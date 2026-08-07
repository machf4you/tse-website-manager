import { useState } from 'react'
import { connectWordPress, WP_STEPS } from '../services/wordpressApi'
import { buildWordPressSite } from '../data/mockData'
import './AddWebsiteDialog.css'

const PLATFORMS = [
  { id: 'wordpress', label: 'WordPress' },
  { id: 'magento',   label: 'Magento'   },
  { id: 'other',     label: 'Other'     },
]

/* ── Field helpers ── */
function Field({ label, id, type = 'text', placeholder = '', value, onChange, disabled }) {
  return (
    <div className="aw-field">
      <label className="aw-label" htmlFor={id}>{label}</label>
      <input
        className="aw-input"
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        autoComplete="off"
      />
    </div>
  )
}

function Toggle({ label, id, checked, onChange, disabled }) {
  return (
    <div className="aw-field aw-toggle-row">
      <label className="aw-label" htmlFor={id}>{label}</label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`aw-toggle ${checked ? 'aw-toggle-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="aw-toggle-thumb" />
      </button>
    </div>
  )
}

function SelectPlaceholder({ label, id }) {
  return (
    <div className="aw-field">
      <label className="aw-label" htmlFor={id}>{label}</label>
      <select className="aw-input aw-select" id={id} defaultValue="" disabled>
        <option value="" disabled>Select store view…</option>
      </select>
    </div>
  )
}

function PortfolioSelect({ id, value, onChange, disabled }) {
  return (
    <div className="aw-field">
      <label className="aw-label" htmlFor={id}>Portfolio</label>
      <select
        className="aw-input aw-select"
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="" disabled>Select portfolio…</option>
        <option value="tse">TSE</option>
        <option value="scm">SCM</option>
        <option value="client">Client</option>
        <option value="internal">Internal</option>
        <option value="other">Other</option>
      </select>
    </div>
  )
}

/* ── Magento field set (UI preserved, no logic) ── */
function MagentoFields() {
  return (
    <>
      <Field label="Website Name"           id="mg-name"     placeholder="e.g. My Magento Store" disabled />
      <Field label="Website URL (Frontend)" id="mg-url"      placeholder="https://www.example.co.uk" disabled />
      <Field label="Magento Backend URL"    id="mg-backend"  placeholder="https://www.example.co.uk/admin" disabled />
      <Field label="API Base URL"           id="mg-api"      placeholder="https://www.example.co.uk/rest/V1" disabled />
      <Field label="API Username"           id="mg-api-user" placeholder="api_user" disabled />
      <Field label="API Password / Token"   id="mg-api-pass" type="password" placeholder="••••••••••••••••" disabled />
      <SelectPlaceholder label="Store View" id="mg-store" />
      <PortfolioSelect id="mg-portfolio" value="" onChange={() => {}} disabled />
    </>
  )
}

/* ── Other placeholder ── */
function OtherFields() {
  return (
    <div className="aw-other-placeholder">
      <span>Support for additional platforms is coming soon.</span>
    </div>
  )
}

/* ── Main dialog ── */
export default function AddWebsiteDialog({ isOpen, onClose, onAddWebsite }) {
  const [platform, setPlatform] = useState('wordpress')
  
  // WordPress form state
  const [wpName, setWpName] = useState('')
  const [wpUrl, setWpUrl] = useState('')
  const [wpUser, setWpUser] = useState('')
  const [wpPass, setWpPass] = useState('')
  const [portfolio, setPortfolio] = useState('tse')
  const [elementorEnabled, setElementorEnabled] = useState(false)

  // Status & error state
  const [isConnecting, setIsConnecting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [stepStates, setStepStates] = useState({
    api: 'pending',
    auth: 'pending',
    perms: 'pending',
  })

  if (!isOpen) return null

  function resetForm() {
    setWpName('')
    setWpUrl('')
    setWpUser('')
    setWpPass('')
    setPortfolio('tse')
    setElementorEnabled(false)
    setIsConnecting(false)
    setErrorMsg(null)
    setStepStates({ api: 'pending', auth: 'pending', perms: 'pending' })
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget && !isConnecting) {
      handleClose()
    }
  }

  async function handleConnect(e) {
    e?.preventDefault()
    if (isConnecting) return
    setErrorMsg(null)

    // 1. Validation
    if (!wpName.trim()) {
      setErrorMsg('Please enter a Website Name.')
      return
    }
    if (!wpUrl.trim()) {
      setErrorMsg('Please enter a Website URL.')
      return
    }
    if (!wpUser.trim()) {
      setErrorMsg('Please enter a WordPress Username.')
      return
    }
    if (!wpPass.trim()) {
      setErrorMsg('Please enter a WordPress Application Password.')
      return
    }

    setIsConnecting(true)
    setStepStates({ api: 'pending', auth: 'pending', perms: 'pending' })

    const updateStep = (stepId, status) => {
      setStepStates(prev => ({ ...prev, [stepId]: status }))
    }

    // 2. REST API Connection & Verification
    const res = await connectWordPress(
      { url: wpUrl, username: wpUser, password: wpPass },
      updateStep
    )

    if (res.success) {
      // 3. Save website record & create tile
      const newTile = buildWordPressSite({
        name: wpName.trim(),
        url: wpUrl.trim(),
        portfolio,
        elementorEnabled,
        user: res.user,
      })

      if (onAddWebsite) {
        onAddWebsite(newTile)
      }

      resetForm()
      onClose()
    } else {
      setErrorMsg(res.error || 'Connection failed.')
      setIsConnecting(false)
    }
  }

  return (
    <div
      className="aw-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Connect new website"
      onClick={handleBackdrop}
    >
      <div className="aw-dialog">

        {/* Header */}
        <div className="aw-header">
          <h2 className="aw-title">Connect New Website</h2>
          <button
            type="button"
            className="aw-close"
            aria-label="Close dialog"
            onClick={handleClose}
            disabled={isConnecting}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Platform selector */}
        <div className="aw-platform-selector" role="group" aria-label="Select platform">
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              type="button"
              className={`aw-platform-btn ${platform === p.id ? 'aw-platform-active' : ''}`}
              onClick={() => {
                if (!isConnecting) setPlatform(p.id)
              }}
              aria-pressed={platform === p.id}
              id={`platform-${p.id}`}
              disabled={isConnecting}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Form fields */}
        <form className="aw-form" onSubmit={handleConnect}>
          {errorMsg && (
            <div className="aw-error-banner" role="alert">
              {errorMsg}
            </div>
          )}

          {platform === 'wordpress' && (
            <>
              <Field
                label="Website Name"
                id="wp-name"
                placeholder="e.g. Bathroom Upgrades"
                value={wpName}
                onChange={setWpName}
                disabled={isConnecting}
              />
              <Field
                label="Website URL"
                id="wp-url"
                placeholder="https://www.example.co.uk"
                value={wpUrl}
                onChange={setWpUrl}
                disabled={isConnecting}
              />
              <Field
                label="WordPress Username"
                id="wp-user"
                placeholder="admin"
                value={wpUser}
                onChange={setWpUser}
                disabled={isConnecting}
              />
              <Field
                label="WordPress Application Password"
                id="wp-pass"
                type="password"
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                value={wpPass}
                onChange={setWpPass}
                disabled={isConnecting}
              />
              <PortfolioSelect
                id="wp-portfolio"
                value={portfolio}
                onChange={setPortfolio}
                disabled={isConnecting}
              />
              <Toggle
                label="Elementor Enabled"
                id="wp-elementor"
                checked={elementorEnabled}
                onChange={setElementorEnabled}
                disabled={isConnecting}
              />

              {isConnecting && (
                <div className="aw-steps-container">
                  {WP_STEPS.map(step => {
                    const st = stepStates[step.id] || 'pending'
                    return (
                      <div key={step.id} className={`aw-step-item aw-step-status-${st}`}>
                        {st === 'loading' && <span className="aw-spinner" />}
                        {st === 'done' && <span>✓</span>}
                        {st === 'error' && <span>✗</span>}
                        {st === 'pending' && <span>○</span>}
                        <span>{step.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {platform === 'magento'   && <MagentoFields />}
          {platform === 'other'     && <OtherFields />}
        </form>

        {/* Footer */}
        <div className="aw-footer">
          <button
            type="button"
            className="aw-btn-cancel"
            onClick={handleClose}
            disabled={isConnecting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="aw-btn-connect"
            id="btn-connect-website"
            onClick={handleConnect}
            disabled={isConnecting || platform !== 'wordpress'}
          >
            {isConnecting ? 'Connecting…' : 'Connect Website'}
          </button>
        </div>

      </div>
    </div>
  )
}
