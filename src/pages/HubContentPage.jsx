import React, { useState, useEffect, useMemo } from 'react'
import { getWebsitesApi, getActiveRegistryDomainsApi } from '../services/websiteManagerApi'
import {
  batchGenerateHubContentApi,
  getArticleDraftsApi,
  saveArticleDraftApi,
  deleteArticleDraftApi
} from '../services/hubContentApi'
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
    return draftsList.filter(d => d.status !== 'Sent to WordPress' && d.status !== 'Archived')
  }, [draftsList])

  const historyArticles = useMemo(() => {
    return draftsList.filter(d => d.status === 'Sent to WordPress' || d.status === 'Archived')
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

  // Download Formatter
  const formatArticleDownloadText = (article) => {
    const domain = article.domain || (article.siteUrl ? article.siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : 'website')
    const dateStr = article.createdAt || article.created_at ? new Date(article.createdAt || article.created_at).toLocaleString('en-GB') : new Date().toLocaleString('en-GB')
    
    return [
      '==================================================',
      `ARTICLE TITLE: ${article.title || ''}`,
      `META TITLE: ${article.metaTitle || article.meta_title || ''}`,
      `META DESCRIPTION: ${article.metaDescription || article.meta_description || ''}`,
      `SLUG: ${article.slug || ''}`,
      `WEBSITE: ${domain}`,
      `GENERATED: ${dateStr}`,
      '==================================================',
      '',
      article.bodyHtml || article.body_html || ''
    ].join('\n')
  }

  // Single Article Download
  const handleDownloadSingle = (article) => {
    const text = formatArticleDownloadText(article)
    const slug = article.slug || 'hub-article'
    const domain = article.domain || 'website'
    const filename = `${domain}-${slug}.txt`

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Download All
  const handleDownloadAll = () => {
    if (generationResults.length === 0) return

    generationResults.forEach((article, idx) => {
      setTimeout(() => {
        handleDownloadSingle(article)
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
          {/* Portfolio Selector */}
          <div className="hub-portfolio-bar">
            <span className="hub-portfolio-label">PORTFOLIO:</span>
            <button
              type="button"
              className={`hub-portfolio-btn ${selectedPortfolio === 'TSE' ? 'active' : ''}`}
              onClick={() => handlePortfolioChange('TSE')}
            >
              TSE ({sites.filter(s => getSitePortfolio(s) === 'TSE').length})
            </button>
            <button
              type="button"
              className={`hub-portfolio-btn ${selectedPortfolio === 'CHILI' ? 'active' : ''}`}
              onClick={() => handlePortfolioChange('CHILI')}
            >
              CHILI ({sites.filter(s => getSitePortfolio(s) === 'CHILI').length})
            </button>
          </div>

          {/* Website Selection Table */}
          <div className="hub-panel">
            <div className="hub-panel-header">
              <div className="hub-panel-header-left">
                <h2 className="hub-panel-title">Select Websites ({selectedPortfolio})</h2>
                <span className="hub-selection-count">
                  {selectedSiteIds.size} of {portfolioSites.length} selected
                </span>
              </div>
              <div className="hub-panel-header-right">
                <button
                  type="button"
                  className="hub-btn-secondary"
                  onClick={handleSelectAll}
                  disabled={portfolioSites.length === 0}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="hub-btn-secondary"
                  onClick={handleDeselectAll}
                  disabled={selectedSiteIds.size === 0}
                >
                  Deselect All
                </button>
              </div>
            </div>

            {loadingSites ? (
              <div className="hub-loading-state">Loading websites...</div>
            ) : portfolioSites.length === 0 ? (
              <div className="hub-empty-state">No websites found in {selectedPortfolio} portfolio.</div>
            ) : (
              <div className="hub-table-wrapper">
                <table className="hub-table">
                  <thead>
                    <tr>
                      <th style={{ width: '48px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedSiteIds.size === portfolioSites.length && portfolioSites.length > 0}
                          onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                        />
                      </th>
                      <th>Website / Business Name</th>
                      <th>Domain</th>
                      <th>Platform</th>
                      <th>Portfolio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioSites.map(site => {
                      const isSelected = selectedSiteIds.has(site.id)
                      const domain = (site.url || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
                      return (
                        <tr
                          key={site.id}
                          className={isSelected ? 'selected-row' : ''}
                          onClick={() => handleToggleSite(site.id)}
                        >
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSite(site.id)}
                            />
                          </td>
                          <td className="site-name-cell">
                            <strong>{site.name || domain}</strong>
                          </td>
                          <td className="site-domain-cell">
                            <a href={site.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              {domain}
                            </a>
                          </td>
                          <td>
                            <span className="hub-badge platform-badge">{site.platform || 'WordPress'}</span>
                          </td>
                          <td>
                            <span className={`hub-badge portfolio-badge ${selectedPortfolio.toLowerCase()}`}>
                              {selectedPortfolio}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action Bar */}
            <div className="hub-action-bar">
              <div className="hub-action-summary">
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
                  <p className="hub-results-desc">Review, refine and download the generated content.</p>
                </div>
                <button
                  type="button"
                  className="hub-btn-primary hub-btn-download-all"
                  onClick={handleDownloadAll}
                >
                  📥 Download All ({generationResults.length})
                </button>
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
                    onDownload={() => handleDownloadSingle(article)}
                    onDelete={() => setDraftToDelete(article)}
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
                <span className="hub-selection-count">Articles requiring review or action</span>
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
                    onDownload={() => handleDownloadSingle(draft)}
                    onDelete={() => setDraftToDelete(draft)}
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
                <h2 className="hub-panel-title">Completed & Archive History ({historyArticles.length})</h2>
                <span className="hub-selection-count">Articles published or archived</span>
              </div>
              <button type="button" className="hub-btn-secondary" onClick={loadDrafts} disabled={loadingDrafts}>
                {loadingDrafts ? 'Refreshing...' : 'Refresh History'}
              </button>
            </div>

            {loadingDrafts ? (
              <div className="hub-loading-state">Loading history...</div>
            ) : historyArticles.length === 0 ? (
              <div className="hub-empty-state">No archived or published articles yet.</div>
            ) : (
              <div className="hub-articles-list">
                {historyArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onSave={(updated) => handleSaveArticle(updated)}
                    onDownload={() => handleDownloadSingle(article)}
                    onDelete={() => setDraftToDelete(article)}
                    isSaving={savingDraftId === article.id}
                  />
                ))}
              </div>
            )}
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
function ArticleCard({ article, index, onSave, onDownload, onDelete, isSaving }) {
  const [title, setTitle] = useState(article.title || '')
  const [metaTitle, setMetaTitle] = useState(article.metaTitle || article.meta_title || '')
  const [metaDescription, setMetaDescription] = useState(article.metaDescription || article.meta_description || '')
  const [slug, setSlug] = useState(article.slug || '')
  const [bodyHtml, setBodyHtml] = useState(article.bodyHtml || article.body_html || '')
  const [viewMode, setViewMode] = useState('preview') // 'preview' | 'html'
  const [isExpanded, setIsExpanded] = useState(true)
  const [copied, setCopied] = useState(false)

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
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=[\"\']([^\"\']+)["\'][^>]*>(.*?)<\/a>/gi
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

  return (
    <div className="hub-article-card">
      <div className="hub-article-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="hub-article-header-left">
          <span className="hub-domain-pill">{businessName}</span>
          <h3 className="hub-article-card-title">{title || 'Untitled Article'}</h3>
        </div>
        <div className="hub-article-header-right" onClick={(e) => e.stopPropagation()}>
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
            className="hub-btn-download"
            onClick={onDownload}
            title="Download formatted text file"
          >
            📥 Download
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
                🗑️ Delete Draft
              </button>
              <button
                type="button"
                className="hub-btn-secondary"
                onClick={handleLocalSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                className="hub-btn-primary"
                onClick={onDownload}
              >
                📥 Download Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
