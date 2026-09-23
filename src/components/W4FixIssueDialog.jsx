import { useState, useEffect } from 'react'
import { extractSafeString } from '../utils/safeString'
import { updateWordPressSEOFields } from '../services/wordpressApi'
import { generateSeoRecommendations, resolveProposedField } from '../utils/seoRecommendationGenerator'
import './W4FixIssueDialog.css'

export default function W4FixIssueDialog({
  isOpen,
  issue,
  page,
  site,
  onClose,
  onSaveFix,
  onSyncWebsiteData,
  isSyncing = false,
  onRerunAudit,
}) {
  const [metaTitleVal, setMetaTitleVal] = useState('')
  const [metaDescVal, setMetaDescVal] = useState('')
  const [h1Val, setH1Val] = useState('')
  const [fieldValue, setFieldValue] = useState('')

  // Sequential 4-Step Workflow Completion States
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const [isPushing, setIsPushing] = useState(false)
  const [isPushed, setIsPushed] = useState(false)
  const [pushError, setPushError] = useState(null)

  const [isSyncingData, setIsSyncingData] = useState(false)
  const [isSynced, setIsSynced] = useState(false)
  const [syncError, setSyncError] = useState(null)

  const [isAuditing, setIsAuditing] = useState(false)
  const [isAudited, setIsAudited] = useState(false)
  const [auditError, setAuditError] = useState(null)

  // Determine SEO Element type & pre-fill current text
  const seoType = (() => {
    if (!issue) return 'meta_title'
    const id = (issue.id || '').toLowerCase()
    if (id === 'batch_optimization') return 'batch_optimization'
    const name = (issue.name || issue.label || issue.issueCode || '').toLowerCase()
    if (name.includes('description') || id.includes('desc')) return 'meta_desc'
    if (name.includes('h1') || id.includes('h1')) return 'h1'
    return 'meta_title'
  })()

  const pageKey = page?.id || page?.url

  const [pushedActuals, setPushedActuals] = useState(null)

  // Dynamic Actual live values computed directly from page prop or optimistic post-push/sync state
  const actualMetaTitle = extractSafeString(pushedActuals?.metaTitle ?? page?.actualMetaTitle ?? '')
  const actualMetaDescription = extractSafeString(pushedActuals?.metaDescription ?? page?.actualMetaDescription ?? '')
  const actualH1 = extractSafeString(pushedActuals?.h1 ?? page?.actualH1 ?? '')

  // Pre-fill initial text from page object & reset workflow on open
  useEffect(() => {
    if (!isOpen || !page) return
    setIsSaving(false)
    setIsSaved(false)
    setIsPushing(false)
    setIsPushed(false)
    setIsSyncingData(false)
    setIsSynced(false)
    setIsAuditing(false)
    setIsAudited(false)
    setPushError(null)
    setSyncError(null)
    setAuditError(null)
    setPushedActuals(null)

    const actT = extractSafeString(page.actualMetaTitle || '')
    const actD = extractSafeString(page.actualMetaDescription || '')
    const actH = extractSafeString(page.actualH1 || '')

    const recs = generateSeoRecommendations({
      targetPhrase: extractSafeString(page.targetPhrase || page.target || ''),
      actualMetaTitle: actT,
      actualMetaDescription: actD,
      actualH1: actH,
      pageUrl: page.url || '',
      pageTitle: extractSafeString(page.title || ''),
      siteName: site?.name || '',
    })

    const rawSavedT = page.proposedTitle || page.metaTitle || ''
    const rawSavedD = page.proposedMetaDescription || page.metaDescription || ''
    const rawSavedH = page.proposedH1 || page.h1 || ''

    // Proposed values initially populated with genuine saved overrides or generated recommendations
    const initT = resolveProposedField(extractSafeString(rawSavedT), actT, recs.proposedTitle, site?.name)
    const initD = resolveProposedField(extractSafeString(rawSavedD), actD, recs.proposedMetaDescription, site?.name)
    const initH = resolveProposedField(extractSafeString(rawSavedH), actH, recs.proposedH1, site?.name)

    setMetaTitleVal(initT)
    setMetaDescVal(initD)
    setH1Val(initH)
  }, [isOpen, pageKey])

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !issue || !page) return null

  const handleSave = async () => {
    setIsSaving(true)
    if (onSaveFix) {
      try {
        await onSaveFix({
          page,
          seoType: 'batch_optimization',
          fieldValues: {
            metaTitle: metaTitleVal,
            proposedTitle: metaTitleVal,
            metaDescription: metaDescVal,
            proposedMetaDescription: metaDescVal,
            h1: h1Val,
            proposedH1: h1Val,
          },
        })
        setIsSaved(true)
      } catch (err) {
        console.error('Failed to save fix:', err)
      }
    } else {
      setIsSaved(true)
    }
    setIsSaving(false)
  }

  const handlePushToWordPress = async () => {
    if (!isSaved || isPushing) return
    setIsPushing(true)
    setPushError(null)
    try {
      const res = await updateWordPressSEOFields({
        site,
        page,
        metaTitle: metaTitleVal,
        metaDescription: metaDescVal,
        h1: h1Val,
        targetPhrase: page?.targetPhrase || page?.target || '',
      })
      if (res && res.success) {
        const vTitle = res.verifiedActuals?.metaTitle || metaTitleVal
        const vDesc = res.verifiedActuals?.metaDescription || metaDescVal
        const vH1 = res.verifiedActuals?.h1 || h1Val
        setIsPushed(true)
        setPushError(null)
        setPushedActuals({
          metaTitle: vTitle,
          metaDescription: vDesc,
          h1: vH1,
        })
        if (onSaveFix) {
          await onSaveFix({
            page,
            seoType: 'batch_optimization',
            fieldValues: {
              metaTitle: metaTitleVal,
              proposedTitle: metaTitleVal,
              metaDescription: metaDescVal,
              proposedMetaDescription: metaDescVal,
              h1: h1Val,
              proposedH1: h1Val,
              pushedActualMetaTitle: vTitle,
              pushedActualMetaDescription: vDesc,
              pushedActualH1: vH1,
            }
          })
        }
      } else {
        setPushError(res?.message || 'WordPress verification failed — changes were not applied by WordPress.')
        setIsPushed(false)
      }
    } catch (err) {
      console.error('Failed to push to WordPress:', err)
      setPushError(err.message || 'Push to WordPress failed due to network error.')
      setIsPushed(false)
    }
    setIsPushing(false)
  }

  const handleSyncClick = async () => {
    if (!isPushed || isSyncingData) return
    setIsSyncingData(true)
    setSyncError(null)
    try {
      if (onSyncWebsiteData) {
        const res = await onSyncWebsiteData()
        if (res && (res.success || res.actualMetaTitle || res.actualH1)) {
          const freshActualT = res.actualMetaTitle || metaTitleVal
          const freshActualD = res.actualMetaDescription || metaDescVal
          const freshActualH = res.actualH1 || h1Val
          setPushedActuals({
            metaTitle: freshActualT,
            metaDescription: freshActualD,
            h1: freshActualH,
          })
          setIsSynced(true)
        } else {
          setSyncError(res?.message || 'Failed to sync data from live page.')
        }
      } else {
        setIsSynced(true)
      }
    } catch (err) {
      console.error('Sync error:', err)
      setSyncError(err.message || 'Failed to sync data.')
    }
    setIsSyncingData(false)
  }

  const handleAuditClick = async () => {
    if (!isSynced || isAuditing) return
    setIsAuditing(true)
    setAuditError(null)
    try {
      if (onRerunAudit) {
        const res = await onRerunAudit()
        if (res && res.success === false) {
          setAuditError(res.message || 'Audit failed.')
        } else {
          setIsAudited(true)
        }
      } else {
        setIsAudited(true)
      }
    } catch (err) {
      console.error('Audit error:', err)
      setAuditError(err.message || 'Audit execution error.')
    }
    setIsAuditing(false)
  }

  return (
    <div className="w4-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w4-modal-dialog" onClick={(e) => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="w4-modal-header">
          <div>
            <span className="w4-modal-code">{issue.issueCode || 'W4 OPTIMISATION'}</span>
            <h2 className="w4-modal-title">Optimise Page SEO: {page.title || page.url}</h2>
          </div>
          <button type="button" className="w4-modal-close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div className="w4-modal-body">
          
          {/* LEFT COLUMN: Page Guidance Context */}
          <div className="w4-panel-left">
            <div className="w4-info-group">
              <span className="w4-info-label">Target Page</span>
              <div className="w4-info-value-badge" style={{ wordBreak: 'break-all' }}>{page.url}</div>
            </div>

            <div className="w4-info-group">
              <span className="w4-info-label">Target Keyword / Phrase</span>
              <div className="w4-info-current-box">{page.target || page.targetPhrase || 'Not set'}</div>
            </div>

            <div className="w4-info-group">
              <span className="w4-info-label">Recommended Action</span>
              <div className="w4-info-recom-box">
                Optimise Meta Title (50–60 chars), Meta Description (150–160 chars), and H1 Tag with primary SEO target phrase.
              </div>
            </div>

            <div className="w4-info-group">
              <span className="w4-info-label">Why This Matters</span>
              <p className="w4-info-why-text">
                Optimising Meta Title, Meta Description, and H1 tag together ensures maximum search engine relevance and alignment with your target keyword phrase.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Actual vs Proposed Presentation */}
          <div className="w4-panel-right">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Element 1: Meta Title */}
              <div className="w4-element-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="w4-field-label" style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.85rem' }}>
                    1. Meta Title
                  </label>
                  <span style={{ fontSize: '0.72rem', color: metaTitleVal.length >= 50 && metaTitleVal.length <= 60 ? '#10b981' : (metaTitleVal.length === 0 ? '#94a3b8' : '#f59e0b') }}>
                    {metaTitleVal.length} chars (Target: 50–60)
                  </span>
                </div>

                {/* Actual Meta Title Box (Read-Only) */}
                <div className="w4-actual-box">
                  <span className="w4-actual-tag">ACTUAL (LIVE)</span>
                  <span className={`w4-actual-text ${!actualMetaTitle ? 'blank' : ''}`}>
                    {actualMetaTitle || '[Blank / Not Set]'}
                  </span>
                </div>

                {/* Proposed Meta Title Input (Editable) */}
                <div>
                  <div className="w4-proposed-header">
                    <span className="w4-proposed-label">PROPOSED META TITLE (EDITABLE)</span>
                  </div>
                  <input
                    type="text"
                    className="w4-field-input"
                    value={metaTitleVal}
                    onChange={(e) => setMetaTitleVal(e.target.value)}
                    placeholder="Enter proposed Meta Title..."
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                </div>
              </div>

              {/* Element 2: Meta Description */}
              <div className="w4-element-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="w4-field-label" style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.85rem' }}>
                    2. Meta Description
                  </label>
                  <span style={{ fontSize: '0.72rem', color: metaDescVal.length >= 150 && metaDescVal.length <= 160 ? '#10b981' : (metaDescVal.length === 0 ? '#94a3b8' : '#f59e0b') }}>
                    {metaDescVal.length} chars (Target: 150–160)
                  </span>
                </div>

                {/* Actual Meta Description Box (Read-Only) */}
                <div className="w4-actual-box">
                  <span className="w4-actual-tag">ACTUAL (LIVE)</span>
                  <span className={`w4-actual-text ${!actualMetaDescription ? 'blank' : ''}`}>
                    {actualMetaDescription || '[Blank / Not Set]'}
                  </span>
                </div>

                {/* Proposed Meta Description Textarea (Editable) */}
                <div>
                  <div className="w4-proposed-header">
                    <span className="w4-proposed-label">PROPOSED META DESCRIPTION (EDITABLE)</span>
                  </div>
                  <textarea
                    className="w4-field-textarea"
                    rows={2}
                    value={metaDescVal}
                    onChange={(e) => setMetaDescVal(e.target.value)}
                    placeholder="Enter proposed Meta Description..."
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                </div>
              </div>

              {/* Element 3: H1 Heading Tag */}
              <div className="w4-element-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="w4-field-label" style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.85rem' }}>
                    3. H1 Heading Tag
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {h1Val.length} chars
                  </span>
                </div>

                {/* Actual H1 Tag Box (Read-Only) */}
                <div className="w4-actual-box">
                  <span className="w4-actual-tag">ACTUAL (LIVE)</span>
                  <span className={`w4-actual-text ${!actualH1 ? 'blank' : ''}`}>
                    {actualH1 || '[Blank / Not Set]'}
                  </span>
                </div>

                {/* Proposed H1 Input (Editable) */}
                <div>
                  <div className="w4-proposed-header">
                    <span className="w4-proposed-label">PROPOSED H1 TAG (EDITABLE)</span>
                  </div>
                  <input
                    type="text"
                    className="w4-field-input"
                    value={h1Val}
                    onChange={(e) => setH1Val(e.target.value)}
                    placeholder="Enter proposed H1 Tag..."
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                </div>
              </div>

            </div>

            {/* ── HORIZONTAL 4-STEP WORKFLOW ACTIONS STRIP ── */}
            <div className="w4-workflow-actions-section" style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
              <h4 style={{ color: '#f8fafc', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔄 Next Workflow Actions</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>

                {/* Step 1: Save Changes */}
                <div style={{ background: 'rgba(30,41,59,0.7)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '62px' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.76rem', display: 'block', marginBottom: '2px' }}>1. Save Changes</strong>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', lineHeight: '1.2' }}>Save fields to database</span>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    {isSaved ? (
                      <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.74rem', display: 'block' }}>✓ Saved</span>
                    ) : (
                      <button type="button" className={`w3-btn-emerald ${isSaving ? 'btn-disabled' : ''}`} onClick={handleSave} disabled={isSaving} style={{ padding: '4px 8px', fontSize: '0.74rem', width: '100%' }}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 2: Push Changes to WordPress */}
                <div style={{ background: isSaved ? 'rgba(30,41,59,0.7)' : 'rgba(15,23,42,0.4)', opacity: isSaved ? 1 : 0.5, padding: '6px 8px', borderRadius: '6px', border: pushError ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '62px' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.76rem', display: 'block', marginBottom: '2px' }}>2. Push to WP</strong>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', lineHeight: '1.2' }}>Send fields to live WP page</span>
                  </div>
                  {pushError && (
                    <div style={{ fontSize: '0.66rem', color: '#ef4444', marginTop: '2px', lineHeight: '1.1' }}>
                      ⚠️ {pushError}
                    </div>
                  )}
                  <div style={{ marginTop: '4px' }}>
                    {isPushed ? (
                      <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.74rem', display: 'block' }}>✓ WP Updated</span>
                    ) : (
                      <button
                        type="button"
                        className={`w3-btn-blue ${isPushing ? 'btn-loading' : (!isSaved ? 'btn-disabled' : '')}`}
                        onClick={handlePushToWordPress}
                        disabled={!isSaved || isPushing}
                        style={{ padding: '4px 8px', fontSize: '0.74rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        {isPushing ? (
                          <>
                            <span className="w4-spinner" />
                            <span>Pushing to WP...</span>
                          </>
                        ) : (
                          'Push to WP'
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 3: Sync Website Data */}
                <div style={{ background: isPushed ? 'rgba(30,41,59,0.7)' : 'rgba(15,23,42,0.4)', opacity: isPushed ? 1 : 0.5, padding: '6px 8px', borderRadius: '6px', border: syncError ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '62px' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.76rem', display: 'block', marginBottom: '2px' }}>3. Sync Data</strong>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', lineHeight: '1.2' }}>Pulls the latest live page data from WordPress into Website Manager.</span>
                  </div>
                  {syncError && (
                    <div style={{ fontSize: '0.66rem', color: '#ef4444', marginTop: '2px', lineHeight: '1.1' }}>
                      ⚠️ {syncError}
                    </div>
                  )}
                  <div style={{ marginTop: '4px' }}>
                    {isSynced ? (
                      <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.74rem', display: 'block' }}>✓ Synced</span>
                    ) : (
                      <button
                        type="button"
                        className={`w3-btn-secondary ${isSyncingData ? 'btn-loading' : (!isPushed ? 'btn-disabled' : '')}`}
                        onClick={handleSyncClick}
                        disabled={!isPushed || isSyncingData}
                        title="Pulls the latest live page data from WordPress into Website Manager."
                        style={{ padding: '4px 8px', fontSize: '0.74rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        {isSyncingData ? (
                          <>
                            <span className="w4-spinner" />
                            <span>Syncing...</span>
                          </>
                        ) : (
                          'Sync Data'
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 4: Re-run Audit */}
                <div style={{ background: isSynced ? 'rgba(30,41,59,0.7)' : 'rgba(15,23,42,0.4)', opacity: isSynced ? 1 : 0.5, padding: '6px 8px', borderRadius: '6px', border: auditError ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '62px' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.76rem', display: 'block', marginBottom: '2px' }}>4. Re-run Audit</strong>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', lineHeight: '1.2' }}>Re-checks the page against the latest live and proposed data and updates the audit results.</span>
                  </div>
                  {auditError && (
                    <div style={{ fontSize: '0.66rem', color: '#ef4444', marginTop: '2px', lineHeight: '1.1' }}>
                      ⚠️ {auditError}
                    </div>
                  )}
                  <div style={{ marginTop: '4px' }}>
                    {isAudited ? (
                      <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.74rem', display: 'block' }}>✓ Audit Complete</span>
                    ) : (
                      <button
                        type="button"
                        className={`w3-btn-emerald ${isAuditing ? 'btn-loading' : (!isSynced ? 'btn-disabled' : '')}`}
                        onClick={handleAuditClick}
                        disabled={!isSynced || isAuditing}
                        title="Re-checks the page against the latest live and proposed data and updates the audit results."
                        style={{ padding: '4px 8px', fontSize: '0.74rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        {isAuditing ? (
                          <>
                            <span className="w4-spinner" />
                            <span>Auditing...</span>
                          </>
                        ) : (
                          'Re-run Audit ▷'
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Actions Footer */}
            <div className="w4-modal-actions" style={{ marginTop: '6px', paddingTop: 0 }}>
              <button type="button" className="w3-btn-secondary" onClick={onClose} style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
                {isAudited ? 'Done / Return to Audit' : 'Close Modal'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
