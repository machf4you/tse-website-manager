import { useState, useEffect } from 'react'
import { updateWordPressMediaAltText } from '../services/wordpressApi'
import { extractPageImagesApi } from '../services/websiteManagerApi'
import './OptimizeAltTextDialog.css'

const GENERIC_ALT_PATTERNS = [
  /^image\d*$/i,
  /^img\d*$/i,
  /^dsc\d*$/i,
  /^photo\d*$/i,
  /^picture\d*$/i,
  /^logo$/i,
  /^icon$/i,
  /^thumbnail$/i,
  /^placeholder$/i,
  /^untitled$/i,
  /^ascent\d*$/i, // e.g. ascent1, ascent2
  /^\d+_\d+.*$/i, // e.g. 20180211_102751
]

function isAltGenericOrMissing(altText = '') {
  const clean = (altText || '').trim()
  if (!clean) return { isMissing: true, isGeneric: false }
  
  const isGeneric = GENERIC_ALT_PATTERNS.some(pat => pat.test(clean))
  return { isMissing: false, isGeneric }
}

const SPECIFIC_GALLERY_PROPOSALS = {
  'ascent1.jpg': 'Rear House Extension Project with Bi-fold Doors',
  'ascent2.jpg': 'Completed Dormer Loft Conversion Interior with Skylights',
  'ascent3.jpg': 'Open-Plan Kitchen and Living Space Extension',
  'ascent5.jpg': 'Velux Rooflight Loft Conversion Master Bedroom',
  'ascent6.jpg': 'Luxury Ensuite Bathroom in Converted Loft Space',
  'ascent7.jpg': 'Custom Hardwood Staircase Installation for Loft Access',
  'ascent8.jpg': 'Contemporary Loft Conversion Master Bedroom with Fitted Wardrobes',
  'ascent9.jpg': 'Exterior Elevation of High-Specification Dormer Loft Conversion',
}

function generateSmartProposedAlt(src = '', currentAlt = '', targetPhrase = '') {
  const cleanAlt = (currentAlt || '').trim()
  const lowerSrc = src.toLowerCase()

  // Match known portfolio gallery photos if alt is missing or generic
  for (const [filename, proposal] of Object.entries(SPECIFIC_GALLERY_PROPOSALS)) {
    if (lowerSrc.includes(filename.toLowerCase())) {
      return proposal
    }
  }

  // Service specific imagery
  if (lowerSrc.includes('garden-office')) return 'Insulated Bespoke Garden Office Building Installation'
  if (lowerSrc.includes('renovations')) return 'Complete Residential Property Renovation & Refurbishment'
  if (lowerSrc.includes('conservatory')) return 'Contemporary Glass Home Extension and Conservatory'
  if (lowerSrc.includes('loft') || lowerSrc.includes('20180211')) return 'High-Specification Master Bedroom Loft Conversion'
  if (lowerSrc.includes('extension') || lowerSrc.includes('20180111')) return 'Double-Storey Brick House Extension Project'

  if (cleanAlt && !isAltGenericOrMissing(cleanAlt).isGeneric) {
    return cleanAlt
  }

  // Fallback derivation
  try {
    const filename = src.split('/').pop().replace(/\.[^/.]+$/, '').split('-scaled')[0].split(/-\d+x\d+$/)[0]
    const cleanWords = filename
      .replace(/[-_]+/g, ' ')
      .replace(/\b(img|image|dsc|photo|picture|upload|wp|content|uploads)\b/gi, '')
      .replace(/\d+/g, '')
      .trim()

    if (cleanWords && cleanWords.length > 3) {
      return cleanWords.replace(/\b\w/g, l => l.toUpperCase())
    }
  } catch (e) {}

  return targetPhrase ? `${targetPhrase} Project` : 'Ascent Builders Project Image'
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
  const [filterMode, setFilterMode] = useState('missing_generic') // 'missing_generic' | 'all'
  const [imageRows, setImageRows] = useState([])
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  useEffect(() => {
    if (!isOpen) return

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
        const { isMissing, isGeneric } = isAltGenericOrMissing(currentAlt)
        const proposedAlt = (isMissing || isGeneric)
          ? generateSmartProposedAlt(src, currentAlt, targetPhrase)
          : currentAlt

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
          isMissing,
          isGeneric,
          isSelected: isMissing || isGeneric, // preselect missing/generic
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
      alert('Please select at least one image with a valid Alt Text to push.')
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
          message: `Successfully pushed Alt Text for ${result.updatedCount || selected.length} image(s) to WordPress media attachments!`
        })
        if (onSuccess) {
          onSuccess(result)
        }
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setSaveStatus({
          type: 'error',
          message: result.errors?.join('; ') || 'Failed to update Alt Text in WordPress.'
        })
      }
    } catch (err) {
      setSaveStatus({
        type: 'error',
        message: err.message || 'An error occurred during WordPress push.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const missingGenericCount = imageRows.filter(r => r.isMissing || r.isGeneric).length
  const totalCount = imageRows.length
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
              Review and configure descriptive, keyword-aligned alt text for genuine page content imagery.
            </p>
          </div>
          <button type="button" className="oat-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Toolbar with Counter and Selection Actions */}
        <div className="oat-toolbar">
          <div className="oat-toolbar-left">
            <div className="oat-counter-pill">
              <strong style={{ color: '#f8fafc' }}>{totalCount} Content Images</strong>
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>|</span>
              <span style={{ color: missingGenericCount > 0 ? '#f87171' : '#34d399', fontWeight: '600' }}>
                {missingGenericCount} Missing / Generic
              </span>
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
                  <th style={{ width: '28%' }}>Image Filename / URL</th>
                  <th style={{ width: '24%' }}>CURRENT ALT TEXT</th>
                  <th style={{ width: '44%' }}>PROPOSED ALT TEXT</th>
                </tr>
              </thead>
              <tbody>
                {imageRows.map(row => (
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
                      {row.isMissing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className="oat-badge-status missing">🔴 Missing Alt Text</span>
                          <span className="oat-alt-empty">&lt;Empty / Not Set&gt;</span>
                        </div>
                      ) : row.isGeneric ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className="oat-badge-status generic">🟡 Generic Alt Text</span>
                          <span className="oat-current-alt">"{row.currentAlt}"</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className="oat-badge-status configured">🟢 Configured</span>
                          <span className="oat-current-alt">"{row.currentAlt}"</span>
                        </div>
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
          <div className="oat-footer-summary">
            <span>{totalCount} Content Images</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span style={{ color: missingGenericCount > 0 ? '#f87171' : '#34d399', fontWeight: '600' }}>
              {missingGenericCount} Missing / Generic
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
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
    </div>
  )
}
