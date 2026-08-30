import { useState, useEffect } from 'react'
import { generateProposedTargetPhrase, isUtilityPage } from '../utils/targetPhraseGenerator'
import './BulkConfigureTargetPhrasesDialog.css'

export default function BulkConfigureTargetPhrasesDialog({
  isOpen,
  pages = [],
  site,
  onClose,
  onSave
}) {
  const [items, setItems] = useState([])
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    if (!isOpen || !pages || pages.length === 0) return

    const siteName = site?.name || ''
    
    // Filter to active, non-excluded pages that currently have no target phrase
    const unconfigured = pages.filter(p => {
      const tp = (p.targetPhrase || p.target || '').trim()
      const isEx = p.type === 'Excluded' || p.seoPageType === 'Excluded' || p.isExcluded
      return !tp && !isEx && !isUtilityPage(p.url, p.title)
    })

    const initialRows = unconfigured.map(p => {
      const generated = generateProposedTargetPhrase(p, siteName)
      const pageKey = p.id || p.url
      
      // Clean path for display
      let cleanPath = p.url || '/'
      try {
        if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
          cleanPath = new URL(cleanPath).pathname || '/'
        }
      } catch (e) {}

      return {
        pageId: pageKey,
        url: p.url,
        cleanPath,
        title: p.title || p.originalTitle || 'Untitled Page',
        h1: p.h1 || p.actualH1 || '',
        type: p.type || p.seoPageType || 'Topical',
        proposedPhrase: generated,
        isApproved: Boolean(generated && generated.trim().length > 0),
        rawPage: p,
      }
    })

    setItems(initialRows)
  }, [isOpen, pages, site])

  if (!isOpen) return null

  const handlePhraseChange = (pageId, newVal) => {
    setItems(prev => prev.map(item => {
      if (item.pageId === pageId) {
        return { ...item, proposedPhrase: newVal }
      }
      return item
    }))
  }

  const handleToggleApproved = (pageId) => {
    setItems(prev => prev.map(item => {
      if (item.pageId === pageId) {
        return { ...item, isApproved: !item.isApproved }
      }
      return item
    }))
  }

  const handleSelectAll = (selectVal) => {
    setItems(prev => prev.map(item => ({ ...item, isApproved: selectVal })))
  }

  const approvedCount = items.filter(it => it.isApproved && it.proposedPhrase.trim().length > 0).length

  const handleApply = () => {
    const approvedItems = items.filter(it => it.isApproved && it.proposedPhrase.trim().length > 0)
    if (approvedItems.length === 0) {
      alert('No approved target phrases selected. Please approve at least one phrase or cancel.')
      return
    }

    const configsMap = {}
    approvedItems.forEach(it => {
      const pKey = it.pageId
      configsMap[pKey] = {
        ...(it.rawPage || {}),
        pageId: pKey,
        url: it.url,
        targetPhrase: it.proposedPhrase.trim(),
        target: it.proposedPhrase.trim(),
        type: it.type || 'Topical',
        seoPageType: it.type || 'Topical',
        isConfigured: true,
        isManualOverride: Boolean(it.rawPage?.isManualOverride),
        updatedAt: new Date().toISOString()
      }
    })

    onSave(configsMap)
    onClose()
  }

  const filteredItems = items.filter(it => {
    if (filterType === 'approved') return it.isApproved
    if (filterType === 'unapproved') return !it.isApproved
    return true
  })

  return (
    <div className="bctp-overlay" onClick={onClose}>
      <div className="bctp-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bctp-header">
          <div>
            <div className="bctp-badge">W3 | BULK CONFIGURATION</div>
            <h2 className="bctp-title">Configure Target Phrases</h2>
            <p className="bctp-subtitle">
              Review and edit proposed primary target phrases for unconfigured pages before applying.
            </p>
          </div>
          <button type="button" className="bctp-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Toolbar */}
        <div className="bctp-toolbar">
          <div className="bctp-toolbar-left">
            <span className="bctp-count-info">
              Showing <strong>{filteredItems.length}</strong> unconfigured pages ({approvedCount} approved to apply)
            </span>
          </div>
          <div className="bctp-toolbar-right">
            <button
              type="button"
              className="bctp-btn-secondary"
              onClick={() => handleSelectAll(true)}
            >
              Select All
            </button>
            <button
              type="button"
              className="bctp-btn-secondary"
              onClick={() => handleSelectAll(false)}
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="bctp-table-container">
          {filteredItems.length === 0 ? (
            <div className="bctp-empty-state">
              <p>No unconfigured pages found matching this view.</p>
            </div>
          ) : (
            <table className="bctp-table">
              <thead>
                <tr>
                  <th style={{ width: '44px', textAlign: 'center' }}>Approve</th>
                  <th style={{ width: '25%' }}>Page URL & Title</th>
                  <th style={{ width: '10%' }}>Type</th>
                  <th style={{ width: '29%' }}>Detected Signals</th>
                  <th style={{ width: '36%' }}>Proposed Target Phrase</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.pageId} className={item.isApproved ? 'row-approved' : 'row-unapproved'}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className="bctp-checkbox"
                        checked={item.isApproved}
                        onChange={() => handleToggleApproved(item.pageId)}
                      />
                    </td>
                    <td>
                      <div className="bctp-page-title">{item.title}</div>
                      <div className="bctp-page-slug">{item.cleanPath}</div>
                    </td>
                    <td>
                      <span className={`bctp-type-badge type-${item.type.toLowerCase()}`}>
                        {item.type}
                      </span>
                    </td>
                    <td>
                      <div className="bctp-signal-item">
                        <span className="bctp-signal-label">Slug:</span> {item.cleanPath}
                      </div>
                      {item.h1 && (
                        <div className="bctp-signal-item">
                          <span className="bctp-signal-label">H1:</span> {item.h1}
                        </div>
                      )}
                    </td>
                    <td>
                      <input
                        type="text"
                        className="bctp-input-phrase"
                        value={item.proposedPhrase}
                        placeholder="Enter primary target phrase..."
                        onChange={e => handlePhraseChange(item.pageId, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="bctp-footer">
          <button type="button" className="bctp-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bctp-btn-apply"
            disabled={approvedCount === 0}
            onClick={handleApply}
          >
            Apply & Save Selected Target Phrases ({approvedCount}) ▷
          </button>
        </div>

      </div>
    </div>
  )
}
