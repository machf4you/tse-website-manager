/**
 * Website Manager — On-Site AI Article Generator Engine
 * 
 * Tailored specifically for generating high-authority, on-site supporting editorial articles
 * for connected TSE and client websites.
 * 
 * Enforces:
 * - Exact stored business name usage (e.g. "The Search Equation", "Ascent Builders", "Diamond Window Shutters").
 * - Natural UK English spelling & grammar.
 * - Strict anti-SEO jargon prohibition.
 * - Structured 4-5 section H2 flow.
 * - Contextual internal links to 2–3 relevant W3 Gold Star Priority Pages when available.
 * - CRITICAL: Target phrases are RELEVANCE SIGNALS ONLY. Never force awkward exact-match anchors.
 *   The AI writes completely natural editorial sentences and picks fluid, natural anchor phrases.
 * - If 0 Gold Star Priority Pages exist: zero links added, no hallucinated internal links.
 * - Structured metadata (Meta Title, Meta Description, Slug, Article Title, Body HTML).
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Resolves AI provider API keys across environment paths
 */
export function resolveAiApiKey(provider = 'anthropic') {
  const envVar = provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'
  if (process.env[envVar]) {
    return process.env[envVar]
  }

  const candidatePaths = [
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '.env'),
    'C:/Antigravity/tse-site-registry/.env',
    'C:/Antigravity/web-asset-keeper/.env',
    '/opt/tse-apps/site-registry/.env',
    '/opt/tse-apps/shared/.env',
    '/opt/tse-apps/website-manager/.env',
    '/opt/tse-apps/keyword-research/server/.env',
    '/opt/tse-apps/site-registry/server/.env',
    path.join(os.homedir(), '.tse_env')
  ]

  for (const envPath of candidatePaths) {
    try {
      if (fs.existsSync(envPath)) {
        const text = fs.readFileSync(envPath, 'utf8')
        const lines = text.split('\n')
        for (const line of lines) {
          const clean = line.trim()
          if (!clean || clean.startsWith('#')) continue
          const eqIdx = clean.indexOf('=')
          if (eqIdx > 0) {
            const k = clean.slice(0, eqIdx).trim()
            const v = clean.slice(eqIdx + 1).trim().replace(/^[\"\']|[\"\']$/g, '')
            if (k === envVar && v) {
              return v
            }
          }
        }
      }
    } catch (_e) {}
  }

  return null
}

/**
 * Derives clean, human-formatted business name from stored record or domain
 */
export function getCleanBusinessName(site) {
  if (site && site.name && typeof site.name === 'string') {
    const cleanName = site.name.trim()
    // If it's a real name (not an unspaced domain or raw URL)
    if (cleanName.length > 0 && !cleanName.includes('.co.uk') && !cleanName.includes('.com') && !cleanName.includes('.org') && !cleanName.includes('.es') && !cleanName.includes('.net') && !cleanName.startsWith('http')) {
      return cleanName
    }
  }

  const cleanSiteUrl = (site?.url || '').trim().replace(/\/+$/, '')
  const rawDomain = cleanSiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase()

  if (rawDomain.includes('thesearchequation')) return 'The Search Equation'
  if (rawDomain.includes('ascentbuilders')) return 'Ascent Builders'
  if (rawDomain.includes('diamondwindowshutters')) return 'Diamond Window Shutters'
  if (rawDomain.includes('bathroomupgrades')) return 'Bathroom Upgrades'
  if (rawDomain.includes('hf4you')) return 'HF4You'
  if (rawDomain.includes('smokingchilimedia')) return 'Smoking Chili Media'
  if (rawDomain.includes('autotecherith')) return 'Auto Tech Erith'
  if (rawDomain.includes('libraconstruction')) return 'Libra Construction'
  if (rawDomain.includes('transformingconservatories')) return 'Transforming Conservatories'
  if (rawDomain.includes('woodfarmcamping')) return 'Wood Farm Camping'
  if (rawDomain.includes('thanetdrainage')) return 'Thanet Drainage'
  if (rawDomain.includes('javea.properties') || rawDomain.includes('javeaproperties')) return 'Javea Properties'
  if (rawDomain.includes('valuvillas')) return 'Valuvillas'
  if (rawDomain.includes('civion')) return 'Civion'

  const base = rawDomain.replace(/\.(co\.uk|com|org|net|es|properties|info)$/i, '')
  const words = base.split(/[-_.]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1))
  return words.join(' ')
}

