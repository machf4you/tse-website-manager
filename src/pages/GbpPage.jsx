import { useState, useEffect } from 'react'
import { getSiteGbpApi, updateSiteGbpApi } from '../services/websiteManagerApi'
import './GbpPage.css'

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const MapPinIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

export default function GbpPage({ site, onBack, onNavigateTab }) {
  const [formData, setFormData] = useState({
    status: 'Not Created',
    business_name: '',
    profile_url: '',
    primary_category: '',
    website: '',
    phone: '',
    address_service_area: '',
    verification_status: 'Not Verified'
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveToast, setSaveToast] = useState(null)

  const cleanDomain = String(site?.url || site?.name || '')
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')

  const siteDisplayName = site?.name || cleanDomain || 'Website'

  const fetchGbpData = async () => {
    setIsLoading(true)
    try {
      const gbp = await getSiteGbpApi(site)
      if (gbp) {
        setFormData({
          status: gbp.status || 'Not Created',
          business_name: gbp.business_name || '',
          profile_url: gbp.profile_url || '',
          primary_category: gbp.primary_category || '',
          website: gbp.website || '',
          phone: gbp.phone || '',
          address_service_area: gbp.address_service_area || '',
          verification_status: gbp.verification_status || 'Not Verified'
        })
      }
    } catch (e) {
      console.error('Failed to load GBP data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGbpData()
  }, [site?.id, site?.url])

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    setSaveToast(null)
    try {
      const updated = await updateSiteGbpApi(site, formData)
      if (updated) {
        setFormData({
          status: updated.status || 'Not Created',
          business_name: updated.business_name || '',
          profile_url: updated.profile_url || '',
          primary_category: updated.primary_category || '',
          website: updated.website || '',
          phone: updated.phone || '',
          address_service_area: updated.address_service_area || '',
          verification_status: updated.verification_status || 'Not Verified'
        })
        setSaveToast('Google Business Profile record saved successfully')
        setTimeout(() => setSaveToast(null), 3000)
      }
    } catch (err) {
      console.error('Failed to save GBP record:', err)
      setSaveToast('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const formatExternalUrl = (urlStr) => {
    if (!urlStr) return ''
    const trimmed = String(urlStr).trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
    return `https://${trimmed}`
  }

  return (
    <div className="gbp-page">
      {/* Navigation Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          type="button"
          className="w2-btn-back"
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.9rem', cursor: 'pointer' }}
          id="btn-back-to-w2"
        >
          ← Back to W2 Website Dashboard
        </button>

        {/* Navigation Tabs Sequence: W6, W7, W8, W9 */}
        <div className="gbp-nav-tabs">
          <button
            type="button"
            className="gbp-nav-btn btn-rank"
            id="btn-nav-rank-tracker"
            onClick={() => onNavigateTab && onNavigateTab('w6')}
          >
            W6 | Rank Tracker
          </button>
          <button
            type="button"
            className="gbp-nav-btn btn-social"
            id="btn-nav-social"
            onClick={() => onNavigateTab && onNavigateTab('w7')}
          >
            W7 | Social
          </button>
          <button
            type="button"
            className="gbp-nav-btn btn-backlinks"
            id="btn-nav-backlinks"
            onClick={() => onNavigateTab && onNavigateTab('w8')}
          >
            W8 | Backlinks
          </button>
          <button
            type="button"
            className="gbp-nav-btn btn-gbp active"
            id="btn-nav-gbp"
            disabled
          >
            W9 | Google Business Profile
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="gbp-header-card">
        <div className="gbp-header-info">
          <span className="gbp-pill-tag">W9 | GOOGLE BUSINESS PROFILE</span>
          <h1 className="gbp-title">Google Business Profile — {siteDisplayName}</h1>
          <p className="gbp-subtitle">
            Website Manager Permanent Record • Associated Domain: <code style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{cleanDomain}</code>
          </p>
        </div>

        <div className="gbp-header-actions">
          {saveToast && (
            <span className="gbp-toast-msg">
              <CheckIcon /> {saveToast}
            </span>
          )}
          <button
            type="button"
            className="gbp-btn-save"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            id="btn-save-gbp"
          >
            {isSaving ? 'Saving...' : 'Save Record'}
          </button>
        </div>
      </div>

      {/* Main Record Form Card */}
      <div className="gbp-form-card">
        {isLoading ? (
          <div className="gbp-loading-state">
            <div className="deploy-spinner" style={{ margin: '0 auto 16px auto', width: '28px', height: '28px', borderWidth: '3px' }} />
            <p>Loading Google Business Profile record...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="gbp-form-grid">
            {/* Field 1: STATUS */}
            <div className="gbp-field-group">
              <label className="gbp-label" htmlFor="gbp-status">
                1. Status
              </label>
              <select
                id="gbp-status"
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className={`gbp-select ${formData.status === 'Created' ? 'status-created' : 'status-not-created'}`}
              >
                <option value="Not Created">Not Created</option>
                <option value="Created">Created</option>
              </select>
              <span className="gbp-help-text">Creation status of the Google Business Profile</span>
            </div>

            {/* Field 8: VERIFICATION STATUS */}
            <div className="gbp-field-group">
              <label className="gbp-label" htmlFor="gbp-verification-status">
                8. Verification Status
              </label>
              <select
                id="gbp-verification-status"
                value={formData.verification_status}
                onChange={(e) => handleFieldChange('verification_status', e.target.value)}
                className={`gbp-select ${formData.verification_status === 'Verified' ? 'status-verified' : 'status-not-verified'}`}
              >
                <option value="Not Verified">Not Verified</option>
                <option value="Verified">Verified</option>
              </select>
              <span className="gbp-help-text">Google verification confirmation status</span>
            </div>

            {/* Field 2: BUSINESS / PROFILE NAME */}
            <div className="gbp-field-group col-span-2">
              <label className="gbp-label" htmlFor="gbp-business-name">
                2. Business / Profile Name
              </label>
              <input
                type="text"
                id="gbp-business-name"
                value={formData.business_name}
                onChange={(e) => handleFieldChange('business_name', e.target.value)}
                placeholder="e.g. Digital Spain"
                className="gbp-input"
              />
            </div>

            {/* Field 3: GOOGLE BUSINESS PROFILE URL */}
            <div className="gbp-field-group col-span-2">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="gbp-label" htmlFor="gbp-profile-url">
                  3. Google Business Profile URL
                </label>
                {formData.profile_url.trim() && (
                  <a
                    href={formatExternalUrl(formData.profile_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="gbp-ext-link"
                    title="Open Google Business Profile in new tab"
                  >
                    Open Google Business Profile <ExternalLinkIcon />
                  </a>
                )}
              </div>
              <input
                type="url"
                id="gbp-profile-url"
                value={formData.profile_url}
                onChange={(e) => handleFieldChange('profile_url', e.target.value)}
                placeholder="https://business.google.com/..."
                className="gbp-input"
              />
            </div>

            {/* Field 4: PRIMARY CATEGORY */}
            <div className="gbp-field-group">
              <label className="gbp-label" htmlFor="gbp-primary-category">
                4. Primary Category
              </label>
              <input
                type="text"
                id="gbp-primary-category"
                value={formData.primary_category}
                onChange={(e) => handleFieldChange('primary_category', e.target.value)}
                placeholder="e.g. Internet Marketing Service"
                className="gbp-input"
              />
            </div>

            {/* Field 5: WEBSITE */}
            <div className="gbp-field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="gbp-label" htmlFor="gbp-website">
                  5. Website
                </label>
                {formData.website.trim() && (
                  <a
                    href={formatExternalUrl(formData.website)}
                    target="_blank"
                    rel="noreferrer"
                    className="gbp-ext-link"
                    title="Open website in new tab"
                  >
                    Open Website <ExternalLinkIcon />
                  </a>
                )}
              </div>
              <input
                type="url"
                id="gbp-website"
                value={formData.website}
                onChange={(e) => handleFieldChange('website', e.target.value)}
                placeholder="https://digitalspain.es/"
                className="gbp-input"
              />
            </div>

            {/* Field 6: PHONE */}
            <div className="gbp-field-group">
              <label className="gbp-label" htmlFor="gbp-phone">
                6. Phone
              </label>
              <input
                type="text"
                id="gbp-phone"
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="e.g. +34 600 000 000"
                className="gbp-input"
              />
            </div>

            {/* Field 7: ADDRESS / SERVICE AREA */}
            <div className="gbp-field-group">
              <label className="gbp-label" htmlFor="gbp-address-service-area">
                7. Address / Service Area
              </label>
              <input
                type="text"
                id="gbp-address-service-area"
                value={formData.address_service_area}
                onChange={(e) => handleFieldChange('address_service_area', e.target.value)}
                placeholder="e.g. Alicante, Spain / Nationwide"
                className="gbp-input"
              />
            </div>

            <div className="col-span-2" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                type="submit"
                className="gbp-btn-save"
                disabled={isSaving || isLoading}
                id="btn-save-gbp-bottom"
              >
                {isSaving ? 'Saving Record...' : 'Save Google Business Profile Record'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
