import { useState, useEffect } from 'react'
import './W4FixIssueDialog.css'

export default function W4FixIssueDialog({
  isOpen,
  issue,
  page,
  site,
  onClose,
  onSyncWebsiteData,
  onRerunAudit,
}) {
  const [step, setStep] = useState('edit') // 'edit' | 'saved_confirmation'
  const [fieldValue, setFieldValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Determine SEO Element type & pre-fill current text
  const seoType = (() => {
    if (!issue) return 'meta_title'
    const name = (issue.name || issue.label || issue.issueCode || '').toLowerCase()
    const id = (issue.id || '').toLowerCase()
    if (name.includes('description') || id.includes('desc')) return 'meta_desc'
    if (name.includes('h1') || id.includes('h1')) return 'h1'
    return 'meta_title'
  })()

  // Pre-fill initial text from page object
  useEffect(() => {
    if (!isOpen || !page) return
    setStep('edit')
    setIsSaving(false)

    if (seoType === 'meta_title') {
      setFieldValue(page.proposedTitle || page.metaTitle || page.title || '')
    } else if (seoType === 'meta_desc') {
      setFieldValue(page.metaDescription || page.meta_description || page.snippet || '')
    } else if (seoType === 'h1') {
      setFieldValue(page.h1 || page.h1_text || page.title || '')
    }
  }, [isOpen, page, seoType])

  if (!isOpen || !issue) return null

  // Details per element type
  const elementDetails = {
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
  }[seoType]

  const charCount = fieldValue.length
  const minLen = elementDetails.idealLengthMin
  const maxLen = elementDetails.idealLengthMax

  let lengthBadgeVariant = 'optimal'
  let lengthBadgeText = 'Optimal Length'

  if (seoType !== 'h1') {
    if (charCount < minLen) {
      lengthBadgeVariant = 'warning'
      lengthBadgeText = `Too Short (${charCount}/${minLen} min)`
    } else if (charCount > maxLen) {
      lengthBadgeVariant = 'error'
      lengthBadgeText = `Too Long (${charCount}/${maxLen} max)`
    } else {
      lengthBadgeVariant = 'optimal'
      lengthBadgeText = `Optimal (${charCount}/${maxLen} chars)`
    }
  }

  const handleSave = () => {
    setIsSaving(true)
    // Simulated template workflow step
    setTimeout(() => {
      setIsSaving(false)
      setStep('saved_confirmation')
    }, 400)
  }

  return (
    <div className="w4-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w4-modal-dialog" onClick={(e) => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="w4-modal-header">
          <div>
            <span className="w4-modal-code">{issue.issueCode || 'W4 AUDIT FIX'}</span>
            <h2 className="w4-modal-title">Fix Issue: {elementDetails.label}</h2>
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
                <span className="w4-info-label">SEO Element</span>
                <div className="w4-info-value-badge">{elementDetails.label}</div>
              </div>

              <div className="w4-info-group">
                <span className="w4-info-label">Current Audit Value</span>
                <div className="w4-info-current-box">{issue.currentValue || page[seoType] || 'Not Set'}</div>
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

            {/* RIGHT COLUMN: Editable WordPress Field */}
            <div className="w4-panel-right">
              <div className="w4-field-header">
                <label htmlFor="w4-fix-input" className="w4-field-label">
                  Editable WordPress {elementDetails.label}
                </label>
                {seoType !== 'h1' && (
                  <span className={`w4-length-badge ${lengthBadgeVariant}`}>
                    {lengthBadgeText}
                  </span>
                )}
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

              <div className="w4-guidance-box">
                <div className="w4-guidance-item">
                  <strong>Target Phrase:</strong> <span>{page.target || page.targetPhrase || 'Not set'}</span>
                </div>
                <div className="w4-guidance-item">
                  <strong>Page URL:</strong> <code>{page.url}</code>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="w4-modal-actions">
                <button type="button" className="w3-btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="w3-btn-emerald"
                  onClick={handleSave}
                  disabled={isSaving || !fieldValue.trim()}
                >
                  {isSaving ? 'Saving...' : 'Save / Update WordPress'}
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* STEP 2: Post-Save Confirmation / Instructions */
          <div className="w4-modal-body-confirmation">
            <div className="w4-confirm-icon-box">
              <span className="w4-confirm-icon">🟢</span>
            </div>
            <h3 className="w4-confirm-title">WordPress Field Staged Successfully</h3>
            <p className="w4-confirm-text">
              The updated <strong>{elementDetails.label}</strong> has been saved. To complete the workflow and verify that the Page Audit passes, follow these two steps:
            </p>

            <div className="w4-confirm-steps-grid">
              <div className="w4-confirm-step-card">
                <div className="w4-step-badge">1</div>
                <div className="w4-step-body">
                  <strong>Sync Website Data</strong>
                  <p>Pull the latest updated content from WordPress.</p>
                  <button
                    type="button"
                    className="w3-btn-secondary"
                    onClick={() => {
                      if (onSyncWebsiteData) onSyncWebsiteData()
                    }}
                  >
                    Sync Website Data
                  </button>
                </div>
              </div>

              <div className="w4-confirm-step-card">
                <div className="w4-step-badge">2</div>
                <div className="w4-step-body">
                  <strong>Re-run Audit</strong>
                  <p>Re-evaluate the page SEO checks to pass the audit.</p>
                  <button
                    type="button"
                    className="w3-btn-emerald"
                    onClick={() => {
                      if (onRerunAudit) onRerunAudit()
                      onClose()
                    }}
                  >
                    Re-run Audit ▷
                  </button>
                </div>
              </div>
            </div>

            <div className="w4-confirm-footer">
              <p className="w4-confirm-note">
                ⓘ Note: The audit will only pass after WordPress data has been synced and the audit re-run.
              </p>
              <button type="button" className="w3-btn-secondary" onClick={onClose}>
                Done / Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
