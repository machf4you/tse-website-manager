import { useState, useEffect } from 'react'
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
  const [step, setStep] = useState('edit') // 'edit' | 'saved_confirmation'
  const [isSaving, setIsSaving] = useState(false)

  // Multi-field state for Meta Title, Meta Description, and H1
  const [metaTitleVal, setMetaTitleVal] = useState('')
  const [metaDescVal, setMetaDescVal] = useState('')
  const [h1Val, setH1Val] = useState('')

  // Initial values for diff tracking
  const [initialTitle, setInitialTitle] = useState('')
  const [initialDesc, setInitialDesc] = useState('')
  const [initialH1, setInitialH1] = useState('')

  // Workflow tracking
  const [syncStarted, setSyncStarted] = useState(false)
  const [syncCompleted, setSyncCompleted] = useState(false)
  const [auditCompleted, setAuditCompleted] = useState(false)

  useEffect(() => {
    if (!isOpen || !page) return
    setStep('edit')
    setIsSaving(false)
    setSyncStarted(false)
    setSyncCompleted(false)
    setAuditCompleted(false)

    const initT = page.proposedTitle || page.metaTitle || page.title || ''
    const initD = page.metaDescription || page.meta_description || page.snippet || ''
    const initH = page.h1 || page.h1_text || page.title || ''

    setMetaTitleVal(initT)
    setInitialTitle(initT)

    setMetaDescVal(initD)
    setInitialDesc(initD)

    setH1Val(initH)
    setInitialH1(initH)
  }, [isOpen, page])

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
    setStep('saved_confirmation')
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

        {step === 'edit' ? (
          <div className="w4-opt-panel-body">
            
            {/* PENDING CHANGES SUMMARY BAR */}
            <div className={`w4-pending-summary-bar ${pendingFields.length > 0 ? 'active' : 'empty'}`}>
              <div className="w4-summary-left">
                <span className="w4-summary-icon">{pendingFields.length > 0 ? '⚡' : 'ⓘ'}</span>
                <span className="w4-summary-text">
                  {pendingFields.length > 0
                    ? `Pending Changes (${pendingFields.length}): ${pendingFields.join(', ')}`
                    : 'Pending Changes: None (Edit fields below to stage optimizations)'}
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
                      onChange={(e) => setMetaTitleVal(e.target.value)}
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
                      onChange={(e) => setMetaDescVal(e.target.value)}
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
                      onChange={(e) => setH1Val(e.target.value)}
                      placeholder="Enter proposed H1 Tag..."
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="w4-modal-actions w4-opt-actions">
              <button type="button" className="w3-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="w3-btn-emerald"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving Changes...' : 'Save & Stage Page Optimisations'}
              </button>
            </div>

          </div>
        ) : (
          /* STEP 2: Post-Save Confirmation & Workflow Progress */
          <div className="w4-modal-body-confirmation">
            <div className="w4-confirm-icon-box">
              <span className="w4-confirm-icon">{syncCompleted && auditCompleted ? '🎉' : '🟢'}</span>
            </div>
            <h3 className="w4-confirm-title">
              {syncCompleted && auditCompleted
                ? 'Fix Workflow Completed Successfully!'
                : 'Page Optimisations Staged Successfully'}
            </h3>
            <p className="w4-confirm-text">
              {syncCompleted && auditCompleted
                ? `The page optimisations (${pendingFields.join(', ') || 'All fields'}) have been synced from WordPress and the page audit has passed!`
                : `Proposed changes for ${pendingFields.join(', ') || 'selected fields'} have been saved. Complete the steps below to verify your changes pass the Page Audit:`}
            </p>

            <div className="w4-confirm-steps-grid">
              
              {/* STEP 1 CARD */}
              <div className={`w4-confirm-step-card ${syncCompleted ? 'step-completed' : (isSyncing ? 'step-in-progress' : 'step-pending')}`}>
                <div className="w4-step-status-header">
                  <span className="w4-step-status-icon">
                    {syncCompleted ? '🟢' : (isSyncing ? '⏳' : '🔴')}
                  </span>
                  <span className="w4-step-status-title">
                    Step 1: Sync Website Data {syncCompleted ? '— Complete ✓' : (isSyncing ? '— Syncing...' : '— Pending')}
                  </span>
                </div>
                <div className="w4-step-body">
                  <p>Pull the latest updated content from WordPress.</p>
                  {syncCompleted ? (
                    <span className="w4-step-done-tag">🟢 Complete ✓</span>
                  ) : (
                    <button
                      type="button"
                      className="w3-btn-secondary"
                      onClick={handleSyncClick}
                      disabled={isSyncing}
                    >
                      {isSyncing ? 'Syncing...' : 'Sync Website Data'}
                    </button>
                  )}
                </div>
              </div>

              {/* STEP 2 CARD */}
              <div className={`w4-confirm-step-card ${auditCompleted ? 'step-completed' : (syncCompleted ? 'step-active' : 'step-pending')}`}>
                <div className="w4-step-status-header">
                  <span className="w4-step-status-icon">
                    {auditCompleted ? '🟢' : '🔴'}
                  </span>
                  <span className="w4-step-status-title">
                    Step 2: Re-run Audit {auditCompleted ? '— Complete ✓' : '— Pending'}
                  </span>
                </div>
                <div className="w4-step-body">
                  <p>Re-evaluate the page SEO checks to pass the audit.</p>
                  {auditCompleted ? (
                    <span className="w4-step-done-tag">🟢 Complete ✓</span>
                  ) : (
                    <button
                      type="button"
                      className="w3-btn-emerald"
                      onClick={handleAuditClick}
                      disabled={!syncCompleted}
                      title={!syncCompleted ? 'Complete Step 1 Sync Website Data first' : 'Re-run live page audit'}
                    >
                      Re-run Audit ▷
                    </button>
                  )}
                  {!syncCompleted && (
                    <span className="w4-step-lock-note">(Complete Step 1 sync first)</span>
                  )}
                </div>
              </div>

            </div>

            <div className="w4-confirm-footer">
              <p className="w4-confirm-note">
                {auditCompleted
                  ? '✓ All steps completed. Audit is up to date.'
                  : 'ⓘ Note: The audit will only pass after WordPress data has been synced and the audit re-run.'}
              </p>
              <button
                type="button"
                className={auditCompleted ? 'w3-btn-emerald' : 'w3-btn-secondary'}
                onClick={onClose}
              >
                {auditCompleted ? 'Done / Return to Audit' : 'Close Modal'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
