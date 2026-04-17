import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import ScheduleCard from '../components/ScheduleCard'
import { buildColorMapFromSections } from '../utils/courseColors'

function toScheduleResult(row) {
  return {
    rank: row.rank_snapshot ?? 1,
    score: row.score,
    professor_score: row.professor_score,
    compactness_score: row.compactness_score,
    slot_score: row.slot_score,
    sections: row.sections || [],
  }
}

export default function Saved() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/saved-schedules')
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to load saved schedules')
      setItems(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const startEdit = (row) => {
    setEditingId(row.id)
    setEditValue(row.label)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const saveLabel = async (id) => {
    const label = editValue.trim()
    if (!label) {
      cancelEdit()
      return
    }
    try {
      const res = await fetch(`/api/saved-schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Could not rename')
      setItems(prev =>
        prev.map(s => (s.id === id ? { ...s, label: data.label ?? label } : s)),
      )
    } catch (e) {
      alert(e.message)
    } finally {
      cancelEdit()
    }
  }

  const remove = (id) => {
    if (!window.confirm('Delete this saved schedule?')) return
    ;(async () => {
      try {
        const res = await fetch(`/api/saved-schedules/${id}`, { method: 'DELETE' })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.detail || 'Delete failed')
        }
        setItems(prev => prev.filter(s => s.id !== id))
      } catch (e) {
        alert(e.message)
      }
    })()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-[#0f172a] text-white"
    >
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Saved schedules</h1>
          <p className="text-sm text-slate-500 mt-1">
            Same detail as the optimizer: scores, list/calendar, and export. Click the title to rename.
          </p>
        </div>

        {loading && (
          <p className="text-slate-500 text-sm">Loading…</p>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-12 text-center">
            <p className="text-slate-400 mb-2">No saved schedules yet.</p>
            <p className="text-sm text-slate-600">
              Generate schedules in the optimizer and press <span className="text-slate-400">Save</span> on a result card.
            </p>
          </div>
        )}

        <div className="space-y-8">
          {items.map(row => {
            const result = toScheduleResult(row)
            const colorMap = buildColorMapFromSections(result.sections)
            const rankHint =
              row.rank_snapshot != null
                ? `Schedule #${row.rank_snapshot}`
                : 'Saved schedule'

            return (
              <motion.div key={row.id} layout className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                  <div className="min-w-0 flex-1">
                    {editingId === row.id ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => saveLabel(row.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') e.currentTarget.blur()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        className="w-full max-w-lg bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(row)}
                        className="text-left text-base font-semibold text-white hover:text-blue-300 transition cursor-text truncate block max-w-xl"
                        title="Click to rename"
                      >
                        {row.label}
                      </button>
                    )}
                    <div className="text-xs text-slate-500 mt-0.5">{row.term}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(row.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition shrink-0"
                  >
                    Delete
                  </button>
                </div>

                {result.sections.length === 0 ? (
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 text-sm text-slate-500">
                    No section details found for CRNs: {(row.crns || []).join(', ') || '—'}.
                  </div>
                ) : (
                  <ScheduleCard
                    result={result}
                    colorMap={colorMap}
                    mode="saved"
                    titleHint={rankHint}
                  />
                )}
              </motion.div>
            )
          })}
        </div>
      </main>
    </motion.div>
  )
}
