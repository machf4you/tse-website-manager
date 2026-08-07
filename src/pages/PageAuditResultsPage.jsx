import { useState, useEffect } from 'react'
import { executePageAudit } from '../services/pageAuditorApi'
import './PageAuditResultsPage.css'

export default function PageAuditResultsPage({ site, page, pagesList = [], onBack }) {
  // Allow selecting any page from the dropdown
  const [selectedUrl, setSelectedUrl] = useState(() => page?.url || pagesList[0]?.url || '')
  const [liveAuditData, setLiveAuditData] = useState(null)
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)
  const [_auditError, setAuditError] = useState(null)

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

  // Map elements from returned Page Auditor result or template fallback
  const auditElements = liveAuditData?.element_scores?.length > 0 ? (
    liveAuditData.element_scores.map((item, idx) => ({
      id: item.name ? item.name.toLowerCase().replace(/\s+/g, '_') : `item_${idx}`,
      name: item.name || 'SEO Check',
      currentValue: item.current_value || '—',
      hasTargetPhrase: item.has_target_phrase !== undefined ? item.has_target_phrase : true,
      status: item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : 'Pass',
      recommendation: item.recommendation || '—',
      recommendationType: item.status === 'fail' ? 'fail' : (item.status === 'warn' ? 'warning' : 'default'),
    }))
  ) : (
    [
      {
        id: 'meta_title',
        name: 'Meta Title',
        currentValue: displayTitle,
        hasTargetPhrase: true,
        status: 'Pass',
        recommendation: '—',
      },
      {
        id: 'meta_description',
        name: 'Meta Description',
        currentValue: `Looking for professional ${targetPhrase} in South London? We provide high-quality, reliable solutions tailored to your needs. Get your free quote today!`,
        hasTargetPhrase: true,
        status: 'Pass',
        recommendation: '—',
      },
      {
        id: 'h1',
        name: 'H1',
        currentValue: `${displayTitle} Specialists Across South East London`,
        hasTargetPhrase: false,
        status: 'Fail',
        recommendation: `Add target phrase "${targetPhrase}" to H1 heading`,
        recommendationType: 'fail',
        issueCode: 'ISSUE 1: H1',
      },
      {
        id: 'h2_count',
        name: 'H2 Count',
        currentValue: '4 H2 headings',
        hasTargetPhrase: false,
        status: 'Pass',
        recommendation: `Add target phrase "${targetPhrase}" to at least one H2 heading`,
        recommendationType: 'warning',
      },
      {
        id: 'word_count',
        name: 'Word Count',
        currentValue: '1039 words',
        hasTargetPhrase: true,
        status: 'Pass',
        recommendation: '—',
      },
      {
        id: 'internal_links',
        name: 'Internal Link Count',
        currentValue: '0 incoming internal links',
        hasTargetPhrase: false,
        status: 'Fail',
        recommendation: 'Current Internal Links: 0 | Minimum Required to Pass Audit: 3',
        recommendationType: 'fail',
        issueCode: 'ISSUE 2: INTERNAL LINK COUNT',
      },
      {
        id: 'image_count',
        name: 'Image Count',
        currentValue: '1 images',
        hasTargetPhrase: false,
        status: 'Pass',
        recommendation: `Optimize image alt tags or filenames with target phrase "${targetPhrase}"`,
        recommendationType: 'warning',
      },
      {
        id: 'missing_alt',
        name: 'Images Missing Alt Text',
        currentValue: '0 images with missing/generic alt text',
        hasTargetPhrase: 'N/A',
        status: 'Pass',
        recommendation: '—',
      },
    ]
  )

  // Map action checklist from returned Page Auditor result or template fallback
  const failedIssues = liveAuditData?.action_checklist?.length > 0 ? (
    liveAuditData.action_checklist.map((issue, idx) => ({
      id: `issue_${idx}`,
      issueCode: issue.code || `ISSUE ${idx + 1}`,
      recommendation: issue.title || issue.recommendation || '',
      name: issue.area || 'SEO Check',
    }))
  ) : (
    auditElements.filter(el => el.status === 'Fail').map((el, idx) => ({
      id: el.id,
      issueCode: el.issueCode || `ISSUE ${idx + 1}: ${el.name.toUpperCase()}`,
      recommendation: el.recommendation,
      name: el.name,
    }))
  )

  const passedCount = liveAuditData?.overall_score !== undefined ? (
    Math.round((liveAuditData.overall_score / 100) * auditElements.length)
  ) : (
    auditElements.length - failedIssues.length
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
          <span className="w4-pill-badge">W3 | LATEST PAGE AUDIT RESULTS</span>
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
              {pagesList.length > 0 ? (
                pagesList.map((p, idx) => (
                  <option key={p.id || p.url || idx} value={p.url}>
                    {p.url ? (new URL(p.url, site?.url || 'https://example.com').pathname || '/') : '/'} ({p.proposedTitle || p.title || 'Untitled'})
                  </option>
                ))
              ) : (
                <option value={currentPage.url || '/'}>
                  {cleanPath} ({displayTitle})
                </option>
              )}
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
