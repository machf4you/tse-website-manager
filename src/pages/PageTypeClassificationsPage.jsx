import { useState } from 'react'
import './PageTypeClassificationsPage.css'

const DEFAULT_DOCUMENT_CONTENT = `==================================================
Website Manager Page Classification Rules & Standards
==================================================

CORE CLASSIFICATION PRINCIPLE:
"Page classification is based on SEO purpose, not simply on the technical type of page. Website Manager should classify pages according to their intended search and commercial role. Technical page type, URL structure or CMS type may provide evidence, but must not by itself determine the SEO classification."

--------------------------------------------------
1. PAGE TYPES & DEFINITIONS
--------------------------------------------------
These are SEO / page-management classifications within Website Manager. They are NOT WordPress post types and NOT Magento entity types.

- EXCLUDED:
  A page that should not be managed as an SEO target within Website Manager because it exists primarily for website operation, compliance, account management, navigation/filtering or other non-SEO purposes.

- HUB:
  The primary high-level page for a website or major content structure. Normally the homepage is classified as Hub.

- LANDING:
  A commercial page designed to rank for a search term and generate enquiries, leads, sales or conversions.

- TOPICAL:
  Supporting informational content designed to build topical authority, answer questions and support commercial Landing pages through internal linking.

- ARTICLE:
  A genuine article/blog-style content page. Article pages are informational content but are separately identified where the source/site structure indicates that the page is an actual article.

- UNCLASSIFIED:
  A page where the system does not have enough confidence to assign a meaningful SEO classification.
  (IMPORTANT: Do not force uncertain pages into Landing, Topical or Article.)

--------------------------------------------------
2. EXCLUDED PAGES POLICY
--------------------------------------------------
LEGAL / POLICY:
- Privacy Policy
- Cookie Policy
- Terms & Conditions
- Terms of Service
- Disclaimer
- Accessibility Statement
- Returns Policy
- Orders & Returns
- Delivery Information
- Delivery Details
- Payment Information
- Finance
- Price Match
- Pay Later With Klarna

WEBSITE UTILITY / COMPANY INFORMATION:
- About Us
- Contact Us
- Customer Service
- Thank You pages
- Confirmation pages
- Search results pages
- 404 pages
- Login pages
- Register pages
- Lost Password pages
- My Account pages
- Enable Cookies
- Further Resources

WORDPRESS / SYSTEM PAGES:
- Author archive pages
- Date archive pages
- Category archive pages unless specifically being used as genuine SEO landing pages
- Tag archive pages
- Attachment pages
- Media attachment URLs
- Feed pages
- RSS feeds
- XML feeds

ECOMMERCE / TRANSACTION:
- Cart
- Checkout
- Basket
- Account
- Wishlist
- Compare pages

OTHER NON-SEO PAGES:
- Internal search pages
- Duplicate/system-generated pages
- Test pages
- Draft/private pages
- Staging pages
- Empty pages with no meaningful content

BUSINESS / SUPPORT / NON-SEO CONTENT:
- Partners
- Testimonials
- Store / showroom information pages
- FAQ / FAQs where they are being used as customer-service/support pages rather than genuine SEO informational content

IMPORTANT EXCLUSION PRINCIPLE:
If a page exists purely for website operation, compliance, account management, transaction processing, customer service, navigation/filtering or system functionality, it should normally be Excluded.
However: If a page has a genuine search purpose and is intentionally being used as an SEO target, it should NOT automatically be excluded merely because of its name or URL.

--------------------------------------------------
3. FILTER / SHOP-BY PAGES
--------------------------------------------------
Pages such as:
- Shop By Size
- Shop By Bed Size
- Shop By Type
- Shop By Headboard Type
- Shop By Headboard Size
- Shop By Mattress Type
- Shop By Mattress Size
- Shop By Divan Type
- Shop By Divan Size
- or similar filter/navigation pages

are NOT automatically treated as normal commercial Landing pages.
They are often navigation/filter mechanisms rather than standalone SEO targets.
They should therefore be reviewed manually and may be classified as:
- Excluded  OR
- Unclassified
depending on whether the specific page has a genuine independent search purpose. Do not automatically classify every ecommerce category/filter page as a Landing page simply because it contains commercial keywords.

--------------------------------------------------
4. LANDING PAGES
--------------------------------------------------
Definition:
A Landing page is a page designed to rank for a commercial search term and generate enquiries, leads, sales or conversions.

Examples:
- Main service pages (/loft-conversions/, /house-extensions/)
- Service variation pages (/bathroom-installations/)
- Location pages (/builders-surrey/, /kitchen-fitters-london/)
- Service + location pages
- Commercial category pages (/beds/, /memory-foam-beds/, /ottoman-beds/)
- Ecommerce category pages with genuine search intent
- Pages targeting a primary customer search term

Purpose:
Capture commercial search demand and convert visitors.

For Magento / Ecommerce:
Active genuine commercial category pages can be classified as Landing. Administrative/root/container categories and filter/navigation pages should not automatically be treated as Landing.

--------------------------------------------------
5. TOPICAL PAGES
--------------------------------------------------
Definition:
A Topical page is supporting informational content designed to build authority, answer questions and support Landing pages through internal linking.

Examples:
- Knowledge Hub articles
- Guides & Buying guides ("Types of Mattresses Explained", "Best Mattress for Back Pain")
- Advice pages ("How much value does a loft conversion add?")
- Informational resources ("Do I need planning permission for a house extension?")
- Educational content ("Best types of home extensions")
- Supporting content & Informational CMS pages

Purpose:
Build topical authority and support commercial Landing pages.

--------------------------------------------------
6. ARTICLE PAGES
--------------------------------------------------
Definition:
An Article is a genuine blog/article-style content page. Article pages are informational and can support Landing pages through internal linking.

Guidance:
Use Article where the source data clearly identifies the content as an article/blog post or where the page is clearly structured and intended as an article. Do NOT automatically classify every informational page as Article. Article and Topical are separate SEO classifications.

--------------------------------------------------
7. HUB PAGES
--------------------------------------------------
Definition:
A Hub is a high-level page that acts as the main authority/entry point for a website or major subject structure.

Automatic Rule:
- Homepage -> Hub
The homepage should normally remain Hub unless there is a specific manual override.

--------------------------------------------------
8. AUTOMATIC CLASSIFICATION LOGIC
--------------------------------------------------
Classification priority order:
1. Excluded rules
2. Homepage / Hub rule
3. Explicit Article identification where supported by source data
4. Genuine commercial intent -> Landing
5. Genuine informational/supporting intent -> Topical
6. Anything uncertain -> Unclassified

IMPORTANT:
Do NOT force a classification when confidence is low.
Do NOT classify solely from:
- WordPress post type
- Magento entity type
- URL structure
- Page title alone

Classification should use the available page information and established rules.

--------------------------------------------------
9. MAGENTO-SPECIFIC CLASSIFICATION
--------------------------------------------------
Magento pages use the same common Website Manager SEO classification framework:
- Homepage -> Hub
- Active genuine ecommerce category pages at relevant category levels -> Landing
- Genuine informational CMS content -> Topical or Article depending on content/source type
- Root / container categories -> Excluded
- Inactive categories -> Excluded
- Utility / policy / support pages -> Excluded
- Shop By / filter / navigation pages -> manually reviewed and may be Excluded or Unclassified

Do NOT create a separate Magento classification system. Magento pages use the exact same common Website Manager SEO classification framework.`

