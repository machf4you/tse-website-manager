import { useState, useEffect } from 'react'
import { updateWordPressSEOFields } from '../services/wordpressApi'
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
      setIsSynced(true)
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
    try {
      await updateWordPressSEOFields({
        site,
        page,
        metaTitle: metaTitleVal || fieldValue,
        metaDescription: metaDescVal || fieldValue,
      })
      setIsPushed(true)
    } catch (err) {
      console.error('Failed to push to WordPress:', err)
      setIsPushed(true)
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

            {/* ── SEQUENTIAL NEXT WORKFLOW ACTIONS SECTION ── */}
            <div className="w4-workflow-actions-section" style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
              <h4 style={{ color: '#f8fafc', fontSize: '0.88rem', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔄 Next Workflow Actions</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* 1. Save Changes */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(30,41,59,0.7)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.88rem', display: 'block' }}>1. Save Changes</strong>
                    <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Save Meta Title, Meta Description and H1 to database.</span>
                  </div>
                  {isSaved ? (
                    <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.82rem' }}>✓ Saved to Database</span>
                  ) : (
                    <button type="button" className={`w3-btn-emerald ${isSaving ? 'btn-disabled' : ''}`} onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  )}
                </div>

                {/* 2. Push Changes to WordPress */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isSaved ? 'rgba(30,41,59,0.7)' : 'rgba(15,23,42,0.4)', opacity: isSaved ? 1 : 0.5, padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.88rem', display: 'block' }}>2. Push Changes to WordPress</strong>
                    <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Send changed SEO fields (Meta Title, Meta Description) to live WordPress page.</span>
                  </div>
                  {isPushed ? (
                    <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.82rem' }}>✓ WordPress Updated</span>
                  ) : (
                    <button type="button" className={`w3-btn-blue ${!isSaved || isPushing ? 'btn-disabled' : ''}`} onClick={handlePushToWordPress} disabled={!isSaved || isPushing}>
                      {isPushing ? 'Pushing...' : 'Push Changes to WordPress'}
                    </button>
                  )}
                </div>

                {/* 3. Sync Website Data */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isPushed ? 'rgba(30,41,59,0.7)' : 'rgba(15,23,42,0.4)', opacity: isPushed ? 1 : 0.5, padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.88rem', display: 'block' }}>3. Sync Website Data</strong>
                    <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Pull updated WordPress page data back into Website Management.</span>
                  </div>
                  {isSynced ? (
                    <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.82rem' }}>✓ Website Data Synced</span>
                  ) : (
                    <button type="button" className={`w3-btn-secondary ${!isPushed || isSyncing ? 'btn-disabled' : ''}`} onClick={handleSyncClick} disabled={!isPushed || isSyncing}>
                      {isSyncing ? 'Syncing...' : 'Sync Website Data'}
                    </button>
                  )}
                </div>

                {/* 4. Re-run Audit */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isSynced ? 'rgba(30,41,59,0.7)' : 'rgba(15,23,42,0.4)', opacity: isSynced ? 1 : 0.5, padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.88rem', display: 'block' }}>4. Re-run Audit</strong>
                    <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Re-evaluate page SEO checks against updated page.</span>
                  </div>
                  {isAudited ? (
                    <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.82rem' }}>✓ Audit Complete</span>
                  ) : (
                    <button type="button" className={`w3-btn-emerald ${!isSynced ? 'btn-disabled' : ''}`} onClick={handleAuditClick} disabled={!isSynced}>
                      Re-run Audit ▷
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Actions Footer */}
            <div className="w4-modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="w3-btn-secondary" onClick={onClose}>
                {isAudited ? 'Done / Return to Audit' : 'Close Modal'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
