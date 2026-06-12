const SLIDERS = [
  { key: 'professor',   label: 'Professor Quality',    desc: 'How good are the professors teaching these sections?' },
  { key: 'compactness', label: 'Schedule Compactness', desc: 'How close together are your classes each day?' },
  { key: 'slot',        label: 'Time-of-Day Fit',      desc: 'How well do class times match your availability grid?' },
]

export function effectivePct(weights, key) {
  const sum = SLIDERS.reduce((s, { key: k }) => s + weights[k], 0)
  if (sum === 0) return 33
  return Math.round((weights[key] / sum) * 100)
}

const LABEL = { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 500, color: 'rgba(238,237,232,0.3)' }

export default function WeightSliders({ weights, setWeights, preferredCompactness, setPreferredCompactness }) {
  return (
    <div className="space-y-6">
      <div className="pb-6" style={{ borderBottom: '1px solid rgba(238,237,232,0.08)' }}>
        <p style={LABEL} className="mb-4">Schedule Shape</p>
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-sm font-medium" style={{ color: '#eeede8' }}>Preferred Compactness</span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: '#eeede8' }}>
            {Math.round(preferredCompactness * 100)}%
          </span>
        </div>
        <p className="text-xs mb-3" style={{ color: 'rgba(238,237,232,0.4)' }}>
          Do you want classes spread across the day, or stacked back-to-back for long free blocks?
        </p>
        <input type="range" min="0" max="100"
          value={Math.round(preferredCompactness * 100)}
          onChange={e => setPreferredCompactness(e.target.value / 100)}
          className="w-full accent-stone-200"
        />
        <div className="flex justify-between text-xs mt-1.5" style={{ color: 'rgba(238,237,232,0.25)' }}>
          <span>Spread out</span>
          <span>Back-to-back</span>
        </div>
      </div>

      <div>
        <p style={LABEL} className="mb-1">How important is each factor?</p>
        <p className="text-xs mb-5" style={{ color: 'rgba(238,237,232,0.4)' }}>
          Slide higher to prioritize it more. Percentages reflect each factor's <em>relative</em> share of the final score.
        </p>
        <div className="space-y-5">
          {SLIDERS.map(({ key, label, desc }) => {
            const pct = effectivePct(weights, key)
            return (
              <div key={key}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-sm font-medium" style={{ color: '#eeede8' }}>{label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold tabular-nums" style={{ color: '#eeede8' }}>{pct}%</span>
                    <span className="text-xs" style={{ color: 'rgba(238,237,232,0.25)' }}>of score</span>
                  </div>
                </div>
                <p className="text-xs mb-2" style={{ color: 'rgba(238,237,232,0.35)' }}>{desc}</p>
                <input type="range" min="0" max="100"
                  value={weights[key]}
                  onChange={e => setWeights(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-full accent-stone-200"
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
