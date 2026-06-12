import { useState, useEffect, useRef } from 'react'

export default function CourseInput({ courses, setCourses }) {
  const [query,       setQuery]       = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [open,        setOpen]        = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/courses?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(data.filter(c => !courses.includes(c.course_code)).slice(0, 8))
        setOpen(true)
      } catch { setSuggestions([]) }
      finally  { setLoading(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, courses])

  const add = (code) => {
    if (!courses.includes(code)) setCourses([...courses, code])
    setQuery(''); setSuggestions([]); setOpen(false)
  }

  const remove = (code) => setCourses(courses.filter(c => c !== code))

  const onKeyDown = (e) => {
    if (e.key === 'Enter'  && suggestions.length > 0) add(suggestions[0].course_code)
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={containerRef}>
      {courses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {courses.map(c => (
            <span key={c} className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5"
              style={{ background: 'rgba(238,237,232,0.08)', border: '1px solid rgba(238,237,232,0.15)', color: '#eeede8' }}>
              {c}
              <button onClick={() => remove(c)} className="transition leading-none"
                style={{ color: 'rgba(238,237,232,0.3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#eeede8')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(238,237,232,0.3)')}>
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
          placeholder="Search by course code or title — e.g. CSC 1301"
          className="w-full text-sm px-4 py-2.5 transition-all outline-none"
          style={{ background: '#1c1b18', border: '1px solid rgba(238,237,232,0.12)', color: '#eeede8' }}
          onFocus={e  => (e.currentTarget.style.borderColor = 'rgba(238,237,232,0.4)')}
          onBlur={e   => (e.currentTarget.style.borderColor = 'rgba(238,237,232,0.12)')}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'rgba(238,237,232,0.3)' }}>
            searching…
          </span>
        )}
        {open && suggestions.length > 0 && (
          <ul className="absolute z-20 w-full mt-0.5 overflow-hidden"
            style={{ background: '#1c1b18', border: '1px solid rgba(238,237,232,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            {suggestions.map((c, i) => (
              <li key={c.course_code}
                onMouseDown={() => add(c.course_code)}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                style={{ borderTop: i > 0 ? '1px solid rgba(238,237,232,0.06)' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(238,237,232,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span className="font-mono text-xs font-bold w-20 shrink-0" style={{ color: '#eeede8' }}>{c.course_code}</span>
                <span className="text-sm truncate" style={{ color: 'rgba(238,237,232,0.55)' }}>{c.title}</span>
                {c.credits && <span className="ml-auto text-xs shrink-0" style={{ color: 'rgba(238,237,232,0.25)' }}>{c.credits} cr</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
