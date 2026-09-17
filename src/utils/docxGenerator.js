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
 * Generates a clean, formatted Word (.docx) document from an article object
 */
export async function generateArticleDocxBlob(article) {
  const title = article.title || 'Untitled Article'
  const metaTitle = article.metaTitle || article.meta_title || ''
  const metaDescription = article.metaDescription || article.meta_description || ''
  const slug = article.slug || ''
  const domain = article.domain || (article.siteUrl ? article.siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : '')
  const businessName = article.businessName || article.siteName || domain || 'Website'

  let bodyContent = (article.bodyHtml || article.body_html || '')
    .replace(/^Meta\s*Title\s*:[^\n\r<]*[\r\n]*/gim, '')
    .replace(/^Meta\s*Description\s*:[^\n\r<]*[\r\n]*/gim, '')
    .replace(/^Slug\s*:[^\n\r<]*[\r\n]*/gim, '')
    .replace(/^Article\s*Title\s*:[^\n\r<]*[\r\n]*/gim, '')
    .trim()

  const docElements = []

  // ==========================================
  // 1. METADATA HEADER SECTION
  // ==========================================
  docElements.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Website: ', bold: true, size: 22, font: 'Calibri', color: '475569' }),
        new TextRun({ text: `${businessName} (${domain})`, size: 22, font: 'Calibri' })
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

  // ==========================================
  // 2. ARTICLE TITLE (Heading 1)
  // ==========================================
  docElements.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 240 }
    })
  )

  // ==========================================
  // 3. PARSE FORMATTED ARTICLE BODY
  // ==========================================
  const blockRegex = /<(h2|h3|p|ul|ol)[^>]*>(.*?)<\/\1>/gis
  let blockMatch
  let blockCount = 0

  while ((blockMatch = blockRegex.exec(bodyContent)) !== null) {
    blockCount++
    const tag = blockMatch[1].toLowerCase()
    const innerHtml = blockMatch[2].trim()

    if (tag === 'h2') {
      const cleanH2 = cleanHtmlTags(innerHtml.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' '))
      docElements.push(
        new Paragraph({
          text: cleanH2,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 140 }
        })
      )
    } else if (tag === 'h3') {
      const cleanH3 = cleanHtmlTags(innerHtml.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' '))
      docElements.push(
        new Paragraph({
          text: cleanH3,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        })
      )
    } else if (tag === 'p') {
      const children = parseInlineHtml(innerHtml)
      docElements.push(
        new Paragraph({
          children,
          spacing: { after: 180, line: 300 } // Clean line spacing
        })
      )
    } else if (tag === 'ul' || tag === 'ol') {
      const liRegex = /<li[^>]*>(.*?)<\/li>/gis
      let liMatch
      while ((liMatch = liRegex.exec(innerHtml)) !== null) {
        const liChildren = parseInlineHtml(liMatch[1])
        docElements.push(
          new Paragraph({
            children: liChildren,
            bullet: { level: 0 },
            spacing: { after: 100, line: 280 }
          })
        )
      }
    }
  }

  // Fallback if no block tags found
  if (blockCount === 0) {
    const rawParas = bodyContent.split(/\n\s*\n/)
    for (const p of rawParas) {
      const trimmed = p.trim()
      if (!trimmed) continue
      if (trimmed.startsWith('# ')) {
        docElements.push(
          new Paragraph({
            text: trimmed.slice(2).trim(),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 }
          })
        )
      } else if (trimmed.startsWith('## ')) {
        docElements.push(
          new Paragraph({
            text: trimmed.slice(3).trim(),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 280, after: 140 }
          })
        )
      } else {
        const children = parseInlineHtml(trimmed)
        docElements.push(
          new Paragraph({
            children,
            spacing: { after: 180, line: 300 }
          })
        )
      }
    }
  }

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
