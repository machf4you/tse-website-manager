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

const VideoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 8-6 4 6 4V8Z"/>
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
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
  // Stage 1: Nano Banana Image State
  const [prompt, setPrompt] = useState('A sleek modern armchair in a sunlit architectural room with minimalist decor, high resolution 3d render')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [historyImages, setHistoryImages] = useState([])

  // Stage 2: Veo Video State
  const [videoPrompt, setVideoPrompt] = useState('Slow smooth camera pan right with gentle ambient lighting shift')
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [videoError, setVideoError] = useState(null)
  const [generatedVideo, setGeneratedVideo] = useState(null)
  const [historyVideos, setHistoryVideos] = useState([])

  const siteId = site?.id || null

  // Fetch server-preserved images and videos on mount
  useEffect(() => {
    let isMounted = true

    const imagesUrl = siteId ? `/api/w7-social/images?siteId=${encodeURIComponent(siteId)}` : '/api/w7-social/images'
    const videosUrl = siteId ? `/api/w7-social/videos?siteId=${encodeURIComponent(siteId)}` : '/api/w7-social/videos'

    fetch(imagesUrl)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && Array.isArray(data.images)) {
          setHistoryImages(data.images)
          if (data.images.length > 0 && !generatedImage) {
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

    fetch(videosUrl)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && Array.isArray(data.videos)) {
          setHistoryVideos(data.videos)
          if (data.videos.length > 0 && !generatedVideo) {
            setGeneratedVideo({
              id: data.videos[0].id,
              url: data.videos[0].public_url || data.videos[0].url,
              prompt: data.videos[0].prompt,
              model: data.videos[0].model,
              sourceImageId: data.videos[0].source_image_id,
              createdAt: data.videos[0].created_at
            })
          }
        }
      })
      .catch(err => console.error('Failed to load W7 Social videos history:', err))

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

  const handleGenerateVideo = async () => {
    const cleanVideoPrompt = videoPrompt.trim()
    if (!cleanVideoPrompt || isGeneratingVideo) return

    if (!generatedImage && historyImages.length === 0) {
      setVideoError('Please generate or select a Nano Banana image first as the source for Veo.')
      return
    }

    const sourceImg = generatedImage || historyImages[0]

    setIsGeneratingVideo(true)
    setVideoError(null)

    try {
      const response = await fetch('/api/w7-social/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanVideoPrompt,
          sourceImageId: sourceImg?.id,
          sourceImageUrl: sourceImg?.url || sourceImg?.public_url,
          siteId: siteId
        })
      })

      const data = await response.json()

      if (response.ok && data.success && data.video) {
        const newVid = {
          id: data.video.id,
          url: data.video.url,
          prompt: data.video.prompt,
          model: data.model || 'models/veo-3.1-fast-generate-preview',
          sourceImageId: data.video.sourceImageId,
          createdAt: data.video.createdAt
        }
        setGeneratedVideo(newVid)
        setHistoryVideos(prev => [
          {
            id: newVid.id,
            public_url: newVid.url,
            prompt: newVid.prompt,
            model: newVid.model,
            source_image_id: newVid.sourceImageId,
            created_at: newVid.createdAt
          },
          ...prev
        ])
      } else {
        setVideoError(data.error || 'Failed to generate video via Google Veo API.')
      }
    } catch (err) {
      console.error('Error triggering Veo generation:', err)
      setVideoError(err.message || 'Network error connecting to backend API.')
    } finally {
      setIsGeneratingVideo(false)
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
            <span className="sd-pill-model-badge">● Stage 1: Nano Banana</span>
            <span className="sd-pill-model-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>● Stage 2: Veo (models/veo-3.1-fast-generate-preview)</span>
          </div>
          <h1 className="sd-title">W7 AI Content Generation — {site?.name || 'Connected Site'}</h1>
          <p className="sd-subtitle">
            Nano Banana Image Generation &rarr; Veo Image-to-Video Workflow
          </p>
        </div>
      </div>

      {/* SECTION 1: STAGE 1 — NANO BANANA IMAGE GENERATION */}
      <div className="sd-section-title">
        <SparklesIcon />
        <span>Stage 1: Nano Banana Image Generation</span>
      </div>

      <div className="sd-content-grid">
        {/* Left Column: Image Generation Test Area */}
        <div className="sd-card sd-test-panel">
          <div className="sd-card-header">
            <SparklesIcon />
            <h2 className="sd-card-title">Image Prompt & Controls</h2>
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

      {/* SECTION 2: STAGE 2 — VEO IMAGE-TO-VIDEO GENERATION */}
      <div className="sd-section-title" style={{ marginTop: '2.5rem' }}>
        <VideoIcon />
        <span>Stage 2: Veo Image-to-Video Generation</span>
      </div>

      <div className="sd-content-grid">
        {/* Left Column: Veo Video Controls */}
        <div className="sd-card sd-test-panel">
          <div className="sd-card-header">
            <VideoIcon />
            <h2 className="sd-card-title">Veo Image-to-Video Controls</h2>
          </div>

          {/* Active Source Image Preview */}
          <div className="sd-form-group">
            <label className="sd-label">
              Source Image (Nano Banana)
            </label>
            {generatedImage ? (
              <div className="sd-source-preview-box" id="selected-source-image">
                <img src={generatedImage.url} alt="Source" className="sd-source-thumb" />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircleIcon /> Selected Source Image
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    &ldquo;{generatedImage.prompt}&rdquo;
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0.8rem', background: '#0f172a', borderRadius: '8px', border: '1px dashed #334155', color: '#94a3b8', fontSize: '0.85rem' }}>
                ⚠️ Please select or generate an image above to use as source.
              </div>
            )}
          </div>

          <div className="sd-form-group">
            <label htmlFor="input-video-prompt" className="sd-label">
              Video Prompt (Motion / Camera Angle)
            </label>
            <textarea
              id="input-video-prompt"
              className="sd-textarea"
              placeholder="Describe motion or camera angle for Veo (e.g., Slow smooth camera pan right)..."
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              rows={4}
              disabled={isGeneratingVideo}
            />
            <span className="sd-field-hint">
              Model: <code className="sd-code">models/veo-3.1-fast-generate-preview</code> (9:16 Vertical Video)
            </span>
          </div>

          <div className="sd-action-row">
            <button
              type="button"
              id="btn-generate-video"
              className="sd-btn-primary"
              style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
              onClick={handleGenerateVideo}
              disabled={isGeneratingVideo || !videoPrompt.trim() || !generatedImage}
            >
              {isGeneratingVideo ? (
                <>
                  <span className="sd-spinner" />
                  Generating Video via Veo...
                </>
              ) : (
                <>
                  <VideoIcon />
                  Generate Video (Veo)
                </>
              )}
            </button>
          </div>

          {/* Video Loading / Status State */}
          {isGeneratingVideo && (
            <div className="sd-status-box sd-status-loading" id="status-video-loading">
              <div className="sd-spinner-lg" style={{ borderColor: '#38bdf8', borderTopColor: 'transparent' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.2rem' }}>
                  Generating 9:16 Vertical Video via Veo 3.1...
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Model: <code className="sd-code">models/veo-3.1-fast-generate-preview</code> via <code className="sd-code">predictLongRunning</code>. This takes 15-30 seconds.
                </div>
              </div>
            </div>
          )}

          {/* Video Error State */}
          {videoError && (
            <div className="sd-status-box sd-status-error" id="status-video-error">
              <AlertTriangleIcon />
              <div>
                <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '0.2rem' }}>
                  Veo Video Generation Failed
                </div>
                <div style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
                  {videoError}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Display Generated Video Output & History */}
        <div className="sd-card sd-display-panel">
          <div className="sd-card-header">
            <VideoIcon />
            <h2 className="sd-card-title">Generated Video Output</h2>
          </div>

          {generatedVideo ? (
            <div className="sd-preview-container" id="container-generated-video">
              <div className="sd-preview-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                <CheckCircleIcon />
                <span>Veo MP4 Rendered &amp; Saved Server-Side</span>
              </div>
              <div className="sd-video-wrapper">
                <video
                  id="video-generated-output"
                  src={generatedVideo.url}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="sd-rendered-video"
                />
              </div>
              <div className="sd-meta-card">
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Motion Prompt:</span>
                  <span className="sd-meta-val">&ldquo;{generatedVideo.prompt}&rdquo;</span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Model:</span>
                  <span className="sd-meta-val"><code className="sd-code">{generatedVideo.model || 'models/veo-3.1-fast-generate-preview'}</code></span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Video ID:</span>
                  <span className="sd-meta-val"><code className="sd-code">{generatedVideo.id}</code></span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Server Path:</span>
                  <span className="sd-meta-val"><a href={generatedVideo.url} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>{generatedVideo.url}</a></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="sd-empty-display" id="container-empty-video-output">
              <div className="sd-empty-icon-bg" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                <VideoIcon />
              </div>
              <h3 style={{ margin: '0 0 0.4rem 0', color: '#f8fafc', fontSize: '1.1rem' }}>No Video Generated Yet</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', maxWidth: '320px' }}>
                Select a Nano Banana image above, enter motion instructions, and click &ldquo;Generate Video (Veo)&rdquo;.
              </p>
            </div>
          )}

          {/* Server Preserved Video History List */}
          {historyVideos.length > 0 && (
            <div className="sd-history-section">
              <h3 className="sd-history-title">Server Preserved Videos ({historyVideos.length})</h3>
              <div className="sd-history-grid">
                {historyVideos.map(item => {
                  const itemUrl = item.public_url || item.url
                  const isSelected = generatedVideo?.id === item.id
                  return (
                    <div
                      key={item.id}
                      className={`sd-history-item ${isSelected ? 'selected' : ''}`}
                      style={{ height: '140px' }}
                      onClick={() => setGeneratedVideo({
                        id: item.id,
                        url: itemUrl,
                        prompt: item.prompt,
                        model: item.model,
                        sourceImageId: item.source_image_id,
                        createdAt: item.created_at
                      })}
                    >
                      <video src={itemUrl} className="sd-history-thumb" style={{ objectFit: 'cover' }} muted preload="metadata" />
                      <div className="sd-history-prompt">🎥 {item.prompt}</div>
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
