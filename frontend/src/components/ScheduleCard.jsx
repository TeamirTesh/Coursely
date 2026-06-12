import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WeeklyCalendar from './WeeklyCalendar'

const SERIF = { fontFamily: '"Instrument Serif", ui-serif, Georgia, serif' }

const DAY_ORDER  = ['M', 'T', 'W', 'R', 'F']
const DAY_FULL   = { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri' }
const DAY_TO_ICS = { M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR' }
const SEMESTER_END_ICS = '20261215T235959Z'
const SEMESTER_DATES   = { M: '20260824', T: '20260825', W: '20260826', R: '20260827', F: '20260828' }

const formatTime = (t) => {
  if (!t) return 'TBA'
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const formatDays = (days) => {
  if (!days?.length) return 'TBA'
  return days.slice().sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)).map(d => DAY_FULL[d] || d).join(' / ')
}

const toICSTime = (t) => {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return `${String(h).padStart(2,'0')}${String(m).padStart(2,'00')}00`
}

const generateICS = (sections) => {
  let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Coursely//GSU//EN\r\nCALSCALE:GREGORIAN\r\n'
  sections.forEach(s => {
    const days = s.meeting_days || []
    if (!days.length || !s.start_time || !s.end_time) return
    const icsDays  = days.map(d => DAY_TO_ICS[d]).filter(Boolean)
    if (!icsDays.length) return
    const firstDay = days.filter(d => SEMESTER_DATES[d]).sort((a,b) => DAY_ORDER.indexOf(a)-DAY_ORDER.indexOf(b))[0]
    if (!firstDay) return
    const dtStart = toICSTime(s.start_time), dtEnd = toICSTime(s.end_time)
    if (!dtStart || !dtEnd) return
    ics += `BEGIN:VEVENT\r\nUID:coursely-${s.crn}@gsu.edu\r\n`
    ics += `DTSTART;TZID=America/New_York:${SEMESTER_DATES[firstDay]}T${dtStart}\r\n`
    ics += `DTEND;TZID=America/New_York:${SEMESTER_DATES[firstDay]}T${dtEnd}\r\n`
    ics += `RRULE:FREQ=WEEKLY;BYDAY=${icsDays.join(',')};UNTIL=${SEMESTER_END_ICS}\r\n`
    ics += `SUMMARY:${s.course_code} - ${s.title}\r\n`
    if (s.location) ics += `LOCATION:${s.location}\r\n`
    ics += `DESCRIPTION:Professor: ${s.professor||'TBA'}\\nCRN: ${s.crn}\r\nEND:VEVENT\r\n`
  })
  return ics + 'END:VCALENDAR'
}

const exportICS = (sections, rank) => {
  const blob = new Blob([generateICS(sections)], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `coursely-schedule-${rank}.ics`; a.click()
  URL.revokeObjectURL(url)
}


function scoreColor(score) {
  if (score >= 75) return '#86efac'
  if (score >= 55) return '#fde68a'
  return '#fca5a5'
}

function ScoreBar({ label, value }) {
  const pct = value == null || Number.isNaN(value) ? null : Math.round(value * 100)
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'rgba(238,237,232,0.35)' }}>{label}</span>
        <span className="tabular-nums font-medium" style={{ color: pct == null ? 'rgba(238,237,232,0.2)' : 'rgba(238,237,232,0.55)' }}>
          {pct == null ? '—' : `${pct}%`}
        </span>
      </div>
      <div className="h-1 overflow-hidden" style={{ background: 'rgba(238,237,232,0.08)' }}>
        {pct != null && <div className="h-full" style={{ width: `${pct}%`, background: '#eeede8' }} />}
      </div>
    </div>
  )
}

export default function ScheduleCard({ result, colorMap }) {
  const { rank, score, professor_score, compactness_score, slot_score, sections } = result
  const [view, setView] = useState('list')

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="transition-colors"
      style={{ background: '#161614', border: '1px solid rgba(238,237,232,0.08)' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(238,237,232,0.18)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(238,237,232,0.08)')}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-start justify-between" style={{ borderBottom: '1px solid rgba(238,237,232,0.07)' }}>
        <div>
          <div className="text-xs font-medium mb-1" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(238,237,232,0.25)' }}>
            Schedule #{rank}
          </div>
          <div style={{ ...SERIF, fontStyle: 'italic', fontSize: '3rem', lineHeight: 1, color: scoreColor(score) }}>
            {score}
            <span style={{ fontSize: '1rem', fontStyle: 'normal', color: 'rgba(238,237,232,0.2)', fontFamily: 'Inter, sans-serif' }}>/100</span>
          </div>
        </div>
        <div className="w-44 space-y-2 pt-1">
          <ScoreBar label="Professor"   value={professor_score} />
          <ScoreBar label="Compactness" value={compactness_score} />
          <ScoreBar label="Time Fit"    value={slot_score} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: '1px solid rgba(238,237,232,0.06)' }}>
        <div className="flex gap-0.5 p-0.5" style={{ background: 'rgba(238,237,232,0.05)' }}>
          {['list', 'calendar'].map(v => (
            <button key={v} onClick={() => setView(v)} className="px-3 py-1 text-xs font-medium transition-all"
              style={view === v
                ? { background: '#2a2925', color: '#eeede8' }
                : { background: 'transparent', color: 'rgba(238,237,232,0.35)' }}>
              {v === 'list' ? 'List' : 'Calendar'}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={() => exportICS(sections, rank)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 transition-colors"
            style={{ border: '1px solid rgba(238,237,232,0.15)', color: 'rgba(238,237,232,0.4)', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#eeede8'; e.currentTarget.style.borderColor = 'rgba(238,237,232,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(238,237,232,0.4)'; e.currentTarget.style.borderColor = 'rgba(238,237,232,0.15)' }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export .ics
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
            className="px-6 py-4 space-y-2">
            {sections.map(s => {
              const hex = colorMap?.[s.course_code]?.hex
              return (
                <div key={s.crn} className="px-4 py-3"
                  style={{
                    borderLeft: `2px solid ${hex || 'rgba(238,237,232,0.2)'}`,
                    background: hex ? `${hex}0d` : 'rgba(238,237,232,0.03)',
                    border: `1px solid ${hex ? hex + '20' : 'rgba(238,237,232,0.07)'}`,
                    borderLeftWidth: 2,
                    borderLeftColor: hex || 'rgba(238,237,232,0.2)',
                  }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-mono text-sm font-bold" style={{ color: hex || '#eeede8' }}>{s.course_code}</span>
                        <span className="text-sm truncate" style={{ color: 'rgba(238,237,232,0.55)' }}>{s.title}</span>
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(238,237,232,0.35)' }}>
                        <span className="font-mono" style={{ color: 'rgba(238,237,232,0.25)' }}>CRN {s.crn}</span>
                        {' · '}{formatDays(s.meeting_days)} · {formatTime(s.start_time)} – {formatTime(s.end_time)}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'rgba(238,237,232,0.3)' }}>
                        {s.professor || 'Professor TBA'} · {s.location || 'Location TBA'}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {s.overall_rating != null ? (
                        <div className="text-xs">
                          <span className="font-semibold" style={{ color: 'rgba(238,237,232,0.65)' }}>{s.overall_rating}</span>
                          <span style={{ color: 'rgba(238,237,232,0.2)' }}>/5</span>
                          <div style={{ color: 'rgba(238,237,232,0.3)' }}>{s.difficulty} diff</div>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'rgba(238,237,232,0.2)' }}>No ratings</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
            className="px-6 py-4">
            <WeeklyCalendar sections={sections} colorMap={colorMap} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
