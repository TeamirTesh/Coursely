import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'

function fillTone(pct) {
  if (pct == null || Number.isNaN(pct)) return 'bg-slate-700/50 text-slate-400'
  if (pct < 50) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (pct <= 80) return 'bg-amber-500/15 text-amber-200 border-amber-500/30'
  return 'bg-red-500/15 text-red-300 border-red-500/40'
}

export default function Analytics() {
  const [comparison, setComparison] = useState([])
  const [fillRates, setFillRates] = useState([])
  const [profRatings, setProfRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const parse = async (res) => {
        const data = await res.json()
        if (!res.ok) {
          const d = data?.detail
          throw new Error(typeof d === 'string' ? d : res.statusText || 'Request failed')
        }
        return data
      }
      const [c, f, p] = await Promise.all([
        parse(await fetch('/api/analytics/schedule-comparison')),
        parse(await fetch('/api/analytics/fill-rates')),
        parse(await fetch('/api/analytics/professor-ratings')),
      ])
      setComparison(Array.isArray(c) ? c : [])
      setFillRates(Array.isArray(f) ? f : [])
      setProfRatings(Array.isArray(p) ? p : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-[#0f172a] text-white"
    >
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Aggregates from your database.</p>
        </div>

        {loading && <p className="text-slate-500 text-sm">Loading…</p>}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* 1. Saved schedule comparison */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-200">Your saved schedules</h2>
              <p className="text-xs text-slate-500">Ranked by overall score. Includes average professor score (0–100).</p>
              <div className="overflow-x-auto rounded-xl border border-slate-700/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/80 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 font-medium">Label</th>
                      <th className="px-4 py-3 font-medium">Term</th>
                      <th className="px-4 py-3 font-medium">Courses</th>
                      <th className="px-4 py-3 font-medium tabular-nums">Avg prof.</th>
                      <th className="px-4 py-3 font-medium tabular-nums">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {comparison.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No saved schedules yet. Save one from the optimizer to compare here.
                        </td>
                      </tr>
                    ) : (
                      comparison.map(row => (
                        <tr key={row.id} className="bg-slate-800/40 hover:bg-slate-800/70">
                          <td className="px-4 py-3 text-slate-200 font-medium">{row.label}</td>
                          <td className="px-4 py-3 text-slate-400">{row.term}</td>
                          <td className="px-4 py-3 text-slate-300 max-w-xs">
                            {(row.courses || []).join(', ') || '—'}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-slate-300">
                            {row.avg_professor_score != null ? row.avg_professor_score : '—'}
                          </td>
                          <td className="px-4 py-3 tabular-nums font-semibold text-blue-400">
                            {row.score != null ? row.score : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 2. CS fill rates */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-200">CS course fill rates</h2>
              <p className="text-xs text-slate-500">
                CSC courses only. Green &lt;50%, yellow 50–80%, red &gt;80%.
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-700/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/80 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 font-medium">Course</th>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium tabular-nums">Fill %</th>
                      <th className="px-4 py-3 font-medium tabular-nums">Sections</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {fillRates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No CSC sections found in the database.
                        </td>
                      </tr>
                    ) : (
                      fillRates.map(row => {
                        const hot = row.fill_rate_pct > 80
                        return (
                          <tr key={row.course_code} className="bg-slate-800/40 hover:bg-slate-800/70">
                            <td className="px-4 py-3 font-mono text-blue-300">{row.course_code}</td>
                            <td className="px-4 py-3 text-slate-300 max-w-md">{row.title}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center rounded-lg border px-2.5 py-1 tabular-nums text-xs font-medium ${fillTone(row.fill_rate_pct)}`}
                              >
                                {row.fill_rate_pct}%
                              </span>
                            </td>
                            <td className="px-4 py-3 tabular-nums text-slate-400">{row.num_sections}</td>
                            <td className="px-4 py-3">
                              {hot && (
                                <span className="text-[10px] uppercase tracking-wide font-semibold bg-red-500/20 text-red-300 border border-red-500/40 rounded px-2 py-0.5">
                                  Register early
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. Professor ratings by department */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-200">Professor ratings by department</h2>
              <p className="text-xs text-slate-500">Departments with at least three rated professors (RateMyProfessor).</p>
              <div className="overflow-x-auto rounded-xl border border-slate-700/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/80 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 font-medium">Department</th>
                      <th className="px-4 py-3 font-medium tabular-nums">Avg rating</th>
                      <th className="px-4 py-3 font-medium tabular-nums">Avg difficulty</th>
                      <th className="px-4 py-3 font-medium tabular-nums">Professors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {profRatings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          Not enough department data yet. Run the RMP scraper after professors have ratings.
                        </td>
                      </tr>
                    ) : (
                      profRatings.map(row => (
                        <tr key={row.department} className="bg-slate-800/40 hover:bg-slate-800/70">
                          <td className="px-4 py-3 text-slate-200">{row.department}</td>
                          <td className="px-4 py-3 tabular-nums text-emerald-300">{row.avg_rating}</td>
                          <td className="px-4 py-3 tabular-nums text-slate-400">{row.avg_difficulty}</td>
                          <td className="px-4 py-3 tabular-nums text-slate-400">{row.num_professors}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </motion.div>
  )
}
