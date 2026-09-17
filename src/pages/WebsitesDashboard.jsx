import { useState, useEffect } from 'react'
import WebsiteTile from '../components/WebsiteTile'
import AddWebsiteDialog from '../components/AddWebsiteDialog'
import ManageWebsitePage from './ManageWebsitePage'
import {
  getWebsitesApi,
  saveWebsiteApi,
  saveWebsitesBatchApi,
  deleteWebsiteApi,
  triggerLocalStorageMigrationApi,
  getActiveRegistryDomainsApi
} from '../services/websiteManagerApi'
import { useWebsiteManagerRealtime } from '../services/supabaseRealtime'
import './WebsitesDashboard.css'

export default function WebsitesDashboard({ currentPath, navigate }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState(null)
  const [sites, setSites] = useState(() => {
    try {
      const saved = localStorage.getItem('tse_website_dashboard_sites')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {}
    return []
  })

  // Real-time multi-user synchronization hook
  useWebsiteManagerRealtime({
    onWebsiteChanged: ({ action, siteId, site: updatedSite, sites: batchSites }) => {
      if (action === 'delete') {
        setSites(prev => prev.filter(s => String(s.id) !== String(siteId)))
        setManagedSiteState(prev => (prev && String(prev.id) === String(siteId) ? null : prev))
      } else if (action === 'batch' && Array.isArray(batchSites)) {
        setSites(batchSites)
      } else if (updatedSite && updatedSite.id !== undefined) {
        setSites(prev => {
          const exists = prev.some(s => String(s.id) === String(updatedSite.id))
          if (exists) {
            return prev.map(s => String(s.id) === String(updatedSite.id) ? { ...s, ...updatedSite } : s)
          }
          return [updatedSite, ...prev]
        })
        setManagedSiteState(prev => {
          if (prev && String(prev.id) === String(updatedSite.id)) {
            return { ...prev, ...updatedSite }
          }
          return prev
        })
      } else {
        // Fallback: refresh from authoritative SQLite API
        getWebsitesApi().then(fresh => {
          if (Array.isArray(fresh) && fresh.length > 0) setSites(fresh)
        }).catch(() => {})
      }
    },
    onReconnect: () => {
      getWebsitesApi().then(fresh => {
        if (Array.isArray(fresh) && fresh.length > 0) setSites(fresh)
      }).catch(() => {})
    }
  })

  // Authoritative SQLite initial load on mount & background migration
  useEffect(() => {
    let isMounted = true
    async function initData() {
      // 1. Fetch latest websites from SQLite API (Authoritative Server State) FIRST
      try {
        const apiSites = await getWebsitesApi()
        if (isMounted && Array.isArray(apiSites) && apiSites.length > 0) {
          setSites(apiSites)

          // 2. Authoritative Server State Hydration: Update active managedSite from fresh server record
          setManagedSiteState(prevManaged => {
            if (!prevManaged || !prevManaged.id) {
              // If on a W-page route directly, hydrate first site if nothing was selected
              const savedObj = localStorage.getItem('tse_managed_site_object_v1')
              if (savedObj) {
                try {
                  const parsed = JSON.parse(savedObj)
                  const matched = apiSites.find(s => String(s.id) === String(parsed.id))
                  if (matched) return matched
                } catch (e) {}
              }
              return apiSites[0] || null
            }
            const freshSite = apiSites.find(s => String(s.id) === String(prevManaged.id))
            if (freshSite) {
              try {
                localStorage.setItem('tse_managed_site_object_v1', JSON.stringify(freshSite))
              } catch (e) {}
              return freshSite
            }
            return prevManaged
          })
        }
      } catch (err) {
        console.error('Failed to load websites from API:', err)
      }

      // 3. Run one-time migration in background if needed
      try {
        await triggerLocalStorageMigrationApi()
      } catch (err) {}
    }
    initData()
    return () => { isMounted = false }
  }, [])


  const [managedSite, setManagedSiteState] = useState(() => {
    try {
      const savedObj = localStorage.getItem('tse_managed_site_object_v1')
      if (savedObj) {
        const parsed = JSON.parse(savedObj)
        if (parsed && typeof parsed === 'object' && parsed.id !== undefined) {
          return parsed
        }
      }
    } catch (e) {}
    return null
  })

  // Ensure managedSite is hydrated if user lands directly on a W2/W3/W4/W5 route
  useEffect(() => {
    if (!managedSite && sites.length > 0 && ['/w2-website-dashboard', '/w3-page-management', '/w4-audit-results', '/w5-internal-linking'].includes(currentPath)) {
      const savedObj = localStorage.getItem('tse_managed_site_object_v1')
      if (savedObj) {
        try {
          const parsed = JSON.parse(savedObj)
          const matched = sites.find(s => String(s.id) === String(parsed.id))
          if (matched) {
            setManagedSiteState(matched)
            return
          }
        } catch (e) {}
      }
      setManagedSiteState(sites[0])
    }
  }, [currentPath, sites, managedSite])

  const setManagedSite = (site) => {
    setManagedSiteState(site)
    try {
      if (site) {
        localStorage.setItem('tse_managed_site_object_v1', JSON.stringify(site))
        if (site.id !== undefined) {
          localStorage.setItem('tse_managed_site_id_v1', String(site.id))
        }
      } else {
        localStorage.removeItem('tse_managed_site_object_v1')
        localStorage.removeItem('tse_managed_site_id_v1')
        localStorage.removeItem('tse_active_tab_v1')
      }
    } catch (e) {}
  }

  useEffect(() => {
    try {
      localStorage.setItem('tse_website_dashboard_sites', JSON.stringify(sites))
    } catch (e) {}
  }, [sites])

  const handleAddWebsite = async (newSite) => {
    await saveWebsiteApi(newSite)
    try {
      const freshApiSites = await getWebsitesApi()
      if (Array.isArray(freshApiSites) && freshApiSites.length > 0) {
        setSites(freshApiSites)
      }
    } catch (err) {}
  }

  const handleUpdateWebsite = async (updatedSite) => {
    // 1. Save updated tile payload to SQLite API
    await saveWebsiteApi(updatedSite)

    // 2. Authoritative Server-State Re-Hydration: Re-fetch latest sites directly from SQLite database API
    try {
      const freshApiSites = await getWebsitesApi()
      if (Array.isArray(freshApiSites) && freshApiSites.length > 0) {
        setSites(freshApiSites)

        // Find the fresh authoritative record from SQLite database by ID
        const freshRecord = freshApiSites.find(s => String(s.id) === String(updatedSite.id))
        if (freshRecord) {
          setEditingSite(null)
          if (managedSite && String(managedSite.id) === String(updatedSite.id)) {
            setManagedSite(freshRecord)
          }
          return
        }
      }
    } catch (err) {}

    // Fallback preserving platform if network fails during re-fetch
    const rawPlatform = String(updatedSite.platform || updatedSite.platform_type || updatedSite.configData?.platform || '').toLowerCase()
    const isMg = rawPlatform === 'magento' || Boolean(updatedSite.configData?.mgBackendUrl) || Boolean(updatedSite.mgBackendUrl)
    const finalSite = {
      ...updatedSite,
      platform: isMg ? 'magento' : (updatedSite.platform || 'wordpress')
    }
    setSites(prev => prev.map(s => s.id === finalSite.id ? finalSite : s))
    setEditingSite(null)
    if (managedSite && String(managedSite.id) === String(finalSite.id)) {
      setManagedSite(finalSite)
    }
  }

  const handleDeleteWebsite = (siteId) => {
    setSites(prev => prev.filter(s => s.id !== siteId))
    deleteWebsiteApi(siteId)
    setEditingSite(null)
    if (managedSite && managedSite.id === siteId) {
      setManagedSite(null)
    }
  }

  // Fetch Site Registry domains on mount so we have authoritative portfolio assignments
  const [registryMap, setRegistryMap] = useState({})

  useEffect(() => {
    let isMounted = true
    getActiveRegistryDomainsApi().then(domains => {
      if (isMounted && Array.isArray(domains)) {
        const map = {}
        domains.forEach(d => {
          if (d.id) map[d.id] = d.portfolio || 'Other'
          const norm = String(d.canonical_domain || '')
            .toLowerCase()
            .trim()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/.*$/, '')
          if (norm) map[norm] = d.portfolio || 'Other'
        })
        setRegistryMap(map)
      }
    }).catch(() => {})
    return () => { isMounted = false }
  }, [])

  const getSitePortfolio = (s) => {
    if (s.domain_id && registryMap[s.domain_id]) {
      return registryMap[s.domain_id]
    }
    const norm = String(s.url || s.name || '')
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
    if (norm && registryMap[norm]) {
      return registryMap[norm]
    }
    return s.portfolio || 'Other'
  }

  const [portfolioFilter, setPortfolioFilter] = useState('All')

  const filterOptions = ['All', 'TSE', 'Chili', 'Other']

  const filteredSites = sites
    .filter(s => {
      if (portfolioFilter === 'All') return true
      const sitePort = getSitePortfolio(s)
      if (portfolioFilter === 'Other') {
        return sitePort !== 'TSE' && sitePort !== 'Chili'
      }
      return sitePort === portfolioFilter
    })
    .sort((a, b) => {
      const nameA = String(a.name || a.title || a.siteName || '').trim()
      const nameB = String(b.name || b.title || b.siteName || '').trim()
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true })
    })

  const isW1 = currentPath === '/w1-connected-sites' || (!managedSite && !['/w2-website-dashboard', '/w3-page-management', '/w4-audit-results', '/w5-internal-linking'].includes(currentPath))

  if (managedSite && !isW1) {
    return (
      <ManageWebsitePage
        site={managedSite}
        currentPath={currentPath}
        navigate={navigate}
        onBack={() => {
          setManagedSite(null)
          if (navigate) navigate('/w1-connected-sites')
        }}
        onUpdateSite={(updated) => {
          setManagedSite(updated)
          handleUpdateWebsite(updated)
        }}
      />
    )
  }

  const handleManageSite = (site) => {
    setManagedSite(site)
    if (navigate) {
      navigate('/w2-website-dashboard')
    }
  }

  return (
    <div className="tile-preview-page">

      {/* ── ROW 1: Connected Websites Heading ── */}
      <div className="w1-row-1">
        <h1 className="w1-title">Connected Websites</h1>
      </div>

      {/* ── ROW 2: W1 Badge + Portfolio Filters (Left) | Add Website Button (Right) ── */}
      <div className="w1-row-2">
        <div className="w1-row-2-left">
          <span className="w1-pill-badge">W1 | CONNECTED WEBSITES</span>
          <div className="w1-filter-bar">
            <span className="w1-filter-label">Portfolio:</span>
            {filterOptions.map(opt => (
              <button
                key={opt}
                type="button"
                className={`w1-filter-btn ${portfolioFilter === opt ? 'w1-filter-btn-active' : ''}`}
                onClick={() => setPortfolioFilter(opt)}
              >
                {opt === 'All' ? 'All Portfolios' : opt}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="w1-btn-add-website"
          id="btn-add-website-top"
          onClick={() => {
            setEditingSite(null)
            setDialogOpen(true)
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            aria-hidden="true">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Website
        </button>
      </div>

      {/* Website Tiles Grid */}
      <div className="website-tiles-grid">
        {filteredSites.map(site => (
          <WebsiteTile
            key={site.id}
            site={site}
            onManage={handleManageSite}
            onEdit={setEditingSite}
          />
        ))}
      </div>

      {/* Add / Edit Dialog */}
      <AddWebsiteDialog
        isOpen={dialogOpen || Boolean(editingSite)}
        onClose={() => {
          setDialogOpen(false)
          setEditingSite(null)
        }}
        onAddWebsite={handleAddWebsite}
        onUpdateWebsite={handleUpdateWebsite}
        onDeleteWebsite={handleDeleteWebsite}
        editingSite={editingSite}
        connectedSites={sites}
      />

    </div>
  )
}
