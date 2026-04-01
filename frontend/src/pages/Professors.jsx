import { useState, useEffect } from 'react'
import ProfessorCard from '../components/ProfessorCard'

const API = 'http://localhost:8000'

export default function Professors() {
  const [professors, setProfessors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('rating')

  useEffect(() => {
    fetch(`${API}/professors`)
      .then((r) => r.json())
      .then((data) => {
        setProfessors(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = professors
    .filter((p) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'difficulty_asc') return a.difficulty - b.difficulty
      if (sortBy === 'difficulty_desc') return b.difficulty - a.difficulty
      return a.name.localeCompare(b.name)
    })

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Professors</h1>
        <p className="text-gray-400">Explore GSU faculty ratings and teaching profiles.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search professors or departments..."
          className="input max-w-sm"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="select"
        >
          <option value="rating">Sort: Highest Rated</option>
          <option value="name">Sort: A–Z</option>
          <option value="difficulty_asc">Sort: Easiest First</option>
          <option value="difficulty_desc">Sort: Hardest First</option>
        </select>
      </div>

      <p className="text-gray-500 text-sm mb-5">
        {loading
          ? 'Loading...'
          : `${filtered.length} professor${filtered.length !== 1 ? 's' : ''}`}
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gray-800 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-800 rounded mb-2" />
              <div className="h-3 bg-gray-800 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">👩‍🏫</div>
          <p className="text-lg font-medium">No professors found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((prof) => (
            <ProfessorCard key={prof.professor_id} professor={prof} />
          ))}
        </div>
      )}
    </div>
  )
}
