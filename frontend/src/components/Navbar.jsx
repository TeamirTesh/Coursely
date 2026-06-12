import { Link, useLocation } from 'react-router-dom'

const SERIF = { fontFamily: '"Instrument Serif", ui-serif, Georgia, serif', fontStyle: 'italic' }

const LINKS = [
  { to: '/optimizer', label: 'Optimizer' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <header style={{ borderBottom: '1px solid rgba(238,237,232,0.08)', background: '#0f0e0c' }}
      className="sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" style={{ ...SERIF, fontSize: '1.35rem', letterSpacing: '-0.01em', color: '#eeede8' }}>
            Coursely
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {LINKS.map(({ to, label }) => {
              const active = pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className="px-3 py-1.5 text-sm transition-colors"
                  style={{
                    color:        active ? '#eeede8' : 'rgba(238,237,232,0.4)',
                    fontWeight:   active ? 500 : 400,
                    borderBottom: active ? '1px solid #eeede8' : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#eeede8' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(238,237,232,0.4)' }}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs hidden sm:block" style={{ color: 'rgba(238,237,232,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            GSU · Fall 2026
          </span>
          <Link
            to="/optimizer"
            className="text-sm font-medium px-4 py-2 transition-colors"
            style={{ background: '#eeede8', color: '#0f0e0c' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#d4d3ce')}
            onMouseLeave={e => (e.currentTarget.style.background = '#eeede8')}
          >
            Build schedule
          </Link>
        </div>
      </div>
    </header>
  )
}
