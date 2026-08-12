import { useState, useEffect } from 'react'
import { executePageAudit } from '../services/pageAuditorApi'
import { generatePageSeoFingerprint } from '../utils/seoFingerprint'
import { savePageAuditApi, getPageAuditsApi, savePageConfigsApi } from '../services/websiteManagerApi'
import { getSiteAuditsStorageKey, getSiteConfigsStorageKey } from '../utils/siteKeyHelper'
import W4FixIssueDialog from '../components/W4FixIssueDialog'
import './PageAuditResultsPage.css'

function getCleanPathname(fullUrl, siteBaseUrl) {
  if (!fullUrl || typeof fullUrl !== 'string') return '/'
  const trimmed = fullUrl.trim()
  if (!trimmed || trimmed === 'https://' || trimmed === 'http://' || trimmed === 'https:///' || trimmed === 'http:///') return '/'

  try {
    const safeUrlStr = trimmed.includes(' ') ? encodeURI(trimmed) : trimmed
    if (safeUrlStr.startsWith('http://') || safeUrlStr.startsWith('https://')) {
      const parsed = new URL(safeUrlStr)
      return parsed.pathname || '/'
    }
    const base = (siteBaseUrl && typeof siteBaseUrl === 'string' && (siteBaseUrl.startsWith('http://') || siteBaseUrl.startsWith('https://')))
      ? siteBaseUrl.trim()
      : 'https://example.com'
    const parsed = new URL(safeUrlStr, base)
    return parsed.pathname || '/'
  } catch (_e) {
    if (trimmed.startsWith('/')) return trimmed
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const clean = trimmed.replace(/^https?:\/\/[^/]+/, '')
      return clean.startsWith('/') ? clean : `/${clean}`
    }
    return `/${trimmed}`
  }
}

