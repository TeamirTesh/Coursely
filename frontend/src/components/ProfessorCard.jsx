const DEPT_INITIALS = {
  'Computer Science': 'CS',
  Mathematics: 'MA',
  Biology: 'BIO',
  English: 'ENG',
  Physics: 'PHY',
  Psychology: 'PSY',
  History: 'HIS',
}

const DEPT_GRADIENTS = {
  'Computer Science': 'from-blue-600 to-blue-800',
  Mathematics: 'from-purple-600 to-purple-800',
  Biology: 'from-green-600 to-green-800',
  English: 'from-amber-600 to-amber-800',
  Physics: 'from-cyan-600 to-cyan-800',
  Psychology: 'from-pink-600 to-pink-800',
  History: 'from-orange-600 to-orange-800',
}

function StarRating({ rating }) {
  const full = Math.floor(rating)
  const partial = rating % 1
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        let fill = 'text-gray-700'
        if (i <= full) fill = 'text-yellow-400'
        else if (i === full + 1 && partial >= 0.5) fill = 'text-yellow-400/60'
        return (
          <svg key={i} className={`w-4 h-4 ${fill}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      })}
      <span className="text-gray-300 text-sm font-semibold ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function ProfessorCard({ professor }) {
  const gradient = DEPT_GRADIENTS[professor.department] || 'from-gray-600 to-gray-800'
  const initials = professor.name
    .split(' ')
    .filter((w) => w !== 'Dr.' && w !== 'Prof.')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

  const difficultyLabel =
    professor.difficulty <= 1
      ? 'Very Easy'
      : professor.difficulty <= 2
      ? 'Easy'
      : professor.difficulty <= 3
      ? 'Moderate'
      : professor.difficulty <= 4
      ? 'Hard'
      : 'Very Hard'

  return (
    <div className="card flex flex-col gap-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}
        >
          <span className="text-white font-bold text-lg">{initials}</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-100">{professor.name}</h3>
          <span className="text-xs text-gray-500">{professor.department}</span>
        </div>
      </div>

      {/* Bio */}
      <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{professor.bio}</p>

      {/* Stats */}
      <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
        <StarRating rating={professor.rating} />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Difficulty:</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
              professor.difficulty <= 2
                ? 'bg-green-900/40 text-green-400'
                : professor.difficulty <= 3
                ? 'bg-yellow-900/40 text-yellow-400'
                : 'bg-red-900/40 text-red-400'
            }`}
          >
            {difficultyLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
