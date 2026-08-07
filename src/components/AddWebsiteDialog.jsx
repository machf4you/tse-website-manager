import { useState } from 'react'
import './AddWebsiteDialog.css'

const PLATFORMS = [
  { id: 'wordpress', label: 'WordPress' },
  { id: 'magento',   label: 'Magento'   },
  { id: 'other',     label: 'Other'     },
]

/* ── Field helpers ── */
function Field({ label, id, type = 'text', placeholder = '' }) {
  return (
    <div className="aw-field">
      <label className="aw-label" htmlFor={id}>{label}</label>
      <input
        className="aw-input"
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  )
}

function Toggle({ label, id }) {
  const [on, setOn] = useState(false)
  return (
    <div className="aw-field aw-toggle-row">
      <label className="aw-label" htmlFor={id}>{label}</label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        className={`aw-toggle ${on ? 'aw-toggle-on' : ''}`}
        onClick={() => setOn(v => !v)}
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
      <select className="aw-input aw-select" id={id} defaultValue="">
        <option value="" disabled>Select store view…</option>
      </select>
    </div>
  )
}

function PortfolioSelect({ id }) {
  return (
    <div className="aw-field">
      <label className="aw-label" htmlFor={id}>Portfolio</label>
      <select className="aw-input aw-select" id={id} defaultValue="">
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

/* ── WordPress field set ── */
function WordPressFields() {
  return (
    <>
      <Field label="Website Name"                   id="wp-name"  placeholder="e.g. Bathroom Upgrades" />
      <Field label="Website URL"                    id="wp-url"   placeholder="https://www.example.co.uk" />
      <Field label="WordPress Username"             id="wp-user"  placeholder="admin" />
      <Field label="WordPress Application Password" id="wp-pass"  type="password" placeholder="xxxx xxxx xxxx xxxx xxxx xxxx" />
      <PortfolioSelect id="wp-portfolio" />
      <Toggle label="Elementor Enabled"             id="wp-elementor" />
    </>
  )
}

/* ── Magento field set ── */
function MagentoFields() {
  return (
    <>
      <Field label="Website Name"           id="mg-name"     placeholder="e.g. My Magento Store" />
      <Field label="Website URL (Frontend)" id="mg-url"      placeholder="https://www.example.co.uk" />
      <Field label="Magento Backend URL"    id="mg-backend"  placeholder="https://www.example.co.uk/admin" />
      <Field label="API Base URL"           id="mg-api"      placeholder="https://www.example.co.uk/rest/V1" />
      <Field label="API Username"           id="mg-api-user" placeholder="api_user" />
      <Field label="API Password / Token"   id="mg-api-pass" type="password" placeholder="••••••••••••••••" />
      <SelectPlaceholder label="Store View" id="mg-store" />
      <PortfolioSelect id="mg-portfolio" />
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
export default function AddWebsiteDialog({ isOpen, onClose }) {
  const [platform, setPlatform] = useState('wordpress')

  if (!isOpen) return null

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
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
            onClick={onClose}
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
              onClick={() => setPlatform(p.id)}
              aria-pressed={platform === p.id}
              id={`platform-${p.id}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Form fields */}
        <form className="aw-form" onSubmit={e => e.preventDefault()}>
          {platform === 'wordpress' && <WordPressFields />}
          {platform === 'magento'   && <MagentoFields />}
          {platform === 'other'     && <OtherFields />}
        </form>

        {/* Footer */}
        <div className="aw-footer">
          <button type="button" className="aw-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="aw-btn-connect" id="btn-connect-website">
            Connect Website
          </button>
        </div>

      </div>
    </div>
  )
}
