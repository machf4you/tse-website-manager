import { useState, useMemo, useEffect } from 'react'
import { getPathSlugForMatching, normalizeUrlForMatching } from '../utils/urlUtils'
import {
  getExistingInternalLinks,
  getRecommendedInternalLinks,
  generateContextualReplacement,
  generateSimpleInternalLinkRecommendations
} from '../utils/internalLinkingHelper'
import {
  getInternalLinkRecommendationsApi,
  saveInternalLinkRecommendationsApi
} from '../services/websiteManagerApi'
import './InternalLinkingPage.css'

export function renderHighlightedText(text, anchorText) {
  if (!text) return ''
  if (!anchorText || !anchorText.trim()) return text

  const lowerText = text.toLowerCase()
  const lowerAnchor = anchorText.trim().toLowerCase()
  const matchIndex = lowerText.indexOf(lowerAnchor)

  if (matchIndex === -1) {
    return text
  }

  const before = text.slice(0, matchIndex)
  const matched = text.slice(matchIndex, matchIndex + lowerAnchor.length)
  const after = text.slice(matchIndex + lowerAnchor.length)

  return (
    <>
      {before}
      <span className="il-anchor-highlight">{matched}</span>
      {after}
    </>
  )
}

export default function InternalLinkingPage({ site, pagesList, initialSelectedUrl, onNavigateTab, onNavigateBack }) {
  const [expandedUrl, setExpandedUrl] = useState(() => {
    if (initialSelectedUrl) {
      return initialSelectedUrl
    }
    return pagesList?.[0]?.url || ''
  })

  const storageKey = site?.id ? `tse_w5_recommendations_${site.id}` : 'tse_w5_recommendations_default'

  const [savedRecs, setSavedRecs] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : {}
    } catch (e) {
      console.error('Failed to read saved link recommendations:', e)
      return {}
    }
  })

  const [editingRecs, setEditingRecs] = useState({})
  const [editTextMap, setEditTextMap] = useState({})

  // Hydrate saved recommendations from backend API if available
  useEffect(() => {
    if (!site?.id) return
    let isMounted = true
    getInternalLinkRecommendationsApi(site.id).then(res => {
      if (isMounted && res && typeof res === 'object') {
        setSavedRecs(prev => ({ ...prev, ...res }))
      }
    }).catch(() => {})
    return () => { isMounted = false }
  }, [site?.id])

  const [aiSentences, setAiSentences] = useState({})
  const [generatingIds, setGeneratingIds] = useState({})

  const websiteTitle = site?.name || 'The Search Equation'
  const websiteUrl = site?.url || 'https://www.thesearchequation.com'

  // Filter active non-excluded pages strictly by W3 Type configuration
  const activePages = useMemo(() => {
    if (!Array.isArray(pagesList)) return []
    return pagesList.filter(p => {
      const typeStr = (p.type || p.seoPageType || '').trim().toLowerCase()
      return !p.isExcluded && typeStr !== 'excluded' && typeStr !== 'unclassified / excluded'
    })
  }, [pagesList])

  const pagesWithData = useMemo(() => {
    if (!Array.isArray(activePages)) return []
    return activePages.map(page => {
      const existing = getExistingInternalLinks(page.url, activePages)
      const targetPhrase = page.targetPhrase || page.target || ''
      const recommended = getRecommendedInternalLinks(page.url, targetPhrase, activePages, existing)
      const count = existing.length
      const needsLinks = count < 3

      return {
        ...page,
        slug: getPathSlugForMatching(page.url) || page.url || '/',
        existing,
        recommended,
        incomingCount: count,
        needsLinks
      }
    })
  }, [activePages])

  // Group active pages into Hub (green), Landing (blue), Topical (yellow), and Other (slate) sections
  const sections = useMemo(() => {
    const hubPages = pagesWithData.filter(p => {
      const t = (p.type || p.seoPageType || '').trim().toLowerCase()
      return t === 'hub' || t === 'hub page' || t === 'home' || t === 'home page' || p.slug === '/'
    })
    const hubSet = new Set(hubPages.map(p => p.url))

    const landingPages = pagesWithData.filter(p => {
      if (hubSet.has(p.url)) return false
      const t = (p.type || p.seoPageType || '').trim().toLowerCase()
      return t === 'landing page' || t === 'landing'
    })
    const landingSet = new Set(landingPages.map(p => p.url))

    const topicalPages = pagesWithData.filter(p => {
      if (hubSet.has(p.url) || landingSet.has(p.url)) return false
      const t = (p.type || p.seoPageType || '').trim().toLowerCase()
      return t === 'topical' || t === 'topical page'
    })
    const topicalSet = new Set(topicalPages.map(p => p.url))

    const articlePages = pagesWithData.filter(p => {
      if (hubSet.has(p.url) || landingSet.has(p.url) || topicalSet.has(p.url)) return false
      const t = (p.type || p.seoPageType || '').trim().toLowerCase()
      return t === 'article' || t === 'article page'
    })
    const articleSet = new Set(articlePages.map(p => p.url))

    const otherPages = pagesWithData.filter(p => {
      return !hubSet.has(p.url) && !landingSet.has(p.url) && !topicalSet.has(p.url) && !articleSet.has(p.url)
    })

    return [
      { key: 'hub', title: 'HUB PAGE', colorClass: 'sec-theme-green', color: '#10b981', pages: hubPages },
      { key: 'landing', title: 'LANDING PAGES', colorClass: 'sec-theme-blue', color: '#60a5fa', pages: landingPages },
      { key: 'topical', title: 'TOPICAL PAGES', colorClass: 'sec-theme-yellow', color: '#f59e0b', pages: topicalPages },
      { key: 'article', title: 'ARTICLES', colorClass: 'sec-theme-purple', color: '#c084fc', pages: articlePages },
      { key: 'other', title: 'OTHER ACTIVE PAGES', colorClass: 'sec-theme-slate', color: '#94a3b8', pages: otherPages },
    ]
  }, [pagesWithData])

  const typeCounts = useMemo(() => {
    const counts = { total: 0, hub: 0, landing: 0, topical: 0, article: 0, excluded: 0 }
    sections.forEach(sec => {
      if (sec.key === 'hub') counts.hub = sec.pages.length
      if (sec.key === 'landing') counts.landing = sec.pages.length
      if (sec.key === 'topical') counts.topical = sec.pages.length
      if (sec.key === 'article') counts.article = sec.pages.length
    })

    if (Array.isArray(pagesList)) {
      counts.excluded = pagesList.filter(p => {
        const t = (p.type || p.seoPageType || '').trim().toLowerCase()
        return p.isExcluded || t === 'excluded' || t === 'unclassified / excluded'
      }).length
      counts.total = pagesList.length
    } else {
      counts.total = counts.hub + counts.landing + counts.topical + counts.article
    }
    return counts
  }, [sections, pagesList])

  const toggleExpand = (url) => {
    setExpandedUrl(prev => (prev === url ? null : url))
  }

  const handleGenerateSentence = (recId, anchorText, sourcePageInput) => {
    setGeneratingIds(prev => ({ ...prev, [recId]: true }))
    setTimeout(() => {
      let sourcePage = typeof sourcePageInput === 'object' && sourcePageInput !== null ? sourcePageInput : null

      if (!sourcePage && typeof sourcePageInput === 'string') {
        const normInput = normalizeUrlForMatching(sourcePageInput)
        const slugInput = getPathSlugForMatching(sourcePageInput)
        sourcePage = activePages.find(p => {
          if (!p) return false
          const pNorm = normalizeUrlForMatching(p.url)
          const pSlug = getPathSlugForMatching(p.url)
          return (pNorm && pNorm === normInput) || (pSlug && pSlug === slugInput) || p.title === sourcePageInput || p.url === sourcePageInput
        })
      }

      const result = generateContextualReplacement(sourcePage, anchorText)
      setAiSentences(prev => ({
        ...prev,
        [recId]: result
      }))
      setEditTextMap(prev => ({
        ...prev,
        [recId]: result?.suggestedReplacement || ''
      }))
      setGeneratingIds(prev => ({ ...prev, [recId]: false }))
    }, 150)
  }

  const handleStartEdit = (recId, currentText) => {
    setEditingRecs(prev => ({ ...prev, [recId]: true }))
    setEditTextMap(prev => ({
      ...prev,
      [recId]: prev[recId] !== undefined ? prev[recId] : currentText
    }))
  }

  const handleCancelEdit = (recId) => {
    setEditingRecs(prev => ({ ...prev, [recId]: false }))
  }

  const handleSaveRecommendation = (rec, sentenceText) => {
    const textToSave = (sentenceText || '').trim()
    if (!textToSave) return

    const recKey = rec.id || `${rec.sourceUrl || rec.suggestedSourceUrl}_${rec.targetUrl}`
    const payload = {
      id: rec.id,
      sourceUrl: rec.sourceUrl || rec.suggestedSourceUrl,
      targetUrl: rec.targetUrl,
      anchorText: rec.anchorText || rec.targetTitle,
      savedSentence: textToSave,
      isSaved: true,
      updatedAt: new Date().toISOString()
    }

    const updated = {
      ...savedRecs,
      [recKey]: payload
    }

    setSavedRecs(updated)
    setEditingRecs(prev => ({ ...prev, [recKey]: false }))

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to save recommendation to localStorage:', e)
    }

    if (site?.id) {
      saveInternalLinkRecommendationsApi(site.id, updated)
    }
  }

  const renderSentenceCell = (rec) => {
    const recKey = rec.id || `${rec.sourceUrl || rec.suggestedSourceUrl}_${rec.targetUrl}`
    const savedRecord = savedRecs[recKey]
    const aiResult = aiSentences[recKey]
    const isEditing = Boolean(editingRecs[recKey])

    const currentDisplaySentence = savedRecord
      ? savedRecord.savedSentence
      : (aiResult ? aiResult.suggestedReplacement : null)
    const isSaved = Boolean(savedRecord && savedRecord.isSaved)

    if (isEditing) {
      return (
        <div className="il-edit-container">
          <textarea
            className="il-edit-textarea"
            value={editTextMap[recKey] !== undefined ? editTextMap[recKey] : (currentDisplaySentence || '')}
            onChange={(e) => setEditTextMap(prev => ({ ...prev, [recKey]: e.target.value }))}
            rows={3}
            placeholder="Edit suggested sentence..."
          />
          <div className="il-edit-btn-group">
            <button
              type="button"
              className="il-btn-save-rec"
              onClick={() => handleSaveRecommendation(rec, editTextMap[recKey])}
            >
              💾 Save Recommendation
            </button>
            <button
              type="button"
              className="il-btn-cancel-rec"
              onClick={() => handleCancelEdit(recKey)}
            >
              Cancel
            </button>
          </div>
        </div>
      )
    }

    if (currentDisplaySentence) {
      return (
        <div className="il-gen-block">
          <div className="il-gen-header-row">
            <span className="il-gen-heading" style={{ color: isSaved ? '#34d399' : '#60a5fa' }}>
              {isSaved ? 'SAVED RECOMMENDATION ✓' : 'SUGGESTED REPLACEMENT:'}
            </span>
            <button
              type="button"
              className="il-btn-icon-edit"
              onClick={() => handleStartEdit(recKey, currentDisplaySentence)}
              title="Edit sentence inline"
            >
              ✏️ Edit
            </button>
          </div>
          <div className="il-gen-replacement">
            "{renderHighlightedText(currentDisplaySentence, rec.anchorText || rec.targetTitle)}"
          </div>
          <div style={{ marginTop: '8px' }}>
            <button
              type="button"
              className="il-btn-save-rec"
              onClick={() => handleSaveRecommendation(rec, currentDisplaySentence)}
            >
              {isSaved ? '💾 Update Saved' : '💾 Save Recommendation'}
            </button>
          </div>
        </div>
      )
    }

    return (
      <button
        type="button"
        className="il-btn-generate"
        onClick={() => handleGenerateSentence(recKey, rec.anchorText || rec.targetTitle, rec.sourcePageObj || rec.sourceUrl || rec.suggestedSourceUrl)}
        disabled={generatingIds[recKey]}
      >
        {generatingIds[recKey] ? 'Generating...' : '✨ Generate'}
      </button>
    )
  }

  if (!Array.isArray(activePages) || activePages.length === 0) {
    return (
      <div className="il-page-container">
        <div className="il-header-top">
          <button type="button" className="il-back-btn" onClick={onNavigateBack}>
            &larr; Back to W2 | Website Dashboard
          </button>
        </div>
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <h2>No Pages Available for Internal Linking</h2>
          <p style={{ marginTop: '8px' }}>Please synchronise the website in W2 Website Dashboard to load pages.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="il-page-container">
      {/* Header Bar */}
      <div className="il-header-top">
        <button type="button" className="il-back-btn" onClick={onNavigateBack}>
          &larr; Back to W2 | Website Dashboard
        </button>
      </div>

      <div className="il-title-section">
        <div className="il-title-left">
          <span className="il-pill-badge">W5 | INTERNAL LINKING</span>
          <h1 className="il-site-title">{websiteTitle}</h1>
          <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="il-site-url">
            {websiteUrl} &#x2197;
          </a>
        </div>
        <div className="il-title-right">
          <button type="button" className="il-rebuild-btn">
            &#x2728; Rebuild Internal Links
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="il-tab-bar">
        <button type="button" className="il-tab-btn" onClick={() => onNavigateTab?.('w3-manage-pages')}>
          W3 | Manage Pages
        </button>
        <button type="button" className="il-tab-btn" onClick={() => onNavigateTab?.('w4-audit-results')}>
          W4 | Audit Results
        </button>
        <button type="button" className="il-tab-btn il-tab-btn-active">
          W5 | Internal Linking
        </button>
        <button type="button" className="il-tab-btn" onClick={() => onNavigateTab?.('w6-settings')}>
          W6 | Website Settings
        </button>
      </div>

      {/* Page Type Summary Bar */}
      <div className="il-type-summary-bar">
        <div className="il-summary-chip total">
          <span className="il-summary-dot" />
          <span className="il-summary-label">Total Pages:</span>
          <span className="il-summary-count">{typeCounts.total}</span>
        </div>
        <div className="il-summary-chip hub">
          <span className="il-summary-dot" />
          <span className="il-summary-label">Hub Pages:</span>
          <span className="il-summary-count">{typeCounts.hub}</span>
        </div>
        <div className="il-summary-chip landing">
          <span className="il-summary-dot" />
          <span className="il-summary-label">Landing Pages:</span>
          <span className="il-summary-count">{typeCounts.landing}</span>
        </div>
        <div className="il-summary-chip topical">
          <span className="il-summary-dot" />
          <span className="il-summary-label">Topical Pages:</span>
          <span className="il-summary-count">{typeCounts.topical}</span>
        </div>
        <div className="il-summary-chip article">
          <span className="il-summary-dot" />
          <span className="il-summary-label">Article Pages:</span>
          <span className="il-summary-count">{typeCounts.article}</span>
        </div>
        <div className="il-summary-chip excluded">
          <span className="il-summary-dot" />
          <span className="il-summary-label">Excluded Pages:</span>
          <span className="il-summary-count">{typeCounts.excluded}</span>
        </div>
      </div>

      {/* Grouped Page Sections */}
      <div className="il-sections-container">
        {sections.map(sec => {
          if (sec.pages.length === 0) return null

          return (
            <div key={sec.key} className={`il-group-section ${sec.colorClass}`}>
              <div className="il-section-header">
                <h2 className="il-section-title-heading" style={{ color: sec.color }}>
                  <span className="il-header-dot" style={{ backgroundColor: sec.color }} />
                  {sec.title}
                </h2>
                <span
                  className="il-section-count-chip"
                  style={{
                    color: sec.color,
                    backgroundColor: `${sec.color}20`,
                    borderColor: `${sec.color}50`
                  }}
                >
                  {sec.pages.length} {sec.pages.length === 1 ? 'Page' : 'Pages'}
                </span>
              </div>

              <div className="il-pages-list">
                {sec.pages.map(page => {
                  const isExpanded = expandedUrl === page.url
                  const targetPhrase = page.targetPhrase || page.target || 'Not set'
                  const pageTitle = page.title || page.proposedTitle || 'Untitled Page'

          return (
            <div key={page.url} className={`il-page-card ${isExpanded ? 'il-page-card-expanded' : ''}`}>
              {/* Closed / Accordion Header */}
              <div className="il-card-header" onClick={() => toggleExpand(page.url)}>
                <div className="il-card-slug" style={{ color: sec.color }}>{page.slug}</div>
                <div className="il-card-meta">
                  <div className="il-meta-col">
                    <span className="il-meta-label">PAGE TITLE</span>
                    <span className="il-meta-val">{pageTitle}</span>
                  </div>
                  <div className="il-meta-col">
                    <span className="il-meta-label">TYPE & PRIORITY</span>
                    <span className="il-meta-val" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`il-badge-type ${
                        (page.seoPageType || page.type || '').toLowerCase().includes('hub') ? 'hub' :
                        (page.seoPageType || page.type || '').toLowerCase().includes('landing') ? 'landing' :
                        (page.seoPageType || page.type || '').toLowerCase().includes('topical') ? 'topical' :
                        (page.seoPageType || page.type || '').toLowerCase().includes('article') ? 'article' :
                        'default'
                      }`}>{page.seoPageType || page.type || 'Landing Page'}</span>
                      <span className="il-badge-priority">Prio {page.priority !== undefined ? page.priority : 0}</span>
                    </span>
                  </div>
                  <div className="il-meta-col">
                    <span className="il-meta-label">TARGET PHRASE</span>
                    <span className="il-meta-val">{targetPhrase}</span>
                  </div>
                  <div className="il-meta-col">
                    <span className="il-meta-label">INCOMING INTERNAL LINKS</span>
                    <span className="il-meta-val il-links-val" style={{ color: sec.color }}>
                      {page.incomingCount} links {isExpanded ? '▲ Hide Details' : '▼ View Details'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Detail View */}
              {isExpanded && (
                <div className="il-card-details">
                  {/* Stat Cards Row */}
                  <div className="il-stats-grid">
                    <div className="il-stat-box">
                      <span className="il-stat-icon">&#x1F517;</span>
                      <div>
                        <span className="il-stat-label">CURRENT LINKS</span>
                        <div className="il-stat-val">{page.incomingCount} links found</div>
                      </div>
                    </div>

                    <div className="il-stat-box">
                      <span className="il-stat-icon">&#x1F3AF;</span>
                      <div>
                        <span className="il-stat-label">RECOMMENDATIONS</span>
                        <div className="il-stat-val">{page.recommended.length} suggested</div>
                      </div>
                    </div>

                    <div className="il-stat-box il-stat-box-status">
                      <span className="il-stat-icon">&#x1F4C8;</span>
                      <div>
                        <span className="il-stat-label">STATUS</span>
                        <div className="il-stat-val-status">
                          {page.needsLinks ? 'Needs Links' : 'Optimal Link Density'}
                        </div>
                        <div className="il-stat-subtext">
                          {page.needsLinks
                            ? `Add ${Math.max(0, 3 - page.incomingCount)} contextual internal links`
                            : 'Target threshold met'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Existing Links Section */}
                  <div className="il-section-block">
                    <h3 className="il-section-title">Existing Links ({page.existing.length})</h3>
                    {page.existing.length === 0 ? (
                      <div className="il-empty-msg">No contextual incoming links found for this page yet.</div>
                    ) : (
                      <div className="il-table-wrapper">
                        <table className="il-table">
                          <thead>
                            <tr>
                              <th>Source Page Title</th>
                              <th>Source Page URL</th>
                              <th>Link Context</th>
                              <th>Destination URL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {page.existing.map(link => (
                              <tr key={link.id}>
                                <td className="font-bold">{link.sourceTitle}</td>
                                <td className="col-url">{link.sourceUrl}</td>
                                <td className="col-context">{renderHighlightedText(link.linkContext, link.anchorText)}</td>
                                <td className="col-url">{link.destinationUrl}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Recommended Links Section */}
                  <div className="il-section-block">
                    <h3 className="il-section-title">Recommended Links</h3>
                    {page.recommended.length === 0 ? (
                      <div className="il-empty-msg">All available source pages are already linking to this page.</div>
                    ) : (
                      <div className="il-table-wrapper">
                        <table className="il-table">
                          <thead>
                            <tr>
                              <th>Anchor Text</th>
                              <th>Suggested Source Page</th>
                              <th>AI Suggested Sentence</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {page.recommended.map(rec => (
                              <tr key={rec.id}>
                                <td>
                                  <span className="il-anchor-text-edit">
                                    {rec.anchorText} <span className="il-edit-icon">&#x270F;&#xFE0F;</span>
                                  </span>
                                </td>
                                <td>
                                  <div className="il-source-page-cell">
                                    <span className="il-doc-icon">&#x1F4C4;</span>
                                    <div>
                                      <div className="il-source-title">{rec.suggestedSourceTitle}</div>
                                      <div className="il-source-url">{rec.suggestedSourceUrl}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="col-sentence" colSpan={2}>
                                  {renderSentenceCell({
                                    ...rec,
                                    sourceUrl: rec.suggestedSourceUrl,
                                    targetUrl: page.url,
                                    sourcePageObj: rec.sourcePageObj
                                  })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="il-warning-banner">
                      &#x26A0;&#xFE0F; Only {page.recommended.length} unique source pages are currently available. Add more content or configure additional pages to increase internal linking opportunities.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
