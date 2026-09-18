import { useState } from 'react'
import { getRestorePointIndex } from '../services/restorePointService'
import CreateRestorePointDialog from '../components/CreateRestorePointDialog'
import './RestorePointsPage.css'

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function formatDateDisplay(dateStr) {
  if (!dateStr) return '-'
  // DD-MM-YYYY or DD/MM/YYYY
  let m = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
  if (m) {
    const day = parseInt(m[1], 10)
    const month = parseInt(m[2], 10)
    const year = m[3]
    const monthName = MONTHS[month - 1] || 'SEP'
    return `${day} ${monthName} ${year}`
  }
  // YYYY-MM-DD
  m = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (m) {
    const year = m[1]
    const month = parseInt(m[2], 10)
    const day = parseInt(m[3], 10)
    const monthName = MONTHS[month - 1] || 'SEP'
    return `${day} ${monthName} ${year}`
  }
  // DD Month YYYY (e.g. 11 September 2026)
  m = dateStr.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
  if (m) {
    const day = parseInt(m[1], 10)
    const monthWord = m[2].toUpperCase().slice(0, 3)
    const year = m[3]
    return `${day} ${monthWord} ${year}`
  }
  // Month DD, YYYY (e.g. September 7, 2026)
  m = dateStr.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/)
  if (m) {
    const monthWord = m[1].toUpperCase().slice(0, 3)
    const day = parseInt(m[2], 10)
    const year = m[3]
    return `${day} ${monthWord} ${year}`
  }
  return dateStr
}

