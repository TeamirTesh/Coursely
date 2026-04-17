import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

import CourseInput from '../components/CourseInput'
import PreferenceGrid from '../components/PreferenceGrid'
import WeightSliders from '../components/WeightSliders'
import ScheduleCard from '../components/ScheduleCard'
import Navbar from '../components/Navbar'
import { buildColorMap } from '../utils/courseColors'
import {
  GRID_DAYS,
  SLOT_KEYS,
  GRID_TO_API_DAY,
  slotKeyToTimeLabel,
  mergeTimeRowsIntoGrid,
  COLOR_TO_PREF,
} from '../utils/timePreferences'

const CELL_VALUES = { green: 1.0, yellow: 0.5, red: 0.0 }

const DEFAULT_WEIGHTS = { professor: 0.40, compactness: 0.30, slot: 0.30 }
const DEFAULT_PREF_COMPACT = 0.5

async function putTimePreference(day, slotKey, preference) {
  const res = await fetch('/api/preferences/time', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      day: GRID_TO_API_DAY[day],
      time_slot: slotKeyToTimeLabel(slotKey),
      preference,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to save time preference')
  }
}

async function putWeightsBody(body) {
  const res = await fetch('/api/preferences/weights', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to save weights')
  }
}

export default function Optimizer() {
  const [courses, setCourses] = useState([])
  const [grid, setGrid] = useState({})
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS)
  const [preferredCompactness, setPreferredCompactness] = useState(DEFAULT_PREF_COMPACT)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showCount, setShowCount] = useState(3)

  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const skipNextWeightPut = useRef(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      skipNextWeightPut.current = true
      try {
        const [tRes, wRes] = await Promise.all([
          fetch('/api/preferences/time'),
          fetch('/api/preferences/weights'),
        ])

        if (cancelled) return

        const timeRows = tRes.ok ? await tRes.json() : []
        if (Array.isArray(timeRows) && timeRows.length > 0) {
          setGrid(mergeTimeRowsIntoGrid(timeRows))
        } else {
          setGrid({})
        }

        if (wRes.ok) {
          const w = await wRes.json()
          if (!cancelled) {
            setWeights({
              professor: w.professor_rating_weight / 100,
              compactness: w.compactness_weight / 100,
              slot: w.time_preference_weight / 100,
            })
            setPreferredCompactness(w.preferred_compactness / 100)
          }
        } else {
          setWeights(DEFAULT_WEIGHTS)
          setPreferredCompactness(DEFAULT_PREF_COMPACT)
        }
      } catch {
        if (!cancelled) {
          setGrid({})
          setWeights(DEFAULT_WEIGHTS)
          setPreferredCompactness(DEFAULT_PREF_COMPACT)
        }
      } finally {
        if (!cancelled) setPrefsLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!prefsLoaded) return
    const id = setTimeout(() => {
      if (skipNextWeightPut.current) {
        skipNextWeightPut.current = false
        return
      }
      const pr = Math.round(weights.professor * 100)
      const cw = Math.round(weights.compactness * 100)
      const tw = 100 - pr - cw
      if (tw < 0 || tw > 100) return
      putWeightsBody({
        professor_rating_weight: pr,
        compactness_weight: cw,
        time_preference_weight: tw,
        preferred_compactness: Math.round(preferredCompactness * 100),
      }).catch(e => console.error(e))
    }, 500)
    return () => clearTimeout(id)
  }, [weights, preferredCompactness, prefsLoaded])

  const handleCellPersist = (day, slotKey, preference) => {
    putTimePreference(day, slotKey, preference).catch(e => console.error(e))
  }

  const persistAllZeros = () => {
    Promise.all(
      GRID_DAYS.flatMap(d => SLOT_KEYS.map(s => putTimePreference(d, s, 0))),
    ).catch(e => console.error(e))
  }

  const persistGridSnapshot = (g) => {
    Promise.all(
      GRID_DAYS.flatMap(d =>
        SLOT_KEYS.map(s => {
          const col = g[d]?.[s] ?? 'red'
          return putTimePreference(d, s, COLOR_TO_PREF[col])
        }),
      ),
    ).catch(e => console.error(e))
  }

  /** Full 5×28 slots so missing cells count as avoid (red / 0.0) for the scheduler. */
  const buildApiGrid = () => {
    const apiGrid = {}
    for (const day of GRID_DAYS) {
      apiGrid[day] = {}
      for (const slot of SLOT_KEYS) {
        const color = grid[day]?.[slot] ?? 'red'
        apiGrid[day][slot] = CELL_VALUES[color]
      }
    }
    return apiGrid
  }

  const generate = async () => {
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const res = await fetch('/api/schedules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courses,
          semester: 'Fall Semester 2026',
          grid: buildApiGrid(),
          weights,
          preferred_compactness: preferredCompactness,
          max_results: 8,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to generate schedules')
      setResults(data)
      setShowCount(3)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const colorMap = buildColorMap(courses)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-[#0f172a] text-white"
    >
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        <section className="bg-slate-800/60 rounded-xl border border-slate-700/60 p-6">
          <h2 className="text-base font-semibold text-slate-200 mb-4">Courses</h2>
          <CourseInput courses={courses} setCourses={setCourses} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="bg-slate-800/60 rounded-xl border border-slate-700/60 p-6">
            <h2 className="text-base font-semibold text-slate-200 mb-1">Time Preferences</h2>
            <p className="text-xs text-slate-500 mb-4">
              Click cells: green = prefer · yellow = okay · red = avoid. Preferences save automatically.
            </p>
            <PreferenceGrid
              grid={grid}
              setGrid={setGrid}
              onCellPersist={handleCellPersist}
              onPersistAllZeros={persistAllZeros}
              onPersistGridSnapshot={persistGridSnapshot}
            />
          </section>

          <section className="bg-slate-800/60 rounded-xl border border-slate-700/60 p-6">
            <h2 className="text-base font-semibold text-slate-200 mb-4">Schedule Weights</h2>
            <WeightSliders
              weights={weights}
              setWeights={setWeights}
              preferredCompactness={preferredCompactness}
              setPreferredCompactness={setPreferredCompactness}
            />
          </section>
        </div>

        <button
          onClick={generate}
          disabled={loading || courses.length === 0}
          className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white
                     font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed
                     transition shadow-lg shadow-blue-500/20"
        >
          {loading ? 'Generating...' : 'Generate Schedules'}
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400
                          rounded-xl px-5 py-4 text-sm">
            {error}
          </div>
        )}

        {results && (
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-slate-300">
              {results.length} schedule{results.length !== 1 ? 's' : ''} found
            </h2>
            {results.slice(0, showCount).map(r => (
              <ScheduleCard key={r.rank} result={r} colorMap={colorMap} />
            ))}
            {showCount < results.length && (
              <button
                onClick={() => setShowCount(Math.min(showCount + 3, 8))}
                className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-400
                           hover:bg-slate-800 text-sm font-medium transition"
              >
                Show more ({results.length - showCount} remaining)
              </button>
            )}
          </section>
        )}
      </main>
    </motion.div>
  )
}
