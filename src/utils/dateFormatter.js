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

export function getCurrentFormattedDateTime() {
  return formatReadableDateTime(new Date())
}
