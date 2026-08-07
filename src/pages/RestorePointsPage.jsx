import { useState } from 'react'
import { restorePointIndexData } from '../data/restorePointData'
import './RestorePointsPage.css'

export default function RestorePointsPage() {
  const [selectedPoint, setSelectedPoint] = useState(null)

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
          onClick={() => {}}
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
            {restorePointIndexData.map((item) => {
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

      {/* Document View Drawer / Modal Placeholder */}
      {selectedPoint && (
        <div className="rp-doc-modal-backdrop" onClick={() => setSelectedPoint(null)}>
          <div className="rp-doc-modal" onClick={e => e.stopPropagation()}>
            <div className="rp-doc-header">
              <div>
                <h3 className="rp-doc-title">
                  {selectedPoint.version} — {selectedPoint.title}
                </h3>
                <span className="rp-doc-sub">
                  File: <code>{selectedPoint.docFile}</code> | Commit: <code>{selectedPoint.commit}</code>
                </span>
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
            <div className="rp-doc-body">
              <div className="rp-doc-placeholder">
                <p><strong>Restore Point Details:</strong></p>
                <ul>
                  <li><strong>Version:</strong> {selectedPoint.version}</li>
                  <li><strong>Git Tag:</strong> {selectedPoint.gitTag}</li>
                  <li><strong>Commit:</strong> {selectedPoint.commit}</li>
                  <li><strong>Date:</strong> {selectedPoint.date}</li>
                  <li><strong>Status:</strong> {selectedPoint.status}</li>
                </ul>
                <div className="rp-doc-notice">
                  📄 Document contents from <code>{selectedPoint.docFile}</code> will be loaded here.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
