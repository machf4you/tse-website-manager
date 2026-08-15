import { useState, useEffect } from 'react'
import { extractPagesFromPackage } from '../utils/packageExtractor'
import { getSiteConfigsStorageKey, getSiteAuditsStorageKey, getSitePackageStorageKey } from '../utils/siteKeyHelper'
import { getPageConfigsApi, getWpPackageApi } from '../services/websiteManagerApi'
import './WebsiteTile.css'

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M15 3h6v6"/><path d="M10 14 21 3"/>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  </svg>
)

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" className="lock-icon">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

/* ── Status badge variants ─────────────────────────────────────────────────── */
function StatusBadge({ value, variant, icon }) {
  return (
    <span className={`status-badge badge-${variant}`}>
      {icon === 'lock' && <LockIcon />}
      {value}
    </span>
  )
}

/* ── Main tile ─────────────────────────────────────────────────────────────── */
const INDICATOR = {
  connected:    { label: 'CONNECTED',    cls: 'status-connected'    },
  partial:      { label: 'PARTIAL',      cls: 'status-partial'      },
  disconnected: { label: 'DISCONNECTED', cls: 'status-disconnected' },
  pending:      { label: 'PENDING',      cls: 'status-pending'      },
  connecting:   { label: 'CONNECTING…',  cls: 'status-connecting'   },
}

