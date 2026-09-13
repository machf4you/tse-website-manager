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
    { label: 'REGISTER', link: 'https://site-registry.thesearchequation.co.uk/' },
    { label: 'CONNECT & IMPORT', action: onOpenWebsiteManager },
    { label: 'PLAN THE PAGES' },
    { label: 'KEYWORD RESEARCH', link: 'https://keyword-research.thesearchequation.co.uk/' },
    { label: 'OPTIMISE THE PAGES' },
    { label: 'INTERNAL LINKING' },
    { label: 'BACKLINKS' },
    { label: 'SOCIAL', link: 'https://automation.thesearchequation.co.uk/' },
    { label: 'MONITOR' }
  ]

  const stages = [
    {
      num: 1,
      title: '1. FIND — LEAD GENERATOR',
      accent: '#6366f1',
      link: 'https://lead-gen.thesearchequation.co.uk/',
      linkText: 'Lead Generator',
      paragraphs: [
        'Find businesses and websites that represent potential new clients or opportunities.',
        'Search by service, profession and location and collect the available business, website and contact information.',
        'The objective is to identify businesses worth investigating further.'
      ]
    },
    {
      num: 2,
      title: '2. ANALYSE — SITE ANALYZER',
      accent: '#38bdf8',
      paragraphs: [
        "Analyse the prospect's existing website.",
        'Identify SEO, website, content and growth opportunities so the team can understand what is wrong, what could be improved and whether the business represents a worthwhile opportunity.',
        'This analysis can then support qualification and personalised outreach.'
      ]
    },
    {
      num: 3,
      title: '3. REGISTER — SITE REGISTRY',
      accent: '#0ea5e9',
      link: 'https://site-registry.thesearchequation.co.uk/',
      linkText: 'Site Registry',
      paragraphs: [
        'Once a website becomes an asset or website that TSE will manage, register it in the Site Registry.',
        'The Site Registry is the central source of truth for the website.',
        'It holds the core details about the site, including:'
      ],
      listItems: [
        'domain',
        'website identity',
        'ownership',
        'portfolio',
        'platform',
        'registrar',
        'domain expiry',
        'operational information',
        'connections to the other TSE systems'
      ],
      afterListParagraphs: [
        'The website should only need to be registered once.',
        'From here, its identity and core information should flow through to the other TSE applications rather than being entered repeatedly.'
      ]
    },
    {
      num: 4,
      title: '4. CONNECT & IMPORT — WEBSITE MANAGER',
      accent: '#10b981',
      action: onOpenWebsiteManager,
      actionText: 'Website Manager',
      paragraphs: [
        'The registered website is then made available to Website Manager.',
        'Connect Website Manager to the live website.',
        "Once connected, Website Manager retrieves the website's pages and URLs.",
        'For every page we want to establish:'
      ],
      listItems: [
        'URL',
        'page title',
        'page content',
        'page type',
        'website structure',
        'whether the URL is indexed by Google',
        'other available page information'
      ],
      afterListParagraphs: [
        'This creates the working representation of the live website inside TSE.',
        'The operator can now see what pages actually exist before deciding what each page should be targeting.'
      ]
    },
    {
      num: 5,
      title: '5. PLAN THE PAGES — TARGET PHRASES',
      accent: '#f59e0b',
      paragraphs: [
        'Each important page needs a clear search purpose.',
        'Website Manager should suggest an initial set of approximately five relevant target phrases for each managed URL.',
        'These provide a starting point based on the page, its content, its purpose and the website it belongs to.',
        'They are GUIDANCE, not fixed decisions.',
        'The TSE team can:'
      ],
      listItems: [
        'accept suggestions',
        'remove phrases',
        'edit phrases',
        'replace phrases',
        'manually add phrases'
      ],
      highlightQuestion: 'WHAT IS THIS PAGE ACTUALLY TRYING TO RANK FOR?',
      afterListParagraphs: [
        'Before we start changing pages, we need to know the answer to that question.'
      ]
    },
    {
      num: 6,
      title: '6. KEYWORD RESEARCH',
      accent: '#38bdf8',
      link: 'https://keyword-research.thesearchequation.co.uk/',
      linkText: 'Keyword Research',
      paragraphs: [
        'Where more detailed research is required, the page should connect to the TSE Keyword Research module.',
        'The research module helps identify additional search opportunities for the page.',
        'It should allow the team to investigate a manageable group of potential phrases — typically around 4–6 worthwhile opportunities — rather than simply producing huge keyword lists.',
        'The research should help us understand:'
      ],
      listItems: [
        'relevant phrases',
        'search demand',
        'competition/difficulty',
        'search intent',
        'closely related opportunities',
        'whether another page should target the phrase instead'
      ],
      afterListParagraphs: [
        'The team then decides the final target phrases for the page.',
        'These become the basis for the optimisation work that follows.'
      ]
    },
    {
      num: 7,
      title: '7. OPTIMISE THE PAGES',
      accent: '#10b981',
      paragraphs: [
        'Once we know what each page should target, we can properly assess the page.',
        'Website Manager audits the page against its agreed target phrases and identifies what needs improving.',
        'This can include:'
      ],
      listItems: [
        'page title',
        'H1',
        'headings',
        'content',
        'topical coverage',
        'search intent',
        'metadata',
        'structure',
        'other on-page SEO elements'
      ],
      highlightQuestion: 'WE DECIDE WHAT THE PAGE SHOULD TARGET BEFORE WE START EDITING IT.',
      afterListParagraphs: [
        'The operator can then make the required improvements.',
        'After changes are made, Website Manager can synchronise with the live website again and reassess the page.'
      ]
    },
    {
      num: 8,
      title: '8. INTERNAL LINKING',
      accent: '#0ea5e9',
      paragraphs: [
        'Once the pages, targets and content are in good order, review how the website connects those pages together.',
        'Internal Linking should show:'
      ],
      listItems: [
        'links into each page',
        'links out from each page',
        'anchor text',
        'existing relationships',
        'weak or poorly supported pages',
        'recommended internal-link opportunities'
      ],
      afterListParagraphs: [
        'The objective is to make sure the important pages receive appropriate internal support from other relevant pages on the website.',
        'Approved internal-link changes can then be implemented and the website synchronised again.'
      ]
    },
    {
      num: 9,
      title: '9. BACKLINKS',
      accent: '#8b5cf6',
      paragraphs: [
        'Once the website itself is properly structured and internally linked, we can strengthen important pages externally.',
        'The Backlinks workflow should allow the team to:'
      ],
      listItems: [
        'choose the website',
        'choose the target page',
        'see existing backlinks',
        'select an available provider/source',
        'exclude sources already used where appropriate',
        'assess source quality',
        'identify the best backlink opportunities',
        'create the required backlink content',
        'publish/place the backlink',
        'record the completed link'
      ],
      afterListParagraphs: [
        'This means backlink work is driven by the pages we actually want to strengthen rather than simply creating backlinks without a plan.'
      ]
    },
    {
      num: 10,
      title: '10. SOCIAL',
      accent: '#ec4899',
      link: 'https://automation.thesearchequation.co.uk/',
      linkText: 'Social Automation',
      paragraphs: [
        "Once the website's content and important pages are established, use them as the basis for ongoing social promotion.",
        'Select appropriate:'
      ],
      listItems: [
        'services',
        'products',
        'pages',
        'articles',
        'offers',
        'campaigns'
      ],
      afterListParagraphs: [
        'Create suitable social content, approve it where necessary and distribute it through the TSE social automation system to the appropriate networks.',
        'The website therefore becomes the central source of material for ongoing promotion.'
      ]
    },
    {
      num: 11,
      title: '11. MONITOR',
      accent: '#10b981',
      paragraphs: [
        'The process does not finish when the work is published.',
        'Continue monitoring the website and its important pages.',
        'This should increasingly bring together:'
      ],
      listItems: [
        'Google indexing',
        'rankings',
        'Google Search Console',
        'analytics',
        'website uptime',
        'page performance',
        'internal links',
        'backlinks',
        'content activity',
        'social activity',
        'alerts requiring action'
      ],
      afterListParagraphs: [
        'Monitoring then feeds back into the workflow.',
        'If a page is not performing:'
      ],
      loopSequence: ['RESEARCH', 'REVIEW', 'IMPROVE', 'LINK', 'PROMOTE', 'MONITOR AGAIN']
    }
  ]

  return (
    <section className="tse-how-it-works-container" aria-labelledby="tse-how-it-works-heading">
      {/* Header & Subtitle */}
      <div className="tse-how-header">
        <div className="tse-how-badge">
          <span>⚙️ Operational Workflow</span>
        </div>
        <h2 id="tse-how-it-works-heading" className="tse-how-title">
          HOW TSE WORKS
        </h2>
        <p className="tse-how-subheading">
          The operational journey of a website through the TSE platform.
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
        <div className="tse-stages-list">
          {stages.map((stg) => (
            <article
              key={stg.num}
              className="tse-stage-card"
              style={{ '--stage-accent': stg.accent }}
            >
              <div className="tse-stage-header-row">
                <div className="tse-stage-title-group">
                  <span className="tse-stage-num-badge">Stage 0{stg.num}</span>
                  <h3 className="tse-stage-title">{stg.title}</h3>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {stg.link && (
                    <a
                      href={stg.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tse-card-link-btn"
                    >
                      {stg.linkText || 'Open App'} <ExternalLinkIcon size={9} />
                    </a>
                  )}
                  {stg.action && (
                    <button
                      type="button"
                      onClick={stg.action}
                      className="tse-card-action-btn"
                    >
                      {stg.actionText || 'Open App'} ↗
                    </button>
                  )}
                </div>
              </div>

              <div className="tse-stage-content">
                {stg.paragraphs && stg.paragraphs.map((p, pIdx) => (
                  <p key={pIdx}>{p}</p>
                ))}

                {stg.listItems && (
                  <ul className="tse-stage-list">
                    {stg.listItems.map((item, iIdx) => (
                      <li key={iIdx}>{item}</li>
                    ))}
                  </ul>
                )}

                {stg.highlightQuestion && (
                  <div className="tse-highlight-box">
                    {stg.highlightQuestion}
                  </div>
                )}

                {stg.afterListParagraphs && stg.afterListParagraphs.map((p, pIdx) => (
                  <p key={pIdx}>{p}</p>
                ))}

                {stg.loopSequence && (
                  <div className="tse-loop-flow">
                    {stg.loopSequence.map((lStep, lIdx) => (
                      <React.Fragment key={lIdx}>
                        <span className="tse-loop-step">{lStep}</span>
                        {lIdx < stg.loopSequence.length - 1 && (
                          <span className="tse-flow-arrow" aria-hidden="true">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* THE PRINCIPLE */}
      <div className="tse-principle-banner">
        <span className="tse-principle-label">THE PRINCIPLE</span>
        <div className="tse-principle-statements">
          <span>REGISTER THE WEBSITE ONCE.</span>
          <span>UNDERSTAND EVERY PAGE.</span>
          <span>DECIDE WHAT EACH PAGE SHOULD TARGET.</span>
          <span>IMPROVE THE PAGE.</span>
          <span>CONNECT IT INTERNALLY.</span>
          <span>BUILD ITS EXTERNAL AUTHORITY.</span>
          <span>PROMOTE IT.</span>
          <span>MONITOR THE RESULTS.</span>
        </div>
        <p className="tse-principle-footer-text">
          The TSE Apps should progressively connect these stages so information entered or discovered in one part of the platform becomes available to the next, rather than requiring the team to repeatedly enter the same information.
        </p>
      </div>
    </section>
  )
}
