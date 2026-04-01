const DIFFICULTY_LABELS = ['', 'Very Easy', 'Easy', 'Moderate', 'Hard', 'Very Hard']
const DIFFICULTY_COLORS = [
  '',
  'bg-green-900/50 text-green-400 border-green-800',
  'bg-emerald-900/50 text-emerald-400 border-emerald-800',
  'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  'bg-orange-900/50 text-orange-400 border-orange-800',
  'bg-red-900/50 text-red-400 border-red-800',
]

const DEPT_COLORS = {
  'Computer Science': 'bg-blue-900/40 text-blue-400 border-blue-800',
  Mathematics: 'bg-purple-900/40 text-purple-400 border-purple-800',
  Biology: 'bg-green-900/40 text-green-400 border-green-800',
  English: 'bg-amber-900/40 text-amber-400 border-amber-800',
  Physics: 'bg-cyan-900/40 text-cyan-400 border-cyan-800',
  Psychology: 'bg-pink-900/40 text-pink-400 border-pink-800',
  History: 'bg-orange-900/40 text-orange-400 border-orange-800',
}

function DifficultyDots({ level }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= level ? 'bg-gsu-blue' : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  )
}

export default function CourseCard({ course, onAdd, isAdded }) {
  const deptColor = DEPT_COLORS[course.department] || 'bg-gray-800 text-gray-400 border-gray-700'
  const diffColor = DIFFICULTY_COLORS[course.difficulty]

  return (
    <div className="card flex flex-col gap-3 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-mono text-gsu-lightblue font-semibold tracking-wider">
            {course.course_code}
          </span>
          <h3 className="text-gray-100 font-semibold mt-0.5 leading-snug">
            {course.course_title}
          </h3>
        </div>
        <span className="shrink-0 text-sm font-bold text-gray-300 bg-gray-800 rounded-lg px-2.5 py-1">
          {course.credits} cr
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
        {course.description}
      </p>

      {/* Tags & difficulty */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`badge border ${deptColor}`}>{course.department}</span>
        <span className={`badge border ${diffColor}`}>
          {DIFFICULTY_LABELS[course.difficulty]}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-800">
        <DifficultyDots level={course.difficulty} />
        <button
          onClick={() => onAdd(course)}
          disabled={isAdded}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            isAdded
              ? 'bg-green-900/40 text-green-400 border border-green-800 cursor-default'
              : 'btn-primary'
          }`}
        >
          {isAdded ? '✓ Added' : '+ Add to Schedule'}
        </button>
      </div>
    </div>
  )
}
