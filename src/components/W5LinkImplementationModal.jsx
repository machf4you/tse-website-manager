import { useState } from 'react'

export default function W5LinkImplementationModal({
  isOpen,
  rec,
  site,
  sourcePage,
  onConfirm,
  onClose,
  isPushing,
  error
}) {
  if (!isOpen || !rec) return null

  const sourceTitle = rec.sourceTitle || sourcePage?.title || sourcePage?.proposedTitle || 'Source Page'
  const sourceUrl = rec.sourceUrl || rec.suggestedSourceUrl || sourcePage?.url || ''
  const targetTitle = rec.targetTitle || 'Target Page'
  const targetUrl = rec.targetUrl || ''
  const anchorText = rec.anchorText || ''
  const savedSentence = rec.savedSentence || ''

  return (
    <div className="w4-modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', zIndex: 9999 }}>
      <div className="w4-modal-content" style={{ maxWidth: '640px', width: '92%', padding: '20px 24px', borderRadius: '12px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', fontWeight: '700' }}>
              🔗 Implement Internal Link on WordPress
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
              Confirm link insertion into source page content before pushing live.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPushing}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '10px 12px', color: '#fca5a5', fontSize: '0.8rem', marginBottom: '16px', lineHeight: '1.4' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {/* Source Page Info */}
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
              📄 SOURCE PAGE (CONTENT TO EDIT)
            </span>
            <strong style={{ color: '#38bdf8', fontSize: '0.85rem', display: 'block', wordBreak: 'break-word' }}>
              {sourceTitle}
            </strong>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '2px', wordBreak: 'break-all' }}>
              {sourceUrl}
            </span>
          </div>

          {/* Target Page Info */}
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
              🎯 TARGET PAGE (HYPERLINK DESTINATION)
            </span>
            <strong style={{ color: '#34d399', fontSize: '0.85rem', display: 'block', wordBreak: 'break-word' }}>
              {targetTitle}
            </strong>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '2px', wordBreak: 'break-all' }}>
              {targetUrl}
            </span>
          </div>
        </div>

        {/* Anchor Text & Target URL details */}
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Anchor Text: <strong style={{ color: '#fbbf24' }}>"{anchorText}"</strong>
            </span>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Hyperlink Tag: <code style={{ color: '#38bdf8', fontSize: '0.75rem' }}>{`<a href="${targetUrl}">${anchorText}</a>`}</code>
            </span>
          </div>

          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: '700', display: 'block', marginTop: '8px', marginBottom: '4px' }}>
            PROPOSED MODIFIED SENTENCE:
          </span>
          <div style={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px 12px', fontSize: '0.82rem', color: '#f1f5f9', lineHeight: '1.5' }}>
            "{savedSentence}"
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isPushing}
            style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPushing}
            className="w3-btn-emerald"
            style={{ padding: '8px 18px', fontSize: '0.82rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {isPushing ? 'Pushing to WordPress...' : '🚀 Confirm & Push to WordPress'}
          </button>
        </div>
      </div>
    </div>
  )
}
