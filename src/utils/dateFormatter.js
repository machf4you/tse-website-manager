/**
 * Standardized Date/Time Formatter for TSE Website Manager
 * Formats all dates consistently into: "31 August 2026 12:56"
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function formatReadableDateTime(ts) {
  if (!ts) return null
  
  if (typeof ts === 'number') {
    const d = new Date(ts > 1e11 ? ts : ts * 1000)
    if (isNaN(d.getTime())) return null
    const pad = n => String(n).padStart(2, '0')
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  if (ts instanceof Date) {
    if (isNaN(ts.getTime())) return null
    const pad = n => String(n).padStart(2, '0')
    return `${ts.getDate()} ${MONTH_NAMES[ts.getMonth()]} ${ts.getFullYear()} ${pad(ts.getHours())}:${pad(ts.getMinutes())}`
  }

  if (typeof ts !== 'string') return null
  const trimmed = ts.trim()
  if (!trimmed) return null

  // Check if already in format "D(D) Month YYYY HH:MM"
  if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}\s+\d{1,2}:\d{2}$/.test(trimmed)) {
    return trimmed
  }

  // Handle DD-MM-YYYY HH:MM or DD/MM/YYYY HH:MM or DD-MM-YYYY
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/)
  if (ddmmyyyyMatch) {
    const [, day, month, year, hours = '00', minutes = '00'] = ddmmyyyyMatch
    const monthIdx = parseInt(month, 10) - 1
    if (monthIdx >= 0 && monthIdx < 12) {
      const pad = n => String(n).padStart(2, '0')
      return `${parseInt(day, 10)} ${MONTH_NAMES[monthIdx]} ${year} ${pad(parseInt(hours, 10))}:${pad(parseInt(minutes, 10))}`
    }
  }

  // Handle ISO string or standard parseable dates
  const ms = Date.parse(trimmed)
  if (!isNaN(ms) && ms > 0) {
    const d = new Date(ms)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return trimmed
}

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export function formatCompactAuditDate(ts) {
  if (!ts) return 'Never'
  if (ts === 'Never' || ts === '—' || ts === '-') return 'Never'
  if (ts === 'Audited ✓') return 'Audited ✓'

  let d = null

  if (typeof ts === 'number') {
    d = new Date(ts > 1e11 ? ts : ts * 1000)
  } else if (ts instanceof Date) {
    d = ts
  } else if (typeof ts === 'string') {
    const trimmed = ts.trim()
    if (!trimmed || trimmed === 'Never') return 'Never'
    
    // Check DD-MM-YYYY or DD/MM/YYYY
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch
      const mIdx = parseInt(month, 10) - 1
      if (mIdx >= 0 && mIdx < 12) {
        return `${parseInt(day, 10)} ${MONTH_ABBR[mIdx]} ${String(year).slice(-2)}`
      }
    }

    // Check "D(D) Month YYYY"
    const textDateMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
    if (textDateMatch) {
      const [, day, monthName, year] = textDateMatch
      const mIdx = MONTH_NAMES.findIndex(m => m.toLowerCase().startsWith(monthName.toLowerCase().slice(0, 3)))
      if (mIdx >= 0) {
        return `${parseInt(day, 10)} ${MONTH_ABBR[mIdx]} ${String(year).slice(-2)}`
      }
    }

    const ms = Date.parse(trimmed)
    if (!isNaN(ms) && ms > 0) {
      d = new Date(ms)
    }
  }

  if (d && !isNaN(d.getTime())) {
    const day = d.getDate()
    const month = MONTH_ABBR[d.getMonth()]
    const year = String(d.getFullYear()).slice(-2)
    return `${day} ${month} ${year}`
  }

  return 'Never'
}

export function getCurrentFormattedDateTime() {
  return formatReadableDateTime(new Date())
}