export const DEFAULT_ONSITE_EDITORIAL_PROMPT = `
You are a senior UK journalist, subject-matter expert, and professional feature writer creating a publication-ready informational article for {{BUSINESS_NAME}} (website: {{SITE_DOMAIN}}).

==================================================
BUSINESS IDENTITY & PERSPECTIVE
==================================================
- Company / Business Name: {{BUSINESS_NAME}}
- Official Domain: {{SITE_DOMAIN}}

CRITICAL BUSINESS NAME MANDATE:
You must ALWAYS refer to the company and website as "{{BUSINESS_NAME}}".
NEVER concatenate or merge words into unspaced names like "Thesearchequation", "Ascentbuilders", or "Diamondwindowshutters".
Always write "{{BUSINESS_NAME}}" with proper word spacing and capitalisation across all headings, titles, descriptions, and body text.

==================================================
EDITORIAL MANDATE & CORE RULES
==================================================
1. Audience & Perspective: Written directly from the authoritative perspective of {{BUSINESS_NAME}} for visitors seeking expert guidance, practical insights, and professional knowledge.
2. Language & Style: Natural, polished UK English (e.g. colour, prioritise, centre, bespoke, optimise, specialise).
3. Tone: Informative, balanced, engaging, and genuinely helpful. Avoid exaggerated marketing fluff or aggressive sales pitches.
4. Word Count: Approximately 750–950 words of substantive article body copy.
5. Strict Prohibitions:
   - NEVER mention SEO, backlinks, anchor text, link building, keywords, target phrases, guest posting, or content strategy.
   - NEVER refer to the website or company as "our client" or "the client".
   - NEVER include introductory AI conversational greetings (e.g. "Here is your article..."), markdown tick fences (\`\`\`), or generation commentary. Return ONLY the formatted structured text.

==================================================
REQUIRED OUTPUT FORMAT (MUST APPEAR AT VERY TOP)
==================================================
Meta Title: [Compelling search title, approximately 50–60 characters, natural UK English]
Meta Description: [Accurate, engaging search summary, approximately 140–160 characters]
Slug: [clean-url-slug-using-hyphens]
Article Title: [Engaging editorial headline matching or refining "{{PROPOSED_TITLE}}"]

==================================================
ARTICLE STRUCTURE & HEADINGS
==================================================
- Opening paragraph(s) before the first H2 to introduce the topic engagingly.
- Use 4 to 5 descriptive <h2> section headers across the body.
- STRICT HEADING RULE: Do NOT use generic headings like "<h2>Introduction</h2>" or "<h2>Conclusion</h2>". Every H2 must describe the specific subject matter.
- The concluding section must naturally summarise guidance without a heading titled "Conclusion".
- Use clean semantic HTML: <h2> for headers and <p> for paragraphs.

{{INTERNAL_LINKS_SECTION}}

{{ADDITIONAL_INSTRUCTIONS}}
`.trim()

/**
 * Builds prompt for On-Site article generation
 */
