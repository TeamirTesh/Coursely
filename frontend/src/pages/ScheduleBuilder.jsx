import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API = 'http://localhost:8000'

const DIFFICULTY_LABELS = ['', 'Very Easy', 'Easy', 'Moderate', 'Hard', 'Very Hard']
const DIFFICULTY_COLORS = [
  '',
  'text-green-400',
  'text-emerald-400',
  'text-yellow-400',
  'text-orange-400',
  'text-red-400',
]

function SectionCard({ section }) {
  const course = section.course
  const prof = section.professor
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-mono text-gsu-lightblue font-semibold tracking-wider">
            {course.course_code}
          </span>
          <h4 className="text-gray-200 font-medium text-sm mt-0.5">{course.course_title}</h4>
        </div>
        <span className="text-xs font-bold bg-gray-800 text-gray-300 rounded-md px-2 py-1 shrink-0">
          {course.credits} cr
        </span>
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-2">
        <span>👤 {prof.name}</span>
        <span>·</span>
        <span className={DIFFICULTY_COLORS[course.difficulty]}>
          {DIFFICULTY_LABELS[course.difficulty]}
        </span>
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-1.5">
        <span>🕐</span>
        <span>{section.meeting_times}</span>
      </div>
    </div>
  )
}

export default function ScheduleBuilder({ schedule, onRemove }) {
  const [sections, setSections] = useState([])
  const [loadingSections, setLoadingSections] = useState(true)

  useEffect(() => {
    fetch(`${API}/sections`)
      .then((r) => r.json())
      .then((data) => {
        setSections(data)
        setLoadingSections(false)
      })
      .catch(() => setLoadingSections(false))
  }, [])

  const totalCredits = schedule.reduce((sum, c) => sum + c.credits, 0)
  const avgDifficulty =
    schedule.length > 0
      ? (schedule.reduce((sum, c) => sum + c.difficulty, 0) / schedule.length).toFixed(1)
      : null

  // Get sections for scheduled courses
  const scheduledSections = sections.filter((s) =>
    schedule.find((c) => c.course_id === s.course_id)
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Schedule Builder</h1>
        <p className="text-gray-400">
          Build your semester schedule. Add courses from the{' '}
          <Link to="/courses" className="text-blue-400 hover:underline">
            Course Catalog
          </Link>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar — selected courses */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="card mb-4">
              <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <span>📋</span> My Courses
                {schedule.length > 0 && (
                  <span className="ml-auto bg-gsu-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {schedule.length}
                  </span>
                )}
              </h2>

              {schedule.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-sm">No courses added yet.</p>
                  <Link
                    to="/courses"
                    className="text-blue-400 text-sm hover:underline mt-1 inline-block"
                  >
                    Browse courses →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {schedule.map((course) => (
                    <div
                      key={course.course_id}
                      className="flex items-center gap-2 bg-gray-800/60 rounded-lg px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-gsu-lightblue font-semibold">
                          {course.course_code}
                        </div>
                        <div className="text-sm text-gray-300 truncate">{course.course_title}</div>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{course.credits}cr</span>
                      <button
                        onClick={() => onRemove(course.course_id)}
                        className="text-gray-600 hover:text-red-400 transition-colors shrink-0 text-lg leading-none"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            {schedule.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                  Schedule Summary
                </h3>
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Credits</span>
                    <span className={`font-bold ${totalCredits > 18 ? 'text-red-400' : 'text-white'}`}>
                      {totalCredits}{totalCredits > 18 && ' ⚠️'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Courses</span>
                    <span className="font-bold text-white">{schedule.length}</span>
                  </div>
                  {avgDifficulty && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Avg Difficulty</span>
                      <span
                        className={`font-bold ${
                          avgDifficulty >= 4
                            ? 'text-red-400'
                            : avgDifficulty >= 3
                            ? 'text-yellow-400'
                            : 'text-green-400'
                        }`}
                      >
                        {avgDifficulty} / 5
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-800">
                    <div className="text-xs text-gray-500">
                      {totalCredits < 12
                        ? '⚠️ Below full-time status (12 credits)'
                        : totalCredits <= 18
                        ? '✅ Full-time enrollment'
                        : '⚠️ Over typical limit (18 credits)'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main — sections view */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">
            Available Sections — Fall 2025
          </h2>

          {loadingSections ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-3 bg-gray-800 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : schedule.length === 0 ? (
            <div className="text-center py-20 text-gray-600 border border-dashed border-gray-800 rounded-xl">
              <div className="text-5xl mb-4">🗓️</div>
              <p className="text-lg font-medium text-gray-500">Your schedule is empty</p>
              <p className="text-sm mt-1">
                Add courses from the{' '}
                <Link to="/courses" className="text-blue-400 hover:underline">
                  catalog
                </Link>{' '}
                to see available sections here.
              </p>
            </div>
          ) : scheduledSections.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No sections found for your selected courses.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scheduledSections.map((section) => (
                <SectionCard key={section.section_id} section={section} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
