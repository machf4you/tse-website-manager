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
          <span>⚡</span> TSE GOLDEN RULE FOR SOCIAL CONNECTIONS
        </div>
        <div className="ref-core-rule-text">
          {activeGuide.coreRule}
        </div>
      </div>

      {/* Guide Content Card */}
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

          {/* Section 1: Create Instagram Account */}
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

          {/* Section 2: Link Instagram to Facebook Page */}
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

          {/* Section 3: Connect to bundle.social */}
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
                    <li style={{ marginBottom: '0.3rem' }}><strong>Meta Businesses screen:</strong> Choose <em>&quot;Opt in to current Businesses only&quot;</em> and select ONLY the matching business portfolio (for Kitchen, select <em>I Want A New Kitchen</em> — not an older umbrella portfolio).</li>
                    <li><strong>Meta Instagram screen:</strong> Choose <em>&quot;Opt in to current Instagram accounts only&quot;</em> and select ONLY the matching Instagram account.</li>
                  </ul>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div
                    className="ref-screenshot-container"
                    onClick={() => setLightboxImage({ url: '/reference-archive/fb-ig-assets/image7.png', title: 'Meta OAuth — current Pages only; select only I Want A New Kitchen' })}
                  >
                    <img src="/reference-archive/fb-ig-assets/image7.png" alt="Meta OAuth Pages" className="ref-screenshot-img" />
                    <div className="ref-screenshot-caption">
                      <span>1. Current Pages only.</span>
                      <span className="ref-zoom-hint">🔍 Enlarge</span>
                    </div>
                  </div>

                  <div
                    className="ref-screenshot-container"
                    onClick={() => setLightboxImage({ url: '/reference-archive/fb-ig-assets/image8.png', title: 'Meta OAuth — current Businesses only; select the I Want A New Kitchen portfolio' })}
                  >
                    <img src="/reference-archive/fb-ig-assets/image8.png" alt="Meta OAuth Businesses" className="ref-screenshot-img" />
                    <div className="ref-screenshot-caption">
                      <span>2. Current Businesses only.</span>
                      <span className="ref-zoom-hint">🔍 Enlarge</span>
                    </div>
                  </div>

                  <div
                    className="ref-screenshot-container"
                    onClick={() => setLightboxImage({ url: '/reference-archive/fb-ig-assets/image9.png', title: 'Meta OAuth — current Instagram accounts only; select @iwantanewkitchenuk' })}
                  >
                    <img src="/reference-archive/fb-ig-assets/image9.png" alt="Meta OAuth Instagram" className="ref-screenshot-img" />
                    <div className="ref-screenshot-caption">
                      <span>3. Current Instagram only.</span>
                      <span className="ref-zoom-hint">🔍 Enlarge</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ref-step-item">
                <div className="ref-step-header">
                  <span className="ref-step-number">3</span>
                  <span className="ref-step-title">Permissions &amp; Final Confirmation</span>
                </div>
                <div className="ref-step-desc">
                  On the final permissions review, leave all requested permissions enabled (access profile/posts, upload media, create posts). 
                  Save/Continue and return to bundle.social. Confirm the Instagram account appears under the correct team before publishing.
                </div>
              </div>

            </div>
          </div>

          {/* Section 4: Kitchen Configuration Example */}
          <div className="ref-section" id="section-kitchen-example">
            <h2 className="ref-section-title">
              <span>📋</span> Proven Setup Example — I Want A New Kitchen
            </h2>
            <div className="ref-step-desc">
              Reference configuration established and verified on 2 October 2026:
            </div>
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
                <tr>
                  <td>OAuth Scope Approach</td>
                  <td>Current assets only; Kitchen assets only</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 5: Avoid These Traps */}
          <div className="ref-section" id="section-traps">
            <h2 className="ref-section-title" style={{ color: '#f87171' }}>
              <span>⚠️</span> Avoid These Traps
            </h2>
            <div className="ref-traps-grid">
              
              <div className="ref-trap-card">
                <span className="ref-trap-icon">🚫</span>
                <div className="ref-trap-text">
                  <strong>Do NOT use browser developer console tricks:</strong> Never attempt to bypass Facebook connection errors using dev console hacks. Fix permissions properly in Meta Business Suite.
                </div>
              </div>

              <div className="ref-trap-card">
                <span className="ref-trap-icon">🚫</span>
                <div className="ref-trap-text">
                  <strong>Do NOT select &quot;All current and future assets&quot;:</strong> Always select <em>current assets only</em> during Meta OAuth to prevent giving bundle.social blanket access to unrelated pages.
                </div>
              </div>

              <div className="ref-trap-card">
                <span className="ref-trap-icon">🚫</span>
                <div className="ref-trap-text">
                  <strong>Do NOT mix assets across teams:</strong> Keep each business unit strictly isolated inside its own bundle.social team.
                </div>
              </div>

              <div className="ref-trap-card">
                <span className="ref-trap-icon">🚫</span>
                <div className="ref-trap-text">
                  <strong>Do NOT assume initial API acceptance equals Published:</strong> bundle.social initial 200 OK only means queued. W7 Social verifies actual provider delivery status before declaring success.
                </div>
              </div>

              <div className="ref-trap-card">
                <span className="ref-trap-icon">🚫</span>
                <div className="ref-trap-text">
                  <strong>Do NOT use legacy umbrella portfolios:</strong> Once a business has its own proper Meta Business Portfolio, use that dedicated portfolio instead of older personal or legacy portfolios.
                </div>
              </div>

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