export function buildOnsiteArticlePrompt(data) {
  const notesText = data.notes ? `\nADDITIONAL EDITORIAL GUIDANCE:\n${data.notes}\n` : ''
  const businessName = data.businessName || data.siteDomain || 'the company'

  // Build Internal Links Section
  let internalLinksSection = ''
  if (Array.isArray(data.priorityPages) && data.priorityPages.length > 0) {
    const priorityLinksBlock = data.priorityPages.map((p, i) => {
      const pTitle = p.title || p.targetPhrase || 'our service'
      const pUrl = p.url || '/'
      const pPhrase = p.targetPhrase || p.title || 'relevant solutions'
      return `Priority Destination ${i + 1}:
- Full URL: ${pUrl}
- Page Topic / Title: ${pTitle}
- Target Topic (Relevance Signal Only): "${pPhrase}"`
    }).join('\n\n')

    internalLinksSection = `
==================================================
MANDATORY CONTEXTUAL INTERNAL LINKS (RELEVANT PRIORITY PAGES)
==================================================
You must embed natural contextual internal links to the following relevant Priority Pages of ${businessName} in the article body using standard HTML anchor tags (<a href="URL">ANCHOR TEXT</a>):

${priorityLinksBlock}

CRITICAL NATURAL INTERNAL LINKING MANDATE:
1. Target Phrase is a RELEVANCE SIGNAL ONLY, NOT mandatory anchor text.
   - Use the Target Topic only to understand what the destination page is about.
   - Do NOT treat the target phrase as required anchor text.
   - Do NOT force awkward exact-match phrasing into sentences.
2. Natural Editorial English:
   - Write a completely natural, informative sentence written for a human reader.
   - Choose natural, contextual anchor text from within that sentence that smoothly describes the destination.
   - The anchor does NOT need to contain the complete target phrase.
   - The anchor does NOT need to be exact match (partial-match, descriptive, or topic-based phrasing is encouraged).
   - The anchor must make perfect grammatical sense in the surrounding sentence.
3. Concrete Examples of What to Do:
   - BAD (Awkward / Robotic): "...when exploring SEO Oxford for your business..."
   - EXCELLENT (Natural English): "...for businesses in Oxford looking to improve their search visibility, tailored local strategies deliver the greatest impact." -> link: "businesses in Oxford looking to improve their search visibility" or "tailored local strategies"
   - BAD (Awkward / Robotic): "...learning about AI Growth is essential..."
   - EXCELLENT (Natural English): "...leveraging artificial intelligence growth strategies enables modern enterprises to scale operations efficiently." -> link: "artificial intelligence growth strategies"
   - BAD (Awkward / Robotic): "...contact us for SEO Bournemouth today..."
   - EXCELLENT (Natural English): "...companies operating across Bournemouth and the South Coast benefit significantly from targeted search marketing." -> link: "operating across Bournemouth" or "targeted search marketing"
4. Exact URLs:
   - Use the EXACT destination URL specified above. Never invent, truncate, or alter any URL.
5. Embed 2–3 Distinct Links:
   - Embed 2–3 of the above Priority Page links across different body paragraphs.
   - Never link to the same destination URL more than once in the article.
   - Do not link to the article itself.
`.trim()
  } else {
    internalLinksSection = `
==================================================
INTERNAL LINKING MANDATE
==================================================
NO PRIORITY PAGES AVAILABLE FOR THIS WEBSITE.
DO NOT ADD ANY INTERNAL LINKS OR HTML <a> TAGS IN THE ARTICLE BODY.
`.trim()
  }

  return DEFAULT_ONSITE_EDITORIAL_PROMPT
    .replace(/{{BUSINESS_NAME}}/g, businessName)
    .replace(/{{SITE_DOMAIN}}/g, data.siteDomain || 'the website')
    .replace(/{{PROPOSED_TITLE}}/g, data.proposedTitle || 'An In-Depth Guide for Homeowners')
    .replace(/{{INTERNAL_LINKS_SECTION}}/g, internalLinksSection)
    .replace(/{{ADDITIONAL_INSTRUCTIONS}}/g, notesText)
}

/**
 * Parses structured AI output into title, metaTitle, metaDescription, slug, clean bodyHtml, and extracted internal links
 */
