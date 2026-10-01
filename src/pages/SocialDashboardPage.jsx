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

const getFileFormat = (item) => {
  if (item?.format) return item.format.toUpperCase()
  const mime = item?.mime_type || item?.mimeType || ''
  const url = item?.public_url || item?.url || ''
  if (mime.includes('png') || url.endsWith('.png')) return 'PNG'
  return 'JPG'
}

export default function SocialDashboardPage({ site, onBack }) {
  // Stage 1: Nano Banana Image State
  const [subject, setSubject] = useState('Dormer Loft Conversion')
  const [format, setFormat] = useState('JPG')
  const [aspectRatio, setAspectRatio] = useState('9:16')
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
  const [isSourcePromptExpanded, setIsSourcePromptExpanded] = useState(false)

  // Stage 3: Creatomate Video Finishing State
  const [headline, setHeadline] = useState('Transform Your Home with a Loft Extension')
  const [cta, setCta] = useState('Get Your Free Quote Today!')
  const [isGeneratingFinalVideo, setIsGeneratingFinalVideo] = useState(false)
  const [finalVideoError, setFinalVideoError] = useState(null)
  const [generatedFinalVideo, setGeneratedFinalVideo] = useState(null)
  const [historyFinalVideos, setHistoryFinalVideos] = useState([])
  const [isSourceVideoExpanded, setIsSourceVideoExpanded] = useState(false)

  const siteId = site?.id || null

  // Fetch server-preserved images, videos, and final videos on mount
  useEffect(() => {
    let isMounted = true

    const imagesUrl = siteId ? `/api/w7-social/images?siteId=${encodeURIComponent(siteId)}` : '/api/w7-social/images'
    const videosUrl = siteId ? `/api/w7-social/videos?siteId=${encodeURIComponent(siteId)}` : '/api/w7-social/videos'
    const finalVideosUrl = siteId ? `/api/w7-social/final-videos?siteId=${encodeURIComponent(siteId)}` : '/api/w7-social/final-videos'

    fetch(imagesUrl)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && Array.isArray(data.images)) {
          setHistoryImages(data.images)
          if (data.images.length > 0 && !generatedImage) {
            const first = data.images[0]
            setGeneratedImage({
              id: first.id,
              url: first.public_url || first.url,
              subject: first.subject || 'Untitled Image',
              format: first.format || getFileFormat(first),
              aspectRatio: first.aspect_ratio || first.aspectRatio || '9:16',
              prompt: first.prompt,
              model: first.model,
              createdAt: first.created_at,
              mimeType: first.mime_type
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
            const firstVid = data.videos[0]
            setGeneratedVideo({
              id: firstVid.id,
              url: firstVid.public_url || firstVid.url,
              subject: firstVid.subject || 'Untitled Video',
              aspectRatio: firstVid.aspect_ratio || firstVid.aspectRatio || '9:16',
              prompt: firstVid.prompt,
              model: firstVid.model,
              sourceImageId: firstVid.source_image_id,
              createdAt: firstVid.created_at
            })
          }
        }
      })
      .catch(err => console.error('Failed to load W7 Social videos history:', err))

    fetch(finalVideosUrl)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && Array.isArray(data.videos)) {
          setHistoryFinalVideos(data.videos)
          if (data.videos.length > 0 && !generatedFinalVideo) {
            const firstFinalVid = data.videos[0]
            setGeneratedFinalVideo({
              id: firstFinalVid.id,
              url: firstFinalVid.public_url || firstFinalVid.url,
              subject: firstFinalVid.subject || 'Untitled Video',
              aspectRatio: firstFinalVid.aspect_ratio || firstFinalVid.aspectRatio || '9:16',
              headline: firstFinalVid.headline,
              cta: firstFinalVid.cta,
              sourceVideoId: firstFinalVid.source_video_id,
              renderId: firstFinalVid.render_id,
              createdAt: firstFinalVid.created_at
            })
          }
        }
      })
      .catch(err => console.error('Failed to load W7 Social final videos history:', err))

    return () => { isMounted = false }
  }, [siteId])

  const handleDeleteImage = async (imgId) => {
    if (!window.confirm('Are you sure you want to permanently delete this preserved image?')) {
      return
    }

    try {
      const res = await fetch(`/api/w7-social/images/${encodeURIComponent(imgId)}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setHistoryImages(prev => {
          const updated = prev.filter(item => item.id !== imgId)
          if (generatedImage?.id === imgId) {
            if (updated.length > 0) {
              const nextImg = updated[0]
              setGeneratedImage({
                id: nextImg.id,
                url: nextImg.public_url || nextImg.url,
                subject: nextImg.subject || 'Untitled Image',
                format: nextImg.format || getFileFormat(nextImg),
                aspectRatio: nextImg.aspect_ratio || nextImg.aspectRatio || '9:16',
                prompt: nextImg.prompt,
                model: nextImg.model,
                createdAt: nextImg.created_at,
                mimeType: nextImg.mime_type
              })
            } else {
              setGeneratedImage(null)
            }
          }
          return updated
        })
      } else {
        alert(data.error || 'Failed to delete image asset.')
      }
    } catch (err) {
      console.error('Error deleting image asset:', err)
      alert('Network error deleting image asset.')
    }
  }

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to permanently delete this preserved video?')) {
      return
    }

    try {
      const res = await fetch(`/api/w7-social/videos/${encodeURIComponent(videoId)}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setHistoryVideos(prev => {
          const updated = prev.filter(item => item.id !== videoId)
          if (generatedVideo?.id === videoId) {
            if (updated.length > 0) {
              const nextVid = updated[0]
              setGeneratedVideo({
                id: nextVid.id,
                url: nextVid.public_url || nextVid.url,
                subject: nextVid.subject || 'Untitled Video',
                aspectRatio: nextVid.aspect_ratio || nextVid.aspectRatio || '9:16',
                prompt: nextVid.prompt,
                model: nextVid.model,
                sourceImageId: nextVid.source_image_id,
                createdAt: nextVid.created_at
              })
            } else {
              setGeneratedVideo(null)
            }
          }
          return updated
        })
      } else {
        alert(data.error || 'Failed to delete video asset.')
      }
    } catch (err) {
      console.error('Error deleting video asset:', err)
      alert('Network error deleting video asset.')
    }
  }

  const handleDeleteFinalVideo = async (finalVidId) => {
    if (!window.confirm('Are you sure you want to permanently delete this preserved final video?')) {
      return
    }

    try {
      const res = await fetch(`/api/w7-social/final-videos/${encodeURIComponent(finalVidId)}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setHistoryFinalVideos(prev => {
          const updated = prev.filter(item => item.id !== finalVidId)
          if (generatedFinalVideo?.id === finalVidId) {
            if (updated.length > 0) {
              const nextFinalVid = updated[0]
              setGeneratedFinalVideo({
                id: nextFinalVid.id,
                url: nextFinalVid.public_url || nextFinalVid.url,
                subject: nextFinalVid.subject || 'Untitled Video',
                aspectRatio: nextFinalVid.aspect_ratio || nextFinalVid.aspectRatio || '9:16',
                headline: nextFinalVid.headline,
                cta: nextFinalVid.cta,
                sourceVideoId: nextFinalVid.source_video_id,
                renderId: nextFinalVid.render_id,
                createdAt: nextFinalVid.created_at
              })
            } else {
              setGeneratedFinalVideo(null)
            }
          }
          return updated
        })
      } else {
        alert(data.error || 'Failed to delete final video asset.')
      }
    } catch (err) {
      console.error('Error deleting final video asset:', err)
      alert('Network error deleting final video asset.')
    }
  }

  const handleGenerateImage = async () => {
    const cleanSubject = subject.trim()
    if (!cleanSubject) {
      setError('Please enter a Subject.')
      return
    }

    const cleanPrompt = prompt.trim()
    if (!cleanPrompt) {
      setError('Image prompt is required.')
      return
    }

    if (isGenerating) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/w7-social/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanPrompt,
          subject: cleanSubject,
          format: format,
          aspectRatio: aspectRatio,
          siteId: siteId
        })
      })

      const data = await response.json()

      if (response.ok && data.success && data.image) {
        const newImg = {
          id: data.image.id,
          url: data.image.url,
          subject: data.image.subject || cleanSubject,
          format: data.image.format || format,
          aspectRatio: data.image.aspectRatio || aspectRatio,
          prompt: data.image.prompt,
          model: data.model || 'models/nano-banana-pro-preview',
          createdAt: data.image.createdAt,
          mimeType: data.image.mimeType
        }
        setGeneratedImage(newImg)
        setHistoryImages(prev => [
          {
            id: newImg.id,
            public_url: newImg.url,
            subject: newImg.subject,
            format: newImg.format,
            aspect_ratio: newImg.aspectRatio,
            prompt: newImg.prompt,
            model: newImg.model,
            created_at: newImg.createdAt,
            mime_type: newImg.mimeType
          },
          ...prev
        ])

        // Automatically clear Subject field on successful image generation
        setSubject('')
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
    const inheritedSubject = sourceImg?.subject || subject.trim() || 'Untitled Image'
    const inheritedAspectRatio = sourceImg?.aspectRatio || sourceImg?.aspect_ratio || aspectRatio || '9:16'

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
          subject: inheritedSubject,
          aspectRatio: inheritedAspectRatio,
          siteId: siteId
        })
      })

      const data = await response.json()

      if (response.ok && data.success && data.video) {
        const newVid = {
          id: data.video.id,
          url: data.video.url,
          subject: data.video.subject || inheritedSubject,
          aspectRatio: data.video.aspectRatio || inheritedAspectRatio,
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
            subject: newVid.subject,
            aspect_ratio: newVid.aspectRatio,
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

  const handleGenerateFinalVideo = async () => {
    const cleanHeadline = headline.trim()
    const cleanCta = cta.trim()

    if (!cleanHeadline) {
      setFinalVideoError('Headline text is required.')
      return
    }
    if (!cleanCta) {
      setFinalVideoError('CTA text is required.')
      return
    }

    const sourceVid = generatedVideo || historyVideos[0]
    if (!sourceVid) {
      setFinalVideoError('Please generate or select a Veo video first as the source for Creatomate.')
      return
    }

    if (isGeneratingFinalVideo) return

    setIsGeneratingFinalVideo(true)
    setFinalVideoError(null)

    try {
      const response = await fetch('/api/w7-social/generate-final-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceVideoId: sourceVid.id,
          headline: cleanHeadline,
          cta: cleanCta,
          siteId: siteId
        })
      })

      const data = await response.json()

      if (response.ok && data.success && data.video) {
        const newFinalVid = {
          id: data.video.id,
          url: data.video.url,
          subject: data.video.subject || sourceVid.subject || 'Untitled Video',
          aspectRatio: data.video.aspectRatio || '9:16',
          headline: data.video.headline,
          cta: data.video.cta,
          sourceVideoId: data.video.sourceVideoId,
          renderId: data.video.renderId,
          createdAt: data.video.createdAt
        }
        setGeneratedFinalVideo(newFinalVid)
        setHistoryFinalVideos(prev => [
          {
            id: newFinalVid.id,
            public_url: newFinalVid.url,
            subject: newFinalVid.subject,
            aspect_ratio: newFinalVid.aspectRatio,
            headline: newFinalVid.headline,
            cta: newFinalVid.cta,
            source_video_id: newFinalVid.sourceVideoId,
            render_id: newFinalVid.renderId,
            created_at: newFinalVid.createdAt
          },
          ...prev
        ])
      } else {
        setFinalVideoError(data.error || 'Failed to finish video via Creatomate API.')
      }
    } catch (err) {
      console.error('Error triggering Creatomate video rendering:', err)
      setFinalVideoError(err.message || 'Network error connecting to backend API.')
    } finally {
      setIsGeneratingFinalVideo(false)
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
            <span className="sd-pill-model-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>● Stage 2: Veo (Image-to-Video)</span>
            <span className="sd-pill-model-badge" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', borderColor: 'rgba(236, 72, 153, 0.3)' }}>● Stage 3: Creatomate (Video Finishing)</span>
          </div>
          <h1 className="sd-title">W7 AI Content Generation — {site?.name || 'Connected Site'}</h1>
          <p className="sd-subtitle">
            Nano Banana &rarr; Veo &rarr; Creatomate End-to-End Social Video Workflow
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
            <h2 className="sd-card-title">Image Prompt &amp; Controls</h2>
          </div>

          {/* Subject | Format | Aspect Ratio Row */}
          <div className="sd-controls-row">
            <div className="sd-form-group-subject">
              <label htmlFor="input-image-subject" className="sd-label">
                Subject
              </label>
              <input
                type="text"
                id="input-image-subject"
                className="sd-input-text"
                placeholder="e.g. Dormer Loft Conversion"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="sd-form-group-fmt">
              <label htmlFor="select-image-format" className="sd-label">
                Format
              </label>
              <select
                id="select-image-format"
                className="sd-select"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                disabled={isGenerating}
              >
                <option value="JPG">JPG</option>
                <option value="PNG">PNG</option>
              </select>
            </div>

            <div className="sd-form-group-ratio">
              <label htmlFor="select-image-aspect-ratio" className="sd-label">
                Aspect Ratio
              </label>
              <select
                id="select-image-aspect-ratio"
                className="sd-select"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                disabled={isGenerating}
              >
                <option value="9:16">9:16 &mdash; Portrait</option>
                <option value="16:9">16:9 &mdash; Landscape</option>
                <option value="1:1">1:1 &mdash; Square</option>
              </select>
            </div>
          </div>

          {/* Taller Textarea directly underneath */}
          <div className="sd-form-group" style={{ marginTop: '0.5rem' }}>
            <textarea
              id="input-image-prompt"
              className="sd-textarea sd-textarea-large"
              placeholder="Describe the image you want Nano Banana to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
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

          {/* Server Preserved History List */}
          {historyImages.length > 0 && (
            <div className="sd-history-section">
              <h3 className="sd-history-title">Server Preserved Images ({historyImages.length})</h3>
              <div className="sd-history-grid">
                {historyImages.map(item => {
                  const itemUrl = item.public_url || item.url
                  const isSelected = generatedImage?.id === item.id
                  const displaySubject = item.subject || 'Untitled Image'
                  const displayFormat = item.format || getFileFormat(item)
                  const displayRatio = item.aspect_ratio || item.aspectRatio || '9:16'

                  return (
                    <div
                      key={item.id}
                      className={`sd-history-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setGeneratedImage({
                        id: item.id,
                        url: itemUrl,
                        subject: displaySubject,
                        format: displayFormat,
                        aspectRatio: displayRatio,
                        prompt: item.prompt,
                        model: item.model,
                        createdAt: item.created_at,
                        mimeType: item.mime_type
                      })}
                    >
                      <button
                        type="button"
                        className="sd-history-delete-btn"
                        title="Delete preserved image"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteImage(item.id)
                        }}
                      >
                        &times;
                      </button>
                      <img src={itemUrl} alt={item.prompt} className="sd-history-thumb" />
                      <div className="sd-history-meta">
                        <div className="sd-history-name">{displaySubject}</div>
                        <div className="sd-history-fmt">IMAGE &middot; {displayFormat} &middot; {displayRatio}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Display Generated Image Output */}
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
                  <span className="sd-meta-label">Subject:</span>
                  <span className="sd-meta-val" style={{ fontWeight: 700, color: '#10b981' }}>{generatedImage.subject || 'Untitled Image'}</span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Format:</span>
                  <span className="sd-meta-val"><code className="sd-code">{generatedImage.format || 'JPG'}</code></span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Aspect Ratio:</span>
                  <span className="sd-meta-val"><code className="sd-code">{generatedImage.aspectRatio || '9:16'}</code></span>
                </div>
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
        </div>
      </div>

      {/* SECTION 2: STAGE 2 — VEO IMAGE-TO-VIDEO GENERATION */}
      <div className="sd-section-title" style={{ marginTop: '2.5rem' }}>
        <VideoIcon />
        <span>Stage 2: Veo Image-to-Video Generation</span>
      </div>

      <div className="sd-content-grid">
        {/* Left Column: Veo Video Controls & Server Preserved Videos */}
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
                <div className="sd-source-text-col">
                  <div className="sd-source-header-row">
                    <CheckCircleIcon />
                    <span>Selected Source Image ({generatedImage.subject || 'Untitled Image'})</span>
                  </div>
                  <div className={`sd-source-prompt-text ${isSourcePromptExpanded ? 'expanded' : ''}`}>
                    &ldquo;{generatedImage.prompt}&rdquo;
                  </div>
                  {generatedImage.prompt && generatedImage.prompt.length > 50 && (
                    <button
                      type="button"
                      className="sd-read-more-btn"
                      onClick={() => setIsSourcePromptExpanded(!isSourcePromptExpanded)}
                    >
                      {isSourcePromptExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
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
              Model: <code className="sd-code">models/veo-3.1-fast-generate-preview</code> ({generatedImage?.aspectRatio || '9:16'} Inherited Aspect Ratio)
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
                  Generating Video ({generatedImage?.aspectRatio || '9:16'}) via Veo 3.1...
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

          {/* Server Preserved Video History List */}
          {historyVideos.length > 0 && (
            <div className="sd-history-section">
              <h3 className="sd-history-title">Server Preserved Videos ({historyVideos.length})</h3>
              <div className="sd-history-grid">
                {historyVideos.map(item => {
                  const itemUrl = item.public_url || item.url
                  const isSelected = generatedVideo?.id === item.id
                  const displaySubject = item.subject || 'Untitled Video'
                  const displayRatio = item.aspect_ratio || item.aspectRatio || '9:16'

                  return (
                    <div
                      key={item.id}
                      className={`sd-history-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setGeneratedVideo({
                        id: item.id,
                        url: itemUrl,
                        subject: displaySubject,
                        aspectRatio: displayRatio,
                        prompt: item.prompt,
                        model: item.model,
                        sourceImageId: item.source_image_id,
                        createdAt: item.created_at
                      })}
                    >
                      <button
                        type="button"
                        className="sd-history-delete-btn"
                        title="Delete preserved video"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteVideo(item.id)
                        }}
                      >
                        &times;
                      </button>
                      <video src={itemUrl} className="sd-history-thumb" style={{ objectFit: 'cover' }} muted preload="metadata" />
                      <div className="sd-history-meta">
                        <div className="sd-history-name">{displaySubject}</div>
                        <div className="sd-history-fmt">VID &middot; {displayRatio}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Display Generated Video Output Only */}
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
                  <span className="sd-meta-label">Subject:</span>
                  <span className="sd-meta-val" style={{ fontWeight: 700, color: '#38bdf8' }}>{generatedVideo.subject || 'Untitled Video'}</span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Aspect Ratio:</span>
                  <span className="sd-meta-val"><code className="sd-code">{generatedVideo.aspectRatio || '9:16'}</code></span>
                </div>
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
        </div>
      </div>

      {/* SECTION 3: STAGE 3 — CREATOMATE VIDEO FINISHING */}
      <div className="sd-section-title" style={{ marginTop: '2.5rem' }}>
        <SparklesIcon />
        <span>Stage 3: Creatomate Video Finishing</span>
      </div>

      <div className="sd-content-grid">
        {/* Left Column: Creatomate Video Finishing Controls & Preserved Final Videos */}
        <div className="sd-card sd-test-panel">
          <div className="sd-card-header" style={{ color: '#ec4899' }}>
            <SparklesIcon />
            <h2 className="sd-card-title">Creatomate Video Finishing Controls</h2>
          </div>

          {/* Active Source Veo Video Preview */}
          <div className="sd-form-group">
            <label className="sd-label">
              Source Video (Veo)
            </label>
            {generatedVideo ? (
              <div className="sd-source-preview-box" id="selected-source-video" style={{ borderColor: 'rgba(236, 72, 153, 0.3)' }}>
                <video src={generatedVideo.url} className="sd-source-thumb" style={{ objectFit: 'cover' }} muted preload="metadata" />
                <div className="sd-source-text-col">
                  <div className="sd-source-header-row" style={{ color: '#ec4899' }}>
                    <CheckCircleIcon />
                    <span>Selected Source Veo Video ({generatedVideo.subject || 'Untitled Video'})</span>
                  </div>
                  <div className={`sd-source-prompt-text ${isSourceVideoExpanded ? 'expanded' : ''}`}>
                    &ldquo;{generatedVideo.prompt}&rdquo;
                  </div>
                  {generatedVideo.prompt && generatedVideo.prompt.length > 50 && (
                    <button
                      type="button"
                      className="sd-read-more-btn"
                      style={{ color: '#ec4899' }}
                      onClick={() => setIsSourceVideoExpanded(!isSourceVideoExpanded)}
                    >
                      {isSourceVideoExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '0.8rem', background: '#0f172a', borderRadius: '8px', border: '1px dashed #334155', color: '#94a3b8', fontSize: '0.85rem' }}>
                ⚠️ Please select or generate a Veo video above to use as source for Creatomate.
              </div>
            )}
          </div>

          {/* Headline Field */}
          <div className="sd-form-group">
            <label htmlFor="input-final-headline" className="sd-label">
              Headline
            </label>
            <input
              type="text"
              id="input-final-headline"
              className="sd-input-text"
              placeholder="e.g. Transform Your Home with a Loft Extension"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              disabled={isGeneratingFinalVideo}
            />
          </div>

          {/* CTA Field */}
          <div className="sd-form-group">
            <label htmlFor="input-final-cta" className="sd-label">
              CTA (Call to Action)
            </label>
            <input
              type="text"
              id="input-final-cta"
              className="sd-input-text"
              placeholder="e.g. Get Your Free Quote Today!"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              disabled={isGeneratingFinalVideo}
            />
            <span className="sd-field-hint">
              Provider: <code className="sd-code">Creatomate API</code> (9:16 Vertical Finished MP4)
            </span>
          </div>

          <div className="sd-action-row">
            <button
              type="button"
              id="btn-finish-video-creatomate"
              className="sd-btn-primary"
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' }}
              onClick={handleGenerateFinalVideo}
              disabled={isGeneratingFinalVideo || !headline.trim() || !cta.trim() || !generatedVideo}
            >
              {isGeneratingFinalVideo ? (
                <>
                  <span className="sd-spinner" />
                  Rendering via Creatomate...
                </>
              ) : (
                <>
                  <SparklesIcon />
                  Finish Video (Creatomate)
                </>
              )}
            </button>
          </div>

          {/* Final Video Loading / Status State */}
          {isGeneratingFinalVideo && (
            <div className="sd-status-box sd-status-loading" id="status-final-video-loading">
              <div className="sd-spinner-lg" style={{ borderColor: '#ec4899', borderTopColor: 'transparent' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.2rem' }}>
                  Rendering Finished Social Video via Creatomate...
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Overlaying Headline &amp; CTA onto 9:16 Veo footage. This takes 10-20 seconds.
                </div>
              </div>
            </div>
          )}

          {/* Final Video Error State */}
          {finalVideoError && (
            <div className="sd-status-box sd-status-error" id="status-final-video-error">
              <AlertTriangleIcon />
              <div>
                <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '0.2rem' }}>
                  Creatomate Rendering Failed
                </div>
                <div style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
                  {finalVideoError}
                </div>
              </div>
            </div>
          )}

          {/* Server Preserved Final Video History List */}
          {historyFinalVideos.length > 0 && (
            <div className="sd-history-section">
              <h3 className="sd-history-title">Server Preserved Final Videos ({historyFinalVideos.length})</h3>
              <div className="sd-history-grid">
                {historyFinalVideos.map(item => {
                  const itemUrl = item.public_url || item.url
                  const isSelected = generatedFinalVideo?.id === item.id
                  const displaySubject = item.subject || 'Untitled Video'
                  const displayRatio = item.aspect_ratio || item.aspectRatio || '9:16'

                  return (
                    <div
                      key={item.id}
                      className={`sd-history-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setGeneratedFinalVideo({
                        id: item.id,
                        url: itemUrl,
                        subject: displaySubject,
                        aspectRatio: displayRatio,
                        headline: item.headline,
                        cta: item.cta,
                        sourceVideoId: item.source_video_id,
                        renderId: item.render_id,
                        createdAt: item.created_at
                      })}
                    >
                      <button
                        type="button"
                        className="sd-history-delete-btn"
                        title="Delete preserved final video"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFinalVideo(item.id)
                        }}
                      >
                        &times;
                      </button>
                      <video src={itemUrl} className="sd-history-thumb" style={{ objectFit: 'cover' }} muted preload="metadata" />
                      <div className="sd-history-meta">
                        <div className="sd-history-name">{displaySubject}</div>
                        <div className="sd-history-fmt" style={{ color: '#ec4899' }}>FINAL VID &middot; {displayRatio}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Display Generated Final Video Output */}
        <div className="sd-card sd-display-panel">
          <div className="sd-card-header" style={{ color: '#ec4899' }}>
            <VideoIcon />
            <h2 className="sd-card-title">Finished Video Output (Creatomate)</h2>
          </div>

          {generatedFinalVideo ? (
            <div className="sd-preview-container" id="container-generated-final-video">
              <div className="sd-preview-badge" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
                <CheckCircleIcon />
                <span>Creatomate MP4 Rendered &amp; Saved Server-Side</span>
              </div>
              <div className="sd-video-wrapper">
                <video
                  id="video-generated-final-output"
                  src={generatedFinalVideo.url}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="sd-rendered-video"
                />
              </div>
              <div className="sd-meta-card">
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Subject:</span>
                  <span className="sd-meta-val" style={{ fontWeight: 700, color: '#ec4899' }}>{generatedFinalVideo.subject || 'Untitled Video'}</span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Aspect Ratio:</span>
                  <span className="sd-meta-val"><code className="sd-code">{generatedFinalVideo.aspectRatio || '9:16'}</code></span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Headline:</span>
                  <span className="sd-meta-val">&ldquo;{generatedFinalVideo.headline}&rdquo;</span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">CTA Text:</span>
                  <span className="sd-meta-val">&ldquo;{generatedFinalVideo.cta}&rdquo;</span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Provider:</span>
                  <span className="sd-meta-val"><code className="sd-code">Creatomate API</code></span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Render ID:</span>
                  <span className="sd-meta-val"><code className="sd-code">{generatedFinalVideo.renderId || 'c21074...'}</code></span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Video ID:</span>
                  <span className="sd-meta-val"><code className="sd-code">{generatedFinalVideo.id}</code></span>
                </div>
                <div className="sd-meta-row">
                  <span className="sd-meta-label">Server Path:</span>
                  <span className="sd-meta-val"><a href={generatedFinalVideo.url} target="_blank" rel="noopener noreferrer" style={{ color: '#ec4899', textDecoration: 'underline' }}>{generatedFinalVideo.url}</a></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="sd-empty-display" id="container-empty-final-video-output">
              <div className="sd-empty-icon-bg" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                <VideoIcon />
              </div>
              <h3 style={{ margin: '0 0 0.4rem 0', color: '#f8fafc', fontSize: '1.1rem' }}>No Finished Video Rendered Yet</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', maxWidth: '320px' }}>
                Select a Veo video above, enter Headline and CTA text, then click &ldquo;Finish Video (Creatomate)&rdquo;.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

