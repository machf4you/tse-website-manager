import { useState, useEffect } from 'react'
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

  const [syncStarted, setSyncStarted] = useState(false)
  const [isSynced, setIsSynced] = useState(false)

  const [isAudited, setIsAudited] = useState(false)
  const [pushError, setPushError] = useState(null)

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

  // Pre-fill initial text from page object & reset workflow on open
  useEffect(() => {
    if (!isOpen || !page) return
    setIsSaving(false)
    setIsSaved(false)
    setIsPushing(false)
    setIsPushed(false)
    setSyncStarted(false)
    setIsSynced(false)
    setIsAudited(false)
    setPushError(null)

    // Actual live values strictly per field without cross-field fallbacks
    const actT = page.actualMetaTitle || ''
    const actD = page.actualMetaDescription || ''
    const actH = page.actualH1 || ''

    const recs = generateSeoRecommendations({
      targetPhrase: page.targetPhrase || page.target || '',
      actualMetaTitle: actT,
      actualMetaDescription: actD,
      actualH1: actH,
      pageUrl: page.url || '',
      pageTitle: page.title || '',
      siteName: site?.name || '',
    })

    // Proposed values initially populated with genuine saved overrides or generated recommendations
    const initT = resolveProposedField(page.proposedTitle, actT, recs.proposedTitle, site?.name)
    const initD = resolveProposedField(page.proposedMetaDescription, actD, recs.proposedMetaDescription, site?.name)
    const initH = resolveProposedField(page.proposedH1, actH, recs.proposedH1, site?.name)

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

  // Track global isSyncing prop completion
  useEffect(() => {
    if (syncStarted && !isSyncing) {
      setIsSynced(true)
    }
  }, [syncStarted, isSyncing])

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
            metaDescription: metaDescVal,
            h1: h1Val,
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
      })
      if (res && res.success) {
        setIsPushed(true)
        setPushError(null)
      } else {
        setPushError(res?.message || 'WordPress update failed. Please check credentials and server connection.')
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
    if (!isPushed || isSyncing) return
    setSyncStarted(true)
    if (onSyncWebsiteData) {
      try {
        const res = onSyncWebsiteData()
        if (res && typeof res.then === 'function') {
          await res
        }
      } catch (err) {
        console.error('Sync error:', err)
      }
    }
    setIsSynced(true)
  }

  const handleAuditClick = async () => {
    if (!isSynced) return
    if (onRerunAudit) {
      try {
        const res = onRerunAudit()
        if (res && typeof res.then === 'function') {
          await res
        }
      } catch (err) {
        console.error('Audit error:', err)
      }
    }
    setIsAudited(true)
  }

  const actualMetaTitle = page.actualMetaTitle || ''
  const actualMetaDescription = page.actualMetaDescription || ''
  const actualH1 = page.actualH1 || ''

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
                      <button type="button" className={`w3-btn-blue ${!isSaved || isPushing ? 'btn-disabled' : ''}`} onClick={handlePushToWordPress} disabled={!isSaved || isPushing} style={{ padding: '4px 8px', fontSize: '0.74rem', width: '100%' }}>
                        {isPushing ? 'Pushing...' : 'Push to WP'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 3: Sync Website Data */}
                <div style={{ background: isPushed ? 'rgba(30,41,59,0.7)' : 'rgba(15,23,42,0.4)', opacity: isPushed ? 1 : 0.5, padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '62px' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.76rem', display: 'block', marginBottom: '2px' }}>3. Sync Data</strong>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', lineHeight: '1.2' }}>Pull WP data to Manager</span>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    {isSynced ? (
                      <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.74rem', display: 'block' }}>✓ Synced</span>
                    ) : (
                      <button type="button" className={`w3-btn-secondary ${!isPushed || isSyncing ? 'btn-disabled' : ''}`} onClick={handleSyncClick} disabled={!isPushed || isSyncing} style={{ padding: '4px 8px', fontSize: '0.74rem', width: '100%' }}>
                        {isSyncing ? 'Syncing...' : 'Sync Data'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 4: Re-run Audit */}
                <div style={{ background: isSynced ? 'rgba(30,41,59,0.7)' : 'rgba(15,23,42,0.4)', opacity: isSynced ? 1 : 0.5, padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '62px' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.76rem', display: 'block', marginBottom: '2px' }}>4. Re-run Audit</strong>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', lineHeight: '1.2' }}>Re-evaluate page SEO</span>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    {isAudited ? (
                      <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.74rem', display: 'block' }}>✓ Audit Complete</span>
                    ) : (
                      <button type="button" className={`w3-btn-emerald ${!isSynced ? 'btn-disabled' : ''}`} onClick={handleAuditClick} disabled={!isSynced} style={{ padding: '4px 8px', fontSize: '0.74rem', width: '100%' }}>
                        Re-run Audit ▷
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
