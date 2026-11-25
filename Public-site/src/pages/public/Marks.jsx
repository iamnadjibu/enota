import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import {
  Search, Download, AlertCircle, User, GraduationCap, Building2, CheckCircle2, XCircle, HelpCircle, MessageCircle, Award, Loader2,
} from 'lucide-react'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '../../firebase'
import PublicLayout from '../../layouts/PublicLayout'
import { useToast } from '@shared/ui/feedback'
import { TextField, SelectField } from '@shared/ui/forms'
import { useFaculties, useInstitutions } from '@shared/lib/useCatalog'
import { summarise, cumulative, gradeComment, gradeLabel, PASS_MARK } from '@shared/lib/grading'

const normalise = v => v.replace(/\s+/g, '').toUpperCase()

function ScoreBar({ score }) {
  const pass = score >= PASS_MARK
  return (
    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden" aria-hidden="true">
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(2, score)}%` }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full rounded-full ${pass ? 'bg-gradient-to-r from-primary-light to-accent' : 'bg-red-400'}`} />
    </div>
  )
}

export default function Marks() {
  const [params, setParams] = useSearchParams()
  const [regNumber, setRegNumber] = useState(params.get('reg') || '')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null) // null = not searched
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [showClaim, setShowClaim] = useState(false)
  const toast = useToast()

  const search = async (raw) => {
    const reg = normalise(raw)
    if (!reg) return
    setLoading(true); setError(''); setShowClaim(false)
    try {
      const snap = await getDocs(query(collection(db, 'marks'), where('regNumber', '==', reg), limit(50)))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
      setResults(list)
      setParams(list.length ? { reg } : {}, { replace: true })
    } catch (err) {
      console.error(err)
      setError('We could not reach the results service. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (params.get('reg')) search(params.get('reg')) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = e => { e.preventDefault(); search(regNumber) }

  const cum = useMemo(() => results?.length ? cumulative(results) : null, [results])
  const person = results?.[0]

  const download = async () => {
    setDownloading(true)
    try { await (await import('@shared/lib/transcript')).downloadTranscript(results); toast.success('Transcript downloaded.') }
    catch (err) { toast.fail(err, 'The transcript could not be created. Please try again.') }
    finally { setDownloading(false) }
  }

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-12 py-14 sm:py-20">
        <div className="text-center mb-10">
          <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-display font-extrabold mb-4 tracking-tight">
            Check your <span className="text-accent">marks</span>
          </motion.h1>
          <p className="text-muted text-lg">Enter a registration number to see results and download the official transcript.</p>
        </div>

        <form onSubmit={onSubmit} className="max-w-2xl mx-auto mb-14" role="search">
          <label htmlFor="reg" className="sr-only">Registration number</label>
          <div className="flex items-center glass p-2 rounded-full focus-within:border-accent/60 transition-colors">
            <Search className="ml-3 sm:ml-4 text-subtle shrink-0" size={22} aria-hidden="true" />
            <input id="reg" type="text" required autoComplete="off" autoCapitalize="characters" spellCheck="false"
              value={regNumber} onChange={e => setRegNumber(e.target.value.toUpperCase())}
              placeholder="e.g. KSP0101998" aria-describedby="reg-hint"
              className="w-full min-w-0 bg-transparent border-none py-3.5 px-3 sm:px-4 text-lg text-ink focus:outline-none placeholder:text-subtle font-mono tracking-wide" />
            <button disabled={loading} className="btn-primary py-3 px-6 sm:px-8 shrink-0">
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
            </button>
          </div>
          <p id="reg-hint" className="text-sm text-subtle text-center mt-3">Spaces are ignored. Parents and partners can search too — no account needed.</p>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div key="err" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              role="alert" className="max-w-2xl mx-auto bg-red-500/10 border border-red-400/30 p-5 rounded-2xl text-red-200 flex items-center gap-3">
              <AlertCircle size={22} /> {error}
            </motion.div>
          )}

          {results && results.length === 0 && !error && (
            <motion.div key="none" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto space-y-6">
              <div className="card p-7 sm:p-8">
                <div className="flex items-start gap-4">
                  <HelpCircle className="text-amber-300 shrink-0 mt-1" size={26} aria-hidden="true" />
                  <div>
                    <h2 className="text-xl font-display font-bold mb-2">No results for “{normalise(regNumber)}”</h2>
                    <p className="text-muted mb-4">Before contacting us, please check:</p>
                    <ul className="space-y-2 text-ink/90">
                      <li>• The number matches your enrolment card exactly (e.g. <span className="font-mono text-accent">KSP0101998</span>).</li>
                      <li>• You typed the digit <span className="font-mono">0</span>, not the letter <span className="font-mono">O</span>, and <span className="font-mono">1</span>, not <span className="font-mono">I</span>.</li>
                      <li>• Your results may not be published yet — marks appear after your trainer submits them.</li>
                    </ul>
                  </div>
                </div>
              </div>
              {!showClaim ? (
                <div className="text-center">
                  <p className="text-muted mb-3">Still can't find your results?</p>
                  <button onClick={() => setShowClaim(true)} className="btn-outline"><MessageCircle size={18} /> Ask the eNOTA team</button>
                </div>
              ) : <ClaimForm reg={normalise(regNumber)} />}
            </motion.div>
          )}

          {results && results.length > 0 && (
            <motion.div key="res" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Trainee summary */}
              <div className="card p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-16 h-16 rounded-2xl bg-primary/50 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                    <User size={30} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl font-display font-bold truncate">{person.firstName} {person.lastName}</h2>
                    <p className="text-muted font-mono">{person.regNumber}</p>
                    <p className="text-sm text-subtle mt-1">{results.length} programme{results.length > 1 ? 's' : ''} · {[...new Set(results.map(r => r.institution).filter(Boolean))].join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted">Cumulative</p>
                    <p className="text-3xl font-display font-bold text-accent">{cum.average.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted">Grade</p>
                    <p className={`text-3xl font-display font-bold ${cum.grade === 'F' ? 'text-red-300' : 'text-ink'}`}>{cum.grade}</p>
                  </div>
                </div>
                <button onClick={download} disabled={downloading} className="btn-primary px-6 py-3.5 md:ml-2">
                  {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} Transcript (PDF)
                </button>
              </div>

              <p className="flex items-start gap-3 text-muted bg-accent/5 border border-accent/15 rounded-2xl p-4">
                <Award className="text-accent shrink-0 mt-0.5" size={20} aria-hidden="true" />
                <span><span className="text-ink font-semibold">{gradeLabel(cum.grade)}.</span> {gradeComment(cum.grade)}</span>
              </p>

              {/* One card per faculty */}
              {results.map((r, idx) => {
                const s = summarise(r.marks)
                return (
                  <motion.section key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + idx * 0.1 } }}
                    className="card overflow-hidden" aria-labelledby={`fac-${r.id}`}>
                    <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="text-accent" size={22} aria-hidden="true" />
                        <div>
                          <h3 id={`fac-${r.id}`} className="font-display font-bold text-lg">{r.faculty || 'General programme'}</h3>
                          <p className="text-sm text-subtle flex items-center gap-1"><Building2 size={13} aria-hidden="true" /> {r.institution}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted">{s.passed}/{s.total} passed</span>
                        <span className="px-3 py-1 rounded-lg bg-accent/10 text-accent font-bold">{s.average.toFixed(1)}% · {s.grade}</span>
                      </div>
                    </div>
                    <ul className="divide-y divide-white/5">
                      {s.courses.map(c => (
                        <li key={c.course} className="p-5 sm:px-6 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_200px_auto] items-center gap-x-6 gap-y-2">
                          <p className="font-medium">{c.course}</p>
                          <div className="hidden sm:block"><ScoreBar score={c.score ?? 0} /></div>
                          <div className="flex items-center gap-3 justify-end">
                            <span className="font-mono font-semibold w-16 text-right">{c.score === null ? '—' : `${c.score}%`}</span>
                            <span className={`w-10 text-center font-bold ${c.passed ? 'text-accent' : 'text-red-300'}`}>{c.grade}</span>
                            {c.passed
                              ? <CheckCircle2 size={18} className="text-accent" aria-label="Passed" />
                              : <XCircle size={18} className="text-red-300" aria-label="Not passed" />}
                          </div>
                          <div className="col-span-2 sm:hidden"><ScoreBar score={c.score ?? 0} /></div>
                        </li>
                      ))}
                    </ul>
                  </motion.section>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicLayout>
  )
}

function ClaimForm({ reg }) {
  const { faculties } = useFaculties()
  const institutions = useInstitutions()
  const [d, setD] = useState({ firstName: '', lastName: '', regNumber: reg, gender: 'Male', faculty: '', institution: '' })
  const set = (k, v) => setD(x => ({ ...x, [k]: v }))

  const submit = e => {
    e.preventDefault()
    const text = [
      'Hello eNOTA team, I could not find my results on the portal.',
      '',
      `First name: ${d.firstName}`, `Last name: ${d.lastName}`, `Reg number: ${d.regNumber}`,
      `Gender: ${d.gender}`, `Faculty: ${d.faculty}`, `Institution: ${d.institution}`,
    ].join('\n')
    window.open(`https://wa.me/250786487234?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  return (
    <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="card p-7 sm:p-8 space-y-5">
      <div>
        <h3 className="text-xl font-display font-bold">Ask the eNOTA team</h3>
        <p className="text-muted text-sm mt-1">Send your details on WhatsApp and the team will check your enrolment.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <TextField label="First name" required value={d.firstName} onChange={e => set('firstName', e.target.value)} />
        <TextField label="Last name" required value={d.lastName} onChange={e => set('lastName', e.target.value)} />
        <TextField label="Registration number" required inputClassName="font-mono uppercase" value={d.regNumber} onChange={e => set('regNumber', e.target.value.toUpperCase())} />
        <SelectField label="Gender" options={['Male', 'Female']} value={d.gender} onChange={e => set('gender', e.target.value)} />
        <SelectField label="Faculty or department" required options={[{ value: '', label: 'Choose…' }, ...faculties.map(f => f.name)]} value={d.faculty} onChange={e => set('faculty', e.target.value)} />
        <SelectField label="Institution" required options={[{ value: '', label: 'Choose…' }, ...institutions.map(i => i.name)]} value={d.institution} onChange={e => set('institution', e.target.value)} />
      </div>
      <button type="submit" className="btn-primary w-full py-3.5"><MessageCircle size={18} /> Send on WhatsApp</button>
    </motion.form>
  )
}
