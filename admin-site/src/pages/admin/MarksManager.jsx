import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Edit2, Trash2, Download, FileSpreadsheet, X, Save, Sparkles, FileText, GraduationCap, FileDown,
} from 'lucide-react'
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, query, where } from 'firebase/firestore'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { useToast, useConfirm } from '@shared/ui/feedback'
import { TextField, SelectField } from '@shared/ui/forms'
import { useFaculties, useInstitutions } from '@shared/lib/useCatalog'
import { expandScope, visibleScope, asList } from '@shared/lib/faculties'
import { calculateGrade, buildMarkRecord, toScore } from '@shared/lib/grading'
import { toCSV, downloadCSV } from '@shared/lib/csv'
import { PageHeader, EmptyState, TableSkeleton, Pagination, usePagination, Modal } from '../../components/ui'

const EMPTY = { firstName: '', lastName: '', regNumber: '', faculty: '', institution: '', gender: 'Male', marks: {} }

const REPORT_COLUMNS = {
  firstName: 'First name', lastName: 'Last name', regNumber: 'Reg number', faculty: 'Faculty',
  institution: 'Institution', gender: 'Gender', coursesMarks: 'Course marks', averageMarks: 'Average %', overallGrade: 'Grade',
}

export default function MarksManager() {
  const { isSuperAdmin, userData } = useAuth()
  const { faculties } = useFaculties()
  const institutions = useInstitutions()
  const toast = useToast()
  const confirm = useConfirm()

  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [facultyFilter, setFacultyFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [chosenCourses, setChosenCourses] = useState([])
  const [availableCourses, setAvailableCourses] = useState([])
  const [newCourse, setNewCourse] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyReg, setBusyReg] = useState(null)
  const [reportColumns, setReportColumns] = useState({
    firstName: true, lastName: true, regNumber: true, faculty: true, institution: false,
    gender: false, coursesMarks: true, averageMarks: true, overallGrade: true,
  })

  // Faculties/departments this admin may manage.
  const myScope = useMemo(
    () => isSuperAdmin ? faculties.map(f => f.name) : visibleScope(faculties, asList(userData?.faculty)),
    [isSuperAdmin, faculties, userData?.faculty],
  )

  useEffect(() => onSnapshot(collection(db, 'marks'),
    snap => { setMarks(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) },
    err => { toast.fail(err, 'Could not load marks.'); setLoading(false) },
  ), []) // eslint-disable-line react-hooks/exhaustive-deps

  // Courses for the faculty chosen in the form.
  useEffect(() => {
    if (!form.faculty) { setAvailableCourses([]); return }
    return onSnapshot(query(collection(db, 'courses'), where('faculties', 'array-contains', form.faculty)),
      snap => setAvailableCourses([...new Set(snap.docs.map(d => d.data().title).filter(Boolean))].sort()),
      () => setAvailableCourses([]))
  }, [form.faculty])

  const inScope = m => isSuperAdmin || asList(m.faculties || m.faculty).some(f => myScope.includes(f))

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return marks
      .filter(inScope)
      .filter(m => facultyFilter === 'All' || m.faculty === facultyFilter)
      .filter(m => {
        if (!q) return true
        return [m.firstName, m.lastName, m.regNumber, m.faculty, m.institution, Object.keys(m.marks || {}).join(' ')]
          .join(' ').toLowerCase().includes(q) || (m.overallGrade || '').toLowerCase() === q
      })
      .sort((a, b) => `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`))
  }, [marks, search, facultyFilter, myScope]) // eslint-disable-line react-hooks/exhaustive-deps

  const facultyOptions = useMemo(
    () => ['All', ...new Set(marks.filter(inScope).map(m => m.faculty).filter(Boolean))].sort((a, b) => a === 'All' ? -1 : a.localeCompare(b)),
    [marks, myScope], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const pager = usePagination(visible, 20)

  // ---------- add / edit ----------
  const openNew = () => {
    setSelected(null)
    setForm({ ...EMPTY, faculty: myScope[0] || '', institution: institutions[0]?.name || '' })
    setChosenCourses([])
    setModalOpen(true)
  }
  const openEdit = m => {
    setSelected(m)
    setForm({ ...EMPTY, ...m, marks: { ...(m.marks || {}) } })
    setChosenCourses(Object.keys(m.marks || {}))
    setModalOpen(true)
  }
  const toggleCourse = c => setChosenCourses(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c])
  const addCustomCourse = () => {
    const c = newCourse.trim().toUpperCase()
    if (!c) return
    if (!chosenCourses.includes(c)) setChosenCourses(cs => [...cs, c])
    setNewCourse('')
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!chosenCourses.length) return toast.error('Select at least one course for this trainee.')
    const bad = chosenCourses.find(c => toScore(form.marks[c]) === null)
    if (bad) return toast.error(`Enter a score between 0 and 100 for ${bad}.`)

    const reg = form.regNumber.trim().toUpperCase()
    if (!selected) {
      const dup = marks.find(m => (m.regNumber || '').toUpperCase() === reg && m.faculty === form.faculty)
      if (dup) {
        const edit = await confirm({
          title: 'Record already exists',
          message: `${dup.firstName} ${dup.lastName} (${reg}) already has a ${form.faculty} record. Open it instead of creating a duplicate?`,
          confirmLabel: 'Open existing record', tone: 'info',
        })
        if (edit) openEdit(dup)
        return
      }
    }

    setSaving(true)
    const data = {
      firstName: form.firstName.trim(), lastName: form.lastName.trim(), regNumber: reg,
      faculty: form.faculty, faculties: expandScope(faculties, [form.faculty]),
      institution: form.institution, gender: form.gender,
      ...buildMarkRecord(form, chosenCourses),
      updatedAt: new Date().toISOString(),
    }
    try {
      if (selected) await updateDoc(doc(db, 'marks', selected.id), data)
      else await addDoc(collection(db, 'marks'), { ...data, createdAt: new Date().toISOString() })
      toast.success(`${selected ? 'Updated' : 'Saved'} ${data.firstName} ${data.lastName}'s ${data.faculty} marks.`)
      setModalOpen(false)
    } catch (err) {
      toast.fail(err, 'The record could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async m => {
    const ok = await confirm({
      title: `Delete ${m.firstName} ${m.lastName}'s ${m.faculty || ''} record?`,
      message: `All ${Object.keys(m.marks || {}).length} course marks in this record (${m.regNumber}) will be permanently deleted. This cannot be undone.`,
      confirmLabel: 'Delete record',
    })
    if (!ok) return
    try { await deleteDoc(doc(db, 'marks', m.id)); toast.success('Record deleted.') }
    catch (err) { toast.fail(err, 'The record could not be deleted.') }
  }

  const transcript = async m => {
    setBusyReg(m.regNumber)
    try {
      const all = marks.filter(x => (x.regNumber || '').toUpperCase() === (m.regNumber || '').toUpperCase())
      await (await import('@shared/lib/transcript')).downloadTranscript(all.length ? all : [m])
    } catch (err) { toast.fail(err, 'Could not create the transcript.') } finally { setBusyReg(null) }
  }

  // ---------- reports ----------
  const reportRows = () => {
    const courses = new Set()
    if (reportColumns.coursesMarks) visible.forEach(m => Object.keys(m.marks || {}).forEach(c => courses.add(c)))
    const headers = []
    Object.entries(REPORT_COLUMNS).forEach(([k, label]) => {
      if (!reportColumns[k]) return
      if (k === 'coursesMarks') headers.push(...courses)
      else headers.push(label)
    })
    const rows = visible.map(m => {
      const row = {}
      Object.entries(REPORT_COLUMNS).forEach(([k, label]) => {
        if (!reportColumns[k]) return
        if (k === 'coursesMarks') courses.forEach(c => { row[c] = m.marks?.[c] ?? '' })
        else if (k === 'averageMarks') row[label] = m.averageMarks ?? ''
        else row[label] = m[k] ?? ''
      })
      return row
    })
    return { headers, rows }
  }

  const exportCSV = () => {
    const { headers, rows } = reportRows()
    downloadCSV(toCSV(rows, headers), `eNOTA_Marks_${new Date().toISOString().slice(0, 10)}.csv`)
    toast.success(`Exported ${rows.length} records to CSV.`)
    setReportOpen(false)
  }

  const exportPDF = () => {
    const { headers, rows } = reportRows()
    const pdf = new jsPDF({ orientation: headers.length > 7 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })
    pdf.setFont('helvetica', 'bold').setFontSize(15).setTextColor(3, 95, 64)
    pdf.text('eNOTA Portal — Marks report', 14, 16)
    pdf.setFont('helvetica', 'normal').setFontSize(9).setTextColor(92, 107, 101)
    pdf.text(`${facultyFilter === 'All' ? 'All faculties' : facultyFilter} · ${rows.length} records · ${new Date().toLocaleDateString('en-GB')}`, 14, 22)
    autoTable(pdf, {
      startY: 27, head: [headers], body: rows.map(r => headers.map(h => r[h])),
      styles: { fontSize: 8, cellPadding: 1.8 }, headStyles: { fillColor: [3, 95, 64] },
      alternateRowStyles: { fillColor: [245, 250, 247] },
    })
    pdf.save(`eNOTA_Marks_${new Date().toISOString().slice(0, 10)}.pdf`)
    toast.success(`Exported ${rows.length} records to PDF.`)
    setReportOpen(false)
  }

  const average = useMemo(() => {
    const s = chosenCourses.map(c => toScore(form.marks[c])).filter(v => v !== null)
    return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null
  }, [chosenCourses, form.marks])

  return (
    <div className="space-y-8">
      <PageHeader title="Marks" accent="Manager" subtitle="Add, update and export trainee marks. One record per trainee per faculty.">
        <Link to="/marks/import" className="btn-outline"><Sparkles size={16} /> Import with AI</Link>
        <button onClick={() => setReportOpen(true)} className="btn-outline"><FileSpreadsheet size={16} /> Report</button>
        <button onClick={openNew} className="btn-primary"><Plus size={18} /> Add record</button>
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" size={18} aria-hidden="true" />
          <input type="search" aria-label="Search marks" placeholder="Search name, reg number, course or grade"
            value={search} onChange={e => setSearch(e.target.value)} className="field-input pl-12 pr-10 py-3" />
          {search && <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-subtle hover:text-ink"><X size={16} /></button>}
        </div>
        <select aria-label="Filter by faculty" value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)} className="field-input lg:max-w-xs py-3">
          {facultyOptions.map(f => <option key={f} value={f} className="bg-surface">{f === 'All' ? 'All faculties' : f}</option>)}
        </select>
      </div>

      {loading ? <TableSkeleton /> : visible.length === 0 ? (
        <EmptyState icon={GraduationCap} title={search ? 'No matching records' : 'No marks yet'}
          text={search ? `Nothing matches “${search}”.` : 'Add a record, or import a marks sheet with AI.'}
          action={!search && <button onClick={openNew} className="btn-primary"><Plus size={16} /> Add record</button>} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="bg-white/[0.04] text-left text-sm text-muted">
                  <th scope="col" className="p-4 pl-6 font-semibold">Trainee</th>
                  <th scope="col" className="p-4 font-semibold">Faculty &amp; courses</th>
                  <th scope="col" className="p-4 font-semibold text-center">Average</th>
                  <th scope="col" className="p-4 font-semibold text-center">Grade</th>
                  <th scope="col" className="p-4 pr-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pager.slice.map((m, i) => (
                  <motion.tr key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.03, 0.4) } }}
                    className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="p-4 pl-6">
                      <p className="font-semibold">{m.firstName} {m.lastName}</p>
                      <p className="text-sm text-subtle font-mono">{m.regNumber}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium">{m.faculty}</p>
                      <p className="text-xs text-subtle truncate max-w-[260px]">{Object.keys(m.marks || {}).join(', ')}</p>
                    </td>
                    <td className="p-4 text-center font-bold text-accent">{m.averageMarks}%</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-lg font-bold text-sm ${m.overallGrade === 'F' ? 'bg-red-500/15 text-red-300' : 'bg-accent/10 text-accent'}`}>{m.overallGrade}</span>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => transcript(m)} disabled={busyReg === m.regNumber} title="Download transcript" aria-label={`Download transcript for ${m.firstName} ${m.lastName}`}
                          className="p-2.5 rounded-xl text-muted hover:text-accent hover:bg-accent/10 disabled:opacity-40"><FileDown size={17} /></button>
                        <button onClick={() => openEdit(m)} title="Edit" aria-label={`Edit ${m.firstName} ${m.lastName}`}
                          className="p-2.5 rounded-xl text-muted hover:text-ink hover:bg-white/5"><Edit2 size={17} /></button>
                        {isSuperAdmin && (
                          <button onClick={() => handleDelete(m)} title="Delete" aria-label={`Delete ${m.firstName} ${m.lastName}'s record`}
                            className="p-2.5 rounded-xl text-red-300/70 hover:text-red-300 hover:bg-red-500/10"><Trash2 size={17} /></button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4"><Pagination {...pager} label="records" /></div>
        </div>
      )}

      {/* Report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Export report" subtitle={`${visible.length} records in the current view will be exported.`}>
        <fieldset>
          <legend className="field-label">Columns</legend>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(REPORT_COLUMNS).map(([k, label]) => (
              <label key={k} className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-xl cursor-pointer hover:bg-white/[0.08] border border-white/5">
                <input type="checkbox" className="accent-accent w-4 h-4" checked={reportColumns[k]}
                  onChange={e => setReportColumns(c => ({ ...c, [k]: e.target.checked }))} />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid sm:grid-cols-2 gap-3 pt-6 mt-6 border-t border-white/10">
          <button onClick={exportCSV} className="btn-primary py-3.5"><Download size={18} /> Excel (CSV)</button>
          <button onClick={exportPDF} className="btn-outline py-3.5"><FileText size={18} /> PDF</button>
        </div>
      </Modal>

      {/* Add / edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} wide
        title={selected ? 'Edit marks record' : 'Add marks record'}
        subtitle={selected ? `${selected.firstName} ${selected.lastName} · ${selected.faculty}` : 'One record per trainee per faculty. Add another record for each extra faculty.'}>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <TextField label="First name" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
            <TextField label="Last name" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
            <TextField label="Registration number" required placeholder="KSP0101XXX" inputClassName="uppercase font-mono"
              value={form.regNumber} onChange={e => setForm({ ...form, regNumber: e.target.value.toUpperCase() })} />
            <SelectField label="Faculty or department" required
              options={myScope.length ? myScope : [{ value: '', label: 'No faculties assigned' }]}
              value={form.faculty} onChange={e => { setForm({ ...form, faculty: e.target.value }); if (!selected) setChosenCourses([]) }} />
            <SelectField label="Gender" options={['Male', 'Female']} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} />
            <SelectField label="Institution" options={institutions.length ? institutions.map(i => i.name) : ['NAD CLASS']}
              value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} />
          </div>

          <div className="pt-6 border-t border-white/10 space-y-4">
            <h3 className="font-display font-semibold">1. Courses</h3>
            <div className="flex flex-wrap gap-2">
              {[...new Set([...availableCourses, ...chosenCourses])].map(c => (
                <button key={c} type="button" role="checkbox" aria-checked={chosenCourses.includes(c)} onClick={() => toggleCourse(c)}
                  className={`chip ${chosenCourses.includes(c) ? 'chip-on' : 'chip-off'}`}>{c}</button>
              ))}
              {!availableCourses.length && !chosenCourses.length && <p className="text-sm text-subtle">No courses are set up for this faculty yet — add one below.</p>}
            </div>
            <div className="flex gap-2">
              <input aria-label="Add another course" placeholder="Add another course name" value={newCourse}
                onChange={e => setNewCourse(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomCourse() } }}
                className="field-input py-2.5" />
              <button type="button" onClick={addCustomCourse} className="btn-ghost border border-white/10 shrink-0"><Plus size={16} /> Add</button>
            </div>
          </div>

          <AnimatePresence>
            {chosenCourses.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-6 border-t border-white/10 space-y-4 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold">2. Scores</h3>
                  {average !== null && <p className="text-sm text-muted">Average <span className="text-accent font-bold">{average.toFixed(2)}%</span> · Grade <span className="text-accent font-bold">{calculateGrade(average)}</span></p>}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {chosenCourses.map(c => (
                    <div key={c} className="p-4 rounded-2xl border border-white/10 bg-white/[0.03]">
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor={`score-${c}`} className="text-sm font-semibold">{c}</label>
                        <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-lg">{calculateGrade(form.marks[c])}</span>
                      </div>
                      <div className="relative">
                        <input id={`score-${c}`} type="number" min="0" max="100" step="0.01" inputMode="decimal" required
                          className="field-input text-xl font-bold pr-10" value={form.marks[c] ?? ''}
                          onChange={e => setForm({ ...form, marks: { ...form.marks, [c]: e.target.value } })} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-subtle font-bold" aria-hidden="true">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={saving} className="btn-primary w-full py-4">
            <Save size={18} /> {saving ? 'Saving…' : selected ? 'Update record' : 'Save record'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
