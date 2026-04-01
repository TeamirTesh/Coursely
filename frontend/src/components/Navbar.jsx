import { NavLink } from 'react-router-dom'

export default function Navbar({ scheduleCount }) {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gsu-blue text-white'
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gsu-blue rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-lg text-white">
            Course<span className="text-blue-400">ly</span>
          </span>
          <span className="hidden sm:inline text-xs text-gray-500 border border-gray-700 rounded px-1.5 py-0.5 ml-1">
            GSU
          </span>
        </NavLink>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/courses" className={linkClass}>
            Courses
          </NavLink>
          <NavLink to="/professors" className={linkClass}>
            Professors
          </NavLink>
          <NavLink to="/schedule" className={linkClass}>
            <span className="flex items-center gap-1.5">
              Schedule
              {scheduleCount > 0 && (
                <span className="bg-gsu-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {scheduleCount}
                </span>
              )}
            </span>
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
