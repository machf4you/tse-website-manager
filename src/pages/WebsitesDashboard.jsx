import { useState, useEffect } from 'react'
import WebsiteTile from '../components/WebsiteTile'
import AddWebsiteDialog from '../components/AddWebsiteDialog'
import ManageWebsitePage from './ManageWebsitePage'
import { mockSiteTile } from '../data/mockData'
import {
  getWebsitesApi,
  saveWebsiteApi,
  saveWebsitesBatchApi,
  deleteWebsiteApi,
  triggerLocalStorageMigrationApi
} from '../services/websiteManagerApi'
import './WebsitesDashboard.css'

const STORAGE_KEY = 'tse_connected_websites_v1'

export default function WebsitesDashboard() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState(null)
  const [sites, setSites] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('tse_website_dashboard_sites')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {}
    return [mockSiteTile]
  })

  // One-time localStorage migration & SQLite initial load on mount
  useEffect(() => {
    let isMounted = true
    async function initData() {
      // 1. Run one-time migration if localStorage has data
      try {
        await triggerLocalStorageMigrationApi()
      } catch (err) {}

      // 2. Fetch latest websites from SQLite API
      try {
        const apiSites = await getWebsitesApi()
        if (isMounted && Array.isArray(apiSites) && apiSites.length > 0) {
          setSites(apiSites)
        }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sites))
      localStorage.setItem('tse_website_dashboard_sites', JSON.stringify(sites))
      saveWebsitesBatchApi(sites)
    } catch (e) {}
  }, [sites])

  const handleAddWebsite = (newSite) => {
    setSites(prev => [newSite, ...prev])
    saveWebsiteApi(newSite)
  }

  const handleUpdateWebsite = (updatedSite) => {
    setSites(prev => prev.map(s => s.id === updatedSite.id ? updatedSite : s))
    saveWebsiteApi(updatedSite)
    setEditingSite(null)
  }

  const handleDeleteWebsite = (siteId) => {
    setSites(prev => prev.filter(s => s.id !== siteId))
    deleteWebsiteApi(siteId)
    setEditingSite(null)
    if (managedSite && managedSite.id === siteId) {
      setManagedSite(null)
    }
  }

  if (managedSite) {
    return (
      <ManageWebsitePage
        site={managedSite}
        onBack={() => setManagedSite(null)}
        onUpdateSite={(updated) => {
          setManagedSite(updated)
          handleUpdateWebsite(updated)
        }}
      />
    )
  }

  return (
    <div className="tile-preview-page">

      {/* ── W1 Header ── */}
      <div className="w1-header">
        <div className="w1-header-content">
          <h1 className="w1-title">Connected Websites</h1>
          <span className="w1-pill-badge">W1 | CONNECTED WEBSITES</span>
          <p className="w1-subtitle">Manage your connected websites.</p>
        </div>

        <button
          type="button"
          className="btn-add-website"
          id="btn-add-website"
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
        {sites.map(site => (
          <WebsiteTile
            key={site.id}
            site={site}
            onManage={setManagedSite}
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
      />

    </div>
  )
}
