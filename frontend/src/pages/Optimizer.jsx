import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

import CourseInput     from '../components/CourseInput'
import PreferenceGrid  from '../components/PreferenceGrid'
import WeightSliders   from '../components/WeightSliders'
import ScheduleCard    from '../components/ScheduleCard'
import Navbar          from '../components/Navbar'
import { buildColorMap } from '../utils/courseColors'
import {
  GRID_DAYS,
  SLOT_KEYS,
  GRID_TO_API_DAY,
  slotKeyToTimeLabel,
  mergeTimeRowsIntoGrid,
  COLOR_TO_PREF,
} from '../utils/timePreferences'

const CELL_VALUES     = { green: 1.0, yellow: 0.5, red: 0.0 }
const DEFAULT_WEIGHTS = { professor: 100, compactness: 100, slot: 100 }
const DEFAULT_PREF_COMPACT = 0.5

function normalizeWeights(raw) {
  const sum = raw.professor + raw.compactness + raw.slot
  if (sum === 0) return { professor: 1 / 3, compactness: 1 / 3, slot: 1 / 3 }
  return { professor: raw.professor / sum, compactness: raw.compactness / sum, slot: raw.slot / sum }
}

async function putTimePreference(day, slotKey, preference) {
  const res = await fetch('/api/preferences/time', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day: GRID_TO_API_DAY[day], time_slot: slotKeyToTimeLabel(slotKey), preference }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Failed to save') }
}

