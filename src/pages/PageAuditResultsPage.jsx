import { useState, useEffect } from 'react'
import { executePageAudit } from '../services/pageAuditorApi'
import './PageAuditResultsPage.css'

// Real HTML extractor helper from WordPress package object
function extractRealPageElements(currentPage, siteUrl = '') {
  const html = currentPage?.content?.rendered || currentPage?.post_content || currentPage?.content?.raw || (typeof currentPage?.content === 'string' ? currentPage.content : '') || ''
  const title = currentPage?.proposedTitle || currentPage?.title || currentPage?.seo?.title || currentPage?.meta?.title || 'Untitled Page'
  const metaDesc = currentPage?.metaDescription || currentPage?.seo?.description || currentPage?.meta?.description || '—'
  
  // 1. Real H1
  let h1 = '—'
  if (Array.isArray(currentPage?.content?.h1) && currentPage.content.h1[0]) {
    h1 = currentPage.content.h1[0]
  } else if (typeof currentPage?.h1 === 'string' && currentPage.h1.trim()) {
    h1 = currentPage.h1.trim()
  } else if (html) {
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
    if (h1Match) h1 = h1Match[1].replace(/<[^>]+>/g, '').trim()
  }
  if (h1 === '—' && title) {
    h1 = title
  }

  // 2. Real H2 list
  const h2List = []
  if (Array.isArray(currentPage?.content?.h2)) {
    h2List.push(...currentPage.content.h2)
  } else if (html) {
    const h2Matches = html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)
    for (const m of h2Matches) {
      const txt = m[1].replace(/<[^>]+>/g, '').trim()
      if (txt) h2List.push(txt)
    }
  }

  // 3. Real Word Count
  let wordCount = 0
  if (currentPage?.content?.word_count !== undefined) {
    wordCount = currentPage.content.word_count
  } else if (html) {
    const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    wordCount = plainText ? plainText.split(/\s+/).length : 0
  }

  // 4. Real Images & Alt Tags
  let imageCount = 0
  let missingAltCount = 0
  if (currentPage?.content?.images && Array.isArray(currentPage.content.images)) {
    imageCount = currentPage.content.images.length
    missingAltCount = currentPage.content.images.filter(img => !img.alt || !img.alt.trim()).length
  } else if (html) {
    const imgMatches = html.matchAll(/<img[^>]+>/gi)
    for (const m of imgMatches) {
      imageCount++
      const tag = m[0]
      const altMatch = tag.match(/alt=["']([^"']*)["']/i)
      if (!altMatch || !altMatch[1].trim()) {
        missingAltCount++
      }
    }
  }

  // 5. Real Internal Links
  let internalLinkCount = 0
  if (currentPage?.content?.internal_links && Array.isArray(currentPage.content.internal_links)) {
    internalLinkCount = currentPage.content.internal_links.length
  } else if (html) {
    const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi)
    const siteDomain = siteUrl ? siteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase() : ''
    for (const m of linkMatches) {
      const href = m[1]
      if (href.startsWith('/') || (siteDomain && href.toLowerCase().includes(siteDomain))) {
        internalLinkCount++
      }
    }
  }

  return {
    title,
    metaDesc,
    h1,
    h2List,
    wordCount,
    imageCount,
    missingAltCount,
    internalLinkCount,
  }
}

