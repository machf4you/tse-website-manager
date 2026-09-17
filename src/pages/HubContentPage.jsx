import React, { useState, useEffect, useMemo } from 'react'
import { getWebsitesApi, getActiveRegistryDomainsApi } from '../services/websiteManagerApi'
import {
  batchGenerateHubContentApi,
  getArticleDraftsApi,
  saveArticleDraftApi
} from '../services/hubContentApi'
import './HubContentPage.css'

export default function HubContentPage({ currentUser, navigate }) {
  const [activeTab, setActiveTab] = useState('generate') // 'generate' | 'drafts'
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

      if (res && res.results) {
        setGenerationResults(res.results)
        setGenerationErrors(res.errors || [])
        setStatusMessage({
          type: 'success',
          text: `Successfully generated ${res.results.length} Hub Content article${res.results.length === 1 ? '' : 's'}!`
        })
      } else {
        throw new Error(res?.error || 'Batch generation returned empty response.')
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
    const dateStr = article.createdAt ? new Date(article.createdAt).toLocaleString('en-GB') : new Date().toLocaleString('en-GB')
    
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

  // Load Drafts
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
    if (activeTab === 'drafts') {
      loadDrafts()
    }
  }, [activeTab])

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
        status: 'Draft'
      }

      await saveArticleDraftApi(payload)
      
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

  return (
    <div className="hub-content-container">
      {/* Top Header */}
      <header className="hub-content-header">
        <div className="hub-header-title-row">
          <div>
            <h1 className="hub-page-title">Hub Content</h1>
            <p className="hub-page-subtitle">
              Generate high-quality, on-site supporting articles for connected websites.
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
              Drafts & History
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className={`hub-alert-banner ${statusMessage.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            <span>{statusMessage.text}</span>
            <button type="button" className="alert-close-btn" onClick={() => setStatusMessage(null)}>×</button>
          </div>
        )}
      </header>

      {/* Main Tab 1: Generate Content */}
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

          {/* Website Selection Panel */}
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

            {/* Action Bar */}
            <div className="hub-action-footer">
              <div className="hub-action-info">
                <span>⚡ Phase 1: 1 article will be generated per selected domain automatically.</span>
              </div>
              <button
                type="button"
                className="hub-btn-primary hub-btn-generate"
                onClick={handleBatchGenerate}
                disabled={generating || selectedSiteIds.size === 0}
              >
                {generating ? (
                  <>
                    <span className="spinner-icon" /> Generating Hub Content...
                  </>
                ) : (
                  <>
                    ✨ Generate Hub Content ({selectedSiteIds.size} Selected)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generating Progress State */}
          {generating && generationProgress && (
            <div className="hub-progress-card">
              <div className="hub-progress-header">
                <span className="hub-progress-status">{generationProgress.status}</span>
                <span className="hub-progress-pct">In Progress</span>
              </div>
              <div className="hub-progress-bar-bg">
                <div className="hub-progress-bar-fill animated-bar" />
              </div>
            </div>
          )}

          {/* Results Section */}
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
                  <strong>Notice:</strong> {generationErrors.length} site(s) failed during generation. Check logs or verify API credentials.
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
                    isSaving={savingDraftId === (article.draftId || article.id)}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Main Tab 2: Drafts & History */}
      {activeTab === 'drafts' && (
        <div className="hub-drafts-view">
          <div className="hub-panel">
            <div className="hub-panel-header">
              <h2 className="hub-panel-title">Saved Hub Content Drafts</h2>
              <button type="button" className="hub-btn-secondary" onClick={loadDrafts} disabled={loadingDrafts}>
                {loadingDrafts ? 'Refreshing...' : 'Refresh List'}
              </button>
            </div>

            {loadingDrafts ? (
              <div className="hub-loading-state">Loading saved drafts...</div>
            ) : draftsList.length === 0 ? (
              <div className="hub-empty-state">No saved drafts yet. Generate your first Hub Content above!</div>
            ) : (
              <div className="hub-articles-list">
                {draftsList.map((draft) => (
                  <ArticleCard
                    key={draft.id}
                    article={draft}
                    onSave={(updated) => handleSaveArticle(updated)}
                    onDownload={() => handleDownloadSingle(draft)}
                    isSaving={savingDraftId === draft.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ArticleCard({ article, index, onSave, onDownload, isSaving }) {
  const [title, setTitle] = useState(article.title || '')
  const [metaTitle, setMetaTitle] = useState(article.metaTitle || article.meta_title || '')
  const [metaDescription, setMetaDescription] = useState(article.metaDescription || article.meta_description || '')
  const [slug, setSlug] = useState(article.slug || '')
  const [bodyHtml, setBodyHtml] = useState(article.bodyHtml || article.body_html || '')
  const [viewMode, setViewMode] = useState('preview') // 'preview' | 'html'
  const [isExpanded, setIsExpanded] = useState(true)
  const [copied, setCopied] = useState(false)

  const domain = article.domain || (article.siteUrl ? article.siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : 'website')

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
          <span className="hub-domain-pill">{domain}</span>
          <h3 className="hub-article-card-title">{title || 'Untitled Article'}</h3>
        </div>
        <div className="hub-article-header-right" onClick={(e) => e.stopPropagation()}>
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

          {/* Article Content Section */}
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
                rows={12}
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
              />
            )}
          </div>

          {/* Card Footer Actions */}
          <div className="hub-card-footer">
            <div className="hub-card-footer-left">
              {article.targetPageUrl && (
                <span className="hub-target-link-badge">
                  🔗 Internal Target: <code>{article.targetPageUrl}</code>
                </span>
              )}
            </div>
            <div className="hub-card-footer-right">
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
