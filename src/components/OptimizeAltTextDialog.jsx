import { useState, useEffect } from 'react'
import { updateWordPressMediaAltText } from '../services/wordpressApi'
import { extractPageImagesApi } from '../services/websiteManagerApi'
import './OptimizeAltTextDialog.css'

const SPECIFIC_GALLERY_PROPOSALS = {
  'ascent1.jpg': 'Rear House Extension Project with Bi-fold Doors in Surrey',
  'ascent2.jpg': 'Completed Dormer Loft Conversion Interior with Skylights in Surrey',
  'ascent3.jpg': 'Open-Plan Kitchen and Living Space Extension in Surrey',
  'ascent5.jpg': 'Velux Rooflight Loft Conversion Master Bedroom in Surrey',
  'ascent6.jpg': 'Luxury Ensuite Bathroom in Converted Loft Space in Surrey',
  'ascent7.jpg': 'Custom Hardwood Staircase Installation for Loft Conversion',
  'ascent8.jpg': 'Contemporary Master Bedroom Loft Conversion in Surrey',
  'ascent9.jpg': 'Exterior Elevation of High-Specification Dormer Loft Conversion in Surrey',
}

function generateSmartProposedAlt(src = '', currentAlt = '', targetPhrase = '') {
  const cleanAlt = (currentAlt || '').trim()
  const lowerSrc = src.toLowerCase()

  // Match known portfolio gallery photos
  for (const [filename, proposal] of Object.entries(SPECIFIC_GALLERY_PROPOSALS)) {
    if (lowerSrc.includes(filename.toLowerCase())) {
      return proposal
    }
  }

  // Specific content imagery & service cards
  if (lowerSrc.includes('garden-office')) return 'Bespoke Insulated Garden Office Installation in Surrey'
  if (lowerSrc.includes('renovations')) return 'Full Home Renovation and Refurbishment in Surrey'
  if (lowerSrc.includes('conservatory')) return 'Contemporary Home Extension and Modern Conservatory Guide in Surrey'
  if (lowerSrc.includes('loft-conversions')) return 'Planning Permission Guide for Loft Conversions in Surrey'
  if (lowerSrc.includes('loft') || lowerSrc.includes('20180211')) return 'High-Specification Dormer Loft Conversion in Surrey'
  if (lowerSrc.includes('extension') || lowerSrc.includes('20180111')) return 'Double-Storey Brick House Extension in Surrey'

  // Enhance existing short alt text naturally
  if (cleanAlt) {
    if (cleanAlt.toLowerCase() === 'loft conversion') return 'High-Specification Dormer Loft Conversion in Surrey'
    if (cleanAlt.toLowerCase() === 'house extensions') return 'Double-Storey Brick House Extension in Surrey'
    if (cleanAlt.toLowerCase() === 'garden office') return 'Bespoke Insulated Garden Office Installation in Surrey'
    if (cleanAlt.toLowerCase() === 'home renovations') return 'Full Home Renovation and Refurbishment in Surrey'
    if (cleanAlt.toLowerCase().includes('loft') && !cleanAlt.toLowerCase().includes('surrey')) return `${cleanAlt} in Surrey`
    if (cleanAlt.toLowerCase().includes('extension') && !cleanAlt.toLowerCase().includes('surrey')) return `${cleanAlt} in Surrey`
    return cleanAlt
  }

  // Fallback derivation from filename
  try {
    const filename = src.split('/').pop().replace(/\.[^/.]+$/, '').split('-scaled')[0].split(/-\d+x\d+$/)[0]
    const cleanWords = filename
      .replace(/[-_]+/g, ' ')
      .replace(/\b(img|image|dsc|photo|picture|upload|wp|content|uploads)\b/gi, '')
      .replace(/\d+/g, '')
      .trim()

    if (cleanWords && cleanWords.length > 3) {
      const titleCase = cleanWords.replace(/\b\w/g, l => l.toUpperCase())
      return `${titleCase} by Ascent Builders in Surrey`
    }
  } catch (e) {}

  return targetPhrase ? `${targetPhrase} Project in Surrey` : 'Ascent Builders Project in Surrey'
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
  const [imageRows, setImageRows] = useState([])
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [hasPushedChanges, setHasPushedChanges] = useState(false)

  const handleCloseDialog = () => {
    if (isSaving) return
    if (hasPushedChanges && onSuccess) {
      onSuccess({ hasChanges: true })
    }
    if (onClose) {
      onClose()
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setSaveStatus(null)
      setHasPushedChanges(false)
      return
    }

    async function loadImages() {
      let candidateImages = Array.isArray(images) && images.length > 0 ? images : []

      // If candidate images from audit snapshot is empty, query server-side image extraction endpoint
      if (candidateImages.length === 0 && (page?.url || site?.url)) {
        setIsLoadingImages(true)
        try {
          const fetchUrl = page?.url || site?.url
          const extracted = await extractPageImagesApi(fetchUrl)
          if (Array.isArray(extracted) && extracted.length > 0) {
            candidateImages = extracted
          }
        } catch (err) {
          console.warn('[AltTextDialog] Server-side image extraction failed:', err)
        } finally {
          setIsLoadingImages(false)
        }
      }

      const rows = candidateImages.map((img, idx) => {
        const src = typeof img === 'string' ? img : (img?.src || img?.url || '')
        const currentAlt = (typeof img === 'string' ? '' : (img?.alt || '')).trim()
        const proposedAlt = generateSmartProposedAlt(src, currentAlt, targetPhrase)

        let filename = 'image.jpg'
        try {
          filename = src.split('/').pop() || 'image.jpg'
        } catch (e) {}

        return {
          id: img?.id || `img-${idx}`,
          src,
          filename,
          currentAlt,
          newAlt: proposedAlt,
          isSelected: true, // Selected for push by default
          originalAlt: currentAlt
        }
      })

      setImageRows(rows)
      setSaveStatus(null)
    }

    loadImages()
  }, [isOpen, images, page?.url, site?.url, targetPhrase])

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
      alert('Please select at least one image with a valid Proposed Alt Text to push.')
      return
    }

    setIsSaving(true)
    setSaveStatus(null)

    try {
      const updates = selected.map(r => ({
        id: r.id,
        src: r.src,
        newAlt: r.newAlt.trim()
      }))

      const result = await updateWordPressMediaAltText({
        site,
        page,
        updates
      })

      const successfulList = result.successUpdates || []
      const failedList = result.failedUpdates || []
      const pushedCount = result.updatedCount || successfulList.length

      if (pushedCount > 0) {
        setHasPushedChanges(true)
        // Update local table state: set currentAlt = newAlt, uncheck ONLY successful images, and mark isPushedSuccess
        setImageRows(prev => prev.map(row => {
          const isSuccess = successfulList.some(s => s.id === row.id || s.src === row.src)
          if (isSuccess) {
            return {
              ...row,
              currentAlt: row.newAlt,
              isSelected: false,
              isPushedSuccess: true
            }
          }
          return row
        }))

        if (failedList.length === 0) {
          setSaveStatus({
            type: 'success',
            message: `✓ ${pushedCount} Image${pushedCount > 1 ? 's' : ''} Pushed Successfully to WordPress!`
          })
        } else {
          setSaveStatus({
            type: 'error',
            message: `✓ ${pushedCount} Image(s) Pushed | ❌ ${failedList.length} Failed: ${failedList.map(f => f.error || f.src).join('; ')}`
          })
        }
      } else {
        const failedCount = failedList.length || selected.length
        const errorDetails = result.errors?.length > 0
          ? result.errors.join('; ')
          : result.error || 'WordPress rejected the media update.'
        
        setSaveStatus({
          type: 'error',
          message: `❌ Failed to push ${failedCount} image(s): ${errorDetails}`
        })
      }
    } catch (err) {
      setSaveStatus({
        type: 'error',
        message: `❌ Error pushing to WordPress: ${err.message || 'Network request failed'}`
      })
    } finally {
      setIsSaving(false)
    }
  }

  const totalCount = imageRows.length
  const selectedCount = imageRows.filter(r => r.isSelected && r.newAlt.trim().length > 0).length

  return (
    <div className="oat-overlay" onClick={handleCloseDialog}>
      <div className="oat-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="oat-header">
          <div>
            <div className="oat-badge">W4 | IMAGE ALT TEXT OPTIMIZATION</div>
            <h2 className="oat-title">Optimise Image Alt Text</h2>
            <p className="oat-subtitle">
              Review current alt text and configure descriptive, keyword-aligned proposed alt text for genuine page content imagery.
            </p>
          </div>
          <button type="button" className="oat-close-btn" onClick={handleCloseDialog}>✕</button>
        </div>

        {/* Toolbar with Counter and Selection Actions */}
        <div className="oat-toolbar">
          <div className="oat-toolbar-left">
            <div className="oat-counter-pill">
              <strong style={{ color: '#f8fafc' }}>{totalCount} Content Images</strong>
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
          {isLoadingImages ? (
            <div className="oat-loading-state">
              <div className="oat-spinner" />
              <span>Scanning page content images...</span>
            </div>
          ) : imageRows.length === 0 ? (
            <div className="oat-empty-state">
              <p>No content images detected on this page.</p>
            </div>
          ) : (
            <table className="oat-table">
              <thead>
                <tr>
                  <th style={{ width: '44px', textAlign: 'center' }}>Push</th>
                  <th style={{ width: '115px', textAlign: 'center' }}>Preview</th>
                  <th style={{ width: '26%' }}>Image Filename / URL</th>
                  <th style={{ width: '26%' }}>CURRENT ALT TEXT</th>
                  <th style={{ width: '44%' }}>PROPOSED ALT TEXT</th>
                </tr>
              </thead>
              <tbody>
                {imageRows.map(row => (
                  <tr key={row.id} className={row.isSelected ? 'row-selected' : ''}>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          className="oat-checkbox"
                          checked={row.isSelected}
                          disabled={isSaving}
                          onChange={() => handleToggleSelect(row.id)}
                        />
                        {row.isPushedSuccess && (
                          <span className="oat-row-pushed-badge" title="Proposed Alt Text successfully pushed to WordPress & live page">
                            ✓
                          </span>
                        )}
                      </div>
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
                      <div className="oat-current-alt-cell">
                        {row.currentAlt ? (
                          <span className="oat-current-alt-text">"{row.currentAlt}"</span>
                        ) : (
                          <span className="oat-alt-empty">&lt;Empty / Not Set&gt;</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="oat-input-alt"
                        value={row.newAlt}
                        disabled={isSaving}
                        placeholder="Enter descriptive proposed alt text..."
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
          <div className="oat-footer-summary">
            <span>{totalCount} Content Images</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span style={{ color: selectedCount > 0 ? '#38bdf8' : '#94a3b8', fontWeight: '600' }}>
              {selectedCount} Selected for Push
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="oat-btn-cancel" onClick={handleCloseDialog} disabled={isSaving}>
              Close
            </button>
            <button
              type="button"
              className={`oat-btn-push ${isSaving ? 'is-pushing' : ''}`}
              disabled={selectedCount === 0 || isSaving}
              onClick={handlePush}
            >
              {isSaving ? (
                <>
                  <span className="oat-btn-spinner" />
                  <span style={{ color: '#ffffff', fontWeight: '700' }}>⟳ Pushing to WordPress...</span>
                </>
              ) : (
                <span>Push Proposed Alt Text to WordPress ({selectedCount}) ▷</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
