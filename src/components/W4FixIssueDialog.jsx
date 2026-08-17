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
  }, [isOpen, pageKey, seoType])

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
    setPushError(null)
    try {
      const res = await updateWordPressSEOFields({
        site,
        page,
        metaTitle: metaTitleVal || fieldValue,
        metaDescription: metaDescVal || fieldValue,
        h1: h1Val || (seoType === 'h1' ? fieldValue : page?.h1),
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <label className="w4-field-label" style={{ fontWeight: '600', color: '#f8fafc' }}>
                      Proposed Meta Title
                    </label>
                    <span style={{ fontSize: '0.74rem', color: metaTitleVal.length >= 50 && metaTitleVal.length <= 60 ? '#10b981' : '#f59e0b' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <label className="w4-field-label" style={{ fontWeight: '600', color: '#f8fafc' }}>
                      Proposed Meta Description
                    </label>
                    <span style={{ fontSize: '0.74rem', color: metaDescVal.length >= 150 && metaDescVal.length <= 160 ? '#10b981' : '#f59e0b' }}>
                      {metaDescVal.length} chars (Target: 150-160)
                    </span>
                  </div>
                  <textarea
                    className="w4-field-textarea"
                    rows={2}
                    value={metaDescVal}
                    onChange={(e) => setMetaDescVal(e.target.value)}
                    placeholder="Enter proposed Meta Description..."
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <label className="w4-field-label" style={{ fontWeight: '600', color: '#f8fafc' }}>
                      Proposed H1 Heading Tag
                    </label>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
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
                    rows={3}
                    value={fieldValue}
                    onChange={(e) => {
                      const val = e.target.value
                      setFieldValue(val)
                      setMetaDescVal(val)
                    }}
                    placeholder={`Enter proposed ${elementDetails.label}...`}
                  />
                ) : (
                  <input
                    type="text"
                    id="w4-fix-input"
                    className="w4-field-input"
                    value={fieldValue}
                    onChange={(e) => {
                      const val = e.target.value
                      setFieldValue(val)
                      if (seoType === 'meta_title') setMetaTitleVal(val)
                      if (seoType === 'h1') setH1Val(val)
                    }}
                    placeholder={`Enter proposed ${elementDetails.label}...`}
                  />
                )}
              </>
            )}

            <div className="w4-guidance-box" style={{ marginTop: '6px' }}>
              <div className="w4-guidance-item">
                <strong>Target Phrase:</strong> <span>{page.target || page.targetPhrase || 'Not set'}</span>
              </div>
              <div className="w4-guidance-item">
                <strong>Page URL:</strong> <code>{page.url}</code>
              </div>
            </div>

            {/* ── HORIZONTAL 4-STEP WORKFLOW ACTIONS STRIP ── */}
            <div className="w4-workflow-actions-section" style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
              <h4 style={{ color: '#f8fafc', fontSize: '0.82rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔄 Next Workflow Actions</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>

                {/* Step 1: Save Changes */}
                <div style={{ background: 'rgba(30,41,59,0.7)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '68px' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.78rem', display: 'block', marginBottom: '2px' }}>1. Save Changes</strong>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', lineHeight: '1.2' }}>Save fields to database</span>
                  </div>
                  <div style={{ marginTop: '6px' }}>
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
                <div style={{ background: isPushing ? 'rgba(59,130,246,0.18)' : (isSaved ? 'rgba(30,41,59,0.7)' : 'rgba(15,23,42,0.4)'), opacity: isSaved || isPushing ? 1 : 0.5, padding: '8px 10px', borderRadius: '6px', border: isPushing ? '1px solid #3b82f6' : (pushError ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)'), display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '68px', transition: 'all 0.2s ease' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.78rem', display: 'block', marginBottom: '2px' }}>2. Push to WP</strong>
                    <span style={{ fontSize: '0.7rem', color: isPushing ? '#93c5fd' : '#94a3b8', display: 'block', lineHeight: '1.2' }}>
                      {isPushing ? '🔄 Pushing fields & purging cache...' : 'Send fields to live WP page'}
                    </span>
                  </div>
                  {pushError && (
                    <div style={{ fontSize: '0.68rem', color: '#ef4444', marginTop: '4px', lineHeight: '1.2' }}>
                      ⚠️ {pushError}
                    </div>
                  )}
                  <div style={{ marginTop: '6px' }}>
                    {isPushed ? (
                      <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.74rem', display: 'block' }}>✓ WP Updated</span>
                    ) : isPushing ? (
                      <button type="button" className="w3-btn-blue btn-disabled" disabled style={{ padding: '4px 8px', fontSize: '0.74rem', width: '100%', backgroundColor: '#2563eb', borderColor: '#3b82f6', color: '#ffffff', opacity: 1, cursor: 'wait', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span className="deploy-spinner" style={{ width: '11px', height: '11px', borderWidth: '2px' }} />
                        <span style={{ fontWeight: '600', color: '#ffffff' }}>Pushing to WP…</span>
                      </button>
                    ) : (
                      <button type="button" className={`w3-btn-blue ${!isSaved ? 'btn-disabled' : ''}`} onClick={handlePushToWordPress} disabled={!isSaved} style={{ padding: '4px 8px', fontSize: '0.74rem', width: '100%' }}>
                        Push to WP
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 3: Sync Website Data */}
                <div style={{ background: isSyncing ? 'rgba(16,185,129,0.18)' : (isPushed ? 'rgba(30,41,59,0.7)' : 'rgba(15,23,42,0.4)'), opacity: isPushed || isSyncing ? 1 : 0.5, padding: '8px 10px', borderRadius: '6px', border: isSyncing ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '68px', transition: 'all 0.2s ease' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.78rem', display: 'block', marginBottom: '2px' }}>3. Sync Data</strong>
                    <span style={{ fontSize: '0.7rem', color: isSyncing ? '#a7f3d0' : '#94a3b8', display: 'block', lineHeight: '1.2' }}>
                      {isSyncing ? '🔄 Pulling fresh WP package...' : 'Pull WP data to Manager'}
                    </span>
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    {isSynced ? (
                      <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.74rem', display: 'block' }}>✓ Synced</span>
                    ) : isSyncing ? (
                      <button type="button" className="w3-btn-secondary btn-disabled" disabled style={{ padding: '4px 8px', fontSize: '0.74rem', width: '100%', backgroundColor: '#059669', borderColor: '#10b981', color: '#ffffff', opacity: 1, cursor: 'wait', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span className="deploy-spinner" style={{ width: '11px', height: '11px', borderWidth: '2px' }} />
                        <span style={{ fontWeight: '600', color: '#ffffff' }}>Syncing Data…</span>
                      </button>
                    ) : (
                      <button type="button" className={`w3-btn-secondary ${!isPushed ? 'btn-disabled' : ''}`} onClick={handleSyncClick} disabled={!isPushed} style={{ padding: '4px 8px', fontSize: '0.74rem', width: '100%' }}>
                        Sync Data
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 4: Re-run Audit */}
                <div style={{ background: isSynced ? 'rgba(30,41,59,0.7)' : 'rgba(15,23,42,0.4)', opacity: isSynced ? 1 : 0.5, padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '68px' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.78rem', display: 'block', marginBottom: '2px' }}>4. Re-run Audit</strong>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', lineHeight: '1.2' }}>Re-evaluate page SEO</span>
                  </div>
                  <div style={{ marginTop: '6px' }}>
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
            <div className="w4-modal-actions" style={{ marginTop: '8px', paddingTop: 0 }}>
              <button type="button" className="w3-btn-secondary" onClick={onClose} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                {isAudited ? 'Done / Return to Audit' : 'Close Modal'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
