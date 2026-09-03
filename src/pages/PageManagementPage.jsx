import { useState, useEffect } from 'react'
import { extractPagesFromPackage, extractPostsFromPackage } from '../utils/packageExtractor'
import ConfigurePageDialog from '../components/ConfigurePageDialog'
import BulkConfigureTargetPhrasesDialog from '../components/BulkConfigureTargetPhrasesDialog'
import { getPageConfigsApi, savePageConfigsApi, getPageAuditsApi, savePageAuditApi } from '../services/websiteManagerApi'
import { executePageAudit } from '../services/pageAuditorApi'
import { getSiteConfigsStorageKey, getSiteAuditsStorageKey } from '../utils/siteKeyHelper'
import { formatReadableDateTime } from '../utils/dateFormatter'
import './PageManagementPage.css'

export default function PageManagementPage({
  site,
  storedPackageData,
  onBack,
  onTabChange,
  onSyncFromWordPress,
  isSyncing,
  onViewAudit,
}) {
  const [filter, setFilter] = useState('all') // 'all' | 'configured' | 'action_required' | 'excluded'
  const [sortColumn, setSortColumn] = useState('priority') // 'priority' | 'page' | 'type'
  const [sortDirection, setSortDirection] = useState('asc') // 'asc' | 'desc'
  const [editingPage, setEditingPage] = useState(null)
  const [isBulkTargetDialogOpen, setIsBulkTargetDialogOpen] = useState(false)
  const [isBulkAuditing, setIsBulkAuditing] = useState(false)
  const [currentlyAuditingKey, setCurrentlyAuditingKey] = useState(null)
  const [bulkAuditProgress, setBulkAuditProgress] = useState({ current: 0, total: 0 })
  const [bulkAuditSummary, setBulkAuditSummary] = useState(null)

  const [configurations, setConfigurations] = useState(() => {
    try {
      const siteIdKey = getSiteConfigsStorageKey(site)
      const saved = localStorage.getItem(siteIdKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
      }
    } catch (e) {
      console.error('Failed to load page configurations:', e)
    }
    return {}
  })

  const [pageAudits, setPageAudits] = useState(() => {
    try {
      const siteIdKey = getSiteAuditsStorageKey(site)
      const saved = localStorage.getItem(siteIdKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
      }
    } catch (e) {
      console.error('Failed to load page audits:', e)
    }
    return {}
  })

  useEffect(() => {
    let isMounted = true
    if (site?.id) {
      getPageConfigsApi(site.id).then(apiConfigs => {
        if (isMounted && apiConfigs && Object.keys(apiConfigs).length > 0) {
          setConfigurations(prev => {
            const merged = { ...prev }
            Object.keys(apiConfigs).forEach(k => {
              if (!merged[k] || !merged[k].targetPhrase) {
                merged[k] = apiConfigs[k]
              }
            })
            return merged
          })
        }
      }).catch(() => {})

      getPageAuditsApi(site.id).then(apiAudits => {
        if (isMounted && apiAudits && Object.keys(apiAudits).length > 0) {
          setPageAudits(prev => ({ ...prev, ...apiAudits }))
        }
      }).catch(() => {})
    }
    return () => { isMounted = false }
  }, [site?.id])

  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(col)
      setSortDirection('asc')
    }
  }

  const handleSavePageConfig = (config) => {
    const pageKey = config.pageId || config.url
    const updatedMap = {
      ...configurations,
      [pageKey]: config,
    }
    setConfigurations(updatedMap)
    if (site?.id) {
      savePageConfigsApi(site.id, updatedMap)
    }
    try {
      const siteIdKey = getSiteConfigsStorageKey(site)
      localStorage.setItem(siteIdKey, JSON.stringify(updatedMap))
    } catch (e) {
      console.error('Failed to save page configuration:', e)
    }
    setEditingPage(null)
  }

  const handleSaveBulkConfigs = async (newConfigsMap) => {
    if (!newConfigsMap || Object.keys(newConfigsMap).length === 0) return

    const updatedMap = {
      ...configurations,
      ...newConfigsMap
    }

    setConfigurations(updatedMap)

    if (site?.id) {
      try {
        await savePageConfigsApi(site.id, updatedMap)
      } catch (err) {
        console.error('Failed to save bulk page configs to API:', err)
      }
    }

    try {
      const siteIdKey = getSiteConfigsStorageKey(site)
      localStorage.setItem(siteIdKey, JSON.stringify(updatedMap))
    } catch (e) {
      console.error('Failed to save bulk page configs to localStorage:', e)
    }
  }

  const handleExcludePage = (page) => {
    const pageKey = page.id || page.url || page.pageUrl
    const urlKey = page.url || page.pageUrl || ''
    setConfigurations(prev => {
      const updated = {
        ...prev,
        [pageKey]: {
          ...(prev[pageKey] || {}),
          pageId: page.id,
          url: urlKey,
          isExcluded: true,
          type: 'Excluded',
          seoPageType: 'Excluded',
          priority: 0,
          isConfigured: true,
          status: 'configured',
        },
      }
      if (urlKey && urlKey !== pageKey) {
        updated[urlKey] = updated[pageKey]
      }
      try {
        const siteIdKey = site?.id ? `tse_page_configs_${site.id}` : 'tse_page_configs_default'
        localStorage.setItem(siteIdKey, JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save page configuration:', e)
      }
      return updated
    })
  }

  const handleIncludePage = (page) => {
    const pageKey = page.id || page.url || page.pageUrl
    const urlKey = page.url || page.pageUrl || ''
    setConfigurations(prev => {
      const updated = { ...prev }
      delete updated[pageKey]
      if (urlKey) delete updated[urlKey]
      try {
        const siteIdKey = site?.id ? `tse_page_configs_${site.id}` : 'tse_page_configs_default'
        localStorage.setItem(siteIdKey, JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save page configuration:', e)
      }
      return updated
    })
  }

  const handleInlineTypeChange = (page, newType) => {
    const pageKey = page.id || page.url || page.pageUrl
    const urlKey = page.url || page.pageUrl || ''
    const existingConfig = configurations[pageKey] || (urlKey ? configurations[urlKey] : {}) || {}

    const getPriorityForType = (t) => {
      if (t === 'Hub') return 1
      if (t === 'Landing') return 2
      if (t === 'Topical') return 3
      if (t === 'Article') return 4
      return 0
    }

    const isExcluded = newType === 'Excluded'
    const targetPhraseStr = (existingConfig.targetPhrase || existingConfig.target || page.targetPhrase || page.target || '').trim()
    const isConfigured = Boolean(targetPhraseStr.length > 0)

    const updatedConfig = {
      ...existingConfig,
      pageId: page.id,
      url: urlKey || pageKey,
      proposedTitle: existingConfig.proposedTitle || page.title,
      targetPhrase: targetPhraseStr,
      target: targetPhraseStr,
      type: newType,
      seoPageType: newType,
      autoType: page.autoType || page.type,
      isManualOverride: true,
      priority: getPriorityForType(newType),
      isConfigured: isConfigured,
      isStarred: Boolean(existingConfig.isStarred || page.isStarred),
      isExcluded,
      status: isConfigured ? 'configured' : 'unconfigured',
    }

    handleSavePageConfig(updatedConfig)
  }

  const handleToggleStar = (page) => {
    const pageKey = page.id || page.url || page.pageUrl
    const urlKey = page.url || page.pageUrl || ''
    const existingConfig = configurations[pageKey] || (urlKey ? configurations[urlKey] : {}) || {}
    const newStarred = !page.isStarred
    const updatedConfig = {
      ...existingConfig,
      pageId: page.id,
      url: urlKey || pageKey,
      isStarred: newStarred,
    }
    handleSavePageConfig(updatedConfig)
  }

  // Extract exported pages and separate visual Shop By navigation categories from SEO-managed pages
  const pkg = storedPackageData || site?.storedPackageData
  const rawPagesList = extractPagesFromPackage(pkg, site?.url)
  const _postsList = extractPostsFromPackage(pkg)

  const isShopBySeparator = (p) => {
    if (!p) return false
    const rawTitle = (p.originalTitle || p.name || p.title || '').trim().toLowerCase()
    const rawUrl = (p.url || p.link || '').toLowerCase()
    const rawSlug = (p.slug || '').toLowerCase()
    const catId = String(p.id || '').replace(/^cat-|^cms-/, '')
    return (
      (p.post_type === 'category' || p.magentoCategoryId !== undefined) &&
      (
        rawTitle.startsWith('shop by') ||
        rawTitle.startsWith('shop-by') ||
        rawUrl.includes('/shop-by') ||
        rawUrl.includes('/shop_by') ||
        rawUrl.endsWith('/bed-sizes') ||
        rawSlug.startsWith('shop-by') ||
        catId === '810' ||
        catId === '1245' ||
        catId === '1247' ||
        catId === '1248' ||
        catId === '1251' ||
        catId === '1260'
      )
    )
  }

  const rawSeoPages = rawPagesList.filter(p => !isShopBySeparator(p))
  const shopBySeparators = rawPagesList.filter(p => isShopBySeparator(p))

  const safeConfigs = (configurations && typeof configurations === 'object') ? configurations : {}
  const safeAudits = (pageAudits && typeof pageAudits === 'object') ? pageAudits : {}

  const pagesList = rawSeoPages.map(page => {
    const pageKey = page.id || page.url || page.pageUrl
    const urlKey = page.url || page.pageUrl || ''
    const override = safeConfigs[pageKey] || (urlKey ? safeConfigs[urlKey] : null)
    const auditRecord = safeAudits[pageKey] ||
                        (urlKey ? safeAudits[urlKey] : null) ||
                        (page.id ? safeAudits[page.id] : null) ||
                        (page.url ? safeAudits[page.url] : null) ||
                        Object.values(safeAudits).find(a => (a?.auditResult?.url === urlKey || a?.url === urlKey))

    const isAudited = Boolean(auditRecord && (auditRecord.isAudited || auditRecord.lastAuditTimestamp || auditRecord.auditResult || auditRecord.overall_score !== undefined))
    const isStale = Boolean(auditRecord && auditRecord.isStale)
    const staleReason = auditRecord?.staleReason || null
    const rawLastAuditDate = isAudited
      ? (auditRecord?.lastAuditTimestamp || 'Audited ✓')
      : (override?.lastAuditDate || page.lastAuditDate || 'Never')

    let lastAuditDate = 'Never'
    if (rawLastAuditDate === 'Never' || rawLastAuditDate === 'Audited ✓') {
      lastAuditDate = rawLastAuditDate
    } else if (rawLastAuditDate) {
      const formatted = formatReadableDateTime(rawLastAuditDate)
      lastAuditDate = typeof formatted === 'string' && formatted.trim()
        ? formatted.trim()
        : (typeof rawLastAuditDate === 'string' ? rawLastAuditDate : 'Audited ✓')
    }

    const rawScore = auditRecord?.overall_score ??
                     auditRecord?.score ??
                     auditRecord?.auditResult?.overall_score ??
                     auditRecord?.auditResult?.score ??
                     null
    const auditScore = (rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore)))
      ? Math.round(Number(rawScore))
      : null

    const autoType = page.type || page.seoPageType || override?.autoType || 'Unclassified'
    const overrideType = override?.type || override?.seoPageType || ''
    const isTypeActuallyOverridden = Boolean(override && override.isManualOverride === true && overrideType && overrideType !== (page.autoType || page.type || page.seoPageType))
    const isManualOverride = isTypeActuallyOverridden
    const effectiveType = isManualOverride ? overrideType : (overrideType || autoType)

    const getPriorityForType = (t, fallback) => {
      if (t === 'Hub') return 1
      if (t === 'Landing') return 2
      if (t === 'Topical') return 3
      if (t === 'Article') return 4
      if (t === 'Excluded') return 0
      return fallback !== undefined ? fallback : 0
    }

    const effectivePriority = isManualOverride
      ? (override?.priority !== undefined ? override.priority : getPriorityForType(effectiveType, 0))
      : getPriorityForType(autoType, page.priority)

    const effectiveIsExcluded = isManualOverride
      ? (override?.isExcluded !== undefined ? Boolean(override.isExcluded) : effectiveType === 'Excluded')
      : (effectiveType === 'Excluded' || Boolean(page.isExcluded))

    const targetPhraseStr = (override?.targetPhrase || override?.target || page.targetPhrase || page.target || '').trim()
    const isConfigured = Boolean(targetPhraseStr.length > 0)
    const isStarred = Boolean(override?.isStarred)

    if (override) {
      return {
        ...page,
        autoType,
        originalTitle: page.title,
        title: override.proposedTitle || page.title,
        proposedTitle: override.proposedTitle || page.title,
        target: targetPhraseStr,
        targetPhrase: targetPhraseStr,
        type: effectiveType,
        seoPageType: effectiveType,
        priority: effectivePriority,
        isManualOverride,
        isConfigured,
        isStarred,
        isExcluded: effectiveIsExcluded,
        isAudited,
        isStale,
        staleReason,
        lastAuditDate,
        auditScore,
        auditResult: auditRecord?.auditResult || null,
      }
    }
    return {
      ...page,
      autoType,
      originalTitle: page.title,
      proposedTitle: page.title,
      target: targetPhraseStr,
      targetPhrase: targetPhraseStr,
      isManualOverride: false,
      isConfigured,
      isStarred,
      isAudited,
      isStale,
      staleReason,
      lastAuditDate,
      auditScore,
      auditResult: auditRecord?.auditResult || null,
    }
  })

  // Filter pages based on filter tab selection
  const filteredPages = pagesList.filter(p => {
    if (filter === 'starred') return p.isStarred === true && !p.isExcluded && p.type !== 'Excluded'
    if (filter === 'configured') return p.isConfigured === true && !p.isExcluded && p.type !== 'Excluded'
    if (filter === 'action_required') return p.isConfigured !== true && !p.isExcluded && p.type !== 'Excluded'
    if (filter === 'excluded') return p.isExcluded === true || p.type === 'Excluded'
    // Default ('all'): hide excluded pages from table view (only active included pages are visible)
    return !p.isExcluded && p.type !== 'Excluded'
  })

  // Helper to extract raw ID (stripping cat- or cms- prefixes)
  const getRawId = (id) => String(id || '').replace(/^cat-|^cms-/, '')

  // Helper to identify top-level product category (Level 2 categories, excluding store root container)
  const isTopCategory = (p) => {
    if (p.post_type !== 'category') return false
    const rawPid = getRawId(p.parentId)
    const rawId = getRawId(p.id)
    return (Number(p.level) === 2 || rawPid === '2' || rawPid === '1') && !isShopBySeparator(p) && rawId !== '2'
  }

  // Sort filtered pages
  const sortedPages = [...filteredPages].sort((a, b) => {
    if (sortColumn === 'type') {
      const valA = (a.type || a.seoPageType || '').toLowerCase()
      const valB = (b.type || b.seoPageType || '').toLowerCase()
      if (valA !== valB) {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      const titleA = (a.title || '').toLowerCase()
      const titleB = (b.title || '').toLowerCase()
      return titleA.localeCompare(titleB)
    }

    if (sortColumn === 'page') {
      const valA = (a.title || '').toLowerCase()
      const valB = (b.title || '').toLowerCase()
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
    }

    if (sortColumn === 'target') {
      const valA = (a.target || a.targetPhrase || '').toLowerCase()
      const valB = (b.target || b.targetPhrase || '').toLowerCase()
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
    }

    if (sortColumn === 'lastAudit') {
      const valA = String(a.lastAuditDate || 'Never').toLowerCase()
      const valB = String(b.lastAuditDate || 'Never').toLowerCase()
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
    }

    if (sortColumn === 'auditPage') {
      const scoreA = a.auditScore !== null ? a.auditScore : (a.isAudited ? 0 : -1)
      const scoreB = b.auditScore !== null ? b.auditScore : (b.isAudited ? 0 : -1)
      if (scoreA !== scoreB) {
        return sortDirection === 'asc' ? scoreA - scoreB : scoreB - scoreA
      }
      const valA = (a.title || '').toLowerCase()
      const valB = (b.title || '').toLowerCase()
      return valA.localeCompare(valB)
    }

    if (sortColumn === 'actions') {
      const valA = String(a.id || '').toLowerCase()
      const valB = String(b.id || '').toLowerCase()
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
    }

    // Default sorting (sortColumn === 'priority')
    const pA = (a.priority !== undefined && Number(a.priority) > 0) ? Number(a.priority) : 999
    const pB = (b.priority !== undefined && Number(b.priority) > 0) ? Number(b.priority) : 999
    if (pA !== pB) {
      return sortDirection === 'asc' ? pA - pB : pB - pA
    }
    const starA = a.isStarred ? 1 : 0
    const starB = b.isStarred ? 1 : 0
    if (starA !== starB) {
      return sortDirection === 'asc' ? starB - starA : starA - starB
    }
    const tA = (a.title || '').toLowerCase()
    const tB = (b.title || '').toLowerCase()
    return tA.localeCompare(tB)
  })

  // Keyword-based ordering for top-level product sections
  const getTopOrder = (title) => {
    const t = (title || '').toLowerCase()
    if (t.includes('bed frame')) return 5
    if (t.includes('divan')) return 2
    if (t.includes('headboard')) return 3
    if (t.includes('mattress')) return 4
    if (t.includes('bed')) return 1
    return 99
  }

  // Build hierarchical display rows when in natural view (priority sort & all filter tab)
  let displayRows = []
  if (sortColumn === 'priority' && filter === 'all') {
    const topCats = filteredPages.filter(p => isTopCategory(p))
    topCats.sort((a, b) => getTopOrder(a.title || a.name) - getTopOrder(b.title || b.name))

    const processedIds = new Set()
    const categoryRows = []

    topCats.forEach(topCat => {
      const topId = getRawId(topCat.id)
      processedIds.add(topCat.id)

      categoryRows.push({
        type: 'PAGE_ROW',
        isTopLevel: true,
        page: topCat,
        indent: 0
      })

      // Find Shop By visual separators under this top category
      const seps = shopBySeparators.filter(s => getRawId(s.parentId) === topId)
      seps.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''))

      seps.forEach(sep => {
        const sepId = getRawId(sep.id)
        categoryRows.push({
          type: 'SEPARATOR_ROW',
          id: sep.id,
          title: sep.title || sep.name,
          indent: 1
        })

        // Child leaf pages under this separator
        const sepChildren = filteredPages.filter(p => getRawId(p.parentId) === sepId)
        sepChildren.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''))
        sepChildren.forEach(child => {
          processedIds.add(child.id)
          categoryRows.push({
            type: 'PAGE_ROW',
            isTopLevel: false,
            page: child,
            indent: 2
          })
        })
      })

      // Direct children under this top category (not under a Shop By separator)
      const directChildren = filteredPages.filter(p => getRawId(p.parentId) === topId && p.id !== topCat.id && !processedIds.has(p.id))
      directChildren.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''))
      directChildren.forEach(child => {
        processedIds.add(child.id)
        categoryRows.push({
          type: 'PAGE_ROW',
          isTopLevel: false,
          page: child,
          indent: 1
        })
      })
    })

    // Remaining category pages (if any)
    const otherCats = filteredPages.filter(p => p.post_type === 'category' && !processedIds.has(p.id) && getRawId(p.id) !== '2')
    otherCats.forEach(c => {
      processedIds.add(c.id)
      categoryRows.push({
        type: 'PAGE_ROW',
        isTopLevel: false,
        page: c,
        indent: 1
      })
    })

    // CMS & Informational Pages
    const cmsPages = filteredPages.filter(p => p.post_type !== 'category')
    const cmsRows = []
    if (cmsPages.length > 0) {
      cmsRows.push({
        type: 'SECTION_HEADER',
        id: 'section-cms-header',
        title: 'CMS & Informational Pages'
      })
      cmsPages.forEach(p => {
        cmsRows.push({
          type: 'PAGE_ROW',
          isTopLevel: false,
          page: p,
          indent: 0
        })
      })
    }

    displayRows = [...categoryRows, ...cmsRows]
  } else {
    // When actively filtered or sorted by column, display flat rows
    displayRows = sortedPages.map(page => ({
      type: 'PAGE_ROW',
      isTopLevel: isTopCategory(page),
      page,
      indent: 0
    }))
  }

  // Calculate filter tab counts strictly for SEO-managed pages
  const allCount = pagesList.length
  const starredCount = pagesList.filter(p => p.isStarred === true && !p.isExcluded && p.type !== 'Excluded').length
  const configuredCount = pagesList.filter(p => p.isConfigured === true && !p.isExcluded && p.type !== 'Excluded').length
  const actionRequiredCount = pagesList.filter(p => !p.isConfigured && !p.isExcluded && p.type !== 'Excluded').length
  const excludedCount = pagesList.filter(p => p.isExcluded === true || p.type === 'Excluded').length

  const renderSortIndicator = (col) => {
    if (sortColumn !== col) return <span className="sort-icon inactive">↕</span>
    return <span className="sort-icon active">{sortDirection === 'asc' ? '▲' : '▼'}</span>
  }

  const handleRunFullUrlAudit = async () => {
    const typePriorityMap = {
      'Hub': 1,
      'Landing': 2,
      'Topical': 3,
      'Article': 4
    }

    // 1. Identify all active configured SEO pages in W3 ordered by Priority: Hub -> Landing -> Topical -> Article
    const activeSeoPages = pagesList
      .filter(p => {
        const typeStr = (p.type || p.seoPageType || '').trim()
        const isSeoType = ['Hub', 'Landing', 'Topical', 'Article'].includes(typeStr)
        return isSeoType && !p.isExcluded && typeStr !== 'Excluded'
      })
      .sort((a, b) => {
        const typeA = (a.type || a.seoPageType || '').trim()
        const typeB = (b.type || b.seoPageType || '').trim()
        const prioA = typePriorityMap[typeA] || (a.priority !== undefined && Number(a.priority) > 0 ? Number(a.priority) : 999)
        const prioB = typePriorityMap[typeB] || (b.priority !== undefined && Number(b.priority) > 0 ? Number(b.priority) : 999)

        if (prioA !== prioB) {
          return prioA - prioB
        }

        const titleA = (a.title || '').toLowerCase()
        const titleB = (b.title || '').toLowerCase()
        return titleA.localeCompare(titleB)
      })

    if (activeSeoPages.length === 0) {
      alert('No active SEO pages (Hub, Landing, Topical, Article) found in W3 to audit.')
      return
    }

    setIsBulkAuditing(true)
    setBulkAuditSummary(null)
    setBulkAuditProgress({ current: 0, total: activeSeoPages.length })

    let successfulCount = 0
    let failedCount = 0

    const formattedTimestamp = formatReadableDateTime(new Date())

    for (let i = 0; i < activeSeoPages.length; i++) {
      const page = activeSeoPages[i]
      const pageKey = page.id || page.url || page.pageUrl
      const urlKey = page.url || page.pageUrl || ''

      setCurrentlyAuditingKey(pageKey)

      try {
        const auditResult = await executePageAudit({
          siteId: site?.id || 'site-1',
          pageId: pageKey,
          url: urlKey,
          targetPhrase: (page.target || page.targetPhrase || '').trim(),
          seoPageType: page.type || page.seoPageType || 'Unclassified'
        })

        const auditRecord = {
          isAudited: true,
          isStale: false,
          staleReason: null,
          lastAuditTimestamp: formattedTimestamp,
          auditResult
        }

        if (site?.id) {
          await savePageAuditApi(site.id, pageKey, auditRecord)
        }

        // IMMEDIATELY update pageAudits state across ALL aliases (id, url, pageKey, urlKey, pageUrl)
        setPageAudits(prev => {
          const updated = { ...prev }
          const rec = { ...auditRecord, pageId: page.id, url: urlKey }
          if (page.id) updated[page.id] = rec
          if (page.url) updated[page.url] = rec
          if (pageKey) updated[pageKey] = rec
          if (urlKey) updated[urlKey] = rec
          if (page.pageUrl) updated[page.pageUrl] = rec
          return updated
        })

        successfulCount++
      } catch (err) {
        console.error(`Bulk audit failed for page "${page.title}" (${urlKey}):`, err)
        failedCount++
      }

      // Advance progress counter and yield 250ms for React to flush DOM re-render of this row to screen!
      setBulkAuditProgress({ current: i + 1, total: activeSeoPages.length })
      await new Promise(res => setTimeout(res, 250))
    }

    setCurrentlyAuditingKey(null)
    setIsBulkAuditing(false)
    setBulkAuditSummary({
      audited: successfulCount,
      failed: failedCount,
      skipped: pagesList.length - activeSeoPages.length
    })
  }

  return (
    <div className="w3-page-container">

      {/* ── Back to W2 Dashboard ── */}
      <div className="w3-back-row">
        <button
          type="button"
          className="w3-btn-back"
          onClick={onBack}
          id="btn-back-to-w2"
        >
          ← Back to W2 - Website Dashboard
        </button>
      </div>

      {/* ── Page Header ── */}
      <div className="w3-header">
        <div className="w3-header-meta">
          <span className="w3-pill-badge">W3 | PAGE MANAGEMENT</span>
          <h1 className="w3-site-name">{site?.name || site?.title || site?.siteName || 'Website Management'}</h1>
          {site?.url && (
            <a
              href={site.url}
              target="_blank"
              rel="noreferrer"
              className="w3-site-url"
            >
              {site.url}
            </a>
          )}
        </div>

        <div className="w3-header-actions">
          <button
            type="button"
            className={`btn-run-full-url-audit ${isBulkAuditing ? 'is-auditing' : ''}`}
            onClick={handleRunFullUrlAudit}
            disabled={isBulkAuditing}
            id="btn-run-full-url-audit"
          >
            {isBulkAuditing ? (
              <>
                <span className="icon-spin">⏳</span>
                <span>Auditing in Progress...</span>
              </>
            ) : (
              'Run Full URL Audit'
            )}
          </button>
        </div>
      </div>

      {/* ── Bulk Audit Live Progress Panel ── */}
      {isBulkAuditing && (
        <div className="w3-bulk-audit-progress-card" id="w3-bulk-audit-progress-card">
          <div className="w3-progress-indicator-header">
            <span className="w3-spinner-icon">⏳</span>
            <span className="w3-progress-counter-text">
              Auditing {bulkAuditProgress.current} of {bulkAuditProgress.total}
            </span>
          </div>
          <div className="w3-progress-bar-track">
            <div
              className="w3-progress-bar-fill"
              style={{ width: `${Math.round((bulkAuditProgress.current / Math.max(bulkAuditProgress.total, 1)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Bulk Audit Completion Status Banner ── */}
      {!isBulkAuditing && bulkAuditSummary && (
        <div className="w3-audit-summary-banner" id="w3-audit-summary-banner">
          <span className="w3-summary-text">
            {bulkAuditSummary.failed > 0
              ? `Audit Complete — ${bulkAuditSummary.audited} of ${bulkAuditProgress.total || (bulkAuditSummary.audited + bulkAuditSummary.failed)} | Failed: ${bulkAuditSummary.failed}`
              : `Audit Complete — ${bulkAuditSummary.audited} of ${bulkAuditProgress.total || bulkAuditSummary.audited}`}
          </span>
          <button
            type="button"
            className="btn-close-summary"
            onClick={() => setBulkAuditSummary(null)}
            id="btn-close-audit-summary"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Main Module Navigation Tabs ── */}
      <div className="w3-module-tabs">
        <button
          type="button"
          className="w3-tab active"
          id="tab-w3-manage-pages"
        >
          W3 | Manage Pages
        </button>
        <button
          type="button"
          className="w3-tab"
          onClick={() => onTabChange && onTabChange('w5')}
          id="tab-w3-all-internal-links"
        >
          W5 | All Internal Links
        </button>
        <button
          type="button"
          className="w3-tab"
          onClick={() => onTabChange && onTabChange('w6')}
          id="tab-w3-site-analysis"
        >
          W6 | Site Analysis
        </button>
        <button
          type="button"
          className="w3-tab"
          onClick={() => onTabChange && onTabChange('w7')}
          id="tab-w3-website-settings"
        >
          W7 | Website Settings
        </button>
      </div>

      {/* ── Filter Tabs & Bulk Actions ── */}
      <div className="w3-filter-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            className={`w3-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            id="filter-all"
          >
            All ({allCount})
          </button>
          <button
            type="button"
            className={`w3-filter-btn ${filter === 'starred' ? 'active' : ''}`}
            onClick={() => setFilter('starred')}
            id="filter-starred"
            style={starredCount > 0 ? { color: '#facc15' } : {}}
          >
            ⭐ Starred ({starredCount})
          </button>
          <button
            type="button"
            className={`w3-filter-btn ${filter === 'configured' ? 'active' : ''}`}
            onClick={() => setFilter('configured')}
            id="filter-configured"
          >
            Configured ({configuredCount})
          </button>
          <button
            type="button"
            className={`w3-filter-btn ${filter === 'action_required' ? 'active' : ''}`}
            onClick={() => setFilter('action_required')}
            id="filter-action-required"
          >
            Action Required ({actionRequiredCount})
          </button>
          <button
            type="button"
            className={`w3-filter-btn ${filter === 'excluded' ? 'active' : ''}`}
            onClick={() => setFilter('excluded')}
            id="filter-excluded"
          >
            Excluded ({excludedCount})
          </button>
        </div>

        {actionRequiredCount > 0 && (
          <button
            type="button"
            className="w3-btn-configure-targets"
            onClick={() => setIsBulkTargetDialogOpen(true)}
            id="btn-w3-bulk-configure-targets"
            style={{
              backgroundColor: '#2563eb',
              borderColor: '#1d4ed8',
              color: '#ffffff',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: '700',
              borderRadius: '6px',
              border: '1px solid',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 10px rgba(37,99,235,0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🎯 Configure Target Phrases ({actionRequiredCount})</span>
          </button>
        )}
      </div>

      {/* ── Exported Pages Table ── */}
      <div className="w3-table-wrapper">
        <table className="w3-table">
          <thead>
            <tr>
              <th className="sortable-th" onClick={() => handleSort('page')}>
                Page {renderSortIndicator('page')}
              </th>
              <th className="sortable-th" onClick={() => handleSort('type')}>
                Type {renderSortIndicator('type')}
              </th>
              <th className="sortable-th col-priority" onClick={() => handleSort('priority')}>
                Priority {renderSortIndicator('priority')}
              </th>
              <th className="sortable-th" onClick={() => handleSort('target')}>
                Target {renderSortIndicator('target')}
              </th>
              <th className="sortable-th" onClick={() => handleSort('lastAudit')}>
                Last Audit {renderSortIndicator('lastAudit')}
              </th>
              <th className="sortable-th" onClick={() => handleSort('auditPage')}>
                Audit Page {renderSortIndicator('auditPage')}
              </th>
              <th className="sortable-th" onClick={() => handleSort('actions')}>
                Actions {renderSortIndicator('actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayRows.length > 0 ? (
              displayRows.map((row, idx) => {
                if (row.type === 'SEPARATOR_ROW') {
                  return (
                    <tr key={row.id || `sep-${idx}`} className="w3-row-visual-separator">
                      <td colSpan="7">
                        <div className="w3-visual-separator-content" style={{ paddingLeft: `${(row.indent || 1) * 20 + 8}px` }}>
                          <span className="w3-separator-icon">📁</span>
                          <span className="w3-separator-label"><em>{row.title}</em></span>
                          <span className="w3-separator-badge">Navigation Category</span>
                        </div>
                      </td>
                    </tr>
                  )
                }

                if (row.type === 'SECTION_HEADER') {
                  return (
                    <tr key={row.id || `sec-${idx}`} className="w3-row-section-header">
                      <td colSpan="7">
                        <div className="w3-section-header-content">
                          <span className="w3-section-icon">📄</span>
                          <span className="w3-section-title">{row.title}</span>
                        </div>
                      </td>
                    </tr>
                  )
                }

                const page = row.page
                return (
                  <tr
                    key={page.id || page.url || idx}
                    className={row.isTopLevel ? 'w3-row-top-category' : ''}
                  >
                    <td className="col-page">
                      {row.isTopLevel ? (
                        <div className="w3-page-title-row">
                          <span className="w3-top-cat-pill">TOP CATEGORY</span>
                          <span className="w3-page-title w3-top-cat-title">{page.title || 'Untitled Page'}</span>
                          <div className="w3-page-slug" style={{ width: '100%', marginTop: '2px' }}>{page.url || ''}</div>
                        </div>
                      ) : row.indent > 0 ? (
                        <div className="w3-indented-cell" style={{ paddingLeft: `${row.indent * 18}px` }}>
                          <span className="w3-tree-branch">↳</span>
                          <div className="w3-page-title-content">
                            <div className="w3-page-title">{page.title || 'Untitled Page'}</div>
                            <div className="w3-page-slug">{page.url || ''}</div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w3-page-title">{page.title || 'Untitled Page'}</div>
                          <div className="w3-page-slug">{page.url || ''}</div>
                        </>
                      )}
                    </td>
                    <td className="col-type">
                      <div className="type-select-wrapper">
                        <select
                          className={`type-select type-${(page.type || 'unclassified').toLowerCase()}`}
                          value={page.type || 'Unclassified'}
                          onChange={(e) => handleInlineTypeChange(page, e.target.value)}
                        >
                          <option value="Hub">Hub</option>
                          <option value="Landing">Landing</option>
                          <option value="Topical">Topical</option>
                          <option value="Article">Article</option>
                          <option value="Excluded">Excluded</option>
                        </select>
                        {page.isManualOverride && (
                          <span className="manual-override-indicator" title="Manual Override Active (Preserved across resyncs)">
                            🔧
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="col-priority">
                      <div className="w3-priority-cell">
                        <span className="w3-priority-number">{page.priority !== undefined ? page.priority : 0}</span>
                        <button
                          type="button"
                          className={`btn-star-toggle ${page.isStarred ? 'is-starred' : 'is-unstarred'}`}
                          onClick={() => handleToggleStar(page)}
                          title={page.isStarred ? 'Remove work-priority star' : 'Set as work-priority star'}
                        >
                          {page.isStarred ? '⭐' : '☆'}
                        </button>
                      </div>
                    </td>
                    <td className="col-target">
                      {(page.target || page.targetPhrase || '').trim() ? (
                        page.target || page.targetPhrase
                      ) : (
                        <span className="target-not-set">Not Set</span>
                      )}
                    </td>
                    <td className="col-last-audit">
                      {page.isAudited ? (
                        page.isStale ? (
                          <button
                            type="button"
                            className="btn-audit-stale-badge"
                            onClick={() => onViewAudit && onViewAudit(page)}
                            id={`btn-last-audit-${page.id || idx}`}
                            title={page.staleReason || 'WordPress data changed after last audit'}
                          >
                            🟡 Audit Stale ({String(page.lastAuditDate || 'Stale')})
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-audit-completed-badge"
                            onClick={() => onViewAudit && onViewAudit(page)}
                            id={`btn-last-audit-${page.id || idx}`}
                            title="View completed audit results"
                          >
                            🟢 {String(page.lastAuditDate || 'Audited ✓')}
                          </button>
                        )
                      ) : (
                        <span className="w3-text-plain">Never</span>
                      )}
                    </td>
                    <td className="col-audit-page">
                      {currentlyAuditingKey && (currentlyAuditingKey === (page.id || page.url) || currentlyAuditingKey === page.url || currentlyAuditingKey === page.id) ? (
                        <button
                          type="button"
                          className="btn-table-audit-action btn-audit-in-progress"
                          disabled
                          id={`btn-audit-page-${page.id || idx}`}
                        >
                          ⏳ Auditing...
                        </button>
                      ) : page.isAudited ? (
                        page.isStale ? (
                          <button
                            type="button"
                            className="btn-audit-stale-action"
                            onClick={() => onViewAudit && onViewAudit(page)}
                            id={`btn-audit-page-${page.id || idx}`}
                            title={`WordPress content modified after audit - Re-audit recommended (${page.auditScore !== null ? `${page.auditScore} / 100` : 'Stale'})`}
                          >
                            {page.auditScore !== null ? `${page.auditScore} / 100` : 'Audit Required ?'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`btn-table-audit-action ${
                              page.auditScore !== null
                                ? (page.auditScore >= 70 ? 'btn-audit-score-green' : page.auditScore >= 50 ? 'btn-audit-score-amber' : 'btn-audit-score-red')
                                : 'btn-audit-score-green'
                            }`}
                            onClick={() => onViewAudit && onViewAudit(page)}
                            id={`btn-audit-page-${page.id || idx}`}
                            title="View completed audit results"
                          >
                            {page.auditScore !== null ? `${page.auditScore} / 100` : 'Audited ✓'}
                          </button>
                        )
                      ) : page.isConfigured ? (
                        <button
                          type="button"
                          className="btn-table-audit-action btn-audit-active"
                          onClick={() => onViewAudit && onViewAudit(page)}
                          id={`btn-audit-page-${page.id || idx}`}
                        >
                          Audit Page ▷
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-table-audit-action btn-audit-faded"
                          onClick={() => onViewAudit && onViewAudit(page)}
                          id={`btn-audit-page-${page.id || idx}`}
                        >
                          Audit Page ▷
                        </button>
                      )}
                    </td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className={`btn-configure-page ${page.isConfigured ? 'btn-configured-state' : ''}`}
                        onClick={() => setEditingPage(page)}
                        id={`btn-configure-page-${page.id || idx}`}
                      >
                        {page.isConfigured ? 'Configured' : 'Configure'}
                      </button>
                      {page.isExcluded || page.type === 'Excluded' ? (
                        <button
                          type="button"
                          className="btn-row-include"
                          onClick={() => handleIncludePage(page)}
                          title="Include page back in active list"
                          id={`btn-include-page-${page.id || idx}`}
                        >
                          Include
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-row-exclude"
                          onClick={() => handleExcludePage(page)}
                          title="Exclude page with 1-click"
                          id={`btn-exclude-page-${page.id || idx}`}
                        >
                          Exclude
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="7" className="w3-empty-row">
                  No pages found in stored exporter package.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Configure Page Targeting Modal ── */}
      {editingPage && (
        <ConfigurePageDialog
          siteUrl={site?.url}
          page={editingPage}
          onClose={() => setEditingPage(null)}
          onSave={handleSavePageConfig}
        />
      )}

      {/* ── Bulk Configure Target Phrases Modal ── */}
      {isBulkTargetDialogOpen && (
        <BulkConfigureTargetPhrasesDialog
          isOpen={isBulkTargetDialogOpen}
          pages={pagesList}
          site={site}
          onClose={() => setIsBulkTargetDialogOpen(false)}
          onSave={handleSaveBulkConfigs}
        />
      )}

    </div>
  )
}
