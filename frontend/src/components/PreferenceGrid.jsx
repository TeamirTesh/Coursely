import { useCallback, useEffect, useRef, useState } from 'react'
import { GRID_DAYS, SLOT_KEYS, slotKeyToTimeLabel, COLOR_TO_PREF } from '../utils/timePreferences'

const DAY_LABELS = { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri' }
const CYCLE      = { red: 'green', green: 'yellow', yellow: 'red' }

const CELL_STYLE = {
  green:  { background: 'rgba(74,222,128,0.18)',  border: '1px solid rgba(74,222,128,0.35)'  },
  yellow: { background: 'rgba(251,191,36,0.18)',  border: '1px solid rgba(251,191,36,0.35)'  },
  red:    { background: 'rgba(238,237,232,0.04)', border: '1px solid transparent'             },
}

const CELL_HOVER = {
  green:  { background: 'rgba(74,222,128,0.3)',   border: '1px solid rgba(74,222,128,0.55)'  },
  yellow: { background: 'rgba(251,191,36,0.3)',   border: '1px solid rgba(251,191,36,0.55)'  },
  red:    { background: 'rgba(238,237,232,0.1)',  border: '1px solid rgba(238,237,232,0.18)' },
}

function getCell(grid, day, slot) { return grid[day]?.[slot] ?? 'red' }

function buildFullRedGrid() {
  const g = {}
  for (const day of GRID_DAYS) { g[day] = {}; for (const slot of SLOT_KEYS) g[day][slot] = 'red' }
  return g
}

function rectBounds(a, b) {
  return {
    minDay:  Math.min(a.dayIdx,  b.dayIdx),
    maxDay:  Math.max(a.dayIdx,  b.dayIdx),
    minSlot: Math.min(a.slotIdx, b.slotIdx),
    maxSlot: Math.max(a.slotIdx, b.slotIdx),
  }
}

function inRect(bounds, dayIdx, slotIdx) {
  if (!bounds) return false
  return dayIdx  >= bounds.minDay  && dayIdx  <= bounds.maxDay &&
         slotIdx >= bounds.minSlot && slotIdx <= bounds.maxSlot
}

export default function PreferenceGrid({ grid, setGrid, onCellPersist, onPersistAllZeros, onPersistGridSnapshot }) {
  const [blockSnapshot, setBlockSnapshot] = useState(null)
  const [hoveredCell,   setHoveredCell]   = useState(null)
  const [dragBounds,    setDragBounds]    = useState(null)

  // Refs so the mouseup handler (registered once) always sees current values
  const dragStartRef = useRef(null)
  const dragEndRef   = useRef(null)
  const dragColorRef = useRef(null)

  const applyRect = useCallback((start, end, color) => {
    const { minDay, maxDay, minSlot, maxSlot } = rectBounds(start, end)
    setGrid(prev => {
      const next = { ...prev }
      for (let di = minDay; di <= maxDay; di++) {
        const day     = GRID_DAYS[di]
        const dayGrid = { ...(next[day] || {}) }
        for (let si = minSlot; si <= maxSlot; si++) {
          const slot = SLOT_KEYS[si]
          if (color === 'red') delete dayGrid[slot]
          else dayGrid[slot] = color
        }
        if (Object.keys(dayGrid).length === 0) {
          const { [day]: _, ...rest } = next
          Object.assign(next, rest)
          delete next[day]
        } else {
          next[day] = dayGrid
        }
      }
      return next
    })
    for (let di = minDay; di <= maxDay; di++)
      for (let si = minSlot; si <= maxSlot; si++)
        onCellPersist?.(GRID_DAYS[di], SLOT_KEYS[si], COLOR_TO_PREF[color])
  }, [setGrid, onCellPersist])

  useEffect(() => {
    const stop = () => {
      if (dragStartRef.current !== null && dragColorRef.current !== null) {
        const end = dragEndRef.current ?? dragStartRef.current
        applyRect(dragStartRef.current, end, dragColorRef.current)
      }
      dragStartRef.current = null
      dragEndRef.current   = null
      dragColorRef.current = null
      setDragBounds(null)
    }
    document.addEventListener('mouseup', stop)
    return () => document.removeEventListener('mouseup', stop)
  }, [applyRect])

  const toggleBlockAll = () => {
    if (blockSnapshot !== null) {
      const snap = blockSnapshot; setBlockSnapshot(null); setGrid(snap); onPersistGridSnapshot?.(snap); return
    }
    setBlockSnapshot(JSON.parse(JSON.stringify(grid)))
    setGrid(buildFullRedGrid())
    onPersistAllZeros?.()
  }

  const clearGrid = () => { setBlockSnapshot(null); setGrid({}); onPersistAllZeros?.() }

  return (
    <div>
      <div className="overflow-x-auto" style={{ userSelect: 'none' }}>
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="w-16 pr-2 text-right font-normal" />
              {GRID_DAYS.map(d => (
                <th key={d} className="text-center font-medium pb-2 px-1"
                  style={{ color: 'rgba(238,237,232,0.35)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {DAY_LABELS[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOT_KEYS.map((slot, slotIdx) => (
              <tr key={slot}>
                <td className="pr-2 text-right whitespace-nowrap leading-none py-px" style={{ color: 'rgba(238,237,232,0.2)', fontSize: 9 }}>
                  {slotIdx % 2 === 0 ? slotKeyToTimeLabel(slot) : ''}
                </td>
                {GRID_DAYS.map((d, dayIdx) => {
                  const color        = getCell(grid, d, slot)
                  const cellId       = `${d}-${slot}`
                  const previewing   = inRect(dragBounds, dayIdx, slotIdx)
                  const displayColor = previewing ? dragColorRef.current ?? color : color
                  const highlighted  = previewing || hoveredCell === cellId
                  return (
                    <td key={d} className="px-px py-px">
                      <div
                        className="w-9 h-3 cursor-pointer transition-all duration-75"
                        style={highlighted ? CELL_HOVER[displayColor] : CELL_STYLE[displayColor]}
                        onMouseDown={e => {
                          e.preventDefault()
                          const next = CYCLE[color]
                          dragColorRef.current = next
                          dragStartRef.current = { dayIdx, slotIdx }
                          dragEndRef.current   = { dayIdx, slotIdx }
                          setDragBounds(rectBounds({ dayIdx, slotIdx }, { dayIdx, slotIdx }))
                        }}
                        onMouseEnter={() => {
                          setHoveredCell(cellId)
                          if (dragStartRef.current !== null) {
                            dragEndRef.current = { dayIdx, slotIdx }
                            setDragBounds(rectBounds(dragStartRef.current, { dayIdx, slotIdx }))
                          }
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(238,237,232,0.35)' }}>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block" style={{ background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.4)' }} />
            Prefer
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block" style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)' }} />
            Okay
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block" style={{ background: 'rgba(238,237,232,0.06)', border: '1px solid rgba(238,237,232,0.12)' }} />
            Avoid
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button type="button" onClick={toggleBlockAll} className="text-xs px-3 py-1 transition-colors"
            style={blockSnapshot !== null
              ? { border: '1px solid rgba(248,113,113,0.4)', color: '#fca5a5', background: 'rgba(248,113,113,0.08)' }
              : { border: '1px solid rgba(238,237,232,0.15)', color: 'rgba(238,237,232,0.45)', background: 'transparent' }
            }
            onMouseEnter={e => { if (blockSnapshot === null) { e.currentTarget.style.color = '#eeede8'; e.currentTarget.style.borderColor = 'rgba(238,237,232,0.3)' } }}
            onMouseLeave={e => { if (blockSnapshot === null) { e.currentTarget.style.color = 'rgba(238,237,232,0.45)'; e.currentTarget.style.borderColor = 'rgba(238,237,232,0.15)' } }}
          >
            {blockSnapshot !== null ? 'Undo Block All' : 'Block All'}
          </button>
          <button type="button" onClick={clearGrid} className="text-xs transition-colors"
            style={{ color: 'rgba(238,237,232,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#eeede8')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(238,237,232,0.3)')}>
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