export default function PageAuditResultsPage({
  site,
  page,
  pagesList = [],
  onBack,
  onNavigateToInternalLinking,
  onSyncFromWordPress,
  isSyncing = false,
}) {
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
  const [activeFixIssue, setActiveFixIssue] = useState(null)
  const [localOverrides, setLocalOverrides] = useState({})

  // Active page selection precedence:
  // 1. Configured page (passed via the page prop)
  // 2. Matching configured page from pagesList
  // 3. Raw exported page from pagesList
  // 4. Fallback
  const matchedFromList = pagesList.find(p => p.url === selectedUrl)

  const rawCurrentPage = (() => {
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

  const snap = liveAuditData?.page_snapshot || {}
  const overrideObj = localOverrides[rawCurrentPage.id || rawCurrentPage.url] || localOverrides[rawCurrentPage.url] || {}
  const currentPage = {
    ...rawCurrentPage,
    ...overrideObj,
    title: overrideObj.proposedTitle || overrideObj.metaTitle || rawCurrentPage.proposedTitle || snap.title || rawCurrentPage.title,
    proposedTitle: overrideObj.proposedTitle || overrideObj.metaTitle || rawCurrentPage.proposedTitle || snap.title || rawCurrentPage.title,
    metaTitle: overrideObj.metaTitle || overrideObj.proposedTitle || rawCurrentPage.metaTitle || snap.title || rawCurrentPage.title,
    metaDescription: overrideObj.metaDescription !== undefined ? overrideObj.metaDescription : (rawCurrentPage.metaDescription || snap.meta_description || ''),
    h1: overrideObj.h1 !== undefined ? overrideObj.h1 : (rawCurrentPage.h1 || (Array.isArray(snap.h1) ? snap.h1[0] : snap.h1) || ''),
  }

  const handleSaveFix = async ({ page: targetPage, seoType, fieldValue }) => {
    if (!targetPage) return
    const siteIdKey = getSiteConfigsStorageKey(site)
    const pageKey = targetPage.id || targetPage.url

    let savedConfigs = {}
    try {
      savedConfigs = JSON.parse(localStorage.getItem(siteIdKey) || '{}')
    } catch (e) {
      console.error('Failed to parse saved configs:', e)
    }

    const existingConfig = savedConfigs[pageKey] || (targetPage.url ? savedConfigs[targetPage.url] : {}) || {}

    const updatedConfig = {
      ...existingConfig,
      pageId: pageKey,
      url: targetPage.url,
      isConfigured: true,
      isManualOverride: true,
    }

    if (seoType === 'meta_title') {
      updatedConfig.proposedTitle = fieldValue
      updatedConfig.metaTitle = fieldValue
    } else if (seoType === 'meta_desc') {
      updatedConfig.metaDescription = fieldValue
    } else if (seoType === 'h1') {
      updatedConfig.h1 = fieldValue
    }

    savedConfigs[pageKey] = updatedConfig
    if (targetPage.url && targetPage.url !== pageKey) {
      savedConfigs[targetPage.url] = updatedConfig
    }
    localStorage.setItem(siteIdKey, JSON.stringify(savedConfigs))

    if (site?.id) {
      try {
        await savePageConfigsApi(site.id, savedConfigs)
      } catch (e) {
        console.error('Failed to save page configs to API:', e)
      }
    }

    try {
      const auditStorageKey = getSiteAuditsStorageKey(site)
      const storedAudits = JSON.parse(localStorage.getItem(auditStorageKey) || '{}')
      delete storedAudits[pageKey]
      if (targetPage.url) delete storedAudits[targetPage.url]
      localStorage.setItem(auditStorageKey, JSON.stringify(storedAudits))
    } catch (e) {
      console.error('Failed to clear cached audit:', e)
    }

    setLocalOverrides(prev => ({
      ...prev,
      [pageKey]: updatedConfig,
      [targetPage.url]: updatedConfig,
    }))
  }

  const targetPhrase = currentPage.target || currentPage.targetPhrase || ''
  const pageType = currentPage.type || currentPage.seoPageType || 'Landing Page'
  const displayTitle = currentPage.proposedTitle || currentPage.title || 'Untitled'
  const fullUrl = currentPage.url || site?.url || '/'

  // Clean path display
  const cleanPath = getCleanPathname(fullUrl, site?.url)

  // Storage key for page audit persistence
  const auditStorageKey = getSiteAuditsStorageKey(site)
  const [isRerunRequested, setIsRerunRequested] = useState(false)
  const [isCurrentPageStale, setIsCurrentPageStale] = useState(false)
  const [staleReasonText, setStaleReasonText] = useState(null)
  const [enrichedPagesList, setEnrichedPagesList] = useState([])

  // Auto-enrich pagesList with live WP content if local content is empty
  useEffect(() => {
    let isMounted = true
    async function autoEnrichPages() {
      if (!Array.isArray(pagesList) || pagesList.length === 0) return
      const hasEmptyContent = pagesList.some(p => {
        const c = typeof p.content === 'string' ? p.content : (p.content?.rendered || p.content?.raw || p.body_text || p.html || '')
        return !c || c.trim().length === 0
      })
      if (!hasEmptyContent) return

      try {
        const domainUrl = site?.url || pagesList[0]?.url || 'https://ascentbuilders.co.uk'
        const cleanDomain = domainUrl.replace(/\/$/, '')
        const [pagesRes, postsRes, projRes] = await Promise.all([
          fetch(`${cleanDomain}/wp-json/wp/v2/pages?per_page=100`),
          fetch(`${cleanDomain}/wp-json/wp/v2/posts?per_page=100`),
          fetch(`${cleanDomain}/wp-json/wp/v2/projects?per_page=100`)
        ])

        const pages = pagesRes.ok ? await pagesRes.json() : []
        const posts = postsRes.ok ? await postsRes.json() : []
        const projects = projRes.ok ? await projRes.json() : []
        const combined = [...pages, ...posts, ...projects]

        if (isMounted && combined.length > 0) {
          const contentMap = new Map()
          combined.forEach(item => {
            const itemUrl = item.link || item.url
            const text = item.content?.rendered || item.content?.raw || item.body_text || item.content || ''
            if (itemUrl && text) {
              contentMap.set(normalizeUrlForMatching(itemUrl), text)
            }
          })

          const enriched = pagesList.map(p => {
            const pNorm = normalizeUrlForMatching(p.url)
            const freshContent = contentMap.get(pNorm)
            if (freshContent) {
              return { ...p, content: freshContent, body_text: freshContent }
            }
            return p
          })

          setEnrichedPagesList(enriched)
        }
      } catch (err) {
        console.error('Auto-enrichment error:', err)
      }
    }
    autoEnrichPages()
    return () => { isMounted = false }
  }, [pagesList, site?.url])

  // Execute or load audit call for selected page
  useEffect(() => {
    let isMounted = true
    async function runLiveAudit() {
      if (!currentPage || !currentPage.url) return

      const pageKey = currentPage.url || currentPage.id
      let cachedAudit = null
      let isStaleRecord = false
      let staleReason = null

      // If re-run is NOT explicitly requested, check for cached audit result
      if (!isRerunRequested) {
        try {
          const storedAudits = JSON.parse(localStorage.getItem(auditStorageKey) || '{}')
          let record = storedAudits[pageKey] ||
                       (currentPage.url ? storedAudits[currentPage.url] : null) ||
                       (currentPage.id ? storedAudits[currentPage.id] : null)

          if (!record && site?.id) {
            try {
              const apiAudits = await getPageAuditsApi(site.id)
              record = apiAudits[pageKey] ||
                       (currentPage.url ? apiAudits[currentPage.url] : null) ||
                       (currentPage.id ? apiAudits[currentPage.id] : null)
            } catch (err) {}
          }

          if (record && record.isAudited && record.auditResult) {
            cachedAudit = record.auditResult
            isStaleRecord = Boolean(record.isStale)
            staleReason = record.staleReason || null
          }
        } catch (e) {
          console.error('Failed to read stored audit data:', e)
        }
      }

      if (cachedAudit) {
        if (isMounted) {
          setLiveAuditData(cachedAudit)
          setIsLoadingAudit(false)
          setAuditError(null)
          setIsCurrentPageStale(isStaleRecord)
          setStaleReasonText(staleReason)
        }
        return
      }

      setIsLoadingAudit(true)
      setAuditError(null)
      setLiveAuditData(null)
      setIsCurrentPageStale(false)
      setStaleReasonText(null)

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
          setIsRerunRequested(false)

          // Persist audit completion timestamp, fingerprint, and payload
          const now = new Date()
          const pad = n => String(n).padStart(2, '0')
          const formattedTimestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`
          const currentFingerprint = generatePageSeoFingerprint(currentPage)

          try {
            const storedAudits = JSON.parse(localStorage.getItem(auditStorageKey) || '{}')
            const auditRecord = {
              isAudited: true,
              isStale: false,
              staleReason: null,
              lastAuditTimestamp: formattedTimestamp,
              fingerprint: currentFingerprint,
              auditResult: result,
            }
            storedAudits[pageKey] = auditRecord
            if (currentPage.url && currentPage.url !== pageKey) {
              storedAudits[currentPage.url] = auditRecord
            }
            localStorage.setItem(auditStorageKey, JSON.stringify(storedAudits))

            if (site?.id) {
              savePageAuditApi(site.id, pageKey, auditRecord)
            }
          } catch (e) {
            console.error('Failed to save page audit result:', e)
          }

          // Update site record audit timestamp for W1 Website Tile
          try {
            const rawSites = localStorage.getItem('tse_website_dashboard_sites')
            if (rawSites) {
              const sitesList = JSON.parse(rawSites)
              const updatedSites = sitesList.map(s => {
                if (String(s.id) === String(site?.id)) {
                  return {
                    ...s,
                    isAudited: true,
                    lastAuditTimestamp: formattedTimestamp,
                  }
                }
                return s
              })
              localStorage.setItem('tse_website_dashboard_sites', JSON.stringify(updatedSites))
            }
          } catch (e) {
            console.error('Failed to update site tile audit timestamp:', e)
          }
        }
      } catch (e) {
        console.error('[AUDIT_TRACE_EXCEPTION_CAUGHT]', e)
        if (isMounted) {
          setAuditError(e.message || 'Failed to connect to Page Auditor backend.')
          setIsLoadingAudit(false)
          setIsRerunRequested(false)
        }
      }
    }
    runLiveAudit()
    return () => { isMounted = false }
  }, [selectedUrl, currentPage.url, currentPage.target, currentPage.type, isRerunRequested])

  // Map ONLY values returned by TSE Page Auditor
  let auditElements = []
  let failedIssues = []

  const assess = liveAuditData?.page_assessment || {}
  const breakdown = assess?.fit_breakdown || {}

  if (liveAuditData) {
    // Combine all check findings from strengths, weaknesses, recommendations
    const allChecks = [
      ...(liveAuditData.strengths || []),
      ...(liveAuditData.weaknesses || []),
      ...(liveAuditData.recommendations || []),
    ]

    const getCheck = (labelName) => allChecks.find(c => (c.label || '').toLowerCase() === labelName.toLowerCase())

    const titleCheck = getCheck('Title Tag') || getCheck('Meta Title')
    const descCheck = getCheck('Meta Description')
    const h1Check = getCheck('H1 Tag') || getCheck('H1 Heading') || getCheck('H1 Presence') || getCheck('H1')
    const hasH1Target = breakdown.h1 === 'Yes' || (
      snap.h1 && (Array.isArray(snap.h1) ? snap.h1.length > 0 : Boolean(snap.h1))
    )
    const h1Status = (hasH1Target && h1Check?.status !== 'fail') ? 'Pass' : 'Fail'
    const h2Check = getCheck('H2 Count') || getCheck('H2')
    const wordCheck = getCheck('Word Count')
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
        status: h1Status,
        recommendation: h1Status === 'Pass' ? '—' : (h1Check?.detail || `Add target phrase "${targetPhrase}" to H1 heading`),
        recommendationType: h1Status === 'Pass' ? 'default' : 'fail',
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
        id: 'image_count',
        name: 'Image Count',
        currentValue: `${snap.image_count !== undefined ? snap.image_count : 0} images`,
        hasTargetPhrase: false,
        status: (snap.image_count > 0) ? 'Pass' : 'Fail',
        recommendation: (snap.image_count > 0) ? '—' : 'Add relevant images that support the page content. Ensure every image has descriptive alt text.',
        recommendationType: (snap.image_count > 0) ? 'default' : 'fail',
      },
      {
        id: 'missing_alt',
        name: 'Images Missing Alt Text',
        currentValue: `${missingAltCount} images with missing/generic alt text`,
        hasTargetPhrase: 'N/A',
        status: missingAltCount === 0 ? 'Pass' : 'Fail',
        recommendation: missingAltCount === 0 ? '—' : `Add meaningful alt tags to ${missingAltCount} images missing them.`,
        recommendationType: missingAltCount === 0 ? 'default' : 'fail',
      },
    ]

    // Construct Action Checklist items from all failed audit elements (excluding duplicate Title Tag)
    const failedFromTable = auditElements
      .filter(el => el.status === 'Fail' && el.recommendation && el.recommendation !== '—')
      .filter(el => (el.name || '').toLowerCase() !== 'title tag')
      .map((el, idx) => ({
        id: el.id || `fail_${idx}`,
        issueCode: el.issueCode || `ISSUE ${idx + 1}: ${el.name.toUpperCase()}`,
        recommendation: el.recommendation,
        name: el.name,
      }))

    const extraWeaknesses = (liveAuditData.weaknesses || [])
      .filter(w => {
        const l = (w.label || '').toLowerCase()
        const k = (w.key || '').toLowerCase()
        if (l.includes('internal link') || k.includes('internal_link')) return false
        if (l.includes('title tag') || k.includes('title_tag') || l === 'title tag') return false
        return !auditElements.some(el => (el.name || '').toLowerCase() === l)
      })
      .map((w, idx) => ({
        id: w.key || `extra_weakness_${idx}`,
        issueCode: `ISSUE ${failedFromTable.length + idx + 1}: ${w.label ? w.label.toUpperCase() : 'CHECK'}`,
        recommendation: w.detail || w.label || '',
        name: w.label || 'SEO Check',
      }))

    failedIssues = [...failedFromTable, ...extraWeaknesses].map((issue, idx) => ({
      ...issue,
      issueCode: `ISSUE ${idx + 1}: ${issue.name.toUpperCase()}`,
    }))
  }

  const passedCount = auditElements.length > 0 ? auditElements.filter(el => el.status === 'Pass').length : 0
  const totalCount = auditElements.length

  if (!currentPage || !currentPage.url || (Array.isArray(pagesList) && pagesList.length === 0)) {
    return (
      <div className="w4-audit-container">
        <div className="w3-back-row">
          <button type="button" className="w3-btn-back" onClick={onBack}>
            ← Back to W2 | Website Dashboard
          </button>
        </div>
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <h2>No Pages Available to Audit</h2>
          <p style={{ marginTop: '8px' }}>Please synchronise the website in W2 Website Dashboard to load pages.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w4-audit-wrapper">
      <div className="w4-audit-container">

        {/* Top Back Navigation Link */}
        <div className="w4-back-row" style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className="w4-btn-back"
            onClick={onBack}
            id="btn-back-to-website-management"
          >
            ← Back to Website Management
          </button>
        </div>

        {/* Audit Stale Banner */}
        {isCurrentPageStale && (
          <div style={{ backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>🟡 Audit Required ?</strong>
              <div style={{ fontSize: '0.82rem', marginTop: '4px', color: '#fef08a' }}>
                {staleReasonText || 'Page content or SEO elements were modified in WordPress after the last audit.'} Click "Re-run Audit ▷" to update audit results.
              </div>
            </div>
            <button
              type="button"
              className="w3-btn-emerald"
              onClick={() => setIsRerunRequested(true)}
              disabled={isLoadingAudit}
              style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              {isLoadingAudit ? 'Auditing...' : 'Re-run Audit ▷'}
            </button>
          </div>
        )}

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
                  return displayList.map((p, idx) => {
                    const formattedPath = getCleanPathname(p.url, site?.url)
                    return (
                      <option key={p.id || p.url || idx} value={p.url}>
                        {formattedPath} ({p.proposedTitle || p.title || 'Untitled'})
                      </option>
                    )
                  })
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
                pageType === 'Topical' || pageType === 'Topical Page' ? 'topical' :
                pageType === 'Article' || pageType === 'Article Page' ? 'article' : 'unclassified'
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
        {liveAuditData && (
          <div className="w4-checklist-card">
            <div className="w4-checklist-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span className="w4-warning-icon">⚠</span>
                <div>
                  <h3 className="w4-checklist-title">Action Checklist: What to Fix</h3>
                  <p className="w4-checklist-subtitle">
                    Staff Action Required: Fix issues or click Optimise Page SEO to edit page metadata.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="w4-btn-fix-issue"
                style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed', padding: '10px 18px', fontSize: '0.92rem', fontWeight: '600' }}
                onClick={() => setActiveFixIssue({ id: 'batch_optimization', name: 'Batch Page Optimization', recommendation: 'Optimize Meta Title, Meta Description, and H1 tags.' })}
                id="btn-optimise-page-seo"
              >
                Optimise Page SEO ▷
              </button>
            </div>

            {failedIssues.length > 0 && (
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
                      onClick={() => setActiveFixIssue(issue)}
                    >
                      Fix Issue ▷
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fix Issue Workflow Modal Template */}
        <W4FixIssueDialog
          isOpen={Boolean(activeFixIssue)}
          issue={activeFixIssue}
          page={currentPage}
          site={site}
          onClose={() => setActiveFixIssue(null)}
          onSaveFix={handleSaveFix}
          onSyncWebsiteData={onSyncFromWordPress}
          onRerunAudit={() => setIsRerunRequested(true)}
        />

      </div>
    </div>
  )
}
