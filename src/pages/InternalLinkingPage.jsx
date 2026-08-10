import { useState, useMemo } from 'react'
import { getPathSlugForMatching } from '../utils/urlUtils'
import { getExistingInternalLinks, getRecommendedInternalLinks, generateContextualReplacement } from '../utils/internalLinkingHelper'
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

    const otherPages = pagesWithData.filter(p => {
      return !hubSet.has(p.url) && !landingSet.has(p.url) && !topicalSet.has(p.url)
    })

    return [
      { key: 'hub', title: 'HUB PAGE', colorClass: 'sec-theme-green', color: '#10b981', pages: hubPages },
      { key: 'landing', title: 'LANDING PAGES', colorClass: 'sec-theme-blue', color: '#60a5fa', pages: landingPages },
      { key: 'topical', title: 'TOPICAL PAGES', colorClass: 'sec-theme-yellow', color: '#f59e0b', pages: topicalPages },
      { key: 'other', title: 'OTHER ACTIVE PAGES', colorClass: 'sec-theme-slate', color: '#94a3b8', pages: otherPages },
    ]
  }, [pagesWithData])

  const toggleExpand = (url) => {
    setExpandedUrl(prev => (prev === url ? null : url))
  }

  const handleGenerateSentence = (recId, anchorText, sourceUrl) => {
    setGeneratingIds(prev => ({ ...prev, [recId]: true }))
    setTimeout(() => {
      const sourcePage = activePages.find(p => p.url === sourceUrl || getPathSlugForMatching(p.url) === sourceUrl || p.title === sourceUrl)
      const result = generateContextualReplacement(sourcePage, anchorText)
      setAiSentences(prev => ({
        ...prev,
        [recId]: result
      }))
      setGeneratingIds(prev => ({ ...prev, [recId]: false }))
    }, 400)
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
                    <span className="il-meta-label">TARGET PHRASE</span>
                    <span className="il-meta-val">{targetPhrase}</span>
                  </div>
                  <div className="il-meta-col">
                    <span className="il-meta-label">INCOMING INTERNAL LINKS</span>
                    <span className="il-meta-val il-links-val" style={{ color: sec.color }}>
                      {page.incomingCount} links {isExpanded ? '▲ Hide Details' : '▼ View Details'}
                    </span>
                  </div>
                  <div className="il-meta-col il-meta-col-right">
                    {page.needsLinks ? (
                      <button type="button" className="il-btn-add-links">
                        Add Links
                      </button>
                    ) : (
                      <span className="il-badge-no-action">
                        No Action Required
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Detail View */}
              {isExpanded && (
                <div className="il-card-details">
                  {/* Selected Page Sub-Header */}
                  <div className="il-detail-subheader">
                    <div className="il-detail-slug-row">
                      <span className="il-link-icon">&#x1F517;</span>
                      <h2 className="il-detail-slug">{page.slug}</h2>
                    </div>
                    <div className="il-detail-subtitle">{pageTitle}</div>
                    <div className="il-detail-badges">
                      <span className="il-badge-priority">Priority 2</span>
                      <span className="il-badge-type">{page.seoPageType || 'Landing Page'}</span>
                      <span className="il-target-phrase-text">Target phrase: <strong>{targetPhrase}</strong></span>
                    </div>
                  </div>

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
                        <span className="il-stat-label">TARGET LINKS</span>
                        <div className="il-stat-val">10 links</div>
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
                    <h3 className="il-section-title">Recommended Links (Target: 10)</h3>
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
                                <td className="col-sentence">
                                  {aiSentences[rec.id] ? (
                                    aiSentences[rec.id].error ? (
                                      <div className="il-gen-error-banner">
                                        ⚠️ {aiSentences[rec.id].error}
                                      </div>
                                    ) : (
                                      <div className="il-gen-block">
                                        <div className="il-gen-item">
                                          <span className="il-gen-heading">CURRENT SOURCE TEXT:</span>
                                          <div className="il-gen-source">"{aiSentences[rec.id].currentSourceText}"</div>
                                        </div>
                                        <div className="il-gen-item">
                                          <span className="il-gen-heading il-gen-heading-replacement">SUGGESTED REPLACEMENT:</span>
                                          <div className="il-gen-replacement">
                                            "{renderHighlightedText(aiSentences[rec.id].suggestedReplacement, rec.anchorText)}"
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  ) : (
                                    <span className="il-gen-placeholder">
                                      Click ✨ Generate to analyze source page content and preview suggested replacement.
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="il-btn-generate"
                                    onClick={() => handleGenerateSentence(rec.id, rec.anchorText, rec.suggestedSourceUrl)}
                                    disabled={generatingIds[rec.id]}
                                  >
                                    {generatingIds[rec.id] ? 'Generating...' : '✨ Generate'}
                                  </button>
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