const DEFAULT_COMMENTS = [
  {
    id: 'c4',
    author: 'System Admin',
    timestamp: '18-08-2026 10:00',
    text: 'Updated classification documentation (v1.30): Documented core SEO purpose principle, 6 page types, full exclusion categories, Shop By/filter manual review rules, and Magento common framework integration.'
  },
  {
    id: 'c3',
    author: 'System Admin',
    timestamp: '07-08-2026 14:10',
    text: 'Reclassified /about-us/ and /contact-us/ as Excluded pages, and updated global Website Manager rules to auto-exclude About Us and Contact pages for all future websites.'
  },
  {
    id: 'c2',
    author: 'System Admin',
    timestamp: '07-08-2026 14:07',
    text: 'Expanded Excluded Pages rules: Legal/Policy, Utility, System, Ecommerce, and Non-SEO operational pages.'
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
      const saved = localStorage.getItem('tse_page_type_classifications_doc_v1.30') || localStorage.getItem('tse_page_type_classifications_doc_v1')
      // If saved content is old default, use updated DEFAULT_DOCUMENT_CONTENT
      if (saved && !saved.includes('CORE CLASSIFICATION PRINCIPLE')) {
        return DEFAULT_DOCUMENT_CONTENT
      }
      if (saved !== null) return saved
    } catch (e) {
      console.error('Failed to load classifications document:', e)
    }
    return DEFAULT_DOCUMENT_CONTENT
  })

  const [comments, setComments] = useState(() => {
    try {
      const saved = localStorage.getItem('tse_page_type_classifications_comments_v1.30') || localStorage.getItem('tse_page_type_classifications_comments_v1')
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
      localStorage.setItem('tse_page_type_classifications_doc_v1.30', docContent)
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
        localStorage.setItem('tse_page_type_classifications_doc_v1.30', DEFAULT_DOCUMENT_CONTENT)
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
      localStorage.setItem('tse_page_type_classifications_comments_v1.30', JSON.stringify(updated))
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
            rows={26}
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
