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
          <span>⚡</span> TSE GOLDEN RULE FOR {activeGuide.id === 'google-tree' ? 'GOOGLE ARCHITECTURE' : 'SOCIAL CONNECTIONS'}
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

              <div className="ref-step-item">
                <div className="ref-step-header">
                  <span className="ref-step-number">4</span>
                  <span className="ref-step-title">Skip Unnecessary Onboarding Steps</span>
                </div>
                <div className="ref-step-desc">
                  Skip optional profile marketing or promotion onboarding screens unless specifically needed.
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
                <div
                  className="ref-screenshot-container"
                  onClick={() => setLightboxImage({ url: '/reference-archive/fb-ig-assets/image1.png', title: 'Meta Business Suite — Kitchen Page selected; use Connect Instagram' })}
                >
                  <img src="/reference-archive/fb-ig-assets/image1.png" alt="Meta Business Suite Connect Instagram" className="ref-screenshot-img" />
                  <div className="ref-screenshot-caption">
                    <span>Meta Business Suite — Kitchen Page selected; use Connect Instagram.</span>
                    <span className="ref-zoom-hint">🔍 Click to enlarge</span>
                  </div>
                </div>
              </div>

              <div className="ref-step-item">
                <div className="ref-step-header">
                  <span className="ref-step-number">2</span>
                  <span className="ref-step-title">Enable Instagram Message Access</span>
                </div>
                <div className="ref-step-desc">
                  Leave Instagram message access enabled and click <strong>Continue</strong>.
                </div>
                <div
                  className="ref-screenshot-container"
                  onClick={() => setLightboxImage({ url: '/reference-archive/fb-ig-assets/image2.png', title: 'Instagram message access — leave enabled and Continue' })}
                >
                  <img src="/reference-archive/fb-ig-assets/image2.png" alt="Instagram Message Access" className="ref-screenshot-img" />
                  <div className="ref-screenshot-caption">
                    <span>Instagram message access — leave enabled and Continue.</span>
                    <span className="ref-zoom-hint">🔍 Click to enlarge</span>
                  </div>
                </div>
              </div>

              <div className="ref-step-item">
                <div className="ref-step-header">
                  <span className="ref-step-number">3</span>
                  <span className="ref-step-title">Log into Business Instagram &amp; Confirm Business Type</span>
                </div>
                <div className="ref-step-desc">
                  Log into the new business Instagram account when prompted. If Instagram asks what best describes the account, select <strong>Business</strong> and complete conversion.
                </div>
              </div>

              <div className="ref-step-item">
                <div className="ref-step-header">
                  <span className="ref-step-number">4</span>
                  <span className="ref-step-title">Add Instagram Profile to Meta Business Portfolio</span>
                </div>
                <div className="ref-step-desc">
                  When Meta states the Instagram profile will be added to the business portfolio, click <strong>Add</strong>.
                </div>
                <div
                  className="ref-screenshot-container"
                  onClick={() => setLightboxImage({ url: '/reference-archive/fb-ig-assets/image3.png', title: 'Add the Instagram profile to the I Want A New Kitchen Business Portfolio' })}
                >
                  <img src="/reference-archive/fb-ig-assets/image3.png" alt="Add Instagram to Business Portfolio" className="ref-screenshot-img" />
                  <div className="ref-screenshot-caption">
                    <span>Add the Instagram profile to the I Want A New Kitchen Business Portfolio.</span>
                    <span className="ref-zoom-hint">🔍 Click to enlarge</span>
                  </div>
                </div>
              </div>

              <div className="ref-step-item">
                <div className="ref-step-header">
                  <span className="ref-step-number">5</span>
                  <span className="ref-step-title">Confirm Connection &amp; View Portfolio Summary</span>
                </div>
                <div className="ref-step-desc">
                  Finish only when Meta explicitly confirms that the Facebook Page is connected to the Instagram profile. Verify both assets appear together under the Business Portfolio summary.
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                  <div
                    className="ref-screenshot-container"
                    style={{ flex: '1 1 300px' }}
                    onClick={() => setLightboxImage({ url: '/reference-archive/fb-ig-assets/image4.png', title: 'Confirmation that the Facebook Page and @iwantanewkitchenuk are connected' })}
                  >
                    <img src="/reference-archive/fb-ig-assets/image4.png" alt="Connection Confirmation" className="ref-screenshot-img" />
                    <div className="ref-screenshot-caption">
                      <span>Meta connection confirmation.</span>
                      <span className="ref-zoom-hint">🔍 Enlarge</span>
                    </div>
                  </div>
                  <div
                    className="ref-screenshot-container"
                    style={{ flex: '1 1 300px' }}
                    onClick={() => setLightboxImage({ url: '/reference-archive/fb-ig-assets/image5.png', title: 'Business Portfolio summary showing Facebook + Instagram together' })}
                  >
                    <img src="/reference-archive/fb-ig-assets/image5.png" alt="Portfolio Summary" className="ref-screenshot-img" />
                    <div className="ref-screenshot-caption">
                      <span>Business Portfolio summary.</span>
                      <span className="ref-zoom-hint">🔍 Enlarge</span>
                    </div>
                  </div>
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
                <div
                  className="ref-screenshot-container"
                  onClick={() => setLightboxImage({ url: '/reference-archive/fb-ig-assets/image6.png', title: 'bundle.social — choose Connect via Facebook' })}
                >
                  <img src="/reference-archive/fb-ig-assets/image6.png" alt="bundle.social Connect via Facebook" className="ref-screenshot-img" />
                  <div className="ref-screenshot-caption">
                    <span>bundle.social — choose Connect via Facebook.</span>
                    <span className="ref-zoom-hint">🔍 Click to enlarge</span>
                  </div>
                </div>
              </div>

              <div className="ref-step-item">
                <div className="ref-step-header">
                  <span className="ref-step-number">2</span>
                  <span className="ref-step-title">Correct Meta OAuth Asset Selections</span>
                </div>
                <div className="ref-step-desc" style={{ marginBottom: '1rem' }}>
                  During Meta OAuth, follow strict asset isolation:
                  <ul style={{ margin: '0.5rem 0 0 1.2rem', padding: 0 }}>
                    <li style={{ marginBottom: '0.3rem' }}><strong>Meta Pages screen:</strong> Choose <em>&quot;Opt in to current Pages only&quot;</em> and select ONLY the matching Facebook Page.</li>
                    <li style={{ marginBottom: '0.3rem' }}><strong>Meta Businesses screen:</strong> Choose <em>&quot;Opt in to current Businesses only&quot;</em> and select ONLY the matching business portfolio.</li>
                    <li><strong>Meta Instagram screen:</strong> Choose <em>&quot;Opt in to current Instagram accounts only&quot;</em> and select ONLY the matching Instagram account.</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>

          {/* Section 4 */}
          <div className="ref-section" id="section-kitchen-example">
            <h2 className="ref-section-title">
              <span>📋</span> Proven Setup Example — I Want A New Kitchen
            </h2>
            <table className="ref-config-table">
              <thead>
                <tr>
                  <th>Configuration Property</th>
                  <th>Proven Setup Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Meta Business Portfolio</td>
                  <td>I Want A New Kitchen</td>
                </tr>
                <tr>
                  <td>Facebook Page</td>
                  <td>I Want A New Kitchen</td>
                </tr>
                <tr>
                  <td>Instagram Handle</td>
                  <td><code>@iwantanewkitchenuk</code></td>
                </tr>
                <tr>
                  <td>Instagram Account Type</td>
                  <td>Professional → Business</td>
                </tr>
                <tr>
                  <td>bundle.social Team</td>
                  <td>I Want A New Kitchen</td>
                </tr>
              </tbody>
            </table>
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
            <div className="ref-step-desc">
              Authoritative visual map of Google consumer products, developer AI Studio API tools, Google Cloud Console, and Vertex AI enterprise services.
            </div>

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

          {/* Section 2: Model Relationship */}
          <div className="ref-section">
            <h2 className="ref-section-title">
              <span>🤖</span> Model Relationship &amp; Functional Breakdown
            </h2>
            <div className="ref-models-grid">
              <div className="ref-model-card">
                <div className="ref-model-tag tag-gemini">Gemini API</div>
                <h3 className="ref-model-name">Gemini Models</h3>
                <p className="ref-model-desc">Text generation, reasoning, code synthesis, and multimodal AI analysis.</p>
              </div>

              <div className="ref-model-card">
                <div className="ref-model-tag tag-nano">Gemini API</div>
                <h3 className="ref-model-name">Nano Banana</h3>
                <p className="ref-model-desc">IMAGE generation, photo editing, visual synthesis, and prompt-driven graphic creation.</p>
              </div>

              <div className="ref-model-card">
                <div className="ref-model-tag tag-veo">Gemini API</div>
                <h3 className="ref-model-name">Veo</h3>
                <p className="ref-model-desc">VIDEO generation, image animation, and dynamic video clip creation.</p>
              </div>
            </div>
          </div>

          {/* Section 3: Developer Routes */}
          <div className="ref-section">
            <h2 className="ref-section-title">
              <span>🛠️</span> Developer Integration Routes
            </h2>
            <div className="ref-routes-grid">
              
              <div className="ref-route-card">
                <div className="ref-route-header">
                  <span className="ref-route-badge badge-studio">SIMPLER ROUTE</span>
                  <h3>Gemini Developer API</h3>
                </div>
                <ul className="ref-route-list">
                  <li><strong>API Key Based:</strong> Fast setup via Google AI Studio</li>
                  <li><strong>Testing Playground:</strong> Direct prompt engineering &amp; token testing</li>
                  <li><strong>Usage:</strong> Programmatic access for web apps (e.g. W7 Social)</li>
                </ul>
              </div>

              <div className="ref-route-card">
                <div className="ref-route-header">
                  <span className="ref-route-badge badge-cloud">ENTERPRISE ROUTE</span>
                  <h3>Vertex AI (Google Cloud)</h3>
                </div>
                <ul className="ref-route-list">
                  <li><strong>Google Cloud Infrastructure:</strong> Project-based IAM &amp; quotas</li>
                  <li><strong>Enterprise Controls:</strong> Custom fine-tuning, SLA guarantees, and security compliance</li>
                  <li><strong>Partner Models:</strong> Access to third-party &amp; Google Cloud ecosystem models</li>
                </ul>
              </div>

            </div>
          </div>

          {/* Section 4: Our W7 Workflow Pipeline */}
          <div className="ref-section">
            <h2 className="ref-section-title">
              <span>🎬</span> Our W7 Social Video Publishing Workflow
            </h2>
            <div className="ref-pipeline-container">
              <div className="ref-pipe-step">
                <span className="pipe-num">1</span>
                <span className="pipe-title">W7 SOCIAL</span>
                <span className="pipe-sub">User initiates video campaign</span>
              </div>
              <span className="pipe-arrow">↓</span>

              <div className="ref-pipe-step pipe-highlight">
                <span className="pipe-num">2</span>
                <span className="pipe-title">GOOGLE AI API</span>
                <div className="pipe-sub-box">
                  <span><strong>Nano Banana:</strong> Create image</span>
                  <span><strong>Veo:</strong> Animate image into video</span>
                </div>
              </div>
              <span className="pipe-arrow">↓</span>

              <div className="ref-pipe-step">
                <span className="pipe-num">3</span>
                <span className="pipe-title">CREATOMATE</span>
                <span className="pipe-sub">Text overlays, branding theme &amp; audio rendering</span>
              </div>
              <span className="pipe-arrow">↓</span>

              <div className="ref-pipe-step">
                <span className="pipe-num">4</span>
                <span className="pipe-title">BUNDLE.SOCIAL</span>
                <span className="pipe-sub">Multi-channel dispatch supervisor</span>
              </div>
              <span className="pipe-arrow">↓</span>

              <div className="ref-pipe-step pipe-final">
                <span className="pipe-num">5</span>
                <span className="pipe-title">SOCIAL NETWORKS</span>
                <span className="pipe-sub">Published to Facebook Page &amp; Instagram Profile</span>
              </div>
            </div>
          </div>

          {/* Security & Confidentiality Footer */}
          <div className="ref-section" style={{ marginBottom: 0 }}>
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