export default function PageAuditResultsPage({ site, page, pagesList = [], onBack }) {
  // Allow selecting any page from the dropdown
  const [selectedUrl, setSelectedUrl] = useState(() => page?.url || pagesList[0]?.url || '')
  const [liveAuditData, setLiveAuditData] = useState(null)
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)
  const [auditError, setAuditError] = useState(null)

  // Active page object being reviewed
  const currentPage = pagesList.find(p => p.url === selectedUrl) || page || pagesList[0] || {}

  const targetPhrase = currentPage.target || currentPage.targetPhrase || 'loft conversions south london'
  const pageType = currentPage.type || currentPage.seoPageType || 'Landing Page'
  const displayTitle = currentPage.proposedTitle || currentPage.title || 'Loft Conversions & Extensions'
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

  // Execute audit call to Page Auditor server
  useEffect(() => {
    let isMounted = true
    async function runLiveAudit() {
      if (!currentPage || !currentPage.url) return
      setIsLoadingAudit(true)
      setAuditError(null)
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
          setAuditError(e.message)
          setIsLoadingAudit(false)
        }
      }
    }
    runLiveAudit()
    return () => { isMounted = false }
  }, [selectedUrl, currentPage.url, currentPage.target, currentPage.type])

  // Map elements from returned Page Auditor result or real local WordPress package data
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

    auditElements = [
      {
        id: 'meta_title',
        name: 'Meta Title',
        currentValue: snap.title || displayTitle,
        hasTargetPhrase: breakdown.title === 'Yes',
        status: getStatusText(titleCheck),
        recommendation: titleCheck?.detail || '—',
        recommendationType: titleCheck?.status === 'fail' ? 'fail' : (titleCheck?.status === 'warn' ? 'warning' : 'default'),
      },
      {
        id: 'meta_description',
        name: 'Meta Description',
        currentValue: snap.meta_description || '—',
        hasTargetPhrase: breakdown.description === 'Yes',
        status: getStatusText(descCheck),
        recommendation: descCheck?.detail || '—',
        recommendationType: descCheck?.status === 'fail' ? 'fail' : (descCheck?.status === 'warn' ? 'warning' : 'default'),
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
        hasTargetPhrase: breakdown.h2 === 'Yes',
        status: getStatusText(h2Check),
        recommendation: h2Check?.detail || `Add target phrase "${targetPhrase}" to at least one H2 heading`,
        recommendationType: h2Check?.status === 'fail' ? 'fail' : 'warning',
      },
      {
        id: 'word_count',
        name: 'Word Count',
        currentValue: `${snap.word_count !== undefined ? snap.word_count : 0} words`,
        hasTargetPhrase: breakdown.content === 'Yes',
        status: getStatusText(wordCheck),
        recommendation: wordCheck?.detail || '—',
        recommendationType: wordCheck?.status === 'fail' ? 'fail' : 'default',
      },
      {
        id: 'internal_links',
        name: 'Internal Link Count',
        currentValue: `${snap.internal_link_count !== undefined ? snap.internal_link_count : 0} incoming internal links`,
        hasTargetPhrase: false,
        status: getStatusText(linkCheck),
        recommendation: linkCheck?.detail || 'Current Internal Links: 0 | Minimum Required to Pass Audit: 3',
        recommendationType: linkCheck?.status === 'fail' ? 'fail' : 'warning',
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
  } else {
    // Local Real WordPress Package Data Extraction (when API server is offline)
    const realData = extractRealPageElements(currentPage, site?.url)
    const hasTargetInTitle = targetPhrase ? realData.title.toLowerCase().includes(targetPhrase.toLowerCase()) : false
    const hasTargetInH1 = targetPhrase ? realData.h1.toLowerCase().includes(targetPhrase.toLowerCase()) : false

    auditElements = [
      {
        id: 'meta_title',
        name: 'Meta Title',
        currentValue: realData.title,
        hasTargetPhrase: hasTargetInTitle,
        status: hasTargetInTitle ? 'Pass' : 'Fail',
        recommendation: hasTargetInTitle ? '—' : `Include target phrase "${targetPhrase}" in Meta Title`,
        recommendationType: hasTargetInTitle ? 'default' : 'fail',
      },
      {
        id: 'meta_description',
        name: 'Meta Description',
        currentValue: realData.metaDesc,
        hasTargetPhrase: targetPhrase && realData.metaDesc.toLowerCase().includes(targetPhrase.toLowerCase()),
        status: realData.metaDesc !== '—' ? 'Pass' : 'Fail',
        recommendation: realData.metaDesc !== '—' ? '—' : 'Add a meta description tag',
        recommendationType: realData.metaDesc !== '—' ? 'default' : 'fail',
      },
      {
        id: 'h1',
        name: 'H1',
        currentValue: realData.h1,
        hasTargetPhrase: hasTargetInH1,
        status: hasTargetInH1 ? 'Pass' : 'Fail',
        recommendation: hasTargetInH1 ? '—' : `Add target phrase "${targetPhrase}" to H1 heading`,
        recommendationType: hasTargetInH1 ? 'default' : 'fail',
        issueCode: 'ISSUE 1: H1',
      },
      {
        id: 'h2_count',
        name: 'H2 Count',
        currentValue: `${realData.h2List.length} H2 headings`,
        hasTargetPhrase: targetPhrase ? realData.h2List.some(h => h.toLowerCase().includes(targetPhrase.toLowerCase())) : false,
        status: realData.h2List.length >= 2 ? 'Pass' : 'Fail',
        recommendation: realData.h2List.length >= 2 ? '—' : 'Add at least 2 H2 headings to structure page content',
        recommendationType: realData.h2List.length >= 2 ? 'default' : 'warning',
      },
      {
        id: 'word_count',
        name: 'Word Count',
        currentValue: `${realData.wordCount} words`,
        hasTargetPhrase: targetPhrase ? true : false,
        status: realData.wordCount >= 300 ? 'Pass' : 'Fail',
        recommendation: realData.wordCount >= 300 ? '—' : 'Increase content length to at least 300 words',
        recommendationType: realData.wordCount >= 300 ? 'default' : 'fail',
      },
      {
        id: 'internal_links',
        name: 'Internal Link Count',
        currentValue: `${realData.internalLinkCount} incoming internal links`,
        hasTargetPhrase: false,
        status: realData.internalLinkCount >= 3 ? 'Pass' : 'Fail',
        recommendation: realData.internalLinkCount >= 3 ? '—' : `Current Internal Links: ${realData.internalLinkCount} | Minimum Required to Pass Audit: 3`,
        recommendationType: realData.internalLinkCount >= 3 ? 'default' : 'fail',
        issueCode: 'ISSUE 2: INTERNAL LINK COUNT',
      },
      {
        id: 'image_count',
        name: 'Image Count',
        currentValue: `${realData.imageCount} images`,
        hasTargetPhrase: false,
        status: realData.imageCount >= 1 ? 'Pass' : 'Fail',
        recommendation: realData.imageCount >= 1 ? '—' : 'Add images with target phrase alt text to enhance visual content',
        recommendationType: realData.imageCount >= 1 ? 'default' : 'warning',
      },
      {
        id: 'missing_alt',
        name: 'Images Missing Alt Text',
        currentValue: `${realData.missingAltCount} images with missing/generic alt text`,
        hasTargetPhrase: 'N/A',
        status: realData.missingAltCount === 0 ? 'Pass' : 'Fail',
        recommendation: realData.missingAltCount === 0 ? '—' : `Add descriptive alt text to ${realData.missingAltCount} images`,
        recommendationType: realData.missingAltCount === 0 ? 'default' : 'warning',
      },
    ]

    failedIssues = auditElements.filter(el => el.status === 'Fail').map((el, idx) => ({
      id: el.id,
      issueCode: el.issueCode || `ISSUE ${idx + 1}: ${el.name.toUpperCase()}`,
      recommendation: el.recommendation,
      name: el.name,
    }))
  }

  const passedCount = liveAuditData?.overall_score !== undefined ? (
    Math.round((liveAuditData.overall_score / 100) * auditElements.length)
  ) : (
    auditElements.filter(el => el.status === 'Pass').length
  )
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
                🟢 LIVE API DATA (TSE Page Auditor @ :8000)
              </span>
            ) : auditError ? (
              <span className="w4-status-disconnected" style={{ fontSize: '0.7rem', fontWeight: '700', color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', padding: '2px 8px', borderRadius: '4px' }} title={auditError}>
                🟠 LOCAL EXPORTED PACKAGE DATA (Backend API Offline)
              </span>
            ) : (
              <span className="w4-status-loading" style={{ fontSize: '0.7rem', fontWeight: '700', color: '#60a5fa' }}>
                🔵 Checking API Status...
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
              {isLoadingAudit ? 'Auditing...' : `${passedCount} / ${totalCount} Passed`}
              {!isLoadingAudit && (
                <span className="w4-score-subtext"> ({failedIssues.length} issues to fix)</span>
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
            <div className="w4-info-target-phrase">{targetPhrase}</div>
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

        {/* SEO Elements Audit Table */}
        <div className="w4-table-card">
          <table className="w4-audit-table">
            <thead>
              <tr>
                <th className="col-element">SEO Element</th>
                <th className="col-val">Current Value</th>
                <th className="col-target-p">Target Phrase</th>
                <th className="col-stat">Status</th>
                <th className="col-recom">Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {auditElements.map((el) => (
                <tr key={el.id}>
                  <td className="col-element font-bold">{el.name}</td>
                  <td className="col-val">{el.currentValue}</td>
                  <td className="col-target-p">
                    {el.hasTargetPhrase === 'N/A' ? (
                      <span className="pill-na">N/A</span>
                    ) : el.hasTargetPhrase ? (
                      <span className="pill-target-yes">Yes</span>
                    ) : (
                      <span className="pill-target-no">No</span>
                    )}
                  </td>
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
        </div>

        {/* Action Checklist: What to Fix Card */}
        {failedIssues.length > 0 && (
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
