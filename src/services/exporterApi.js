/**
 * Integration Service: TSE WordPress Exporter Client
 * Connects to the TSE WordPress Exporter REST endpoint.
 *
 * Endpoint: GET {websiteUrl}/wp-json/tse-site-exporter/v1/export
 * Authentication: WordPress Application Password (Basic Auth)
 */

export async function fetchTseWordPressExportPackage({
  websiteUrl,
  username,
  applicationPassword,
}) {
  if (!websiteUrl) {
    return { success: false, error: 'MISSING_URL', message: 'Website URL is required.' }
  }

  // 1. Normalize Website Base URL
  const cleanUrl = websiteUrl.trim().replace(/\/+$/, '')
  const endpoint = `${cleanUrl}/wp-json/tse-site-exporter/v1/export`

  // 2. Prepare Standard Request Headers
  const headers = {
    'Accept': 'application/json',
  }

  if (username && applicationPassword) {
    const authString = btoa(`${username.trim()}:${applicationPassword.trim()}`)
    headers['Authorization'] = `Basic ${authString}`
  }

  // 3. Issue GET Request
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      // Fallback: Fetch public WordPress REST API pages, posts, and projects directly
      try {
        const [pagesRes, postsRes, projRes] = await Promise.all([
          fetch(`${cleanUrl}/wp-json/wp/v2/pages?per_page=100`),
          fetch(`${cleanUrl}/wp-json/wp/v2/posts?per_page=100`),
          fetch(`${cleanUrl}/wp-json/wp/v2/projects?per_page=100`)
        ])

        const pages = pagesRes.ok ? await pagesRes.json() : []
        const posts = postsRes.ok ? await postsRes.json() : []
        const projects = projRes.ok ? await projRes.json() : []

        const combinedPages = [
          ...(Array.isArray(pages) ? pages : []),
          ...(Array.isArray(posts) ? posts : []),
          ...(Array.isArray(projects) ? projects : [])
        ]

        if (combinedPages.length > 0) {
          return {
            success: true,
            packageData: {
              pages: combinedPages,
              posts,
              site_info: { url: cleanUrl }
            }
          }
        }
      } catch (fbError) {
        console.error('WP REST fallback failed:', fbError)
      }

      let customMsg = `TSE Exporter endpoint returned status ${response.status} (${response.statusText}).`
      if (response.status === 401) {
        customMsg = 'WordPress Authentication Failed: Invalid Username or Application Password (HTTP 401).'
      }
      return {
        success: false,
        status: response.status,
        error: `EXPORTER_HTTP_${response.status}`,
        message: customMsg,
      }
    }

    const packageData = await response.json()

    // If WordPress returns a WP_Error payload (e.g. { code: '...', message: '...' })
    if (packageData && packageData.code && packageData.message && !packageData.pages && !packageData.data?.pages) {
      // Fallback to public REST API pages, posts, and projects
      try {
        const [pagesRes, postsRes, projRes] = await Promise.all([
          fetch(`${cleanUrl}/wp-json/wp/v2/pages?per_page=100`),
          fetch(`${cleanUrl}/wp-json/wp/v2/posts?per_page=100`),
          fetch(`${cleanUrl}/wp-json/wp/v2/projects?per_page=100`)
        ])

        const pages = pagesRes.ok ? await pagesRes.json() : []
        const posts = postsRes.ok ? await postsRes.json() : []
        const projects = projRes.ok ? await projRes.json() : []

        const combinedPages = [
          ...(Array.isArray(pages) ? pages : []),
          ...(Array.isArray(posts) ? posts : []),
          ...(Array.isArray(projects) ? projects : [])
        ]

        if (combinedPages.length > 0) {
          return {
            success: true,
            packageData: {
              pages: combinedPages,
              posts,
              site_info: { url: cleanUrl }
            }
          }
        }
      } catch (fbError) {
        console.error('WP REST fallback failed:', fbError)
      }

      return {
        success: false,
        error: packageData.code,
        message: `WordPress Error (${packageData.code}): ${packageData.message}`,
      }
    }

    return {
      success: true,
      packageData,
    }
  } catch (error) {
    return {
      success: false,
      error: 'EXPORTER_NETWORK_ERROR',
      message: error.message || 'Failed to reach TSE WordPress Exporter endpoint.',
    }
  }
}

/**
 * Backward compatible alias for exporterApi service caller
 */
export async function callTseWordPressExporter({
  websiteId,
  websiteUrl,
  username,
  applicationPassword,
}) {
  const result = await fetchTseWordPressExportPackage({
    websiteUrl,
    username,
    applicationPassword,
  })

  if (result.success && result.packageData) {
    return {
      success: true,
      websiteId,
      packageData: result.packageData,
    }
  }

  return result
}