export function parseArticleOutput(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      title: '',
      metaTitle: '',
      metaDescription: '',
      slug: '',
      bodyHtml: '',
      internalLinksAdded: []
    }
  }

  let text = rawText.trim()
  text = text.replace(/^```html\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim()

  let metaTitle = ''
  let metaDescription = ''
  let slug = ''
  let title = ''

  const metaTitleMatch = text.match(/^Meta Title:\s*(.+)$/im)
  if (metaTitleMatch) metaTitle = metaTitleMatch[1].trim()

  const metaDescMatch = text.match(/^Meta Description:\s*(.+)$/im)
  if (metaDescMatch) metaDescription = metaDescMatch[1].trim()

  const slugMatch = text.match(/^Slug:\s*(.+)$/im)
  if (slugMatch) {
    slug = slugMatch[1].trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }

  const titleMatch = text.match(/^Article Title:\s*(.+)$/im)
  if (titleMatch) title = titleMatch[1].trim().replace(/^[\"\']|[\"\']$/g, '')

  let bodyHtml = text
    .replace(/^Meta Title:\s*.*$/im, '')
    .replace(/^Meta Description:\s*.*$/im, '')
    .replace(/^Slug:\s*.*$/im, '')
    .replace(/^Article Title:\s*.*$/im, '')
    .trim()

  if (!bodyHtml.includes('<p>') && !bodyHtml.includes('<h2>')) {
    const paragraphs = bodyHtml.split(/\n\s*\n/)
    bodyHtml = paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n\n')
  }

  if (!slug && title) {
    slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/^-|-$/g, '')
  }

  // Extract all <a href="..."> links from bodyHtml
  const internalLinksAdded = []
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href=[\"\']([^\"\']+)["\'][^>]*>(.*?)<\/a>/gi
  const seenUrls = new Set()
  let match

  while ((match = linkRegex.exec(bodyHtml)) !== null) {
    const destinationUrl = match[1].trim()
    const anchorText = match[2].replace(/<[^>]*>/g, '').trim()
    if (destinationUrl && !seenUrls.has(destinationUrl)) {
      seenUrls.add(destinationUrl)
      internalLinksAdded.push({
        anchorText: anchorText || destinationUrl,
        destinationUrl
      })
    }
  }

  return {
    title: title || 'Informational Guide',
    metaTitle: metaTitle || title,
    metaDescription: metaDescription || '',
    slug: slug || 'article-guide',
    bodyHtml,
    internalLinksAdded
  }
}

/**
 * Automatically determines an article opportunity for a website without requiring Hub/Landing selection.
 * Analyzes stored page configurations strictly using W3 Gold Star state, rankings, and existing post inventory.
 */
export function suggestArticleOpportunityForSite({ site, existingPosts = [], pageConfigs = [], pageRankings = [] }) {
  const cleanSiteUrl = (site?.url || '').trim().replace(/\/+$/, '')
  const siteDomain = cleanSiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  const businessName = getCleanBusinessName(site)

  let primaryPhrase = ''
  let targetUrl = cleanSiteUrl || '/'
  let targetPageTitle = businessName

  // 1. Find all eligible W3 Gold Star Priority Pages from pageConfigs (STRICT: only isStarred / starred)
  const eligiblePriorityPages = []
  const seenUrls = new Set()

  if (Array.isArray(pageConfigs) && pageConfigs.length > 0) {
    for (const pc of pageConfigs) {
      if (pc.is_excluded || pc.isExcluded) continue

      let isStarred = false
      if (pc.is_starred !== undefined) isStarred = Boolean(pc.is_starred)
      else if (pc.isStarred !== undefined) isStarred = Boolean(pc.isStarred)
      else if (pc.starred !== undefined) isStarred = Boolean(pc.starred)
      else if (pc.config_json) {
        try {
          const parsed = JSON.parse(pc.config_json)
          isStarred = Boolean(parsed.isStarred || parsed.starred)
        } catch (_e) {}
      }

      if (!isStarred) continue

      const rawUrl = (pc.url || pc.page_key || '').trim()
      if (!rawUrl) continue
      const normUrl = rawUrl.replace(/\/+$/, '').toLowerCase()
      if (seenUrls.has(normUrl)) continue
      seenUrls.add(normUrl)

      let title = (pc.title || '').trim()
      let phrase = (pc.target_phrase || pc.targetPhrase || '').trim()
      if (pc.config_json) {
        try {
          const parsed = JSON.parse(pc.config_json)
          if (!title) title = (parsed.title || parsed.proposedTitle || '').trim()
          if (!phrase) phrase = (parsed.target || parsed.targetPhrase || '').trim()
        } catch (_e) {}
      }

      eligiblePriorityPages.push({
        title: title || businessName,
        url: rawUrl,
        targetPhrase: phrase || title || 'our services'
      })
    }
  }

  // 2. Determine primary target and priority pages (strictly 2-3 Gold Star pages if they exist)
  let priorityPages = []
  if (eligiblePriorityPages.length > 0) {
    priorityPages = eligiblePriorityPages.slice(0, 3)
    const top = priorityPages[0]
    primaryPhrase = top.targetPhrase || top.title
    targetUrl = top.url
    targetPageTitle = top.title
  } else if (Array.isArray(pageRankings) && pageRankings.length > 0) {
    const topRanking = pageRankings.find(r => r.target_phrase && r.target_phrase.trim())
    if (topRanking) {
      primaryPhrase = topRanking.target_phrase.trim()
      if (topRanking.ranking_url) targetUrl = topRanking.ranking_url
    }
  }

  // 3. Fallback to business name if no phrase found
  if (!primaryPhrase) {
    primaryPhrase = businessName
  }

  const existingTitles = existingPosts.map(p => (p.title?.rendered || p.title || p.post_title || '').toLowerCase().trim()).filter(Boolean)

  const candidateTemplates = [
    {
      titleTemplate: `Essential Factors to Consider When Choosing ${primaryPhrase}`,
      topic: `Buyer & Decision Guide for ${primaryPhrase}`,
      anchorTemplate: `${primaryPhrase}`
    },
    {
      titleTemplate: `How ${primaryPhrase} Enhances Long-Term Value and Performance`,
      topic: `Benefits & Value of ${primaryPhrase}`,
      anchorTemplate: `professional ${primaryPhrase}`
    },
    {
      titleTemplate: `Key Advice and Practical Insights for ${primaryPhrase}`,
      topic: `Expert Guidance for ${primaryPhrase}`,
      anchorTemplate: `${primaryPhrase} solutions`
    },
    {
      titleTemplate: `A Professional Guide to Understanding ${primaryPhrase} Options`,
      topic: `Quality Standards & Options for ${primaryPhrase}`,
      anchorTemplate: `specialist ${primaryPhrase}`
    },
    {
      titleTemplate: `Frequently Asked Questions About ${primaryPhrase} Answered`,
      topic: `FAQ & Expert Insights for ${primaryPhrase}`,
      anchorTemplate: `${primaryPhrase}`
    }
  ]

  let selected = candidateTemplates[0]
  for (const cand of candidateTemplates) {
    const isDuplicate = existingTitles.some(et => et.includes(cand.titleTemplate.toLowerCase()) || (et.length > 10 && cand.titleTemplate.toLowerCase().includes(et)))
    if (!isDuplicate) {
      selected = cand
      break
    }
  }

  return {
    proposedTitle: selected.titleTemplate,
    primaryTopic: selected.topic,
    businessName,
    siteDomain,
    targetHubUrl: targetUrl,
    targetHubTitle: targetPageTitle,
    targetPhrase: primaryPhrase,
    suggestedAnchor: selected.anchorTemplate,
    priorityPages
  }
}

/**
 * Suggests an article opportunity for a given Hub/Landing page
 */
export function suggestArticleOpportunity({ targetPage, site, existingPosts = [] }) {
  const targetPhrase = (targetPage?.targetPhrase || targetPage?.target_phrase || targetPage?.title || '').trim()
  const pageTitle = (targetPage?.title || targetPage?.originalTitle || targetPage?.url || '').trim()
  const targetUrl = targetPage?.url || targetPage?.link || '/'
  const businessName = getCleanBusinessName(site)
  const siteDomain = (site?.url || '').trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]

  const existingTitles = existingPosts.map(p => (p.title?.rendered || p.title || p.post_title || '').toLowerCase().trim()).filter(Boolean)

  const candidateTemplates = [
    {
      titleTemplate: `Essential Factors to Consider When Choosing ${targetPhrase || pageTitle}`,
      topic: `Buyer & Decision Guide for ${targetPhrase || pageTitle}`,
      anchorTemplate: `${targetPhrase || pageTitle}`
    },
    {
      titleTemplate: `How ${targetPhrase || pageTitle} Delivers Measurable Results`,
      topic: `Benefits & Practical Value of ${targetPhrase || pageTitle}`,
      anchorTemplate: `professional ${targetPhrase || pageTitle}`
    },
    {
      titleTemplate: `Expert Insights and Best Practices for ${targetPhrase || pageTitle}`,
      topic: `Maintenance & Care Guide for ${targetPhrase || pageTitle}`,
      anchorTemplate: `${targetPhrase || pageTitle} options`
    },
    {
      titleTemplate: `A Comprehensive Guide to Understanding ${targetPhrase || pageTitle}`,
      topic: `Quality Standards & Specifications for ${targetPhrase || pageTitle}`,
      anchorTemplate: `specialist ${targetPhrase || pageTitle}`
    },
    {
      titleTemplate: `Frequently Asked Questions About ${targetPhrase || pageTitle} Explained`,
      topic: `FAQ & Expert Answers for ${targetPhrase || pageTitle}`,
      anchorTemplate: `${targetPhrase || pageTitle}`
    }
  ]

  let selected = candidateTemplates[0]
  for (const cand of candidateTemplates) {
    const isDuplicate = existingTitles.some(et => et.includes(cand.titleTemplate.toLowerCase()) || (et.length > 10 && cand.titleTemplate.toLowerCase().includes(et)))
    if (!isDuplicate) {
      selected = cand
      break
    }
  }

  return {
    proposedTitle: selected.titleTemplate,
    primaryTopic: selected.topic,
    businessName,
    siteDomain,
    targetHubUrl: targetUrl,
    targetHubTitle: pageTitle,
    targetPhrase,
    suggestedAnchor: selected.anchorTemplate
  }
}

/**
 * Dispatcher to generate article via Anthropic Claude or OpenAI with automatic fallback
 */
export async function generateOnsiteArticle({ promptData, provider = 'claude', model = null }) {
  const structuredPrompt = buildOnsiteArticlePrompt(promptData)

  const anthropicKey = resolveAiApiKey('anthropic')
  const openAiKey = resolveAiApiKey('openai')

  let claudeError = null

  // 1. Attempt Anthropic Claude if requested and key is available
  if ((provider === 'claude' || provider === 'anthropic' || !openAiKey) && anthropicKey) {
    try {
      const selectedModel = model || 'claude-3-5-sonnet-20241022'
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 2500,
          messages: [{ role: 'user', content: structuredPrompt }]
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Anthropic Claude API error (${response.status}): ${errText}`)
      }

      const data = await response.json()
      const rawContent = data.content?.[0]?.text || ''
      const parsed = parseArticleOutput(rawContent)

      return {
        success: true,
        provider: 'claude',
        model: selectedModel,
        rawContent,
        ...parsed
      }
    } catch (err) {
      claudeError = err
      console.warn(`[AI Generator] Anthropic Claude failed (${err.message}). Attempting fallback to OpenAI...`)
      if (!openAiKey) {
        throw err
      }
    }
  }

  // 2. Attempt OpenAI (primary or fallback)
  if (openAiKey) {
    const selectedModel = model && !model.startsWith('claude') ? model : 'gpt-4o'
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: 'You are an expert UK journalist and editorial copywriter producing high-quality website articles.' },
          { role: 'user', content: structuredPrompt }
        ],
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      const combinedErrMsg = claudeError
        ? `OpenAI error (${response.status}): ${errText} (Claude also failed: ${claudeError.message})`
        : `OpenAI API error (${response.status}): ${errText}`
      throw new Error(combinedErrMsg)
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content || ''
    const parsed = parseArticleOutput(rawContent)

    return {
      success: true,
      provider: 'openai',
      model: selectedModel,
      rawContent,
      ...parsed
    }
  }

  if (claudeError) {
    throw claudeError
  }

  throw new Error('No AI provider API key found (ANTHROPIC_API_KEY or OPENAI_API_KEY). Please configure credentials in the environment or Global Settings.')
}
