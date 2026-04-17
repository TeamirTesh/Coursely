import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WeeklyCalendar from './WeeklyCalendar'

const DAY_ORDER = ['M', 'T', 'W', 'R', 'F']
const DAY_FULL  = { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri' }

const DAY_TO_ICS = { M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR' }
// Semester: Aug 24 (Mon) – Dec 15, 2026
const SEMESTER_END_ICS = '20261215T235959Z'
const SEMESTER_DATES = { M: '20260824', T: '20260825', W: '20260826', R: '20260827', F: '20260828' }

const formatTime = (t) => {
  if (!t) return 'TBA'
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

const formatDays = (days) => {
  if (!days || days.length === 0) return 'TBA'
  return days
    .slice()
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
    .map(d => DAY_FULL[d] || d)
    .join(' / ')
}

// .ics generation
const toICSTime = (t) => {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`
}

const generateICS = (sections) => {
  let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Coursely//GSU//EN\r\nCALSCALE:GREGORIAN\r\n'

  sections.forEach(s => {
    const days = s.meeting_days || []
    if (!days.length || !s.start_time || !s.end_time) return

    const icsDays = days.map(d => DAY_TO_ICS[d]).filter(Boolean)
    if (!icsDays.length) return

    // DTSTART = first day in meeting pattern that falls at/after semester start
    const firstDay = days
      .filter(d => SEMESTER_DATES[d])
      .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))[0]
    if (!firstDay) return

    const dtDate  = SEMESTER_DATES[firstDay]
    const dtStart = toICSTime(s.start_time)
    const dtEnd   = toICSTime(s.end_time)
    if (!dtStart || !dtEnd) return

    ics += 'BEGIN:VEVENT\r\n'
    ics += `UID:coursely-${s.crn}@gsu.edu\r\n`
    ics += `DTSTART;TZID=America/New_York:${dtDate}T${dtStart}\r\n`
    ics += `DTEND;TZID=America/New_York:${dtDate}T${dtEnd}\r\n`
    ics += `RRULE:FREQ=WEEKLY;BYDAY=${icsDays.join(',')};UNTIL=${SEMESTER_END_ICS}\r\n`
    ics += `SUMMARY:${s.course_code} - ${s.title}\r\n`
    if (s.location) ics += `LOCATION:${s.location}\r\n`
    ics += `DESCRIPTION:Professor: ${s.professor || 'TBA'}\\nCRN: ${s.crn}\r\n`
    ics += 'END:VEVENT\r\n'
  })

  ics += 'END:VCALENDAR'
  return ics
}

const exportICS = (sections, rank) => {
  const blob = new Blob([generateICS(sections)], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `coursely-schedule-${rank}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

const saveSchedule = async (result) => {
  const crns = result.sections.map(s => s.crn)
  const res = await fetch('/api/saved-schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      label: `Fall 2026 — Score ${result.score}`,
      term:  'Fall Semester 2026',
      score: result.score,
      crns,
      rank: result.rank,
      professor_score: result.professor_score,
      compactness_score: result.compactness_score,
      slot_score: result.slot_score,
      sections: result.sections,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to save schedule')
  }
}

function ScoreBar({ label, value }) {
  if (value == null || Number.isNaN(value)) {
    return (
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">{label}</span>
          <span className="font-medium text-slate-600 tabular-nums">—</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden" />
      </div>
    )
  }
  const pct   = Math.round(value * 100)
  const color = pct >= 70 ? 'bg-green-500' : pct >= 45 ? 'bg-yellow-400' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-300 tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/**
 * @param {{ result: object, colorMap: object, mode?: 'optimizer' | 'saved', titleHint?: string }}
 */
export default function ScheduleCard({ result, colorMap, mode = 'optimizer', titleHint }) {
  const { rank, score, professor_score, compactness_score, slot_score, sections } = result
  const [view, setView]       = useState('list')
  const [saved, setSaved]     = useState(false)

  const scoreColor =
    score >= 75 ? 'text-green-400' : score >= 55 ? 'text-yellow-400' : 'text-red-400'

  const handleSave = async () => {
    try {
      await saveSchedule(result)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      alert(e.message)
    }
  }

  const headerLine = titleHint || `Schedule #${rank}`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25 }}
      className="bg-slate-800/60 rounded-xl border border-slate-700/60 p-6 shadow-lg
                 hover:border-slate-600/60 transition-colors"
    >
      {/* Header — preference-dependent sub-scores only on optimizer */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            {headerLine}
          </span>
          <div className={`text-4xl font-bold tabular-nums ${scoreColor}`}>
            {score}
            <span className="text-base font-normal text-slate-600">/100</span>
          </div>
        </div>
        {mode === 'optimizer' && (
          <div className="w-44 space-y-2 pt-1">
            <ScoreBar label="Professor"   value={professor_score} />
            <ScoreBar label="Compactness" value={compactness_score} />
            <ScoreBar label="Time Fit"    value={slot_score} />
          </div>
        )}
      </div>

      {/* View toggle + action buttons */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-1 bg-slate-900/60 rounded-lg p-1 w-fit">
          {['list', 'calendar'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition
                ${view === v
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-500 hover:text-slate-300'}`}
            >
              {v === 'list' ? 'List' : 'Calendar'}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {mode === 'optimizer' && (
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                        border transition font-medium
                        ${saved
                          ? 'border-green-500/50 text-green-400 bg-green-500/10'
                          : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
          >
            <svg className="w-3 h-3" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {saved ? 'Saved!' : 'Save'}
          </button>
          )}
          <button
            onClick={() => exportICS(sections, rank)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                       border border-slate-700 text-slate-400 hover:text-white
                       hover:border-slate-500 transition font-medium"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export .ics
          </button>
        </div>
      </div>

      {/* Content with animation */}
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {sections.map(s => {
              const color = colorMap?.[s.course_code]
              return (
                <div
                  key={s.crn}
                  className={`rounded-lg border px-4 py-3
                    ${color
                      ? `${color.bg} ${color.border} border-l-2`
                      : 'bg-slate-700/30 border-slate-700'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-mono text-sm font-bold ${color?.text || 'text-blue-400'}`}>
                          {s.course_code}
                        </span>
                        <span className="text-sm text-slate-300 truncate">{s.title}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        <span className="font-mono text-slate-400">CRN {s.crn}</span>
                        {' · '}
                        {formatDays(s.meeting_days)} · {formatTime(s.start_time)} – {formatTime(s.end_time)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {s.professor || 'Professor TBA'} · {s.location || 'Location TBA'}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {s.overall_rating != null ? (
                        <div className="text-xs">
                          <span className="font-semibold text-slate-200">{s.overall_rating}</span>
                          <span className="text-slate-500">/5</span>
                          <div className="text-slate-500">{s.difficulty} diff</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-700">No ratings</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <WeeklyCalendar sections={sections} colorMap={colorMap} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
