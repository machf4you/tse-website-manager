import { useState } from 'react'
import './PageTypeClassificationsPage.css'

const DEFAULT_DOCUMENT_CONTENT = `Website Manager Page Classification Rules

The existing classifications are:
- Excluded
- Hub
- Unclassified

Add the following classifications:
- Landing
- Topical

These classifications are SEO classifications, NOT WordPress post types.

----------------------------------------
Excluded Pages
----------------------------------------

These should automatically be classified as Excluded because they are normally not SEO management targets:

1. Legal / Policy Pages
- Privacy Policy
- Cookie Policy
- Terms & Conditions
- Terms of Service
- Disclaimer
- Accessibility Statement

2. Website Utility Pages
- Contact page (depending on site strategy)
- Thank You pages
- Confirmation pages
- Search results pages
- 404 page
- Login pages
- Register pages
- Lost Password pages
- My Account pages

3. WordPress/System Pages
- Author archive pages
- Date archive pages
- Category archive pages (unless specifically used as SEO landing pages)
- Tag archive pages
- Attachment pages
- Media attachment URLs
- Feed pages
- RSS feeds
- XML feeds

4. Ecommerce / Transaction Pages
- Cart
- Checkout
- Basket
- Account
- Wishlist
- Compare pages

5. Other Non-SEO Pages
- Internal search pages
- Duplicate/system-generated pages
- Test pages
- Draft/private pages
- Staging pages
- Empty pages with no meaningful content

Rule:
If a page exists purely for website operation, compliance, account management, or system functionality, it should be Excluded.
If it has a genuine search purpose, it should not be excluded and should remain available for Hub / Landing / Topical classification.

----------------------------------------
Landing Pages
----------------------------------------

Definition:
A Landing page is a page designed to rank for a commercial search term and generate enquiries, leads, sales, or conversions.

Classify a page as Landing when it matches commercial search intent, including:
- Main service pages
- Service variation pages
- Location pages
- Service + location pages
- Commercial category pages
- Pages targeting a primary customer search term

Examples:
- /loft-conversions/
- /house-extensions/
- /builders-surrey/
- /bathroom-installations/
- /kitchen-fitters-london/

Purpose:
Capture search demand and convert visitors.

----------------------------------------
Topical Pages
----------------------------------------

Definition:
A Topical page is supporting content designed to build authority, answer questions, and support Landing pages through internal linking.

Classify a page as Topical when it matches informational search intent, including:
- Blog articles
- Knowledge Hub articles
- Guides
- FAQs
- Advice pages
- Informational resources
- Supporting content
- Educational articles

Examples:
- "How much value does a loft conversion add?"
- "Do I need planning permission for a house extension?"
- "Best types of home extensions"

Purpose:
Build topical authority and support commercial Landing pages.

----------------------------------------
Classification Rules
----------------------------------------

Automatic rules:
1. Homepage: Always classify as Hub
2. Excluded pages: Remain Excluded
3. Commercial intent pages: Classify Landing
4. Informational/supporting content: Classify Topical
5. Anything uncertain: Remain Unclassified

Do NOT force a classification if confidence is low.
Do NOT classify based only on WordPress post type, URL structure alone, or Page name alone.`

const DEFAULT_COMMENTS = [
  {
    id: 'c2',
    author: 'System Admin',
    timestamp: '07-08-2026 14:07',
    text: 'Expanded Excluded Pages rules: Legal/Policy (Privacy, Cookies, Terms, Disclaimer, Accessibility), Utility (Thank You, Confirmation, Search, 404, Login, Register), System (Author, Date, Tag archives, Attachment, Feed, RSS), Ecommerce (Cart, Checkout, Basket, Wishlist, Compare), and Non-SEO operational pages.'
  },
  {
    id: 'c1',
    author: 'System Admin',
    timestamp: '07-08-2026 14:00',
    text: 'Initial implementation of Landing, Topical, Hub, Excluded, and Unclassified classification rules (v1.0).'
  }
]

