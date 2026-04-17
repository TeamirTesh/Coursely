const SLIDERS = [
  { key: 'professor',   label: 'Professor Rating',    desc: 'Based on RateMyProfessor scores' },
  { key: 'compactness', label: 'Schedule Compactness', desc: 'Minimize gaps between classes' },
  { key: 'slot',        label: 'Time Preference',      desc: 'Based on your preference grid' },
]

export default function WeightSliders({
  weights,
  setWeights,
  preferredCompactness,
  setPreferredCompactness,
}) {
  const adjust = (changedKey, newVal) => {
    newVal = Math.max(0, Math.min(1, newVal))
    const others = SLIDERS.map(s => s.key).filter(k => k !== changedKey)
    const othersSum = others.reduce((s, k) => s + weights[k], 0)
    const remaining = 1 - newVal
    const next = { ...weights, [changedKey]: newVal }

    if (othersSum > 0) {
      others.forEach(k => { next[k] = (weights[k] / othersSum) * remaining })
    } else {
      others.forEach(k => { next[k] = remaining / others.length })
    }

    const rounded = {}
    let runningSum = 0
    SLIDERS.forEach(({ key }, i) => {
      if (i < SLIDERS.length - 1) {
        rounded[key] = Math.round(next[key] * 100) / 100
        runningSum += rounded[key]
      } else {
        rounded[key] = Math.round((1 - runningSum) * 100) / 100
      }
    })
    setWeights(rounded)
  }

  return (
    <div className="space-y-5">
      {SLIDERS.map(({ key, label, desc }) => (
        <div key={key}>
          <div className="flex justify-between items-baseline mb-1.5">
            <div>
              <span className="text-sm font-medium text-slate-200">{label}</span>
              <span className="text-xs text-slate-500 ml-2 hidden sm:inline">{desc}</span>
            </div>
            <span className="text-sm font-semibold text-blue-400 tabular-nums">
              {Math.round(weights[key] * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(weights[key] * 100)}
            onChange={e => adjust(key, e.target.value / 100)}
            className="w-full accent-blue-500"
          />
        </div>
      ))}

      <div className="border-t border-slate-700 pt-5">
        <div className="flex justify-between items-baseline mb-1.5">
          <div>
            <span className="text-sm font-medium text-slate-200">Preferred Compactness</span>
            <span className="text-xs text-slate-500 ml-2 hidden sm:inline">How tightly packed your day should be</span>
          </div>
          <span className="text-sm font-semibold text-blue-400 tabular-nums">
            {Math.round(preferredCompactness * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(preferredCompactness * 100)}
          onChange={e => setPreferredCompactness(e.target.value / 100)}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>Spread out</span>
          <span>Back-to-back</span>
        </div>
      </div>
    </div>
  )
}
