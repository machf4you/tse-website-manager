import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ExternalHyperlink
} from 'docx'

/**
 * Clean HTML helper to strip tags and decode entities
 */
function cleanHtmlTags(str) {
  if (!str) return ''
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

/**
 * Parse inline HTML (anchors, strong, b, em, i) into TextRuns and Hyperlinks
 */
function parseInlineHtml(htmlSnippet) {
  const cleanSnippet = (htmlSnippet || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  const runs = []
  const tagRegex = /(<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>|<strong>(.*?)<\/strong>|<b>(.*?)<\/b>|<em>(.*?)<\/em>|<i>(.*?)<\/i>)/gi
  let lastIdx = 0
  let match

  while ((match = tagRegex.exec(cleanSnippet)) !== null) {
    const preText = cleanSnippet.substring(lastIdx, match.index)
    if (preText) {
      const cleanPre = cleanHtmlTags(preText)
      if (cleanPre) {
        runs.push(new TextRun({ text: cleanPre, font: 'Calibri', size: 23 }))
      }
    }

    if (match[2] !== undefined) {
      // <a href="...">text</a>
      let linkUrl = match[2].trim()
      if (!/^https?:\/\//i.test(linkUrl) && !linkUrl.startsWith('#')) {
        linkUrl = `https://${linkUrl}`
      }
      const linkText = cleanHtmlTags(match[3]) || linkUrl
      runs.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: linkText,
              style: 'Hyperlink',
              color: '0066CC',
              underline: {},
              font: 'Calibri',
              size: 23
            })
          ],
          link: linkUrl
        })
      )
    } else if (match[4] !== undefined || match[5] !== undefined) {
      // <strong> or <b>
      const boldText = cleanHtmlTags(match[4] || match[5])
      if (boldText) {
        runs.push(new TextRun({ text: boldText, bold: true, font: 'Calibri', size: 23 }))
      }
    } else if (match[6] !== undefined || match[7] !== undefined) {
      // <em> or <i>
      const italicText = cleanHtmlTags(match[6] || match[7])
      if (italicText) {
        runs.push(new TextRun({ text: italicText, italics: true, font: 'Calibri', size: 23 }))
      }
    }

    lastIdx = tagRegex.lastIndex
  }

  const postText = cleanSnippet.substring(lastIdx)
  if (postText) {
    const cleanPost = cleanHtmlTags(postText)
    if (cleanPost) {
      runs.push(new TextRun({ text: cleanPost, font: 'Calibri', size: 23 }))
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text: cleanHtmlTags(cleanSnippet) || '', font: 'Calibri', size: 23 })]
}

/**
 * Extract clean domain name from URL or text
 */
function extractDomain(urlOrDomain) {
  if (!urlOrDomain) return ''
  return String(urlOrDomain)
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
}

/**
 * Parse article body into sequential structured blocks (Headings, Paragraphs, Lists)
 */
function parseBodyBlocks(bodyContent) {
  const cleanBody = (bodyContent || '')
    .replace(/^Meta\s*Title\s*:[^\n\r<]*[\r\n]*/gim, '')
    .replace(/^Meta\s*Description\s*:[^\n\r<]*[\r\n]*/gim, '')
    .replace(/^Slug\s*:[^\n\r<]*[\r\n]*/gim, '')
    .replace(/^Article\s*Title\s*:[^\n\r<]*[\r\n]*/gim, '')
    .trim()

  // Split by block-level HTML tags (h2, h3, ul, ol) while capturing delimiters
  const blockSplitRegex = /(<(?:h2|h3|ul|ol)[^>]*>[\s\S]*?<\/(?:h2|h3|ul|ol)>)/gi
  const rawParts = cleanBody.split(blockSplitRegex)
  const blocks = []

  for (const part of rawParts) {
    if (!part) continue
    const trimmed = part.trim()
    if (!trimmed) continue

    const h2Match = /^<h2[^>]*>([\s\S]*?)<\/h2>$/i.exec(trimmed)
    if (h2Match) {
      blocks.push({ type: 'h2', content: h2Match[1].trim() })
      continue
    }

    const h3Match = /^<h3[^>]*>([\s\S]*?)<\/h3>$/i.exec(trimmed)
    if (h3Match) {
      blocks.push({ type: 'h3', content: h3Match[1].trim() })
      continue
    }

    const ulMatch = /^<ul[^>]*>([\s\S]*?)<\/ul>$/i.exec(trimmed)
    if (ulMatch) {
      blocks.push({ type: 'ul', content: ulMatch[1].trim() })
      continue
    }

    const olMatch = /^<ol[^>]*>([\s\S]*?)<\/ol>$/i.exec(trimmed)
    if (olMatch) {
      blocks.push({ type: 'ol', content: olMatch[1].trim() })
      continue
    }

    // Paragraph chunk (could contain multiple <p> tags or newline-separated paragraphs)
    if (/<p[^>]*>/i.test(trimmed)) {
      const pMatches = trimmed.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)
      let foundP = false
      for (const pm of pMatches) {
        if (pm[1] && pm[1].trim()) {
          foundP = true
          blocks.push({ type: 'p', content: pm[1].trim() })
        }
      }
      if (!foundP) {
        const cleanP = cleanHtmlTags(trimmed).trim()
        if (cleanP) blocks.push({ type: 'p', content: cleanP })
      }
    } else {
      const paragraphs = trimmed.split(/\n\s*\n/)
      for (const p of paragraphs) {
        const pTrimmed = p.trim()
        if (!pTrimmed) continue
        if (pTrimmed.startsWith('## ')) {
          blocks.push({ type: 'h2', content: pTrimmed.slice(3).trim() })
        } else if (pTrimmed.startsWith('### ')) {
          blocks.push({ type: 'h3', content: pTrimmed.slice(4).trim() })
        } else if (pTrimmed.startsWith('# ')) {
          blocks.push({ type: 'h1', content: pTrimmed.slice(2).trim() })
        } else {
          blocks.push({ type: 'p', content: pTrimmed })
        }
      }
    }
  }

  return blocks
}

