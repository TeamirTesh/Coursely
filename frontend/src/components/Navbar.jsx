import { Link, useLocation } from 'react-router-dom'

const LINKS = [
  { to: '/optimizer', label: 'Optimizer' },
  { to: '/saved',     label: 'Saved'     },
  { to: '/analytics', label: 'Analytics' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <header className="border-b border-slate-800 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center gap-6">
        <Link to="/" className="text-xl font-bold text-blue-400 shrink-0">
          Coursely
        </Link>
        <nav className="flex items-center gap-5">
          {LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm transition ${
                pathname === to
                  ? 'text-white font-medium'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <span className="text-slate-700 text-xs hidden sm:block ml-auto">
          GSU · Fall 2026
        </span>
      </div>
    </header>
  )
}
