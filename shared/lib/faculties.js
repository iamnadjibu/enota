/**
 * Faculty / department helpers.
 *
 * A department is a document in the `faculties` collection with a
 * `parent` field naming its faculty, e.g.
 *   { name: 'PHOTOGRAPHY AND GRAPHIC DESIGN', parent: 'MULTIMEDIA PRODUCTION' }
 * Faculties without `parent` are top level. A department can be chosen on
 * its own (a trainee who only studies Photography) or through its faculty.
 */

export function normaliseFaculties(docs) {
  return docs
    .map(d => ({ id: d.id, name: d.name, parent: d.parent || '' }))
    .filter(f => f.name)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function topLevel(faculties) {
  return faculties.filter(f => !f.parent)
}

export function departmentsOf(faculties, facultyName) {
  return faculties.filter(f => f.parent === facultyName)
}

export function parentOf(faculties, name) {
  return faculties.find(f => f.name === name)?.parent || ''
}

/**
 * Scope stored on courses and marks: the chosen faculties/departments plus
 * their parent faculties, so an admin or trainee of the parent faculty
 * also covers its departments.
 */
export function expandScope(faculties, names) {
  const out = new Set()
  for (const n of names || []) {
    if (!n) continue
    out.add(n)
    const p = parentOf(faculties, n)
    if (p) out.add(p)
  }
  return [...out]
}

/**
 * Everything a member of `names` should see: the names themselves plus all
 * departments under any faculty they belong to. Used for course queries.
 */
export function visibleScope(faculties, names) {
  const out = new Set(names || [])
  for (const n of names || []) departmentsOf(faculties, n).forEach(d => out.add(d.name))
  return [...out]
}

/** Options for <ChipSelect>, grouped by faculty. */
export function chipOptions(faculties) {
  const tops = topLevel(faculties)
  const opts = []
  for (const f of tops) {
    const deps = departmentsOf(faculties, f.name)
    if (deps.length) {
      opts.push({ value: f.name, label: `All of ${f.name}`, group: f.name })
      deps.forEach(d => opts.push({ value: d.name, label: d.name, group: f.name }))
    } else {
      opts.push({ value: f.name, label: f.name, group: 'Other faculties' })
    }
  }
  // Departments whose parent is missing still appear.
  faculties.filter(f => f.parent && !tops.some(t => t.name === f.parent))
    .forEach(d => opts.push({ value: d.name, label: d.name, group: 'Other faculties' }))
  // Groups with departments first, standalone faculties last.
  return opts.sort((a, b) => (a.group === 'Other faculties') - (b.group === 'Other faculties'))
}

export function asList(v) {
  if (Array.isArray(v)) return v.filter(Boolean)
  return v ? [v] : []
}
