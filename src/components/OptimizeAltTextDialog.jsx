import { useState, useEffect } from 'react'
import { updateWordPressMediaAltText } from '../services/wordpressApi'
import './OptimizeAltTextDialog.css'

function generateProposedAlt(src = '', targetPhrase = '') {
  if (!src) return targetPhrase || ''
  try {
    const filename = src.split('/').pop().replace(/\.[^/.]+$/, '').split('-scaled')[0].split(/-\d+x\d+$/)[0]
    const cleanWords = filename
      .replace(/[-_]+/g, ' ')
      .replace(/\b(img|image|dsc|photo|picture|upload|wp|content|uploads)\b/gi, '')
      .replace(/\d+/g, '')
      .trim()

    if (cleanWords && cleanWords.length > 3) {
      // Capitalize first letter of each word
      const formatted = cleanWords.replace(/\b\w/g, l => l.toUpperCase())
      if (targetPhrase && !formatted.toLowerCase().includes(targetPhrase.toLowerCase())) {
        return `${formatted} - ${targetPhrase}`
      }
      return formatted
    }
  } catch (e) {}

  return targetPhrase || 'Descriptive page image'
}

export default function OptimizeAltTextDialog({
  isOpen,
  page,
  site,
  targetPhrase = '',
  images = [],
  onClose,
  onSuccess
}) {
  const [filterMode, setFilterMode] = useState('missing') // 'missing' | 'all'
  const [imageRows, setImageRows] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  useEffect(() => {
    if (!isOpen || !images) return

    const initialRows = images.map((img, idx) => {
      const src = typeof img === 'string' ? img : (img?.src || img?.url || '')
      const currentAlt = (typeof img === 'string' ? '' : (img?.alt || '')).trim()
      const proposed = currentAlt ? currentAlt : generateProposedAlt(src, targetPhrase)
      const isMissing = !currentAlt

      // Extract simple basename for display
      let filename = 'image.jpg'
      try {
        filename = src.split('/').pop() || 'image.jpg'
      } catch (e) {}

      return {
        id: img?.id || `img-${idx}`,
        src,
        filename,
        currentAlt,
        newAlt: proposed,
        isMissing,
        isSelected: isMissing, // default select missing ones
      }
    })

    setImageRows(initialRows)
    setSaveStatus(null)
  }, [isOpen, images, targetPhrase])

  if (!isOpen) return null

  const handleAltChange = (id, val) => {
    setImageRows(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, newAlt: val, isSelected: true }
      }
      return row
    }))
  }

  const handleToggleSelect = (id) => {
    setImageRows(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, isSelected: !row.isSelected }
      }
      return row
    }))
  }

  const handleSelectAll = (selectVal) => {
    setImageRows(prev => prev.map(row => ({ ...row, isSelected: selectVal })))
  }

  const handlePush = async () => {
    const selected = imageRows.filter(r => r.isSelected && r.newAlt.trim().length > 0)
    if (selected.length === 0) {
      alert('Please select at least one image with valid Alt Text to push.')
      return
    }

    setIsSaving(true)
    setSaveStatus(null)

    try {
      const updates = selected.map(r => ({
        src: r.src,
        newAlt: r.newAlt.trim()
      }))

      const result = await updateWordPressMediaAltText({
        site,
        page,
        updates
      })

      if (result.success) {
        setSaveStatus({
          type: 'success',
          message: `Successfully pushed Alt Text for ${result.updatedCount || selected.length} image(s) to WordPress!`
        })
        if (onSuccess) {
          onSuccess(result)
        }
        setTimeout(() => {
          onClose()
        }, 1200)
      } else {
        setSaveStatus({
          type: 'error',
          message: result.errors?.join('; ') || 'Failed to update Alt Text in WordPress.'
        })
      }
    } catch (err) {
      setSaveStatus({
        type: 'error',
        message: err.message || 'An unexpected error occurred during WordPress push.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const displayedRows = imageRows.filter(row => {
    if (filterMode === 'missing') return row.isMissing
    return true
  })

  const missingCount = imageRows.filter(r => r.isMissing).length
  const selectedCount = imageRows.filter(r => r.isSelected && r.newAlt.trim().length > 0).length

  return (
    <div className="oat-overlay" onClick={onClose}>
      <div className="oat-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="oat-header">
          <div>
            <div className="oat-badge">W4 | IMAGE ALT TEXT OPTIMIZATION</div>
            <h2 className="oat-title">Optimise Image Alt Text</h2>
            <p className="oat-subtitle">
              Review and set descriptive, keyword-aligned alt text for images on this page, then push directly to WordPress.
            </p>
          </div>
          <button type="button" className="oat-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Toolbar & Filters */}
        <div className="oat-toolbar">
          <div className="oat-toolbar-left">
            <div className="oat-filter-group">
              <button
                type="button"
                className={`oat-filter-btn ${filterMode === 'missing' ? 'active' : ''}`}
                onClick={() => setFilterMode('missing')}
              >
                Missing Alt Text Only ({missingCount})
              </button>
              <button
                type="button"
                className={`oat-filter-btn ${filterMode === 'all' ? 'active' : ''}`}
                onClick={() => setFilterMode('all')}
              >
                All Images ({imageRows.length})
              </button>
            </div>
          </div>
          <div className="oat-toolbar-right">
            <button
              type="button"
              className="oat-btn-secondary"
              onClick={() => handleSelectAll(true)}
            >
              Select All
            </button>
            <button
              type="button"
              className="oat-btn-secondary"
              onClick={() => handleSelectAll(false)}
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Status Message */}
        {saveStatus && (
          <div className={`oat-status-alert ${saveStatus.type}`}>
            {saveStatus.type === 'success' ? '✅ ' : '❌ '}
            {saveStatus.message}
          </div>
        )}

        {/* Table Content */}
        <div className="oat-table-container">
          {displayedRows.length === 0 ? (
            <div className="oat-empty-state">
              <p>
                {filterMode === 'missing'
                  ? 'All images on this page have Alt Text configured!'
                  : 'No images detected on this page.'}
              </p>
            </div>
          ) : (
            <table className="oat-table">
              <thead>
                <tr>
                  <th style={{ width: '44px', textAlign: 'center' }}>Push</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Preview</th>
                  <th style={{ width: '28%' }}>Image Filename / URL</th>
                  <th style={{ width: '22%' }}>Current Alt Text</th>
                  <th style={{ width: '42%' }}>New Alt Text</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map(row => (
                  <tr key={row.id} className={row.isSelected ? 'row-selected' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className="oat-checkbox"
                        checked={row.isSelected}
                        onChange={() => handleToggleSelect(row.id)}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="oat-thumb-wrapper">
                        <img
                          src={row.src}
                          alt=""
                          className="oat-thumb-img"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.style.display = 'none'
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="oat-filename">{row.filename}</div>
                      <div className="oat-filepath" title={row.src}>{row.src}</div>
                    </td>
                    <td>
                      {row.currentAlt ? (
                        <div className="oat-current-alt">{row.currentAlt}</div>
                      ) : (
                        <span className="oat-blank-badge">&lt;Blank / Missing&gt;</span>
                      )}
                    </td>
                    <td>
                      <input
                        type="text"
                        className="oat-input-alt"
                        value={row.newAlt}
                        placeholder="Enter descriptive alt text..."
                        onChange={e => handleAltChange(row.id, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="oat-footer">
          <button type="button" className="oat-btn-cancel" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button
            type="button"
            className="oat-btn-push"
            disabled={selectedCount === 0 || isSaving}
            onClick={handlePush}
          >
            {isSaving ? 'Pushing to WordPress...' : `Push Alt Text to WordPress (${selectedCount}) ▷`}
          </button>
        </div>

      </div>
    </div>
  )
}
