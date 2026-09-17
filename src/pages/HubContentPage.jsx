import React, { useState, useEffect, useMemo } from 'react'
import { getWebsitesApi, getActiveRegistryDomainsApi } from '../services/websiteManagerApi'
import {
  batchGenerateHubContentApi,
  getArticleDraftsApi,
  saveArticleDraftApi,
  deleteArticleDraftApi,
  completeArticleDraftApi
} from '../services/hubContentApi'
import { generateArticleDocxBlob } from '../utils/docxGenerator'
import './HubContentPage.css'

export default function HubContentPage({ currentUser, navigate }) {
  const [activeTab, setActiveTab] = useState('generate') // 'generate' | 'drafts' | 'history'
  const [selectedPortfolio, setSelectedPortfolio] = useState('TSE') // 'TSE' | 'CHILI'

  // Websites & Registry
  const [sites, setSites] = useState([])
  const [registryMap, setRegistryMap] = useState({})
  const [loadingSites, setLoadingSites] = useState(true)

  // Selection
  const [selectedSiteIds, setSelectedSiteIds] = useState(new Set())

  // Generation
  const [generating, setGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(null)
  const [generationResults, setGenerationResults] = useState([])
  const [generationErrors, setGenerationErrors] = useState([])

  // Drafts & History
  const [draftsList, setDraftsList] = useState([])
  const [loadingDrafts, setLoadingDrafts] = useState(false)
  const [savingDraftId, setSavingDraftId] = useState(null)
  const [statusMessage, setStatusMessage] = useState(null)

  // Draft Delete Confirmation Modal
  const [draftToDelete, setDraftToDelete] = useState(null)
  const [isDeletingDraft, setIsDeletingDraft] = useState(false)

  // Article Complete Confirmation Modal
  const [articleToComplete, setArticleToComplete] = useState(null)
  const [isCompletingArticle, setIsCompletingArticle] = useState(false)

  // Load Registry domains for authoritative portfolio assignments
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

  // Load eligible websites
  useEffect(() => {
    let isMounted = true
    setLoadingSites(true)
    getWebsitesApi().then(allSites => {
      if (!isMounted) return
      setSites(Array.isArray(allSites) ? allSites : [])
      setLoadingSites(false)
    }).catch(err => {
      if (isMounted) {
        console.error('Failed to load websites:', err)
        setLoadingSites(false)
      }
    })
    return () => { isMounted = false }
  }, [])

  // Load drafts on mount & periodically
  const loadDrafts = () => {
    setLoadingDrafts(true)
    getArticleDraftsApi().then(res => {
      if (res && res.drafts) {
        setDraftsList(res.drafts)
      }
      setLoadingDrafts(false)
    }).catch(err => {
      console.error('Error loading drafts:', err)
      setLoadingDrafts(false)
    })
  }

  useEffect(() => {
    loadDrafts()
  }, [])

  // Derived active drafts vs history
  const activeDrafts = useMemo(() => {
    return draftsList.filter(d => d.status !== 'Completed' && d.status !== 'Sent to WordPress' && d.status !== 'Archived')
  }, [draftsList])

  const historyArticles = useMemo(() => {
    return draftsList.filter(d => d.status === 'Completed' || d.status === 'Sent to WordPress' || d.status === 'Archived')
  }, [draftsList])

  const activeDraftsCount = activeDrafts.length

  // Helper: Get normalized portfolio for a site
  const getSitePortfolio = (s) => {
    if (s.domain_id && registryMap[s.domain_id]) {
      const port = String(registryMap[s.domain_id]).toUpperCase()
      if (port === 'CHILI' || port === 'SCM') return 'CHILI'
      if (port === 'TSE') return 'TSE'
      return port
    }
    const norm = String(s.url || s.name || '')
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
    if (norm && registryMap[norm]) {
      const port = String(registryMap[norm]).toUpperCase()
      if (port === 'CHILI' || port === 'SCM') return 'CHILI'
      if (port === 'TSE') return 'TSE'
      return port
    }
    const rawPort = String(s.portfolio || 'TSE').toUpperCase()
    if (rawPort === 'CHILI' || rawPort === 'SCM') return 'CHILI'
    return 'TSE'
  }

  // Filter sites for active portfolio
  const portfolioSites = useMemo(() => {
    return sites.filter(s => getSitePortfolio(s) === selectedPortfolio)
  }, [sites, registryMap, selectedPortfolio])

  // Handle portfolio switch
  const handlePortfolioChange = (port) => {
    setSelectedPortfolio(port)
    setSelectedSiteIds(new Set())
  }

  // Select all / Deselect all
  const handleSelectAll = () => {
    const allIds = new Set(portfolioSites.map(s => s.id))
    setSelectedSiteIds(allIds)
  }

  const handleDeselectAll = () => {
    setSelectedSiteIds(new Set())
  }

  const handleToggleSite = (siteId) => {
    setSelectedSiteIds(prev => {
      const next = new Set(prev)
      if (next.has(siteId)) {
        next.delete(siteId)
      } else {
        next.add(siteId)
      }
      return next
    })
  }

  // Batch Generation Handler
  const handleBatchGenerate = async () => {
    if (selectedSiteIds.size === 0) return

    setGenerating(true)
    setGenerationProgress({ current: 0, total: selectedSiteIds.size, status: 'Initialising AI generator...' })
    setGenerationResults([])
    setGenerationErrors([])
    setStatusMessage(null)

    try {
      const targetIds = Array.from(selectedSiteIds)
      setGenerationProgress({ current: 1, total: targetIds.length, status: `Generating articles for ${targetIds.length} websites...` })

      const res = await batchGenerateHubContentApi({ siteIds: targetIds, provider: 'claude' })

      if (res && Array.isArray(res.results) && res.results.length > 0) {
        setGenerationResults(res.results)
        setGenerationErrors(res.errors || [])
        loadDrafts()
        if (res.errors && res.errors.length > 0) {
          setStatusMessage({
            type: 'warning',
            text: `Generated ${res.results.length} article(s), but ${res.errors.length} failed: ${res.errors[0]?.error}`
          })
        } else {
          setStatusMessage({
            type: 'success',
            text: `Successfully generated ${res.results.length} Hub Content article${res.results.length === 1 ? '' : 's'}!`
          })
        }
      } else {
        const failureReason = res?.errors?.[0]?.error || res?.error || 'Zero articles generated by AI service.'
        setGenerationResults([])
        setGenerationErrors(res?.errors || [])
        setStatusMessage({
          type: 'error',
          text: `Generation failed (0 articles generated): ${failureReason}`
        })
      }
    } catch (err) {
      console.error('Batch generation error:', err)
      setStatusMessage({
        type: 'error',
        text: `Generation error: ${err.message}`
      })
    } finally {
      setGenerating(false)
      setGenerationProgress(null)
    }
  }

  // Single Article Word (.docx) Download
  const handleDownloadWord = async (article) => {
    try {
      const site = sites.find(s => String(s.id) === String(article.siteId || article.site_id))
      const cleanDomain = site?.url ? site.url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') : (
        article.domain || (article.siteUrl ? article.siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') : (
          article.targetPageUrl || article.target_page_url ? (article.targetPageUrl || article.target_page_url).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') : ''
        ))
      )
      const businessName = site?.name || article.businessName || article.siteName || (cleanDomain ? cleanDomain : 'The Search Equation')

      const enrichedArticle = {
        ...article,
        businessName,
        siteName: businessName,
        domain: cleanDomain,
        siteUrl: site?.url || article.siteUrl
      }

      const blob = await generateArticleDocxBlob(enrichedArticle)
      const slug = article.slug || 'hub-article'
      const filename = `${cleanDomain || 'website'}-${slug}.docx`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error generating Word document:', err)
      setStatusMessage({
        type: 'error',
        text: `Word document generation error: ${err.message}`
      })
    }
  }

  // Single Article HTML Download
  const handleDownloadHtml = (article) => {
    try {
      const domain = article.domain || (article.siteUrl ? article.siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : 'website')
      const businessName = article.businessName || article.siteName || domain
      const slug = article.slug || 'hub-article'
      const title = article.title || 'Untitled Article'
      const metaTitle = article.metaTitle || article.meta_title || ''
      const metaDescription = article.metaDescription || article.meta_description || ''
      const bodyHtml = article.bodyHtml || article.body_html || ''
      const dateStr = article.createdAt || article.created_at ? new Date(article.createdAt || article.created_at).toLocaleString('en-GB') : new Date().toLocaleString('en-GB')

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="title" content="${metaTitle.replace(/"/g, '&quot;')}">
  <meta name="description" content="${metaDescription.replace(/"/g, '&quot;')}">
  <meta name="slug" content="${slug}">
  <meta name="website" content="${domain}">
  <meta name="business-name" content="${businessName.replace(/"/g, '&quot;')}">
  <meta name="generated-date" content="${dateStr}">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 820px;
      margin: 2.5rem auto;
      padding: 0 1.5rem;
      color: #1e293b;
    }
    .hub-meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 2rem;
      font-size: 0.9rem;
    }
    .hub-meta-box p {
      margin: 0.35rem 0;
    }
    .hub-meta-label {
      font-weight: 700;
      color: #475569;
      display: inline-block;
      min-width: 140px;
    }
    h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1.25rem;
      line-height: 1.25;
    }
    h2 {
      font-size: 1.45rem;
      font-weight: 700;
      color: #1e293b;
      margin-top: 1.75rem;
      margin-bottom: 0.75rem;
    }
    h3 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #334155;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
    }
    p {
      margin: 0.85rem 0;
      font-size: 1rem;
    }
    a {
      color: #2563eb;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
  </style>
</head>
<body>
  <div class="hub-meta-box">
    <p><span class="hub-meta-label">Website:</span> ${businessName} (${domain})</p>
    <p><span class="hub-meta-label">Meta Title:</span> ${metaTitle}</p>
    <p><span class="hub-meta-label">Meta Description:</span> ${metaDescription}</p>
    <p><span class="hub-meta-label">Slug:</span> ${slug}</p>
    <p><span class="hub-meta-label">Generated:</span> ${dateStr}</p>
  </div>
  <h1>${title}</h1>
  <div class="hub-article-body-content">
    ${bodyHtml}
  </div>
</body>
</html>`

      const filename = `${domain}-${slug}.html`
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error generating HTML download:', err)
      setStatusMessage({
        type: 'error',
        text: `HTML download error: ${err.message}`
      })
    }
  }

  // Batch Word Download All
  const handleDownloadAllWord = () => {
    if (generationResults.length === 0) return
    generationResults.forEach((article, idx) => {
      setTimeout(() => {
        handleDownloadWord(article)
      }, idx * 180)
    })
  }

  // Batch HTML Download All
  const handleDownloadAllHtml = () => {
    if (generationResults.length === 0) return
    generationResults.forEach((article, idx) => {
      setTimeout(() => {
        handleDownloadHtml(article)
      }, idx * 150)
    })
  }

  // Save changes to result/draft
  const handleSaveArticle = async (article, index = null) => {
    const draftId = article.draftId || article.id
    setSavingDraftId(draftId)

    try {
      const payload = {
        id: draftId,
        siteId: article.siteId || article.site_id,
        title: article.title,
        metaTitle: article.metaTitle || article.meta_title,
        metaDescription: article.metaDescription || article.meta_description,
        slug: article.slug,
        bodyHtml: article.bodyHtml || article.body_html,
        targetPageUrl: article.targetPageUrl || article.target_page_url,
        targetPhrase: article.targetPhrase || article.target_phrase,
        status: article.status || 'Draft'
      }

      await saveArticleDraftApi(payload)
      loadDrafts()
      
      setStatusMessage({
        type: 'success',
        text: `Changes saved for "${article.title}"`
      })

      if (index !== null) {
        setGenerationResults(prev => {
          const next = [...prev]
          next[index] = { ...next[index], ...payload }
          return next
        })
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `Failed to save: ${err.message}`
      })
    } finally {
      setSavingDraftId(null)
    }
  }

  // Mark Article Complete Handler (Executed upon modal confirmation)
  const handleConfirmComplete = async () => {
    if (!articleToComplete) return
    const draftId = articleToComplete.draftId || articleToComplete.id
    if (!draftId) return

    setIsCompletingArticle(true)
    try {
      await completeArticleDraftApi(draftId)
      
      // Update local states live
      const nowIso = new Date().toISOString()
      setDraftsList(prev => prev.map(d => {
        if ((d.id || d.draftId) === draftId) {
          return { ...d, status: 'Completed', completed_at: nowIso, completedAt: nowIso }
        }
        return d
      }))
      setGenerationResults(prev => prev.map(d => {
        if ((d.draftId || d.id) === draftId) {
          return { ...d, status: 'Completed', completed_at: nowIso, completedAt: nowIso }
        }
        return d
      }))

      setStatusMessage({
        type: 'success',
        text: `Article "${articleToComplete.title || 'Untitled'}" was marked as Completed and moved to History.`
      })
      setArticleToComplete(null)
    } catch (err) {
      console.error('Failed to complete article:', err)
      setStatusMessage({
        type: 'error',
        text: `Failed to mark completed: ${err.message}`
      })
    } finally {
      setIsCompletingArticle(false)
    }
  }

  // Delete Draft Handler (Executed upon modal confirmation)
  const handleConfirmDelete = async () => {
    if (!draftToDelete) return
    const draftId = draftToDelete.draftId || draftToDelete.id
    if (!draftId) return

    setIsDeletingDraft(true)
    try {
      await deleteArticleDraftApi(draftId)
      setDraftsList(prev => prev.filter(d => (d.id || d.draftId) !== draftId))
      setGenerationResults(prev => prev.filter(d => (d.draftId || d.id) !== draftId))
      setStatusMessage({
        type: 'success',
        text: `Draft "${draftToDelete.title || 'Untitled'}" was deleted successfully.`
      })
      setDraftToDelete(null)
    } catch (err) {
      console.error('Failed to delete draft:', err)
      setStatusMessage({
        type: 'error',
        text: `Failed to delete draft: ${err.message}`
      })
    } finally {
      setIsDeletingDraft(false)
    }
  }

  return (
    <div className="hub-content-container">
      {/* Top Navigation Row: Back to Home */}
      <div className="hub-back-row">
        <button
          type="button"
          className="hub-btn-back-home"
          id="btn-back-to-home"
          onClick={() => navigate ? navigate('/w1-connected-sites') : window.location.assign('/w1-connected-sites')}
          title="Return to Connected Websites Home"
        >
          ← Back to Home
        </button>
      </div>

      {/* Header */}
      <div className="hub-content-header">
        <div className="hub-header-title-row">
          <div>
            <h1 className="hub-page-title">Hub Content</h1>
            <p className="hub-page-subtitle">
              Automate supporting on-site article creation across TSE and Chili portfolios
            </p>
          </div>
          <div className="hub-tab-nav">
            <button
              type="button"
              className={`hub-nav-tab ${activeTab === 'generate' ? 'active' : ''}`}
              onClick={() => setActiveTab('generate')}
            >
              Generate Content
            </button>
            <button
              type="button"
              className={`hub-nav-tab ${activeTab === 'drafts' ? 'active' : ''}`}
              onClick={() => setActiveTab('drafts')}
            >
              Active Drafts
              {activeDraftsCount > 0 && <span className="hub-tab-badge">{activeDraftsCount}</span>}
            </button>
            <button
              type="button"
              className={`hub-nav-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History
              {historyArticles.length > 0 && <span className="hub-tab-badge history-badge">{historyArticles.length}</span>}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className={`hub-alert-banner alert-${statusMessage.type}`}>
            <span>{statusMessage.text}</span>
            <button type="button" className="alert-close-btn" onClick={() => setStatusMessage(null)}>×</button>
          </div>
        )}
      </div>

      {/* Main Tab 1: Generate */}
      {activeTab === 'generate' && (
        <div className="hub-generate-view">
          {/* Portfolio Selector Bar */}
          <div className="hub-portfolio-bar">
            <div className="hub-portfolio-label">PORTFOLIO:</div>
            <div className="hub-portfolio-buttons">
              <button
                type="button"
                className={`hub-portfolio-btn ${selectedPortfolio === 'TSE' ? 'active-tse' : ''}`}
                onClick={() => handlePortfolioChange('TSE')}
              >
                TSE
                <span className="portfolio-count-badge">
                  {sites.filter(s => getSitePortfolio(s) === 'TSE').length}
                </span>
              </button>
              <button
                type="button"
                className={`hub-portfolio-btn ${selectedPortfolio === 'CHILI' ? 'active-chili' : ''}`}
                onClick={() => handlePortfolioChange('CHILI')}
              >
                CHILI
                <span className="portfolio-count-badge">
                  {sites.filter(s => getSitePortfolio(s) === 'CHILI').length}
                </span>
              </button>
            </div>
          </div>

          {/* Website Selection Panel (Card Grid) */}
          <div className="hub-panel">
            <div className="hub-panel-header">
              <div className="hub-panel-header-left">
                <h2 className="hub-panel-title">Select Websites ({selectedPortfolio})</h2>
                <span className="hub-selection-count">
                  {selectedSiteIds.size} of {portfolioSites.length} selected
                </span>
              </div>
              <div className="hub-panel-header-actions">
                <button
                  type="button"
                  className="hub-btn-secondary"
                  onClick={handleSelectAll}
                  disabled={generating || portfolioSites.length === 0}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="hub-btn-secondary"
                  onClick={handleDeselectAll}
                  disabled={generating || selectedSiteIds.size === 0}
                >
                  Deselect All
                </button>
              </div>
            </div>

            {loadingSites ? (
              <div className="hub-loading-state">Loading websites...</div>
            ) : portfolioSites.length === 0 ? (
              <div className="hub-empty-state">
                No websites configured in the {selectedPortfolio} portfolio.
              </div>
            ) : (
              <div className="hub-sites-grid">
                {portfolioSites.map(site => {
                  const isChecked = selectedSiteIds.has(site.id)
                  const cleanUrl = (site.url || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
                  
                  return (
                    <label
                      key={site.id}
                      className={`hub-site-card ${isChecked ? 'selected' : ''}`}
                      onClick={(e) => {
                        if (e.target.tagName !== 'INPUT') {
                          handleToggleSite(site.id)
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        className="hub-site-checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSite(site.id)}
                        disabled={generating}
                      />
                      <div className="hub-site-info">
                        <div className="hub-site-name">{site.name || cleanUrl}</div>
                        <div className="hub-site-url">{cleanUrl}</div>
                      </div>
                      <span className="hub-site-badge">{site.platform || 'WordPress'}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {/* Action Footer */}
            <div className="hub-action-footer">
              <div className="hub-action-info">
                {selectedSiteIds.size > 0 ? (
                  <span>Ready to generate <strong>{selectedSiteIds.size}</strong> article{selectedSiteIds.size === 1 ? '' : 's'}.</span>
                ) : (
                  <span>Select one or more websites above to proceed.</span>
                )}
              </div>
              <button
                type="button"
                className="hub-btn-primary hub-btn-large"
                onClick={handleBatchGenerate}
                disabled={generating || selectedSiteIds.size === 0}
              >
                {generating ? 'Generating Articles...' : `Generate Hub Content (${selectedSiteIds.size})`}
              </button>
            </div>
          </div>

          {/* Progress Banner */}
          {generating && generationProgress && (
            <div className="hub-progress-card">
              <div className="hub-spinner"></div>
              <div className="hub-progress-info">
                <div className="hub-progress-status">{generationProgress.status}</div>
                <div className="hub-progress-sub">Creating authoritative UK editorial articles with W3 Gold Star priority links...</div>
              </div>
            </div>
          )}

          {/* Generation Results Review Area */}
          {generationResults.length > 0 && (
            <div className="hub-results-section">
              <div className="hub-results-header">
                <div>
                  <h2 className="hub-results-title">Generated Articles ({generationResults.length})</h2>
                  <p className="hub-results-desc">Review, refine, and download the generated content.</p>
                </div>
                <div className="hub-results-download-group">
                  <button
                    type="button"
                    className="hub-btn-word hub-btn-download-all"
                    onClick={handleDownloadAllWord}
                    title="Download all generated articles as Word documents"
                  >
                    📄 DOWNLOAD WORD ALL ({generationResults.length})
                  </button>
                  <button
                    type="button"
                    className="hub-btn-html hub-btn-download-all"
                    onClick={handleDownloadAllHtml}
                    title="Download all generated articles as HTML files"
                  >
                    🌐 DOWNLOAD HTML ALL ({generationResults.length})
                  </button>
                </div>
              </div>

              {generationErrors.length > 0 && (
                <div className="hub-alert-banner alert-warning">
                  <strong>Notice:</strong> {generationErrors.length} site(s) failed during generation: {generationErrors[0]?.error}
                </div>
              )}

              <div className="hub-articles-list">
                {generationResults.map((article, idx) => (
                  <ArticleCard
                    key={article.draftId || idx}
                    article={article}
                    index={idx}
                    onSave={(updated) => handleSaveArticle(updated, idx)}
                    onDownloadWord={() => handleDownloadWord(article)}
                    onDownloadHtml={() => handleDownloadHtml(article)}
                    onDelete={() => setDraftToDelete(article)}
                    onComplete={() => setArticleToComplete(article)}
                    isSaving={savingDraftId === (article.draftId || article.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Tab 2: Drafts */}
      {activeTab === 'drafts' && (
        <div className="hub-drafts-view">
          <div className="hub-panel">
            <div className="hub-panel-header">
              <div className="hub-panel-header-left">
                <h2 className="hub-panel-title">Active Drafts ({activeDrafts.length})</h2>
                <span className="hub-selection-count">Articles in progress — review, edit, or mark completed</span>
              </div>
              <button type="button" className="hub-btn-secondary" onClick={loadDrafts} disabled={loadingDrafts}>
                {loadingDrafts ? 'Refreshing...' : 'Refresh Drafts'}
              </button>
            </div>

            {loadingDrafts ? (
              <div className="hub-loading-state">Loading drafts...</div>
            ) : activeDrafts.length === 0 ? (
              <div className="hub-empty-state">No active drafts waiting for action. Generate new articles above!</div>
            ) : (
              <div className="hub-articles-list">
                {activeDrafts.map((draft) => (
                  <ArticleCard
                    key={draft.id}
                    article={draft}
                    onSave={(updated) => handleSaveArticle(updated)}
                    onDownloadWord={() => handleDownloadWord(draft)}
                    onDownloadHtml={() => handleDownloadHtml(draft)}
                    onDelete={() => setDraftToDelete(draft)}
                    onComplete={() => setArticleToComplete(draft)}
                    isSaving={savingDraftId === draft.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Tab 3: History */}
      {activeTab === 'history' && (
        <div className="hub-history-view">
          <div className="hub-panel">
            <div className="hub-panel-header">
              <div className="hub-panel-header-left">
                <h2 className="hub-panel-title">Completed Articles History ({historyArticles.length})</h2>
                <span className="hub-selection-count">Completed and published articles available for download</span>
              </div>
              <button type="button" className="hub-btn-secondary" onClick={loadDrafts} disabled={loadingDrafts}>
                {loadingDrafts ? 'Refreshing...' : 'Refresh History'}
              </button>
            </div>

            {loadingDrafts ? (
              <div className="hub-loading-state">Loading history...</div>
            ) : historyArticles.length === 0 ? (
              <div className="hub-empty-state">No completed articles in history yet.</div>
            ) : (
              <div className="hub-articles-list">
                {historyArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    isHistory={true}
                    onSave={(updated) => handleSaveArticle(updated)}
                    onDownloadWord={() => handleDownloadWord(article)}
                    onDownloadHtml={() => handleDownloadHtml(article)}
                    onDelete={() => setDraftToDelete(article)}
                    onComplete={() => setArticleToComplete(article)}
                    isSaving={savingDraftId === article.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Mark Article Complete */}
      {articleToComplete && (
        <div className="hub-modal-overlay" onClick={() => !isCompletingArticle && setArticleToComplete(null)}>
          <div className="hub-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="hub-modal-header">
              <h3 className="hub-modal-title">Mark Article as Completed</h3>
              <button
                type="button"
                className="hub-modal-close"
                onClick={() => !isCompletingArticle && setArticleToComplete(null)}
                disabled={isCompletingArticle}
              >
                ×
              </button>
            </div>
            <div className="hub-modal-body">
              <p>Are you sure you want to mark this article as completed?</p>
              <div className="hub-modal-draft-info">
                <strong>Title:</strong> {articleToComplete.title || 'Untitled'}<br />
                <strong>Website:</strong> {articleToComplete.businessName || articleToComplete.domain || 'Website'}
              </div>
              <p className="hub-modal-info-text">
                This article will be moved to History and removed from Active Drafts. You can continue to view, copy, and download both Word and HTML versions from the History tab at any time.
              </p>
            </div>
            <div className="hub-modal-footer">
              <button
                type="button"
                className="hub-btn-secondary"
                onClick={() => setArticleToComplete(null)}
                disabled={isCompletingArticle}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hub-btn-complete hub-btn-modal-action"
                onClick={handleConfirmComplete}
                disabled={isCompletingArticle}
              >
                {isCompletingArticle ? 'Completing...' : '✓ Confirm Completed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Draft */}
      {draftToDelete && (
        <div className="hub-modal-overlay" onClick={() => !isDeletingDraft && setDraftToDelete(null)}>
          <div className="hub-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="hub-modal-header">
              <h3 className="hub-modal-title">Delete Article Draft</h3>
              <button
                type="button"
                className="hub-modal-close"
                onClick={() => !isDeletingDraft && setDraftToDelete(null)}
                disabled={isDeletingDraft}
              >
                ×
              </button>
            </div>
            <div className="hub-modal-body">
              <p>Are you sure you want to delete this article draft?</p>
              <div className="hub-modal-draft-info">
                <strong>Title:</strong> {draftToDelete.title || 'Untitled'}<br />
                <strong>Website:</strong> {draftToDelete.businessName || draftToDelete.domain || 'Website'}
              </div>
              <p className="hub-modal-warning-text">
                This will permanently delete only this draft record. This action cannot be undone.
              </p>
            </div>
            <div className="hub-modal-footer">
              <button
                type="button"
                className="hub-btn-secondary"
                onClick={() => setDraftToDelete(null)}
                disabled={isDeletingDraft}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hub-btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeletingDraft}
              >
                {isDeletingDraft ? 'Deleting...' : 'Delete Draft'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Individual Article Card Component for Review, Editing, and Internal Links Display
 */
function ArticleCard({
  article,
  index,
  onSave,
  onDownloadWord,
  onDownloadHtml,
  onDelete,
  onComplete,
  isSaving,
  isHistory = false
}) {
  const [title, setTitle] = useState(article.title || '')
  const [metaTitle, setMetaTitle] = useState(article.metaTitle || article.meta_title || '')
  const [metaDescription, setMetaDescription] = useState(article.metaDescription || article.meta_description || '')
  const [slug, setSlug] = useState(article.slug || '')
  const [bodyHtml, setBodyHtml] = useState(article.bodyHtml || article.body_html || '')
  const [viewMode, setViewMode] = useState('preview') // 'preview' | 'html'
  const [isExpanded, setIsExpanded] = useState(true)
  const [copied, setCopied] = useState(false)

  // Keep state synced if article changes externally
  useEffect(() => {
    if (article.title !== undefined) setTitle(article.title || '')
    if (article.metaTitle !== undefined || article.meta_title !== undefined) {
      setMetaTitle(article.metaTitle || article.meta_title || '')
    }
    if (article.metaDescription !== undefined || article.meta_description !== undefined) {
      setMetaDescription(article.metaDescription || article.meta_description || '')
    }
    if (article.slug !== undefined) setSlug(article.slug || '')
    if (article.bodyHtml !== undefined || article.body_html !== undefined) {
      setBodyHtml(article.bodyHtml || article.body_html || '')
    }
  }, [article])

  const domain = article.domain || (article.siteUrl ? article.siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : 'website')
  const businessName = article.businessName || article.siteName || domain

  // Extract internal links live from bodyHtml or from secondary_links_json
  const internalLinks = useMemo(() => {
    if (article.internalLinksAdded && Array.isArray(article.internalLinksAdded) && article.internalLinksAdded.length > 0) {
      return article.internalLinksAdded
    }

    if (article.secondary_links_json) {
      try {
        const parsed = JSON.parse(article.secondary_links_json)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch (_e) {}
    }

    // Fallback: extract directly from bodyHtml
    const extracted = []
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi
    const seenUrls = new Set()
    let match
    while ((match = linkRegex.exec(bodyHtml)) !== null) {
      const destinationUrl = match[1].trim()
      const anchorText = match[2].replace(/<[^>]*>/g, '').trim()
      if (destinationUrl && !seenUrls.has(destinationUrl)) {
        seenUrls.add(destinationUrl)
        extracted.push({
          anchorText: anchorText || destinationUrl,
          destinationUrl
        })
      }
    }
    return extracted
  }, [bodyHtml, article])

  const handleCopy = () => {
    navigator.clipboard.writeText(bodyHtml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLocalSave = () => {
    onSave({
      ...article,
      title,
      metaTitle,
      metaDescription,
      slug,
      bodyHtml
    })
  }

  const isCompleted = isHistory || article.status === 'Completed' || article.status === 'Sent to WordPress'
  const createdDateStr = article.createdAt || article.created_at ? new Date(article.createdAt || article.created_at).toLocaleDateString('en-GB') : null
  const completedDateStr = article.completedAt || article.completed_at ? new Date(article.completedAt || article.completed_at).toLocaleDateString('en-GB') : null

  return (
    <div className={`hub-article-card ${isCompleted ? 'is-completed' : ''}`}>
      <div className="hub-article-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="hub-article-header-left">
          <span className="hub-domain-pill">{businessName}</span>
          {isCompleted && <span className="hub-status-pill completed">Completed</span>}
          <h3 className="hub-article-card-title">{title || 'Untitled Article'}</h3>
        </div>
        <div className="hub-article-header-right" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="hub-btn-delete-sm"
            onClick={onDelete}
            title="Delete this article"
          >
            🗑️
          </button>
          <button
            type="button"
            className="hub-btn-word-sm"
            onClick={onDownloadWord}
            title="DOWNLOAD WORD (.docx)"
          >
            📄 Word
          </button>
          <button
            type="button"
            className="hub-btn-html-sm"
            onClick={onDownloadHtml}
            title="DOWNLOAD HTML (.html)"
          >
            🌐 HTML
          </button>
          <button
            type="button"
            className="hub-btn-toggle-expand"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="hub-article-body">
          {/* Metadata Grid */}
          <div className="hub-meta-grid">
            <div className="hub-field-group">
              <label className="hub-field-label">Article Title</label>
              <input
                type="text"
                className="hub-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="hub-field-group">
              <label className="hub-field-label">Slug</label>
              <input
                type="text"
                className="hub-input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            <div className="hub-field-group">
              <label className="hub-field-label">Meta Title</label>
              <input
                type="text"
                className="hub-input"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
            </div>

            <div className="hub-field-group hub-field-span-2">
              <label className="hub-field-label">Meta Description</label>
              <textarea
                className="hub-textarea hub-meta-desc"
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Article Content Section (Natural Expansion without Scrollbar) */}
          <div className="hub-content-editor-section">
            <div className="hub-content-editor-header">
              <label className="hub-field-label">Article Content</label>
              <div className="hub-view-mode-toggle">
                <button
                  type="button"
                  className={`hub-toggle-btn ${viewMode === 'preview' ? 'active' : ''}`}
                  onClick={() => setViewMode('preview')}
                >
                  Formatted Preview
                </button>
                <button
                  type="button"
                  className={`hub-toggle-btn ${viewMode === 'html' ? 'active' : ''}`}
                  onClick={() => setViewMode('html')}
                >
                  HTML Code
                </button>
                <button
                  type="button"
                  className="hub-toggle-btn copy-btn"
                  onClick={handleCopy}
                >
                  {copied ? '✓ Copied' : '📋 Copy Body'}
                </button>
              </div>
            </div>

            {viewMode === 'preview' ? (
              <div
                className="hub-article-preview-content"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            ) : (
              <textarea
                className="hub-textarea hub-html-editor"
                rows={16}
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
              />
            )}
          </div>

          {/* INTERNAL LINKS ADDED DISPLAY SECTION */}
          <div className="hub-internal-links-container">
            <div className="hub-internal-links-header">
              <span className="hub-internal-links-title">
                INTERNAL LINKS ADDED: {internalLinks.length}
              </span>
            </div>
            {internalLinks.length > 0 ? (
              <div className="hub-internal-links-list">
                {internalLinks.map((link, lIdx) => (
                  <div key={lIdx} className="hub-internal-link-row">
                    <span className="hub-link-anchor-badge">"{link.anchorText}"</span>
                    <span className="hub-link-arrow">→</span>
                    <a
                      href={link.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hub-link-url"
                    >
                      {link.destinationUrl}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="hub-internal-links-empty">
                NO PRIORITY PAGES AVAILABLE
              </div>
            )}
          </div>

          {/* Card Footer Actions */}
          <div className="hub-card-footer">
            <div className="hub-card-footer-left">
              {createdDateStr && (
                <span className="hub-date-badge">
                  📅 Generated: {createdDateStr}
                </span>
              )}
              {completedDateStr && (
                <span className="hub-date-badge completed-badge">
                  ✓ Completed: {completedDateStr}
                </span>
              )}
              {article.targetPageUrl && (
                <span className="hub-target-link-badge">
                  🎯 Primary Section: <code>{article.targetPageUrl}</code>
                </span>
              )}
            </div>
            <div className="hub-card-footer-right">
              <button
                type="button"
                className="hub-btn-delete"
                onClick={onDelete}
                title="Delete this draft"
              >
                🗑️ Delete
              </button>
              
              <button
                type="button"
                className="hub-btn-secondary"
                onClick={handleLocalSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>

              {!isCompleted && (
                <button
                  type="button"
                  className="hub-btn-complete"
                  onClick={onComplete}
                  title="Mark this article as completed and move to History"
                >
                  ✓ Mark Completed
                </button>
              )}

              <button
                type="button"
                className="hub-btn-word"
                onClick={onDownloadWord}
                title="Download as Word document (.docx)"
              >
                📄 DOWNLOAD WORD
              </button>

              <button
                type="button"
                className="hub-btn-html"
                onClick={onDownloadHtml}
                title="Download as HTML file (.html)"
              >
                🌐 DOWNLOAD HTML
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
