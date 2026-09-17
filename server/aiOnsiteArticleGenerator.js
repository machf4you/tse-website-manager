/**
 * Website Manager — On-Site AI Article Generator Engine
 * 
 * Tailored specifically for generating high-authority, on-site supporting editorial articles
 * for connected TSE and client websites.
 * 
 * Enforces:
 * - Natural UK English spelling & grammar.
 * - Strict anti-SEO jargon prohibition.
 * - Structured 4-5 section H2 flow.
 * - Seamless contextual link to the target Hub/Landing page or site root.
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

export const DEFAULT_ONSITE_EDITORIAL_PROMPT = `
You are a senior UK journalist, subject-matter expert, and professional feature writer creating a publication-ready informational article for the official website {{SITE_DOMAIN}}.

==================================================
EDITORIAL MANDATE & CORE RULES
==================================================
1. Audience & Perspective: Written directly from the authoritative perspective of {{SITE_DOMAIN}} for visitors seeking expert guidance, practical insights, and professional knowledge.
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

==================================================
MANDATORY CONTEXTUAL INTERNAL LINK INSERTION
==================================================
You must embed a natural contextual internal link to the website's primary section/page in the body copy using standard HTML anchor tag (<a href="URL">ANCHOR</a>):

- Destination Page URL: {{TARGET_PAGE_URL}}
- Anchor Concept: "{{TARGET_ANCHOR}}"

LINK PLACEMENT RULES:
- Embed the link seamlessly into a complete, informative sentence surrounded by relevant editorial context.
- The anchor text must read completely naturally within the sentence.
- Never alter or substitute the destination URL.
- Place the primary link naturally within the first half of the article.

{{ADDITIONAL_INSTRUCTIONS}}
`.trim()

/**
 * Builds prompt for On-Site article generation
 */
export function buildOnsiteArticlePrompt(data) {
  const notesText = data.notes ? `\nADDITIONAL EDITORIAL GUIDANCE:\n${data.notes}\n` : ''

  return DEFAULT_ONSITE_EDITORIAL_PROMPT
    .replace(/{{SITE_DOMAIN}}/g, data.siteDomain || 'the website')
    .replace(/{{PROPOSED_TITLE}}/g, data.proposedTitle || 'An In-Depth Guide for Homeowners')
    .replace(/{{TARGET_PAGE_URL}}/g, data.targetPageUrl || '/')
    .replace(/{{TARGET_ANCHOR}}/g, data.targetAnchor || data.targetPhrase || 'explore our services')
    .replace(/{{ADDITIONAL_INSTRUCTIONS}}/g, notesText)
}

/**
 * Parses structured AI output into title, metaTitle, metaDescription, slug, and clean bodyHtml
 */
export function parseArticleOutput(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      title: '',
      metaTitle: '',
      metaDescription: '',
      slug: '',
      bodyHtml: ''
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

  return {
    title: title || 'Informational Guide',
    metaTitle: metaTitle || title,
    metaDescription: metaDescription || '',
    slug: slug || 'article-guide',
    bodyHtml
  }
}

/**
 * Automatically determines an article opportunity for a website without requiring Hub/Landing selection.
 * Analyzes stored page configurations, target phrases, rankings, and existing post inventory.
 */
