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
  const quickWorkflow = [
    { label: 'FIND', link: 'https://lead-gen.thesearchequation.co.uk/' },
    { label: 'ANALYSE' },
    { label: 'CONNECT', action: onOpenWebsiteManager },
    { label: 'MANAGE PAGES' },
    { label: 'INTERNAL LINKS' },
    { label: 'BACKLINKS' },
    { label: 'SOCIAL', link: 'https://automation.thesearchequation.co.uk/' },
    { label: 'MONITOR' }
  ]

  const workflowSteps = [
    {
      num: 1,
      title: '1. FIND — Lead Generator',
      accent: '#6366f1',
      link: 'https://lead-gen.thesearchequation.co.uk/',
      linkText: 'Lead Generator',
      lead: 'Find businesses and websites that represent potential new clients or opportunities.',
      body: 'Search by service, profession and location, collect the available business and contact information, and identify prospects worth investigating.'
    },
    {
      num: 2,
      title: '2. ANALYSE — Site Analyzer',
      accent: '#38bdf8',
      lead: 'Analyse the website before deciding what to do with it.',
      body: 'Identify obvious SEO, website, content and growth opportunities. For prospects, this provides the information needed to qualify the lead and support personalised outreach.'
    },
    {
      num: 3,
      title: '3. CONNECT — Site Registry & Website Manager',
      accent: '#10b981',
      action: onOpenWebsiteManager,
      actionText: 'Website Manager',
      link: 'https://site-registry.thesearchequation.co.uk/',
      linkText: 'Site Registry',
      lead: 'When a website becomes one we manage, add it to the Site Registry and connect it to Website Manager.',
      body: "The website is then synchronised so its live pages and URLs become available within the TSE management system."
    },
    {
      num: 4,
      title: '4. MANAGE PAGES',
      accent: '#f59e0b',
      lead: 'Understand and organise the website before making improvements.',
      body: 'Review the pages, website structure, target search phrases, priorities, indexing and page optimisation. This establishes which pages matter, what they are targeting and what needs improving.'
    },
    {
      num: 5,
      title: '5. INTERNAL LINKS',
      accent: '#0ea5e9',
      lead: 'Once the pages are organised, review how they connect to each other.',
      body: 'Identify important pages that need more internal-link support, find suitable linking opportunities and implement appropriate contextual links.'
    },
    {
      num: 6,
      title: '6. BACKLINKS',
      accent: '#8b5cf6',
      lead: 'After the website and its internal structure are in order, strengthen important pages with external backlinks.',
      body: 'Choose the target page, identify suitable backlink sources, check existing links, select the strongest opportunities and record completed backlinks.'
    },
    {
      num: 7,
      title: '7. SOCIAL',
      accent: '#ec4899',
      link: 'https://automation.thesearchequation.co.uk/',
      linkText: 'Social Automation',
      lead: "Use the website's services, products, articles and other content to support ongoing social promotion.",
      body: 'Create and approve social content and distribute it through the TSE social automation system to the appropriate networks.'
    },
    {
      num: 8,
      title: '8. MONITOR',
      accent: '#10b981',
      lead: 'Continue monitoring the website after improvements are made.',
      body: 'Track indexing, rankings, Search Console, analytics, uptime, backlinks and other important signals so the next actions can be identified.'
    }
  ]

  return (
    <section className="tse-how-it-works-container" aria-labelledby="tse-how-it-works-heading">
      {/* Header & Subheading */}
      <div className="tse-how-header">
        <div className="tse-how-badge">
          <span>⚙️ Operational Workflow</span>
        </div>
        <h2 id="tse-how-it-works-heading" className="tse-how-title">
          HOW TSE WORKS
        </h2>
        <p className="tse-how-subheading">
          From finding an opportunity to managing and growing the website.
        </p>
      </div>

      {/* QUICK WORKFLOW */}
      <div className="tse-quick-workflow-box">
        <div className="tse-quick-workflow-label">
          <span>⚡ QUICK WORKFLOW</span>
        </div>
        <div className="tse-quick-workflow-flow">
          {quickWorkflow.map((step, idx) => {
            const isLast = idx === quickWorkflow.length - 1

            let pill = (
              <span className="tse-flow-step-pill">
                <span className="tse-flow-num">{idx + 1}.</span> {step.label}
              </span>
            )

            if (step.link) {
              pill = (
                <a
                  href={step.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tse-flow-step-pill is-link"
                  title={`Open ${step.label}`}
                >
                  <span className="tse-flow-num">{idx + 1}.</span> {step.label}
                  <ExternalLinkIcon />
                </a>
              )
            } else if (step.action) {
              pill = (
                <button
                  type="button"
                  onClick={step.action}
                  className="tse-flow-step-pill is-action"
                  title={`Open ${step.label}`}
                >
                  <span className="tse-flow-num">{idx + 1}.</span> {step.label} ↗
                </button>
              )
            }

            return (
              <React.Fragment key={idx}>
                {pill}
                {!isLast && <span className="tse-flow-arrow" aria-hidden="true">→</span>}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* FULL EXPLANATION */}
      <div className="tse-explanation-section">
        <div className="tse-explanation-header">
          <span>📖 FULL EXPLANATION</span>
        </div>
        <div className="tse-explanation-grid">
          {workflowSteps.map((step) => (
            <div
              key={step.num}
              className="tse-explanation-card"
              style={{ '--card-accent': step.accent }}
            >
              <div className="tse-card-header-row">
                <div className="tse-card-title-group">
                  <span className="tse-card-num">0{step.num}</span>
                  <h3 className="tse-card-title">{step.title}</h3>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tse-card-link-btn"
                    >
                      {step.linkText || 'Open App'} <ExternalLinkIcon size={9} />
                    </a>
                  )}
                  {step.action && (
                    <button
                      type="button"
                      onClick={step.action}
                      className="tse-card-action-btn"
                    >
                      {step.actionText || 'Open App'} ↗
                    </button>
                  )}
                </div>
              </div>

              <p className="tse-card-lead">{step.lead}</p>
              <p className="tse-card-body">{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM LINE */}
      <div className="tse-bottom-line-banner">
        <span className="tse-bottom-line-label">THE TSE BOTTOM LINE</span>
        <p className="tse-bottom-line-text">
          FIND THE OPPORTUNITY → UNDERSTAND THE WEBSITE → IMPROVE IT → BUILD ITS AUTHORITY → PROMOTE IT → MONITOR THE RESULTS
        </p>
      </div>
    </section>
  )
}
