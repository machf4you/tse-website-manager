import React, { useState, useEffect } from 'react'
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
  },
  {
    id: 'app-costs',
    title: 'TSE App Costs & Subscriptions Financial Register',
    category: 'Operational Finance & Subscriptions',
    updatedDate: '3 October 2026',
    provenWith: 'All TSE Production Apps & External Integrations',
    coreRule: 'CENTRAL FINANCIAL REGISTER → THIRD-PARTY SUBSCRIPTIONS, API CREDITS & DEVELOPMENT COSTS'
  },
  {
    id: 'social-creation',
    title: 'W7 Social Content Engine — Research, Stack Selection & Production Flow',
    category: 'W7 Social Architecture & Media Pipeline',
    updatedDate: '3 October 2026',
    provenWith: 'W7 Social, Nano Banana, Veo 3.1 Fast, Creatomate, bundle.social & Facebook',
    coreRule: 'W7 SOCIAL → NANO BANANA → VEO 3.1 FAST → CREATOMATE → BUNDLE.SOCIAL → SOCIAL NETWORKS (FACEBOOK PROVEN LIVE)'
  }
]

export default function ReferenceArchivePage({ activeGuideId = 'fb-ig-connection', onSelectGuide }) {
  const [selectedGuideId, setSelectedGuideId] = useState(activeGuideId)
  const [lightboxImage, setLightboxImage] = useState(null)

  useEffect(() => {
    if (activeGuideId) {
      setSelectedGuideId(activeGuideId)
    }
  }, [activeGuideId])

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
            activeGuide.id === 'app-costs' ? 'TSE APP FINANCIAL REGISTER & SUBSCRIPTIONS' :
            activeGuide.id === 'social-creation' ? 'W7 SOCIAL CREATION & PUBLISHING STACK' :
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

      {/* Guide Content Card: App Costs & Subscriptions */}
      {selectedGuideId === 'app-costs' && (
        <div className="ref-guide-card" id="card-app-costs-guide">
          
          {/* Operational Purpose */}
          <div className="ref-section">
            <h2 className="ref-section-title">
              <span>💳</span> Central Financial &amp; Subscription Register
            </h2>
            <div className="ref-step-desc" style={{ fontSize: '0.95rem', background: '#1e293b', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #334155', color: '#cbd5e1' }}>
              Central reference showing third-party services, SaaS subscriptions, API spend, usage credits/top-ups, server hosting, domains, and development tooling involved in building and operating the TSE Apps ecosystem.
              <br /><br />
              <strong style={{ color: '#fbbf24' }}>Notice:</strong> All monetary values default to <strong>TBC</strong> while Mac verifies each account directly. Summary cards do not calculate totals until verified figures are entered.
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="ref-section">
            <h2 className="ref-section-title">
              <span>📊</span> Financial Summary Overview
            </h2>
            <div className="cost-summary-grid">
              <div className="cost-summary-card">
                <div className="cost-card-icon">💳</div>
                <div className="cost-card-title">MONTHLY FIXED COST</div>
                <div className="cost-card-value badge-tbc">TBC</div>
                <div className="cost-card-sub">Recurring monthly SaaS subscriptions</div>
              </div>
              <div className="cost-summary-card">
                <div className="cost-card-icon">📅</div>
                <div className="cost-card-title">ANNUAL FIXED COST</div>
                <div className="cost-card-value badge-tbc">TBC</div>
                <div className="cost-card-sub">Annual domain &amp; license renewals</div>
              </div>
              <div className="cost-summary-card">
                <div className="cost-card-icon">⚡</div>
                <div className="cost-card-title">USAGE / VARIABLE SPEND</div>
                <div className="cost-card-value badge-tbc">TBC</div>
                <div className="cost-card-sub">Pay-as-you-go &amp; API credits</div>
              </div>
              <div className="cost-summary-card">
                <div className="cost-card-icon">🛠️</div>
                <div className="cost-card-title">ONE-OFF / DEV SPEND</div>
                <div className="cost-card-value badge-tbc">TBC</div>
                <div className="cost-card-sub">Setup fees &amp; development tooling</div>
              </div>
            </div>
          </div>

          {/* Detailed Provider Register */}
          <div className="ref-section">
            <h2 className="ref-section-title">
              <span>📋</span> Third-Party Service Provider Register
            </h2>

            <div className="cost-table-wrapper">
              <table className="cost-register-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Used By / TSE App</th>
                    <th>Account Email</th>
                    <th>Purpose</th>
                    <th>Billing Type</th>
                    <th>Cost</th>
                    <th>Currency</th>
                    <th>Frequency</th>
                    <th>One-Off Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Google Workspace */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://workspace.google.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Google Workspace ↗
                      </a>
                    </td>
                    <td>Auth / Apps Hub, All TSE Apps</td>
                    <td className="email-cell">macworkspace@thesearchequation.com</td>
                    <td>Enterprise email, Google Docs, Sheets, Drive, Admin Console</td>
                    <td><span className="billing-type-tag monthly">Monthly</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 2: DataForSEO */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://dataforseo.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        DataForSEO ↗
                      </a>
                    </td>
                    <td>Keyword Research</td>
                    <td className="email-cell">TBC</td>
                    <td>SERP API, Keyword Volume, Difficulty &amp; Intent metrics</td>
                    <td><span className="billing-type-tag usage">Usage / API</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 3: OpenAI */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://openai.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        OpenAI ↗
                      </a>
                    </td>
                    <td>Keyword Research, Website Builder, Website Manager</td>
                    <td className="email-cell">TBC</td>
                    <td>GPT-4o / GPT-4 API for AI keyword analysis &amp; content structuring</td>
                    <td><span className="billing-type-tag usage">Usage / API</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 4: Google Gemini Developer API */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Google Gemini Developer API ↗
                      </a>
                    </td>
                    <td>W7 Social, Keyword Research, Website Builder</td>
                    <td className="email-cell">TBC</td>
                    <td>Gemini AI models &amp; Nano Banana image generation engine</td>
                    <td><span className="billing-type-tag usage">Usage / API</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 5: Google Cloud / Vertex AI */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://cloud.google.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Google Cloud / Vertex AI ↗
                      </a>
                    </td>
                    <td>W7 Social (Veo 3.1 Fast), IAM Infrastructure</td>
                    <td className="email-cell">TBC</td>
                    <td>Veo 3.1 Fast video generation AI model &amp; GCP Service Accounts</td>
                    <td><span className="billing-type-tag usage">Usage / API</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 6: Creatomate */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://creatomate.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Creatomate ↗
                      </a>
                    </td>
                    <td>W7 Social</td>
                    <td className="email-cell">TBC</td>
                    <td>Automated video template rendering, branding &amp; audio overlays</td>
                    <td><span className="billing-type-tag monthly">Monthly</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 7: bundle.social */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://bundle.social" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        bundle.social ↗
                      </a>
                    </td>
                    <td>W7 Social</td>
                    <td className="email-cell">TBC</td>
                    <td>Multi-channel social media publishing API (Meta, YouTube, LinkedIn, X, TikTok)</td>
                    <td><span className="billing-type-tag monthly">Monthly</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 8: Canva */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://www.canva.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Canva ↗
                      </a>
                    </td>
                    <td>W7 Social, Graphic Assets</td>
                    <td className="email-cell">TBC</td>
                    <td>Graphic design templates, brand kits, and asset design</td>
                    <td><span className="billing-type-tag monthly">Monthly</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge configured">Configured</span></td>
                  </tr>

                  {/* Row 9: Supabase */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Supabase ↗
                      </a>
                    </td>
                    <td>Auth / Apps Hub, TSE Auth Service</td>
                    <td className="email-cell">TBC</td>
                    <td>Hosted PostgreSQL database, user authentication &amp; JWT sessions</td>
                    <td><span className="billing-type-tag monthly">Monthly</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 10: Apify */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://apify.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Apify ↗
                      </a>
                    </td>
                    <td>Lead Generator</td>
                    <td className="email-cell">TBC</td>
                    <td>Web scraping actors, directory extraction &amp; lead generation automation</td>
                    <td><span className="billing-type-tag usage">Usage / API</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 11: Resend */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Resend ↗
                      </a>
                    </td>
                    <td>Lead Generator, Website Manager</td>
                    <td className="email-cell">TBC</td>
                    <td>Transactional email delivery API for lead alerts &amp; system notifications</td>
                    <td><span className="billing-type-tag usage">Usage / Monthly</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 12: Ahrefs */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://ahrefs.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Ahrefs ↗
                      </a>
                    </td>
                    <td>Keyword Research, SEO Auditing</td>
                    <td className="email-cell">TBC</td>
                    <td>Backlink profile analysis, domain authority metrics &amp; keyword research</td>
                    <td><span className="billing-type-tag monthly">Monthly</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge configured">Configured</span></td>
                  </tr>

                  {/* Row 13: Unsplash */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Unsplash ↗
                      </a>
                    </td>
                    <td>Website Builder</td>
                    <td className="email-cell">TBC</td>
                    <td>High-resolution stock photo API for generated static HTML sites</td>
                    <td><span className="billing-type-tag free">Free</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 14: Hostinger / VPS Infrastructure */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://www.hostinger.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        VPS Server Provider (Hostinger) ↗
                      </a>
                    </td>
                    <td>All Live TSE Production Apps</td>
                    <td className="email-cell">TBC</td>
                    <td>Ubuntu Linux VPS server hosting Node.js services, PM2, and Nginx reverse proxy</td>
                    <td><span className="billing-type-tag monthly">Monthly</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 15: Domain Registrar / Cloudflare */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Domain Registrar &amp; DNS (Cloudflare/Namecheap) ↗
                      </a>
                    </td>
                    <td>All TSE Apps &amp; Live Client Sites</td>
                    <td className="email-cell">TBC</td>
                    <td>Domain registrations, DNS record routing, SSL certificates, CDN &amp; security</td>
                    <td><span className="billing-type-tag annual">Annual</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 16: Antigravity Development Tooling */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://deepmind.google" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Antigravity Dev Tooling ↗
                      </a>
                    </td>
                    <td>TSE Codebase Architecture &amp; Maintenance</td>
                    <td className="email-cell">TBC</td>
                    <td>AI agentic development workspace, automated refactoring &amp; system maintenance</td>
                    <td><span className="billing-type-tag usage">Usage</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="cost-tbc-tag">TBC</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 17: IndexNow Protocol */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://www.indexnow.org" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        IndexNow Protocol ↗
                      </a>
                    </td>
                    <td>Site Registry</td>
                    <td className="email-cell">N/A (Open Protocol)</td>
                    <td>Instant search engine indexing notification API (Bing &amp; Yandex)</td>
                    <td><span className="billing-type-tag free">Free</span></td>
                    <td><span className="cost-zero-tag">£0</span></td>
                    <td><span>GBP (£)</span></td>
                    <td><span>N/A</span></td>
                    <td><span>N/A</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                  {/* Row 18: Meta for Developers */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Meta for Developers ↗
                      </a>
                    </td>
                    <td>W7 Social, bundle.social Integrations</td>
                    <td className="email-cell">macworkspace@thesearchequation.com</td>
                    <td>Graph API Developer App, Meta Business Portfolio OAuth &amp; page connections</td>
                    <td><span className="billing-type-tag free">Free</span></td>
                    <td><span className="cost-zero-tag">£0</span></td>
                    <td><span>GBP (£)</span></td>
                    <td><span>N/A</span></td>
                    <td><span>N/A</span></td>
                    <td><span className="status-badge active">Active</span></td>
                  </tr>

                </tbody>
              </table>
            </div>

          </div>

          {/* Security & Confidentiality Footer */}
          <div className="ref-section" style={{ marginTop: '2rem', marginBottom: 0 }}>
            <div className="ref-step-desc" style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #1e293b' }}>
              🔒 <strong>Security Protocol:</strong> Passwords, API keys, OAuth access tokens, credit card details, bank account numbers, and secret credentials are strictly prohibited from this financial register and stored in encrypted server environment storage.
            </div>
          </div>

        </div>
      )}

      {/* Guide Content Card: Social Creation Process */}
      {selectedGuideId === 'social-creation' && (
        <div className="ref-guide-card" id="card-social-creation-guide">
          
          {/* Overview */}
          <div className="ref-section">
            <h2 className="ref-section-title">
              <span>🚀</span> W7 Social Content Engine — Research &amp; Production Stack
            </h2>
            <div className="ref-step-desc" style={{ fontSize: '0.95rem', background: '#1e293b', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #334155', color: '#cbd5e1' }}>
              Permanent reference documenting the third-party platforms investigated across every layer of the W7 Social content creation pipeline, the selection rationale for our production stack, and the live status of our social network integrations.
              <br /><br />
              <span className="ref-link-hint">
                💳 Subscription prices and API costs are recorded separately in the <a href="#" onClick={(e) => { e.preventDefault(); handleGuideChange('app-costs'); }} style={{ color: '#38bdf8', textDecoration: 'underline' }}>App Costs &amp; Subscriptions</a> register.
              </span>
            </div>
          </div>

          {/* Prominent Production Flow Diagram */}
          <div className="ref-section">
            <h2 className="ref-section-title">
              <span>🔄</span> W7 Social Final Production Flow
            </h2>

            <div className="sc-flow-container">
              
              <div className="sc-flow-card app-card">
                <div className="sc-flow-badge app">TSE APP</div>
                <div className="sc-flow-title">W7 SOCIAL</div>
                <div className="sc-flow-sub">Campaign setup, prompt orchestration &amp; creative staging</div>
              </div>

              <div className="sc-flow-arrow">↓</div>

              <div className="sc-flow-card selected-card">
                <div className="sc-flow-layer-tag">LAYER 1 — IMAGE CREATION</div>
                <div className="sc-flow-title">NANO BANANA</div>
                <div className="sc-flow-tech">Google Gemini API (models/nano-banana-pro-preview)</div>
                <div className="sc-flow-sub">Photorealistic brand image generation</div>
              </div>

              <div className="sc-flow-arrow">↓</div>

              <div className="sc-flow-card selected-card">
                <div className="sc-flow-layer-tag">LAYER 2 — IMAGE → VIDEO</div>
                <div className="sc-flow-title">VEO 3.1 FAST</div>
                <div className="sc-flow-tech">Google Gemini Developer API (models/veo-3.1-fast-generate-preview)</div>
                <div className="sc-flow-sub">High-speed 9:16 vertical AI video synthesis</div>
              </div>

              <div className="sc-flow-arrow">↓</div>

              <div className="sc-flow-card selected-card">
                <div className="sc-flow-layer-tag">LAYER 3 — VIDEO ASSEMBLY &amp; BRANDING</div>
                <div className="sc-flow-title">CREATOMATE</div>
                <div className="sc-flow-tech">Automated Template &amp; Render Engine</div>
                <div className="sc-flow-sub">Text overlays, headlines, CTA, audio &amp; brand kit assembly</div>
              </div>

              <div className="sc-flow-arrow">↓</div>

              <div className="sc-flow-card approval-card">
                <div className="sc-flow-badge approval">HUMAN APPROVAL GATE</div>
                <div className="sc-flow-title">W7 APPROVAL</div>
                <div className="sc-flow-sub">In-app preview &amp; publication confirmation</div>
              </div>

              <div className="sc-flow-arrow">↓</div>

              <div className="sc-flow-card selected-card">
                <div className="sc-flow-layer-tag">LAYER 4 — PUBLISHING &amp; DISTRIBUTION</div>
                <div className="sc-flow-title">BUNDLE.SOCIAL</div>
                <div className="sc-flow-tech">Multi-Account Dispatch API</div>
                <div className="sc-flow-sub">API token routing &amp; schedule publishing</div>
              </div>

              <div className="sc-flow-arrow">↓</div>

              <div className="sc-flow-card network-card">
                <div className="sc-flow-layer-tag">LAYER 5 — TARGET SOCIAL NETWORKS</div>
                <div className="sc-network-pills">
                  <span className="net-pill proven">Facebook Page (PROVEN LIVE 🟢)</span>
                  <span className="net-pill configured">Instagram Business (CONNECTED 🔵)</span>
                  <span className="net-pill unconnected">YouTube Shorts (NOT YET CONNECTED ⚪)</span>
                  <span className="net-pill unconnected">LinkedIn (NOT YET CONNECTED ⚪)</span>
                  <span className="net-pill unconnected">X / Twitter (NOT YET CONNECTED ⚪)</span>
                  <span className="net-pill unconnected">TikTok (NOT YET CONNECTED ⚪)</span>
                </div>
              </div>

            </div>
          </div>

          {/* Layer by Layer Investigation & Production Decisions */}
          <div className="ref-section">
            <h2 className="ref-section-title">
              <span>🔬</span> Layer-by-Layer Investigation &amp; Selection History
            </h2>

            {/* Layer 1 */}
            <div className="sc-layer-box">
              <div className="sc-layer-header">
                <h3>LAYER 1 — IMAGE CREATION</h3>
                <span className="sc-selected-badge">SELECTED SOLUTION: NANO BANANA (Google Gemini API)</span>
              </div>
              <p className="sc-layer-desc">
                High-fidelity image generation engine tailored for creating brand-aligned local business visuals.
              </p>
              <div className="sc-platform-list">
                <div className="sc-platform-item selected">
                  <div className="pl-top">
                    <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="pl-name">Nano Banana (Google Gemini API) ↗</a>
                    <span className="status-badge active">SELECTED &amp; PROVEN LIVE</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Selection Rationale:</strong> Selected production image generator using model endpoint <code>models/nano-banana-pro-preview</code> via Google Gemini Developer API.
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://www.midjourney.com/" target="_blank" rel="noopener noreferrer" className="pl-name">Midjourney ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://openai.com/dall-e-3" target="_blank" rel="noopener noreferrer" className="pl-name">DALL-E 3 (OpenAI) ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://blackforestlabs.ai/" target="_blank" rel="noopener noreferrer" className="pl-name">Stable Diffusion / Flux ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://www.canva.com/" target="_blank" rel="noopener noreferrer" className="pl-name">Canva AI Image Generator ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 2 */}
            <div className="sc-layer-box">
              <div className="sc-layer-header">
                <h3>LAYER 2 — IMAGE → VIDEO (AI ANIMATION)</h3>
                <span className="sc-selected-badge">SELECTED SOLUTION: VEO 3.1 FAST (Google Gemini Developer API)</span>
              </div>
              <p className="sc-layer-desc">
                AI video generation and image animation engine converting static brand images into dynamic vertical 9:16 videos.
              </p>
              <div className="sc-platform-list">
                <div className="sc-platform-item selected">
                  <div className="pl-top">
                    <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="pl-name">Veo 3.1 Fast (Google Gemini Developer API) ↗</a>
                    <span className="status-badge active">SELECTED &amp; PROVEN LIVE</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Selection Rationale:</strong> Google Gemini Developer API endpoint <code>models/veo-3.1-fast-generate-preview:predictLongRunning</code> for fast 9:16 video synthesis from image prompts.
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://lumalabs.ai/dream-machine" target="_blank" rel="noopener noreferrer" className="pl-name">Luma Dream Machine ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://runwayml.com/" target="_blank" rel="noopener noreferrer" className="pl-name">Runway Gen-2 / Gen-3 ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://pika.art/" target="_blank" rel="noopener noreferrer" className="pl-name">Pika Labs ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://klingai.com/" target="_blank" rel="noopener noreferrer" className="pl-name">Kling AI ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://openai.com/sora" target="_blank" rel="noopener noreferrer" className="pl-name">OpenAI Sora ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 3 */}
            <div className="sc-layer-box">
              <div className="sc-layer-header">
                <h3>LAYER 3 — VIDEO ASSEMBLY, BRANDING &amp; TEMPLATES</h3>
                <span className="sc-selected-badge">SELECTED SOLUTION: CREATOMATE</span>
              </div>
              <p className="sc-layer-desc">
                Automated video rendering engine responsible for applying text overlays, headlines, call-to-action banners, audio stitching, and brand kit templates.
              </p>
              <div className="sc-platform-list">
                <div className="sc-platform-item selected">
                  <div className="pl-top">
                    <a href="https://creatomate.com" target="_blank" rel="noopener noreferrer" className="pl-name">Creatomate ↗</a>
                    <span className="status-badge active">SELECTED &amp; PROVEN LIVE</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Selection Rationale:</strong> Automated video rendering API for JSON template rendering, animated text overlays, headline styling, CTA placement, audio embedding, and brand kit enforcement.
                  </div>
                </div>

                <div className="sc-platform-item configured">
                  <div className="pl-top">
                    <a href="https://www.canva.com/" target="_blank" rel="noopener noreferrer" className="pl-name">Canva ↗</a>
                    <span className="status-badge configured">INVESTIGATED &amp; CONFIGURED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Important Operational Note:</strong> Canva is configured for manual design template creation, mockups, and brand asset drafting. It is <strong>NOT</strong> part of the automated W7 production rendering chain.
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://www.capcut.com/" target="_blank" rel="noopener noreferrer" className="pl-name">CapCut API ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://www.bannerbear.com/" target="_blank" rel="noopener noreferrer" className="pl-name">Bannerbear ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://invideo.io/" target="_blank" rel="noopener noreferrer" className="pl-name">InVideo API ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://www.remotion.dev/" target="_blank" rel="noopener noreferrer" className="pl-name">Remotion ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 4 */}
            <div className="sc-layer-box">
              <div className="sc-layer-header">
                <h3>LAYER 4 — SOCIAL PUBLISHING &amp; DISTRIBUTION</h3>
                <span className="sc-selected-badge">SELECTED SOLUTION: BUNDLE.SOCIAL</span>
              </div>
              <p className="sc-layer-desc">
                Multi-channel social media publishing API managing OAuth access tokens, multi-account routing, and scheduled post dispatch.
              </p>
              <div className="sc-platform-list">
                <div className="sc-platform-item selected">
                  <div className="pl-top">
                    <a href="https://bundle.social" target="_blank" rel="noopener noreferrer" className="pl-name">bundle.social ↗</a>
                    <span className="status-badge active">SELECTED &amp; PROVEN LIVE</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Selection Rationale:</strong> Unified REST API for publishing video and image content across Meta (Facebook &amp; Instagram), YouTube, LinkedIn, X, and TikTok.
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://buffer.com/" target="_blank" rel="noopener noreferrer" className="pl-name">Buffer API ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://www.hootsuite.com/" target="_blank" rel="noopener noreferrer" className="pl-name">Hootsuite API ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://www.ayrshare.com/" target="_blank" rel="noopener noreferrer" className="pl-name">Ayrshare ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://publer.io/" target="_blank" rel="noopener noreferrer" className="pl-name">Publer / Latepoint ↗</a>
                    <span className="status-badge status-norecord">NOT RECORDED</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Decision / Reason:</strong> Reason not recorded
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 5 */}
            <div className="sc-layer-box">
              <div className="sc-layer-header">
                <h3>LAYER 5 — SOCIAL NETWORKS &amp; ACCOUNT CONNECTIONS</h3>
                <span className="sc-selected-badge">LIVE STATUS BY NETWORK</span>
              </div>
              <p className="sc-layer-desc">
                Current operational status of target social networks within W7 Social and bundle.social integration.
              </p>
              <div className="sc-platform-list">

                <div className="sc-platform-item selected">
                  <div className="pl-top">
                    <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="pl-name">Facebook Page ↗</a>
                    <span className="status-badge active">PROVEN LIVE 🟢</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Live Verification Status:</strong> Fully proven in production. Real live posts published successfully via W7 Social → bundle.social → Facebook Page.
                  </div>
                </div>

                <div className="sc-platform-item configured">
                  <div className="pl-top">
                    <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="pl-name">Instagram Business Account ↗</a>
                    <span className="status-badge configured">CONNECTED &amp; CONFIGURED 🔵</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Live Verification Status:</strong> Meta Business Portfolio and Instagram Business Account connected via OAuth in bundle.social workspace; final live post publishing test pending verification.
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="pl-name">YouTube Shorts / Channel ↗</a>
                    <span className="status-badge status-unconnected">NOT YET CONNECTED / NOT PROVEN ⚪</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Live Verification Status:</strong> Supported in bundle.social platform architecture; actual TSE account connection not yet established or proven in production.
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="pl-name">LinkedIn Page ↗</a>
                    <span className="status-badge status-unconnected">NOT YET CONNECTED / NOT PROVEN ⚪</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Live Verification Status:</strong> Supported in bundle.social platform architecture; actual TSE account connection not yet established or proven in production.
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="pl-name">X / Twitter ↗</a>
                    <span className="status-badge status-unconnected">NOT YET CONNECTED / NOT PROVEN ⚪</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Live Verification Status:</strong> Supported in bundle.social platform architecture; actual TSE account connection not yet established or proven in production.
                  </div>
                </div>

                <div className="sc-platform-item rejected">
                  <div className="pl-top">
                    <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className="pl-name">TikTok ↗</a>
                    <span className="status-badge status-unconnected">NOT YET CONNECTED / NOT PROVEN ⚪</span>
                  </div>
                  <div className="pl-reason">
                    <strong>Live Verification Status:</strong> Supported in bundle.social platform architecture; actual TSE account connection not yet established or proven in production.
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Research / Decision Master Table */}
          <div className="ref-section">
            <h2 className="ref-section-title">
              <span>📊</span> Research &amp; Decision Master Table
            </h2>

            <div className="cost-table-wrapper">
              <table className="cost-register-table">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Layer</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Decision / Reason</th>
                  </tr>
                </thead>
                <tbody>

                  {/* Nano Banana */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Nano Banana ↗
                      </a>
                    </td>
                    <td>Layer 1: Image Creation</td>
                    <td>AI brand image generation</td>
                    <td><span className="status-badge active">PROVEN LIVE</span></td>
                    <td>Selected production image generator (Google Gemini API models/nano-banana-pro-preview)</td>
                  </tr>

                  {/* Midjourney */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://www.midjourney.com/" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Midjourney ↗
                      </a>
                    </td>
                    <td>Layer 1: Image Creation</td>
                    <td>AI image generation</td>
                    <td><span className="status-badge status-norecord">NOT RECORDED</span></td>
                    <td>Reason not recorded</td>
                  </tr>

                  {/* DALL-E 3 */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://openai.com/dall-e-3" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        DALL-E 3 ↗
                      </a>
                    </td>
                    <td>Layer 1: Image Creation</td>
                    <td>AI image generation</td>
                    <td><span className="status-badge status-norecord">NOT RECORDED</span></td>
                    <td>Reason not recorded</td>
                  </tr>

                  {/* Stable Diffusion */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://blackforestlabs.ai/" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Stable Diffusion / Flux ↗
                      </a>
                    </td>
                    <td>Layer 1: Image Creation</td>
                    <td>Open-source image model</td>
                    <td><span className="status-badge status-norecord">NOT RECORDED</span></td>
                    <td>Reason not recorded</td>
                  </tr>

                  {/* Veo 3.1 Fast */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Veo 3.1 Fast ↗
                      </a>
                    </td>
                    <td>Layer 2: Image → Video</td>
                    <td>Vertical 9:16 video generation</td>
                    <td><span className="status-badge active">PROVEN LIVE</span></td>
                    <td>Selected production video generator (Google Gemini Developer API models/veo-3.1-fast-generate-preview)</td>
                  </tr>

                  {/* Luma Dream Machine */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://lumalabs.ai/dream-machine" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Luma Dream Machine ↗
                      </a>
                    </td>
                    <td>Layer 2: Image → Video</td>
                    <td>AI video animation</td>
                    <td><span className="status-badge status-norecord">NOT RECORDED</span></td>
                    <td>Reason not recorded</td>
                  </tr>

                  {/* Runway */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://runwayml.com/" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Runway Gen-2 / Gen-3 ↗
                      </a>
                    </td>
                    <td>Layer 2: Image → Video</td>
                    <td>AI video synthesis</td>
                    <td><span className="status-badge status-norecord">NOT RECORDED</span></td>
                    <td>Reason not recorded</td>
                  </tr>

                  {/* Pika Labs */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://pika.art/" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Pika Labs ↗
                      </a>
                    </td>
                    <td>Layer 2: Image → Video</td>
                    <td>AI video animation</td>
                    <td><span className="status-badge status-norecord">NOT RECORDED</span></td>
                    <td>Reason not recorded</td>
                  </tr>

                  {/* Creatomate */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://creatomate.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Creatomate ↗
                      </a>
                    </td>
                    <td>Layer 3: Video Assembly</td>
                    <td>Template rendering, overlays &amp; CTA</td>
                    <td><span className="status-badge active">PROVEN LIVE</span></td>
                    <td>Selected production video template rendering API</td>
                  </tr>

                  {/* Canva */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://www.canva.com/" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Canva ↗
                      </a>
                    </td>
                    <td>Layer 3: Graphic Design</td>
                    <td>Manual templates &amp; asset mockups</td>
                    <td><span className="status-badge configured">CONFIGURED</span></td>
                    <td>Configured for manual asset design; NOT part of automated W7 backend pipeline</td>
                  </tr>

                  {/* CapCut */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://www.capcut.com/" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        CapCut API ↗
                      </a>
                    </td>
                    <td>Layer 3: Video Assembly</td>
                    <td>Social video editor</td>
                    <td><span className="status-badge status-norecord">NOT RECORDED</span></td>
                    <td>Reason not recorded</td>
                  </tr>

                  {/* Bannerbear */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://www.bannerbear.com/" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Bannerbear ↗
                      </a>
                    </td>
                    <td>Layer 3: Video Assembly</td>
                    <td>Automated media rendering</td>
                    <td><span className="status-badge status-norecord">NOT RECORDED</span></td>
                    <td>Reason not recorded</td>
                  </tr>

                  {/* bundle.social */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://bundle.social" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        bundle.social ↗
                      </a>
                    </td>
                    <td>Layer 4: Social Publishing</td>
                    <td>Multi-account social publishing API</td>
                    <td><span className="status-badge active">PROVEN LIVE</span></td>
                    <td>Selected production social publishing API</td>
                  </tr>

                  {/* Buffer */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://buffer.com/" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Buffer API ↗
                      </a>
                    </td>
                    <td>Layer 4: Social Publishing</td>
                    <td>Social scheduling API</td>
                    <td><span className="status-badge status-norecord">NOT RECORDED</span></td>
                    <td>Reason not recorded</td>
                  </tr>

                  {/* Ayrshare */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://www.ayrshare.com/" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Ayrshare ↗
                      </a>
                    </td>
                    <td>Layer 4: Social Publishing</td>
                    <td>Social API gateway</td>
                    <td><span className="status-badge status-norecord">NOT RECORDED</span></td>
                    <td>Reason not recorded</td>
                  </tr>

                  {/* Facebook Page */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Facebook Page ↗
                      </a>
                    </td>
                    <td>Layer 5: Social Network</td>
                    <td>Target social publishing channel</td>
                    <td><span className="status-badge active">PROVEN LIVE</span></td>
                    <td>Proven end-to-end publishing via W7 → bundle.social → Facebook Page</td>
                  </tr>

                  {/* Instagram Business */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        Instagram Business ↗
                      </a>
                    </td>
                    <td>Layer 5: Social Network</td>
                    <td>Target social publishing channel</td>
                    <td><span className="status-badge configured">CONNECTED &amp; CONFIGURED</span></td>
                    <td>Meta Business Portfolio linked; end-to-end live post dispatch pending final test</td>
                  </tr>

                  {/* YouTube Shorts */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        YouTube Shorts ↗
                      </a>
                    </td>
                    <td>Layer 5: Social Network</td>
                    <td>Target vertical video channel</td>
                    <td><span className="status-badge status-unconnected">NOT YET CONNECTED / NOT PROVEN</span></td>
                    <td>Actual TSE account connection not yet established or proven in production</td>
                  </tr>

                  {/* LinkedIn */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        LinkedIn Page ↗
                      </a>
                    </td>
                    <td>Layer 5: Social Network</td>
                    <td>Target social publishing channel</td>
                    <td><span className="status-badge status-unconnected">NOT YET CONNECTED / NOT PROVEN</span></td>
                    <td>Actual TSE account connection not yet established or proven in production</td>
                  </tr>

                  {/* X / Twitter */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        X / Twitter ↗
                      </a>
                    </td>
                    <td>Layer 5: Social Network</td>
                    <td>Target social publishing channel</td>
                    <td><span className="status-badge status-unconnected">NOT YET CONNECTED / NOT PROVEN</span></td>
                    <td>Actual TSE account connection not yet established or proven in production</td>
                  </tr>

                  {/* TikTok */}
                  <tr>
                    <td className="provider-cell">
                      <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className="cost-provider-link">
                        TikTok ↗
                      </a>
                    </td>
                    <td>Layer 5: Social Network</td>
                    <td>Target vertical video channel</td>
                    <td><span className="status-badge status-unconnected">NOT YET CONNECTED / NOT PROVEN</span></td>
                    <td>Actual TSE account connection not yet established or proven in production</td>
                  </tr>

                </tbody>
              </table>
            </div>

          </div>

          {/* Security & Confidentiality Footer */}
          <div className="ref-section" style={{ marginTop: '2rem', marginBottom: 0 }}>
            <div className="ref-step-desc" style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #1e293b' }}>
              🔒 <strong>Security Protocol:</strong> API keys, bearer tokens, OAuth secrets, and passwords are not displayed and remain encrypted in server environment storage.
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
