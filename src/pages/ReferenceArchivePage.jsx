import React, { useState } from 'react'
import './ReferenceArchivePage.css'

export const REFERENCE_GUIDES = [
  {
    id: 'fb-ig-connection',
    title: 'Facebook + Instagram Business Connection',
    category: 'Meta & Social Network Setup',
    updatedDate: '2 October 2026',
    provenWith: 'I Want A New Kitchen',
    coreRule: 'ONE BUSINESS → ONE META BUSINESS PORTFOLIO → ONE FACEBOOK PAGE → ONE INSTAGRAM BUSINESS ACCOUNT → ONE bundle.social TEAM'
  },
  {
    id: 'google-tree',
    title: 'Google Tree — Ecosystem, AI Models & Developer Routes',
    category: 'Google Architecture Reference',
    updatedDate: '3 October 2026',
    provenWith: 'W7 Social & TSE Infrastructure',
    coreRule: 'CONSUMER APPS vs DEVELOPER AI STUDIO vs GOOGLE CLOUD VERTEX AI'
  },
  {
    id: 'website-creation',
    title: 'TSE A–Z Static Website Creation, Launch & Promotion Workflow',
    category: 'End-to-End TSE Operating Process',
    updatedDate: '3 October 2026',
    provenWith: 'All TSE Production Apps',
    coreRule: 'STATIC HTML WEBSITE CREATION → DEDICATED LEADGEN DEPLOYER → SITE REGISTRY → W7 SOCIAL'
  }
]

