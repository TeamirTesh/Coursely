import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'

const MOCK = {
  M: [
    { code: 'CSC 1301', start: 660, end: 735, color: '#3b82f6' },
    { code: 'ENGL 1101', start: 840, end: 890, color: '#8b5cf6' },
  ],
  T: [
    { code: 'MATH 2211', start: 570, end: 645, color: '#10b981' },
  ],
  W: [
    { code: 'CSC 1301', start: 660, end: 735, color: '#3b82f6' },
    { code: 'ENGL 1101', start: 840, end: 890, color: '#8b5cf6' },
  ],
  R: [
    { code: 'MATH 2211', start: 570, end: 645, color: '#10b981' },
    { code: 'CSC 2720', start: 855, end: 930, color: '#f97316' },
  ],
  F: [
    { code: 'ENGL 1101', start: 840, end: 890, color: '#8b5cf6' },
  ],
}

const CAL_START = 480
const CAL_END   = 1320
const CAL_RANGE = CAL_END - CAL_START
const COL_H     = 280

const pct = (min) => ((min - CAL_START) / CAL_RANGE) * COL_H

function MockCalendar() {
  const days = ['M', 'T', 'W', 'R', 'F']
  const labels = { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri' }
  const hours = [8, 10, 12, 14, 16, 18, 20]

  return (
    <div className="flex text-xs select-none pointer-events-none">
      {/* Time axis */}
      <div style={{ width: 36, height: COL_H }} className="relative shrink-0">
        {hours.map(h => (
          <div
            key={h}
            className="absolute right-1 text-slate-500 leading-none"
            style={{ top: pct(h * 60) - 5 }}
          >
            {h > 12 ? `${h - 12}p` : h === 12 ? '12p' : `${h}a`}
          </div>
        ))}
      </div>

      <div className="flex flex-1 gap-1">
        {days.map(day => (
          <div key={day} className="flex-1 flex flex-col">
            <div className="text-center text-slate-400 font-semibold pb-1">{labels[day]}</div>
            <div className="relative rounded bg-slate-800/60 border border-slate-700/50" style={{ height: COL_H }}>
              {hours.map(h => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-slate-700/40"
                  style={{ top: pct(h * 60) }}
                />
              ))}
              {(MOCK[day] || []).map((block, i) => (
                <div
                  key={i}
                  className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 overflow-hidden"
                  style={{
                    top: pct(block.start),
                    height: Math.max(pct(block.end) - pct(block.start), 16),
                    backgroundColor: block.color + '33',
                    borderLeft: `2px solid ${block.color}`,
                    color: block.color,
                  }}
                >
                  <div className="font-bold leading-tight truncate" style={{ fontSize: 9 }}>
                    {block.code}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const STEPS = [
  {
    num: '01',
    title: 'Add Courses',
    desc: 'Search and tag every course you want to take this semester.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Set Preferences',
    desc: 'Paint your weekly grid green, yellow, or red. Tune professor and compactness weights.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Get Your Best Schedule',
    desc: 'Coursely generates every conflict-free combination and ranks them by your priorities.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-[#0f172a] text-white"
    >
      <Navbar />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20
                          text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            Georgia State University · Fall 2026
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
            Build your perfect{' '}
            <span className="text-blue-400">GSU schedule</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10">
            Tell us what courses you need and when you want them.
            We'll find every conflict-free combination and rank them by professor ratings,
            compactness, and your time preferences.
          </p>
          <button
            onClick={() => navigate('/optimizer')}
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400
                       text-white font-semibold px-8 py-3.5 rounded-xl text-base
                       transition shadow-lg shadow-blue-500/20"
          >
            Build My Schedule
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </motion.div>
      </section>

      {/* Mock preview */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 shadow-2xl"
        >
          {/* Fake card header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">Schedule #1</div>
              <div className="text-3xl font-bold text-blue-400">87<span className="text-base font-normal text-slate-500">/100</span></div>
            </div>
            <div className="space-y-2 w-40">
              {[['Professor', 0.82], ['Compactness', 0.91], ['Time Fit', 0.88]].map(([label, val]) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                    <span>{label}</span><span>{Math.round(val * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${val * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <MockCalendar />
          <div className="flex gap-2 mt-4 justify-end">
            <div className="text-xs bg-slate-700/60 text-slate-400 px-3 py-1.5 rounded-lg">Save Schedule</div>
            <div className="text-xs bg-slate-700/60 text-slate-400 px-3 py-1.5 rounded-lg">Export .ics</div>
          </div>
        </motion.div>
      </section>

      {/* 3 steps */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <h2 className="text-2xl font-bold text-center mb-12 text-slate-200">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-blue-400">{step.icon}</div>
                  <span className="text-xs font-bold text-slate-500">{step.num}</span>
                </div>
                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-slate-800 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to build your semester?</h2>
        <p className="text-slate-400 mb-8 text-sm">No account needed. Just open the optimizer and go.</p>
        <button
          onClick={() => navigate('/optimizer')}
          className="bg-blue-500 hover:bg-blue-400 text-white font-semibold
                     px-8 py-3 rounded-xl transition shadow-lg shadow-blue-500/20"
        >
          Get Started
        </button>
      </section>
    </motion.div>
  )
}
