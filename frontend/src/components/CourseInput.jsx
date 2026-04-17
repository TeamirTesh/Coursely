import { useState, useEffect, useRef } from 'react'

export default function CourseInput({ courses, setCourses }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/courses?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(data.filter(c => !courses.includes(c.course_code)).slice(0, 8))
        setOpen(true)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, courses])

  const add = (course_code) => {
    if (!courses.includes(course_code)) setCourses([...courses, course_code])
    setQuery('')
    setSuggestions([])
    setOpen(false)
  }

  const remove = (code) => setCourses(courses.filter(c => c !== code))

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && suggestions.length > 0) add(suggestions[0].course_code)
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={containerRef}>
      {courses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {courses.map(c => (
            <span
              key={c}
              className="inline-flex items-center gap-1 bg-blue-500/20 border border-blue-500/40
                         text-blue-300 text-sm font-medium px-3 py-1 rounded-full"
            >
              {c}
              <button
                onClick={() => remove(c)}
                className="text-blue-400 hover:text-blue-200 leading-none ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search by course code or title (e.g. CSC 1301)"
          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5
                     text-sm text-white placeholder-slate-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {open && suggestions.length > 0 && (
          <ul className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700
                         rounded-lg shadow-xl overflow-hidden">
            {suggestions.map(c => (
              <li
                key={c.course_code}
                onMouseDown={() => add(c.course_code)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 cursor-pointer"
              >
                <span className="font-mono text-sm font-semibold text-blue-400 w-20 shrink-0">
                  {c.course_code}
                </span>
                <span className="text-sm text-slate-300 truncate">{c.title}</span>
                {c.credits && (
                  <span className="ml-auto text-xs text-slate-500 shrink-0">{c.credits} cr</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {loading && (
          <span className="absolute right-3 top-2.5 text-slate-500 text-xs">searching...</span>
        )}
      </div>
    </div>
  )
}
