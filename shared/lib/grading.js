/**
 * eNOTA grading scale and helpers shared by the admin site, the public
 * marks page and the transcript generator.
 */
export const GRADE_SCALE = [
  { min: 90, grade: 'A+', label: 'Exceptional' },
  { min: 80, grade: 'A', label: 'Excellent' },
  { min: 75, grade: 'B+', label: 'Very good' },
  { min: 70, grade: 'B', label: 'Good' },
  { min: 65, grade: 'C+', label: 'Satisfactory' },
  { min: 60, grade: 'C', label: 'Pass' },
  { min: 55, grade: 'D', label: 'Pass' },
  { min: 50, grade: 'E', label: 'Minimum pass' },
  { min: 0, grade: 'F', label: 'Fail' },
]

export const PASS_MARK = 50

export function toScore(v) {
  if (v === null || v === undefined || v === '' || v === 'N/A') return null
  const n = parseFloat(v)
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null
}

export function calculateGrade(v) {
  const n = toScore(v)
  if (n === null) return 'F'
  return GRADE_SCALE.find(g => n >= g.min).grade
}

export function gradeLabel(grade) {
  return GRADE_SCALE.find(g => g.grade === grade)?.label || ''
}

const COMMENTS = {
  'A+': 'Exceptional distinction. An outstanding level of mastery across the programme.',
  A: 'Excellent result, showing a high level of competence.',
  'B+': 'Very commendable performance; keep maintaining these standards.',
  B: 'Good performance that meets the core objectives of the programme.',
  'C+': 'Satisfactory performance across the requirements.',
  C: 'Passed, demonstrating the knowledge required by the course standards.',
  D: 'Passed. Consistent effort will yield even better results.',
  E: 'Minimum requirements met. We encourage more effort in future modules.',
  F: 'Below the minimum threshold. Please consult your instructor for a review.',
}
export function gradeComment(grade) {
  return COMMENTS[grade] || 'Result processed. Contact the administration for details.'
}

/** Summary for one record's `marks` map ({ course: score }). */
export function summarise(marksMap = {}) {
  const courses = Object.entries(marksMap).map(([course, raw]) => {
    const score = toScore(raw)
    return { course, score, grade: calculateGrade(score), passed: score !== null && score >= PASS_MARK }
  })
  const scored = courses.filter(c => c.score !== null)
  const average = scored.length ? scored.reduce((s, c) => s + c.score, 0) / scored.length : 0
  return {
    courses,
    average: Math.round(average * 100) / 100,
    grade: calculateGrade(average),
    passed: scored.filter(c => c.passed).length,
    total: courses.length,
  }
}

/**
 * Build the fields saved on a marks record. Keeps the legacy
 * `grade<COURSE>` fields so older pages still read correctly.
 */
export function buildMarkRecord(form, courses) {
  const marks = {}
  courses.forEach(c => { marks[c] = toScore(form.marks?.[c]) ?? 0 })
  const s = summarise(marks)
  const legacy = {}
  courses.forEach(c => { legacy[`grade${c.replace(/\s+/g, '')}`] = calculateGrade(marks[c]) })
  return { marks, averageMarks: s.average.toFixed(2), overallGrade: s.grade, ...legacy }
}

/** Group marks records by registration number (one trainee, many faculties). */
export function groupByTrainee(records) {
  const map = new Map()
  for (const r of records) {
    const key = (r.regNumber || `${r.firstName}-${r.lastName}`).toUpperCase()
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(r)
  }
  return [...map.values()]
}

/** Overall result across several faculty records (credit = each course). */
export function cumulative(records) {
  const all = records.flatMap(r => summarise(r.marks).courses).filter(c => c.score !== null)
  const avg = all.length ? all.reduce((s, c) => s + c.score, 0) / all.length : 0
  return { average: Math.round(avg * 100) / 100, grade: calculateGrade(avg), courses: all.length, passed: all.filter(c => c.passed).length }
}
