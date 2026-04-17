const DAYS = ['M', 'T', 'W', 'R', 'F']
const DAY_LABELS = { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri' }

const CAL_START = 8 * 60
const CAL_END   = 22 * 60
const CAL_RANGE = CAL_END - CAL_START
const COL_H     = 560

const HOUR_LABELS = Array.from({ length: CAL_END / 60 - CAL_START / 60 + 1 }, (_, i) => {
  const h = CAL_START / 60 + i
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return { h, label: `${h12} ${period}` }
})

const FALLBACK_COLORS = [
  { bg: 'bg-blue-500/20',    border: 'border-blue-500',    text: 'text-blue-300' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-300' },
  { bg: 'bg-violet-500/20',  border: 'border-violet-500',  text: 'text-violet-300' },
  { bg: 'bg-orange-500/20',  border: 'border-orange-500',  text: 'text-orange-300' },
]

const toMin = (t) => {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const formatTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export default function WeeklyCalendar({ sections, colorMap }) {
  const byDay = {}
  DAYS.forEach(d => { byDay[d] = [] })

  sections.forEach(section => {
    const days = section.meeting_days || []
    const startMin = toMin(section.start_time)
    const endMin   = toMin(section.end_time)
    if (startMin === null || endMin === null) return
    days.forEach(day => {
      if (byDay[day]) byDay[day].push({ ...section, startMin, endMin })
    })
  })

  const topPx   = (min) => ((min - CAL_START) / CAL_RANGE) * COL_H
  const heightPx = (s, e) => Math.max(((e - s) / CAL_RANGE) * COL_H, 20)

  return (
    <div className="flex text-xs select-none overflow-x-auto">
      {/* Time axis */}
      <div style={{ width: 44, minWidth: 44, height: COL_H }} className="relative shrink-0">
        {HOUR_LABELS.map(({ h, label }) => (
          <div
            key={h}
            className="absolute right-2 text-slate-600 leading-none"
            style={{ top: topPx(h * 60) - 6 }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div className="flex flex-1 gap-1 min-w-0">
        {DAYS.map(day => (
          <div key={day} className="flex-1 flex flex-col min-w-0">
            <div className="text-center text-slate-500 font-semibold pb-1">{DAY_LABELS[day]}</div>
            <div
              className="relative bg-slate-900/60 rounded border border-slate-700/50"
              style={{ height: COL_H }}
            >
              {HOUR_LABELS.map(({ h }) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-slate-700/40"
                  style={{ top: topPx(h * 60) }}
                />
              ))}
              {byDay[day].map((sec) => {
                const color = colorMap?.[sec.course_code] || FALLBACK_COLORS[0]
                const top    = topPx(sec.startMin)
                const height = heightPx(sec.startMin, sec.endMin)
                return (
                  <div
                    key={sec.crn}
                    className={`absolute left-0.5 right-0.5 rounded border-l-2 px-1 py-0.5
                                overflow-hidden ${color.bg} ${color.border} ${color.text}`}
                    style={{ top, height }}
                    title={`${sec.course_code} · CRN ${sec.crn} · ${formatTime(sec.start_time)} – ${formatTime(sec.end_time)} · ${sec.location || ''}`}
                  >
                    <div className="font-bold leading-tight truncate">{sec.course_code}</div>
                    {height > 28 && (
                      <div className="leading-tight truncate opacity-70 text-[10px]">
                        <span className="font-mono">CRN {sec.crn}</span>
                        <span className="mx-0.5">·</span>
                        {formatTime(sec.start_time)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
