import { useState, useMemo, useEffect } from 'react'
import { extractSafeString } from '../utils/safeString'
import { getPathSlugForMatching, normalizeUrlForMatching } from '../utils/urlUtils'
import {
  getExistingInternalLinks,
  getOutgoingInternalLinks,
  getRecommendedInternalLinks,
  generateContextualReplacement,
  buildModifiedSourceContent
} from '../utils/internalLinkingHelper'
import {
  getInternalLinkRecommendationsApi,
  saveInternalLinkRecommendationsApi,
  getPageRankingsApi,
  getPageConfigsApi
} from '../services/websiteManagerApi'
import { useWebsiteManagerRealtime } from '../services/supabaseRealtime'
import { updateWordPressPageContent } from '../services/wordpressApi'
import { formatReadableDateTime } from '../utils/dateFormatter'
import W5LinkImplementationModal from '../components/W5LinkImplementationModal'
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

function getDisplayPath(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    return parsed.pathname || '/'
  } catch (_e) {
    return url
  }
}

export default function InternalLinkingPage({
  site,
  pagesList,
  isLoadingPackage,
  initialSelectedUrl,
  onNavigateTab,
  onNavigateBack
}) {
  const [expandedUrl, setExpandedUrl] = useState(() => {
    return initialSelectedUrl || null
  })
  const [showAllPages, setShowAllPages] = useState(false)
  const [pageRankings, setPageRankings] = useState({})
  const [pageConfigs, setPageConfigs] = useState({})

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

  const [activeModalRec, setActiveModalRec] = useState(null)
  const [activeModalSourcePage, setActiveModalSourcePage] = useState(null)
  const [isPushingLink, setIsPushingLink] = useState(false)
  const [modalError, setModalError] = useState(null)

  const [aiSentences, setAiSentences] = useState({})
  const [generatingIds, setGeneratingIds] = useState({})

  // Hydrate rankings and configs from backend API
  useEffect(() => {
    if (!site?.id) return
    let isMounted = true

    getPageRankingsApi(site.id).then(rankings => {
      if (isMounted && rankings && typeof rankings === 'object') {
        setPageRankings(rankings)
      }
    }).catch(() => {})

    getPageConfigsApi(site.id).then(configs => {
      if (isMounted && configs && typeof configs === 'object') {
        setPageConfigs(configs)
      }
    }).catch(() => {})

    return () => { isMounted = false }
  }, [site?.id])

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

  // Real-time multi-user synchronization hook
  useWebsiteManagerRealtime({
    onLinkRecChanged: ({ siteId, recommendationsMap }) => {
      if (site?.id && String(site.id) === String(siteId) && recommendationsMap) {
        setSavedRecs(prev => ({ ...prev, ...recommendationsMap }))
      }
    },
    onPageConfigChanged: ({ siteId, configsMap }) => {
      if (site?.id && String(site.id) === String(siteId) && configsMap) {
        setPageConfigs(prev => ({ ...prev, ...configsMap }))
      }
    },
    onReconnect: () => {
      if (site?.id) {
        getInternalLinkRecommendationsApi(site.id).then(res => {
          if (res && typeof res === 'object') {
            setSavedRecs(prev => ({ ...prev, ...res }))
          }
        }).catch(() => {})
        getPageConfigsApi(site.id).then(configs => {
          if (configs && typeof configs === 'object') {
            setPageConfigs(configs)
          }
        }).catch(() => {})
        getPageRankingsApi(site.id).then(rankings => {
          if (rankings && typeof rankings === 'object') {
            setPageRankings(rankings)
          }
        }).catch(() => {})
      }
    }
  })

  const websiteTitle = site?.name || 'The Search Equation'
  const websiteUrl = site?.url || 'https://www.thesearchequation.com'

  // Filter active non-excluded pages strictly by W3 Type configuration
  const activePages = useMemo(() => {
    if (!Array.isArray(pagesList)) return []
    return pagesList.filter(p => {
      const pageKey = p.id || p.url
      const config = pageConfigs[pageKey] || (p.url ? pageConfigs[p.url] : null) || (p.id ? pageConfigs[String(p.id)] : null)
      const typeStr = (config?.type || p.type || p.seoPageType || '').trim().toLowerCase()
      const isExcluded = config?.isExcluded !== undefined ? config.isExcluded : (p.isExcluded || typeStr === 'excluded' || typeStr === 'unclassified / excluded')
      return !isExcluded
    })
  }, [pagesList, pageConfigs])

  const pagesWithData = useMemo(() => {
    if (!Array.isArray(activePages)) return []
    return activePages.map(page => {
      const pageKey = page.id || page.url
      const config = pageConfigs[pageKey] || (page.url ? pageConfigs[page.url] : null) || (page.id ? pageConfigs[String(page.id)] : null)
      const isStarred = Boolean(config?.isStarred !== undefined ? config.isStarred : page.isStarred)
      const targetPhrase = config?.targetPhrase || config?.target || page.targetPhrase || page.target || ''

      const existing = getExistingInternalLinks(page.url, activePages)
      const outgoing = getOutgoingInternalLinks(page, activePages)
      const recommended = getRecommendedInternalLinks(page.url, targetPhrase, activePages, existing)

      // Calculate Unique Body-Content Source Pages (LINKS IN)
      const uniqueSourceUrls = new Set(
        existing
          .map(link => normalizeUrlForMatching(link.sourceUrl) || getPathSlugForMatching(link.sourceUrl) || link.sourceUrl)
          .filter(Boolean)
      )
      const incomingCount = uniqueSourceUrls.size

      // Calculate Unique Body-Content Destination Pages (LINKS OUT) - excluding self-links
      const pageNorm = normalizeUrlForMatching(page.url)
      const pageSlug = getPathSlugForMatching(page.url)
      const uniqueDestUrls = new Set(
        outgoing
          .map(link => normalizeUrlForMatching(link.destinationUrl) || getPathSlugForMatching(link.destinationUrl) || link.destinationUrl)
          .filter(dest => Boolean(dest) && dest !== pageNorm && dest !== pageSlug && dest !== page.url)
      )
      const outgoingCount = uniqueDestUrls.size

      const needsLinks = incomingCount < 3

      return {
        ...page,
        isStarred,
        targetPhrase,
        target: targetPhrase,
        slug: getPathSlugForMatching(page.url) || page.url || '/',
        existing,
        outgoing,
        recommended,
        incomingCount,
        outgoingCount,
        needsLinks
      }
    })
  }, [activePages, pageConfigs])

  const priorityPages = useMemo(() => {
    return pagesWithData.filter(p => p.isStarred)
  }, [pagesWithData])

  const otherPages = useMemo(() => {
    return pagesWithData.filter(p => !p.isStarred)
  }, [pagesWithData])

  const totalContextualLinks = useMemo(() => {
    return priorityPages.reduce((acc, p) => acc + (p.incomingCount || 0), 0)
  }, [priorityPages])

  const getRankInfo = (page) => {
    const pageKey = page.id || page.url
    return (
      pageRankings[pageKey] ||
      (page.url ? pageRankings[page.url] : null) ||
      (page.slug ? pageRankings[page.slug] : null) ||
      (page.id ? pageRankings[String(page.id)] : null) ||
      null
    )
  }

  const toggleExpand = (url) => {
    setExpandedUrl(prev => (prev === url ? null : url))
  }

  const handleOpenImplementModal = (rec) => {
    const recKey = rec.id || `${rec.sourceUrl || rec.suggestedSourceUrl}_${rec.targetUrl}`
    const savedRecord = savedRecs[recKey]
    const recToUse = {
      ...rec,
      savedSentence: savedRecord?.savedSentence || aiSentences[recKey]?.suggestedReplacement || ''
    }
    const sUrl = recToUse.sourceUrl || recToUse.suggestedSourceUrl
    const sNorm = normalizeUrlForMatching(sUrl)
    const sSlug = getPathSlugForMatching(sUrl)
    const srcPageObj = activePages.find(p => {
      const pNorm = normalizeUrlForMatching(p.url)
      const pSlug = getPathSlugForMatching(p.url)
      return (pNorm && pNorm === sNorm) || (pSlug && pSlug === sSlug) || p.url === sUrl || p.title === recToUse.sourceTitle
    }) || recToUse.sourcePageObj

    setActiveModalRec(recToUse)
    setActiveModalSourcePage(srcPageObj)
    setModalError(null)
  }

  const handleConfirmPushLink = async () => {
    if (!activeModalRec || isPushingLink) return
    setIsPushingLink(true)
    setModalError(null)

    const rec = activeModalRec
    const sourcePage = activeModalSourcePage || rec.sourcePageObj

    const buildRes = buildModifiedSourceContent(
      sourcePage,
      rec.targetUrl,
      rec.anchorText || rec.targetTitle,
      rec.savedSentence
    )

    if (!buildRes.success) {
      setModalError(buildRes.message || 'Failed to modify source page content.')
      setIsPushingLink(false)
      return
    }

    try {
      const pushRes = await updateWordPressPageContent({
        site,
        sourcePage: sourcePage || { url: rec.sourceUrl || rec.suggestedSourceUrl },
        contentHtml: buildRes.newContent
      })

      if (!pushRes || !pushRes.success) {
        setModalError(pushRes?.message || 'WordPress content push failed.')
        setIsPushingLink(false)
        return
      }

      // Successful WordPress update! Update status in SQLite backend
      const recKey = rec.id || `${rec.sourceUrl || rec.suggestedSourceUrl}_${rec.targetUrl}`
      const existingSavedRecord = savedRecs[recKey] || {}
      const updatedRecord = {
        ...existingSavedRecord,
        id: rec.id,
        sourceUrl: rec.sourceUrl || rec.suggestedSourceUrl,
        targetUrl: rec.targetUrl,
        anchorText: rec.anchorText || rec.targetTitle,
        savedSentence: rec.savedSentence,
        isSaved: true,
        isImplemented: true,
        status: 'IMPLEMENTED',
        implementedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const updatedMap = {
        ...savedRecs,
        [recKey]: updatedRecord
      }

      setSavedRecs(updatedMap)
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedMap))
      } catch (_e) {}

      if (site?.id) {
        saveInternalLinkRecommendationsApi(site.id, updatedMap)
      }

      setActiveModalRec(null)
      setIsPushingLink(false)
    } catch (err) {
      console.error('Failed to push link to WordPress:', err)
      setModalError(err.message || 'Push to WordPress failed due to a network error.')
      setIsPushingLink(false)
    }
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
      const isImplemented = Boolean(savedRecord && (savedRecord.isImplemented || savedRecord.status === 'IMPLEMENTED'))

      return (
        <div className="il-gen-block">
          <div className="il-gen-header-row">
            <span className="il-gen-heading" style={{ color: isImplemented ? '#10b981' : (isSaved ? '#34d399' : '#60a5fa') }}>
              {isImplemented ? '✓ WORDPRESS UPDATED (READY TO SYNC)' : (isSaved ? 'SAVED RECOMMENDATION ✓' : 'SUGGESTED REPLACEMENT:')}
            </span>
            {!isImplemented && (
              <button
                type="button"
                className="il-btn-icon-edit"
                onClick={() => handleStartEdit(recKey, currentDisplaySentence)}
                title="Edit sentence inline"
              >
                ✏️ Edit
              </button>
            )}
          </div>
          <div className="il-gen-replacement">
            "{renderHighlightedText(currentDisplaySentence, rec.anchorText || rec.targetTitle)}"
          </div>
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="il-btn-save-rec"
              onClick={() => handleSaveRecommendation(rec, currentDisplaySentence)}
              disabled={isImplemented}
              style={{ opacity: isImplemented ? 0.7 : 1 }}
            >
              {isSaved ? '💾 Update Saved' : '💾 Save Recommendation'}
            </button>

            {isSaved && !isImplemented && (
              <button
                type="button"
                className="w3-btn-blue"
                onClick={() => handleOpenImplementModal(rec)}
                style={{ padding: '4px 10px', fontSize: '0.74rem', fontWeight: '700', borderRadius: '4px' }}
              >
                🚀 Implement Link
              </button>
            )}

            {isImplemented && (
              <button
                type="button"
                className="w3-btn-emerald"
                onClick={() => onNavigateTab ? onNavigateTab('dashboard') : onNavigateBack()}
                style={{ padding: '4px 10px', fontSize: '0.74rem', fontWeight: '700', borderRadius: '4px' }}
              >
                🔄 Synchronise Website Data (W2)
              </button>
            )}
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

  const renderRankCell = (page) => {
    const rankInfo = getRankInfo(page)
    if (rankInfo?.isTop100 && rankInfo.googleRank) {
      return (
        <div className="w3-rank-badge-wrapper">
          <span
            className={`w3-rank-badge ${rankInfo.googleRank <= 10 ? 'rank-top-10' : 'rank-top-100'}`}
            title={`Google UK Rank #${rankInfo.googleRank}${rankInfo.lastCheckedAt ? ` (Checked ${formatReadableDateTime(rankInfo.lastCheckedAt) || rankInfo.lastCheckedAt})` : ''}`}
          >
            #{rankInfo.googleRank}
          </span>
          {!rankInfo.isUrlMatch && rankInfo.rankingUrl && (
            <span
              className="w3-rank-mismatch-mark"
              title={`Different ranking URL\nGoogle ranking URL: ${getDisplayPath(rankInfo.rankingUrl)}\nConfigured page: ${getDisplayPath(page.url)}`}
            >
              ?
            </span>
          )}
        </div>
      )
    }
    if (rankInfo?.lastCheckedAt && !rankInfo.isTop100) {
      return (
        <span
          className="w3-rank-badge rank-not-top-100"
          title={`Not in Top 100 on Google UK${rankInfo.lastCheckedAt ? ` (Checked ${formatReadableDateTime(rankInfo.lastCheckedAt) || rankInfo.lastCheckedAt})` : ''}`}
        >
          &gt;100
        </span>
      )
    }
    return (
      <span className="w3-rank-badge rank-unchecked" title="Not checked yet">
        —
      </span>
    )
  }

  const renderVolumeCell = (page) => {
    const rankInfo = getRankInfo(page)
    if (rankInfo?.searchVolume !== null && rankInfo?.searchVolume !== undefined) {
      return (
        <span
          className="w3-volume-badge volume-value"
          title={`UK Monthly Search Volume: ${Number(rankInfo.searchVolume).toLocaleString()}${rankInfo.volumeCheckedAt ? ` (Checked ${formatReadableDateTime(rankInfo.volumeCheckedAt) || rankInfo.volumeCheckedAt})` : ''}`}
        >
          {Number(rankInfo.searchVolume).toLocaleString()}
        </span>
      )
    }
    return (
      <span className="w3-volume-badge volume-unchecked" title="Search volume not checked yet">
        —
      </span>
    )
  }

  const renderPageReviewDetail = (page) => {
    return (
      <div className="il-card-details">
        {/* Stat Cards Row */}
        <div className="il-stats-grid">
          <div className="il-stat-box">
            <span className="il-stat-icon">🔗</span>
            <div>
              <span className="il-stat-label">CURRENT LINKS</span>
              <div className="il-stat-val">
                {page.incomingCount} unique sources ({page.existing.length} body {page.existing.length === 1 ? 'link' : 'links'})
              </div>
            </div>
          </div>

          <div className="il-stat-box">
            <span className="il-stat-icon">🎯</span>
            <div>
              <span className="il-stat-label">RECOMMENDATIONS</span>
              <div className="il-stat-val">{page.recommended.length} suggested</div>
            </div>
          </div>

          <div className="il-stat-box il-stat-box-status">
            <span className="il-stat-icon">📈</span>
            <div>
              <span className="il-stat-label">STATUS</span>
              <div className="il-stat-val-status">
                {page.needsLinks ? 'Needs Links' : 'Optimal Link Density'}
              </div>
              <div className="il-stat-subtext">
                {page.needsLinks
                  ? `Add ${Math.max(0, 3 - page.incomingCount)} unique source page ${3 - page.incomingCount === 1 ? 'link' : 'links'}`
                  : 'Target threshold met (≥3 unique source pages)'}
              </div>
            </div>
          </div>
        </div>

        {/* Existing Links Section */}
        <div className="il-section-block">
          <h3 className="il-section-title">Existing Incoming Links ({page.existing.length})</h3>
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
                          {rec.anchorText} <span className="il-edit-icon">✏️</span>
                        </span>
                      </td>
                      <td>
                        <div className="il-source-page-cell">
                          <span className="il-doc-icon">📄</span>
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
            ⚠️ Only {page.recommended.length} unique source pages are currently available. Add more content or configure additional pages to increase internal linking opportunities.
          </div>
        </div>
      </div>
    )
  }

  const renderPagesTable = (pages, isPriorityTable = false) => {
    return (
      <div className="il-table-container">
        <table className="il-priority-table">
          <thead>
            <tr>
              <th className="th-priority">PRIORITY</th>
              <th className="th-page">PAGE</th>
              <th className="th-target">TARGET</th>
              <th className="th-rank">UK RANK</th>
              <th className="th-volume">VOLUME</th>
              <th className="th-links-in">LINKS IN</th>
              <th className="th-links-out">LINKS OUT</th>
              <th className="th-status">STATUS</th>
              <th className="th-action">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page, idx) => {
              const isExpanded = expandedUrl === page.url
              const pageTitle = extractSafeString(page.title || page.proposedTitle || 'Untitled Page')
              const targetPhrase = extractSafeString(page.targetPhrase || page.target || '—')

              return (
                <tr key={page.url || idx} className={`il-page-row ${isExpanded ? 'il-row-expanded' : ''}`}>
                  <td className="col-priority-star">
                    <span className={`il-star-icon ${page.isStarred ? 'is-starred' : 'is-unstarred'}`}>
                      {page.isStarred ? '⭐' : '☆'}
                    </span>
                  </td>
                  <td className="col-page-info">
                    <div className="il-page-title-wrap">
                      <div className="il-page-main-title">{pageTitle}</div>
                      <div className="il-page-slug-text">{page.slug}</div>
                    </div>
                  </td>
                  <td className="col-target-text">
                    {targetPhrase && targetPhrase !== '—' ? (
                      <span className="il-target-phrase">{targetPhrase}</span>
                    ) : (
                      <span className="il-target-empty">—</span>
                    )}
                  </td>
                  <td className="col-rank-val">
                    {renderRankCell(page)}
                  </td>
                  <td className="col-volume-val">
                    {renderVolumeCell(page)}
                  </td>
                  <td className="col-links-count">
                    <span className={`il-count-badge ${page.incomingCount > 0 ? 'has-links' : 'zero-links'}`}>
                      {page.incomingCount}
                    </span>
                  </td>
                  <td className="col-links-count">
                    <span className={`il-count-badge ${page.outgoingCount > 0 ? 'has-links' : 'zero-links'}`}>
                      {page.outgoingCount}
                    </span>
                  </td>
                  <td className="col-status-badge">
                    {page.needsLinks ? (
                      <span className="il-status-chip status-needs-links" title={`Needs internal links (current: ${page.incomingCount})`}>
                        Needs Links
                      </span>
                    ) : (
                      <span className="il-status-chip status-optimal" title="Optimal Link Density">
                        Optimal
                      </span>
                    )}
                  </td>
                  <td className="col-action-btn">
                    <button
                      type="button"
                      className={`il-btn-review ${isExpanded ? 'active' : ''}`}
                      onClick={() => toggleExpand(page.url)}
                    >
                      {isExpanded ? 'Hide' : 'Review'}
                    </button>
                  </td>
                </tr>
              )
            }).flatMap((row, idx) => {
              const page = pages[idx]
              const isExpanded = expandedUrl === page.url
              if (!isExpanded) return [row]
              return [
                row,
                <tr key={`${page.url || idx}-expansion`} className="il-review-expansion-row">
                  <td colSpan={9}>
                    {renderPageReviewDetail(page)}
                  </td>
                </tr>
              ]
            })}
          </tbody>
        </table>
      </div>
    )
  }

  if (isLoadingPackage && (!Array.isArray(activePages) || activePages.length === 0)) {
    return (
      <div className="il-page-container">
        <div className="il-header-top">
          <button type="button" className="il-back-btn" onClick={onNavigateBack}>
            &larr; Back to W2 | Website Dashboard
          </button>
        </div>
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ color: '#f8fafc', margin: '0 0 8px 0' }}>Loading Website Pages & Link Analysis...</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Hydrating page inventory and internal link recommendations.</p>
        </div>
      </div>
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

      {/* Compact Top Summary Row */}
      <div className="il-compact-summary-bar">
        <div className="il-compact-stat">
          <span className="il-compact-stat-label">PRIORITY PAGES:</span>
          <span className="il-compact-stat-val text-amber">{priorityPages.length}</span>
        </div>
        <div className="il-compact-stat-divider">|</div>
        <div className="il-compact-stat">
          <span className="il-compact-stat-label">NEEDS LINKS:</span>
          <span className="il-compact-stat-val text-rose">{priorityPages.filter(p => p.needsLinks).length}</span>
        </div>
        <div className="il-compact-stat-divider">|</div>
        <div className="il-compact-stat">
          <span className="il-compact-stat-label">TOTAL CONTEXTUAL LINKS:</span>
          <span className="il-compact-stat-val text-emerald">{totalContextualLinks}</span>
        </div>
      </div>

      {/* Primary ⭐ PRIORITY PAGES Section */}
      <div className="il-priority-section">
        <div className="il-priority-header">
          <div className="il-priority-title-wrap">
            <h2 className="il-priority-title">⭐ PRIORITY PAGES</h2>
            <span className="il-priority-subtext">Pages selected in W3 for SEO priority</span>
          </div>
          <span className="il-priority-count-badge">
            {priorityPages.length} {priorityPages.length === 1 ? 'Page' : 'Pages'}
          </span>
        </div>

        {priorityPages.length > 0 ? (
          renderPagesTable(priorityPages, true)
        ) : (
          <div className="il-priority-empty">
            <p>No pages starred in W3 yet.</p>
            <span className="il-priority-empty-sub">Star pages in W3 Page Management to prioritize them for internal link building.</span>
          </div>
        )}
      </div>

      {/* Secondary Collapsible Other Pages Section */}
      {otherPages.length > 0 && (
        <div className="il-other-pages-section">
          <button
            type="button"
            className="il-btn-toggle-all-pages"
            onClick={() => setShowAllPages(prev => !prev)}
          >
            {showAllPages ? `▲ Hide Other Pages (${otherPages.length})` : `▼ Show All Pages (${otherPages.length})`}
          </button>

          {showAllPages && (
            <div className="il-other-pages-content">
              <div className="il-other-pages-subtext">
                Non-priority pages ({otherPages.length}) — click Review to inspect links or generate recommendations
              </div>
              {renderPagesTable(otherPages, false)}
            </div>
          )}
        </div>
      )}

      <W5LinkImplementationModal
        isOpen={Boolean(activeModalRec)}
        rec={activeModalRec}
        site={site}
        sourcePage={activeModalSourcePage}
        onConfirm={handleConfirmPushLink}
        onClose={() => {
          setActiveModalRec(null)
          setModalError(null)
        }}
        isPushing={isPushingLink}
        error={modalError}
      />
    </div>
  )
}

