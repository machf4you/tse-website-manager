import { useState, useEffect } from 'react'
import { executePageAudit } from '../services/pageAuditorApi'
import './PageAuditResultsPage.css'

export default function PageAuditResultsPage({ site, page, pagesList = [], onBack }) {
  const selectedUrlStorageKey = site?.id ? `tse_audit_selected_url_${site.id}` : 'tse_audit_selected_url_default'

  // Allow selecting any page from the dropdown, with localStorage persistence
  const [selectedUrl, setSelectedUrl] = useState(() => {
    try {
      const saved = localStorage.getItem(selectedUrlStorageKey)
      if (saved && pagesList.some(p => p.url === saved)) return saved
    } catch (e) {
      // ignore
    }
    return page?.url || pagesList[0]?.url || ''
  })

  useEffect(() => {
    if (selectedUrl) {
      try {
        localStorage.setItem(selectedUrlStorageKey, selectedUrl)
      } catch (e) {
        // ignore
      }
    }
  }, [selectedUrl, selectedUrlStorageKey])

  const [liveAuditData, setLiveAuditData] = useState(null)
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)
  const [auditError, setAuditError] = useState(null)

  // Active page selection precedence:
  // 1. Configured page (passed via the page prop)
  // 2. Matching configured page from pagesList
  // 3. Raw exported page from pagesList
  // 4. Fallback
  const matchedFromList = pagesList.find(p => p.url === selectedUrl)

  const currentPage = (() => {
    if (page && (page.url === selectedUrl || !selectedUrl) && (page.isConfigured || page.targetPhrase)) {
      return page
    }
    if (matchedFromList && (matchedFromList.isConfigured || matchedFromList.targetPhrase)) {
      return matchedFromList
    }
    if (matchedFromList) {
      return matchedFromList
    }
    return page || pagesList[0] || {}
  })()

  const targetPhrase = currentPage.target || currentPage.targetPhrase || ''
  const pageType = currentPage.type || currentPage.seoPageType || 'Landing Page'
  const displayTitle = currentPage.proposedTitle || currentPage.title || 'Untitled'
  const fullUrl = currentPage.url || site?.url || '/'

  // Clean path display
  let cleanPath = '/'
  try {
    if (fullUrl.startsWith('http://') || fullUrl.startsWith('https://')) {
      cleanPath = new URL(fullUrl).pathname || '/'
    } else {
      cleanPath = fullUrl
    }
  } catch (_e) {
    cleanPath = fullUrl
  }

  // Execute audit call to Page Auditor server ONLY
  useEffect(() => {
    let isMounted = true
    async function runLiveAudit() {
      if (!currentPage || !currentPage.url) return
      setIsLoadingAudit(true)
      setAuditError(null)
      setLiveAuditData(null)
      try {
        const result = await executePageAudit({
          siteId: site?.id || 'site-1',
          pageId: currentPage.id || currentPage.url,
          url: currentPage.url,
          targetPhrase: currentPage.target || currentPage.targetPhrase || targetPhrase,
          seoPageType: currentPage.type || currentPage.seoPageType || pageType,
        })
        if (isMounted) {
          setLiveAuditData(result)
          setIsLoadingAudit(false)
        }
      } catch (e) {
        if (isMounted) {
          setAuditError(e.message || 'Failed to connect to Page Auditor backend.')
          setIsLoadingAudit(false)
        }
      }
    }
    runLiveAudit()
    return () => { isMounted = false }
  }, [selectedUrl, currentPage.url, currentPage.target, currentPage.type])

  // Map ONLY values returned by TSE Page Auditor
  let auditElements = []
  let failedIssues = []

  if (liveAuditData) {
    const snap = liveAuditData.page_snapshot || {}
    const assess = liveAuditData.page_assessment || {}
    const breakdown = assess.fit_breakdown || {}

    // Combine all check findings from strengths, weaknesses, recommendations
    const allChecks = [
      ...(liveAuditData.strengths || []),
      ...(liveAuditData.weaknesses || []),
      ...(liveAuditData.recommendations || []),
    ]

    const getCheck = (labelName) => allChecks.find(c => (c.label || '').toLowerCase() === labelName.toLowerCase())

    const titleCheck = getCheck('Title Tag') || getCheck('Meta Title')
    const descCheck = getCheck('Meta Description')
    const h1Check = getCheck('H1')
    const h2Check = getCheck('H2 Count') || getCheck('H2')
    const wordCheck = getCheck('Word Count')
    const linkCheck = getCheck('Internal Link Count') || getCheck('Internal Links')
    const imgCheck = getCheck('Image Count')
    const altCheck = getCheck('Images Missing Alt Text') || getCheck('Alt Text')

    const getStatusText = (checkObj) => {
      if (!checkObj) return 'Pass'
      if (checkObj.status === 'pass') return 'Pass'
      if (checkObj.status === 'fail') return 'Fail'
      return 'Pass'
    }

    const missingAltCount = snap.image_count !== undefined && snap.image_alt_coverage !== undefined
      ? Math.round((1 - snap.image_alt_coverage) * snap.image_count)
      : 0

    const hasH2Target = breakdown.h2 === 'Yes' || (
      Array.isArray(snap.h2) && targetPhrase && snap.h2.some(h => {
        const text = typeof h === 'string' ? h : (h?.text || '')
        return text.toLowerCase().includes(targetPhrase.toLowerCase())
      })
    )

    const hasTitleTarget = breakdown.title === 'Yes' || (
      snap.title && targetPhrase && snap.title.toLowerCase().includes(targetPhrase.toLowerCase())
    )
    const titleStatus = (!hasTitleTarget || titleCheck?.status === 'fail') ? 'Fail' : 'Pass'

    const hasDescTarget = breakdown.description === 'Yes' || (
      snap.meta_description && targetPhrase && snap.meta_description.toLowerCase().includes(targetPhrase.toLowerCase())
    )
    const descLen = (snap.meta_description || '').length
    const descLenOk = descLen >= 120 && descLen <= 160
    const descStatus = (hasDescTarget && descLenOk && descCheck?.status !== 'fail') ? 'Pass' : 'Fail'

    let descRec = '—'
    if (descStatus === 'Fail') {
      if (!snap.meta_description) {
        descRec = 'Add meta description containing target phrase'
      } else if (!hasDescTarget) {
        descRec = `Add target phrase "${targetPhrase}" to meta description`
      } else if (descLen < 120) {
        descRec = `Increase meta description length to at least 120 characters (currently ${descLen} characters)`
      } else if (descLen > 160) {
        descRec = `Reduce meta description length to under 160 characters (currently ${descLen} characters)`
      } else if (descCheck?.detail) {
        descRec = descCheck.detail
      } else {
        descRec = `Add target phrase "${targetPhrase}" to meta description (120-160 characters)`
      }
    }

    const wordCount = snap.word_count !== undefined ? snap.word_count : 0
    const hasContentTarget = breakdown.content === 'Yes'
    const wordCountStatus = (wordCount >= 300 && hasContentTarget) ? 'Pass' : 'Fail'
    
    let wordCountRec = '—'
    if (wordCountStatus === 'Fail') {
      if (wordCount < 300) {
        wordCountRec = `Increase content length to at least 300 words (currently ${wordCount} words)`
      } else if (!hasContentTarget) {
        wordCountRec = `Add target phrase "${targetPhrase}" naturally within body content`
      } else if (wordCheck?.detail) {
        wordCountRec = wordCheck.detail
      } else {
        wordCountRec = `Increase content length to at least 300 words and add target phrase "${targetPhrase}"`
      }
    }
    const incomingLinkCount = pagesList.filter(p => {
      if (!p.url || p.url === currentPage.url) return false
      const targetUrl = currentPage.url.replace(/\/+$/, '').toLowerCase()
      const targetSlug = targetUrl.replace(/^https?:\/\/[^/]+/, '')
      
      const pLinks = p.internal_links || p.links || []
      const pContent = (p.content || p.html || p.body_text || '').toLowerCase()
      
      const hasLinkObj = Array.isArray(pLinks) && pLinks.some(l => {
        const href = (typeof l === 'string' ? l : (l?.href || '')).replace(/\/+$/, '').toLowerCase()
        return href.includes(targetUrl) || (targetSlug && targetSlug !== '/' && href.endsWith(targetSlug))
      })
      
      return hasLinkObj || (targetSlug && targetSlug !== '/' && pContent.includes(targetSlug))
    }).length

    const linksStatus = incomingLinkCount >= 3 ? 'Pass' : 'Fail'

    auditElements = [
      {
        id: 'meta_title',
        name: 'Meta Title',
        currentValue: snap.title || displayTitle,
        hasTargetPhrase: hasTitleTarget,
        status: titleStatus,
        recommendation: titleStatus === 'Pass' ? '—' : (titleCheck?.detail || `Add target phrase "${targetPhrase}" to Meta Title`),
        recommendationType: titleStatus === 'Pass' ? 'default' : 'fail',
      },
      {
        id: 'meta_description',
        name: 'Meta Description',
        currentValue: snap.meta_description || '—',
        hasTargetPhrase: hasDescTarget,
        status: descStatus,
        recommendation: descRec,
        recommendationType: descStatus === 'Pass' ? 'default' : 'fail',
      },
      {
        id: 'h1',
        name: 'H1',
        currentValue: (Array.isArray(snap.h1) ? snap.h1[0] : snap.h1) || '—',
        hasTargetPhrase: breakdown.h1 === 'Yes',
        status: getStatusText(h1Check),
        recommendation: h1Check?.detail || `Add target phrase "${targetPhrase}" to H1 heading`,
        recommendationType: h1Check?.status === 'fail' ? 'fail' : 'warning',
        issueCode: 'ISSUE 1: H1',
      },
      {
        id: 'h2_count',
        name: 'H2 Count',
        currentValue: `${Array.isArray(snap.h2) ? snap.h2.length : (snap.h2 || 0)} H2 headings`,
        hasTargetPhrase: hasH2Target,
        status: hasH2Target ? 'Pass' : 'Fail',
        recommendation: hasH2Target ? '—' : 'Add the target phrase to at least one H2 heading.',
        recommendationType: hasH2Target ? 'default' : 'fail',
      },

      {
        id: 'word_count',
        name: 'Word Count',
        currentValue: `${wordCount} words`,
        hasTargetPhrase: hasContentTarget,
        status: wordCountStatus,
        recommendation: wordCountRec,
        recommendationType: wordCountStatus === 'Pass' ? 'default' : 'fail',
      },
      {
        id: 'internal_links',
        name: 'Internal Link Count',
        currentValue: `${incomingLinkCount} incoming internal links`,
        hasTargetPhrase: true,
        status: linksStatus,
        recommendation: linksStatus === 'Pass' ? '—' : `Current Incoming Internal Links: ${incomingLinkCount} | Minimum Required to Pass Audit: 3`,
        recommendationType: linksStatus === 'Pass' ? 'default' : 'fail',
        issueCode: 'ISSUE 2: INTERNAL LINK COUNT',
      },
      {
        id: 'image_count',
        name: 'Image Count',
        currentValue: `${snap.image_count !== undefined ? snap.image_count : 0} images`,
        hasTargetPhrase: false,
        status: getStatusText(imgCheck),
        recommendation: imgCheck?.detail || '—',
        recommendationType: imgCheck?.status === 'fail' ? 'fail' : 'warning',
      },
      {
        id: 'missing_alt',
        name: 'Images Missing Alt Text',
        currentValue: `${missingAltCount} images with missing/generic alt text`,
        hasTargetPhrase: 'N/A',
        status: getStatusText(altCheck),
        recommendation: altCheck?.detail || '—',
        recommendationType: altCheck?.status === 'fail' ? 'fail' : 'default',
      },
    ]

    failedIssues = (liveAuditData.weaknesses || []).map((w, idx) => ({
      id: w.key || `issue_${idx}`,
      issueCode: `ISSUE ${idx + 1}: ${w.label ? w.label.toUpperCase() : 'CHECK'}`,
      recommendation: w.detail || w.label || '',
      name: w.label || 'SEO Check',
    }))
  }

  const passedCount = liveAuditData?.overall_score !== undefined ? (
    Math.round((liveAuditData.overall_score / 100) * auditElements.length)
  ) : 0
  const totalCount = auditElements.length

  return (
    <div className="w4-audit-wrapper">
      <div className="w4-audit-container">

        {/* Top Back Navigation Link */}
        <div className="w4-back-row">
          <button
            type="button"
            className="w4-btn-back"
            onClick={onBack}
            id="btn-back-to-website-management"
          >
            ← Back to Website Management
          </button>
        </div>

        {/* Page Title & Pill Badge */}
        <div className="w4-header-block">
          <div className="w4-pill-row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span className="w4-pill-badge">W4 | LATEST PAGE AUDIT RESULTS</span>
            {liveAuditData ? (
              <span className="w4-status-connected" style={{ fontSize: '0.7rem', fontWeight: '700', color: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                🟢 LIVE API DATA
              </span>
            ) : (
              <span className="w4-status-offline" style={{ fontSize: '0.7rem', fontWeight: '700', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                Page Auditor Offline — Audit Cannot Run
              </span>
            )}
          </div>
          <h1 className="w4-main-title">Now We Need To Optimize The SEO Elements Of This Page</h1>
        </div>

        {/* Control Bar: Page Dropdown & Audit Score */}
        <div className="w4-controls-card">
          <div className="w4-control-dropdown">
            <label className="w4-control-label" htmlFor="select-audit-page">
              SELECT PAGE TO REVIEW FROM DROPDOWN
            </label>
            <select
              id="select-audit-page"
              className="w4-select-page"
              value={selectedUrl}
              onChange={(e) => setSelectedUrl(e.target.value)}
              disabled={isLoadingAudit}
            >
              {(() => {
                const selectablePages = pagesList.filter(p => p.isConfigured === true && !p.isExcluded && p.priority !== 0 && p.type !== 'Excluded' && p.type !== 'Unclassified / Excluded')
                const displayList = selectablePages.length > 0 ? selectablePages : (pagesList.length > 0 ? pagesList.filter(p => p.isConfigured === true) : [])
                if (displayList.length > 0) {
                  return displayList.map((p, idx) => (
                    <option key={p.id || p.url || idx} value={p.url}>
                      {p.url ? (new URL(p.url, site?.url || 'https://example.com').pathname || '/') : '/'} ({p.proposedTitle || p.title || 'Untitled'})
                    </option>
                  ))
                }
                return (
                  <option value={currentPage.url || '/'}>
                    {cleanPath} ({displayTitle})
                  </option>
                )
              })()}
            </select>
          </div>

          <div className="w4-score-box">
            <span className="w4-score-label">AUDIT SCORE</span>
            <div className="w4-score-value">
              {isLoadingAudit ? (
                'Auditing...'
              ) : liveAuditData ? (
                <>
                  {passedCount} / {totalCount} Passed
                  <span className="w4-score-subtext"> ({failedIssues.length} issues to fix)</span>
                </>
              ) : (
                'Offline'
              )}
            </div>
          </div>
        </div>

        {/* Page Info Cards Grid */}
        <div className="w4-info-grid">
          <div className="w4-info-card">
            <span className="w4-info-label">PAGE URL</span>
            <div className="w4-info-url-path">{cleanPath}</div>
            <div className="w4-info-subtitle">{displayTitle}</div>
          </div>

          <div className="w4-info-card">
            <span className="w4-info-label">TARGET PHRASE</span>
            <div className="w4-info-target-phrase">{targetPhrase || 'Not Set'}</div>
          </div>

          <div className="w4-info-card">
            <span className="w4-info-label">PAGE TYPE</span>
            <div>
              <span className={`w4-badge-type ${
                pageType === 'Hub' || pageType === 'Hub Page' ? 'hub' :
                pageType === 'Landing' || pageType === 'Landing Page' ? 'landing' :
                pageType === 'Topical' || pageType === 'Topical Page' ? 'topical' : 'unclassified'
              }`}>
                {pageType.includes('Page') ? pageType : `${pageType} Page`}
              </span>
            </div>
          </div>
        </div>

        {/* SEO Elements Audit Table / Offline State */}
        <div className="w4-table-card">
          {!liveAuditData && !isLoadingAudit ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ef4444' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>
                Page Auditor Offline — Audit Cannot Run
              </div>
              <div style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
                Please ensure the TSE Page Auditor backend server (<code>python server.py</code> inside <code>c:\Antigravity\tse-page-auditor\backend</code>) is running.
              </div>
            </div>
          ) : (
            <table className="w4-audit-table">
              <thead>
                <tr>
                  <th className="col-element">SEO Element</th>
                  <th className="col-val">Current Value</th>
                  <th className="col-stat">Status</th>
                  <th className="col-recom">Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {auditElements.map((el) => (
                  <tr key={el.id}>
                    <td className="col-element font-bold">{el.name}</td>
                    <td className="col-val">{el.currentValue}</td>
                    <td className="col-stat">
                      <span className={`pill-status ${el.status.toLowerCase()}`}>
                        {el.status}
                      </span>
                    </td>
                    <td className="col-recom">
                      {el.recommendation === '—' ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <span className={`recom-text ${el.recommendationType || 'default'}`}>
                          {el.recommendation}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Action Checklist: What to Fix Card */}
        {liveAuditData && failedIssues.length > 0 && (
          <div className="w4-checklist-card">
            <div className="w4-checklist-header">
              <span className="w4-warning-icon">⚠</span>
              <div>
                <h3 className="w4-checklist-title">Action Checklist: What to Fix</h3>
                <p className="w4-checklist-subtitle">
                  Staff Action Required: Fix the following issues in the WordPress editor to optimize the page.
                </p>
              </div>
            </div>

            <div className="w4-issues-list">
              {failedIssues.map((issue) => (
                <div className="w4-issue-item-card" key={issue.id}>
                  <div className="w4-issue-details">
                    <span className="w4-issue-code">{issue.issueCode}</span>
                    <div className="w4-issue-title">{issue.recommendation}</div>
                  </div>
                  <button
                    type="button"
                    className="w4-btn-fix-issue"
                    onClick={() => alert(`Redirecting to WordPress Editor to fix: ${issue.name}`)}
                  >
                    Fix Issue ▷
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
