/**
 * Service for handling Restore Point creation and index persistence.
 */
import { restorePointIndexData } from '../data/restorePointData'

const STORAGE_KEY = 'tse_restore_point_index_v1'

export function getRestorePointIndex() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Always merge code master restore points with any user-created items
        const codeTags = new Set(restorePointIndexData.map(item => item.gitTag || item.id))
        const userCreated = parsed.filter(item => !codeTags.has(item.gitTag || item.id))

        const merged = [...restorePointIndexData, ...userCreated]
        merged.forEach((item, idx) => {
          item.status = idx === 0 ? 'Current' : 'Superseded'
        })
        return merged
      }
    }
  } catch (e) {
    console.error('Error reading restore points from localStorage:', e)
  }
  const res = [...restorePointIndexData]
  res.forEach((item, idx) => {
    item.status = idx === 0 ? 'Current' : 'Superseded'
  })
  return res
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