export default function RestorePointsPage() {
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [restorePoints, setRestorePoints] = useState(() => getRestorePointIndex())

  return (
    <div className="restore-points-container">

      {/* Header & Actions */}
      <div className="rp-header-row">
        <div>
          <h2 className="rp-title">Restore Points</h2>
          <p className="rp-subtitle">
            Permanent restore point history derived from RESTORE-POINT-INDEX.md
          </p>
        </div>
        <button
          type="button"
          className="btn-create-restore-point"
          id="btn-create-restore-point"
          onClick={() => setDialogOpen(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Create Restore Point
        </button>
      </div>

      {/* Application Sections */}
      {(() => {
        const sections = [
          { key: 'Website Manager', title: 'Website Manager', badgeClass: 'badge-wm' },
          { key: 'Website Builder', title: 'Website Builder', badgeClass: 'badge-wb' },
          { key: 'Lead Generator', title: 'Lead Generator', badgeClass: 'badge-lg' },
          { key: 'Site Registry', title: 'Site Registry', badgeClass: 'badge-sr' },
          { key: 'Keyword Research', title: 'Keyword Research', badgeClass: 'badge-kr' },
          { key: 'Auth / Apps Hub', title: 'Auth / Apps Hub', badgeClass: 'badge-auth' }
        ]

        // Also check if any uncategorised items exist
        const uncategorisedItems = restorePoints.filter(
          item => !sections.some(sec => sec.key === item.app)
        )
        if (uncategorisedItems.length > 0) {
          sections.push({ key: 'Uncategorised', title: 'Uncategorised', badgeClass: 'badge-uncategorised' })
        }

        return sections.map((sec) => {
          const items = sec.key === 'Uncategorised'
            ? uncategorisedItems
            : restorePoints.filter(item => item.app === sec.key)

          return (
            <div key={sec.key} className="rp-section-block">
              <div className="rp-section-header">
                <div className="rp-section-title-wrap">
                  <h3 className="rp-section-name">{sec.title}</h3>
                  <span className={`rp-section-badge ${sec.badgeClass}`}>
                    {items.length} {items.length === 1 ? 'Restore Point' : 'Restore Points'}
                  </span>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="rp-empty-section">
                  No active restore points recorded for {sec.title}.
                </div>
              ) : (
                <div className="rp-table-wrapper">
                  <table className="rp-table" aria-label={`${sec.title} Restore Points`}>
                    <thead>
                      <tr>
                        <th className="rp-th-date">DATE</th>
                        <th className="rp-th-version">VERSION</th>
                        <th className="rp-th-title">TITLE</th>
                        <th className="rp-th-desc">DESCRIPTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const isSelected = selectedPoint?.id === item.id
                        return (
                          <tr
                            key={item.id}
                            className={`rp-row ${isSelected ? 'rp-row-selected' : ''}`}
                            onClick={() => setSelectedPoint(item)}
                            tabIndex={0}
                            role="button"
                            aria-pressed={isSelected}
                          >
                            <td className="rp-cell-date">
                              <span className="rp-cell-date-badge">
                                {formatDateDisplay(item.date)}
                              </span>
                            </td>
                            <td className="rp-cell-version-stacked">
                              <div className="rp-ver-line-1">
                                <span className="rp-version-badge">{item.version}</span>
                                {item.status === 'Current' && (
                                  <span className="rp-current-badge">CURRENT</span>
                                )}
                              </div>
                              <div className="rp-ver-line-2">
                                <code title={item.gitTag || '-'}>{item.gitTag || '-'}</code>
                              </div>
                              <div className="rp-ver-line-3">
                                <code title={item.commit || '-'}>{item.commit || '-'}</code>
                              </div>
                            </td>
                            <td className="rp-cell-title-col">
                              <div className="rp-cell-title-text">{item.title}</div>
                            </td>
                            <td className="rp-cell-desc-col">
                              <div className="rp-cell-desc-text">{item.description}</div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })
      })()}

      {/* Create Restore Point Dialog */}
      <CreateRestorePointDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={(updatedList) => setRestorePoints(updatedList)}
      />

      {/* Document View Drawer / Modal */}
      {selectedPoint && (
        <div className="rp-doc-modal-backdrop" onClick={() => setSelectedPoint(null)}>
          <div className="rp-doc-modal" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="rp-doc-header">
              <div>
                <h3 className="rp-doc-title">
                  {selectedPoint.version} — {selectedPoint.title}
                </h3>
                <div className="rp-doc-meta-row">
                  <span className="rp-meta-item">Tag: <code>{selectedPoint.gitTag}</code></span>
                  <span className="rp-meta-item">Commit: <code>{selectedPoint.commit}</code></span>
                  <span className="rp-meta-item">Date: {selectedPoint.date}</span>
                  <span className={`rp-status-tag ${selectedPoint.status === 'Current' ? 'current' : 'superseded'}`}>
                    {selectedPoint.status}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="rp-doc-close"
                onClick={() => setSelectedPoint(null)}
                aria-label="Close detail view"
              >
                ✕
              </button>
            </div>

            {/* Answer Banner: What does restoring this point give me? */}
            <div className="rp-restoration-summary-box">
              <div className="rp-summary-title">💡 What does restoring this point give me?</div>
              <p className="rp-summary-text">
                Restoring to <strong>{selectedPoint.version}</strong> reverts the codebase state to Git tag <code>{selectedPoint.gitTag}</code> (commit <code>{selectedPoint.commit}</code>), delivering: <em>{selectedPoint.description}</em>
              </p>
            </div>

            {/* Document Content Sections */}
            <div className="rp-doc-body">

              {/* Section 1: Purpose */}
              <div className="rp-doc-section">
                <h4 className="rp-section-heading">🎯 Purpose</h4>
                <p className="rp-section-text">
                  {selectedPoint.purpose || selectedPoint.description}
                </p>
              </div>

              {/* Section 2: Verified Working */}
              <div className="rp-doc-section">
                <h4 className="rp-section-heading">✅ Verified Working</h4>
                {Array.isArray(selectedPoint.verifiedWorking) && selectedPoint.verifiedWorking.length > 0 ? (
                  <ul className="rp-section-list">
                    {selectedPoint.verifiedWorking.map((item, idx) => (
                      <li key={idx}>✓ {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="rp-section-text">
                    Verified working state recorded for version <code>{selectedPoint.version}</code>.
                  </p>
                )}
              </div>

              {/* Section 3: Known Outstanding Work */}
              <div className="rp-doc-section">
                <h4 className="rp-section-heading">⏳ Known Outstanding Work</h4>
                {Array.isArray(selectedPoint.outstandingWork) && selectedPoint.outstandingWork.length > 0 ? (
                  <ul className="rp-section-list outstanding">
                    {selectedPoint.outstandingWork.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="rp-section-text text-muted">
                    No open blocking issues reported for this restore point release.
                  </p>
                )}
              </div>

              {/* Section 4: Files Changed */}
              <div className="rp-doc-section">
                <h4 className="rp-section-heading">📁 Files Changed</h4>
                {Array.isArray(selectedPoint.filesChanged) && selectedPoint.filesChanged.length > 0 ? (
                  <div className="rp-files-grid">
                    {selectedPoint.filesChanged.map((file, idx) => (
                      <code key={idx} className="rp-file-tag">{file}</code>
                    ))}
                  </div>
                ) : (
                  <p className="rp-section-text text-muted">
                    Documented in commit <code>{selectedPoint.commit}</code> (tag <code>{selectedPoint.gitTag}</code>).
                  </p>
                )}
              </div>

              {/* Section 5: Notes & File Reference */}
              <div className="rp-doc-section">
                <h4 className="rp-section-heading">📝 Documentation & File Reference</h4>
                <div className="rp-doc-notice">
                  📄 Master restore documentation file: <code>{selectedPoint.docFile}</code>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  )
}
