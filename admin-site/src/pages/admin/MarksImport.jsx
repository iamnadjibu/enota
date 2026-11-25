import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud, Sparkles, FileText, X, ArrowLeft, Rocket, AlertTriangle, CheckCircle2, Trash2, Plus, RotateCcw, Loader2,
} from 'lucide-react'
import { collection, doc, onSnapshot, query, where, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { useToast, useConfirm } from '@shared/ui/feedback'
import { SelectField, Alert } from '@shared/ui/forms'
import { useFaculties, useInstitutions } from '@shared/lib/useCatalog'
import { expandScope, visibleScope, asList } from '@shared/lib/faculties'
import { buildMarkRecord, calculateGrade, toScore, summarise } from '@shared/lib/grading'
import { extractMarks, aiErrorMessage, ACCEPTED } from '../../lib/aiImport'
import { PageHeader } from '../../components/ui'

const STEPS = ['Reading the file', 'Finding trainees and courses', 'Checking scores']

export default function MarksImport() {
  const { isSuperAdmin, userData } = useAuth()
  const { faculties } = useFaculties()
  const institutions = useInstitutions()
  const toast = useToast()
  const confirm = useConfirm()
  const inputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [faculty, setFaculty] = useState('')
  const [institution, setInstitution] = useState('')
  const [note, setNote] = useState('')
  const [phase, setPhase] = useState('upload') // upload | extracting | review | deploying | done
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [courses, setCourses] = useState([])
  const [warnings, setWarnings] = useState([])
  const [knownCourses, setKnownCourses] = useState([])
  const [existing, setExisting] = useState([])
  const [result, setResult] = useState(null)

  const scope = useMemo(
    () => isSuperAdmin ? faculties.map(f => f.name) : visibleScope(faculties, asList(userData?.faculty)),
    [isSuperAdmin, faculties, userData?.faculty],
  )
  useEffect(() => { if (!faculty && scope.length) setFaculty(scope[0]) }, [scope]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!institution && institutions.length) setInstitution(institutions[0].name) }, [institutions]) // eslint-disable-line react-hooks/exhaustive-deps

  // Known courses and existing records for the chosen faculty.
  useEffect(() => {
    if (!faculty) return
    const u1 = onSnapshot(query(collection(db, 'courses'), where('faculties', 'array-contains', faculty)),
      s => setKnownCourses([...new Set(s.docs.map(d => d.data().title).filter(Boolean))]), () => {})
    const u2 = onSnapshot(query(collection(db, 'marks'), where('faculty', '==', faculty)),
      s => setExisting(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {})
    return () => { u1(); u2() }
  }, [faculty])

  const existingByReg = useMemo(() => {
    const m = new Map()
    existing.forEach(r => r.regNumber && m.set(r.regNumber.toUpperCase(), r))
    return m
  }, [existing])

  const pickFile = f => {
    if (!f) return
    setError('')
    setFile(f)
  }

  const runExtraction = async () => {
    if (!file) return setError('Choose a file first.')
    if (!faculty) return setError('Choose the faculty this sheet belongs to.')
    setError(''); setPhase('extracting'); setStep(0)
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 2500)
    try {
      const { students, warnings: w } = await extractMarks(file, { faculty, knownCourses, note })
      if (!students.length) throw new Error('No trainees were found in this file.')
      const allCourses = [...new Set(students.flatMap(s => Object.keys(s.marks)))]
      setCourses(allCourses)
      setRows(students.map((s, i) => ({ ...s, key: i, include: true, gender: s.gender || 'Male' })))
      setWarnings(w)
      setPhase('review')
      toast.success(`Found ${students.length} trainees and ${allCourses.length} courses. Review before saving.`)
    } catch (err) {
      console.error(err)
      setError(aiErrorMessage(err))
      setPhase('upload')
    } finally {
      clearInterval(timer)
    }
  }

  const update = (key, patch) => setRows(rs => rs.map(r => r.key === key ? { ...r, ...patch } : r))
  const setScore = (key, course, value) => setRows(rs => rs.map(r => r.key === key ? { ...r, marks: { ...r.marks, [course]: value } } : r))
  const removeCourse = c => { setCourses(cs => cs.filter(x => x !== c)); setRows(rs => rs.map(r => { const m = { ...r.marks }; delete m[c]; return { ...r, marks: m } })) }
  const renameCourse = (oldName, newName) => {
    const n = newName.trim().toUpperCase()
    if (!n || n === oldName) return
    setCourses(cs => cs.map(c => c === oldName ? n : c))
    setRows(rs => rs.map(r => { const m = { ...r.marks }; if (oldName in m) { m[n] = m[oldName]; delete m[oldName] } return { ...r, marks: m } }))
  }
  const addRow = () => setRows(rs => [...rs, { key: Date.now(), include: true, firstName: '', lastName: '', regNumber: '', gender: 'Male', marks: {} }])

  const problems = r => {
    const p = []
    if (!r.firstName || !r.lastName) p.push('Name missing')
    if (!r.regNumber) p.push('Reg number missing')
    const scored = courses.filter(c => r.marks[c] !== undefined && r.marks[c] !== '')
    if (!scored.length) p.push('No scores')
    if (scored.some(c => toScore(r.marks[c]) === null || Number(r.marks[c]) > 100 || Number(r.marks[c]) < 0)) p.push('Score out of range')
    return p
  }

  const included = rows.filter(r => r.include)
  const blocking = included.filter(r => problems(r).length)
  const updates = included.filter(r => existingByReg.has(r.regNumber))

  const deploy = async () => {
    if (blocking.length) return toast.error(`Fix ${blocking.length} highlighted row(s) or untick them first.`)
    const ok = await confirm({
      title: `Save ${included.length} records to ${faculty}?`,
      message: <>
        <p>{included.length - updates.length} new record(s) will be created{updates.length ? <> and <strong>{updates.length}</strong> existing record(s) updated (new course scores are merged in)</> : ''}.</p>
        <p className="mt-2">Trainees can see these marks on the public marks page straight away.</p>
      </>,
      confirmLabel: 'Save records', tone: 'info',
    })
    if (!ok) return
    setPhase('deploying')
    const now = new Date().toISOString()
    const scopeList = expandScope(faculties, [faculty])
    try {
      let created = 0, updated = 0
      for (let i = 0; i < included.length; i += 400) {
        const batch = writeBatch(db)
        included.slice(i, i + 400).forEach(r => {
          const prev = existingByReg.get(r.regNumber)
          const merged = { ...(prev?.marks || {}) }
          courses.forEach(c => { if (r.marks[c] !== undefined && r.marks[c] !== '') merged[c] = r.marks[c] })
          const data = {
            firstName: r.firstName.trim(), lastName: r.lastName.trim(), regNumber: r.regNumber,
            gender: r.gender, faculty, faculties: scopeList, institution,
            ...buildMarkRecord({ marks: merged }, Object.keys(merged)),
            updatedAt: now, importedFrom: file?.name || 'AI import',
          }
          if (prev) { batch.update(doc(db, 'marks', prev.id), data); updated++ }
          else { batch.set(doc(collection(db, 'marks')), { ...data, createdAt: now }); created++ }
        })
        await batch.commit()
      }
      setResult({ created, updated })
      setPhase('done')
      toast.success(`Saved: ${created} created, ${updated} updated.`, { title: 'Marks deployed' })
    } catch (err) {
      toast.fail(err, 'The records could not be saved. Nothing was partially lost — try again.')
      setPhase('review')
    }
  }

  const reset = () => { setFile(null); setRows([]); setCourses([]); setWarnings([]); setResult(null); setPhase('upload'); setNote('') }

  return (
    <div className="space-y-8">
      <PageHeader title="Import marks" accent="with AI" subtitle="Upload a marks sheet (PDF, photo, Word or Excel). Gemini extracts the marks, you review and correct them, then save.">
        <Link to="/marks" className="btn-ghost border border-white/10"><ArrowLeft size={16} /> Back to marks</Link>
      </PageHeader>

      <AnimatePresence mode="wait">
        {(phase === 'upload' || phase === 'extracting') && (
          <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <label
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files?.[0]) }}
                className={`card relative flex flex-col items-center justify-center text-center p-10 min-h-[320px] cursor-pointer border-2 border-dashed transition-all ${dragging ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-white/15 hover:border-accent/50'}`}
              >
                <input ref={inputRef} type="file" accept={ACCEPTED} className="sr-only" onChange={e => pickFile(e.target.files?.[0])} />
                {phase === 'extracting' ? (
                  <div className="space-y-6" role="status" aria-live="polite">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
                      className="w-20 h-20 rounded-full border-2 border-accent/20 border-t-accent mx-auto flex items-center justify-center">
                      <Sparkles className="text-accent" size={28} />
                    </motion.div>
                    <div className="space-y-2">
                      {STEPS.map((s, i) => (
                        <motion.p key={s} initial={{ opacity: 0.3 }} animate={{ opacity: i <= step ? 1 : 0.35 }} className="flex items-center justify-center gap-2 text-sm">
                          {i < step ? <CheckCircle2 size={16} className="text-accent" /> : i === step ? <Loader2 size={16} className="animate-spin text-accent" /> : <span className="w-4" />}
                          {s}
                        </motion.p>
                      ))}
                    </div>
                  </div>
                ) : file ? (
                  <>
                    <FileText size={44} className="text-accent mb-4" />
                    <p className="font-semibold text-lg break-all">{file.name}</p>
                    <p className="text-sm text-muted mt-1">{(file.size / 1024).toFixed(0)} KB · click or drop to replace</p>
                    <button type="button" onClick={e => { e.preventDefault(); setFile(null) }} className="btn-ghost mt-4"><X size={16} /> Remove</button>
                  </>
                ) : (
                  <>
                    <UploadCloud size={48} className="text-accent mb-4" />
                    <p className="font-display font-semibold text-xl">Drop a marks sheet here</p>
                    <p className="text-muted mt-2">or click to choose a file</p>
                    <p className="text-sm text-subtle mt-4">PDF, JPG/PNG photo, Word (.docx), Excel (.xlsx, .xls, .csv) · up to 15 MB</p>
                  </>
                )}
              </label>
            </div>

            <div className="lg:col-span-2 card p-6 space-y-5">
              <SelectField label="Faculty or department" options={scope.length ? scope : [{ value: '', label: 'No faculties assigned' }]}
                value={faculty} onChange={e => setFaculty(e.target.value)} hint={`${existing.length} existing records in this faculty`} />
              <SelectField label="Institution" options={institutions.length ? institutions.map(i => i.name) : ['NAD CLASS']}
                value={institution} onChange={e => setInstitution(e.target.value)} />
              <div>
                <label htmlFor="ai-note" className="field-label">Notes for the AI (optional)</label>
                <textarea id="ai-note" rows={3} className="field-input" placeholder="e.g. Exam scores are out of 50. Ignore the 'Attendance' column."
                  value={note} onChange={e => setNote(e.target.value)} />
              </div>
              {error && <Alert>{error}</Alert>}
              <button onClick={runExtraction} disabled={phase === 'extracting' || !file} className="btn-primary w-full py-3.5">
                <Sparkles size={18} /> {phase === 'extracting' ? 'Extracting…' : 'Extract marks'}
              </button>
              <p className="text-xs text-subtle leading-relaxed">The file is sent to Google Gemini through Firebase only to read the marks. Nothing is saved until you press <em>Save records</em>.</p>
            </div>
          </motion.div>
        )}

        {(phase === 'review' || phase === 'deploying') && (
          <motion.div key="review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-6">
            <div className="grid sm:grid-cols-4 gap-4">
              {[
                ['Trainees found', rows.length],
                ['Will be saved', included.length],
                ['Update existing', updates.length],
                ['Need attention', blocking.length],
              ].map(([l, v], i) => (
                <motion.div key={l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}
                  className={`card p-5 ${l === 'Need attention' && v ? 'border-amber-400/40' : ''}`}>
                  <p className="text-sm text-muted">{l}</p>
                  <p className={`text-3xl font-display font-bold mt-1 ${l === 'Need attention' && v ? 'text-amber-300' : ''}`}>{v}</p>
                </motion.div>
              ))}
            </div>

            {warnings.length > 0 && (
              <div className="card p-5 border-amber-400/30">
                <p className="font-semibold flex items-center gap-2 text-amber-200 mb-2"><AlertTriangle size={18} /> The AI flagged {warnings.length} thing(s) to check</p>
                <ul className="list-disc pl-6 text-sm text-muted space-y-1">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
            )}

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.04] text-left text-muted">
                      <th scope="col" className="p-3 pl-5 w-10"><span className="sr-only">Include</span></th>
                      <th scope="col" className="p-3 min-w-[140px]">First name</th>
                      <th scope="col" className="p-3 min-w-[140px]">Last name</th>
                      <th scope="col" className="p-3 min-w-[140px]">Reg number</th>
                      <th scope="col" className="p-3">Gender</th>
                      {courses.map(c => (
                        <th scope="col" key={c} className="p-3 min-w-[120px]">
                          <div className="flex items-center gap-1">
                            <input aria-label={`Rename course ${c}`} defaultValue={c} onBlur={e => renameCourse(c, e.target.value)}
                              className="bg-transparent border-b border-dashed border-white/20 focus:border-accent outline-none w-full font-semibold text-ink uppercase" />
                            <button onClick={() => removeCourse(c)} aria-label={`Remove course ${c}`} className="p-1 text-subtle hover:text-red-300"><X size={14} /></button>
                          </div>
                        </th>
                      ))}
                      <th scope="col" className="p-3 text-center">Avg / grade</th>
                      <th scope="col" className="p-3 pr-5"><span className="sr-only">Remove</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const p = problems(r)
                      const s = summarise(Object.fromEntries(courses.filter(c => r.marks[c] !== undefined && r.marks[c] !== '').map(c => [c, r.marks[c]])))
                      const isUpdate = existingByReg.has(r.regNumber)
                      const cell = 'w-full bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent'
                      return (
                        <motion.tr key={r.key} initial={{ opacity: 0 }} animate={{ opacity: r.include ? 1 : 0.45, transition: { delay: Math.min(i * 0.02, 0.5) } }}
                          className={`border-t border-white/5 ${r.include && p.length ? 'bg-amber-400/[0.06]' : ''}`}>
                          <td className="p-3 pl-5"><input type="checkbox" aria-label={`Include ${r.firstName} ${r.lastName}`} className="accent-accent w-4 h-4" checked={r.include} onChange={e => update(r.key, { include: e.target.checked })} /></td>
                          <td className="p-3"><input aria-label="First name" className={cell} value={r.firstName} onChange={e => update(r.key, { firstName: e.target.value })} /></td>
                          <td className="p-3"><input aria-label="Last name" className={cell} value={r.lastName} onChange={e => update(r.key, { lastName: e.target.value })} /></td>
                          <td className="p-3">
                            <input aria-label="Registration number" className={`${cell} font-mono uppercase`} value={r.regNumber} onChange={e => update(r.key, { regNumber: e.target.value.replace(/\s+/g, '').toUpperCase() })} />
                            {isUpdate && <p className="text-xs text-accent mt-1">Updates existing record</p>}
                          </td>
                          <td className="p-3">
                            <select aria-label="Gender" className={cell} value={r.gender} onChange={e => update(r.key, { gender: e.target.value })}>
                              <option className="bg-surface">Male</option><option className="bg-surface">Female</option>
                            </select>
                          </td>
                          {courses.map(c => {
                            const v = r.marks[c]
                            const bad = v !== undefined && v !== '' && (toScore(v) === null || Number(v) > 100 || Number(v) < 0)
                            return (
                              <td key={c} className="p-3">
                                <input aria-label={`${c} score for ${r.firstName}`} type="number" step="0.01" min="0" max="100" inputMode="decimal"
                                  className={`${cell} text-right ${bad ? 'border-red-400 text-red-200' : ''}`} value={v ?? ''} placeholder="—"
                                  onChange={e => setScore(r.key, c, e.target.value)} />
                              </td>
                            )
                          })}
                          <td className="p-3 text-center whitespace-nowrap">
                            {s.total ? <><span className="font-bold text-accent">{s.average.toFixed(1)}%</span> <span className="text-muted">{calculateGrade(s.average)}</span></> : '—'}
                            {r.include && p.length > 0 && <p className="text-xs text-amber-300 mt-1">{p.join(' · ')}</p>}
                          </td>
                          <td className="p-3 pr-5"><button onClick={() => setRows(rs => rs.filter(x => x.key !== r.key))} aria-label="Remove row" className="p-1.5 text-subtle hover:text-red-300"><Trash2 size={16} /></button></td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-white/5"><button onClick={addRow} className="btn-ghost"><Plus size={16} /> Add a trainee manually</button></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <button onClick={reset} className="btn-ghost border border-white/10"><RotateCcw size={16} /> Start over</button>
              <button onClick={deploy} disabled={phase === 'deploying' || !included.length} className="btn-primary px-8 py-3.5">
                <Rocket size={18} /> {phase === 'deploying' ? 'Saving…' : `Save ${included.length} records`}
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'done' && result && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card p-12 text-center max-w-xl mx-auto">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} /></motion.div>
            <h2 className="text-2xl font-display font-bold mb-2">Marks saved</h2>
            <p className="text-muted mb-8">{result.created} new record(s) created and {result.updated} updated in {faculty}.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/marks" className="btn-primary">View marks</Link>
              <button onClick={reset} className="btn-outline">Import another file</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
