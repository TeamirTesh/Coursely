/** Shared palette for course blocks (optimizer + saved schedules). */
export const COURSE_COLORS = [
  { bg: 'bg-blue-500/20',    border: 'border-blue-500',    text: 'text-blue-300' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-300' },
  { bg: 'bg-violet-500/20',  border: 'border-violet-500',  text: 'text-violet-300' },
  { bg: 'bg-orange-500/20',  border: 'border-orange-500',  text: 'text-orange-300' },
  { bg: 'bg-pink-500/20',    border: 'border-pink-500',    text: 'text-pink-300' },
  { bg: 'bg-teal-500/20',    border: 'border-teal-500',    text: 'text-teal-300' },
  { bg: 'bg-red-500/20',     border: 'border-red-500',     text: 'text-red-300' },
  { bg: 'bg-indigo-500/20',  border: 'border-indigo-500',  text: 'text-indigo-300' },
]

/** @param {string[]} courseCodes */
export function buildColorMap(courseCodes) {
  const map = {}
  courseCodes.forEach((code, i) => {
    map[code] = COURSE_COLORS[i % COURSE_COLORS.length]
  })
  return map
}

/** @param {{ course_code: string }[]} sections */
export function buildColorMapFromSections(sections) {
  const codes = [...new Set((sections || []).map(s => s.course_code))]
  return buildColorMap(codes)
}