export function suggestArticleOpportunityForSite({ site, existingPosts = [], pageConfigs = [], pageRankings = [] }) {
  const cleanSiteUrl = (site?.url || '').trim().replace(/\/+$/, '')
  const siteDomain = cleanSiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  const siteName = (site?.name || '').trim() || siteDomain

  let primaryPhrase = ''
  let targetUrl = cleanSiteUrl || '/'
  let targetPageTitle = siteName

  // 1. Find from pageRankings
  if (Array.isArray(pageRankings) && pageRankings.length > 0) {
    const topRanking = pageRankings.find(r => r.target_phrase && r.target_phrase.trim())
    if (topRanking) {
      primaryPhrase = topRanking.target_phrase.trim()
      if (topRanking.ranking_url) targetUrl = topRanking.ranking_url
    }
  }

  // 2. If not found, find from pageConfigs
  if (!primaryPhrase && Array.isArray(pageConfigs) && pageConfigs.length > 0) {
    const topConfig = pageConfigs.find(p => (p.target_phrase && p.target_phrase.trim()) || p.seo_page_type === 'Hub' || p.seo_page_type === 'Landing')
    if (topConfig) {
      primaryPhrase = (topConfig.target_phrase || topConfig.title || '').trim()
      if (topConfig.url) targetUrl = topConfig.url
      if (topConfig.title) targetPageTitle = topConfig.title
    }
  }

  // 3. Fallback to site name / domain
  if (!primaryPhrase) {
    const cleanDomain = siteDomain.replace(/\.(co\.uk|com|org|net)$/i, '').replace(/[-_]+/g, ' ')
    primaryPhrase = cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1)
  }

  const existingTitles = existingPosts.map(p => (p.title?.rendered || p.title || p.post_title || '').toLowerCase().trim()).filter(Boolean)

  const candidateTemplates = [
    {
      titleTemplate: `Essential Factors to Consider When Choosing ${primaryPhrase}`,
      topic: `Buyer & Decision Guide for ${primaryPhrase}`,
      anchorTemplate: `${primaryPhrase}`
    },
    {
      titleTemplate: `How ${primaryPhrase} Enhances Home Comfort, Value and Efficiency`,
      topic: `Benefits & Value of ${primaryPhrase}`,
      anchorTemplate: `professional ${primaryPhrase}`
    },
    {
      titleTemplate: `Key Maintenance and Care Tips for Long-Lasting ${primaryPhrase}`,
      topic: `Maintenance & Longevity Guide for ${primaryPhrase}`,
      anchorTemplate: `${primaryPhrase} solutions`
    },
    {
      titleTemplate: `A Homeowner's Guide to Understanding ${primaryPhrase} Standards and Options`,
      topic: `Quality Standards & Options for ${primaryPhrase}`,
      anchorTemplate: `specialist ${primaryPhrase}`
    },
    {
      titleTemplate: `Frequently Asked Questions About ${primaryPhrase} Answered by Experts`,
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
    targetHubUrl: targetUrl,
    targetHubTitle: targetPageTitle,
    targetPhrase: primaryPhrase,
    suggestedAnchor: selected.anchorTemplate
  }
}

/**
 * Suggests an article opportunity for a given Hub/Landing page
 * Ensures no overlap with existing post titles
 */
export function suggestArticleOpportunity({ targetPage, site, existingPosts = [] }) {
  const targetPhrase = (targetPage?.targetPhrase || targetPage?.target_phrase || targetPage?.title || '').trim()
  const pageTitle = (targetPage?.title || targetPage?.originalTitle || targetPage?.url || '').trim()
  const targetUrl = targetPage?.url || targetPage?.link || '/'

  const existingTitles = existingPosts.map(p => (p.title?.rendered || p.title || p.post_title || '').toLowerCase().trim()).filter(Boolean)

  const candidateTemplates = [
    {
      titleTemplate: `Essential Factors to Consider When Choosing ${targetPhrase || pageTitle}`,
      topic: `Buyer & Decision Guide for ${targetPhrase || pageTitle}`,
      anchorTemplate: `${targetPhrase || pageTitle}`
    },
    {
      titleTemplate: `How ${targetPhrase || pageTitle} Enhances Home Comfort and Energy Efficiency`,
      topic: `Benefits & Practical Value of ${targetPhrase || pageTitle}`,
      anchorTemplate: `professional ${targetPhrase || pageTitle}`
    },
    {
      titleTemplate: `Key Maintenance and Care Tips for Long-Lasting ${targetPhrase || pageTitle}`,
      topic: `Maintenance & Care Guide for ${targetPhrase || pageTitle}`,
      anchorTemplate: `${targetPhrase || pageTitle} options`
    },
    {
      titleTemplate: `A Homeowner's Guide to Understanding ${targetPhrase || pageTitle} Standards and Quality`,
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
    targetHubUrl: targetUrl,
    targetHubTitle: pageTitle,
    targetPhrase,
    suggestedAnchor: selected.anchorTemplate
  }
}

/**
 * Dispatcher to generate article via Anthropic Claude or OpenAI
 */
export async function generateOnsiteArticle({ promptData, provider = 'claude', model = null }) {
  const structuredPrompt = buildOnsiteArticlePrompt(promptData)

  const anthropicKey = resolveAiApiKey('anthropic')
  const openAiKey = resolveAiApiKey('openai')

  if ((provider === 'claude' || provider === 'anthropic' || !openAiKey) && anthropicKey) {
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
  }

  if (openAiKey) {
    const selectedModel = model || 'gpt-4o'
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
      throw new Error(`OpenAI API error (${response.status}): ${errText}`)
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

  throw new Error('No AI provider API key found (ANTHROPIC_API_KEY or OPENAI_API_KEY). Please configure credentials in the environment or Global Settings.')
}
