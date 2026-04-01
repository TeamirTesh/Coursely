import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:8000'

function StatCard({ label, value, icon }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-12 h-12 bg-gsu-blue/20 border border-gsu-blue/30 rounded-xl flex items-center justify-center text-2xl shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
    </div>
  )
}

export default function Home() {
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ courses: 0, professors: 0, departments: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      fetch(`${API}/courses`).then((r) => r.json()),
      fetch(`${API}/professors`).then((r) => r.json()),
    ])
      .then(([courses, professors]) => {
        const depts = new Set(courses.map((c) => c.department))
        setStats({
          courses: courses.length,
          professors: professors.length,
          departments: depts.size,
        })
      })
      .catch(() => {})
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    navigate(`/courses?q=${encodeURIComponent(search)}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        {/* GSU badge */}
        <div className="inline-flex items-center gap-2 bg-gsu-blue/10 border border-gsu-blue/30 rounded-full px-4 py-1.5 mb-6">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-blue-400 text-sm font-medium">Georgia State University</span>
        </div>

        <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">
          Find your perfect{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
            GSU schedule
          </span>
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Search courses, browse professors, and build a schedule that fits your goals — all in one
          place.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, e.g. CSC 1301, Calculus..."
            className="input flex-1"
          />
          <button type="submit" className="btn-primary shrink-0 px-6">
            Search
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-20">
        <StatCard label="Total Courses" value={stats.courses} icon="📚" />
        <StatCard label="Professors" value={stats.professors} icon="🎓" />
        <StatCard label="Departments" value={stats.departments} icon="🏛️" />
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Browse Courses',
            description:
              'Explore all GSU courses with filters by department and difficulty level.',
            icon: '📖',
            action: 'Explore Courses →',
            href: '/courses',
          },
          {
            title: 'Find Professors',
            description:
              'Compare professor ratings and teaching styles before you enroll.',
            icon: '⭐',
            action: 'Browse Professors →',
            href: '/professors',
          },
          {
            title: 'Build Your Schedule',
            description:
              'Curate your semester by adding courses to a personal schedule.',
            icon: '🗓️',
            action: 'Start Building →',
            href: '/schedule',
          },
        ].map((f) => (
          <a
            key={f.title}
            href={f.href}
            className="card group cursor-pointer hover:border-gsu-blue/50 hover:bg-gsu-blue/5 transition-all"
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-white mb-2">{f.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">{f.description}</p>
            <span className="text-gsu-lightblue text-sm font-medium group-hover:underline">
              {f.action}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
