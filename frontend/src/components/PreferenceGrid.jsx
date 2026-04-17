import { useState } from 'react'
import {
  GRID_DAYS,
  SLOT_KEYS,
  slotKeyToTimeLabel,
  COLOR_TO_PREF,
} from '../utils/timePreferences'

const DAY_LABELS = { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri' }

const format12h = (slot) => slotKeyToTimeLabel(slot)

/** red → green → yellow → red */
const CYCLE = { red: 'green', green: 'yellow', yellow: 'red' }

const CELL_CLASS = {
  green:  'bg-green-500/70 hover:bg-green-400/80',
  yellow: 'bg-yellow-400/70 hover:bg-yellow-300/80',
  red:    'bg-red-500/70 hover:bg-red-400/80',
}

function getCell(grid, day, slot) {
  return grid[day]?.[slot] ?? 'red'
}

function buildFullRedGrid() {
  const g = {}
  for (const day of GRID_DAYS) {
    g[day] = {}
    for (const slot of SLOT_KEYS) {
      g[day][slot] = 'red'
    }
  }
  return g
}

/**
 * @param {object} props
 * @param {object} props.grid
 * @param {function} props.setGrid
 * @param {function} [props.onCellPersist] (gridDay, slotKey, preference 0|1|2)
 * @param {function} [props.onPersistAllZeros]
 * @param {function} [props.onPersistGridSnapshot] (sparse grid)
 */
export default function PreferenceGrid({
  grid,
  setGrid,
  onCellPersist,
  onPersistAllZeros,
  onPersistGridSnapshot,
}) {
  const [blockSnapshot, setBlockSnapshot] = useState(null)

  const cycleCell = (day, slot) => {
    const current = getCell(grid, day, slot)
    const next = CYCLE[current]
    setGrid(prev => {
      const dayGrid = { ...(prev[day] || {}) }
      if (next === 'red') {
        delete dayGrid[slot]
      } else {
        dayGrid[slot] = next
      }
      if (Object.keys(dayGrid).length === 0) {
        const { [day]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [day]: dayGrid }
    })
    onCellPersist?.(day, slot, COLOR_TO_PREF[next])
  }

  const toggleBlockAll = () => {
    if (blockSnapshot !== null) {
      const snap = blockSnapshot
      setBlockSnapshot(null)
      setGrid(snap)
      onPersistGridSnapshot?.(snap)
      return
    }
    setBlockSnapshot(JSON.parse(JSON.stringify(grid)))
    setGrid(buildFullRedGrid())
    onPersistAllZeros?.()
  }

  const clearGrid = () => {
    setBlockSnapshot(null)
    setGrid({})
    onPersistAllZeros?.()
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="w-16 pr-2 text-right text-slate-600 font-normal" />
              {GRID_DAYS.map(d => (
                <th key={d} className="text-center text-slate-400 font-semibold pb-1 px-1">
                  {DAY_LABELS[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOT_KEYS.map((slot, i) => (
              <tr key={slot}>
                <td className="pr-2 text-right text-slate-600 whitespace-nowrap leading-none py-px">
                  {i % 2 === 0 ? format12h(slot) : ''}
                </td>
                {GRID_DAYS.map(d => (
                  <td key={d} className="px-px py-px">
                    <div
                      className={`w-9 h-3 rounded-sm cursor-pointer transition-colors ${CELL_CLASS[getCell(grid, d, slot)]}`}
                      onClick={() => cycleCell(d, slot)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-500/70 inline-block" /> Prefer
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-yellow-400/70 inline-block" /> Okay
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-500/70 inline-block" /> Avoid
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleBlockAll}
            className={`text-xs px-2.5 py-1 rounded-md border transition font-medium
              ${blockSnapshot !== null
                ? 'border-red-500/50 text-red-400 bg-red-500/10 hover:bg-red-500/20'
                : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
          >
            {blockSnapshot !== null ? 'Undo Block All' : 'Block All'}
          </button>
          <button
            type="button"
            onClick={clearGrid}
            className="text-xs text-slate-600 hover:text-slate-400 transition"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
