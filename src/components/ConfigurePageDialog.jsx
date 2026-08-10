import { useState, useEffect } from 'react'
import './ConfigurePageDialog.css'

export default function ConfigurePageDialog({ _siteUrl = '', page, onClose, onSave }) {
  const [proposedTitle, setProposedTitle] = useState(() => page ? (page.proposedTitle || page.title || '') : '')
  const [targetPhrase, setTargetPhrase] = useState(() => page ? (page.targetPhrase || page.target || '') : '')
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
      setProposedTitle(page.proposedTitle || page.title || '')
      setTargetPhrase(page.targetPhrase || page.target || '')
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

  const originalTitle = page.originalTitle || page.title || 'Untitled Page'

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
    const targetPhraseStr = targetPhrase.trim()
    const isConfigured = Boolean(targetPhraseStr.length > 0)

    const updatedConfig = {
      pageId: page.id || page.url,
      url: page.url,
      proposedTitle: proposedTitle.trim(),
      targetPhrase: targetPhrase.trim(),
      type: normalizedType,
      seoPageType: normalizedType,
      autoType: initialAutoType,
      isManualOverride: isTypeChanged || Boolean(page.isManualOverride),
      priority: priorityNum,
      isConfigured,
      isExcluded: normalizedType === 'Excluded',
      status: isConfigured ? 'configured' : 'unconfigured',
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
              <option value="Unclassified">Unclassified</option>
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
