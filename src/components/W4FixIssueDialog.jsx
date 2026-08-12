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
  const [metaTitleVal, setMetaTitleVal] = useState('')
  const [metaDescVal, setMetaDescVal] = useState('')
  const [h1Val, setH1Val] = useState('')
  const [fieldValue, setFieldValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [syncStarted, setSyncStarted] = useState(false)
  const [syncCompleted, setSyncCompleted] = useState(false)
  const [auditCompleted, setAuditCompleted] = useState(false)

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

  // Pre-fill initial text from page object
  useEffect(() => {
    if (!isOpen || !page) return
    setStep('edit')
    setIsSaving(false)
    setSyncStarted(false)
    setSyncCompleted(false)
    setAuditCompleted(false)

    const initT = page.metaTitle || page.proposedTitle || page.title || ''
    const initD = page.metaDescription || page.meta_description || page.snippet || ''
    const initH = page.h1 || page.h1_text || page.title || ''

    setMetaTitleVal(initT)
    setMetaDescVal(initD)
    setH1Val(initH)

    if (seoType === 'meta_title') {
      setFieldValue(initT)
    } else if (seoType === 'meta_desc') {
      setFieldValue(initD)
    } else if (seoType === 'h1') {
      setFieldValue(initH)
    }
  }, [isOpen, page, seoType])

  // Track global isSyncing prop completion
  useEffect(() => {
    if (syncStarted && !isSyncing) {
      setSyncCompleted(true)
    }
  }, [syncStarted, isSyncing])

  if (!isOpen || !issue) return null

  // Details per element type
  const elementDetails = {
    batch_optimization: {
      label: 'Batch Page Optimisation',
      why: 'Optimising Meta Title, Meta Description, and H1 tag together ensures maximum SEO relevance and target phrase alignment.',
      recommended: 'Update Meta Title (50-60 chars), Meta Description (150-160 chars), and H1 heading tag.',
      idealLengthMin: 50,
      idealLengthMax: 160,
    },
    meta_title: {
      label: 'Meta Title',
      why: 'The Meta Title is the primary on-page SEO ranking signal in Google search results and defines the clickable headline in search engine snippets.',
      recommended: issue.recommendation || 'Include the target phrase near the beginning of the title and keep length between 50–60 characters.',
      idealLengthMin: 50,
      idealLengthMax: 60,
    },
    meta_desc: {
      label: 'Meta Description',
      why: 'The Meta Description drives organic click-through rates (CTR) in Google search snippets and provides crucial context to search crawlers.',
      recommended: issue.recommendation || 'Include target phrase naturally and aim for 150–160 characters to avoid snippet truncation.',
      idealLengthMin: 150,
      idealLengthMax: 160,
    },
    h1: {
      label: 'H1 Header Tag',
      why: 'The H1 tag establishes the main topic hierarchy for search crawlers and site visitors. Every page should have exactly one descriptive H1.',
      recommended: issue.recommendation || 'Ensure the H1 header clearly communicates the primary topic and includes the target phrase.',
      idealLengthMin: 20,
      idealLengthMax: 70,
    },
  }[seoType] || {
    label: 'SEO Optimisation',
    why: 'On-page SEO optimization improves search visibility.',
    recommended: 'Update page SEO fields.',
    idealLengthMin: 10,
    idealLengthMax: 160,
  }

  const charCount = fieldValue.length
  const minLen = elementDetails.idealLengthMin
  const maxLen = elementDetails.idealLengthMax

  let lengthBadgeVariant = 'optimal'
  let lengthBadgeText = `${charCount} characters — Optimal`

  if (seoType !== 'h1' && seoType !== 'batch_optimization') {
    if (charCount < minLen) {
      lengthBadgeVariant = 'warning'
      lengthBadgeText = `${charCount} characters — Below recommended length`
    } else if (charCount > maxLen) {
      lengthBadgeVariant = 'warning'
      lengthBadgeText = `${charCount} characters — Longer than recommended`
    } else {
      lengthBadgeVariant = 'optimal'
      lengthBadgeText = `${charCount} characters — Optimal`
    }
  } else {
    lengthBadgeVariant = 'info'
    lengthBadgeText = `${charCount} characters`
  }

  const handleSave = async () => {
    setIsSaving(true)
    if (onSaveFix) {
      try {
        if (seoType === 'batch_optimization') {
          await onSaveFix({
            page,
            seoType: 'batch_optimization',
            fieldValues: {
              metaTitle: metaTitleVal,
              metaDescription: metaDescVal,
              h1: h1Val,
            },
          })
        } else {
          await onSaveFix({ page, seoType, fieldValue })
        }
      } catch (err) {
        console.error('Failed to save fix:', err)
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
      <div className="w4-modal-dialog" onClick={(e) => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="w4-modal-header">
          <div>
            <span className="w4-modal-code">{issue.issueCode || 'W4 OPTIMISATION'}</span>
            <h2 className="w4-modal-title">Page Optimisation: {page.title || page.url}</h2>
          </div>
          <button type="button" className="w4-modal-close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        {step === 'edit' ? (
          <div className="w4-modal-body">
            
            {/* LEFT COLUMN: Issue Details */}
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
                <div className="w4-info-recom-box">{elementDetails.recommended}</div>
              </div>

              <div className="w4-info-group">
                <span className="w4-info-label">Why This Matters</span>
                <p className="w4-info-why-text">{elementDetails.why}</p>
              </div>
            </div>

            {/* RIGHT COLUMN: Editable WordPress Fields */}
            <div className="w4-panel-right">
              {seoType === 'batch_optimization' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label className="w4-field-label" style={{ fontWeight: '600', color: '#f8fafc' }}>
                        Proposed Meta Title
                      </label>
                      <span style={{ fontSize: '0.78rem', color: metaTitleVal.length >= 50 && metaTitleVal.length <= 60 ? '#10b981' : '#f59e0b' }}>
                        {metaTitleVal.length} chars (Target: 50-60)
                      </span>
                    </div>
                    <input
                      type="text"
                      className="w4-field-input"
                      value={metaTitleVal}
                      onChange={(e) => setMetaTitleVal(e.target.value)}
                      placeholder="Enter proposed Meta Title..."
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label className="w4-field-label" style={{ fontWeight: '600', color: '#f8fafc' }}>
                        Proposed Meta Description
                      </label>
                      <span style={{ fontSize: '0.78rem', color: metaDescVal.length >= 150 && metaDescVal.length <= 160 ? '#10b981' : '#f59e0b' }}>
                        {metaDescVal.length} chars (Target: 150-160)
                      </span>
                    </div>
                    <textarea
                      className="w4-field-textarea"
                      rows={4}
                      value={metaDescVal}
                      onChange={(e) => setMetaDescVal(e.target.value)}
                      placeholder="Enter proposed Meta Description..."
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label className="w4-field-label" style={{ fontWeight: '600', color: '#f8fafc' }}>
                        Proposed H1 Heading Tag
                      </label>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {h1Val.length} chars
                      </span>
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
              ) : (
                <>
                  <div className="w4-field-header">
                    <label htmlFor="w4-fix-input" className="w4-field-label">
                      Editable WordPress {elementDetails.label}
                    </label>
                    <span className={`w4-length-badge ${lengthBadgeVariant}`}>
                      {lengthBadgeText}
                    </span>
                  </div>

                  {seoType === 'meta_desc' ? (
                    <textarea
                      id="w4-fix-input"
                      className="w4-field-textarea"
                      rows={6}
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      placeholder={`Enter proposed ${elementDetails.label}...`}
                    />
                  ) : (
                    <input
                      type="text"
                      id="w4-fix-input"
                      className="w4-field-input"
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      placeholder={`Enter proposed ${elementDetails.label}...`}
                    />
                  )}
                </>
              )}

              <div className="w4-guidance-box" style={{ marginTop: '16px' }}>
                <div className="w4-guidance-item">
                  <strong>Target Phrase:</strong> <span>{page.target || page.targetPhrase || 'Not set'}</span>
                </div>
                <div className="w4-guidance-item">
                  <strong>Page URL:</strong> <code>{page.url}</code>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="w4-modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="w3-btn-secondary" onClick={onClose}>
                  Cancel
                </button>
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
                : 'WordPress Field Staged Successfully'}
            </h3>
            <p className="w4-confirm-text">
              {syncCompleted && auditCompleted
                ? `The updated ${elementDetails.label} has been synced from WordPress and the page audit has passed!`
                : `The updated ${elementDetails.label} has been saved. Complete the steps below to verify your changes pass the Page Audit:`}
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
