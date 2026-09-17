import { useState, useEffect, useMemo } from 'react'
import { connectWordPress, WP_STEPS } from '../services/wordpressApi'
import { saveWebsiteApi, getWebsitesApi, getActiveRegistryDomainsApi } from '../services/websiteManagerApi'
import { authorizeMagentoAdminTokenApi } from '../services/exporterApi'
import { buildWordPressSite } from '../data/mockData'
import './AddWebsiteDialog.css'

const PLATFORMS = [
  { id: 'wordpress', label: 'WordPress' },
  { id: 'magento',   label: 'Magento'   },
  { id: 'other',     label: 'Other'     },
]

function normalizeDomain(val) {
  if (!val) return ''
  return String(val)
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
}

/* ── Field helpers ── */
function Field({ label, id, type = 'text', placeholder = '', value, onChange, disabled, readOnly = false, helperText = null }) {
  return (
    <div className="aw-field">
      <div className="aw-label-row">
        <label className="aw-label" htmlFor={id}>{label}</label>
        {readOnly && <span className="aw-readonly-pill">Site Registry Master</span>}
      </div>
      <input
        className={`aw-input ${readOnly ? 'aw-input-readonly' : ''}`}
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange && onChange(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete="off"
      />
      {helperText && <span className="aw-helper-text">{helperText}</span>}
    </div>
  )
}

function PasswordField({ label, id, placeholder = '', value, onChange, disabled }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="aw-field">
      <label className="aw-label" htmlFor={id}>{label}</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          className="aw-input"
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          autoComplete="off"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          id={`${id}-toggle`}
          onClick={() => setShowPassword(prev => !prev)}
          disabled={disabled}
          className="aw-toggle-pwd-btn"
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
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

function ServerTypeSelect({ id, value, onChange, disabled }) {
  return (
    <div className="aw-field">
      <label className="aw-label" htmlFor={id}>Server Type</label>
      <select
        className="aw-input aw-select"
        id={id}
        value={value || 'Unknown'}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="Unknown">Unknown</option>
        <option value="Caddy">Caddy</option>
        <option value="LiteSpeed">LiteSpeed</option>
        <option value="Nginx">Nginx</option>
        <option value="Apache">Apache</option>
      </select>
    </div>
  )
}

function PortfolioSelect({ id, value, onChange, disabled, readOnly = false }) {
  return (
    <div className="aw-field">
      <div className="aw-label-row">
        <label className="aw-label" htmlFor={id}>Portfolio</label>
        {readOnly && <span className="aw-readonly-pill">Site Registry Master</span>}
      </div>
      <select
        className={`aw-input aw-select ${readOnly ? 'aw-input-readonly' : ''}`}
        id={id}
        value={value || 'tse'}
        onChange={e => onChange && onChange(e.target.value)}
        disabled={disabled || readOnly}
      >
        <option value="tse">TSE</option>
        <option value="scm">SCM / Chili</option>
        <option value="client">Client</option>
        <option value="internal">Internal</option>
        <option value="other">Other</option>
      </select>
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
  connectedSites = []
}) {
  // Registry active domains state
  const [registryDomains, setRegistryDomains] = useState([])
  const [activeConnectedSites, setActiveConnectedSites] = useState([])
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(true)

  const [platform, setPlatform] = useState('wordpress')
  
  // WordPress form state
  const [wpName, setWpName] = useState('')
  const [wpUrl, setWpUrl] = useState('')
  const [wpUser, setWpUser] = useState('')
  const [wpPass, setWpPass] = useState('')
  const [portfolio, setPortfolio] = useState('tse')
  const [serverType, setServerType] = useState('Unknown')
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
  const [mgServerType, setMgServerType] = useState('Unknown')

  // Status & error state
  const [isConnecting, setIsConnecting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [stepStates, setStepStates] = useState({
    api: 'pending',
    auth: 'pending',
    perms: 'pending',
  })

  // Load Registry domains & connected websites when dialog opens in New Website mode
  useEffect(() => {
    if (!isOpen) return

    if (editingSite) {
      let cfg = editingSite.configData
      if (!cfg && editingSite.config_data && typeof editingSite.config_data === 'string') {
        try { cfg = JSON.parse(editingSite.config_data) } catch (e) {}
      }
      cfg = cfg || {}

      const resolvedServerType = editingSite.serverType || editingSite.server_type || cfg.serverType || 'Unknown'
      const rawPlatform = String(editingSite.platform || editingSite.platform_type || '').toLowerCase()
      const isMg = rawPlatform === 'magento' || Boolean(cfg.mgBackendUrl) || Boolean(editingSite.mgBackendUrl)

      if (isMg) {
        setPlatform('magento')
        setMgName(editingSite.name || '')
        setMgUrl(editingSite.url || '')
        setMgBackend(cfg.mgBackendUrl || editingSite.mgBackendUrl || '')
        setMgApi(cfg.apiBaseUrl || editingSite.apiBaseUrl || '')
        setMgUser(editingSite.wpUser || editingSite.connectedUser || cfg.wpUser || cfg.connectedUser || '')
        setMgPass(editingSite.wpPass || cfg.wpPass || '')
        setMgStore(cfg.mgStore || editingSite.mgStore || 'default')
        setMgPortfolio(editingSite.portfolio || cfg.portfolio || 'tse')
        setMgServerType(resolvedServerType)
      } else {
        setPlatform('wordpress')
        setWpName(editingSite.name || '')
        setWpUrl(editingSite.url || '')
        setWpUser(editingSite.wpUser || editingSite.connectedUser || cfg.wpUser || cfg.connectedUser || '')
        setWpPass(editingSite.wpPass || cfg.wpPass || '')
        setPortfolio(editingSite.portfolio || 'tse')
        setServerType(resolvedServerType)
        setElementorEnabled(editingSite.elementorEnabled || false)
      }
      setSelectedDomain(null)
    } else {
      resetForm()
      setIsLoadingRegistry(true)

      Promise.all([
        getActiveRegistryDomainsApi(),
        getWebsitesApi()
      ]).then(([domains, sites]) => {
        if (Array.isArray(domains)) setRegistryDomains(domains)
        if (Array.isArray(sites)) setActiveConnectedSites(sites)
      }).catch(err => {
        console.error('Error fetching registry domains:', err)
      }).finally(() => {
        setIsLoadingRegistry(false)
      })
    }
  }, [isOpen, editingSite])

  // Compute available, unconnected active Site Registry domains
  const availableRegistryDomains = useMemo(() => {
    const allConnected = activeConnectedSites.length > 0 ? activeConnectedSites : connectedSites
    const connectedDomainIds = new Set(allConnected.map(s => s.domain_id || s.domainId).filter(Boolean))
    const unlinkedConnectedCanonicals = new Set(
      allConnected
        .filter(s => !s.domain_id && !s.domainId)
        .map(s => normalizeDomain(s.url) || normalizeDomain(s.name))
        .filter(Boolean)
    )

    const available = []

    for (const d of registryDomains) {
      if (!d || !d.id) continue
      if (d.status && String(d.status).toLowerCase() !== 'active') continue

      // 1. Primary identifier check: domain_id
      if (connectedDomainIds.has(d.id)) continue

      // 2. Secondary safeguard: if a connected site tile does not have domain_id set, match by canonical domain
      const dCanonical = normalizeDomain(d.canonical_domain)
      if (dCanonical && unlinkedConnectedCanonicals.has(dCanonical)) continue

      available.push(d)
    }

    return available
  }, [registryDomains, activeConnectedSites, connectedSites])

  // Filtered domains based on user search query
  const filteredRegistryDomains = useMemo(() => {
    if (!searchQuery.trim()) return availableRegistryDomains
    const q = searchQuery.toLowerCase().trim()
    return availableRegistryDomains.filter(d => {
      const nameMatch = d.display_name && d.display_name.toLowerCase().includes(q)
      const domainMatch = d.canonical_domain && d.canonical_domain.toLowerCase().includes(q)
      return nameMatch || domainMatch
    })
  }, [availableRegistryDomains, searchQuery])

  if (!isOpen) return null

  function resetForm() {
    setSelectedDomain(null)
    setSearchQuery('')
    setIsDropdownOpen(true)

    setWpName('')
    setWpUrl('')
    setWpUser('')
    setWpPass('')
    setPortfolio('tse')
    setServerType('Unknown')
    setElementorEnabled(false)

    setMgName('')
    setMgUrl('')
    setMgBackend('')
    setMgApi('')
    setMgUser('')
    setMgPass('')
    setMgStore('default')
    setMgPortfolio('tse')
    setMgServerType('Unknown')

    setIsConnecting(false)
    setErrorMsg(null)
    setStepStates({ api: 'pending', auth: 'pending', perms: 'pending' })
  }

  function handleSelectRegistryDomain(domain) {
    setSelectedDomain(domain)
    setIsDropdownOpen(false)
    setSearchQuery('')
    setErrorMsg(null)

    const cleanName = domain.display_name || domain.canonical_domain
    const cleanUrl = domain.primary_url || ('https://' + domain.canonical_domain)
    
    // Platform normalization
    const rawPlat = (domain.platform || '').toLowerCase()
    let mappedPlatform = 'wordpress'
    if (rawPlat === 'magento') mappedPlatform = 'magento'
    else if (rawPlat === 'other') mappedPlatform = 'other'
    setPlatform(mappedPlatform)

    // Portfolio normalization
    const rawPort = (domain.portfolio || '').toLowerCase()
    let mappedPort = 'tse'
    if (rawPort.includes('chili') || rawPort === 'scm') mappedPort = 'scm'
    else if (rawPort === 'client') mappedPort = 'client'
    else if (rawPort === 'internal') mappedPort = 'internal'
    else if (rawPort === 'other') mappedPort = 'other'

    setPortfolio(mappedPort)
    setMgPortfolio(mappedPort)

    // Populate WordPress
    setWpName(cleanName)
    setWpUrl(cleanUrl)

    // Populate Magento
    setMgName(cleanName)
    setMgUrl(cleanUrl)
    setMgBackend(domain.admin_url || (cleanUrl.replace(/\/$/, '') + '/admin'))
    setMgApi(cleanUrl.replace(/\/$/, '') + '/rest/V1')
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

    if (!editingSite && !selectedDomain) {
      setErrorMsg('Please select a website from Site Registry first.')
      return
    }

    const domainId = editingSite ? (editingSite.domain_id || editingSite.domainId || null) : selectedDomain?.id

    if (platform === 'magento') {
      if (!mgName.trim()) {
        setErrorMsg('Please enter a Website Name.')
        return
      }
      if (!mgUrl.trim()) {
        setErrorMsg('Please enter a Website URL.')
        return
      }
      if (!mgBackend.trim()) {
        setErrorMsg('Please enter a Magento Backend URL.')
        return
      }
      if (!mgApi.trim()) {
        setErrorMsg('Please enter an API Base URL.')
        return
      }
      if (!mgUser.trim()) {
        setErrorMsg('Please enter an API Username.')
        return
      }
      if (!mgPass.trim()) {
        setErrorMsg('Please enter an API Password / Token.')
        return
      }

      setIsConnecting(true)

      const targetId = editingSite?.id || String(Date.now())
      const authRes = await authorizeMagentoAdminTokenApi(targetId, mgUser.trim(), mgPass.trim(), mgApi.trim())
      if (!authRes.success) {
        setIsConnecting(false)
        setErrorMsg(authRes.message || 'Magento Admin Authentication Failed (HTTP 401). Please check Admin Username & Password.')
        return
      }

      const bearerToken = authRes.token || editingSite?.configData?.wpPass || editingSite?.wpPass || ''

      const magentoTile = {
        ...(editingSite || {}),
        id: targetId,
        domain_id: domainId,
        domainId: domainId,
        name: mgName.trim(),
        url: mgUrl.trim(),
        platform: 'magento',
        portfolio: mgPortfolio || 'tse',
        serverType: mgServerType || 'Unknown',
        wpUser: mgUser.trim(),
        wpPass: bearerToken,
        connectedUser: mgUser.trim(),
        configData: {
          ...(editingSite?.configData || {}),
          domain_id: domainId,
          domainId: domainId,
          wpUser: mgUser.trim(),
          wpPass: bearerToken,
          connectedUser: mgUser.trim(),
          serverType: mgServerType || 'Unknown',
          mgBackendUrl: mgBackend.trim(),
          apiBaseUrl: mgApi.trim(),
          mgStore: mgStore || 'default'
        },
        lifecycleStage: 3,
        topIndicator: 'connected',
        isSynchronised: false,
        lastSyncTimestamp: null,
        taskCount: 0,
        status: {
          connection:       { label: 'Connected',         value: 'Connected',          variant: 'green'  },
          platformApi:      { label: 'Magento API',       value: 'Securely Connected', variant: 'green', icon: 'lock' },
          configured:       { label: 'Configured',        value: 'Not Configured',     variant: 'grey'   },
          audited:          { label: 'Audited',           value: 'Not Audited',        variant: 'grey'   },
          tasksOutstanding: { label: 'Tasks Outstanding', value: '0 Outstanding',      variant: 'green'  },
        }
      }

      await saveWebsiteApi(magentoTile)

      if (editingSite && onUpdateWebsite) {
        onUpdateWebsite(magentoTile)
      } else if (onAddWebsite) {
        onAddWebsite(magentoTile)
      }

      setIsConnecting(false)
      resetForm()
      onClose()
      return
    }

    // WordPress Validation
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
          domain_id: domainId,
          domainId: domainId,
          name: wpName.trim(),
          url: wpUrl.trim(),
          platform: editingSite?.platform || 'wordpress',
          portfolio,
          serverType: serverType || 'Unknown',
          elementorEnabled,
          wpUser: wpUser.trim(),
          wpPass: wpPass.trim(),
          connectedUser: res.user ? res.user.name : wpUser.trim(),
          configData: {
            ...(editingSite?.configData || {}),
            domain_id: domainId,
            domainId: domainId,
            platform: editingSite?.platform || 'wordpress',
            wpUser: wpUser.trim(),
            wpPass: wpPass.trim(),
            connectedUser: res.user ? res.user.name : wpUser.trim(),
            serverType: serverType || 'Unknown',
          }
        }
        await saveWebsiteApi(updatedTile)
        onUpdateWebsite(updatedTile)
      } else {
        // Build new site linked to Site Registry domain_id
        const newTile = buildWordPressSite({
          id: Date.now(),
          domain_id: domainId,
          domainId: domainId,
          name: wpName.trim(),
          url: wpUrl.trim(),
          portfolio,
          serverType: serverType || 'Unknown',
          elementorEnabled,
          user: res.user,
          wpUser: wpUser.trim(),
          wpPass: wpPass.trim(),
          configData: {
            domain_id: domainId,
            domainId: domainId,
            adminUrl: selectedDomain?.admin_url || null
          }
        })

        await saveWebsiteApi(newTile)

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

  const canConnect = (!editingSite && !selectedDomain) ? false : (
    platform === 'magento'
      ? Boolean(mgName.trim() && mgUrl.trim() && mgBackend.trim() && mgApi.trim() && mgUser.trim() && mgPass.trim())
      : (platform === 'wordpress' ? Boolean(wpName.trim() && wpUrl.trim() && wpUser.trim() && wpPass.trim()) : false)
  )

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
          <div className="aw-header-title-wrap">
            <h2 className="aw-title" id="aw-title">{editingSite ? 'Edit Website Connection' : 'Connect New Website'}</h2>
            <span className="aw-header-badge">Site Registry Integrated</span>
          </div>
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

        {/* Form body */}
        <form id="aw-connect-form" className="aw-form" onSubmit={handleConnect}>
          {errorMsg && (
            <div className="aw-error-banner" role="alert">
              {errorMsg}
            </div>
          )}

          <div className="aw-two-column-layout">

            {/* ══════════════ LEFT COLUMN ══════════════ */}
            <div className="aw-column aw-column-left">

              {/* STEP 1: SITE REGISTRY DOMAIN SELECTION (Only when adding new website) */}
              {!editingSite && (
                <div className="aw-registry-section">
                  <label className="aw-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>SELECT WEBSITE (SITE REGISTRY)</span>
                    <span className="aw-available-count">
                      {isLoadingRegistry ? 'Loading active sites…' : `${availableRegistryDomains.length} active sites available`}
                    </span>
                  </label>

                  {!selectedDomain ? (
                    <div className="aw-dropdown-container">
                      <div className="aw-search-input-wrap">
                        <svg className="aw-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                        <input
                          type="text"
                          id="registry-domain-search"
                          className="aw-input aw-search-input"
                          placeholder="Search or select active website from Site Registry..."
                          value={searchQuery}
                          onChange={e => {
                            setSearchQuery(e.target.value)
                            setIsDropdownOpen(true)
                          }}
                          onFocus={() => setIsDropdownOpen(true)}
                          autoComplete="off"
                        />
                        {searchQuery && (
                          <button type="button" className="aw-clear-search-btn" onClick={() => setSearchQuery('')}>✕</button>
                        )}
                      </div>

                      {isDropdownOpen && (
                        <div className="aw-dropdown-list">
                          {filteredRegistryDomains.length === 0 ? (
                            <div className="aw-dropdown-empty">
                              {isLoadingRegistry ? 'Loading available active domains…' : 'No matching active unconnected websites found.'}
                            </div>
                          ) : (
                            filteredRegistryDomains.map(d => (
                              <div
                                key={d.id}
                                className="aw-dropdown-item"
                                onClick={() => handleSelectRegistryDomain(d)}
                              >
                                <span className="aw-item-domain">{d.canonical_domain}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Selected Registry Domain summary card */
                    <div className="aw-selected-card">
                      <div className="aw-selected-header">
                        <div className="aw-selected-info">
                          <div className="aw-selected-title-row">
                            <span className="aw-selected-title">{selectedDomain.display_name || selectedDomain.canonical_domain}</span>
                            <span className="aw-verified-pill">✓ Site Registry Verified</span>
                          </div>
                          <span className="aw-selected-url">{selectedDomain.primary_url || ('https://' + selectedDomain.canonical_domain)}</span>
                        </div>
                        <button
                          type="button"
                          className="aw-change-site-btn"
                          onClick={() => setSelectedDomain(null)}
                          disabled={isConnecting}
                        >
                          Change Website
                        </button>
                      </div>
                      <div className="aw-selected-meta">
                        <span className="aw-meta-item"><strong>Platform:</strong> {platform === 'magento' ? 'Magento' : 'WordPress'}</span>
                        <span className="aw-meta-item"><strong>Portfolio:</strong> {portfolio.toUpperCase()}</span>
                        <span className="aw-meta-item"><strong>Domain ID:</strong> <code>{selectedDomain.id.substring(0, 8)}…</code></span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Website Info fields (Left Column) */}
              {(editingSite || selectedDomain) && (
                <>
                  {platform === 'wordpress' && (
                    <>
                      <Field
                        label="Website Name"
                        id="wp-name"
                        placeholder="e.g. Ascent Builders"
                        value={wpName}
                        readOnly={true}
                        disabled={isConnecting}
                      />
                      <Field
                        label="Website URL"
                        id="wp-url"
                        placeholder="https://www.example.co.uk"
                        value={wpUrl}
                        readOnly={true}
                        disabled={isConnecting}
                      />
                      <PortfolioSelect
                        id="wp-portfolio"
                        value={portfolio}
                        readOnly={true}
                        disabled={isConnecting}
                      />
                      <ServerTypeSelect
                        id="wp-server-type"
                        value={serverType}
                        onChange={setServerType}
                        disabled={isConnecting}
                      />
                    </>
                  )}

                  {platform === 'magento' && (
                    <>
                      <Field label="Website Name" id="mg-name" value={mgName} readOnly={true} disabled={isConnecting} />
                      <Field label="Website URL (Frontend)" id="mg-url" value={mgUrl} readOnly={true} disabled={isConnecting} />
                      <Field label="Magento Backend URL" id="mg-backend" placeholder="https://www.example.co.uk/admin" value={mgBackend} onChange={setMgBackend} disabled={isConnecting} />
                      <PortfolioSelect id="mg-portfolio" value={mgPortfolio} readOnly={true} disabled={isConnecting} />
                      <ServerTypeSelect id="mg-server-type" value={mgServerType} onChange={setMgServerType} disabled={isConnecting} />
                    </>
                  )}
                </>
              )}

            </div>

            {/* ══════════════ RIGHT COLUMN ══════════════ */}
            <div className="aw-column aw-column-right">

              {(editingSite || selectedDomain) ? (
                <>
                  {/* Permanent / Read-only platform indicator */}
                  <div className="aw-platform-readonly-badge">
                    <span className="aw-section-subtitle">Platform: <strong>{platform === 'magento' ? 'Magento' : (platform === 'other' ? 'Other' : 'WordPress')}</strong></span>
                    <span className="aw-locked-badge">Locked to Site Registry</span>
                  </div>

                  {platform === 'wordpress' && (
                    <>
                      <Field
                        label="WordPress Admin Username"
                        id="wp-user"
                        placeholder="admin"
                        value={wpUser}
                        onChange={setWpUser}
                        disabled={isConnecting}
                      />
                      <PasswordField
                        label="WordPress Application Password"
                        id="wp-pass"
                        placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                        value={wpPass}
                        onChange={setWpPass}
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

                  {platform === 'magento' && (
                    <>
                      <Field label="API Base URL" id="mg-api" placeholder="https://www.example.co.uk/rest/V1" value={mgApi} onChange={setMgApi} disabled={isConnecting} />
                      <Field label="API Username" id="mg-api-user" placeholder="api_user" value={mgUser} onChange={setMgUser} disabled={isConnecting} />
                      <PasswordField label="API Password / Token" id="mg-api-pass" placeholder="••••••••••••••••" value={mgPass} onChange={setMgPass} disabled={isConnecting} />
                      <StoreViewSelect id="mg-store" value={mgStore} onChange={setMgStore} disabled={isConnecting} />
                    </>
                  )}

                  {platform === 'other' && (
                    <div className="aw-other-placeholder">
                      <span>Support for additional platforms is coming soon.</span>
                    </div>
                  )}
                </>
              ) : (
                /* Helper placeholder when no site is selected yet */
                <div className="aw-placeholder-right">
                  <div className="aw-placeholder-icon">🔗</div>
                  <h3 className="aw-placeholder-title">Select Website to Connect</h3>
                  <p className="aw-placeholder-desc">
                    Choose an active website from Site Registry on the left to automatically populate website metadata and configure connection credentials.
                  </p>
                </div>
              )}

            </div>

          </div>
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
                Reset Sync
              </button>
              <button
                type="button"
                className="aw-btn-delete"
                id="btn-delete-website"
                onClick={handleDelete}
                disabled={isConnecting}
              >
                Delete
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
              disabled={isConnecting || !canConnect}
            >
              {isConnecting ? (editingSite ? 'Updating…' : 'Connecting…') : (editingSite ? 'Update Connection' : 'Connect Website')}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
