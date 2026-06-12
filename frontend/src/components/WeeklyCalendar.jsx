const DAYS      = ['M', 'T', 'W', 'R', 'F']
const DAY_LABELS= { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri' }
const CAL_START = 8  * 60
const CAL_END   = 22 * 60
const CAL_RANGE = CAL_END - CAL_START
const COL_H     = 560

const HOUR_LABELS = Array.from({ length: CAL_END / 60 - CAL_START / 60 + 1 }, (_, i) => {
  const h = CAL_START / 60 + i
  return { h, label: `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}` }
})

const toMin = (t) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m }

const formatTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default function WeeklyCalendar({ sections, colorMap }) {
  const byDay = {}
  DAYS.forEach(d => { byDay[d] = [] })

  sections.forEach(section => {
    const days     = section.meeting_days || []
    const startMin = toMin(section.start_time)
    const endMin   = toMin(section.end_time)
    if (startMin === null || endMin === null) return
    days.forEach(day => { if (byDay[day]) byDay[day].push({ ...section, startMin, endMin }) })
  })

  const topPx    = (min) => ((min - CAL_START) / CAL_RANGE) * COL_H
  const heightPx = (s, e) => Math.max(((e - s) / CAL_RANGE) * COL_H, 20)

  return (
    <div className="flex text-xs select-none overflow-x-auto">
      {/* Time axis */}
      <div style={{ width: 44, minWidth: 44, height: COL_H }} className="relative shrink-0">
        {HOUR_LABELS.map(({ h, label }) => (
          <div key={h} className="absolute right-2 leading-none" style={{ top: topPx(h * 60) - 6, color: 'rgba(238,237,232,0.25)' }}>
            {label}
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div className="flex flex-1 gap-1 min-w-0">
        {DAYS.map(day => (
          <div key={day} className="flex-1 flex flex-col min-w-0">
            <div className="text-center font-medium pb-1" style={{ color: 'rgba(238,237,232,0.35)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {DAY_LABELS[day]}
            </div>
            <div
              className="relative"
              style={{ height: COL_H, background: 'rgba(238,237,232,0.02)', border: '1px solid rgba(238,237,232,0.07)' }}
            >
              {HOUR_LABELS.map(({ h }) => (
                <div
                  key={h}
                  className="absolute left-0 right-0"
                  style={{ top: topPx(h * 60), borderTop: '1px solid rgba(238,237,232,0.05)' }}
                />
              ))}
              {byDay[day].map((sec) => {
                const hex    = colorMap?.[sec.course_code]?.hex
                const top    = topPx(sec.startMin)
                const height = heightPx(sec.startMin, sec.endMin)
                return (
                  <div
                    key={sec.crn}
                    className="absolute left-0.5 right-0.5 overflow-hidden px-1 py-0.5"
                    style={{
                      top,
                      height,
                      background:  hex ? `${hex}20` : 'rgba(238,237,232,0.06)',
                      borderLeft:  `2px solid ${hex || 'rgba(238,237,232,0.3)'}`,
                      color:       hex || 'rgba(238,237,232,0.7)',
                    }}
                    title={`${sec.course_code} · CRN ${sec.crn} · ${formatTime(sec.start_time)} – ${formatTime(sec.end_time)} · ${sec.location || ''}`}
                  >
                    <div className="font-bold leading-tight truncate">{sec.course_code}</div>
                    {height > 28 && (
                      <div className="leading-tight truncate" style={{ fontSize: 9, opacity: 0.6 }}>
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
