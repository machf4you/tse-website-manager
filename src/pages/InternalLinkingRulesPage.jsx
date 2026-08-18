import './InternalLinkingRulesPage.css'

export default function InternalLinkingRulesPage() {
  return (
    <div className="ilr-page-container">

      {/* Header */}
      <div className="ilr-header">
        <div>
          <span className="ilr-pill-badge">SEO ARCHITECTURE REFERENCE</span>
          <h1 className="ilr-title">Internal Linking Rules</h1>
          <p className="ilr-subtitle">
            Internal linking rules define how Website Manager evaluates and recommends contextual internal links between managed SEO pages. These rules are based on page classification and SEO hierarchy, not on the underlying CMS or platform.
          </p>
        </div>
      </div>

      {/* Prominent Core Principles Box */}
      <div className="ilr-principles-card">
        <div className="ilr-principles-header">
          <span className="ilr-principles-badge">CORE LINKING PRINCIPLES</span>
          <h2 className="ilr-principles-title">Fundamental Internal Linking Principles</h2>
        </div>
        <div className="ilr-principles-grid">
          <div className="ilr-principle-item">
            <span className="ilr-principle-quote">"Three incoming links is the minimum health threshold, not the desired maximum or a mandatory fixed number."</span>
          </div>
          <div className="ilr-principle-item">
            <span className="ilr-principle-quote">"Internal-link recommendations should be driven by relevance and page hierarchy rather than simply adding links to reach a numerical target."</span>
          </div>
        </div>
      </div>

      {/* Section 1: Incoming Link Requirement */}
      <div className="ilr-card">
        <div className="ilr-card-header">
          <span className="ilr-card-num">1</span>
          <h3 className="ilr-card-title">Incoming Link Requirement</h3>
          <span className="ilr-card-badge badge-green">Standard Rule</span>
        </div>
        <p className="ilr-card-desc">
          The current Website Manager standard is a <strong>Minimum of 3 incoming internal links</strong> for all active SEO page types:
        </p>
        <div className="ilr-tags-flex">
          <span className="ilr-type-tag tag-green">Hub</span>
          <span className="ilr-type-tag tag-blue">Landing</span>
          <span className="ilr-type-tag tag-yellow">Topical</span>
          <span className="ilr-type-tag tag-purple">Article</span>
        </div>
        <ul className="ilr-bullet-list">
          <li>A page with fewer than 3 incoming contextual internal links is considered to need additional internal links.</li>
          <li>3 or more incoming links satisfies the current health minimum.</li>
          <li>There is currently <strong>NO maximum incoming-link threshold</strong>.</li>
          <li>The 3-link figure is a minimum requirement, <strong>NOT a fixed target</strong>. The recommendation engine dynamically identifies relevant pages that could provide additional internal links.</li>
        </ul>
      </div>

      {/* Section 2: Recommendation Limits */}
      <div className="ilr-card">
        <div className="ilr-card-header">
          <span className="ilr-card-num">2</span>
          <h3 className="ilr-card-title">Recommendation Limits & Dynamic Candidate Matching</h3>
          <span className="ilr-card-badge badge-blue">Engine Logic</span>
        </div>
        <div className="ilr-limits-grid">
          <div className="ilr-limit-box">
            <div className="ilr-limit-label">TARGET PAGE LIMIT</div>
            <div className="ilr-limit-val">Up to 5 candidate source pages</div>
            <div className="ilr-limit-sub">Recommended per destination target URL</div>
          </div>
          <div className="ilr-limit-box">
            <div className="ilr-limit-label">SOURCE PAGE LIMIT</div>
            <div className="ilr-limit-val">Up to 3 target pages</div>
            <div className="ilr-limit-sub">Recommended from an individual source page</div>
          </div>
        </div>
        <div className="ilr-two-col">
          <div>
            <h4 className="ilr-subhead">Evaluation Criteria</h4>
            <ul className="ilr-bullet-list">
              <li>Existing internal links</li>
              <li>Page classification & SEO hierarchy</li>
              <li>Target phrase & primary keywords</li>
              <li>Page title & URL slug</li>
              <li>Semantic keyword / token overlap score</li>
              <li>Page priority (Priority 1 $\rightarrow$ 2 $\rightarrow$ 3 $\rightarrow$ 4)</li>
              <li>Existing source $\rightarrow$ target relationships</li>
            </ul>
          </div>
          <div>
            <h4 className="ilr-subhead">Automatic Exclusion Rules</h4>
            <ul className="ilr-bullet-list">
              <li>Self-links (source page cannot link to itself)</li>
              <li>Source pages ALREADY linking to the target page</li>
              <li>Excluded pages (legal, policy, utility)</li>
              <li>Unclassified pages (confidence too low)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 3: Page Hierarchy */}
      <div className="ilr-card">
        <div className="ilr-card-header">
          <span className="ilr-card-num">3</span>
          <h3 className="ilr-card-title">Page Hierarchy & Directional Relationships</h3>
          <span className="ilr-card-badge badge-purple">SEO Flow</span>
        </div>
        <p className="ilr-card-desc">
          Internal linking follows the SEO hierarchy of page classifications. The purpose is to distribute authority through the site while directing supporting content towards important commercial pages:
        </p>
        <div className="ilr-flow-diagram">
          <div className="ilr-flow-node hub-node">HUB PAGE (Priority 1)</div>
          <div className="ilr-flow-arrow">▲ / ▼</div>
          <div className="ilr-flow-node landing-node">LANDING PAGES (Priority 2)</div>
          <div className="ilr-flow-arrow">▲</div>
          <div className="ilr-flow-node topical-node">TOPICAL / ARTICLE PAGES (Priority 3 & 4)</div>
        </div>

        <table className="ilr-table">
          <thead>
            <tr>
              <th>Source Page Type</th>
              <th>Allowed Target Page Types</th>
              <th>Hierarchy Rule & Intent</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="ilr-type-tag tag-purple">ARTICLE</span></td>
              <td><code>Landing</code>, <code>Hub</code></td>
              <td>Article pages should link up to Landing and Hub pages.</td>
            </tr>
            <tr>
              <td><span className="ilr-type-tag tag-yellow">TOPICAL</span></td>
              <td><code>Landing</code>, <code>Hub</code></td>
              <td>Topical pages should link up to Landing and Hub pages.</td>
            </tr>
            <tr>
              <td><span className="ilr-type-tag tag-blue">LANDING</span></td>
              <td><code>Hub</code>, <code>Related Landing</code></td>
              <td>Landing pages should link up to Hub pages or across to related Landing pages.</td>
            </tr>
            <tr>
              <td><span className="ilr-type-tag tag-green">HUB</span></td>
              <td><code>Landing</code>, <code>Topical</code></td>
              <td>Hub pages should link down to Landing and Topical pages.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 4: Hub Pages */}
      <div className="ilr-card">
        <div className="ilr-card-header">
          <span className="ilr-card-num">4</span>
          <h3 className="ilr-card-title">Hub Pages</h3>
          <span className="ilr-type-tag tag-green">Priority 1</span>
        </div>
        <ul className="ilr-bullet-list">
          <li><strong>Role:</strong> High-level authority / entry page (normally the homepage).</li>
          <li><strong>Minimum Requirement:</strong> 3 incoming links.</li>
          <li><strong>Recommendations:</strong> Up to 5 relevant candidate source pages (from Article, Topical, or Landing pages).</li>
          <li><strong>Outgoing Direction:</strong> Hub pages can also link down to relevant Landing and Topical pages.</li>
        </ul>
      </div>

      {/* Section 5: Landing Pages */}
      <div className="ilr-card">
        <div className="ilr-card-header">
          <span className="ilr-card-num">5</span>
          <h3 className="ilr-card-title">Landing Pages</h3>
          <span className="ilr-type-tag tag-blue">Priority 2</span>
        </div>
        <ul className="ilr-bullet-list">
          <li><strong>Role:</strong> Commercial SEO targets designed to rank for commercial search terms and generate enquiries, leads, sales, or conversions.</li>
          <li><strong>Minimum Requirement:</strong> 3 incoming links.</li>
          <li><strong>Recommendations:</strong> Up to 5 relevant candidate source pages (from Article, Topical, Hub, or Related Landing pages).</li>
          <li><strong>Authority Destination:</strong> Landing pages are a major destination for authority passed from supporting content.</li>
          <li><strong>Outgoing Direction:</strong> Landing pages can also link UP to the Hub or ACROSS to relevant related Landing pages.</li>
        </ul>
      </div>

      {/* Section 6: Topical Pages */}
      <div className="ilr-card">
        <div className="ilr-card-header">
          <span className="ilr-card-num">6</span>
          <h3 className="ilr-card-title">Topical Pages</h3>
          <span className="ilr-type-tag tag-yellow">Priority 3</span>
        </div>
        <ul className="ilr-bullet-list">
          <li><strong>Role:</strong> Supporting informational content designed to build topical authority and support commercial Landing pages.</li>
          <li><strong>Minimum Requirement:</strong> 3 incoming links.</li>
          <li><strong>Recommendations:</strong> Up to 5 relevant candidate source pages (receives from Hub or other relevant Topical pages).</li>
          <li><strong>Outgoing Direction:</strong> Topical pages should generally link UP towards relevant Landing pages and the Hub.</li>
        </ul>
      </div>

      {/* Section 7: Article Pages */}
      <div className="ilr-card">
        <div className="ilr-card-header">
          <span className="ilr-card-num">7</span>
          <h3 className="ilr-card-title">Article Pages</h3>
          <span className="ilr-type-tag tag-purple">Priority 4</span>
        </div>
        <ul className="ilr-bullet-list">
          <li><strong>Role:</strong> Genuine blog / article-style informational content.</li>
          <li><strong>Minimum Requirement:</strong> 3 incoming links.</li>
          <li><strong>Recommendations:</strong> Up to 5 relevant candidate source pages.</li>
          <li><strong>Outgoing Direction:</strong> Articles should generally link UP towards relevant Landing pages and the Hub.</li>
        </ul>
      </div>

      {/* Section 8 & 9: Excluded & Unclassified Pages */}
      <div className="ilr-two-col">
        <div className="ilr-card" style={{ margin: 0 }}>
          <div className="ilr-card-header">
            <span className="ilr-card-num">8</span>
            <h3 className="ilr-card-title">Excluded Pages</h3>
            <span className="ilr-card-badge badge-red">Requirement: 0</span>
          </div>
          <p className="ilr-card-desc">
            Excluded pages do <strong>NOT</strong> participate in active internal-linking calculations.
          </p>
          <ul className="ilr-bullet-list">
            <li>Do not require incoming SEO links.</li>
            <li>Are not recommended as internal-link targets.</li>
            <li>Are not used as active internal-link sources.</li>
          </ul>
        </div>

        <div className="ilr-card" style={{ margin: 0 }}>
          <div className="ilr-card-header">
            <span className="ilr-card-num">9</span>
            <h3 className="ilr-card-title">Unclassified Pages</h3>
            <span className="ilr-card-badge badge-amber">Requirement: 0</span>
          </div>
          <p className="ilr-card-desc">
            Unclassified pages do <strong>NOT</strong> participate in active internal-linking calculations until they receive a meaningful SEO classification.
          </p>
          <ul className="ilr-bullet-list">
            <li>Do NOT force an Unclassified page into the linking hierarchy simply to create a link.</li>
          </ul>
        </div>
      </div>

      {/* Section 10: Contextual Linking */}
      <div className="ilr-card">
        <div className="ilr-card-header">
          <span className="ilr-card-num">10</span>
          <h3 className="ilr-card-title">Contextual Linking Standards</h3>
          <span className="ilr-card-badge badge-blue">Placement Rule</span>
        </div>
        <p className="ilr-card-desc">
          The system is intended to recommend <strong>CONTEXTUAL</strong> internal links. Links must be placed within meaningful page body content rather than template/chrome areas:
        </p>
        <div className="ilr-two-col">
          <div>
            <h4 className="ilr-subhead" style={{ color: '#10b981' }}>✓ Allowed Body Placements</h4>
            <ul className="ilr-bullet-list">
              <li>Paragraph body text (<code>&lt;p&gt;</code>)</li>
              <li>Article & section content blocks</li>
              <li>Informational list items (<code>&lt;li&gt;</code>)</li>
            </ul>
          </div>
          <div>
            <h4 className="ilr-subhead" style={{ color: '#ef4444' }}>✕ Excluded Chrome Areas</h4>
            <ul className="ilr-bullet-list">
              <li>Header navigation & top bars</li>
              <li>Main navigation menus & breadcrumbs</li>
              <li>Footer links & copyright notices</li>
              <li>Sidebar widgets & form wrappers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 11: Relevance Engine */}
      <div className="ilr-card">
        <div className="ilr-card-header">
          <span className="ilr-card-num">11</span>
          <h3 className="ilr-card-title">Relevance & Candidate Scoring</h3>
          <span className="ilr-card-badge badge-purple">Scoring Algorithm</span>
        </div>
        <p className="ilr-card-desc">
          Recommendations are NOT selected randomly. The system evaluates candidate source pages using a weighted relevance scoring algorithm:
        </p>
        <ul className="ilr-bullet-list">
          <li><strong>Target Phrase Token Match:</strong> Highest weight (+50 pts per token overlap).</li>
          <li><strong>Title & Target Phrase Overlap:</strong> (+30 pts per token overlap).</li>
          <li><strong>Title Word Overlap:</strong> (+15 pts per token overlap).</li>
          <li><strong>URL Slug Overlap:</strong> (+10 pts per token overlap).</li>
          <li><strong>Hub Priority Bonus:</strong> (+5 pts base weight).</li>
        </ul>
      </div>

      {/* Section 13: Platform Independence */}
      <div className="ilr-card">
        <div className="ilr-card-header">
          <span className="ilr-card-num">13</span>
          <h3 className="ilr-card-title">Platform Independence</h3>
          <span className="ilr-card-badge badge-blue">Architecture</span>
        </div>
        <p className="ilr-card-desc">
          Internal linking is a common Website Manager SEO function. The exact same internal-linking framework operates seamlessly across all supported platforms (WordPress, Magento, etc.). Do NOT create a separate Magento internal-linking engine unless there is a proven technical requirement.
        </p>
      </div>

      {/* Section 14: Current Rule Status */}
      <div className="ilr-card status-card">
        <div className="ilr-card-header">
          <span className="ilr-card-num">14</span>
          <h3 className="ilr-card-title">Current Rule Status</h3>
          <span className="ilr-card-badge badge-green">Inherited Baseline</span>
        </div>
        <p className="ilr-card-desc">
          These are the current Website Manager internal-linking rules inherited from the existing WordPress implementation. No new Magento-specific link-count rules have yet been introduced. Magento internal-linking recommendations will be tested against the existing rules before any changes are made.
        </p>
      </div>

    </div>
  )
}
