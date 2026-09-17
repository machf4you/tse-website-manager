import React, { useState, useEffect, useMemo } from 'react'
import { getWebsitesApi, getWpPackageApi } from '../services/websiteManagerApi'
import { extractPagesFromPackage } from '../utils/packageExtractor'
import {
  getWordPressCategoriesApi,
  suggestArticleOpportunityApi,
  generateArticleApi,
  getArticleDraftsApi,
  saveArticleDraftApi,
  sendDraftToWordPressApi
} from '../services/articlesApi'
import './ArticlesPage.css'

export default function ArticlesPage({ currentUser, navigate }) {
  const [activeTab, setActiveTab] = useState('new-article') // 'new-article' | 'drafts'

  // Step 1: Sites
  const [sites, setSites] = useState([])
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [loadingSites, setLoadingSites] = useState(true)

  // Step 2: Target Page
  const [sitePages, setSitePages] = useState([])
  const [selectedPage, setSelectedPage] = useState(null)
  const [loadingPages, setLoadingPages] = useState(false)

  // Step 3: Opportunity
  const [opportunity, setOpportunity] = useState(null)
  const [proposedTitle, setProposedTitle] = useState('')
  const [primaryTopic, setPrimaryTopic] = useState('')
  const [targetAnchor, setTargetAnchor] = useState('')
  const [notes, setNotes] = useState('')
  const [loadingOpportunity, setLoadingOpportunity] = useState(false)

  // Step 4 & 5: Generated Article & Review
  const [articleDraft, setArticleDraft] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [articleTitle, setArticleTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [viewMode, setViewMode] = useState('preview') // 'preview' | 'html'

  // Step 6: Saving / Sending
  const [savingDraft, setSavingDraft] = useState(false)
  const [sendingToWp, setSendingToWp] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)
  const [wpSuccessResult, setWpSuccessResult] = useState(null)

  // Drafts List
  const [draftsList, setDraftsList] = useState([])
  const [loadingDrafts, setLoadingDrafts] = useState(false)

  // 1. Fetch eligible WordPress websites
  useEffect(() => {
    let isMounted = true
    setLoadingSites(true)
    getWebsitesApi().then(allSites => {
      if (!isMounted) return
      // Filter for WordPress sites with configured credentials
      const wpSites = (Array.isArray(allSites) ? allSites : []).filter(s => {
        const hasUser = s.wpUser || s.wp_user || s.configData?.wpUser || s.connectedUser || s.configData?.connectedUser
        const hasPass = s.wpPass || s.wp_pass || s.configData?.wpPass
        const isNotMagento = s.platform !== 'magento'
        return isNotMagento && Boolean(hasUser) && Boolean(hasPass)
      })
      setSites(wpSites)
      if (wpSites.length > 0 && !selectedSiteId) {
        setSelectedSiteId(wpSites[0].id)
      }
      setLoadingSites(false)
    }).catch(err => {
      if (isMounted) {
        console.error('Failed to load websites:', err)
        setLoadingSites(false)
      }
    })
    return () => { isMounted = false }
  }, [])

  // 2. Fetch pages & categories when selectedSiteId changes
  useEffect(() => {
    if (!selectedSiteId) {
      setSitePages([])
      setCategories([])
      return
    }

    let isMounted = true
    setLoadingPages(true)
    setSelectedPage(null)
    setOpportunity(null)
    setArticleDraft(null)
    setWpSuccessResult(null)
    setActionMessage(null)

    // Load pages from package
    getWpPackageApi(selectedSiteId).then(pkgRes => {
      if (!isMounted) return
      const pkg = pkgRes?.packageData || pkgRes
      if (pkg) {
        const site = sites.find(s => String(s.id) === String(selectedSiteId))
        const extracted = extractPagesFromPackage(pkg, site?.url || '')
        // Filter for Hub and Landing pages (excluding Excluded)
        const hubsAndLandings = extracted.filter(p => {
          const type = p.type || p.seoPageType
          return (type === 'Hub' || type === 'Landing') && !p.isExcluded && type !== 'Excluded'
        })
        setSitePages(hubsAndLandings)
        if (hubsAndLandings.length > 0) {
          setSelectedPage(hubsAndLandings[0])
        }
      }
      setLoadingPages(false)
    }).catch(err => {
      if (isMounted) {
        console.warn('Failed loading pages for site:', err)
        setLoadingPages(false)
      }
    })

    // Load categories
    setLoadingCategories(true)
    getWordPressCategoriesApi(selectedSiteId).then(res => {
      if (!isMounted) return
      if (res && Array.isArray(res.categories)) {
        setCategories(res.categories)
      }
      setLoadingCategories(false)
    }).catch(err => {
      if (isMounted) {
        console.warn('Failed loading categories for site:', err)
        setLoadingCategories(false)
      }
    })

    return () => { isMounted = false }
  }, [selectedSiteId])

  // 3. Auto-suggest opportunity when selectedPage changes
  useEffect(() => {
    if (!selectedSiteId || !selectedPage) return
    let isMounted = true
    setLoadingOpportunity(true)
    suggestArticleOpportunityApi({
      siteId: selectedSiteId,
      targetPage: selectedPage
    }).then(res => {
      if (!isMounted) return
      if (res && res.opportunity) {
        setOpportunity(res.opportunity)
        setProposedTitle(res.opportunity.proposedTitle || '')
        setPrimaryTopic(res.opportunity.primaryTopic || '')
        setTargetAnchor(res.opportunity.suggestedAnchor || selectedPage.targetPhrase || selectedPage.title || '')
      }
      setLoadingOpportunity(false)
    }).catch(err => {
      if (isMounted) {
        console.error('Error suggesting article opportunity:', err)
        setLoadingOpportunity(false)
      }
    })
    return () => { isMounted = false }
  }, [selectedPage, selectedSiteId])

  // Fetch Drafts list
  const loadDraftsList = () => {
    setLoadingDrafts(true)
    getArticleDraftsApi().then(res => {
      if (res && Array.isArray(res.drafts)) {
        setDraftsList(res.drafts)
      }
      setLoadingDrafts(false)
    }).catch(err => {
      console.error('Error fetching drafts:', err)
      setLoadingDrafts(false)
    })
  }

  useEffect(() => {
    if (activeTab === 'drafts') {
      loadDraftsList()
    }
  }, [activeTab])

  const selectedSite = useMemo(() => {
    return sites.find(s => String(s.id) === String(selectedSiteId))
  }, [sites, selectedSiteId])

  // Handler: Re-suggest opportunity
  const handleRegenerateOpportunity = () => {
    if (!selectedSiteId || !selectedPage) return
    setLoadingOpportunity(true)
    suggestArticleOpportunityApi({
      siteId: selectedSiteId,
      targetPage: selectedPage
    }).then(res => {
      if (res && res.opportunity) {
        setOpportunity(res.opportunity)
        setProposedTitle(res.opportunity.proposedTitle || '')
        setPrimaryTopic(res.opportunity.primaryTopic || '')
        setTargetAnchor(res.opportunity.suggestedAnchor || selectedPage.targetPhrase || selectedPage.title || '')
      }
      setLoadingOpportunity(false)
    }).catch(err => {
      alert(`Failed suggesting opportunity: ${err.message}`)
      setLoadingOpportunity(false)
    })
  }

  // Handler: Generate Full Article
  const handleGenerateArticle = async () => {
    if (!selectedSiteId || !selectedPage || !proposedTitle) {
      alert('Please select a website, target page, and provide a proposed title.')
      return
    }

    setGenerating(true)
    setActionMessage(null)
    setWpSuccessResult(null)

    try {
      const res = await generateArticleApi({
        siteId: selectedSiteId,
        targetPageUrl: selectedPage.url || selectedPage.link,
        targetPageTitle: selectedPage.title,
        targetPhrase: selectedPage.targetPhrase || selectedPage.target_phrase || '',
        proposedTitle,
        primaryTopic,
        targetAnchor: targetAnchor || selectedPage.targetPhrase || selectedPage.title,
        notes
      })

      if (res && res.success) {
        setArticleDraft(res)
        setArticleTitle(res.title || proposedTitle)
        setSlug(res.slug || '')
        setMetaTitle(res.metaTitle || res.title || '')
        setMetaDescription(res.metaDescription || '')
        setBodyHtml(res.bodyHtml || '')
        setActionMessage({ type: 'success', text: 'Article generated successfully! Please review, edit, and select category.' })
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: `Generation failed: ${err.message}` })
    } finally {
      setGenerating(false)
    }
  }

  // Handler: Save Local Draft
  const handleSaveDraft = async () => {
    if (!articleTitle || !bodyHtml) {
      alert('Article title and body are required.')
      return
    }

    setSavingDraft(true)
    setActionMessage(null)

    const draftId = articleDraft?.draftId || articleDraft?.id || `draft-${Date.now()}`
    const catObj = categories.find(c => String(c.id) === String(selectedCategoryId))

    try {
      const res = await saveArticleDraftApi({
        id: draftId,
        siteId: selectedSiteId,
        targetPageUrl: selectedPage?.url || articleDraft?.target_page_url || '',
        targetPageTitle: selectedPage?.title || articleDraft?.target_page_title || '',
        targetPhrase: selectedPage?.targetPhrase || articleDraft?.target_phrase || '',
        topic: primaryTopic || articleDraft?.topic || '',
        title: articleTitle,
        metaTitle,
        metaDescription,
        slug,
        bodyHtml,
        categoryId: selectedCategoryId ? parseInt(selectedCategoryId, 10) : null,
        categoryName: catObj?.name || null,
        primaryLinkUrl: selectedPage?.url || articleDraft?.primary_link_url || '',
        primaryLinkAnchor: targetAnchor || articleDraft?.primary_link_anchor || '',
        status: articleDraft?.status || 'Saved',
        createdAt: articleDraft?.created_at || articleDraft?.createdAt || new Date().toISOString()
      })

      if (res && res.success) {
        setArticleDraft(res.draft)
        setActionMessage({ type: 'success', text: 'Draft saved locally in Website Manager.' })
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: `Failed saving draft: ${err.message}` })
    } finally {
      setSavingDraft(false)
    }
  }

  // Handler: Send to WordPress as DRAFT
  const handleSendToWordPress = async () => {
    const draftId = articleDraft?.draftId || articleDraft?.id
    if (!draftId) {
      alert('Please save or generate the article first.')
      return
    }

    if (sendingToWp) return // Prevent double click

    setSendingToWp(true)
    setActionMessage(null)
    setWpSuccessResult(null)

    try {
      // 1. Ensure latest edits are saved first
      await handleSaveDraft()

      // 2. Send to WordPress
      const res = await sendDraftToWordPressApi(draftId)
      if (res && res.success) {
        setWpSuccessResult(res)
        setActionMessage({
          type: 'success',
          text: `Successfully created WordPress DRAFT Post #${res.wpPostId}!`
        })
        setArticleDraft(prev => prev ? { ...prev, status: 'Sent to WordPress', wp_post_id: res.wpPostId, wp_edit_url: res.wpEditUrl } : prev)
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: `WordPress draft creation failed: ${err.message}` })
    } finally {
      setSendingToWp(false)
    }
  }

  // Load draft into editor from Drafts tab
  const handleResumeDraft = (draft) => {
    setSelectedSiteId(draft.site_id)
    setArticleDraft(draft)
    setArticleTitle(draft.title || '')
    setSlug(draft.slug || '')
    setMetaTitle(draft.meta_title || draft.title || '')
    setMetaDescription(draft.meta_description || '')
    setBodyHtml(draft.body_html || '')
    setSelectedCategoryId(draft.category_id ? String(draft.category_id) : '')
    setProposedTitle(draft.title || '')
    setPrimaryTopic(draft.topic || '')
    setTargetAnchor(draft.primary_link_anchor || '')
    if (draft.status === 'Sent to WordPress' && draft.wp_post_id) {
      setWpSuccessResult({ wpPostId: draft.wp_post_id, wpEditUrl: draft.wp_edit_url })
    } else {
      setWpSuccessResult(null)
    }
    setActiveTab('new-article')
  }

  return (
    <div className="articles-page-container">
      {/* Top Header */}
      <div className="articles-header">
        <div>
          <h1 className="articles-title">Article Automation</h1>
          <p className="articles-subtitle">
            Create on-site supporting editorial articles that build topical authority and link to your Hub & Landing pages.
          </p>
        </div>
        <div className="articles-nav-tabs">
          <button
            type="button"
            className={`articles-nav-btn ${activeTab === 'new-article' ? 'active' : ''}`}
            onClick={() => setActiveTab('new-article')}
          >
            + Create New Article
          </button>
          <button
            type="button"
            className={`articles-nav-btn ${activeTab === 'drafts' ? 'active' : ''}`}
            onClick={() => setActiveTab('drafts')}
          >
            Drafts & History {draftsList.length > 0 ? `(${draftsList.length})` : ''}
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`articles-banner banner-${actionMessage.type}`}>
          {actionMessage.text}
        </div>
      )}

      {/* TAB 1: NEW ARTICLE WORKFLOW */}
      {activeTab === 'new-article' && (
        <div className="articles-workflow-grid">
          {/* LEFT COLUMN: SELECTION & BRIEF */}
          <div className="workflow-sidebar">
            {/* Step 1: Website Selection */}
            <div className="wf-card">
              <div className="wf-card-header">
                <span className="wf-step-badge">1</span>
                <h3>Select Website</h3>
              </div>
              <div className="wf-card-body">
                {loadingSites ? (
                  <div className="wf-muted">Loading connected websites...</div>
                ) : sites.length === 0 ? (
                  <div className="wf-empty">No WordPress websites connected with application passwords.</div>
                ) : (
                  <select
                    className="wf-select"
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                  >
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.url} ({s.url?.replace(/^https?:\/\//, '').replace(/\/+$/, '')})
                      </option>
                    ))}
                  </select>
                )}
                {selectedSite && (
                  <div className="wf-site-badge">
                    <span className="platform-tag">WordPress</span>
                    <span className="site-url-text">{selectedSite.url}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Target Hub/Landing Page */}
            <div className="wf-card">
              <div className="wf-card-header">
                <span className="wf-step-badge">2</span>
                <h3>Target Hub or Landing Page</h3>
              </div>
              <div className="wf-card-body">
                {loadingPages ? (
                  <div className="wf-muted">Extracting Hub & Landing pages...</div>
                ) : sitePages.length === 0 ? (
                  <div className="wf-empty">No Hub or Landing pages found in site package.</div>
                ) : (
                  <div className="wf-target-pages-list">
                    {sitePages.map(p => {
                      const isSelected = selectedPage?.url === p.url
                      const type = p.type || p.seoPageType || 'Landing'
                      return (
                        <div
                          key={p.url || p.id}
                          className={`wf-target-page-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedPage(p)}
                        >
                          <div className="wf-page-top">
                            <span className={`page-type-pill pill-${type.toLowerCase()}`}>{type}</span>
                            <span className="wf-page-title">{p.title}</span>
                          </div>
                          <div className="wf-page-url">{p.url}</div>
                          {p.targetPhrase && (
                            <div className="wf-page-phrase">
                              <strong>Target Phrase:</strong> {p.targetPhrase}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Article Opportunity */}
            {selectedPage && (
              <div className="wf-card">
                <div className="wf-card-header">
                  <span className="wf-step-badge">3</span>
                  <h3>Article Opportunity</h3>
                </div>
                <div className="wf-card-body">
                  {loadingOpportunity ? (
                    <div className="wf-muted">Checking site content & proposing opportunity...</div>
                  ) : (
                    <div className="wf-opp-form">
                      <div className="form-group">
                        <label className="form-label">Proposed Article Headline</label>
                        <input
                          type="text"
                          className="form-input"
                          value={proposedTitle}
                          onChange={(e) => setProposedTitle(e.target.value)}
                          placeholder="e.g. Essential Factors to Consider When Choosing..."
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Primary Topic / Purpose</label>
                        <input
                          type="text"
                          className="form-input"
                          value={primaryTopic}
                          onChange={(e) => setPrimaryTopic(e.target.value)}
                          placeholder="e.g. Buyer & Decision Guide"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Suggested Primary Anchor Text</label>
                        <input
                          type="text"
                          className="form-input"
                          value={targetAnchor}
                          onChange={(e) => setTargetAnchor(e.target.value)}
                          placeholder="Anchor text for link back to target Hub"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Additional Editorial Notes (Optional)</label>
                        <textarea
                          className="form-textarea"
                          rows="2"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Specific angles, products, or tone instructions..."
                        />
                      </div>

                      <div className="wf-opp-actions">
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={handleRegenerateOpportunity}
                          disabled={loadingOpportunity}
                        >
                          Regenerate Idea
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={handleGenerateArticle}
                          disabled={generating || !proposedTitle}
                        >
                          {generating ? 'Generating Article...' : 'Generate Full Article'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: ARTICLE REVIEW, EDIT & PUBLISH */}
          <div className="workflow-main">
            {generating ? (
              <div className="wf-generating-card">
                <div className="spinner-large" />
                <h3>Generating High-Authority On-Site Article...</h3>
                <p>Applying UK editorial guidelines, metadata standards, and seamless internal link insertion.</p>
              </div>
            ) : articleDraft || bodyHtml ? (
              <div className="wf-review-card">
                {/* Review Header */}
                <div className="wf-review-header">
                  <div>
                    <h2>Review & Edit Article</h2>
                    <p className="wf-muted">Review headline, metadata, category, and body text before sending to WordPress as a Draft.</p>
                  </div>
                  <div className="wf-view-toggle">
                    <button
                      type="button"
                      className={`toggle-btn ${viewMode === 'preview' ? 'active' : ''}`}
                      onClick={() => setViewMode('preview')}
                    >
                      Visual Preview
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${viewMode === 'html' ? 'active' : ''}`}
                      onClick={() => setViewMode('html')}
                    >
                      Raw HTML
                    </button>
                  </div>
                </div>

                {/* WordPress Draft Success Card */}
                {wpSuccessResult && (
                  <div className="wp-success-box">
                    <div className="wp-success-title">
                      ✓ Created WordPress Draft Post #{wpSuccessResult.wpPostId}
                    </div>
                    <p>The post is saved as a <strong>DRAFT</strong> in WordPress. Nothing is published live.</p>
                    {wpSuccessResult.wpEditUrl && (
                      <a
                        href={wpSuccessResult.wpEditUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-wp-edit"
                      >
                        Open Draft in WordPress Admin →
                      </a>
                    )}
                  </div>
                )}

                {/* Article Fields Form */}
                <div className="review-form">
                  <div className="form-row">
                    <div className="form-group flex-2">
                      <label className="form-label">Article Headline</label>
                      <input
                        type="text"
                        className="form-input"
                        value={articleTitle}
                        onChange={(e) => setArticleTitle(e.target.value)}
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label className="form-label">URL Slug</label>
                      <input
                        type="text"
                        className="form-input"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <div className="label-with-counter">
                        <label className="form-label">Meta Title (Yoast / RankMath)</label>
                        <span className={`char-counter ${metaTitle.length > 60 ? 'counter-warning' : ''}`}>
                          {metaTitle.length}/60
                        </span>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label className="form-label">WordPress Category</label>
                      {loadingCategories ? (
                        <div className="wf-muted">Loading categories...</div>
                      ) : (
                        <select
                          className="form-select"
                          value={selectedCategoryId}
                          onChange={(e) => setSelectedCategoryId(e.target.value)}
                        >
                          <option value="">-- Select WordPress Category --</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.count} posts)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="label-with-counter">
                      <label className="form-label">Meta Description</label>
                      <span className={`char-counter ${metaDescription.length > 160 ? 'counter-warning' : ''}`}>
                        {metaDescription.length}/160
                      </span>
                    </div>
                    <textarea
                      className="form-textarea"
                      rows="2"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                    />
                  </div>

                  {/* Embedded Links Summary */}
                  <div className="embedded-links-card">
                    <div className="embedded-links-title">Embedded Internal Links:</div>
                    <div className="embedded-link-item">
                      <span className="link-badge">Primary Hub Link</span>
                      <span className="link-url-display">{selectedPage?.url || articleDraft?.primary_link_url}</span>
                      <span className="link-anchor-display">Anchor: "{targetAnchor || articleDraft?.primary_link_anchor}"</span>
                    </div>
                  </div>

                  {/* Body Content Editor / Preview */}
                  <div className="form-group">
                    <label className="form-label">Article Body Copy</label>
                    {viewMode === 'preview' ? (
                      <div
                        className="article-rendered-preview"
                        dangerouslySetInnerHTML={{ __html: bodyHtml }}
                      />
                    ) : (
                      <textarea
                        className="form-textarea code-font"
                        rows="18"
                        value={bodyHtml}
                        onChange={(e) => setBodyHtml(e.target.value)}
                      />
                    )}
                  </div>

                  {/* Review Action Buttons */}
                  <div className="review-actions-bar">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleGenerateArticle}
                      disabled={generating}
                    >
                      Regenerate
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleSaveDraft}
                      disabled={savingDraft || sendingToWp}
                    >
                      {savingDraft ? 'Saving Draft...' : 'Save Local Draft'}
                    </button>
                    <button
                      type="button"
                      className="btn-publish-wp"
                      onClick={handleSendToWordPress}
                      disabled={sendingToWp || !bodyHtml}
                    >
                      {sendingToWp ? 'Sending to WordPress...' : 'Send to WordPress as DRAFT'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="wf-placeholder-card">
                <div className="placeholder-icon">✍️</div>
                <h3>Ready to Create Supporting Article</h3>
                <p>Select your website and target Hub or Landing page on the left, then click <strong>Generate Full Article</strong> to start.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DRAFTS & HISTORY */}
      {activeTab === 'drafts' && (
        <div className="drafts-history-container">
          <div className="drafts-header">
            <h2>Saved Article Drafts & Publication History</h2>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={loadDraftsList}
              disabled={loadingDrafts}
            >
              Refresh Drafts
            </button>
          </div>

          {loadingDrafts ? (
            <div className="wf-muted">Loading article drafts...</div>
          ) : draftsList.length === 0 ? (
            <div className="wf-empty-table">No article drafts found. Generate an article to begin.</div>
          ) : (
            <div className="drafts-table-wrapper">
              <table className="drafts-table">
                <thead>
                  <tr>
                    <th>Article Headline</th>
                    <th>Target Page</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {draftsList.map(d => {
                    const statusClass = d.status === 'Sent to WordPress' ? 'status-sent' : 'status-draft'
                    return (
                      <tr key={d.id}>
                        <td>
                          <div className="draft-title-cell">{d.title}</div>
                          <div className="draft-slug-cell">{d.slug}</div>
                        </td>
                        <td>
                          <div className="draft-target-cell">{d.target_page_title || d.target_page_url}</div>
                          <div className="draft-url-cell">{d.target_page_url}</div>
                        </td>
                        <td>{d.category_name || (d.category_id ? `Category #${d.category_id}` : '—')}</td>
                        <td>
                          <span className={`status-pill ${statusClass}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="draft-date-cell">
                          {d.created_at ? new Date(d.created_at).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td>
                          <div className="draft-actions">
                            <button
                              type="button"
                              className="btn-action-view"
                              onClick={() => handleResumeDraft(d)}
                            >
                              Edit / Review
                            </button>
                            {d.wp_edit_url && (
                              <a
                                href={d.wp_edit_url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-action-wp"
                              >
                                WP Draft #{d.wp_post_id} ↗
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
