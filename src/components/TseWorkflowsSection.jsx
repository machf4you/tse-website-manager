import React from 'react'
import './TseWorkflowsSection.css'

const ExternalLinkIcon = ({ size = 11 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ opacity: 0.8 }}
    aria-hidden="true"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

export default function TseWorkflowsSection({ onOpenWebsiteManager }) {
  const workflows = [
    {
      num: 1,
      name: 'NEW WEBSITE',
      accent: '#10b981',
      quickStages: [
        { label: 'Site Registry', link: 'https://site-registry.thesearchequation.co.uk/' },
        { label: 'Website Manager W1', action: onOpenWebsiteManager },
        { label: 'W2 Website Data' },
        { label: 'W3 Page Strategy' },
        { label: 'W4 Page Audit' },
        { label: 'W5 Internal Linking' },
        { label: 'Monitoring' }
      ],
      quickPurpose: 'Take a newly connected or acquired website from initial registration through to a fully mapped, audited and actively managed website.',
      fullTitle: 'WORKFLOW 1 — NEW WEBSITE / DOMAIN',
      fullLead: 'When a new website or domain comes into TSE, the first step is to establish it as a managed asset.',
      fullStagesText: 'Site Registry → Website Manager W1 → W2 → W3 → W4 → W5 → Ongoing Monitoring',
      steps: [
        {
          title: 'SITE REGISTRY',
          link: 'https://site-registry.thesearchequation.co.uk/',
          desc: 'Create the master record for the website or domain. This establishes ownership, portfolio, platform, registrar information, expiry information and the other core information TSE needs to manage the asset.'
        },
        {
          title: 'WEBSITE MANAGER W1 — CONNECT WEBSITE',
          action: onOpenWebsiteManager,
          desc: 'Connect the website to Website Manager and establish the technical connection required to manage it.'
        },
        {
          title: 'W2 — WEBSITE DATA',
          desc: "Load and synchronise the website's pages and URLs so TSE has an accurate representation of the live website."
        },
        {
          title: 'W3 — PAGE STRATEGY',
          desc: 'Organise the website structure, identify the important pages, assign target search phrases and establish page priorities.'
        },
        {
          title: 'W4 — PAGE AUDIT',
          desc: 'Audit the managed pages and identify SEO, content and optimisation issues that need attention.'
        },
        {
          title: 'W5 — INTERNAL LINKING',
          desc: "Analyse how the website's pages link together, identify weak or under-supported pages and create appropriate internal-link opportunities."
        },
        {
          title: 'ONGOING MONITORING',
          desc: 'Once the website has been structured and improved, continue monitoring rankings, Google Search Console, analytics, uptime, indexing and other important website signals.'
        }
      ],
      purposeText: 'Take a website from "we have just connected it" to "this is a fully understood, structured and actively managed TSE website."'
    },
    {
      num: 2,
      name: 'NEW CLIENT LEAD',
      accent: '#6366f1',
      quickStages: [
        { label: 'Lead Generator V2', link: 'https://lead-gen.thesearchequation.co.uk/' },
        { label: 'Find Businesses' },
        { label: 'Site Analyzer' },
        { label: 'Qualify Opportunity' },
        { label: 'Outreach' },
        { label: 'Won Client' },
        { label: 'Site Registry', link: 'https://site-registry.thesearchequation.co.uk/' },
        { label: 'Website Manager', action: onOpenWebsiteManager }
      ],
      quickPurpose: 'Move from finding potential customers to bringing a successful new client into the normal TSE website-management process.',
      fullTitle: 'WORKFLOW 2 — FIND AND WIN A NEW CLIENT',
      fullLead: 'The lead-generation workflow starts before a website becomes a managed TSE website.',
      fullStagesText: 'Lead Generator V2 → Find Businesses → Site Analyzer → Qualify → Outreach → Won Client → Site Registry → Website Manager',
      steps: [
        {
          title: 'LEAD GENERATOR V2',
          link: 'https://lead-gen.thesearchequation.co.uk/',
          desc: 'Search for suitable businesses by service, profession, location or other targeting criteria.'
        },
        {
          title: 'FIND BUSINESSES',
          desc: 'Collect the business, website and available contact information required to evaluate the opportunity.'
        },
        {
          title: 'SITE ANALYZER',
          desc: 'Run an initial website analysis to identify obvious SEO, website and growth opportunities.'
        },
        {
          title: 'QUALIFY',
          desc: 'Determine whether the business represents a worthwhile prospect for TSE.'
        },
        {
          title: 'OUTREACH',
          desc: 'Use the information discovered during research and analysis to create relevant, personalised outreach.'
        },
        {
          title: 'WON CLIENT',
          desc: 'Once the business becomes a client, it moves out of the prospecting workflow and into the managed TSE environment.'
        },
        {
          title: 'SITE REGISTRY',
          link: 'https://site-registry.thesearchequation.co.uk/',
          desc: 'Create the permanent website/domain record.'
        },
        {
          title: 'WEBSITE MANAGER',
          action: onOpenWebsiteManager,
          desc: 'Begin the normal New Website workflow.'
        }
      ],
      purposeText: 'Move from "find businesses that may need our help" to "new client website actively managed by TSE."'
    },
    {
      num: 3,
      name: 'IMPROVE AN EXISTING WEBSITE',
      accent: '#0ea5e9',
      quickStages: [
        { label: 'Site Registry', link: 'https://site-registry.thesearchequation.co.uk/' },
        { label: 'Website Manager', action: onOpenWebsiteManager },
        { label: 'W2 Sync' },
        { label: 'W3 Review' },
        { label: 'W4 Audit' },
        { label: 'Fix / Improve' },
        { label: 'W5 Internal Links' },
        { label: 'Re-sync' },
        { label: 'Monitor' }
      ],
      quickPurpose: 'The regular SEO improvement cycle for websites already managed by TSE.',
      fullTitle: 'WORKFLOW 3 — IMPROVE AN EXISTING WEBSITE',
      fullLead: 'Existing websites need an ongoing improvement cycle rather than a one-off audit.',
      fullStagesText: 'Site Registry → Website Manager → W2 Sync → W3 Review → W4 Audit → Improvements → W5 Internal Linking → Re-sync → Monitor',
      steps: [
        {
          title: 'SELECT WEBSITE',
          desc: "Start from the website's managed record."
        },
        {
          title: 'W2 SYNC',
          desc: 'Pull the latest website information so decisions are being made against the current live website.'
        },
        {
          title: 'W3 REVIEW',
          desc: "Check page structure, target phrases, priorities and the site's current SEO strategy."
        },
        {
          title: 'W4 AUDIT',
          desc: 'Identify pages that need content, SEO or optimisation improvements.'
        },
        {
          title: 'IMPROVE',
          desc: 'Make the appropriate content, technical or on-page changes.'
        },
        {
          title: 'W5 INTERNAL LINKING',
          desc: "Review the site's internal-link structure and strengthen important pages with appropriate contextual links."
        },
        {
          title: 'RE-SYNC',
          desc: "Synchronise Website Manager after changes so TSE's stored website data reflects the live site."
        },
        {
          title: 'MONITOR',
          desc: 'Measure what happens after the improvements.'
        }
      ],
      purposeText: 'Provide a repeatable SEO improvement cycle rather than treating optimisation as a one-time job.'
    },
    {
      num: 4,
      name: 'CONTENT / SEO EXPANSION',
      accent: '#f59e0b',
      quickStages: [
        { label: 'Identify Opportunity' },
        { label: 'Create New Page' },
        { label: 'W3 Target Phrase' },
        { label: 'Publish' },
        { label: 'W2 Sync' },
        { label: 'W4 Audit' },
        { label: 'W5 Internal Linking' },
        { label: 'Monitor' }
      ],
      quickPurpose: "Create and integrate new service, location and topical pages while maintaining the site's SEO structure.",
      fullTitle: 'WORKFLOW 4 — CONTENT / SEO EXPANSION',
      fullLead: 'Websites need to grow when new search opportunities are identified.',
      fullStagesText: 'Identify Opportunity → Create Page → W3 Target → Publish → W2 Sync → W4 Audit → W5 Internal Linking → Monitor',
      steps: [
        {
          title: 'IDENTIFY OPPORTUNITY',
          desc: 'Identify a missing service, location, product, category or informational topic that deserves its own page.'
        },
        {
          title: 'CREATE PAGE',
          desc: 'Produce the new page and place it correctly within the website structure.'
        },
        {
          title: 'W3 TARGET',
          desc: 'Assign the appropriate target search phrase and page priority.'
        },
        {
          title: 'PUBLISH',
          desc: 'Publish the page to the live website.'
        },
        {
          title: 'W2 SYNC',
          desc: 'Bring the new page into Website Manager.'
        },
        {
          title: 'W4 AUDIT',
          desc: 'Check that the new page meets the required SEO and content standards.'
        },
        {
          title: 'W5 INTERNAL LINKING',
          desc: 'Connect the new page appropriately to the existing website and identify relevant pages that should link to it.'
        },
        {
          title: 'MONITOR',
          desc: 'Track indexing, rankings, impressions, traffic and performance.'
        }
      ],
      purposeText: "Expand a website in a controlled way while ensuring every new page becomes part of the site's overall SEO structure."
    },
    {
      num: 5,
      name: 'BUILD AUTHORITY / BACKLINKS',
      accent: '#8b5cf6',
      quickStages: [
        { label: 'Choose Website' },
        { label: 'Choose Target Page' },
        { label: 'Create Backlinks' },
        { label: 'Select Provider' },
        { label: 'Find Best Source' },
        { label: 'Quality Check' },
        { label: 'Publish Backlink' },
        { label: 'Record & Monitor' }
      ],
      quickPurpose: 'Build external authority to important website pages using controlled, measurable backlink opportunities.',
      fullTitle: 'WORKFLOW 5 — BUILD AUTHORITY / BACKLINKS',
      fullLead: 'Once the website itself is organised correctly, important pages can be strengthened externally.',
      fullStagesText: 'Choose Website → Choose Target Page → Create Backlinks → Select Provider → Find Source Domains → Quality Check → Create / Publish → Record → Monitor',
      steps: [
        {
          title: 'CHOOSE WEBSITE',
          desc: 'Select the website requiring additional authority.'
        },
        {
          title: 'CHOOSE TARGET PAGE',
          desc: 'Decide which page should receive the backlink based on SEO priorities.'
        },
        {
          title: 'CREATE BACKLINKS',
          desc: 'Open the backlink workflow for that target.'
        },
        {
          title: 'SELECT PROVIDER',
          desc: 'Choose the appropriate backlink provider or available publishing network.'
        },
        {
          title: 'FIND SOURCE DOMAINS',
          desc: 'Identify eligible websites that can provide the backlink. The system should exclude source domains that already have a published backlink to the selected target where appropriate.'
        },
        {
          title: 'QUALITY CHECK',
          desc: 'Rank the remaining opportunities so the strongest and most relevant sources can be considered first.'
        },
        {
          title: 'CREATE / PUBLISH',
          desc: 'Prepare the content and place the backlink.'
        },
        {
          title: 'RECORD',
          desc: 'Store the completed backlink so TSE knows exactly which source is linking to which target.'
        },
        {
          title: 'MONITOR',
          desc: 'Continue monitoring the backlink and the target page.'
        }
      ],
      purposeText: 'Build external authority systematically instead of creating backlinks without knowing what already exists or which pages actually need support.'
    },
    {
      num: 6,
      name: 'SOCIAL DISTRIBUTION',
      accent: '#ec4899',
      quickStages: [
        { label: 'Choose Website / Brand' },
        { label: 'Select Content' },
        { label: 'Create Social Content' },
        { label: 'Approve' },
        { label: 'Social Automation', link: 'https://automation.thesearchequation.co.uk/' },
        { label: 'Publish to Networks' },
        { label: 'Monitor' }
      ],
      quickPurpose: 'Turn website content, services and campaigns into coordinated social promotion across the appropriate networks.',
      fullTitle: 'WORKFLOW 6 — SOCIAL DISTRIBUTION',
      fullLead: 'Website content should also provide material for ongoing social promotion.',
      fullStagesText: 'Choose Website / Brand → Select Content → Create Social Content → Approve → Social Automation → Publish → Monitor',
      steps: [
        {
          title: 'CHOOSE WEBSITE / BRAND',
          desc: 'Select the business or website being promoted.'
        },
        {
          title: 'SELECT CONTENT',
          desc: 'Choose the service, product, article, campaign or other website content that should be promoted.'
        },
        {
          title: 'CREATE SOCIAL CONTENT',
          desc: 'Create suitable posts and supporting content for the appropriate social channels.'
        },
        {
          title: 'APPROVE',
          desc: 'Review the content before automated distribution where approval is required.'
        },
        {
          title: 'SOCIAL AUTOMATION',
          link: 'https://automation.thesearchequation.co.uk/',
          desc: 'Pass approved content into the TSE social automation workflow.'
        },
        {
          title: 'PUBLISH',
          desc: 'Distribute it to the appropriate connected social networks.'
        },
        {
          title: 'MONITOR',
          desc: 'Track activity and maintain the ongoing publishing schedule.'
        }
      ],
      purposeText: 'Turn the websites and content TSE already manages into a consistent source of social activity without requiring each network to be managed independently.'
    }
  ]

  const renderStagePill = (stage, idx, total) => {
    const isLast = idx === total - 1

    let pillContent = (
      <span className="tse-stage-pill">
        {stage.label}
      </span>
    )

    if (stage.link) {
      pillContent = (
        <a
          href={stage.link}
          target="_blank"
          rel="noopener noreferrer"
          className="tse-stage-pill is-link"
          title={`Open ${stage.label}`}
        >
          {stage.label}
          <ExternalLinkIcon />
        </a>
      )
    } else if (stage.action) {
      pillContent = (
        <button
          type="button"
          onClick={stage.action}
          className="tse-stage-pill is-active-app"
          title={`Launch ${stage.label}`}
          style={{ border: 'none', font: 'inherit' }}
        >
          {stage.label} ↗
        </button>
      )
    }

    return (
      <React.Fragment key={idx}>
        {pillContent}
        {!isLast && <span className="tse-stage-arrow" aria-hidden="true">→</span>}
      </React.Fragment>
    )
  }

  return (
    <section className="tse-workflows-container" aria-labelledby="tse-workflows-heading">
      {/* Section Header */}
      <div className="tse-workflows-header">
        <div className="tse-workflows-badge">
          <span>⚙️ Operational Guide</span>
        </div>
        <h2 id="tse-workflows-heading" className="tse-workflows-title">
          TSE WORKFLOWS
        </h2>
        <h3 className="tse-workflows-subheading">
          How the TSE Apps work together
        </h3>
        <p className="tse-workflows-intro">
          The TSE platform is designed as a connected set of tools rather than separate applications. These workflows show how to move from finding or connecting a website through to improving, promoting and monitoring it.
        </p>
      </div>

      {/* PART 1 — QUICK WORKFLOW SUMMARY */}
      <div className="tse-workflows-part">
        <div className="tse-part-header">
          <span className="tse-part-tag">Part 1</span>
          <h4 className="tse-part-title">QUICK WORKFLOW SUMMARY</h4>
        </div>

        <div className="tse-quick-summary-grid">
          {workflows.map((wf) => (
            <div
              key={wf.num}
              className="tse-quick-card"
              style={{ '--wf-accent': wf.accent }}
            >
              <div className="tse-quick-card-top">
                <div className="tse-quick-num-title">
                  <span className="tse-quick-badge">0{wf.num}</span>
                  <h5 className="tse-quick-name">{wf.name}</h5>
                </div>
              </div>

              {/* Stage sequence row */}
              <div className="tse-stage-flow">
                {wf.quickStages.map((stage, sIdx) =>
                  renderStagePill(stage, sIdx, wf.quickStages.length)
                )}
              </div>

              <p className="tse-quick-purpose">
                <strong>Purpose:</strong> {wf.quickPurpose}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* PART 2 — FULL WORKFLOW EXPLANATION */}
      <div className="tse-workflows-part">
        <div className="tse-part-header">
          <span className="tse-part-tag">Part 2</span>
          <h4 className="tse-part-title">FULL WORKFLOW EXPLANATION</h4>
        </div>

        <div className="tse-full-explanations-list">
          {workflows.map((wf) => (
            <article
              key={wf.num}
              className="tse-full-wf-card"
              style={{ '--wf-accent': wf.accent }}
            >
              <div className="tse-full-wf-header">
                <span className="tse-full-wf-num-badge">Workflow 0{wf.num}</span>
                <h4 className="tse-full-wf-title">{wf.fullTitle}</h4>
                <p className="tse-full-wf-lead">{wf.fullLead}</p>

                <div className="tse-stage-flow">
                  {wf.quickStages.map((stage, sIdx) =>
                    renderStagePill(stage, sIdx, wf.quickStages.length)
                  )}
                </div>
              </div>

              {/* Step details list */}
              <div className="tse-steps-grid">
                {wf.steps.map((step, stepIdx) => (
                  <div key={stepIdx} className="tse-step-item">
                    <div className="tse-step-title-row">
                      <span className="tse-step-title">{step.title}</span>
                      {step.link && (
                        <a
                          href={step.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tse-step-link-badge"
                        >
                          Launch App <ExternalLinkIcon size={9} />
                        </a>
                      )}
                      {step.action && (
                        <button
                          type="button"
                          onClick={step.action}
                          className="tse-step-link-badge"
                          style={{ border: 'none', cursor: 'pointer' }}
                        >
                          Launch App ↗
                        </button>
                      )}
                    </div>
                    <p className="tse-step-desc">{step.desc}</p>
                  </div>
                ))}
              </div>

              {/* Purpose Box */}
              <div className="tse-wf-purpose-box">
                <span className="tse-wf-purpose-icon">🎯</span>
                <div className="tse-wf-purpose-content">
                  <strong>PURPOSE:</strong> {wf.purposeText}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
