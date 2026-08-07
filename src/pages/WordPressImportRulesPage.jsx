import './WordPressImportRulesPage.css'

const EXCLUDED_PAGES_LIST = [
  'Privacy Policy',
  'Cookie Policy',
  'Terms & Conditions',
  'Accessibility',
  'Sitemap',
  'XML Sitemap',
  'RSS Feed',
  'Feed URLs',
  'Search Results',
  'Author Archives',
  'Date Archives',
  'Attachment Pages',
  '404 Page',
  'Thank You Pages',
  'Cart',
  'Checkout',
  'My Account',
  'Login',
  'Register',
  'Lost Password',
]

const WP_OBJECT_TYPES = [
  'Page',
  'Post',
  'Category',
  'Tag',
  'Author',
  'Archive',
  'Attachment',
  'Custom Post Type',
  'Other',
]

const FUTURE_RULES_PLACEHOLDERS = [
  { title: 'Automatic Page Classification', desc: 'Auto-classify imported pages by content depth, hierarchy, and URL patterns.' },
  { title: 'Target Phrase Rules', desc: 'Rules for inferring target search phrases automatically upon import.' },
  { title: 'Priority Rules', desc: 'Set default page priorities based on page depth and traffic potential.' },
  { title: 'Folder Rules', desc: 'Group pages automatically into logical site folders and categories.' },
  { title: 'Custom Exclusion Rules', desc: 'Define custom URL regex or keyword matching exclusion rules.' },
  { title: 'AI Classification Rules', desc: 'Leverage AI model recommendations for initial page tags and categories.' },
]

export default function WordPressImportRulesPage() {
  return (
    <div className="import-rules-container">

      {/* Header */}
      <div className="ir-header">
        <h2 className="ir-title">WordPress Import Rules</h2>
        <p className="ir-subtitle">
          Central location for all Website Manager import rules. Controls how pages are initially imported and classified. These are Website Manager rules, not WordPress rules.
        </p>
      </div>

      {/* Section 1: Automatically Exclude These Pages */}
      <div className="ir-card">
        <div className="ir-card-header">
          <h3 className="ir-card-title">1. Automatically Exclude These Pages</h3>
          <span className="ir-card-badge">Active Rule Set</span>
        </div>
        <p className="ir-card-desc">
          Pages matching any item in this list are automatically assigned the <strong>Excluded</strong> status upon import.
        </p>

        <div className="ir-grid-list">
          {EXCLUDED_PAGES_LIST.map((item, idx) => (
            <div key={idx} className="ir-rule-item">
              <span className="ir-rule-icon">🚫</span>
              <span className="ir-rule-label">{item}</span>
              <span className="ir-rule-status">Auto-Excluded</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Default Include Rule */}
      <div className="ir-card">
        <div className="ir-card-header">
          <h3 className="ir-card-title">2. Default Include Rule</h3>
          <span className="ir-card-badge badge-green">Default Rule</span>
        </div>
        <p className="ir-card-desc">
          All imported pages not matching an exclusion rule default to:
        </p>
        <div className="ir-default-box">
          <span className="ir-default-pill">Included</span>
          <span className="ir-default-text">Ready for classification and optimization</span>
        </div>
      </div>

      {/* Section 3: WordPress Object Types */}
      <div className="ir-card">
        <div className="ir-card-header">
          <h3 className="ir-card-title">3. WordPress Object Types</h3>
          <span className="ir-card-badge badge-blue">Reference List</span>
        </div>
        <p className="ir-card-desc">
          Supported WordPress object types mapped during import:
        </p>

        <div className="ir-tags-flex">
          {WP_OBJECT_TYPES.map((type, idx) => (
            <div key={idx} className="ir-type-tag">
              {type}
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Future Import Rules */}
      <div className="ir-card">
        <div className="ir-card-header">
          <h3 className="ir-card-title">4. Future Import Rules</h3>
          <span className="ir-card-badge badge-amber">Placeholder</span>
        </div>
        <p className="ir-card-desc">
          Upcoming configuration settings for future milestones:
        </p>

        <div className="ir-placeholder-grid">
          {FUTURE_RULES_PLACEHOLDERS.map((rule, idx) => (
            <div key={idx} className="ir-placeholder-card">
              <div className="ir-ph-header">
                <span className="ir-ph-title">{rule.title}</span>
                <span className="ir-ph-lock">🔒 Soon</span>
              </div>
              <p className="ir-ph-desc">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
