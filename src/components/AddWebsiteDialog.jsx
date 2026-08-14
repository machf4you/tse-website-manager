import { useState, useEffect } from 'react'
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

function StoreViewSelect({ id, value, onChange, disabled }) {
  return (
    <div className="aw-field">
      <label className="aw-label" htmlFor={id}>Store View</label>
      <select
        className="aw-input aw-select"
        id={id}
        value={value || 'default'}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="default">HF4You</option>
        <option value="mt">Mattress Time</option>
        <option value="cheapbedsale">Cheap Bed Sale</option>
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

/* ── Magento field set ── */
function MagentoFields({
  mgName, setMgName,
  mgUrl, setMgUrl,
  mgBackend, setMgBackend,
  mgApi, setMgApi,
  mgUser, setMgUser,
  mgPass, setMgPass,
  mgStore, setMgStore,
  mgPortfolio, setMgPortfolio,
  isConnecting
}) {
  return (
    <>
      <Field label="Website Name"           id="mg-name"     placeholder="e.g. My Magento Store" value={mgName} onChange={setMgName} disabled={isConnecting} />
      <Field label="Website URL (Frontend)" id="mg-url"      placeholder="https://www.example.co.uk" value={mgUrl} onChange={setMgUrl} disabled={isConnecting} />
      <Field label="Magento Backend URL"    id="mg-backend"  placeholder="https://www.example.co.uk/admin" value={mgBackend} onChange={setMgBackend} disabled={isConnecting} />
      <Field label="API Base URL"           id="mg-api"      placeholder="https://www.example.co.uk/rest/V1" value={mgApi} onChange={setMgApi} disabled={isConnecting} />
      <Field label="API Username"           id="mg-api-user" placeholder="api_user" value={mgUser} onChange={setMgUser} disabled={isConnecting} />
      <Field label="API Password / Token"   id="mg-api-pass" type="password" placeholder="••••••••••••••••" value={mgPass} onChange={setMgPass} disabled={isConnecting} />
      <StoreViewSelect                      id="mg-store"    value={mgStore} onChange={setMgStore} disabled={isConnecting} />
      <PortfolioSelect                      id="mg-portfolio" value={mgPortfolio} onChange={setMgPortfolio} disabled={isConnecting} />
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
export default function AddWebsiteDialog({
  isOpen,
  onClose,
  onAddWebsite,
  onUpdateWebsite,
  onDeleteWebsite,
  editingSite = null,
}) {
  const [platform, setPlatform] = useState('wordpress')
  
  // WordPress form state
  const [wpName, setWpName] = useState('')
  const [wpUrl, setWpUrl] = useState('')
  const [wpUser, setWpUser] = useState('')
  const [wpPass, setWpPass] = useState('')
  const [portfolio, setPortfolio] = useState('tse')
  const [elementorEnabled, setElementorEnabled] = useState(false)

  // Magento form state
  const [mgName, setMgName] = useState('')
  const [mgUrl, setMgUrl] = useState('')
  const [mgBackend, setMgBackend] = useState('')
  const [mgApi, setMgApi] = useState('')
  const [mgUser, setMgUser] = useState('')
  const [mgPass, setMgPass] = useState('')
  const [mgStore, setMgStore] = useState('default')
  const [mgPortfolio, setMgPortfolio] = useState('tse')

  // Status & error state
  const [isConnecting, setIsConnecting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [stepStates, setStepStates] = useState({
    api: 'pending',
    auth: 'pending',
    perms: 'pending',
  })

  // Populate fields when editing an existing site
  useEffect(() => {
    if (isOpen && editingSite) {
      let cfg = editingSite.configData
      if (!cfg && editingSite.config_data && typeof editingSite.config_data === 'string') {
        try { cfg = JSON.parse(editingSite.config_data) } catch (e) {}
      }
      cfg = cfg || {}

      setWpName(editingSite.name || '')
      setWpUrl(editingSite.url || '')
      setWpUser(editingSite.wpUser || editingSite.connectedUser || cfg.wpUser || cfg.connectedUser || '')
      setWpPass(editingSite.wpPass || cfg.wpPass || '')
      setPortfolio(editingSite.portfolio || 'tse')
      setElementorEnabled(editingSite.elementorEnabled || false)
    } else if (isOpen && !editingSite) {
      resetForm()
    }
  }, [isOpen, editingSite])

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

  function handleDelete() {
    if (!editingSite) return
    const confirmed = window.confirm(`Are you sure you want to permanently delete "${editingSite.name}" from Website Manager?`)
    if (confirmed) {
      if (onDeleteWebsite) {
        onDeleteWebsite(editingSite.id)
      }
      handleClose()
    }
  }

  function handleResetSync() {
    if (!editingSite) return
    const confirmed = window.confirm(`Reset synchronisation for "${editingSite.name}"? This will clear stored exporter data and return the site to an unsynchronised state.`)
    if (confirmed) {
      const resetSite = {
        ...editingSite,
        isSynchronised: false,
        lastSyncTimestamp: null,
        storedPackageData: null,
      }
      if (onUpdateWebsite) {
        onUpdateWebsite(resetSite)
      }
      handleClose()
    }
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

    // Validation
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

    // REST API Connection & Verification
    let res
    try {
      res = await connectWordPress(
        { url: wpUrl, username: wpUser, password: wpPass },
        updateStep
      )
    } catch (err) {
      setIsConnecting(false)
      setErrorMsg('Unexpected error: ' + err.message)
      return
    }

    if (res.success) {
      if (editingSite && onUpdateWebsite) {
        // Update existing site
        const updatedTile = {
          ...editingSite,
          name: wpName.trim(),
          url: wpUrl.trim(),
          portfolio,
          elementorEnabled,
          wpUser: wpUser.trim(),
          wpPass: wpPass.trim(),
          connectedUser: res.user ? res.user.name : wpUser.trim(),
          configData: {
            ...(editingSite?.configData || {}),
            wpUser: wpUser.trim(),
            wpPass: wpPass.trim(),
            connectedUser: res.user ? res.user.name : wpUser.trim(),
          }
        }
        onUpdateWebsite(updatedTile)
      } else {
        // Build new site
        const newTile = buildWordPressSite({
          name: wpName.trim(),
          url: wpUrl.trim(),
          portfolio,
          elementorEnabled,
          user: res.user,
          wpUser: wpUser.trim(),
          wpPass: wpPass.trim(),
        })

        if (onAddWebsite) {
          onAddWebsite(newTile)
        }
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
      aria-label={editingSite ? 'Edit website connection' : 'Connect new website'}
      onClick={handleBackdrop}
    >
      <div className="aw-dialog">

        {/* Header */}
        <div className="aw-header">
          <h2 className="aw-title">{editingSite ? 'Edit Website Connection' : 'Connect New Website'}</h2>
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
        <form id="aw-connect-form" className="aw-form" onSubmit={handleConnect}>
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
                type={editingSite ? 'text' : 'password'}
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

          {platform === 'magento'   && (
            <MagentoFields
              mgName={mgName} setMgName={setMgName}
              mgUrl={mgUrl} setMgUrl={setMgUrl}
              mgBackend={mgBackend} setMgBackend={setMgBackend}
              mgApi={mgApi} setMgApi={setMgApi}
              mgUser={mgUser} setMgUser={setMgUser}
              mgPass={mgPass} setMgPass={setMgPass}
              mgStore={mgStore} setMgStore={setMgStore}
              mgPortfolio={mgPortfolio} setMgPortfolio={setMgPortfolio}
              isConnecting={isConnecting}
            />
          )}
          {platform === 'other'     && <OtherFields />}
        </form>

        {/* Footer */}
        <div className="aw-footer">
          {editingSite && (
            <div className="aw-footer-left">
              <button
                type="button"
                className="aw-btn-reset-sync"
                id="btn-reset-sync"
                onClick={handleResetSync}
                disabled={isConnecting}
              >
                Reset Synchronisation
              </button>
              <button
                type="button"
                className="aw-btn-delete"
                id="btn-delete-website"
                onClick={handleDelete}
                disabled={isConnecting}
              >
                Delete Website
              </button>
            </div>
          )}
          <div className="aw-footer-actions">
            <button
              type="button"
              className="aw-btn-cancel"
              onClick={handleClose}
              disabled={isConnecting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="aw-connect-form"
              className="aw-btn-connect"
              id="btn-connect-website"
              disabled={isConnecting || platform !== 'wordpress'}
            >
              {isConnecting ? (editingSite ? 'Updating…' : 'Connecting…') : (editingSite ? 'Update Connection' : 'Connect Website')}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
