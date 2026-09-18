/**
 * Service for handling Restore Point creation and index persistence.
 */
import { restorePointIndexData } from '../data/restorePointData'

const STORAGE_KEY = 'tse_restore_point_index_v1'

export async function fetchRestorePointIndexApi() {
  try {
    const res = await fetch('/api/restore-points', {
      headers: { 'Cache-Control': 'no-cache' }
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.restorePoints) && data.restorePoints.length > 0) {
        return data.restorePoints
      }
    }
  } catch (e) {
    console.warn('[RESTORE_POINTS_API_FETCH_FALLBACK]', e)
  }
  return getRestorePointIndex()
}

export function getRestorePointIndex() {
  let userCreated = []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const codeIds = new Set(restorePointIndexData.map(item => item.id))
        const codeTags = new Set(restorePointIndexData.map(item => item.gitTag).filter(Boolean))

        userCreated = parsed.filter(item => {
          const hasId = item.id && codeIds.has(item.id)
          const hasTag = item.gitTag && codeTags.has(item.gitTag)
          return !hasId && !hasTag
        })
      }
    }
  } catch (e) {
    console.error('Error reading restore points from localStorage:', e)
  }

  const merged = [...restorePointIndexData, ...userCreated]
  
  // Group by application and assign Current to the newest item, Superseded to others
  const appGroups = {}
  for (const item of merged) {
    if (!appGroups[item.app]) appGroups[item.app] = []
    appGroups[item.app].push(item)
  }

  const result = []
  for (const app of Object.keys(appGroups)) {
    const group = appGroups[app]
    group.forEach((item, idx) => {
      item.status = idx === 0 ? 'Current' : 'Superseded'
      result.push(item)
    })
  }

  return result
}

export function saveRestorePointIndex(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Error saving restore points to localStorage:', e)
  }
}

export function formatDateTimeDDMMYYYYHHMM(d = new Date()) {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}-${month}-${year} ${hours}:${minutes}`
}

export async function createRestorePoint({ version, title, description }) {
  const cleanVersion = version.trim()
  const cleanTitle = title.trim()
  const cleanDesc = description.trim()

  // 1. Validation
  if (!cleanVersion) {
    return { success: false, error: 'Please enter a Version (e.g. v1.3).' }
  }
  if (!cleanTitle) {
    return { success: false, error: 'Please enter a Title.' }
  }
  if (!cleanDesc) {
    return { success: false, error: 'Please enter a Description.' }
  }

  // 2. Format slug & identifiers
  const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const gitTag = `${cleanVersion}-${slug}`
  const docFile = `RESTORE-POINT-${gitTag}.md`
  const mockCommit = Math.random().toString(16).substring(2, 9)
  const todayDate = formatDateTimeDDMMYYYYHHMM(new Date())

  // 3. Create Record
  const newPoint = {
    id: cleanVersion + '-' + Date.now(),
    version: cleanVersion,
    gitTag,
    commit: mockCommit,
    date: todayDate,
    title: cleanTitle,
    description: cleanDesc,
    status: 'Current',
    docFile,
  }

  // 4. Update Index (Mark previous current items as Superseded)
  const currentIndex = getRestorePointIndex()
  const updatedIndex = [
    newPoint,
    ...currentIndex.map(item => ({ ...item, status: 'Superseded' }))
  ]

  saveRestorePointIndex(updatedIndex)

  return {
    success: true,
    item: newPoint,
    allPoints: updatedIndex,
  }
}
