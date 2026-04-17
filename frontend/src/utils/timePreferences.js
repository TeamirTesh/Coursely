/** Aligns with backend `time_preferences` (day + 12h time_slot labels). */

export const GRID_DAYS = ['M', 'T', 'W', 'R', 'F']

export const GRID_TO_API_DAY = {
  M: 'Mon',
  T: 'Tue',
  W: 'Wed',
  R: 'Thu',
  F: 'Fri',
}

export const API_DAY_TO_GRID = Object.fromEntries(
  Object.entries(GRID_TO_API_DAY).map(([g, a]) => [a, g]),
)

export const SLOT_KEYS = []
for (let min = 480; min < 1320; min += 30) {
  const h = Math.floor(min / 60)
  const m = min % 60
  SLOT_KEYS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
}

/** Match PreferenceGrid / backend slot labels: "8:00 AM", "1:30 PM", … */
export function slotKeyToTimeLabel(slotKey) {
  const [h, m] = slotKey.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

/** Inverse of slotKeyToTimeLabel */
export function timeLabelToSlotKey(label) {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s+(AM|PM)$/i)
  if (!match) return null
  let hour = parseInt(match[1], 10)
  const minute = parseInt(match[2], 10)
  const ap = match[3].toUpperCase()
  if (ap === 'PM' && hour !== 12) hour += 12
  if (ap === 'AM' && hour === 12) hour = 0
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/** DB: 0=red, 1=yellow, 2=green */
export const COLOR_TO_PREF = { red: 0, yellow: 1, green: 2 }

export const PREF_TO_COLOR = { 0: 'red', 1: 'yellow', 2: 'green' }

/** Build sparse grid from API rows (missing cells default to red in UI). */
export function mergeTimeRowsIntoGrid(rows) {
  const grid = {}
  for (const row of rows) {
    const gDay = API_DAY_TO_GRID[row.day]
    const sk = timeLabelToSlotKey(row.time_slot)
    if (!gDay || !sk) continue
    const col = PREF_TO_COLOR[row.preference]
    if (col === 'red') continue
    if (!grid[gDay]) grid[gDay] = {}
    grid[gDay][sk] = col
  }
  return grid
}