async function putWeightsBody(body) {
  const res = await fetch('/api/preferences/weights', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Failed to save') }
}

export default function Optimizer() {
  const [courses,             setCourses]             = useState([])
  const [grid,                setGrid]                = useState({})
  const [weights,             setWeights]             = useState(DEFAULT_WEIGHTS)
  const [preferredCompactness,setPreferredCompactness]= useState(DEFAULT_PREF_COMPACT)
  const [results,             setResults]             = useState(null)
  const [fallback,            setFallback]            = useState(false)
  const [loading,             setLoading]             = useState(false)
  const [error,               setError]               = useState(null)
  const [showCount,           setShowCount]           = useState(3)
  const [prefsLoaded,         setPrefsLoaded]         = useState(false)
  const skipNextWeightPut = useRef(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      skipNextWeightPut.current = true
      try {
        const [tRes, wRes] = await Promise.all([fetch('/api/preferences/time'), fetch('/api/preferences/weights')])
        if (cancelled) return
        const timeRows = tRes.ok ? await tRes.json() : []
        if (Array.isArray(timeRows) && timeRows.length > 0) setGrid(mergeTimeRowsIntoGrid(timeRows))
        else setGrid({})
        if (wRes.ok) {
          const w = await wRes.json()
          if (!cancelled) {
            setWeights({ professor: w.professor_rating_weight, compactness: w.compactness_weight, slot: w.time_preference_weight })
            setPreferredCompactness(w.preferred_compactness / 100)
          }
        } else { setWeights(DEFAULT_WEIGHTS); setPreferredCompactness(DEFAULT_PREF_COMPACT) }
      } catch { if (!cancelled) { setGrid({}); setWeights(DEFAULT_WEIGHTS); setPreferredCompactness(DEFAULT_PREF_COMPACT) } }
      finally  { if (!cancelled) setPrefsLoaded(true) }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!prefsLoaded) return
    const id = setTimeout(() => {
      if (skipNextWeightPut.current) { skipNextWeightPut.current = false; return }
      const norm = normalizeWeights(weights)
      const pr = Math.round(norm.professor * 100)
      const cw = Math.round(norm.compactness * 100)
      const tw = 100 - pr - cw
      putWeightsBody({ professor_rating_weight: pr, compactness_weight: cw, time_preference_weight: tw, preferred_compactness: Math.round(preferredCompactness * 100) }).catch(console.error)
    }, 500)
    return () => clearTimeout(id)
  }, [weights, preferredCompactness, prefsLoaded])

  const handleCellPersist   = (day, slotKey, preference) => putTimePreference(day, slotKey, preference).catch(console.error)
  const persistAllZeros     = () => Promise.all(GRID_DAYS.flatMap(d => SLOT_KEYS.map(s => putTimePreference(d, s, 0)))).catch(console.error)
  const persistGridSnapshot = (g) => Promise.all(GRID_DAYS.flatMap(d => SLOT_KEYS.map(s => putTimePreference(d, s, COLOR_TO_PREF[g[d]?.[s] ?? 'red'])))).catch(console.error)

  const buildApiGrid = () => {
    const apiGrid = {}
    for (const day of GRID_DAYS) {
      apiGrid[day] = {}
      for (const slot of SLOT_KEYS) apiGrid[day][slot] = CELL_VALUES[grid[day]?.[slot] ?? 'red']
    }
    return apiGrid
  }

  const generate = async () => {
    setLoading(true); setError(null); setResults(null); setFallback(false)
    try {
      const res = await fetch('/api/schedules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses, semester: 'Fall Semester 2026', grid: buildApiGrid(), weights: normalizeWeights(weights), preferred_compactness: preferredCompactness, max_results: 8 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to generate schedules')
      setResults(data.schedules); setFallback(data.fallback); setShowCount(3)
    } catch (e) { setError(e.message) }
    finally     { setLoading(false) }
  }

  const colorMap = buildColorMap(courses)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen"
      style={{ background: '#0f0e0c', color: '#eeede8' }}
    >
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-4">
        <div className="mb-10" style={{ borderBottom: '1px solid rgba(238,237,232,0.08)', paddingBottom: 32 }}>
          <p className="text-xs font-medium mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(238,237,232,0.3)' }}>
            Georgia State University · Fall 2026
          </p>
          <h1 className="text-3xl font-medium" style={{ fontFamily: '"Instrument Serif", serif', letterSpacing: '-0.01em', color: '#eeede8' }}>
            Schedule Optimizer
          </h1>
          <p className="text-sm mt-2" style={{ color: 'rgba(238,237,232,0.45)' }}>
            Add courses, set preferences, generate ranked schedules.
          </p>
        </div>

        <Panel label="Courses" hint="Search by course code or title, e.g. CSC 1301, MATH 2211">
          <CourseInput courses={courses} setCourses={setCourses} />
        </Panel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel label="Time Preferences" hint="Click or drag to paint your availability. Green = prefer · Yellow = okay · empty = avoid">
            <PreferenceGrid grid={grid} setGrid={setGrid} onCellPersist={handleCellPersist} onPersistAllZeros={persistAllZeros} onPersistGridSnapshot={persistGridSnapshot} />
          </Panel>
          <Panel label="Preferences & Weights">
            <WeightSliders weights={weights} setWeights={setWeights} preferredCompactness={preferredCompactness} setPreferredCompactness={setPreferredCompactness} />
          </Panel>
        </div>

        <button
          onClick={generate}
          disabled={loading || courses.length === 0}
          className="w-full py-4 font-medium text-base transition-colors"
          style={{
            background: courses.length === 0 || loading ? 'rgba(238,237,232,0.06)' : '#eeede8',
            color:      courses.length === 0 || loading ? 'rgba(238,237,232,0.25)' : '#0f0e0c',
            cursor:     courses.length === 0 || loading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (!loading && courses.length > 0) e.currentTarget.style.background = '#d4d3ce' }}
          onMouseLeave={e => { if (!loading && courses.length > 0) e.currentTarget.style.background = '#eeede8' }}
        >
          {loading ? 'Generating…' : 'Generate Schedules'}
        </button>

        {error && (
          <div className="px-5 py-4 text-sm" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {results && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4 pt-4">
            <div style={{ borderTop: '1px solid rgba(238,237,232,0.08)', paddingTop: 24 }}>
              <p className="text-xs font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(238,237,232,0.3)' }}>
                {results.length} schedule{results.length !== 1 ? 's' : ''} found
              </p>
            </div>
            {fallback && (
              <div className="px-5 py-4 text-sm" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', color: '#fde047' }}>
                No schedules fit your avoid constraints. Showing closest matches with reduced scores.
              </div>
            )}
            {results.slice(0, showCount).map(r => (
              <ScheduleCard key={r.rank} result={r} colorMap={colorMap} />
            ))}
            {showCount < results.length && (
              <button
                onClick={() => setShowCount(Math.min(showCount + 3, 8))}
                className="w-full py-3 text-sm transition-colors"
                style={{ border: '1px solid rgba(238,237,232,0.1)', color: 'rgba(238,237,232,0.4)', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(238,237,232,0.04)'; e.currentTarget.style.color = '#eeede8' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(238,237,232,0.4)' }}
              >
                Show more ({results.length - showCount} remaining)
              </button>
            )}
          </motion.section>
        )}
      </main>
    </motion.div>
  )
}

function Panel({ label, hint, children }) {
  return (
    <div style={{ background: '#161614', border: '1px solid rgba(238,237,232,0.08)' }} className="p-6">
      <div className="mb-5">
        <h2 className="text-xs font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(238,237,232,0.35)' }}>
          {label}
        </h2>
        {hint && <p className="text-xs mt-1" style={{ color: 'rgba(238,237,232,0.28)' }}>{hint}</p>}
      </div>
      {children}
    </div>
  )
}
