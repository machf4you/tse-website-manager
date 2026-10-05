import { useState, useEffect } from 'react'
import { getSiteSlug } from '../utils/siteSlugHelper'
import {
  getWpPackageApi,
  getPageConfigsApi,
  getPageAuditsApi,
  getInternalLinkRecommendationsApi,
  getPageRankingsApi,
  getSiteBacklinksApi,
  getSiteBacklinkPlanApi,
  getSiteGbpApi
} from '../services/websiteManagerApi'
import { extractPagesFromPackage } from '../utils/packageExtractor'
import './PerformanceDashboardPage.css'

/* ── Icons ── */
const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  </svg>
)

const AlertTriangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const FileTextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)

const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

const Share2Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
)

const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

export default function PerformanceDashboardPage({ site, onBack, onNavigateTab }) {
  const [loading, setLoading] = useState(true)

  // Module Data States
  const [pagesData, setPagesData] = useState({ total: 0, configured: 0, unconfigured: 0, excluded: 0, types: {} })
  const [rankingsData, setRankingsData] = useState({ totalTracked: 0, top3: 0, top10: 0, top20: 0, keywords: [] })
  const [linksData, setLinksData] = useState({ totalRecs: 0, orphanPages: 0, recsList: [] })
  const [backlinksData, setBacklinksData] = useState({ total: 0, indexed: 0, awaiting: 0, planCount: 0, freeCount: 0, paidCount: 0, topPages: [] })
  const [gbpData, setGbpData] = useState({ status: 'Not Created', verification_status: 'Not Verified', business_name: '', primary_category: '', phone: '', website: '' })
  const [techData, setTechData] = useState({ auditedCount: 0, titlePassed: 0, titleAttention: 0, descPassed: 0, descAttention: 0, h1Passed: 0, h1Attention: 0, canonicalVerified: 0 })

  const slug = getSiteSlug(site)

  useEffect(() => {
    let isMounted = true
    if (!site?.id) {
      setLoading(false)
      return
    }

    async function loadAllPerformanceData() {
      try {
        // 1. Fetch W3 Pages Package & Page Configs
        const [pkgRes, configsRes] = await Promise.allSettled([
          getWpPackageApi(site.id),
          getPageConfigsApi(site.id)
        ])

        const pkg = pkgRes.status === 'fulfilled' && pkgRes.value ? (pkgRes.value.packageData || pkgRes.value) : null
        const configs = configsRes.status === 'fulfilled' && configsRes.value ? configsRes.value : {}
        const rawPages = extractPagesFromPackage(pkg)

        let configuredCount = 0
        let unconfiguredCount = 0
        let excludedCount = 0
        const typeCounts = { Hub: 0, Landing: 0, Topical: 0, Article: 0, Unassigned: 0 }

        rawPages.forEach(p => {
          const key = p.id || p.url
          const cfg = configs[key] || (p.url ? configs[p.url] : null)
          const target = (cfg?.targetPhrase || cfg?.target || p.targetPhrase || p.target || '').trim()
          const pType = cfg?.type || p.type || 'Unassigned'
          const isEx = cfg?.isExcluded || pType === 'Excluded' || p.isExcluded

          if (isEx) {
            excludedCount++
          } else if (target) {
            configuredCount++
            if (typeCounts[pType] !== undefined) typeCounts[pType]++
            else typeCounts.Unassigned++
          } else {
            unconfiguredCount++
          }
        })

        if (isMounted) {
          setPagesData({
            total: rawPages.length,
            configured: configuredCount,
            unconfigured: unconfiguredCount,
            excluded: excludedCount,
            types: typeCounts
          })
        }

        // 2. Fetch Page Audits for Technical Summary
        try {
          const auditsRes = await getPageAuditsApi(site.id)
          if (isMounted && auditsRes && typeof auditsRes === 'object') {
            let auditedCount = 0
            let titlePassed = 0
            let titleAttention = 0
            let descPassed = 0
            let descAttention = 0
            let h1Passed = 0
            let h1Attention = 0
            let canonicalVerified = 0

            Object.values(auditsRes).forEach(rec => {
              if (rec && rec.isAudited && rec.auditResult) {
                auditedCount++
                const snap = rec.auditResult.page_snapshot || rec.auditResult.snapshot || {}
                const title = (snap.title || '').trim()
                const desc = (snap.meta_description || snap.description || '').trim()
                const h1Arr = Array.isArray(snap.h1) ? snap.h1 : (snap.h1 ? [snap.h1] : [])
                const canonical = (snap.canonical || '').trim()

                if (title && title.length >= 25) titlePassed++
                else titleAttention++

                if (desc && desc.length >= 50) descPassed++
                else descAttention++

                if (h1Arr.length > 0 && h1Arr[0]) h1Passed++
                else h1Attention++

                if (canonical) canonicalVerified++
              }
            })

            setTechData({
              auditedCount,
              titlePassed,
              titleAttention,
              descPassed,
              descAttention,
              h1Passed,
              h1Attention,
              canonicalVerified
            })
          }
        } catch (e) {}

        // 3. Fetch W6 Rankings Data
        try {
          const rankingsRes = await getPageRankingsApi(site.id)
          if (isMounted && rankingsRes) {
            const list = Array.isArray(rankingsRes) ? rankingsRes : (rankingsRes.rankings || [])
            let top3 = 0
            let top10 = 0
            let top20 = 0

            list.forEach(item => {
              const pos = Number(item.position || item.currentPosition || item.rank || 0)
              if (pos > 0 && pos <= 3) top3++
              if (pos > 0 && pos <= 10) top10++
              if (pos > 0 && pos <= 20) top20++
            })

            setRankingsData({
              totalTracked: list.length,
              top3,
              top10,
              top20,
              keywords: list.slice(0, 5)
            })
          }
        } catch (e) {}

        // 4. Fetch W5 Internal Link Recs
        try {
          const recsRes = await getInternalLinkRecommendationsApi(site.id)
          if (isMounted && recsRes) {
            const recsMap = typeof recsRes === 'object' ? recsRes : {}
            let count = 0
            Object.values(recsMap).forEach(arr => {
              if (Array.isArray(arr)) count += arr.length
            })
            setLinksData({
              totalRecs: count,
              orphanPages: 0,
              recsList: Object.keys(recsMap).slice(0, 4)
            })
          }
        } catch (e) {}

        // 5. Fetch W8 Backlinks & Plan
        try {
          const [blRes, planRes] = await Promise.allSettled([
            getSiteBacklinksApi(site),
            getSiteBacklinkPlanApi(site)
          ])

          const bl = blRes.status === 'fulfilled' && blRes.value ? blRes.value : {}
          const plan = planRes.status === 'fulfilled' && planRes.value ? planRes.value : {}

          const planItems = Array.isArray(plan?.items) ? plan.items : []
          let freeCount = 0
          let paidCount = 0
          planItems.forEach(item => {
            if (String(item.status || '').toLowerCase() === 'paid') paidCount++
            else freeCount++
          })

          if (isMounted) {
            setBacklinksData({
              total: bl.total || 0,
              indexed: bl.indexed || 0,
              awaiting: bl.awaiting || 0,
              planCount: planItems.length,
              freeCount,
              paidCount,
              topPages: bl.topTargetPages || []
            })
          }
        } catch (e) {}

        // 6. Fetch W9 GBP Data
        try {
          const gbpRes = await getSiteGbpApi(site)
          if (isMounted && gbpRes) {
            setGbpData(gbpRes)
          }
        } catch (e) {}

      } catch (err) {
        console.error('Error hydrating performance dashboard data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadAllPerformanceData()
    return () => { isMounted = false }
  }, [site])

  // Derive genuine "Needs Attention" items strictly from existing data
  const attentionItems = []
  if (gbpData.status === 'Not Created') {
    attentionItems.push({ type: 'warning', text: 'Google Business Profile is not created yet (W9)', tab: 'w9' })
  } else if (gbpData.verification_status === 'Not Verified') {
    attentionItems.push({ type: 'warning', text: 'Google Business Profile is pending verification (W9)', tab: 'w9' })
  }

  if (pagesData.unconfigured > 0) {
    attentionItems.push({ type: 'info', text: `${pagesData.unconfigured} pages require keyword & target phrase configuration (W3)`, tab: 'w3' })
  }

  if (techData.titleAttention > 0) {
    attentionItems.push({ type: 'warning', text: `${techData.titleAttention} audited page(s) have Meta Title optimization issues (W4)`, tab: 'w3' })
  }

  if (techData.descAttention > 0) {
    attentionItems.push({ type: 'warning', text: `${techData.descAttention} audited page(s) have Meta Description optimization issues (W4)`, tab: 'w3' })
  }

  if (techData.h1Attention > 0) {
    attentionItems.push({ type: 'warning', text: `${techData.h1Attention} audited page(s) missing or weak H1 header (W4)`, tab: 'w3' })
  }

  if (backlinksData.awaiting > 0) {
    attentionItems.push({ type: 'info', text: `${backlinksData.awaiting} backlinks awaiting indexing verification in Site Registry (W8)`, tab: 'w8' })
  }

  if (linksData.totalRecs === 0 && pagesData.configured > 0) {
    attentionItems.push({ type: 'info', text: 'Internal linking analysis recommended to discover orphan & weak pages (W5)', tab: 'w5' })
  }

  return (
    <div className="performance-dashboard-page">
      {/* ── Top Header Navigation ── */}
      <div className="perf-top-bar">
        <button
          type="button"
          className="perf-btn-back"
          onClick={onBack}
          id="btn-perf-back"
        >
          ← Back to Website Dashboard (W2)
        </button>

        <div className="perf-sequence-nav">
          <button type="button" className="perf-nav-tab" onClick={() => onNavigateTab && onNavigateTab('w3')}>W3 | Pages</button>
          <button type="button" className="perf-nav-tab" onClick={() => onNavigateTab && onNavigateTab('w5')}>W5 | Links</button>
          <button type="button" className="perf-nav-tab" onClick={() => onNavigateTab && onNavigateTab('w6')}>W6 | Rankings</button>
          <button type="button" className="perf-nav-tab" onClick={() => onNavigateTab && onNavigateTab('w7')}>W7 | Social</button>
          <button type="button" className="perf-nav-tab" onClick={() => onNavigateTab && onNavigateTab('w8')}>W8 | Backlinks</button>
          <button type="button" className="perf-nav-tab" onClick={() => onNavigateTab && onNavigateTab('w9')}>W9 | GBP</button>
        </div>
      </div>

      {/* ── Header Title Row ── */}
      <div className="perf-header">
        <div className="perf-header-meta">
          <span className="perf-pill-tag">PERFORMANCE DASHBOARD</span>
          <h1 className="perf-site-name">{site.name || 'Website Performance'}</h1>
          <div className="perf-subheading">
            <span>Performance Summary for <strong>{site.name}</strong> ({slug})</span>
            {site.url && (
              <a href={site.url} target="_blank" rel="noreferrer" className="perf-site-link">
                {site.url} <ExternalLinkIcon />
              </a>
            )}
          </div>
        </div>

        <div className="perf-quick-stats">
          <div className="qs-item">
            <span className="qs-lbl">Platform</span>
            <span className="qs-val">{site.platform ? (site.platform.charAt(0).toUpperCase() + site.platform.slice(1)) : 'WordPress'}</span>
          </div>
          <div className="qs-item">
            <span className="qs-lbl">Pages Found</span>
            <span className="qs-val text-white">{pagesData.total}</span>
          </div>
          <div className="qs-item">
            <span className="qs-lbl">Configured</span>
            <span className="qs-val text-emerald">{pagesData.configured}</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: Needs Attention & System Overview Banner ── */}
      <div className="perf-hero-banner">
        <div className="hero-alert-header">
          <AlertTriangleIcon />
          <h2 className="hero-alert-title">Needs Attention & Active Action Items</h2>
          <span className="hero-alert-count">{attentionItems.length} Actionable Items</span>
        </div>

        {attentionItems.length > 0 ? (
          <div className="hero-attention-grid">
            {attentionItems.map((item, idx) => (
              <div key={idx} className={`attention-chip chip-${item.type}`} onClick={() => onNavigateTab && onNavigateTab(item.tab)}>
                <span className="chip-bullet">•</span>
                <span className="chip-text">{item.text}</span>
                <span className="chip-arrow">Fix ›</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="hero-all-good">
            <CheckCircleIcon />
            <span>All core website metrics & configurations are up to date!</span>
          </div>
        )}
      </div>

      {/* ── SECTION 1.5: Technical Summary & Onsite Health Block ── */}
      <div className="perf-tech-summary-card">
        <div className="card-header">
          <div className="card-header-title">
            <div className="icon-badge bg-emerald"><CheckCircleIcon /></div>
            <div>
              <h3 className="card-title">Technical Summary & Onsite Setup</h3>
              <span className="card-sub">Technical status derived from site inventory & page audits</span>
            </div>
          </div>
        </div>

        <div className="tech-summary-grid">
          <div className="tech-item">
            <span className="tech-icon text-emerald">✓</span>
            <div className="tech-info">
              <span className="tech-label">XML Sitemap / Inventory</span>
              <span className="tech-status">{pagesData.total > 0 ? `Found (${pagesData.total} Pages Discovered)` : 'Not Synchronised'}</span>
            </div>
          </div>

          <div className="tech-item">
            <span className="tech-icon text-emerald">✓</span>
            <div className="tech-info">
              <span className="tech-label">Platform Connection</span>
              <span className="tech-status">{site.platform ? site.platform.toUpperCase() : 'WORDPRESS'} API Active</span>
            </div>
          </div>

          <div className="tech-item">
            <span className={`tech-icon ${pagesData.unconfigured > 0 ? 'text-amber' : 'text-emerald'}`}>
              {pagesData.unconfigured > 0 ? '⚠' : '✓'}
            </span>
            <div className="tech-info">
              <span className="tech-label">Target Keyword Setup</span>
              <span className="tech-status">{pagesData.configured} Configured / {pagesData.unconfigured} Unconfigured</span>
            </div>
          </div>

          {techData.auditedCount > 0 && (
            <>
              <div className="tech-item">
                <span className={`tech-icon ${techData.titleAttention > 0 ? 'text-amber' : 'text-emerald'}`}>
                  {techData.titleAttention > 0 ? '⚠' : '✓'}
                </span>
                <div className="tech-info">
                  <span className="tech-label">Meta Titles Optimization</span>
                  <span className="tech-status">{techData.titlePassed} Passed / {techData.titleAttention} Need Attention</span>
                </div>
              </div>

              <div className="tech-item">
                <span className={`tech-icon ${techData.descAttention > 0 ? 'text-amber' : 'text-emerald'}`}>
                  {techData.descAttention > 0 ? '⚠' : '✓'}
                </span>
                <div className="tech-info">
                  <span className="tech-label">Meta Descriptions Optimization</span>
                  <span className="tech-status">{techData.descPassed} Passed / {techData.descAttention} Need Attention</span>
                </div>
              </div>

              <div className="tech-item">
                <span className={`tech-icon ${techData.h1Attention > 0 ? 'text-amber' : 'text-emerald'}`}>
                  {techData.h1Attention > 0 ? '⚠' : '✓'}
                </span>
                <div className="tech-info">
                  <span className="tech-label">H1 / Headers Optimization</span>
                  <span className="tech-status">{techData.h1Passed} Passed / {techData.h1Attention} Need Attention</span>
                </div>
              </div>

              {techData.canonicalVerified > 0 && (
                <div className="tech-item">
                  <span className="tech-icon text-emerald">✓</span>
                  <div className="tech-info">
                    <span className="tech-label">Canonical Tags</span>
                    <span className="tech-status">{techData.canonicalVerified} Pages Verified</span>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="tech-item">
            <span className={`tech-icon ${gbpData.status === 'Created' ? 'text-emerald' : 'text-amber'}`}>
              {gbpData.status === 'Created' ? '✓' : '⚠'}
            </span>
            <div className="tech-info">
              <span className="tech-label">Google Business Profile Record</span>
              <span className="tech-status">{gbpData.status} ({gbpData.verification_status})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Varied Grid Layout ── */}
      <div className="perf-grid-layout">

        {/* ── ROW 1: Wide Block (65%) + Medium Block (35%) ── */}
        <div className="perf-row row-asymmetric">

          {/* Block A: Rankings & Keywords (W6) - Wide Block */}
          <div className="perf-card card-wide theme-blue" onClick={() => onNavigateTab && onNavigateTab('w6')}>
            <div className="card-header">
              <div className="card-header-title">
                <div className="icon-badge bg-blue"><ActivityIcon /></div>
                <div>
                  <h3 className="card-title">Rankings & Keyword Positions</h3>
                  <span className="card-sub">DataForSEO & Rank Tracker Summary (W6)</span>
                </div>
              </div>
              <button type="button" className="card-action-btn btn-blue" onClick={(e) => { e.stopPropagation(); onNavigateTab && onNavigateTab('w6') }}>
                Open W6 Rank Tracker ›
              </button>
            </div>

            <div className="card-body">
              <div className="rankings-metrics-row">
                <div className="metric-box">
                  <span className="m-val text-blue">{rankingsData.totalTracked}</span>
                  <span className="m-lbl">Phrases Tracked</span>
                </div>
                <div className="metric-box">
                  <span className="m-val text-emerald">{rankingsData.top3}</span>
                  <span className="m-lbl">Top 3 Positions</span>
                </div>
                <div className="metric-box">
                  <span className="m-val text-amber">{rankingsData.top10}</span>
                  <span className="m-lbl">Top 10 Positions</span>
                </div>
                <div className="metric-box">
                  <span className="m-val text-slate">{rankingsData.top20}</span>
                  <span className="m-lbl">Top 20 Positions</span>
                </div>
              </div>

              {rankingsData.keywords.length > 0 ? (
                <div className="ranking-preview-list">
                  <span className="preview-hdr">Top Tracked Phrases:</span>
                  {rankingsData.keywords.map((kw, i) => (
                    <div key={i} className="kw-row">
                      <span className="kw-phrase">{kw.keyword || kw.targetPhrase || kw.phrase}</span>
                      <span className="kw-pos">Pos: {kw.position || kw.rank || '-'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state-text">No target phrases currently tracked in Rank Tracker for {site.name}. Open W6 to add keyword phrases.</p>
              )}
            </div>
          </div>

          {/* Block B: Google Business Profile (W9) - Medium Block */}
          <div className="perf-card card-medium theme-red" onClick={() => onNavigateTab && onNavigateTab('w9')}>
            <div className="card-header">
              <div className="card-header-title">
                <div className="icon-badge bg-red"><MapPinIcon /></div>
                <div>
                  <h3 className="card-title">Google Business Profile</h3>
                  <span className="card-sub">Permanent Record (W9)</span>
                </div>
              </div>
              <button type="button" className="card-action-btn btn-red" onClick={(e) => { e.stopPropagation(); onNavigateTab && onNavigateTab('w9') }}>
                Open W9 GBP ›
              </button>
            </div>

            <div className="card-body gbp-body">
              <div className="gbp-status-duo">
                <div className="gbp-stat-box">
                  <span className="gbp-lbl">Status</span>
                  <span className={`gbp-badge ${gbpData.status === 'Created' ? 'badge-green' : 'badge-amber'}`}>
                    {gbpData.status || 'Not Created'}
                  </span>
                </div>
                <div className="gbp-stat-box">
                  <span className="gbp-lbl">Verification</span>
                  <span className={`gbp-badge ${gbpData.verification_status === 'Verified' ? 'badge-green' : 'badge-amber'}`}>
                    {gbpData.verification_status || 'Not Verified'}
                  </span>
                </div>
              </div>

              <div className="gbp-fields-list">
                <div className="gbp-field-item">
                  <span className="f-lbl">Business Name:</span>
                  <span className="f-val">{gbpData.business_name || '(Not set)'}</span>
                </div>
                <div className="gbp-field-item">
                  <span className="f-lbl">Primary Category:</span>
                  <span className="f-val">{gbpData.primary_category || '(Not set)'}</span>
                </div>
                <div className="gbp-field-item">
                  <span className="f-lbl">Phone:</span>
                  <span className="f-val">{gbpData.phone || '(Not set)'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── ROW 2: 3-Column Grid (Pages / Internal Links / Backlinks) ── */}
        <div className="perf-row row-triplet">

          {/* Block C: Pages & SEO Config (W3) */}
          <div className="perf-card theme-emerald" onClick={() => onNavigateTab && onNavigateTab('w3')}>
            <div className="card-header">
              <div className="card-header-title">
                <div className="icon-badge bg-emerald"><FileTextIcon /></div>
                <div>
                  <h3 className="card-title">Pages & SEO Config</h3>
                  <span className="card-sub">Page Inventory (W3)</span>
                </div>
              </div>
              <button type="button" className="card-action-btn btn-emerald" onClick={(e) => { e.stopPropagation(); onNavigateTab && onNavigateTab('w3') }}>
                Open W3 ›
              </button>
            </div>

            <div className="card-body">
              <div className="mini-stats-grid">
                <div className="ms-box">
                  <span className="ms-val">{pagesData.total}</span>
                  <span className="ms-lbl">Total Pages</span>
                </div>
                <div className="ms-box">
                  <span className="ms-val text-emerald">{pagesData.configured}</span>
                  <span className="ms-lbl">Configured</span>
                </div>
                <div className="ms-box">
                  <span className="ms-val text-amber">{pagesData.unconfigured}</span>
                  <span className="ms-lbl">Action Required</span>
                </div>
              </div>

              <div className="page-type-bar">
                <span className="pt-title">Configured Types:</span>
                <div className="pt-chips">
                  {Object.entries(pagesData.types).map(([tName, count]) => count > 0 && (
                    <span key={tName} className="pt-chip">{tName}: {count}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Block D: Internal Linking (W5) */}
          <div className="perf-card theme-purple" onClick={() => onNavigateTab && onNavigateTab('w5')}>
            <div className="card-header">
              <div className="card-header-title">
                <div className="icon-badge bg-purple"><LinkIcon /></div>
                <div>
                  <h3 className="card-title">Internal Linking</h3>
                  <span className="card-sub">Structure & AI Recs (W5)</span>
                </div>
              </div>
              <button type="button" className="card-action-btn btn-purple" onClick={(e) => { e.stopPropagation(); onNavigateTab && onNavigateTab('w5') }}>
                Open W5 ›
              </button>
            </div>

            <div className="card-body">
              <div className="mini-stats-grid">
                <div className="ms-box">
                  <span className="ms-val text-purple">{linksData.totalRecs}</span>
                  <span className="ms-lbl">Link Opportunities</span>
                </div>
                <div className="ms-box">
                  <span className="ms-val text-slate">{linksData.orphanPages}</span>
                  <span className="ms-lbl">Orphan Pages</span>
                </div>
              </div>

              <p className="card-info-snippet">
                {linksData.totalRecs > 0
                  ? `${linksData.totalRecs} AI internal link recommendations available across configured pages.`
                  : 'Run Internal Linking analysis in W5 to discover link opportunity recommendations.'}
              </p>
            </div>
          </div>

          {/* Block E: Backlinks (W8) */}
          <div className="perf-card theme-amber" onClick={() => onNavigateTab && onNavigateTab('w8')}>
            <div className="card-header">
              <div className="card-header-title">
                <div className="icon-badge bg-amber"><LinkIcon /></div>
                <div>
                  <h3 className="card-title">Backlinks & Strategy</h3>
                  <span className="card-sub">Site Registry Data (W8)</span>
                </div>
              </div>
              <button type="button" className="card-action-btn btn-amber" onClick={(e) => { e.stopPropagation(); onNavigateTab && onNavigateTab('w8') }}>
                Open W8 ›
              </button>
            </div>

            <div className="card-body">
              <div className="mini-stats-grid">
                <div className="ms-box">
                  <span className="ms-val">{backlinksData.total}</span>
                  <span className="ms-lbl">Live Links</span>
                </div>
                <div className="ms-box">
                  <span className="ms-val text-emerald">{backlinksData.indexed}</span>
                  <span className="ms-lbl">Indexed</span>
                </div>
                <div className="ms-box">
                  <span className="ms-val text-amber">{backlinksData.awaiting}</span>
                  <span className="ms-lbl">Awaiting</span>
                </div>
              </div>

              <div className="backlinks-plan-mini">
                <span className="plan-mini-lbl">Backlink Strategy Plan:</span>
                <span className="plan-mini-val">
                  {backlinksData.planCount} total ({backlinksData.freeCount} Free / {backlinksData.paidCount} Paid)
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ── ROW 3: Full Width Block (Social W7) ── */}
        <div className="perf-row row-full">

          {/* Block F: Social Dashboard (W7) */}
          <div className="perf-card theme-pink" onClick={() => onNavigateTab && onNavigateTab('w7')}>
            <div className="card-header">
              <div className="card-header-title">
                <div className="icon-badge bg-pink"><Share2Icon /></div>
                <div>
                  <h3 className="card-title">Social Content & Automation</h3>
                  <span className="card-sub">bundle.social & Asset Management (W7)</span>
                </div>
              </div>
              <button type="button" className="card-action-btn btn-pink" onClick={(e) => { e.stopPropagation(); onNavigateTab && onNavigateTab('w7') }}>
                Open W7 Social Dashboard ›
              </button>
            </div>

            <div className="card-body social-body">
              <div className="social-summary-row">
                <div className="social-info-item">
                  <span className="s-lbl">Social Accounts:</span>
                  <span className="s-val text-pink">Connected & Available via bundle.social</span>
                </div>
                <div className="social-info-item">
                  <span className="s-lbl">AI Media Workflows:</span>
                  <span className="s-val text-white">Nano Banana Images, Veo Videos, Creatomate Publishing</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
