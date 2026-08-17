import { useState, useEffect, useRef } from 'react'
import PageManagementPage from './PageManagementPage'
import PageAuditResultsPage from './PageAuditResultsPage'
import InternalLinkingPage from './InternalLinkingPage'
import GlobalSettings from './GlobalSettings'
import { extractPagesFromPackage, extractPostsFromPackage } from '../utils/packageExtractor'
import { fetchTseWordPressExportPackage, fetchMagentoExportPackage } from '../services/exporterApi'
import {
  getWpPackageApi,
  saveWpPackageApi,
  getPageConfigsApi,
  savePageConfigsApi
} from '../services/websiteManagerApi'
import { getSiteConfigsStorageKey, getSitePackageStorageKey } from '../utils/siteKeyHelper'
import './ManageWebsitePage.css'

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  </svg>
)

const FileTextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)

const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

const SlidersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/><line x1="18" y1="16" x2="22" y2="16"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const BrainIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.5 7.572A4 4 0 0 0 6 19a3.5 3.5 0 0 0 6 0 3.5 3.5 0 0 0 6 0 4 4 0 0 0 2.497-6.303 4 4 0 0 0-2.5-7.572A3 3 0 0 0 12 5z"/>
  </svg>
)

const RefreshCwIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 16h5v5"/>
  </svg>
)

