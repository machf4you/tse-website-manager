import { useState, useEffect } from 'react'

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
  const [editableSentence, setEditableSentence] = useState('')

  useEffect(() => {
    if (rec) {
      setEditableSentence(rec.savedSentence || '')
    }
  }, [rec])

  if (!isOpen || !rec) return null

  const sourceTitle = rec.sourceTitle || sourcePage?.title || sourcePage?.proposedTitle || 'Source Page'
  const sourceUrl = rec.sourceUrl || rec.suggestedSourceUrl || sourcePage?.url || ''
  const targetTitle = rec.targetTitle || 'Target Page'
  const targetUrl = rec.targetUrl || ''
  const anchorText = rec.anchorText || ''
  const originalContext = rec.currentSourceText || 'New paragraph to be added to source page editorial content.'

  return (
    <div className="w4-modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', zIndex: 9999 }}>
      <div className="w4-modal-content" style={{ maxWidth: '680px', width: '92%', padding: '20px 24px', borderRadius: '12px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', fontWeight: '700' }}>
              🔗 Implement Internal Link on WordPress
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
              Review original vs proposed content before pushing live to WordPress.
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
            ⚠️ <strong>Push Failed:</strong> {error}
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

        {/* Anchor Text & Hyperlink Summary */}
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Anchor Text: <strong style={{ color: '#fbbf24' }}>"{anchorText}"</strong>
            </span>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Target Tag: <code style={{ color: '#38bdf8', fontSize: '0.75rem' }}>{`<a href="${targetUrl}">${anchorText}</a>`}</code>
            </span>
          </div>
        </div>

        {/* ORIGINAL CONTENT (Read-Only) */}
        <div style={{ marginBottom: '14px' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
            1. ORIGINAL CONTENT (CURRENT SOURCE BLOCK - READ ONLY):
          </span>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px 12px', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.5', maxHeight: '90px', overflowY: 'auto' }}>
            {originalContext}
          </div>
        </div>

        {/* PROPOSED CONTENT (Editable) */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8', fontWeight: '700' }}>
              2. PROPOSED CONTENT (EXACT EDITORIAL SENTENCE - EDITABLE BEFORE PUSH):
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>✏️ Tweak text if needed</span>
          </div>
          <textarea
            value={editableSentence}
            onChange={(e) => setEditableSentence(e.target.value)}
            disabled={isPushing}
            rows={3}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#020617',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '0.82rem',
              color: '#f8fafc',
              lineHeight: '1.5',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            placeholder="Proposed contextual sentence..."
          />
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
            onClick={() => onConfirm(editableSentence)}
            disabled={isPushing || !editableSentence.trim()}
            className="w3-btn-emerald"
            style={{ padding: '8px 18px', fontSize: '0.82rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {isPushing ? 'Pushing & Verifying in WordPress...' : '🚀 Confirm & Push to WordPress'}
          </button>
        </div>
      </div>
    </div>
  )
}
