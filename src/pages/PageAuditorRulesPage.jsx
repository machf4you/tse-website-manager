import './PageAuditorRulesPage.css'

export default function PageAuditorRulesPage() {
  const auditRules = [
    {
      id: 'meta_title',
      num: '1',
      name: 'Meta Title',
      weight: '15%',
      purpose: 'Ensures the page has a valid title tag containing the primary target phrase and adheres to optimal length guidelines (50–65 characters) for maximum SERP click-through rate. Placement near the start is recommended where natural.',
      dataExtracted: '<title> tag text string and character count (len(title)).',
      matchingLogic: 'Substring Match (contains phrase anywhere in title), Topical Match (token cover ≥80%), and Length Range (50–65 characters). Placement near start is a recommendation only.',
      scoringContribution: '15 Points (Title area weight: +80 for phrase presence, +20 bonus for 50-65 chars).',
      passCriteria: 'Target Phrase is present in the Meta Title AND Meta Title length is between 50 and 65 characters.',
      failCriteria: 'Meta Title missing OR Target Phrase completely absent from Meta Title.',
      recommendedAction: 'Add "[target phrase]" to the meta title.',
      passExample: 'Title: "Expert Home Extensions & Loft Conversions South London" (Target: "Loft Conversions South London")',
      failExample: 'Title: "Home Building & Construction Services" (Target: "Loft Conversions South London")',
    },
    {
      id: 'meta_description',
      num: '2',
      name: 'Meta Description',
      weight: '8%',
      purpose: 'Ensure the Meta Description supports search visibility and click-through rate by containing the Target Phrase and using an optimal length.',
      dataExtracted: '<meta name="description" content="..."> text string and character count.',
      matchingLogic: 'Exact Target Phrase match or natural semantic variation = Pass. Weak stem-only match = Fail.',
      scoringContribution: '8 Points (Meta Description area weight).',
      passCriteria: 'Target Phrase is present in the Meta Description AND Meta Description length is between 120 and 160 characters AND description reads naturally.',
      failCriteria: 'Meta Description missing OR Target Phrase absent OR length < 120 characters OR length > 160 characters.',
      recommendedAction: 'Displays required actions only: Add Target Phrase / Increase length to 120+ / Reduce length to <160 / Rewrite naturally.',
      passExample: 'Description: "Looking for professional Loft Conversions South London? We provide high-quality loft conversions and home extension solutions. Get a free quote today!" (152 chars)',
      failExample: 'Description: "We provide building services across London." (43 chars - Fail: length < 120)',
    },
    {
      id: 'h1',
      num: '3',
      name: 'H1 Heading',
      weight: '15%',
      purpose: 'Ensures the page has exactly one <h1> tag containing the primary target phrase or a close topical equivalent, establishing the main topic for search engines and users.',
      dataExtracted: 'Array of <h1> heading elements extracted from page body.',
      matchingLogic: 'Exact Match (_exact), Contains Match (_contains), or Topical Match (_topic_match ≥80% token cover).',
      scoringContribution: '15 Points (H1 area weight: 100 exact, 85 contains, 80 topical, 55 partial, 15 missing/unrelated).',
      passCriteria: 'Single <h1> tag present AND <h1> contains or topically covers (≥80%) the target phrase.',
      failCriteria: '<h1> tag missing OR <h1> does not contain/topically cover target phrase OR multiple <h1> tags found.',
      recommendedAction: 'Add target phrase "[target phrase]" to H1 heading.',
      passExample: 'H1: "Loft Conversions South London Specialists" (Target: "Loft Conversions South London")',
      failExample: 'H1: "Welcome to Our Building Company" (Target: "Loft Conversions South London")',
    },
    {
      id: 'h2',
      num: '4',
      name: 'H2 Headings',
      weight: '8%',
      purpose: 'Ensures the page utilizes subheadings (<h2>) to structure content into scannable sections, with at least one <h2> referencing the primary target phrase or a close topical variant.',
      dataExtracted: 'Array of all <h2> tag text strings (extracted.h2).',
      matchingLogic: 'Substring Match (contains phrase) or Topical Match (token cover ≥80%).',
      scoringContribution: '8 Points (H2 area weight: +30 presence, +40 primary phrase in any H2, +30 secondary phrase coverage).',
      passCriteria: 'Page has <h2> tags AND at least one <h2> contains or topically covers the target phrase.',
      failCriteria: 'No <h2> tags on page OR none of the <h2> tags contain/topically cover the target phrase.',
      recommendedAction: 'Add the target phrase to at least one H2 heading.',
      passExample: 'H2 Headings: ["Loft Conversions in Surrey", "Why Convert Your Loft?", "Types of Loft Conversions"] (Target: "Loft Conversions")',
      failExample: 'H2 Headings: ["Why Choose Us", "Customer Reviews", "Get in Touch"] (Target: "Loft Conversions South London")',
    },
    {
      id: 'word_count',
      num: '5',
      name: 'Word Count & Content Depth',
      weight: '18%',
      purpose: 'Ensures the page has sufficient content length and that the Target Phrase is present naturally in the body text.',
      dataExtracted: 'Body text word count (extracted.word_count) and plain text body content (extracted.body_text).',
      matchingLogic: 'Count body words. Confirm the Target Phrase exists naturally within the body.',
      scoringContribution: '18 Points (Content area weight).',
      passCriteria: 'Word Count is at least 300 words (600+ recommended for Hub and Landing pages where natural) AND Target Phrase appears naturally within body content.',
      failCriteria: 'Word Count below 300 words OR Target Phrase not present in body content.',
      recommendedAction: 'Increase content length where required / Add the Target Phrase naturally within the content.',
      passExample: 'Word Count: 650 words. Target Phrase present in body content. (Pass)',
      failExample: 'Word Count: 180 words. (Fail: Word Count below 300 words)',
    },
    {
      id: 'internal_links',
      num: '6',
      name: 'Internal Link Count',
      weight: '7%',
      purpose: 'Verifies that the page includes contextual outgoing internal links to other relevant pages on the website to distribute page authority and facilitate site navigation.',
      dataExtracted: 'Array of internal links (extracted.internal_links), counting href and anchor text.',
      matchingLogic: 'Link Count Thresholds (Strong ≥8, Moderate 3-7, Weak <3) & Anchor Relevance check.',
      scoringContribution: '7 Points (Internal Linking area weight: +60 for ≥8 links, +40 for 3-7 links, +40 bonus for relevant anchor text).',
      passCriteria: 'Page contains at least 3 outgoing internal links.',
      failCriteria: 'Page contains fewer than 3 internal links (0–2 links).',
      recommendedAction: 'Current Internal Links: [N] | Minimum Required to Pass Audit: 3',
      passExample: 'Internal Links: 5 outgoing links (/services/, /contact/, /gallery/, etc.).',
      failExample: 'Internal Links: 0 links.',
    },
    {
      id: 'image_count',
      num: '7',
      name: 'Image Count',
      weight: '6%',
      purpose: 'Ensures the page incorporates visual content (images) to enhance user engagement and visual scannability.',
      dataExtracted: 'Total count of <img> tags on the page (extracted.image_count).',
      matchingLogic: 'Count Threshold (image_count ≥ 1).',
      scoringContribution: 'Part of 6 Points (Images area weight: 20/100 area score warning for 0 images).',
      passCriteria: 'Page contains at least 1 image.',
      failCriteria: 'Page contains 0 images.',
      recommendedAction: 'Add 1-2 relevant images with descriptive alt text.',
      passExample: 'Images: 4 images found on page.',
      failExample: 'Images: 0 images found on page.',
    },
    {
      id: 'missing_alt',
      num: '8',
      name: 'Images Missing Alt Text',
      weight: '6%',
      purpose: 'Verifies that images have descriptive alt attributes for accessibility and image SEO, ensuring at least 90% of images on the page have non-empty alt text.',
      dataExtracted: 'Array of images with their alt text strings (extracted.images).',
      matchingLogic: 'Alt Coverage Formula (images_with_alt / total_images ≥ 0.90 threshold).',
      scoringContribution: 'Part of 6 Points (Images area weight: +50 bonus for phrase in alt text).',
      passCriteria: '90% or more of images have non-empty, non-generic alt text.',
      failCriteria: 'More than 10% of images are missing alt text (missing alt count > 0).',
      recommendedAction: 'Add meaningful alt tags to [N] images missing them.',
      passExample: 'Images: 10 total images, 10 have alt="Loft conversion in South London" (100% coverage, 0 missing).',
      failExample: 'Images: 10 total images, 6 have empty alt="" (40% coverage, 6 missing alt text).',
    },
  ]

  return (
    <div className="rules-page-container">
      {/* Page Header */}
      <div className="rules-header">
        <div>
          <span className="rules-pill-badge">GLOBAL REFERENCE</span>
          <h1 className="rules-title">TSE Page Auditor Rules Reference</h1>
          <p className="rules-subtitle">
            Read-only documentation of the exact audit checks, matching algorithms, scoring weights, and pass/fail thresholds enforced by the TSE Page Auditor backend engine.
          </p>
        </div>
      </div>

      {/* Summary Area Weights Table */}
      <div className="rules-weights-card">
        <h3 className="card-section-title">Audit Area Weights (100% Total)</h3>
        <div className="weights-grid">
          <div className="weight-item"><span className="weight-val">15%</span><span className="weight-lbl">Meta Title</span></div>
          <div className="weight-item"><span className="weight-val">15%</span><span className="weight-lbl">H1 Heading</span></div>
          <div className="weight-item"><span className="weight-val">18%</span><span className="weight-lbl">Word Count & Depth</span></div>
          <div className="weight-item"><span className="weight-val">10%</span><span className="weight-lbl">Structured Data</span></div>
          <div className="weight-item"><span className="weight-val">8%</span><span className="weight-lbl">Meta Description</span></div>
          <div className="weight-item"><span className="weight-val">8%</span><span className="weight-lbl">H2 Headings</span></div>
          <div className="weight-item"><span className="weight-val">8%</span><span className="weight-lbl">URL Slug</span></div>
          <div className="weight-item"><span className="weight-val">7%</span><span className="weight-lbl">Internal Links</span></div>
          <div className="weight-item"><span className="weight-val">6%</span><span className="weight-lbl">Images & Alt Text</span></div>
          <div className="weight-item"><span className="weight-val">5%</span><span className="weight-lbl">FAQ Section</span></div>
        </div>
      </div>

      {/* Audit Elements Cards List */}
      <div className="rules-cards-list">
        {auditRules.map((rule) => (
          <div className="rule-card" key={rule.id} id={`rule-card-${rule.id}`}>
            <div className="rule-card-header">
              <div className="rule-badge-num">{rule.num}</div>
              <div className="rule-header-info">
                <h2 className="rule-card-name">{rule.name}</h2>
                <span className="rule-card-weight">Weight: {rule.weight}</span>
              </div>
            </div>

            <div className="rule-card-body">
              <div className="rule-prop-group">
                <span className="rule-prop-label">PURPOSE</span>
                <p className="rule-prop-text">{rule.purpose}</p>
              </div>

              <div className="rule-props-grid">
                <div className="rule-prop-item">
                  <span className="rule-prop-label">DATA EXTRACTED</span>
                  <p className="rule-prop-text"><code>{rule.dataExtracted}</code></p>
                </div>

                <div className="rule-prop-item">
                  <span className="rule-prop-label">MATCHING LOGIC</span>
                  <p className="rule-prop-text">{rule.matchingLogic}</p>
                </div>
              </div>

              <div className="rule-props-grid">
                <div className="rule-prop-item">
                  <span className="rule-prop-label">PASS CRITERIA</span>
                  <p className="rule-prop-text text-pass">✓ {rule.passCriteria}</p>
                </div>

                <div className="rule-prop-item">
                  <span className="rule-prop-label">FAIL CRITERIA</span>
                  <p className="rule-prop-text text-fail">✗ {rule.failCriteria}</p>
                </div>
              </div>

              <div className="rule-prop-group">
                <span className="rule-prop-label">SCORING CONTRIBUTION</span>
                <p className="rule-prop-text">{rule.scoringContribution}</p>
              </div>

              <div className="rule-prop-group">
                <span className="rule-prop-label">RECOMMENDED ACTION WHEN CHECK FAILS</span>
                <div className="rule-recom-box">{rule.recommendedAction}</div>
              </div>

              <div className="rule-examples-row">
                <div className="example-box pass">
                  <span className="example-tag pass">PASS EXAMPLE</span>
                  <code>{rule.passExample}</code>
                </div>
                <div className="example-box fail">
                  <span className="example-tag fail">FAIL EXAMPLE</span>
                  <code>{rule.failExample}</code>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