/**
 * Build docx elements array
 */
function buildDocElements(article) {
  const title = article.title || 'Untitled Article'
  const metaTitle = article.metaTitle || article.meta_title || ''
  const metaDescription = article.metaDescription || article.meta_description || ''
  const slug = article.slug || ''
  
  // Authoritative Domain & Business Name resolution
  let domain = extractDomain(article.domain || article.siteUrl || article.url || article.target_page_url || article.targetPageUrl || '')
  let businessName = article.businessName || article.siteName || article.name || ''
  
  if (!businessName && domain) {
    businessName = domain
  } else if (!businessName) {
    businessName = 'The Search Equation'
  }
  
  if (!domain && article.target_page_url) {
    domain = extractDomain(article.target_page_url)
  }

  const websiteLabel = domain && domain !== businessName
    ? `${businessName} (${domain})`
    : (domain ? `${businessName} (${domain})` : businessName)

  const docElements = []

  // 1. METADATA HEADER SECTION
  docElements.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Website: ', bold: true, size: 22, font: 'Calibri', color: '475569' }),
        new TextRun({ text: websiteLabel, size: 22, font: 'Calibri' })
      ],
      spacing: { after: 120 }
    })
  )

  if (metaTitle) {
    docElements.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Meta Title: ', bold: true, size: 22, font: 'Calibri', color: '475569' }),
          new TextRun({ text: metaTitle, size: 22, font: 'Calibri' })
        ],
        spacing: { after: 120 }
      })
    )
  }

  if (metaDescription) {
    docElements.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Meta Description: ', bold: true, size: 22, font: 'Calibri', color: '475569' }),
          new TextRun({ text: metaDescription, size: 22, font: 'Calibri' })
        ],
        spacing: { after: 120 }
      })
    )
  }

  if (slug) {
    docElements.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Slug: ', bold: true, size: 22, font: 'Calibri', color: '475569' }),
          new TextRun({ text: slug, size: 22, font: 'Calibri' })
        ],
        spacing: { after: 240 }
      })
    )
  }

  // Divider paragraph
  docElements.push(
    new Paragraph({
      children: [new TextRun({ text: '_______________________________________________________________________________', color: 'CBD5E1' })],
      spacing: { after: 280 }
    })
  )

  // 2. ARTICLE TITLE (Heading 1)
  docElements.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 240 }
    })
  )

  // 3. SEQUENTIAL BODY BLOCKS (Headings, Paragraphs, Lists)
  const bodyContent = article.bodyHtml || article.body_html || ''
  const blocks = parseBodyBlocks(bodyContent)

  for (const block of blocks) {
    if (block.type === 'h2') {
      const cleanH2 = cleanHtmlTags(block.content)
      if (cleanH2) {
        docElements.push(
          new Paragraph({
            text: cleanH2,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 140 }
          })
        )
      }
    } else if (block.type === 'h3') {
      const cleanH3 = cleanHtmlTags(block.content)
      if (cleanH3) {
        docElements.push(
          new Paragraph({
            text: cleanH3,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 220, after: 100 }
          })
        )
      }
    } else if (block.type === 'p') {
      const children = parseInlineHtml(block.content)
      if (children.length > 0) {
        docElements.push(
          new Paragraph({
            children,
            spacing: { after: 180, line: 300 }
          })
        )
      }
    } else if (block.type === 'ul' || block.type === 'ol') {
      const liMatches = block.content.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)
      let hasLi = false
      for (const liMatch of liMatches) {
        hasLi = true
        const liChildren = parseInlineHtml(liMatch[1])
        docElements.push(
          new Paragraph({
            children: liChildren,
            bullet: { level: 0 },
            spacing: { after: 100, line: 280 }
          })
        )
      }
      if (!hasLi) {
        const cleanUl = cleanHtmlTags(block.content)
        if (cleanUl) {
          docElements.push(
            new Paragraph({
              children: parseInlineHtml(cleanUl),
              spacing: { after: 180, line: 300 }
            })
          )
        }
      }
    }
  }

  return docElements
}

/**
 * Generates a clean, formatted Word (.docx) Blob from an article object (for browser)
 */
export async function generateArticleDocxBlob(article) {
  const docElements = buildDocElements(article)
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docElements
      }
    ]
  })
  return await Packer.toBlob(doc)
}

/**
 * Generates a clean, formatted Word (.docx) Buffer from an article object (for Node.js)
 */
export async function generateArticleDocxBuffer(article) {
  const docElements = buildDocElements(article)
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docElements
      }
    ]
  })
  return await Packer.toBuffer(doc)
}
