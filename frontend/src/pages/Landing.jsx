import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const SERIF = { fontFamily: '"Instrument Serif", ui-serif, Georgia, serif' }

const STEPS = [
  {
    num: '01',
    title: 'Add your courses',
    desc: "Search by course code or title. Coursely pulls every available section from GSU's Banner system: seats, times, and professor assignments, automatically.",
  },
  {
    num: '02',
    title: 'Define your constraints',
    desc: 'Paint your weekly availability grid. Set how compact you want your days and which factors matter most: professor quality, time fit, or back-to-back classes.',
  },
  {
    num: '03',
    title: 'Execute the solver',
    desc: 'Watch every conflict-free combination get scored and ranked. Pick your best schedule, then export directly to your calendar as a .ics file.',
  },
]

function HeroGrid() {
  return (
    <div style={{ border: '1px solid rgba(238,237,232,0.1)', aspectRatio: '4/5', position: 'relative', background: '#0f0e0c' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid rgba(238,237,232,0.07)' }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ borderRight: i < 4 ? '1px solid rgba(238,237,232,0.05)' : 'none', background: i === 1 ? 'rgba(238,237,232,0.03)' : 'transparent' }} />
          ))}
        </div>
        <div style={{ flex: 1.4, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid rgba(238,237,232,0.07)' }}>
          <div style={{ gridColumn: 'span 2', padding: 8, borderRight: '1px solid rgba(238,237,232,0.05)' }}>
            <div style={{ height: '100%', background: '#eeede8', color: '#0f0e0c', padding: '6px 8px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              CSC 4400
            </div>
          </div>
          <div style={{ borderRight: '1px solid rgba(238,237,232,0.05)' }} />
          <div style={{ padding: 8, borderRight: '1px solid rgba(238,237,232,0.05)' }}>
            <div style={{ height: '55%', border: '1px solid rgba(238,237,232,0.15)' }} />
          </div>
          <div />
        </div>
        <div style={{ flex: 1.2, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid rgba(238,237,232,0.07)' }}>
          <div style={{ borderRight: '1px solid rgba(238,237,232,0.05)' }} />
          <div style={{ gridColumn: 'span 2', padding: 8, borderRight: '1px solid rgba(238,237,232,0.05)' }}>
            <div style={{ height: '70%', background: 'rgba(238,237,232,0.07)', border: '1px solid rgba(238,237,232,0.12)' }} />
          </div>
          <div style={{ borderRight: '1px solid rgba(238,237,232,0.05)' }} />
          <div style={{ background: 'rgba(238,237,232,0.02)' }} />
        </div>
        <div style={{ flex: 1.1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid rgba(238,237,232,0.07)' }}>
          <div style={{ padding: 8, borderRight: '1px solid rgba(238,237,232,0.05)' }}>
            <div style={{ height: '80%', background: '#eeede8', color: '#0f0e0c', padding: '4px 6px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              MATH
            </div>
          </div>
          <div style={{ borderRight: '1px solid rgba(238,237,232,0.05)' }} />
          <div style={{ padding: 8, borderRight: '1px solid rgba(238,237,232,0.05)' }}>
            <div style={{ height: '60%', border: '1px solid rgba(238,237,232,0.15)' }} />
          </div>
          <div style={{ borderRight: '1px solid rgba(238,237,232,0.05)', background: 'rgba(238,237,232,0.02)' }} />
          <div />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: -28, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(238,237,232,0.25)' }}>
        <span>Fig. 01</span>
        <span>Weekly grid · live</span>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: '#0f0e0c', color: '#eeede8' }}>

      {/* Navigation */}
      <nav style={{ borderBottom: '1px solid rgba(238,237,232,0.07)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span style={{ ...SERIF, fontStyle: 'italic', fontSize: '1.4rem', letterSpacing: '-0.01em', color: '#eeede8' }}>Coursely</span>
            <div className="hidden sm:flex gap-6 text-sm">
              {[['#logic', 'Features'], ['#workflow', 'How It Works']].map(([href, label]) => {
                const isRoute = href.startsWith('/')
                const El = isRoute ? Link : 'a'
                const prop = isRoute ? { to: href } : { href }
                return (
                  <El key={label} {...prop}
                    className="transition-colors"
                    style={{ color: 'rgba(238,237,232,0.45)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#eeede8')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(238,237,232,0.45)')}
                  >
                    {label}
                  </El>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/optimizer')} className="text-sm font-medium px-5 py-2 transition-colors"
              style={{ background: '#eeede8', color: '#0f0e0c' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#d4d3ce')}
              onMouseLeave={e => (e.currentTarget.style.background = '#eeede8')}>
              Start scheduling
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
        className="pt-14 pb-20" style={{ borderBottom: '1px solid rgba(238,237,232,0.07)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-12 gap-12 items-center">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-xs font-medium mb-6" style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(238,237,232,0.3)' }}>
                Georgia State University · Fall 2026
              </p>
              <h1 style={{ ...SERIF, fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', lineHeight: 1.0, letterSpacing: '-0.02em', marginBottom: '1.5rem', color: '#eeede8' }}>
                Registration is a<br />
                <span style={{ fontStyle: 'italic' }}>logic puzzle</span>.<br />
                Consider it solved.
              </h1>
              <p className="text-lg mb-10 leading-relaxed" style={{ color: 'rgba(238,237,232,0.55)', maxWidth: '40ch' }}>
                The first intelligent schedule engine for GSU students. Enter your courses and constraints. Coursely ranks every valid combination.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate('/optimizer')} className="text-base font-medium py-3 px-8 transition-colors"
                  style={{ background: '#eeede8', color: '#0f0e0c' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#d4d3ce')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#eeede8')}>
                  Build your semester
                </button>
                <a href="#workflow" className="text-base font-medium py-3 px-8 transition-colors"
                  style={{ border: '1px solid rgba(238,237,232,0.18)', color: '#eeede8', background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(238,237,232,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  See how it works
                </a>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-5 relative pt-8 lg:pt-0">
              <HeroGrid />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Feature grid */}
      <section id="logic" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
            <h2 style={{ ...SERIF, fontSize: 'clamp(2rem,4vw,3.2rem)', lineHeight: 1.1, maxWidth: '16ch', color: '#eeede8' }}>
              Total control over <span style={{ fontStyle: 'italic' }}>your</span> time.
            </h2>
            <p className="text-sm mb-2" style={{ color: 'rgba(238,237,232,0.4)', maxWidth: '36ch', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1.7 }}>
              Scrapes GSU's Banner system directly. 100% accurate seat counts and section data.
            </p>
          </div>

          <div className="grid md:grid-cols-3" style={{ borderTop: '1px solid rgba(238,237,232,0.1)', borderBottom: '1px solid rgba(238,237,232,0.1)' }}>
            {[
              {
                icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>,
                title: 'Constraint Engine',
                desc: 'Block out gym sessions, commute windows, or work shifts. The solver finds every valid combination that fits your life.',
              },
              {
                icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>,
                title: 'Live GSU Data',
                desc: 'Direct integration with GSU Banner. Section availability, CRN codes, professor assignments. Always current, never stale.',
              },
              {
                icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>,
                title: 'Priority Scoring',
                desc: 'Weight RateMyProfessor scores, preferred time slots, and schedule compactness. Your objective best schedule, ranked #1.',
              },
            ].map(({ icon, title, desc }, i) => (
              <div key={i} className="py-12 transition-colors"
                style={{ paddingLeft: i === 0 ? 0 : 48, paddingRight: i === 2 ? 0 : 48, borderLeft: i > 0 ? '1px solid rgba(238,237,232,0.1)' : 'none' }}>
                <div className="flex items-center justify-center mb-8"
                  style={{ width: 40, height: 40, border: '1px solid rgba(238,237,232,0.15)', color: '#eeede8' }}>
                  {icon}
                </div>
                <h3 className="text-xl font-medium mb-4" style={{ color: '#eeede8' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(238,237,232,0.5)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-20" style={{ borderTop: '1px solid rgba(238,237,232,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-12 gap-16 items-center">
            {/* Left: abstract schedule diagram */}
            <div className="col-span-12 lg:col-span-5">
              <div style={{ border: '1px solid rgba(238,237,232,0.1)', background: '#161614', aspectRatio: '4/5', display: 'flex', flexDirection: 'column', gap: 1, padding: 1 }}>
                {[
                  [{ w: 2, fill: '#eeede8', label: 'CSC 3410' }, { w: 1 }, { w: 1, border: true }, { w: 1 }],
                  [{ w: 1 }, { w: 2, fill: 'rgba(238,237,232,0.08)', border: true }, { w: 1 }, { w: 1 }],
                  [{ w: 1, fill: '#eeede8', label: 'MATH' }, { w: 1 }, { w: 2, border: true }, { w: 1 }],
                  [{ w: 1 }, { w: 1, fill: 'rgba(238,237,232,0.06)', border: true }, { w: 1 }, { w: 1, fill: '#eeede8', label: 'CSC' }, { w: 1 }],
                  [{ w: 2 }, { w: 1, border: true }, { w: 1 }, { w: 1 }],
                ].map((row, ri) => (
                  <div key={ri} style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
                    {row.map((cell, ci) => (
                      <div key={ci} style={{ gridColumn: `span ${cell.w}`, background: cell.fill || 'transparent', border: cell.border ? '1px solid rgba(238,237,232,0.15)' : 'none', padding: cell.label ? '6px 8px' : 0, display: 'flex', alignItems: 'flex-start' }}>
                        {cell.label && <span style={{ color: '#0f0e0c', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cell.label}</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: steps */}
            <div className="col-span-12 lg:col-span-7 flex flex-col justify-center">
              <div style={{ maxWidth: '48ch' }}>
                <span className="block mb-8 text-xs font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(238,237,232,0.3)' }}>
                  The Workflow
                </span>
                <div className="space-y-8">
                  {STEPS.map(({ num, title, desc }) => (
                    <div key={num} className="flex gap-8 items-start">
                      <span style={{ ...SERIF, fontStyle: 'italic', fontSize: '2.5rem', color: 'rgba(238,237,232,0.12)', lineHeight: 1, minWidth: 48 }}>{num}</span>
                      <div>
                        <h4 className="text-xl font-medium mb-2" style={{ color: '#eeede8' }}>{title}</h4>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(238,237,232,0.5)' }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: '#1c1b18', borderTop: '1px solid rgba(238,237,232,0.08)', borderBottom: '1px solid rgba(238,237,232,0.08)', color: '#eeede8' }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 style={{ ...SERIF, fontSize: 'clamp(2.5rem,5vw,4.5rem)', lineHeight: 1.05, marginBottom: '3rem', color: '#eeede8' }}>
            Ready for a <span style={{ fontStyle: 'italic' }}>better</span> semester?
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <button onClick={() => navigate('/optimizer')} className="text-base font-medium py-4 px-10 transition-colors"
              style={{ background: '#eeede8', color: '#0f0e0c' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#d4d3ce')}
              onMouseLeave={e => (e.currentTarget.style.background = '#eeede8')}>
              Build your schedule
            </button>
          </div>
          <p className="mt-12 text-xs" style={{ color: 'rgba(238,237,232,0.25)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            No account needed · GSU data updated each semester
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ borderTop: '1px solid rgba(238,237,232,0.08)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col gap-1.5">
              <span style={{ ...SERIF, fontStyle: 'italic', fontSize: '1.35rem', color: '#eeede8' }}>Coursely</span>
              <p className="text-xs" style={{ color: 'rgba(238,237,232,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                © 2026 Coursely · GSU Schedule Optimizer
              </p>
            </div>
            <div className="flex gap-12">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(238,237,232,0.2)' }}>App</span>
                {[['Optimizer', '/optimizer']].map(([label, to]) => (
                  <Link key={to} to={to} className="text-sm transition-colors" style={{ color: 'rgba(238,237,232,0.45)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#eeede8')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(238,237,232,0.45)')}>
                    {label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(238,237,232,0.2)' }}>Info</span>
                <span className="text-sm" style={{ color: 'rgba(238,237,232,0.45)' }}>Georgia State University</span>
                <span className="text-sm" style={{ color: 'rgba(238,237,232,0.45)' }}>Fall Semester 2026</span>
              </div>
            </div>
          </div>
          <p className="text-xs mt-8 text-center" style={{ color: 'rgba(238,237,232,0.18)', lineHeight: 1.7 }}>
            Coursely is an independent student project and is not affiliated with, endorsed by, or sponsored by Georgia State University.
          </p>
        </div>
      </footer>
    </div>
  )
}