function formatNowDDMMYYYYHHMM() {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}-${month}-${year} ${hours}:${minutes}`
}

export default function ManageWebsitePage({ site: rawSite, onBack, onUpdateSite }) {
  const site = rawSite ? {
    ...rawSite,
    wpUser: rawSite.wpUser || rawSite.connectedUser || rawSite.configData?.wpUser || rawSite.configData?.connectedUser || '',
    wpPass: rawSite.wpPass || rawSite.configData?.wpPass || ''
  } : rawSite

  const isMagento = site?.platform === 'magento' || site?.platform === 'Magento'
  const platformName = isMagento ? 'Magento' : 'WordPress'

  const syncStages = [
    'Preparing synchronisation...',
    `Connecting to ${platformName}...`,
    isMagento ? 'Calling Magento REST API...' : 'Calling TSE WordPress Exporter...',
    'Waiting for API response...',
    'Receiving synchronisation package...',
    'Saving package...',
    'Synchronisation complete.',
  ]

  const [apiConfigs, setApiConfigs] = useState({})
  const activeTabStorageKey = site?.id ? `tse_active_tab_${site.id}` : 'tse_active_tab_default'

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem(activeTabStorageKey)
      if (saved) return saved
    } catch (e) {
      console.error('Failed to load active tab from localStorage:', e)
    }
    return 'w2'
  })

  useEffect(() => {
    try {
      localStorage.setItem(activeTabStorageKey, activeTab)
    } catch (e) {
      console.error('Failed to save active tab to localStorage:', e)
    }
  }, [activeTab, activeTabStorageKey])

  const packageStorageKey = getSitePackageStorageKey(site)

  const [storedPackageData, setStoredPackageData] = useState(() => {
    try {
      const saved = localStorage.getItem(packageStorageKey) || (site?.id ? localStorage.getItem(`tse_wp_package_${site.id}`) : null)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.packageData) return parsed.packageData
        else if (parsed) return parsed
      }
    } catch (e) {
      console.error('Failed to load saved WP package from localStorage:', e)
    }
    return site ? site.storedPackageData || null : null
  })

  const [isPackageHydrated, setIsPackageHydrated] = useState(() => {
    try {
      const saved = localStorage.getItem(packageStorageKey) || (site?.id ? localStorage.getItem(`tse_wp_package_${site.id}`) : null)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && (parsed.packageData || (Array.isArray(parsed.pages) && parsed.pages.length > 0) || (Array.isArray(parsed.posts) && parsed.posts.length > 0))) {
          return true
        }
      }
    } catch (e) {}
    return Boolean(site && site.storedPackageData)
  })

  const [_hasSyncHeader, setHasSyncHeader] = useState(() => {
    try {
      const saved = localStorage.getItem(packageStorageKey) || (site?.id ? localStorage.getItem(`tse_wp_package_${site.id}`) : null)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.isSynchronised) return true
      }
    } catch (e) {
      // ignore
    }
    return Boolean(site && site.isSynchronised === true && site.lastSyncTimestamp)
  })

  const [lastSyncDate, setLastSyncDate] = useState(() => {
    try {
      const saved = localStorage.getItem(packageStorageKey) || (site?.id ? localStorage.getItem(`tse_wp_package_${site.id}`) : null)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.lastSyncTimestamp) return parsed.lastSyncTimestamp
      }
    } catch (e) {
      // ignore
    }
    return site ? site.lastSyncTimestamp : null
  })

  const [isSyncing, setIsSyncing] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const [syncError, setSyncError] = useState(null)
  const [selectedPageForAudit, setSelectedPageForAudit] = useState(null)

  // Extract exported pages and posts using resilient package extractor
  const pkg = storedPackageData || site?.storedPackageData
  const rawExportedPages = extractPagesFromPackage(pkg)
  const _exportedPosts = extractPostsFromPackage(pkg)

  // Merge localStorage page configurations so targetPhrase, priority, and type are preserved globally
  const siteIdKey = getSiteConfigsStorageKey(site)
  const savedConfigs = (() => {
    try {
      const saved = localStorage.getItem(siteIdKey)
      const localMap = saved ? JSON.parse(saved) : {}
      const apiMap = apiConfigs || {}

      const merged = { ...apiMap }
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

  const exportedPages = rawExportedPages.map(page => {
    const pageKey = page.id || page.url
    const override = savedConfigs[pageKey] || (page.url ? savedConfigs[page.url] : null)
    const targetPhraseStr = (override?.targetPhrase || override?.target || page.targetPhrase || page.target || '').trim()
    const isConfigured = Boolean(targetPhraseStr.length > 0)

    if (override) {
      return {
        ...page,
        title: override.proposedTitle || page.title,
        proposedTitle: override.proposedTitle || page.title,
        target: targetPhraseStr,
        targetPhrase: targetPhraseStr,
        type: override.type || page.type,
        seoPageType: override.type || page.type,
        priority: override.priority !== undefined ? override.priority : page.priority,
        isManualOverride: override.isManualOverride !== undefined ? override.isManualOverride : page.isManualOverride,
        isConfigured,
        isExcluded: override.isExcluded !== undefined ? override.isExcluded : page.isExcluded,
      }
    }
    return {
      ...page,
      target: targetPhraseStr,
      targetPhrase: targetPhraseStr,
      isConfigured
    }
  })

  // Operational synced state MUST require an actual hydrated package/page inventory
  const isSynced = Boolean(pkg && exportedPages.length > 0)

  // Dynamic calculated metrics from stored package pages matching W3 EXACTLY
  const configuredPagesCount = exportedPages.filter(p => p.isConfigured === true && !p.isExcluded && p.type !== 'Excluded').length
  const actionRequiredCount = exportedPages.filter(p => p.isConfigured !== true && !p.isExcluded && p.type !== 'Excluded').length
  const excludedPagesCount = exportedPages.filter(p => p.isExcluded === true || p.type === 'Excluded').length
  const unconfiguredPagesCount = actionRequiredCount

  const timerRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    if (site?.id) {
      // 1. Fetch package data from SQLite API
      getWpPackageApi(site.id).then(pkgRes => {
        if (!isMounted) return
        if (pkgRes && (pkgRes.packageData || pkgRes.pages)) {
          setHasSyncHeader(true)
          if (pkgRes.lastSyncTimestamp) setLastSyncDate(pkgRes.lastSyncTimestamp)
          const cleanPkg = pkgRes.packageData || pkgRes
          setStoredPackageData(cleanPkg)
        }
        setIsPackageHydrated(true)
      }).catch(() => {
        if (isMounted) setIsPackageHydrated(true)
      })

      // 2. Fetch page configurations from SQLite API
      getPageConfigsApi(site.id).then(configs => {
        if (isMounted && configs) {
          setApiConfigs(configs)
        }
      }).catch(() => {})
    } else {
      setIsPackageHydrated(true)
    }
    return () => { isMounted = false }
  }, [site?.id])

  useEffect(() => {
    if (!isPackageHydrated) return

    // Do NOT force redirect to W2 if stored package data exists or package is still hydrating
    if (!storedPackageData && !site?.storedPackageData && (!isSynced || exportedPages.length === 0)) {
      if (activeTab !== 'w2') {
        setActiveTab('w2')
      }
    }
  }, [isPackageHydrated, storedPackageData, site?.storedPackageData, isSynced, exportedPages.length, activeTab])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  if (!site) return null

  const handleSynchroniseClick = async () => {
    if (isSyncing) return
    setIsSyncing(true)
    setSyncError(null)
    setStageIndex(0)

    const isMagento = site?.platform === 'magento' || site?.platform === 'Magento'
    const cfg = site?.configData || {}

    // Call Exporter Service (WordPress vs Magento)
    const exporterPromise = isMagento
      ? fetchMagentoExportPackage({
          websiteId: site.id,
          site
        })
      : fetchTseWordPressExportPackage({
          websiteUrl: site.url,
          username: site.wpUser || site.connectedUser || '',
          applicationPassword: site.wpPass || '',
        })

    let idx = 0
    timerRef.current = setInterval(async () => {
      idx += 1
      if (idx < syncStages.length - 1) {
        setStageIndex(idx)
      } else {
        clearInterval(timerRef.current)
        timerRef.current = null

        // Await real Exporter response
        const result = await exporterPromise

        const resPages = extractPagesFromPackage(result.packageData)

        if (result.success && result.packageData && resPages.length > 0) {
          setStageIndex(6) // Synchronisation complete.
          
          const normalizedPackageData = {
            ...(typeof result.packageData === 'object' && result.packageData !== null ? result.packageData : {}),
            pages: resPages,
          }

          setStoredPackageData(normalizedPackageData)
          const completedTime = formatNowDDMMYYYYHHMM()
          setLastSyncDate(completedTime)

          // Intelligent Audit Freshness Tracking: Compare per-page fingerprints
          try {
            const auditStorageKey = site?.id ? `tse_page_audits_${site.id}` : 'tse_page_audits_default'
            const storedAudits = JSON.parse(localStorage.getItem(auditStorageKey) || '{}')
            let auditsUpdated = false

            resPages.forEach(p => {
              const pageKey = p.url || p.id
              const record = storedAudits[pageKey] || (p.url ? storedAudits[p.url] : null)

              if (record && record.isAudited) {
                const newFingerprint = generatePageSeoFingerprint(p)
                const prevFingerprint = record.fingerprint

                if (prevFingerprint && prevFingerprint !== newFingerprint) {
                  // Material SEO change detected! Flag page for re-audit (Audited ?)
                  record.isStale = true
                  record.staleReason = `Page content or SEO elements modified in ${platformName}`
                  auditsUpdated = true
                } else if (prevFingerprint && prevFingerprint === newFingerprint) {
                  // No material SEO change: Keep Audited ✓ (Green)
                  record.isStale = false
                  record.staleReason = null
                  auditsUpdated = true
                }
              }
            })

            if (auditsUpdated) {
              localStorage.setItem(auditStorageKey, JSON.stringify(storedAudits))
            }
          } catch (e) {
            console.error('Failed during post-sync audit freshness tracking:', e)
          }

          // Save package to SQLite API backend (updates wp_packages + websites.sync_status in one transaction)
          try {
            await saveWpPackageApi(site.id, normalizedPackageData)
          } catch (e) {
            console.error('Failed to save package to backend API:', e)
          }

          const updatedSite = {
            ...site,
            isSynchronised: true,
            lastSyncTimestamp: completedTime,
            storedPackageData: normalizedPackageData,
          }

          if (onUpdateSite) {
            onUpdateSite(updatedSite)
          }

          setTimeout(() => {
            setHasSyncHeader(true)
            setIsSyncing(false)
          }, 500)
        } else if (result.success && result.packageData && resPages.length === 0) {
          setIsSyncing(false)
          setHasSyncHeader(false)
          setSyncError(`${platformName} connected, but returned 0 pages. Please verify API configuration.`)
        } else {
          // If exporter call fails: Keep banner visible and show error
          setIsSyncing(false)
          setHasSyncHeader(false)
          setSyncError(result.message || `Failed to connect to ${platformName} API endpoint.`)
        }
      }
    }, 500)
  }

  if (activeTab === 'w5' || activeTab === 'w5_all_internal_links' || activeTab === 'w4_internal_linking' || activeTab === 'w4-internal-linking' || activeTab === 'w5_review_links') {
    return (
      <InternalLinkingPage
        site={site}
        pagesList={exportedPages}
        isLoadingPackage={!isPackageHydrated}
        initialSelectedUrl={selectedPageForAudit?.url}
        onNavigateBack={() => setActiveTab('w2')}
        onNavigateTab={(tab) => {
          if (tab === 'w3-manage-pages') setActiveTab('w3')
          else if (tab === 'w4-audit-results') setActiveTab('w4')
          else if (tab === 'w5-internal-linking' || tab === 'w4-internal-linking') setActiveTab('w4_internal_linking')
          else setActiveTab('w2')
        }}
      />
    )
  }

  if (activeTab === 'w3_audit_results' || activeTab === 'w4') {
    return (
      <PageAuditResultsPage
        site={site}
        page={selectedPageForAudit || exportedPages[0]}
        pagesList={exportedPages}
        onBack={() => setActiveTab('w3')}
        onSyncFromWordPress={handleSynchroniseClick}
        isSyncing={isSyncing}
        onNavigateToInternalLinking={(url) => {
          if (url) {
            const matched = exportedPages.find(p => p.url === url)
            if (matched) setSelectedPageForAudit(matched)
          }
          setActiveTab('w4_internal_linking')
        }}
      />
    )
  }

  if (activeTab === 'w3') {
    return (
      <PageManagementPage
        site={site}
        storedPackageData={storedPackageData || site.storedPackageData}
        onBack={() => setActiveTab('w2')}
        onTabChange={(tab) => setActiveTab(tab)}
        onSyncFromWordPress={handleSynchroniseClick}
        isSyncing={isSyncing}
        onViewAudit={(page) => {
          setSelectedPageForAudit(page)
          if (page && page.url) {
            try {
              localStorage.setItem(`tse_audit_selected_url_${site?.id || 'default'}`, page.url)
            } catch (e) {
              // ignore
            }
          }
          setActiveTab('w3_audit_results')
        }}
      />
    )
  }

  const progressPercent = Math.round(((stageIndex + 1) / syncStages.length) * 100)

  return (
    <div className="w2-dashboard">

      {/* ── Top Back Button ── */}
      <div className="w2-back-row">
        <button
          type="button"
          className="w2-btn-back"
          onClick={onBack}
          id="btn-back-to-websites"
        >
          ← Back to All Connected Websites
        </button>
      </div>

      {/* ── Stage 3: Unsynchronised Prominent Banner ── */}
      {isPackageHydrated && (!isSynced || exportedPages.length === 0) && (
        <div className={`w2-unsynced-banner ${syncError ? 'banner-error' : ''}`} role="alert" id="banner-unsynchronised">
          {!isSyncing ? (
            <>
              <div className="w2-banner-text">
                <h2 className="w2-banner-heading">
                  {syncError ? 'Synchronisation Failed' : (exportedPages.length === 0 && isSynced ? 'Synchronisation Package Required' : 'This website has not yet been synchronised.')}
                </h2>
                <p className="w2-banner-explanation">
                  {syncError ? syncError : (exportedPages.length === 0 && isSynced ? `Page inventory is empty. Click Synchronise Website to fetch pages from ${platformName}.` : 'Synchronisation is required before pages, audits and other website data become available.')}
                </p>
              </div>
              <button
                type="button"
                className="w2-btn-sync-primary"
                id="btn-synchronise-website"
                onClick={handleSynchroniseClick}
              >
                <RefreshCwIcon />
                {syncError ? 'Retry Synchronisation' : 'Synchronise Website'}
              </button>
            </>
          ) : (
            <div className="w2-sync-progress-panel" id="sync-progress-panel">
              <div className="w2-sync-progress-header">
                <div className="w2-sync-stage-title">
                  <RefreshCwIcon className="icon-spin" />
                  <span>Stage {stageIndex + 1} of {syncStages.length}: {syncStages[stageIndex]}</span>
                </div>
                <span className="w2-sync-percent">{progressPercent}%</span>
              </div>
              <div className="w2-progress-bar-track">
                <div className="w2-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Header Title & Main Action Buttons ── */}
      <div className="w2-header">
        <div className="w2-header-title-meta">
          <span className="w2-pill-tag">W2 | WEBSITE DASHBOARD</span>
          <h1 className="w2-site-name">{site.name}</h1>
          <a
            href={site.url}
            target="_blank"
            rel="noreferrer"
            className="w2-site-url"
          >
            {site.url} <ExternalLinkIcon />
          </a>
        </div>

        <div className="w2-header-actions">
          <button type="button" className="w2-btn-secondary" id="btn-sync-from-other">
            Sync from Other
          </button>
          <button
            type="button"
            className="w2-btn-amber"
            id="btn-latest-audit-results"
            onClick={() => setActiveTab('w3_audit_results')}
          >
            Latest Audit Results
          </button>
          <button type="button" className="w2-btn-emerald" id="btn-run-audit">
            Run Audit ▷
          </button>
        </div>
      </div>

      {/* Proof Banner for Stored Package Data */}
      {storedPackageData && exportedPages.length > 0 && (
        <div className="w2-package-proof-badge" id="package-proof-badge">
          <span>Package Stored: ID {storedPackageData.packageId || 'UUID'} ({exportedPages.length} Pages Exported)</span>
        </div>
      )}

      {/* ── 6 Stat Summary Metric Cards ── */}
      <div className="w2-stats-grid">
        <div className="w2-stat-card">
          <span className="w2-stat-label">WEBSITE STATUS</span>
          <span className="w2-stat-val val-connected">
            {site.topIndicator ? site.topIndicator.charAt(0).toUpperCase() + site.topIndicator.slice(1) : 'Connected'}
          </span>
        </div>
        <div className="w2-stat-card">
          <span className="w2-stat-label">TOTAL PAGES FOUND</span>
          <span className="w2-stat-val val-white">{isSynced ? exportedPages.length : 0}</span>
        </div>
        <div className="w2-stat-card">
          <span className="w2-stat-label">CONFIGURED PAGES</span>
          <span className="w2-stat-val val-emerald">{isSynced ? configuredPagesCount : 0}</span>
        </div>
        <div className="w2-stat-card">
          <span className="w2-stat-label">UNCONFIGURED PAGES</span>
          <span className="w2-stat-val val-slate">{isSynced ? unconfiguredPagesCount : 0}</span>
        </div>
        <div className="w2-stat-card">
          <span className="w2-stat-label">ACTION REQUIRED</span>
          <span className="w2-stat-val val-amber">{isSynced ? actionRequiredCount : 0}</span>
        </div>
        <div className="w2-stat-card">
          <span className="w2-stat-label">EXCLUDED PAGES</span>
          <span className="w2-stat-val val-slate">{isSynced ? excludedPagesCount : 0}</span>
        </div>
      </div>

      {/* ── 4 Main Feature Cards ── */}
      <div className="w2-feature-cards-grid">

        {/* Card 1: Manage Pages */}
        <div className={`w2-feature-card theme-emerald ${!isSynced ? 'card-locked' : ''}`}>
          <div className="w2-fc-header">
            <div className="w2-fc-icon-bg">
              <FileTextIcon />
            </div>
            <h3 className="w2-fc-title">Manage Pages</h3>
          </div>
          <p className="w2-fc-desc">
            Configure pages, targets, priorities and page settings.
          </p>
          <ul className="w2-fc-checklist">
            <li><span className="chk-icon">✓</span> Set target keywords and priorities</li>
            <li><span className="chk-icon">✓</span> Manage page configuration</li>
            <li><span className="chk-icon">✓</span> Include / exclude pages</li>
            <li><span className="chk-icon">✓</span> Bulk actions and exports</li>
          </ul>
          {isSynced ? (
            <button
              type="button"
              className="w2-fc-btn btn-open-emerald"
              id="btn-open-pages"
              onClick={() => setActiveTab('w3')}
            >
              Open Pages ›
            </button>
          ) : (
            <button type="button" className="w2-fc-btn btn-open-disabled" id="btn-open-pages" disabled>
              Locked (Requires Synchronisation)
            </button>
          )}
          <span className="w2-fc-tag">
            {isSynced ? 'W3 | PAGE MANAGEMENT' : 'W3 | PAGE MANAGEMENT (LOCKED)'}
          </span>
        </div>

        {/* Card 2: All Internal Links */}
        <div className="w2-feature-card theme-purple">
          <div className="w2-fc-header">
            <div className="w2-fc-icon-bg">
              <LinkIcon />
            </div>
            <h3 className="w2-fc-title">All Internal Links</h3>
          </div>
          <p className="w2-fc-desc">
            Review internal linking, orphan pages and AI recommendations.
          </p>
          <ul className="w2-fc-checklist">
            <li><span className="chk-icon">✓</span> Internal link analysis</li>
            <li><span className="chk-icon">✓</span> Orphan and weak pages</li>
            <li><span className="chk-icon">✓</span> AI link recommendations</li>
            <li><span className="chk-icon">✓</span> Link opportunities report</li>
          </ul>
          <button
            type="button"
            className="w2-fc-btn btn-open-purple"
            id="btn-open-links"
            onClick={() => setActiveTab('w4_internal_linking')}
          >
            View All Internal Links ›
          </button>
          <span className="w2-fc-tag">W5 | ALL INTERNAL LINKS</span>
        </div>

        {/* Card 3: Site Analysis */}
        <div className="w2-feature-card theme-blue">
          <div className="w2-fc-header">
            <div className="w2-fc-icon-bg">
              <ActivityIcon />
            </div>
            <h3 className="w2-fc-title">Site Analysis</h3>
          </div>
          <p className="w2-fc-desc">
            Review your site's structure, content and optimisation.
          </p>
          <ul className="w2-fc-checklist">
            <li><span className="chk-icon">✓</span> Site Structure</li>
            <li><span className="chk-icon">✓</span> Internal Links</li>
            <li><span className="chk-icon">✓</span> External Links</li>
            <li><span className="chk-icon">✓</span> Content Coverage</li>
          </ul>
          <button type="button" className="w2-fc-btn btn-open-blue" id="btn-open-site-analysis">
            Open Site Analysis ›
          </button>
          <span className="w2-fc-tag">W6 | SITE ANALYSIS</span>
        </div>

        {/* Card 4: Website Settings */}
        <div className="w2-feature-card theme-amber">
          <div className="w2-fc-header">
            <div className="w2-fc-icon-bg">
              <SlidersIcon />
            </div>
            <h3 className="w2-fc-title">Website Settings</h3>
          </div>
          <p className="w2-fc-desc">
            Manage website options, platform, portfolio and configuration.
          </p>
          <ul className="w2-fc-checklist">
            <li><span className="chk-icon">✓</span> Website classification</li>
            <li><span className="chk-icon">✓</span> Platform and API settings</li>
            <li><span className="chk-icon">✓</span> Portfolio management</li>
            <li><span className="chk-icon">✓</span> General configuration</li>
          </ul>
          <button type="button" className="w2-fc-btn btn-open-amber" id="btn-open-settings">
            Open Settings ›
          </button>
          <span className="w2-fc-tag">W7 | WEBSITE SETTINGS</span>
        </div>

      </div>

      {/* ── Section Title: WEBSITE INTELLIGENCE ── */}
      <div className="w2-section-heading">
        <h2>WEBSITE INTELLIGENCE</h2>
      </div>

      {/* ── 4 Intelligence Cards Grid ── */}
      <div className="w2-intel-grid">

        {/* Card 1: Recent Activity */}
        <div className="w2-intel-card">
          <div className="w2-ic-header">
            <span className="ic-title-wrap"><ClockIcon /> Recent Activity</span>
            <button type="button" className="ic-link">View All</button>
          </div>
          <div className="w2-activity-list">
            {isSynced ? (
              <>
                <div className="act-row">
                  <span className="act-label">{platformName} sync completed</span>
                  <span className="act-time">{lastSyncDate || '07-08-2026 08:15'}</span>
                </div>
                <div className="act-row">
                  <span className="act-label">{exportedPages.length} pages discovered</span>
                  <span className="act-time">{lastSyncDate || '07-08-2026 08:15'}</span>
                </div>
              </>
            ) : (
              <div className="act-row">
                <span className="act-label">{platformName} connection established</span>
                <span className="act-time">Just now</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Last Audit */}
        <div className="w2-intel-card">
          <div className="w2-ic-header">
            <span className="ic-title-wrap">📄 Last Audit</span>
            <button type="button" className="ic-link">View Report</button>
          </div>
          <div className="w2-audit-body">
            <div className="audit-gauge">
              <span className="gauge-score">—</span>
            </div>
            <div className="audit-details">
              <span className="audit-label">Overall Score</span>
              <span className="audit-rating">Not Audited</span>
              <span className="audit-sub">
                {isSynced ? 'Pending site audit' : 'Pending initial synchronisation'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: AI Recommendations */}
        <div className="w2-intel-card">
          <div className="w2-ic-header">
            <span className="ic-title-wrap">⚛ AI Recommendations</span>
            <button type="button" className="ic-link">View All</button>
          </div>
          <div className="w2-ai-body">
            <div className="ai-content">
              <span className="ai-count">0 Available</span>
              <span className="ai-sub">Improve internal linking and technical SEO.</span>
              <button type="button" className="btn-ai-recs" disabled={!isSynced}>
                View Recommendations ›
              </button>
            </div>
            <div className="ai-icon-side">
              <BrainIcon />
            </div>
          </div>
        </div>

        {/* Card 4: Website Status */}
        <div className="w2-intel-card">
          <div className="w2-ic-header">
            <span className="ic-title-wrap">🖥 Website Status</span>
            <button type="button" className="ic-link">View Details</button>
          </div>
          <div className="w2-status-body">
            <div className="status-content">
              <span className="status-success-title">
                {site.topIndicator ? site.topIndicator.charAt(0).toUpperCase() + site.topIndicator.slice(1) : 'Connected'}
              </span>
              <span className="status-sub">
                {isSynced ? `Last sync: ${lastSyncDate || '07-08-2026 08:15'}` : 'Sync: Pending'}
              </span>
              <span className="status-sub">
                {isSynced ? `Pages crawled: ${exportedPages.length}` : 'Pages: Not extracted'}
              </span>
              <span className="status-sub">
                {isSynced ? `Unconfigured pages: ${unconfiguredPagesCount}` : 'Status: Ready to Sync'}
              </span>
            </div>
            <div className="status-icon-side">
              <CheckCircleIcon />
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