export default function PageTypeClassificationsPage() {
  const [docContent, setDocContent] = useState(() => {
    try {
      const saved = localStorage.getItem('tse_page_type_classifications_doc_v1')
      if (saved !== null) return saved
    } catch (e) {
      console.error('Failed to load classifications document:', e)
    }
    return DEFAULT_DOCUMENT_CONTENT
  })

  const [comments, setComments] = useState(() => {
    try {
      const saved = localStorage.getItem('tse_page_type_classifications_comments_v1')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.error('Failed to load classification comments:', e)
    }
    return DEFAULT_COMMENTS
  })

  const [newComment, setNewComment] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  const handleSaveDoc = () => {
    try {
      localStorage.setItem('tse_page_type_classifications_doc_v1', docContent)
      setSaveMessage('Saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (e) {
      console.error('Failed to save classifications document:', e)
      setSaveMessage('Save failed.')
    }
  }

  const handleResetDoc = () => {
    if (window.confirm('Reset classification document back to default rules?')) {
      setDocContent(DEFAULT_DOCUMENT_CONTENT)
      try {
        localStorage.setItem('tse_page_type_classifications_doc_v1', DEFAULT_DOCUMENT_CONTENT)
        setSaveMessage('Reset to defaults.')
        setTimeout(() => setSaveMessage(''), 3000)
      } catch (e) {
        console.error('Failed to reset document:', e)
      }
    }
  }

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const now = new Date()
    const dd = String(now.getDate()).padStart(2, '0')
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const yyyy = now.getFullYear()
    const hh = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')

    const commentObj = {
      id: `c_${Date.now()}`,
      author: 'User',
      timestamp: `${dd}-${mm}-${yyyy} ${hh}:${min}`,
      text: newComment.trim()
    }

    const updated = [commentObj, ...comments]
    setComments(updated)
    setNewComment('')

    try {
      localStorage.setItem('tse_page_type_classifications_comments_v1', JSON.stringify(updated))
    } catch (err) {
      console.error('Failed to save comment:', err)
    }
  }

  return (
    <div className="ptc-container">

      {/* Header */}
      <div className="ptc-header">
        <div>
          <h1 className="ptc-title">Page Type Classifications</h1>
          <p className="ptc-subtitle">
            Central definition, intent rules, and historical record for Website Manager SEO Page Type classifications.
          </p>
        </div>

        <div className="ptc-header-actions">
          {saveMessage && <span className="ptc-save-msg">{saveMessage}</span>}
          <button
            type="button"
            className="ptc-btn-secondary"
            onClick={handleResetDoc}
            id="btn-reset-ptc-doc"
          >
            Reset Default
          </button>
          <button
            type="button"
            className="ptc-btn-primary"
            onClick={handleSaveDoc}
            id="btn-save-ptc-doc"
          >
            Save Rules
          </button>
        </div>
      </div>

      {/* Freehand Document Editor */}
      <div className="ptc-card">
        <div className="ptc-card-header">
          <span className="ptc-card-title">Classification Rules Document</span>
          <span className="ptc-badge-editable">Editable Freehand Document</span>
        </div>
        <div className="ptc-card-body">
          <textarea
            className="ptc-editor"
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
            placeholder="Type or update classification rules..."
            rows={22}
            id="ptc-doc-editor"
          />
        </div>
      </div>

      {/* Additional Comments & Log History */}
      <div className="ptc-card ptc-comments-card">
        <div className="ptc-card-header">
          <span className="ptc-card-title">Additional Comments & History</span>
          <span className="ptc-comments-count">{comments.length} Logged</span>
        </div>

        <div className="ptc-card-body">

          {/* Add New Comment */}
          <form onSubmit={handleAddComment} className="ptc-comment-form">
            <input
              type="text"
              className="ptc-comment-input"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add additional comment or classification note..."
              id="input-new-comment"
            />
            <button
              type="submit"
              className="ptc-btn-primary"
              id="btn-add-comment"
            >
              Add Comment
            </button>
          </form>

          {/* History Log */}
          <div className="ptc-comments-list">
            {comments.map((comment) => (
              <div key={comment.id} className="ptc-comment-item">
                <div className="ptc-comment-meta">
                  <span className="ptc-author">{comment.author}</span>
                  <span className="ptc-time">{comment.timestamp}</span>
                </div>
                <div className="ptc-comment-text">{comment.text}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  )
}
