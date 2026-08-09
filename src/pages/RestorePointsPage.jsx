import { useState } from 'react'
import { getRestorePointIndex } from '../services/restorePointService'
import CreateRestorePointDialog from '../components/CreateRestorePointDialog'
import './RestorePointsPage.css'

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

      {/* Table of Restore Points */}
      <div className="rp-table-wrapper">
        <table className="rp-table" aria-label="Restore Points History">
          <thead>
            <tr>
              <th>Version</th>
              <th>Git Tag</th>
              <th>Commit</th>
              <th>Date</th>
              <th>Title</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {restorePoints.map((item) => {
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
                  <td className="rp-cell-version">
                    <span className="rp-version-badge">{item.version}</span>
                    {item.status === 'Current' && (
                      <span className="rp-current-badge">CURRENT</span>
                    )}
                  </td>
                  <td className="rp-cell-tag">
                    <code>{item.gitTag}</code>
                  </td>
                  <td className="rp-cell-commit">
                    <code>{item.commit}</code>
                  </td>
                  <td className="rp-cell-date">{item.date}</td>
                  <td className="rp-cell-title">{item.title}</td>
                  <td className="rp-cell-desc">{item.description}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

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
