import { useState, useEffect } from 'react'
import './SocialDashboardPage.css'

const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
)

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
    <circle cx="9" cy="9" r="2"/>
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const AlertTriangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

export default function SocialDashboardPage({ site, onBack }) {
  const [prompt, setPrompt] = useState('A sleek modern armchair in a sunlit architectural room with minimalist decor, high resolution 3d render')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [historyImages, setHistoryImages] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  const siteId = site?.id || null

  // Fetch server-preserved images on mount
  useEffect(() => {
    let isMounted = true
    setIsLoadingHistory(true)
    const url = siteId ? `/api/w7-social/images?siteId=${encodeURIComponent(siteId)}` : '/api/w7-social/images'

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && Array.isArray(data.images)) {
          setHistoryImages(data.images)
          if (data.images.length > 0 && !generatedImage) {
            // Pre-select most recent image if available
            setGeneratedImage({
              id: data.images[0].id,
              url: data.images[0].public_url || data.images[0].url,
              prompt: data.images[0].prompt,
              model: data.images[0].model,
              createdAt: data.images[0].created_at
            })
          }
        }
      })
      .catch(err => console.error('Failed to load W7 Social images history:', err))
      .finally(() => {
        if (isMounted) setIsLoadingHistory(false)
      })

    return () => { isMounted = false }
  }, [siteId])

  const handleGenerateImage = async () => {
    const cleanPrompt = prompt.trim()
    if (!cleanPrompt || isGenerating) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/w7-social/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanPrompt,
          siteId: siteId
        })
      })

      const data = await response.json()

      if (response.ok && data.success && data.image) {
        const newImg = {
          id: data.image.id,
          url: data.image.url,
          prompt: data.image.prompt,
          model: data.model || 'models/nano-banana-pro-preview',
          createdAt: data.image.createdAt
        }
        setGeneratedImage(newImg)
        setHistoryImages(prev => [
          {
            id: newImg.id,
            public_url: newImg.url,
            prompt: newImg.prompt,
            model: newImg.model,
            created_at: newImg.createdAt
          },
          ...prev
        ])
      } else {
        setError(data.error || 'Failed to generate image via Google Nano Banana API.')
      }
    } catch (err) {
      console.error('Error triggering Nano Banana generation:', err)
      setError(err.message || 'Network error connecting to backend API.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="social-dashboard-page">
      {/* Top-left Back Link */}
      <div>
        <button
          type="button"
          className="w2-btn-back"
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}
          id="btn-back-to-dashboard"
        >
          ← Back to Website Dashboard
        </button>
      </div>

      {/* Header Card */}
      <div className="sd-header-card">
        <div className="sd-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="sd-pill-tag">W7 | SOCIAL</span>
            <span className="sd-pill-model-badge">● API: Google Nano Banana (models/nano-banana-pro-preview)</span>
          </div>
          <h1 className="sd-title">W7 AI Content Generation — {site?.name || 'Connected Site'}</h1>
          <p className="sd-subtitle">
            Stage 1: Nano Banana Image Generation workflow.
          </p>
        </div>
      </div>

      {/* Main Content Grid: Test Area (Left) + Display & Server History (Right) */}
      <div className="sd-content-grid">
        
        {/* Left Column: Image Generation Test Area */}
        <div className="sd-card sd-test-panel">
          <div className="sd-card-header">
            <SparklesIcon />
            <h2 className="sd-card-title">Image Generation Test Area</h2>
          </div>

          <div className="sd-form-group">
            <label htmlFor="input-image-prompt" className="sd-label">
              Image Prompt
            </label>
            <textarea
              id="input-image-prompt"
              className="sd-textarea"
              placeholder="Describe the image you want Nano Banana to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={isGenerating}
            />
            <span className="sd-field-hint">
              Target Model: <code className="sd-code">models/nano-banana-pro-preview</code>
            </span>
          </div>

          <div className="sd-action-row">
            <button
              type="button"
              id="btn-generate-image"
              className="sd-btn-primary"
              onClick={handleGenerateImage}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <span className="sd-spinner" />
                  Generating via Nano Banana...
                </>
              ) : (
                <>
                  <SparklesIcon />
                  Generate Image
                </>
              )}
            </button>
          </div>

          {/* Loading / Status State */}
          {isGenerating && (
            <div className="sd-status-box sd-status-loading" id="status-loading">
              <div className="sd-spinner-lg" />
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.2rem' }}>
                  Calling Google Nano Banana API...
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Model: <code className="sd-code">models/nano-banana-pro-preview</code> via <code className="sd-code">generateContent</code>. Preserving result server-side.
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="sd-status-box sd-status-error" id="status-error">
              <AlertTriangleIcon />
              <div>
                <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '0.2rem' }}>
                  Generation Failed
                </div>
                <div style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
                  {error}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Display Generated Image & Server Preservation */}
        <div className="sd-card sd-display-panel">
          <div className="sd-card-header">
            <ImageIcon />
            <h2 className="sd-card-title">Generated Image Output</h2>
          </div>

          {generatedImage ? (
            <div className="sd-preview-container" id="container-generated-image">
              <div className="sd-preview-badge">
                <CheckCircleIcon />
                <span>Rendered from Server Preservation</span>
              </div>
              <div className="sd-image-wrapper">
                <img
                  id="img-generated-output"
                  src={generatedImage.url}
                  alt={generatedImage.prompt}
                  className="sd-rendered-img"
                />
              </div>
              <div className="sd-meta-card">
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Prompt:</span>
                  <span className="sd-meta-val">&ldquo;{generatedImage.prompt}&rdquo;</span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Model:</span>
                  <span className="sd-meta-val"><code className="sd-code">{generatedImage.model || 'models/nano-banana-pro-preview'}</code></span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Image ID:</span>
                  <span className="sd-meta-val"><code className="sd-code">{generatedImage.id}</code></span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Server Path:</span>
                  <span className="sd-meta-val"><a href={generatedImage.url} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>{generatedImage.url}</a></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="sd-empty-display" id="container-empty-output">
              <div className="sd-empty-icon-bg">
                <ImageIcon />
              </div>
              <h3 style={{ margin: '0 0 0.4rem 0', color: '#f8fafc', fontSize: '1.1rem' }}>No Image Generated Yet</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', maxWidth: '320px' }}>
                Enter your prompt on the left and click &ldquo;Generate Image&rdquo; to test Google Nano Banana.
              </p>
            </div>
          )}

          {/* Server Preserved History List */}
          {historyImages.length > 0 && (
            <div className="sd-history-section">
              <h3 className="sd-history-title">Server Preserved Images ({historyImages.length})</h3>
              <div className="sd-history-grid">
                {historyImages.map(item => {
                  const itemUrl = item.public_url || item.url
                  const isSelected = generatedImage?.id === item.id
                  return (
                    <div
                      key={item.id}
                      className={`sd-history-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setGeneratedImage({
                        id: item.id,
                        url: itemUrl,
                        prompt: item.prompt,
                        model: item.model,
                        createdAt: item.created_at
                      })}
                    >
                      <img src={itemUrl} alt={item.prompt} className="sd-history-thumb" />
                      <div className="sd-history-prompt">{item.prompt}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
