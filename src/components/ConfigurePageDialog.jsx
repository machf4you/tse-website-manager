import { useState, useEffect } from 'react'
import { extractSafeString } from '../utils/safeString'
import './ConfigurePageDialog.css'

export default function ConfigurePageDialog({ _siteUrl = '', page, onClose, onSave }) {
  const [proposedTitle, setProposedTitle] = useState(() => page ? extractSafeString(page.proposedTitle || page.title) : '')
  const [targetPhrase, setTargetPhrase] = useState(() => page ? extractSafeString(page.targetPhrase || page.target) : '')
  const [secondaryTargetPhrase, setSecondaryTargetPhrase] = useState(() => page ? extractSafeString(page.secondaryTargetPhrase || '') : '')
  const [showSecondary, setShowSecondary] = useState(() => Boolean(page && (page.secondaryTargetPhrase || '').trim()))
  const [pageType, setPageType] = useState(() => page ? (page.type || page.seoPageType || 'Landing') : 'Landing')

  const getPriorityFromType = (typeVal) => {
    if (typeVal === 'Hub' || typeVal === 'Hub Page') return 1
    if (typeVal === 'Landing' || typeVal === 'Landing Page') return 2
    if (typeVal === 'Topical' || typeVal === 'Topical Page') return 3
    if (typeVal === 'Article' || typeVal === 'Article Page') return 4
    return 0
  }

  const [priorityNum, setPriorityNum] = useState(() => getPriorityFromType(pageType))

  useEffect(() => {
    setPriorityNum(getPriorityFromType(pageType))
  }, [pageType])

  useEffect(() => {
    if (page) {
      setProposedTitle(extractSafeString(page.proposedTitle || page.title))
      setTargetPhrase(extractSafeString(page.targetPhrase || page.target))
      const secPhrase = extractSafeString(page.secondaryTargetPhrase || '')
      setSecondaryTargetPhrase(secPhrase)
      if (secPhrase.trim()) setShowSecondary(true)
      setPageType(page.type || page.seoPageType || 'Landing')
    }
  }, [page])

  if (!page) return null

  // Extract page URL path (path portion after root domain)
  const fullUrl = page.url || ''
  let pageUrlPath = '/'
  try {
    if (fullUrl.startsWith('http://') || fullUrl.startsWith('https://')) {
      const parsed = new URL(fullUrl)
      pageUrlPath = parsed.pathname || '/'
    } else {
      pageUrlPath = fullUrl
    }
  } catch (e) {
    console.error('Failed to parse URL path:', e)
    pageUrlPath = fullUrl
  }
  if (!pageUrlPath.startsWith('/')) pageUrlPath = '/' + pageUrlPath

  const originalTitle = extractSafeString(page.originalTitle || page.title) || 'Untitled Page'

  const handleSubmit = (e) => {
    e.preventDefault()

    // Determine normalized type string ('Hub', 'Landing', 'Topical', 'Article', 'Excluded', 'Unclassified')
    let normalizedType = 'Unclassified'
    if (pageType.includes('Hub')) normalizedType = 'Hub'
    else if (pageType.includes('Landing')) normalizedType = 'Landing'
    else if (pageType.includes('Topical')) normalizedType = 'Topical'
    else if (pageType.includes('Article')) normalizedType = 'Article'
    else if (pageType.includes('Excluded')) normalizedType = 'Excluded'

    const initialAutoType = page.autoType || page.type || 'Unclassified'
    const initialType = page.type || page.seoPageType || ''
    const isTypeChanged = Boolean(initialType && normalizedType !== initialType)
    const targetPhraseStr = targetPhrase.trim()
    const secTargetPhraseStr = secondaryTargetPhrase.trim()
    const isConfigured = Boolean(targetPhraseStr.length > 0)

    const updatedConfig = {
      pageId: page.id || page.url,
      url: page.url,
      title: proposedTitle.trim(),
      proposedTitle: proposedTitle.trim(),
      targetPhrase: targetPhraseStr,
      secondaryTargetPhrase: secTargetPhraseStr,
      type: normalizedType,
      seoPageType: normalizedType,
      autoType: initialAutoType,
      isManualOverride: isTypeChanged || Boolean(page.isManualOverride),
      priority: priorityNum,
      isConfigured,
      isStarred: Boolean(page.isStarred),
      isExcluded: normalizedType === 'Excluded',
      status: isConfigured ? 'configured' : 'unconfigured',
      ...(page.metaTitle ? { metaTitle: page.metaTitle } : {}),
      ...(page.metaDescription ? { metaDescription: page.metaDescription } : {}),
      ...(page.h1 ? { h1: page.h1 } : {}),
    }

    if (onSave) {
      onSave(updatedConfig)
    }
    onClose()
  }

  return (
    <div className="cpd-overlay" onClick={onClose}>
      <div
        className="cpd-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cpd-dialog-title"
      >

        {/* Title & Badge Header */}
        <div className="cpd-header">
          <h2 className="cpd-title" id="cpd-dialog-title">Configure Page Targeting</h2>
          <span className="cpd-pill-badge">W3 | PAGE CONFIGURATION</span>
          <p className="cpd-subtitle">
            Set or update the target phrase and title for this page URL path.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="cpd-form">

          {/* 1. Page URL Path */}
          <div className="cpd-field-group">
            <label className="cpd-label">PAGE URL PATH</label>
            <div className="cpd-path-display">{pageUrlPath}</div>
          </div>

          {/* 2. Page Title (Static) */}
          <div className="cpd-field-group">
            <label className="cpd-label">PAGE TITLE</label>
            <div className="cpd-title-display">{originalTitle}</div>
          </div>

          {/* 3. Proposed Page Title (Editable) */}
          <div className="cpd-field-group">
            <label className="cpd-label" htmlFor="cpd-input-proposed-title">
              PROPOSED PAGE TITLE
            </label>
            <input
              type="text"
              id="cpd-input-proposed-title"
              className="cpd-input"
              value={proposedTitle}
              onChange={(e) => setProposedTitle(e.target.value)}
              placeholder="Enter proposed page title..."
            />
          </div>

          {/* 4. Target Phrase */}
          <div className="cpd-field-group">
            <label className="cpd-label" htmlFor="cpd-input-target-phrase">
              TARGET PHRASE
            </label>
            <input
              type="text"
              id="cpd-input-target-phrase"
              className="cpd-input"
              value={targetPhrase}
              onChange={(e) => setTargetPhrase(e.target.value)}
              placeholder="e.g. accessible bathrooms"
            />
          </div>

          {/* 4b. Optional Expandable Secondary Target Phrase */}
          {!showSecondary && !secondaryTargetPhrase.trim() ? (
            <div style={{ marginTop: '-4px', marginBottom: '16px' }}>
              <button
                type="button"
                className="cpd-btn-add-secondary"
                onClick={() => setShowSecondary(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#34d399',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                + Add Secondary Target Phrase (Optional)
              </button>
            </div>
          ) : (
            <div className="cpd-field-group" style={{ marginTop: '-4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="cpd-label" htmlFor="cpd-input-secondary-target-phrase">
                  SECONDARY TARGET PHRASE (OPTIONAL)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSecondaryTargetPhrase('')
                    setShowSecondary(false)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
              <input
                type="text"
                id="cpd-input-secondary-target-phrase"
                className="cpd-input"
                value={secondaryTargetPhrase}
                onChange={(e) => setSecondaryTargetPhrase(e.target.value)}
                placeholder="e.g. wet rooms installation"
              />
            </div>
          )}

          {/* 5. Page Type Dropdown */}
          <div className="cpd-field-group">
            <label className="cpd-label" htmlFor="cpd-select-page-type">
              PAGE TYPE
            </label>
            <select
              id="cpd-select-page-type"
              className="cpd-select"
              value={pageType}
              onChange={(e) => setPageType(e.target.value)}
            >
              <option value="Hub">Hub Page</option>
              <option value="Landing">Landing Page</option>
              <option value="Topical">Topical Page</option>
              <option value="Article">Article</option>
              <option value="Excluded">Excluded Page</option>
            </select>
          </div>

          {/* 6. Priority Field (Auto-filled) */}
          <div className="cpd-field-group">
            <label className="cpd-label">PRIORITY</label>
            <div className="cpd-readonly-box">
              Priority {priorityNum}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="cpd-actions">
            <button
              type="button"
              className="cpd-btn-cancel"
              onClick={onClose}
              id="btn-cpd-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cpd-btn-save"
              id="btn-cpd-save"
            >
              Save Configuration
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