export default function ReferenceArchivePage({ activeGuideId = 'fb-ig-connection', onSelectGuide }) {
  const [selectedGuideId, setSelectedGuideId] = useState(activeGuideId)
  const [lightboxImage, setLightboxImage] = useState(null)

  const activeGuide = REFERENCE_GUIDES.find(g => g.id === selectedGuideId) || REFERENCE_GUIDES[0]

  const handleGuideChange = (id) => {
    setSelectedGuideId(id)
    if (onSelectGuide) onSelectGuide(id)
  }

  return (
    <div className="ref-archive-container">

      {/* Page Header */}
      <div className="ref-archive-header">
        <div className="ref-archive-title-group">
          <h1>
            <span>📚</span> Reference Archive
          </h1>
          <p>Permanent in-app archive of proven TSE procedures, setup workflows, and operational guides.</p>
        </div>

        {/* Extensible Guide Selector */}
        <div className="ref-guide-selector">
          <label htmlFor="select-ref-guide">Active Guide:</label>
          <select
            id="select-ref-guide"
            className="ref-select-input"
            value={selectedGuideId}
            onChange={(e) => handleGuideChange(e.target.value)}
          >
            {REFERENCE_GUIDES.map(g => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prominent Core Rule Banner */}
      <div className="ref-core-rule-banner" id="banner-core-rule">
        <div className="ref-core-rule-tag">
          <span>⚡</span> TSE GOLDEN RULE FOR {
            activeGuide.id === 'google-tree' ? 'GOOGLE ARCHITECTURE' :
            activeGuide.id === 'website-creation' ? 'STATIC WEBSITE CREATION & LAUNCH' :
            'SOCIAL CONNECTIONS'
          }
        </div>
        <div className="ref-core-rule-text">
          {activeGuide.coreRule}
        </div>
      </div>

      {/* Guide Content Card: Facebook + Instagram Connection */}
      {selectedGuideId === 'fb-ig-connection' && (
        <div className="ref-guide-card" id="card-fb-ig-guide">
          
          {/* Section: What this achieves */}
          <div className="ref-section" id="section-achieves">
            <h2 className="ref-section-title">
              <span>🎯</span> What the Process Achieves
            </h2>
            <div className="ref-step-desc" style={{ fontSize: '0.95rem', background: '#1e293b', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
              Creates a separate Instagram business presence, links it to the correct Facebook Page and Meta Business Portfolio, then gives <strong>bundle.social</strong> access to <em>only</em> those specific assets so W7 can publish to the correct social accounts cleanly without cross-account leakage.
            </div>
          </div>

          {/* Part 1 */}
          <div className="ref-section" id="section-part1">
            <h2 className="ref-section-title">
              <span>1️⃣</span> Part 1 — Create the Instagram Account
            </h2>
            <div className="ref-step-list">
              <div className="ref-step-item">
                <div className="ref-step-header">
                  <span className="ref-step-number">1</span>
                  <span className="ref-step-title">Use a Dedicated Business Email</span>
                </div>
                <div className="ref-step-desc">
                  Create a separate Instagram account for the business using a business email address you control.
                </div>
              </div>

              <div className="ref-step-item">
                <div className="ref-step-header">
                  <span className="ref-step-number">2</span>
                  <span className="ref-step-title">Clean Profile Name &amp; Handle</span>
                </div>
                <div className="ref-step-desc">
                  Use the business name as the profile name and a clean business handle. 
                  <em>Example (Kitchen):</em> <code>@iwantanewkitchenuk</code>.
                </div>
              </div>

              <div className="ref-step-item">
                <div className="ref-step-header">
                  <span className="ref-step-number">3</span>
                  <span className="ref-step-title">Convert to Professional → Business Account</span>
                </div>
                <div className="ref-step-desc">
                  Switch the Instagram account to a <strong>Professional Account</strong> and select <strong>Business</strong> (do <em>not</em> choose Creator).
                </div>
              </div>
            </div>
          </div>

          {/* Part 2 */}
          <div className="ref-section" id="section-part2">
            <h2 className="ref-section-title">
              <span>2️⃣</span> Part 2 — Link Instagram to the Facebook Page &amp; Portfolio
            </h2>
            <div className="ref-step-list">
              <div className="ref-step-item">
                <div className="ref-step-header">
                  <span className="ref-step-number">1</span>
                  <span className="ref-step-title">Open Meta Business Suite</span>
                </div>
                <div className="ref-step-desc">
                  Open Meta Business Suite and select the correct Facebook Page/business. Use <strong>Connect Instagram</strong> from the Page settings in Business Suite.
                </div>
              </div>
            </div>
          </div>

          {/* Part 3 */}
          <div className="ref-section" id="section-part3">
            <h2 className="ref-section-title">
              <span>3️⃣</span> Part 3 — Connect the Pair to bundle.social
            </h2>
            <div className="ref-step-list">
              <div className="ref-step-item">
                <div className="ref-step-header">
                  <span className="ref-step-number">1</span>
                  <span className="ref-step-title">Select Team &amp; Initiate OAuth</span>
                </div>
                <div className="ref-step-desc">
                  In bundle.social, first select the correct team (e.g., <em>I Want A New Kitchen</em>). Choose <strong>Connect Instagram → Connect via Facebook</strong>.
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Guide Content Card: Google Tree */}
      {selectedGuideId === 'google-tree' && (
        <div className="ref-guide-card" id="card-google-tree-guide">

          {/* Prominent Subscription Box */}
          <div className="ref-sub-card">
            <div className="ref-sub-header">
              <span className="ref-sub-badge">ACTIVE SUBSCRIPTION</span>
              <h2 className="ref-sub-title">OUR GOOGLE WORKSPACE SUBSCRIPTION</h2>
            </div>
            <div className="ref-sub-grid">
              <div className="ref-sub-item">
                <span className="ref-sub-label">Account Email</span>
                <span className="ref-sub-value">macworkspace@thesearchequation.com</span>
              </div>
              <div className="ref-sub-item">
                <span className="ref-sub-label">Recorded Subscription Cost</span>
                <span className="ref-sub-price">£70 / month</span>
              </div>
            </div>
          </div>

          {/* Section 1: Main Hierarchy Tree */}
          <div className="ref-section">
            <h2 className="ref-section-title">
              <span>🌳</span> Google Ecosystem &amp; Infrastructure Tree
            </h2>
            <div className="ref-tree-container">
              <pre className="ref-tree-code">
{`GOOGLE
│
├── Consumer products
│   ├── Gemini
│   │   ├── Gemini website/app
│   │   ├── Gemini chat
│   │   └── Uses Gemini models + other Google AI models/features
│   │
│   └── Google Workspace
│       ├── Gmail
│       ├── Docs
│       ├── Sheets
│       └── Gemini features inside Workspace
│
├── Developer / AI experimentation
│   ├── Google AI Studio
│   │   ├── Playground/testing interface
│   │   ├── Create/manage Gemini API keys
│   │   └── Gemini Developer API
│   │       ├── Gemini language/multimodal models
│   │       ├── Nano Banana image models
│   │       └── Veo video models
│   │
│   └── Gemini API
│       └── What software such as W7 can call programmatically
│
└── Google Cloud
    ├── Google Cloud Console
    │   ├── Projects
    │   ├── Billing
    │   ├── API credentials
    │   ├── Service accounts
    │   └── Usage / quotas
    │
    └── Vertex AI
        ├── Enterprise/developer AI platform
        ├── Gemini models
        ├── Nano Banana/image models
        ├── Veo/video models
        └── Other Google/partner AI models`}
              </pre>
            </div>
          </div>

        </div>
      )}

      {/* Guide Content Card: Website Creation */}
      {selectedGuideId === 'website-creation' && (
        <div className="ref-guide-card" id="card-website-creation-guide">

          {/* Intro Description */}
          <div className="ref-section" style={{ marginBottom: '1.5rem' }}>
            <h2 className="ref-section-title">
              <span>🌐</span> End-to-End TSE Website Operating Workflow
            </h2>
            <p className="ref-step-desc" style={{ fontSize: '0.95rem', background: '#1e293b', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
              Authoritative A–Z visual process diagram documenting how TSE Apps research, build, deploy, manage, promote, and continuously optimize a live website. 
              <strong> Key Architecture Rule:</strong> Our Website Builder creates <strong>STATIC HTML WEBSITES</strong> (zero database overhead, 100% fast, static package deployment via TSE Leadgen Deployer). <em>WordPress is NOT our site creation or deployment route.</em>
            </p>
          </div>

          {/* Visual Legend */}
          <div className="wc-legend-box">
            <span className="wc-legend-title">VISUAL LANGUAGE &amp; COMPONENT LEGEND</span>
            <div className="wc-legend-items">
              <div className="wc-legend-item">
                <span className="wc-badge-tse">TSE APP</span>
                <span>Custom TSE Ecosystem Application</span>
              </div>
              <div className="wc-legend-item">
                <span className="wc-badge-ext">THIRD-PARTY SERVICE ↗</span>
                <span>Verified External API / Platform</span>
              </div>
              <div className="wc-legend-item">
                <span className="wc-badge-output">STATIC OUTPUT</span>
                <span>Artifact / Code Package / Data Output</span>
              </div>
              <div className="wc-legend-item">
                <span className="wc-arrow-legend">↓</span>
                <span>Process / Data Flow Connection</span>
              </div>
            </div>
          </div>

          {/* A–Z Process Flow Diagram */}
          <div className="wc-flow-diagram">

            {/* STAGE 1 */}
            <div className="wc-stage-card">
              <div className="wc-stage-badge">STAGE 1</div>
              <h3 className="wc-stage-title">BUSINESS / WEBSITE IDEA &amp; NICHE DEFINITION</h3>
              
              <div className="wc-stage-body">
                <div className="wc-component-group">
                  <span className="wc-label">TSE App Used:</span>
                  <span className="wc-badge-tse">Auth / Apps Hub</span>
                </div>

                <div className="wc-stage-desc">
                  Authenticate team access, establish target niche (e.g. Kitchen Upgrades, Emergency Drainage, Shutters), and initialize project scope.
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Output Produced:</span>
                  <span className="wc-badge-output">Target Business Niche Definition &amp; Domain Concept</span>
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Third-Party Connected:</span>
                  <a href="https://workspace.google.com/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Google Workspace ↗
                  </a>
                </div>

                <div className="wc-next-tag">Next → Stage 2: Keyword &amp; Market Research</div>
              </div>
            </div>

            <div className="wc-flow-arrow">↓</div>

            {/* STAGE 2 */}
            <div className="wc-stage-card">
              <div className="wc-stage-badge">STAGE 2</div>
              <h3 className="wc-stage-title">KEYWORD &amp; MARKET RESEARCH</h3>

              <div className="wc-stage-body">
                <div className="wc-component-group">
                  <span className="wc-label">TSE App Used:</span>
                  <span className="wc-badge-tse">Keyword Research</span>
                </div>

                <div className="wc-stage-desc">
                  Seed keyword expansion, search volume analysis, keyword difficulty scoring, SERP intent clustering, and 4-page content hierarchy planning.
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Output Produced:</span>
                  <span className="wc-badge-output">Approved Keyword Cluster &amp; 4-Page Hierarchy Manifest</span>
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Third-Party Connected:</span>
                  <a href="https://dataforseo.com/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    DataForSEO ↗
                  </a>
                  <a href="https://openai.com/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    OpenAI (GPT-4) ↗
                  </a>
                </div>

                <div className="wc-next-tag">Next → Stage 3: Site Structure / Content Planning</div>
              </div>
            </div>

            <div className="wc-flow-arrow">↓</div>

            {/* STAGE 3 */}
            <div className="wc-stage-card">
              <div className="wc-stage-badge">STAGE 3</div>
              <h3 className="wc-stage-title">SITE STRUCTURE / CONTENT PLANNING</h3>

              <div className="wc-stage-body">
                <div className="wc-component-group">
                  <span className="wc-label">TSE App Used:</span>
                  <span className="wc-badge-tse">Keyword Research</span>
                  <span className="wc-badge-tse">Website Builder (Brief Mapper)</span>
                </div>

                <div className="wc-stage-desc">
                  Map target keywords to page briefs, generate AI headline copy, select Warm Contemporary design system, and curate stock photo assets.
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Output Produced:</span>
                  <span className="wc-badge-output">Structured Project Brief Manifest (proj_manifest.json)</span>
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Third-Party Connected:</span>
                  <a href="https://openai.com/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    OpenAI (GPT-4) ↗
                  </a>
                  <a href="https://unsplash.com/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Unsplash Stock Photos ↗
                  </a>
                  <a href="https://fonts.google.com/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Google Fonts ↗
                  </a>
                </div>

                <div className="wc-next-tag">Next → Stage 4: Static HTML Website Creation</div>
              </div>
            </div>

            <div className="wc-flow-arrow">↓</div>

            {/* STAGE 4 - STATIC WEBSITE CREATION */}
            <div className="wc-stage-card wc-stage-highlight">
              <div className="wc-stage-badge badge-static">STAGE 4 — CORE ARCHITECTURE</div>
              <h3 className="wc-stage-title">STATIC HTML WEBSITE CREATION</h3>

              <div className="wc-stage-body">
                <div className="wc-component-group">
                  <span className="wc-label">TSE App Used:</span>
                  <span className="wc-badge-tse">Website Builder</span>
                </div>

                <div className="wc-stage-desc">
                  Execute Direct Site Generator engine to build a zero-dependency, ultra-fast <strong>STATIC HTML website</strong>. (NO WordPress, NO database overhead, NO heavy plugins).
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Output Produced:</span>
                  <span className="wc-badge-output gold-output">STATIC HTML WEBSITE PACKAGE (7 files: index.html, styles.css, sitemap.xml, robots.txt, images)</span>
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Third-Party Connected:</span>
                  <a href="https://tagmanager.google.com/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Google Tag Manager &amp; GA4 ↗
                  </a>
                  <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Supabase ↗
                  </a>
                </div>

                <div className="wc-next-tag">Next → Stage 5: Static Site Deployment</div>
              </div>
            </div>

            <div className="wc-flow-arrow">↓</div>

            {/* STAGE 5 - STATIC SITE DEPLOYMENT */}
            <div className="wc-stage-card wc-stage-highlight">
              <div className="wc-stage-badge badge-static">STAGE 5 — DEPLOYMENT</div>
              <h3 className="wc-stage-title">STATIC SITE DEPLOYMENT / LIVE WEBSITE</h3>

              <div className="wc-stage-body">
                <div className="wc-component-group">
                  <span className="wc-label">TSE App Used:</span>
                  <span className="wc-badge-tse">TSE Leadgen Deployer</span>
                </div>

                <div className="wc-stage-desc">
                  Extract static HTML package, provision virtual host routing, issue Let's Encrypt SSL certificates, and launch live site under HTTPS.
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Output Produced:</span>
                  <span className="wc-badge-output gold-output">LIVE HTTPS PRODUCTION WEBSITE (Fast Static Nginx Hosting)</span>
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Third-Party Connected:</span>
                  <a href="https://nginx.org/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Nginx Web Server ↗
                  </a>
                </div>

                <div className="wc-next-tag">Next → Stage 6: Site Registration</div>
              </div>
            </div>

            <div className="wc-flow-arrow">↓</div>

            {/* STAGE 6 */}
            <div className="wc-stage-card">
              <div className="wc-stage-badge">STAGE 6</div>
              <h3 className="wc-stage-title">SITE REGISTRATION &amp; INDEXING NOTIFICATION</h3>

              <div className="wc-stage-body">
                <div className="wc-component-group">
                  <span className="wc-label">TSE App Used:</span>
                  <span className="wc-badge-tse">Site Registry</span>
                </div>

                <div className="wc-stage-desc">
                  Register live domain in central database, assign portfolio category, record server IP, and initialize Fatima backlink tracking.
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Output Produced:</span>
                  <span className="wc-badge-output">Registered Domain Profile &amp; Fatima Backlink Tracker</span>
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Third-Party Connected:</span>
                  <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Supabase / PostgreSQL ↗
                  </a>
                  <a href="https://www.indexnow.org/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    IndexNow ↗
                  </a>
                  <span className="wc-note-tag">(IndexNow is an optional indexing notification protocol used by Site Registry where applicable — NOT part of static site creation)</span>
                </div>

                <div className="wc-next-tag">Next → Stage 7: Auditing / SEO / Page Management</div>
              </div>
            </div>

            <div className="wc-flow-arrow">↓</div>

            {/* STAGE 7 */}
            <div className="wc-stage-card">
              <div className="wc-stage-badge">STAGE 7</div>
              <h3 className="wc-stage-title">AUDITING / SEO / PAGE MANAGEMENT</h3>

              <div className="wc-stage-body">
                <div className="wc-component-group">
                  <span className="wc-label">TSE App Used:</span>
                  <span className="wc-badge-tse">Website Manager (W1 / W3 / W4)</span>
                  <span className="wc-badge-tse">Page Auditor</span>
                </div>

                <div className="wc-stage-desc">
                  Run synthetic browser audits to test LCP/CLS Core Web Vitals, verify SEO Meta Title/Description tags, check internal link integrity, and audit HTML entities.
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Output Produced:</span>
                  <span className="wc-badge-output">Audit Report Scores &amp; Validated SEO Metadata Sync</span>
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Third-Party Connected:</span>
                  <a href="https://pagespeed.webdev.google/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Google PageSpeed Insights ↗
                  </a>
                  <a href="https://developer.chrome.com/docs/lighthouse/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Google Lighthouse ↗
                  </a>
                </div>

                <div className="wc-next-tag">Next → Stage 8: Rank &amp; Search Performance Monitoring</div>
              </div>
            </div>

            <div className="wc-flow-arrow">↓</div>

            {/* STAGE 8 */}
            <div className="wc-stage-card">
              <div className="wc-stage-badge">STAGE 8</div>
              <h3 className="wc-stage-title">RANK &amp; SEARCH PERFORMANCE MONITORING</h3>

              <div className="wc-stage-body">
                <div className="wc-component-group">
                  <span className="wc-label">TSE App Used:</span>
                  <span className="wc-badge-tse">Website Manager (W6 Rank Tracker)</span>
                </div>

                <div className="wc-stage-desc">
                  Monitor daily Google SERP positions for target keyword phrases, track index coverage status, and log organic search visibility trends.
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Output Produced:</span>
                  <span className="wc-badge-output">Daily Keyword Rank Timeline &amp; Search Visibility Index</span>
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Third-Party Connected:</span>
                  <a href="https://dataforseo.com/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    DataForSEO ↗
                  </a>
                  <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Google Search Console ↗
                  </a>
                </div>

                <div className="wc-next-tag">Next → Stage 9: Content / SEO Improvement</div>
              </div>
            </div>

            <div className="wc-flow-arrow">↓</div>

            {/* STAGE 9 */}
            <div className="wc-stage-card">
              <div className="wc-stage-badge">STAGE 9</div>
              <h3 className="wc-stage-title">CONTENT / SEO IMPROVEMENT</h3>

              <div className="wc-stage-body">
                <div className="wc-component-group">
                  <span className="wc-label">TSE App Used:</span>
                  <span className="wc-badge-tse">Website Manager (W3 / W5)</span>
                  <span className="wc-badge-tse">Hub Content</span>
                </div>

                <div className="wc-stage-desc">
                  Refine metadata based on audit findings, generate new contextual articles/legal/location pages, optimize internal anchor text links, and push updates.
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Output Produced:</span>
                  <span className="wc-badge-output">Expanded Location Page Hierarchy &amp; Enhanced Internal Link Graph</span>
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Third-Party Connected:</span>
                  <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Google Gemini AI ↗
                  </a>
                </div>

                <div className="wc-next-tag">Next → Stage 10: Social Content Creation</div>
              </div>
            </div>

            <div className="wc-flow-arrow">↓</div>

            {/* STAGE 10 - SOCIAL CONTENT CREATION */}
            <div className="wc-stage-card wc-stage-social">
              <div className="wc-stage-badge badge-social">STAGE 10 — PROVEN W7 SOCIAL PIPELINE</div>
              <h3 className="wc-stage-title">SOCIAL CONTENT CREATION</h3>

              <div className="wc-stage-body">
                <div className="wc-component-group">
                  <span className="wc-label">TSE App Used:</span>
                  <span className="wc-badge-tse">W7 Social (Website Manager → W7)</span>
                </div>

                <div className="wc-stage-desc">
                  Generate high-converting social media visual assets using Google AI image &amp; video generation models, then apply custom video template branding.
                </div>

                {/* Sub-pipeline diagram */}
                <div className="wc-sub-pipeline">
                  <div className="sub-pipe-item">
                    <strong>NANO BANANA</strong>
                    <span>Image Creation</span>
                  </div>
                  <span className="sub-pipe-arrow">→</span>
                  <div className="sub-pipe-item">
                    <strong>VEO 3.1 FAST</strong>
                    <span>Image → Video Animation</span>
                  </div>
                  <span className="sub-pipe-arrow">→</span>
                  <div className="sub-pipe-item">
                    <strong>CREATOMATE</strong>
                    <span>Final Creative / Text / Branding</span>
                  </div>
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Output Produced:</span>
                  <span className="wc-badge-output">Branded HD MP4 Video &amp; Social Image Assets</span>
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Third-Party Connected:</span>
                  <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Google Gemini &amp; Nano Banana ↗
                  </a>
                  <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Google Veo 3.1 Fast ↗
                  </a>
                  <a href="https://creatomate.com/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Creatomate ↗
                  </a>
                </div>

                <div className="wc-next-tag">Next → Stage 11: Social Distribution</div>
              </div>
            </div>

            <div className="wc-flow-arrow">↓</div>

            {/* STAGE 11 - SOCIAL DISTRIBUTION */}
            <div className="wc-stage-card wc-stage-social">
              <div className="wc-stage-badge badge-social">STAGE 11 — SOCIAL DISTRIBUTION</div>
              <h3 className="wc-stage-title">SOCIAL DISTRIBUTION</h3>

              <div className="wc-stage-body">
                <div className="wc-component-group">
                  <span className="wc-label">TSE App Used:</span>
                  <span className="wc-badge-tse">W7 Social (Publishing Engine)</span>
                </div>

                <div className="wc-stage-desc">
                  Compose engaging captions, attach rendered video/image assets, select target Facebook Page &amp; Instagram Business profile, and dispatch post for publication.
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Output Produced:</span>
                  <span className="wc-badge-output">Published Social Posts (Confirmed Provider Delivery Status)</span>
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Third-Party Connected:</span>
                  <a href="https://bundle.social/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    bundle.social ↗
                  </a>
                  <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Meta (Facebook &amp; Instagram Graph API) ↗
                  </a>
                </div>

                <div className="wc-next-tag">Next → Stage 12: Measurement</div>
              </div>
            </div>

            <div className="wc-flow-arrow">↓</div>

            {/* STAGE 12 */}
            <div className="wc-stage-card">
              <div className="wc-stage-badge">STAGE 12</div>
              <h3 className="wc-stage-title">MEASUREMENT</h3>

              <div className="wc-stage-body">
                <div className="wc-component-group">
                  <span className="wc-label">TSE App Used:</span>
                  <span className="wc-badge-tse">Website Manager (W2 Dashboard)</span>
                  <span className="wc-badge-tse">Lead Generator</span>
                </div>

                <div className="wc-stage-desc">
                  Measure live user traffic, social engagement conversions, inbound referral leads, and organic search impressions to evaluate overall campaign ROI.
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Output Produced:</span>
                  <span className="wc-badge-output">Unified Traffic &amp; Conversion Analytics Report</span>
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Third-Party Connected:</span>
                  <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Google Analytics GA4 ↗
                  </a>
                  <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Google Search Console ↗
                  </a>
                </div>

                <div className="wc-next-tag">Next → Stage 13: Ongoing Improvement</div>
              </div>
            </div>

            <div className="wc-flow-arrow">↓</div>

            {/* STAGE 13 */}
            <div className="wc-stage-card wc-stage-loop">
              <div className="wc-stage-badge badge-loop">STAGE 13 — FEEDBACK LOOP</div>
              <h3 className="wc-stage-title">ONGOING IMPROVEMENT</h3>

              <div className="wc-stage-body">
                <div className="wc-component-group">
                  <span className="wc-label">TSE App Used:</span>
                  <span className="wc-badge-tse">Website Manager</span>
                  <span className="wc-badge-tse">Keyword Research</span>
                  <span className="wc-badge-tse">W7 Social</span>
                </div>

                <div className="wc-stage-desc">
                  Feed analytics data, winning keywords, and top-performing social creatives back into Keyword Research and W7 Social to expand secondary location pages, launch new social campaigns, and continuously scale site authority.
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Output Produced:</span>
                  <span className="wc-badge-output">Expanded Keyword Targets &amp; Continuous Growth Iterations</span>
                </div>

                <div className="wc-component-group">
                  <span className="wc-label">Third-Party Connected:</span>
                  <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    Google Gemini AI ↗
                  </a>
                  <a href="https://dataforseo.com/" target="_blank" rel="noopener noreferrer" className="wc-badge-ext">
                    DataForSEO ↗
                  </a>
                </div>

                <div className="wc-loop-tag">🔄 Loops back to Stage 2 (Keyword Research) &amp; Stage 9 (SEO Improvement) for continuous growth</div>
              </div>
            </div>

          </div>

          {/* Security & Confidentiality Footer */}
          <div className="ref-section" style={{ marginTop: '2rem', marginBottom: 0 }}>
            <div className="ref-step-desc" style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #1e293b' }}>
              🔒 <strong>Security Protocol:</strong> API keys, service account credentials, OAuth tokens, and passwords are not displayed and remain encrypted in server environment storage.
            </div>
          </div>

        </div>
      )}

      {/* Lightbox Modal for Screenshots */}
      {lightboxImage && (
        <div className="ref-modal-overlay" onClick={() => setLightboxImage(null)}>
          <div className="ref-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ref-modal-close"
              onClick={() => setLightboxImage(null)}
              title="Close image"
            >
              &times;
            </button>
            <img src={lightboxImage.url} alt={lightboxImage.title} className="ref-modal-img" />
            <div className="ref-modal-caption">{lightboxImage.title}</div>
          </div>
        </div>
      )}

    </div>
  )
}
