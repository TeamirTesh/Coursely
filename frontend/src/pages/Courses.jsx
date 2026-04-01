import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import CourseCard from '../components/CourseCard'

const API = 'http://localhost:8000'

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Mathematics',
  'Biology',
  'English',
  'Physics',
  'Psychology',
  'History',
]

export default function Courses({ onAddToSchedule, schedule }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [department, setDepartment] = useState('All Departments')
  const [difficulty, setDifficulty] = useState(0)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (department !== 'All Departments') params.set('department', department)
    if (difficulty > 0) params.set('difficulty', difficulty)

    fetch(`${API}/courses?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCourses(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [department, difficulty])

  const filtered = courses.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.course_code.toLowerCase().includes(q) ||
      c.course_title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    )
  })

  const scheduledIds = new Set(schedule.map((c) => c.course_id))

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Course Catalog</h1>
        <p className="text-gray-400">Browse and filter all available GSU courses.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="input max-w-sm"
        />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="select"
        >
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="select"
        >
          <option value={0}>Any Difficulty</option>
          <option value={1}>1 — Very Easy</option>
          <option value={2}>2 — Easy</option>
          <option value={3}>3 — Moderate</option>
          <option value={4}>4 — Hard</option>
          <option value={5}>5 — Very Hard</option>
        </select>
        {(search || department !== 'All Departments' || difficulty > 0) && (
          <button
            onClick={() => {
              setSearch('')
              setDepartment('All Departments')
              setDifficulty(0)
            }}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-gray-500 text-sm mb-5">
        {loading ? 'Loading...' : `${filtered.length} course${filtered.length !== 1 ? 's' : ''} found`}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-1/3 mb-3" />
              <div className="h-5 bg-gray-800 rounded w-3/4 mb-4" />
              <div className="h-3 bg-gray-800 rounded mb-2" />
              <div className="h-3 bg-gray-800 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-medium">No courses found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <CourseCard
              key={course.course_id}
              course={course}
              onAdd={onAddToSchedule}
              isAdded={scheduledIds.has(course.course_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