/**
 * Integration Service: Magento REST API Exporter Client
 * Connects to Magento REST API endpoints (categories, products, cmsPage).
 *
 * Base API URL: {apiBaseUrl} (e.g. https://www.hf4you.co.uk/rest/all/V1)
 * Store View Code: {storeCode} (e.g. default)
 * Authentication: Bearer Token (Admin / Integration Token)
 */
export async function fetchMagentoExportPackage({
  websiteUrl,
  apiBaseUrl,
  token,
  storeCode = 'default'
}) {
  if (!websiteUrl) {
    return { success: false, error: 'MISSING_URL', message: 'Website URL is required.' }
  }

  const cleanSiteUrl = websiteUrl.trim().replace(/\/+$/, '')
  const baseApi = (apiBaseUrl || `${cleanSiteUrl}/rest/all/V1`).trim().replace(/\/+$/, '')

  const headers = {
    'Accept': 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`
  }

  try {
    // Query Magento Categories, Products, and CMS Pages
    const [catRes, prodRes, cmsRes] = await Promise.all([
      fetch(`${baseApi}/categories`, { method: 'GET', headers }).catch(() => null),
      fetch(`${baseApi}/products?searchCriteria[pageSize]=100`, { method: 'GET', headers }).catch(() => null),
      fetch(`${baseApi}/cmsPage/search?searchCriteria[pageSize]=100`, { method: 'GET', headers }).catch(() => null)
    ])

    // If all endpoints returned 401 Unauthorized
    if (catRes?.status === 401 || prodRes?.status === 401 || cmsRes?.status === 401) {
      return {
        success: false,
        status: 401,
        error: 'MAGENTO_AUTH_FAILED',
        message: 'Magento REST API Authentication Failed (HTTP 401). Please check the API Admin Token in Website Settings.'
      }
    }

    const categoriesJson = catRes && catRes.ok ? await catRes.json() : null
    const productsJson = prodRes && prodRes.ok ? await prodRes.json() : null
    const cmsPagesJson = cmsRes && cmsRes.ok ? await cmsRes.json() : null

    const pages = []

    // 1. Convert Magento Categories into pages
    function processCategoryNode(node) {
      if (!node) return
      if (node.name && node.id) {
        const catSlug = node.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        pages.push({
          id: `cat-${node.id}`,
          title: node.name,
          url: `${cleanSiteUrl}/${catSlug}`,
          link: `${cleanSiteUrl}/${catSlug}`,
          type: 'Landing',
          post_type: 'category',
          is_active: node.is_active,
          level: node.level
        })
      }
      if (Array.isArray(node.children_data)) {
        node.children_data.forEach(processCategoryNode)
      }
    }
    if (categoriesJson) {
      processCategoryNode(categoriesJson)
    }

    // 2. Convert Magento CMS Pages into pages
    if (cmsPagesJson && Array.isArray(cmsPagesJson.items)) {
      cmsPagesJson.items.forEach(p => {
        const slug = p.identifier || ''
        const pageUrl = slug === 'home' || slug === '' ? cleanSiteUrl : `${cleanSiteUrl}/${slug}`
        pages.push({
          id: `cms-${p.id}`,
          title: p.title || p.identifier,
          url: pageUrl,
          link: pageUrl,
          type: p.identifier === 'home' ? 'Hub' : 'Landing',
          post_type: 'cms_page',
          content: p.content || '',
          meta_title: p.meta_title || p.title,
          meta_description: p.meta_description || ''
        })
      })
    }

    // 3. Convert Magento Products into pages
    if (productsJson && Array.isArray(productsJson.items)) {
      productsJson.items.forEach(prod => {
        const urlKeyAttr = prod.custom_attributes?.find(a => a.attribute_code === 'url_key')?.value
        const slug = (urlKeyAttr || prod.name || prod.sku).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        pages.push({
          id: `prod-${prod.id}`,
          title: prod.name || prod.sku,
          url: `${cleanSiteUrl}/${slug}`,
          link: `${cleanSiteUrl}/${slug}`,
          type: 'Landing',
          post_type: 'product',
          sku: prod.sku,
          price: prod.price
        })
      })
    }

    // Fallback if 0 items returned
    if (pages.length === 0) {
      return {
        success: false,
        status: 200,
        message: 'Magento REST API returned 0 pages/categories/products.'
      }
    }

    return {
      success: true,
      packageData: {
        site_info: {
          url: cleanSiteUrl,
          platform: 'magento',
          store_code: storeCode
        },
        pages,
        categories: categoriesJson,
        products: productsJson?.items || [],
        cms_pages: cmsPagesJson?.items || []
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'MAGENTO_NETWORK_ERROR',
      message: `Failed to connect to Magento REST API: ${error.message}`
    }
  }
}