export default function WebsiteTile({ site, onManage, onEdit }) {
  const [apiConfigs, setApiConfigs] = useState({})
  const [apiPackageData, setApiPackageData] = useState(null)

  useEffect(() => {
    let isMounted = true
    if (site?.id) {
      getPageConfigsApi(site.id).then(configs => {
        if (isMounted && configs) {
          setApiConfigs(configs)
        }
      }).catch(() => {})

      getWpPackageApi(site.id).then(pkgRes => {
        if (!isMounted) return
        if (pkgRes && pkgRes.packageData) {
          setApiPackageData(pkgRes.packageData)
        } else if (pkgRes) {
          setApiPackageData(pkgRes)
        }
      }).catch(() => {})
    }
    return () => { isMounted = false }
  }, [site?.id])

  // 1. Calculate live pages & configured metrics
  const packageStorageKey = getSitePackageStorageKey(site)
  let pkg = apiPackageData || site?.storedPackageData
  if (!pkg) {
    try {
      const savedPkg = localStorage.getItem(packageStorageKey)
      if (savedPkg) {
        const parsed = JSON.parse(savedPkg)
        if (parsed && parsed.packageData) pkg = parsed.packageData
        else if (parsed) pkg = parsed
      }
    } catch (e) {
      // ignore
    }
  }

  const rawPages = extractPagesFromPackage(pkg)
  const totalPages = rawPages.length

  const hasValidPackage = totalPages > 0 || Boolean(pkg && (pkg.pages?.length > 0 || pkg.posts?.length > 0 || pkg.data?.pages?.length > 0))

  const isConnected = Boolean(
    site.syncStatus === 'Synced' ||
    site.sync_status === 'Synced' ||
    site.syncStatus === 'Connected' ||
    site.sync_status === 'Connected' ||
    site.isSynchronised === true ||
    site.topIndicator === 'connected' ||
    hasValidPackage
  )
  const ind = isConnected ? INDICATOR.connected : (INDICATOR[site.topIndicator] || INDICATOR.disconnected)

  const siteIdKey = getSiteConfigsStorageKey(site)
  const savedConfigs = (() => {
    try {
      const saved = localStorage.getItem(siteIdKey)
      const localMap = saved ? JSON.parse(saved) : {}
      const merged = { ...(apiConfigs || {}) }
      Object.keys(localMap).forEach(key => {
        const localItem = localMap[key]
        const apiItem = merged[key]
        if (localItem && (localItem.targetPhrase || localItem.isConfigured || !apiItem || !apiItem.targetPhrase)) {
          merged[key] = { ...(apiItem || {}), ...localItem }
        }
      })
      return merged
    } catch (e) {
      return apiConfigs || {}
    }
  })()

  const configuredPagesCount = rawPages.filter(p => {
    const override = (p.url ? savedConfigs[p.url] : null) ||
                     (p.url ? savedConfigs[p.url.replace(/\/$/, '')] : null) ||
                     (p.url ? savedConfigs[p.url + '/'] : null) ||
                     (p.id ? savedConfigs[p.id] : null)

    const targetPhraseStr = (override?.targetPhrase || override?.target || p.targetPhrase || p.target || '').trim()
    const isConfigured = Boolean(targetPhraseStr.length > 0)
    const isExcluded = Boolean(override?.isExcluded || override?.type === 'Excluded' || p.isExcluded || p.type === 'Excluded')
    return isConfigured && !isExcluded
  }).length

  let configuredText = totalPages > 0 ? `${configuredPagesCount} of ${totalPages}` : 'Not Configured'
  let configuredVariant = totalPages > 0 ? (configuredPagesCount === totalPages ? 'green' : (configuredPagesCount > 0 ? 'amber' : 'grey')) : 'grey'

  let serverTypeValue = site.serverType || site.server_type || site.configData?.serverType || 'Unknown'
  let serverTypeVariant = 'grey'
  if (serverTypeValue === 'Caddy') serverTypeVariant = 'blue'
  else if (serverTypeValue === 'LiteSpeed') serverTypeVariant = 'green'
  else if (serverTypeValue === 'Nginx') serverTypeVariant = 'purple'
  else if (serverTypeValue === 'Apache') serverTypeVariant = 'amber'

  const liveStatusRows = [
    { label: 'Connection',       value: isConnected ? 'Connected' : 'Disconnected', variant: isConnected ? 'green' : 'red' },
    { label: 'WordPress API',    value: isConnected ? 'Securely Connected' : 'Not Connected', variant: isConnected ? 'green' : 'grey', icon: isConnected ? 'lock' : null },
    { label: 'Server Type',      value: serverTypeValue, variant: serverTypeVariant },
    { label: 'Total Pages',      value: totalPages > 0 ? String(totalPages) : '0', variant: totalPages > 0 ? 'green' : 'grey' },
    { label: 'Configured',       value: configuredText, variant: configuredVariant },
  ]

  return (
    <div className="website-tile" role="article" aria-label={`${site.name} website tile`}>

      {/* ── Top row: connection status ── */}
      <div className="tile-top-row">
        <span className={`connection-status ${ind.cls}`}>
          <span className="connection-dot" aria-hidden="true" />
          {ind.label}
        </span>
      </div>

      {/* ── Site name ── */}
      <h3 className="tile-site-name">{site.name}</h3>

      {/* ── Site URL ── */}
      <a
        href={site.url}
        target="_blank"
        rel="noreferrer"
        className="tile-site-url"
        aria-label={`Visit ${site.url}`}
      >
        {site.url} <ExternalLinkIcon />
      </a>

      {/* ── Status panel ── */}
      <div className="tile-status-panel">
        <div className="status-panel-header">
          <span>STATUS</span>
        </div>

        {liveStatusRows.map((row, i) => (
          <div key={i} className="status-row">
            <span className="status-row-label">{row.label}</span>
            <StatusBadge value={row.value} variant={row.variant} icon={row.icon} />
          </div>
        ))}
      </div>

      {/* ── Primary button ── */}
      <button
        type="button"
        className="tile-btn-primary"
        id={`btn-manage-${site.id}`}
        onClick={() => onManage && onManage(site)}
      >
        Manage Website
      </button>

      {/* ── Secondary button ── */}
      <button
        type="button"
        className="tile-btn-secondary"
        id={`btn-edit-${site.id}`}
        onClick={() => onEdit && onEdit(site)}
      >
        Edit Website
      </button>

    </div>
  )
}
