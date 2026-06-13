/** Bright palette, readable on dark backgrounds. */
export const COURSE_COLORS = [
  { hex: '#2dd4bf' }, // teal
  { hex: '#a78bfa' }, // violet
  { hex: '#fb923c' }, // orange
  { hex: '#38bdf8' }, // sky
  { hex: '#f472b6' }, // rose
  { hex: '#34d399' }, // emerald
  { hex: '#f87171' }, // red
  { hex: '#818cf8' }, // indigo
]

/** @param {string[]} courseCodes */
export function buildColorMap(courseCodes) {
  const map = {}
  courseCodes.forEach((code, i) => { map[code] = COURSE_COLORS[i % COURSE_COLORS.length] })
  return map
}

/** @param {{ course_code: string }[]} sections */
export function buildColorMapFromSections(sections) {
  const codes = [...new Set((sections || []).map(s => s.course_code))]
  return buildColorMap(codes)
}
