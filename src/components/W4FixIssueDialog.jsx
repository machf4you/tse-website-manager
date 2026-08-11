import { useState, useEffect } from 'react'
import { updateWordPressSEOFields } from '../services/wordpressApi'
import './W4FixIssueDialog.css'

export default function W4FixIssueDialog({
  isOpen,
  issue,
  page,
  site,
  auditElements = [],
  liveAuditData = null,
  onClose,
  onSaveFix,
  onSyncWebsiteData,
  isSyncing = false,
  onRerunAudit,
}) {
  const [isSaving, setIsSaving] = useState(false)

  // Multi-field state for Meta Title, Meta Description, and H1
  const [metaTitleVal, setMetaTitleVal] = useState('')
  const [metaDescVal, setMetaDescVal] = useState('')
  const [h1Val, setH1Val] = useState('')

  // Initial values for diff tracking
  const [initialTitle, setInitialTitle] = useState('')
  const [initialDesc, setInitialDesc] = useState('')
  const [initialH1, setInitialH1] = useState('')

  // Workflow state transitions
  const [isSavedReady, setIsSavedReady] = useState(false)
  const [isPushingWp, setIsPushingWp] = useState(false)
  const [wpPushedReady, setWpPushedReady] = useState(false)
  const [wpPushError, setWpPushError] = useState(null)
  const [syncStarted, setSyncStarted] = useState(false)
  const [syncCompleted, setSyncCompleted] = useState(false)
  const [auditCompleted, setAuditCompleted] = useState(false)

  // Reset workflow state ONLY when opening dialog
  useEffect(() => {
    if (isOpen) {
      setIsSaving(false)
      setIsSavedReady(false)
      setIsPushingWp(false)
      setWpPushedReady(false)
      setWpPushError(null)
      setSyncStarted(false)
      setSyncCompleted(false)
      setAuditCompleted(false)
    }
  }, [isOpen])

  // Populate initial field values when dialog opens
  useEffect(() => {
    if (!isOpen || !page) return

    // Extract values directly from audit table elements if present
    const metaDescFromAudit = auditElements?.find(el => (el.id === 'meta_description' || el.name === 'Meta Description'))?.currentValue
    const cleanAuditDesc = (metaDescFromAudit && metaDescFromAudit !== '—') ? metaDescFromAudit : ''
    const snapDesc = liveAuditData?.page_snapshot?.meta_description || ''

    const metaTitleFromAudit = auditElements?.find(el => (el.id === 'meta_title' || el.name === 'Meta Title'))?.currentValue
    const cleanAuditTitle = (metaTitleFromAudit && metaTitleFromAudit !== '—') ? metaTitleFromAudit : ''
    const snapTitle = liveAuditData?.page_snapshot?.title || ''

    const h1FromAudit = auditElements?.find(el => (el.id === 'h1' || el.name === 'H1'))?.currentValue
    const cleanAuditH1 = (h1FromAudit && h1FromAudit !== '—') ? h1FromAudit : ''
    const snapH1 = Array.isArray(liveAuditData?.page_snapshot?.h1)
      ? liveAuditData?.page_snapshot?.h1[0]
      : (liveAuditData?.page_snapshot?.h1 || '')

    const initT = page.proposedTitle || page.metaTitle || cleanAuditTitle || snapTitle || page.title || ''
    const initD = page.metaDescription || page.meta_description || page.metaDesc || cleanAuditDesc || snapDesc || page.description || page.snippet || ''
    const initH = page.h1 || page.h1_text || cleanAuditH1 || snapH1 || page.title || ''

    setMetaTitleVal(initT)
    setInitialTitle(initT)

    setMetaDescVal(initD)
    setInitialDesc(initD)

    setH1Val(initH)
    setInitialH1(initH)
  }, [isOpen, page?.url, page?.id])

  // Track global isSyncing prop completion
  useEffect(() => {
    if (syncStarted && !isSyncing) {
      setSyncCompleted(true)
    }
  }, [syncStarted, isSyncing])

  if (!isOpen || !page) return null

  // Calculate pending modified fields
  const isTitleModified = metaTitleVal.trim() !== initialTitle.trim()
  const isDescModified = metaDescVal.trim() !== initialDesc.trim()
  const isH1Modified = h1Val.trim() !== initialH1.trim()

  const pendingFields = []
  if (isTitleModified) pendingFields.push('Meta Title')
  if (isDescModified) pendingFields.push('Meta Description')
  if (isH1Modified) pendingFields.push('H1 Tag')

  // Guidance badge helper
  const getGuidanceBadge = (type, value) => {
    const len = value.length
    if (type === 'title') {
      if (len < 50) return { variant: 'warning', text: `${len} characters — Below recommended length (50–60 chars)` }
      if (len > 60) return { variant: 'warning', text: `${len} characters — Longer than recommended (50–60 chars)` }
      return { variant: 'optimal', text: `${len} characters — Optimal` }
    }
    if (type === 'desc') {
      if (len < 150) return { variant: 'warning', text: `${len} characters — Below recommended length (150–160 chars)` }
      if (len > 160) return { variant: 'warning', text: `${len} characters — Longer than recommended (150–160 chars)` }
      return { variant: 'optimal', text: `${len} characters — Optimal` }
    }
    return { variant: 'info', text: `${len} characters` }
  }

  const titleBadge = getGuidanceBadge('title', metaTitleVal)
  const descBadge = getGuidanceBadge('desc', metaDescVal)
  const h1Badge = getGuidanceBadge('h1', h1Val)

  const handleSave = async () => {
    setIsSaving(true)
    setWpPushError(null)
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
      } catch (err) {
        console.error('Failed to save batch optimization:', err)
      }
    }
    setIsSaving(false)
    setIsSavedReady(true)
  }

  const handlePushToWordPress = async () => {
    setIsPushingWp(true)
    setWpPushError(null)
    try {
      const targetWebsiteUrl = site?.url || page?.websiteUrl || ''
      const targetUser = site?.wpUser || site?.connectedUser || ''
      const targetPass = site?.wpPass || ''
      const targetPageId = page?.id || page?.ID

      const res = await updateWordPressSEOFields({
        websiteUrl: targetWebsiteUrl,
        username: targetUser,
        applicationPassword: targetPass,
        pageId: targetPageId,
        postType: page?.post_type || page?.type || 'pages',
        metaTitle: metaTitleVal,
        metaDescription: metaDescVal,
      })

      if (res && res.success) {
        setWpPushedReady(true)
      } else {
        const errorDetail = res?.responseData?.message || res?.error || (res?.status === 401 ? 'Authentication failed (HTTP 401). Please verify Application Password on W1 Site Tile.' : 'WordPress REST update failed.')
        setWpPushError(errorDetail)
      }
    } catch (err) {
      console.error('WordPress push error:', err)
      setWpPushError(err.message || 'Failed to update WordPress REST API.')
    } finally {
      setIsPushingWp(false)
    }
  }

  const handleSyncClick = async () => {
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
    setSyncCompleted(true)
  }

  const handleAuditClick = async () => {
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
    setAuditCompleted(true)
  }

  return (
    <div className="w4-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w4-modal-dialog w4-opt-panel-dialog" onClick={(e) => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="w4-modal-header">
          <div>
            <span className="w4-modal-code">W4 PAGE SEO OPTIMISATION</span>
            <h2 className="w4-modal-title">Page Optimisation: {page.proposedTitle || page.title || page.url}</h2>
          </div>
          <button type="button" className="w4-modal-close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        {/* Single View Panel Body */}
        <div className="w4-opt-panel-body">
          
          {/* PENDING CHANGES SUMMARY BAR */}
          <div className={`w4-pending-summary-bar ${isSavedReady ? 'active' : (pendingFields.length > 0 ? 'active' : 'empty')}`}>
            <div className="w4-summary-left">
              <span className="w4-summary-icon">{isSavedReady ? '🟢' : (pendingFields.length > 0 ? '⚡' : 'ⓘ')}</span>
              <span className="w4-summary-text">
                {isSavedReady
                  ? '✓ Changes Saved — Proceed to Sync & Audit below'
                  : (pendingFields.length > 0
                    ? `Pending Changes (${pendingFields.length}): ${pendingFields.join(', ')}`
                    : 'Pending Changes: None (Edit fields below to stage optimizations)')}
              </span>
            </div>
            <div className="w4-summary-target">
              Target Phrase: <strong>{page.target || page.targetPhrase || 'Not Set'}</strong>
            </div>
          </div>

          {/* STACKED SECTIONS */}
          <div className="w4-stacked-sections-container">

            {/* SECTION 1: META TITLE */}
            <div className={`w4-opt-section-card ${isTitleModified ? 'is-modified' : ''}`}>
              <div className="w4-opt-section-header">
                <div className="w4-opt-section-title-group">
                  <span className="w4-opt-section-num">1</span>
                  <h3 className="w4-opt-section-title">Meta Title</h3>
                  {isTitleModified && <span className="w4-modified-pill">Modified</span>}
                </div>
                <span className={`w4-length-badge ${titleBadge.variant}`}>
                  {titleBadge.text}
                </span>
              </div>

              <div className="w4-opt-section-body">
                <div className="w4-opt-row">
                  <span className="w4-opt-label">Current Audit Value:</span>
                  <div className="w4-opt-current-box">{initialTitle || 'Not Set'}</div>
                </div>

                <div className="w4-opt-row">
                  <label htmlFor="opt-input-title" className="w4-opt-label">Editable Proposed Meta Title:</label>
                  <input
                    id="opt-input-title"
                    type="text"
                    className="w4-field-input"
                    value={metaTitleVal}
                    onChange={(e) => {
                      setMetaTitleVal(e.target.value)
                      setIsSavedReady(false)
                    }}
                    placeholder="Enter proposed Meta Title..."
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: META DESCRIPTION */}
            <div className={`w4-opt-section-card ${isDescModified ? 'is-modified' : ''}`}>
              <div className="w4-opt-section-header">
                <div className="w4-opt-section-title-group">
                  <span className="w4-opt-section-num">2</span>
                  <h3 className="w4-opt-section-title">Meta Description</h3>
                  {isDescModified && <span className="w4-modified-pill">Modified</span>}
                </div>
                <span className={`w4-length-badge ${descBadge.variant}`}>
                  {descBadge.text}
                </span>
              </div>

              <div className="w4-opt-section-body">
                <div className="w4-opt-row">
                  <span className="w4-opt-label">Current Audit Value:</span>
                  <div className="w4-opt-current-box">{initialDesc || 'Not Set'}</div>
                </div>

                <div className="w4-opt-row">
                  <label htmlFor="opt-input-desc" className="w4-opt-label">Editable Proposed Meta Description:</label>
                  <textarea
                    id="opt-input-desc"
                    className="w4-field-textarea"
                    rows={3}
                    value={metaDescVal}
                    onChange={(e) => {
                      setMetaDescVal(e.target.value)
                      setIsSavedReady(false)
                    }}
                    placeholder="Enter proposed Meta Description..."
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: H1 HEADER TAG */}
            <div className={`w4-opt-section-card ${isH1Modified ? 'is-modified' : ''}`}>
              <div className="w4-opt-section-header">
                <div className="w4-opt-section-title-group">
                  <span className="w4-opt-section-num">3</span>
                  <h3 className="w4-opt-section-title">H1 Header Tag</h3>
                  {isH1Modified && <span className="w4-modified-pill">Modified</span>}
                </div>
                <span className={`w4-length-badge ${h1Badge.variant}`}>
                  {h1Badge.text}
                </span>
              </div>

              <div className="w4-opt-section-body">
                <div className="w4-opt-row">
                  <span className="w4-opt-label">Current Audit Value:</span>
                  <div className="w4-opt-current-box">{initialH1 || 'Not Set'}</div>
                </div>

                <div className="w4-opt-row">
                  <label htmlFor="opt-input-h1" className="w4-opt-label">Editable Proposed H1 Tag:</label>
                  <input
                    id="opt-input-h1"
                    type="text"
                    className="w4-field-input"
                    value={h1Val}
                    onChange={(e) => {
                      setH1Val(e.target.value)
                      setIsSavedReady(false)
                    }}
                    placeholder="Enter proposed H1 Tag..."
                  />
                </div>
              </div>
            </div>

          </div>

          {/* WORKFLOW ACTIONS FOOTER */}
          <div className="w4-modal-workflow-footer">
            
            {/* Primary Save Changes Row */}
            <div className="w4-workflow-save-row">
              <button type="button" className="w3-btn-secondary" onClick={onClose}>
                {auditCompleted ? 'Done / Close' : 'Cancel'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isSavedReady && (
                  <span className="w4-saved-indicator">
                    {wpPushedReady ? '✓ WordPress Updated' : '✓ Changes Saved'}
                  </span>
                )}
                <button
                  type="button"
                  className="w3-btn-emerald"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Next Actions Container (Muted/Disabled until previous step completes) */}
            <div className="w4-workflow-next-actions-container">
              <div className="w4-next-actions-header">
                <span className="w4-next-actions-title">Next Workflow Actions:</span>
                {!isSavedReady && (
                  <span className="w4-next-actions-hint">(Save Changes above to enable WordPress Push)</span>
                )}
                {isSavedReady && !wpPushedReady && (
                  <span className="w4-next-actions-hint">(Push Changes to WordPress to enable Sync)</span>
                )}
              </div>

              {wpPushError && (
                <div className="w4-wp-push-error-banner">
                  ⚠️ {wpPushError}
                </div>
              )}

              <div className="w4-next-actions-grid-3">
                
                {/* STEP 1. PUSH CHANGES TO WORDPRESS */}
                <button
                  type="button"
                  className={`w4-action-flow-btn ${wpPushedReady ? 'completed' : (isSavedReady ? 'active-purple' : 'disabled')}`}
                  onClick={handlePushToWordPress}
                  disabled={!isSavedReady || isPushingWp || wpPushedReady}
                >
                  {wpPushedReady ? '✓ WordPress Updated' : (isPushingWp ? 'Pushing to WordPress...' : 'Push Changes to WordPress')}
                </button>

                {/* STEP 2. SYNC WEBSITE DATA */}
                <button
                  type="button"
                  className={`w4-action-flow-btn ${syncCompleted ? 'completed' : (wpPushedReady ? 'active' : 'disabled')}`}
                  onClick={handleSyncClick}
                  disabled={!wpPushedReady || isSyncing || syncCompleted}
                >
                  {syncCompleted ? '🟢 1. Sync Website Data ✓' : (isSyncing ? 'Syncing Website Data...' : '1. Sync Website Data')}
                </button>

                {/* STEP 3. RE-RUN AUDIT */}
                <button
                  type="button"
                  className={`w4-action-flow-btn ${auditCompleted ? 'completed' : (syncCompleted ? 'active' : 'disabled')}`}
                  onClick={handleAuditClick}
                  disabled={!syncCompleted || auditCompleted}
                >
                  {auditCompleted ? '🟢 2. Re-run Audit ✓' : '2. Re-run Audit ▷'}
                </button>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
