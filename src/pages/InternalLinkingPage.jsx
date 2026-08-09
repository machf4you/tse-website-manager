import { useState, useMemo } from 'react'
import { getPathSlugForMatching } from '../utils/urlUtils'
import { getExistingInternalLinks, getRecommendedInternalLinks } from '../utils/internalLinkingHelper'
import './InternalLinkingPage.css'

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

  const pagesWithData = useMemo(() => {
    if (!Array.isArray(pagesList)) return []
    return pagesList.map(page => {
      const existing = getExistingInternalLinks(page.url, pagesList)
      const targetPhrase = page.targetPhrase || page.target || ''
      const recommended = getRecommendedInternalLinks(page.url, targetPhrase, pagesList, existing)
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
  }, [pagesList])

  const toggleExpand = (url) => {
    setExpandedUrl(prev => (prev === url ? null : url))
  }

  const handleGenerateSentence = (recId, anchorText, sourceTitle) => {
    setGeneratingIds(prev => ({ ...prev, [recId]: true }))
    setTimeout(() => {
      setAiSentences(prev => ({
        ...prev,
        [recId]: `"...Our expert team provides high quality ${anchorText} tailored to scale business growth..."`
      }))
      setGeneratingIds(prev => ({ ...prev, [recId]: false }))
    }, 600)
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
          <span className="il-pill-badge">W4 | INTERNAL LINKING</span>
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
        <button type="button" className="il-tab-btn il-tab-btn-active">
          W4 | Internal Linking
        </button>
        <button type="button" className="il-tab-btn" onClick={() => onNavigateTab?.('w5-analysis')}>
          W5 | Analysis
        </button>
        <button type="button" className="il-tab-btn" onClick={() => onNavigateTab?.('w6-settings')}>
          W6 | Website Settings
        </button>
      </div>

      {/* Pages List Accordions */}
      <div className="il-pages-list">
        {pagesWithData.map(page => {
          const isExpanded = expandedUrl === page.url
          const targetPhrase = page.targetPhrase || page.target || 'Not set'
          const pageTitle = page.title || page.proposedTitle || 'Untitled Page'

          return (
            <div key={page.url} className={`il-page-card ${isExpanded ? 'il-page-card-expanded' : ''}`}>
              {/* Closed / Accordion Header */}
              <div className="il-card-header" onClick={() => toggleExpand(page.url)}>
                <div className="il-card-slug">{page.slug}</div>
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
                    <span className="il-meta-val il-links-val">
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
                              <th>Anchor Text (Contextual)</th>
                              <th>Link Context</th>
                              <th>Destination URL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {page.existing.map(link => (
                              <tr key={link.id}>
                                <td className="font-bold">{link.sourceTitle}</td>
                                <td className="col-url">{link.sourceUrl}</td>
                                <td><span className="il-anchor-chip">{link.anchorText}</span></td>
                                <td className="col-context">{link.linkContext}</td>
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
                                  {aiSentences[rec.id] || rec.suggestedSentence}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="il-btn-generate"
                                    onClick={() => handleGenerateSentence(rec.id, rec.anchorText, rec.suggestedSourceTitle)}
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
}
