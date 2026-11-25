import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserCircle2, Mail, IdCard, Building2, GraduationCap, BookOpen, Download, LogIn, UserPlus, Search, LogOut, Loader2 } from 'lucide-react'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import PublicLayout from '../../layouts/PublicLayout'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '@shared/ui/feedback'
import { asList } from '@shared/lib/faculties'
import { cumulative, summarise } from '@shared/lib/grading'
import VerifyEmailCard from '../../components/VerifyEmailCard'

export default function Account() {
  const { currentUser, userData, logout } = useAuth()
  const toast = useToast()
  const [records, setRecords] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!userData?.regNumber) { setRecords([]); return }
    getDocs(query(collection(db, 'marks'), where('regNumber', '==', userData.regNumber.toUpperCase()), limit(50)))
      .then(s => setRecords(s.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => setRecords([]))
  }, [userData?.regNumber])

  if (!currentUser) {
    return (
      <PublicLayout>
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-10 sm:p-12">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent mx-auto mb-6">
              <UserCircle2 size={40} aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-3">You're not signed in</h1>
            <p className="text-muted mb-8">Don't have an account yet? Create one to open your faculty's materials. You can still check marks without an account.</p>
            <div className="flex flex-col gap-3">
              <Link to="/register" className="btn-primary py-3.5"><UserPlus size={18} /> Create an account</Link>
              <Link to="/login" state={{ from: '/account' }} className="btn-outline py-3.5"><LogIn size={18} /> Log in</Link>
              <Link to="/marks" className="btn-ghost py-3"><Search size={16} /> Check marks without an account</Link>
            </div>
          </motion.div>
        </div>
      </PublicLayout>
    )
  }

  if (!currentUser.emailVerified) {
    return <PublicLayout><div className="max-w-2xl mx-auto px-6 py-20"><VerifyEmailCard /></div></PublicLayout>
  }

  if (!userData) {
    return (
      <PublicLayout>
        <div className="max-w-xl mx-auto px-6 py-24 text-center card p-10">
          <h1 className="text-2xl font-display font-bold mb-3">No trainee profile found</h1>
          <p className="text-muted mb-8">You're signed in as {currentUser.email}, but this account has no trainee profile. Contact the eNOTA team, or log out and register again.</p>
          <button onClick={logout} className="btn-outline"><LogOut size={16} /> Log out</button>
        </div>
      </PublicLayout>
    )
  }

  const cum = records?.length ? cumulative(records) : null
  const info = [
    [Mail, 'Email', currentUser.email],
    [IdCard, 'Registration number', userData?.regNumber || '—'],
    [GraduationCap, 'Faculties & departments', asList(userData?.faculty).join(', ') || '—'],
    [Building2, 'Institution', userData?.institution || '—'],
  ]

  const download = async () => {
    setDownloading(true)
    try { await (await import('@shared/lib/transcript')).downloadTranscript(records) } catch (err) { toast.fail(err, 'Could not create the transcript.') } finally { setDownloading(false) }
  }

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-12 py-14 sm:py-20 space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-accent font-semibold mb-1">My account</p>
            <h1 className="text-4xl font-display font-extrabold">Hello, {userData?.firstName || 'trainee'}</h1>
          </div>
          <button onClick={logout} className="btn-ghost border border-white/10 self-start sm:self-auto"><LogOut size={16} /> Log out</button>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }} className="card p-7 lg:col-span-2 space-y-5" aria-label="Profile">
            <div className="flex items-center gap-4 pb-5 border-b border-white/10">
              <div className="w-14 h-14 rounded-2xl bg-primary/50 border border-accent/30 flex items-center justify-center text-accent font-display font-bold text-xl">
                {(userData?.firstName?.[0] || '') + (userData?.lastName?.[0] || '')}
              </div>
              <div>
                <p className="font-display font-bold text-lg">{userData?.firstName} {userData?.lastName}</p>
                <p className="text-sm text-subtle">Trainee</p>
              </div>
            </div>
            <dl className="space-y-4">
              {info.map(([Icon, label, value]) => (
                <div key={label} className="flex gap-3">
                  <Icon size={18} className="text-accent mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-sm text-subtle">{label}</dt>
                    <dd className="font-medium break-words">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <p className="text-sm text-subtle">To correct your faculty, institution or registration number, contact the eNOTA team.</p>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.12 } }} className="card p-7 lg:col-span-3" aria-label="Results">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-display font-bold">My results</h2>
              {records?.length > 0 && (
                <button onClick={download} disabled={downloading} className="btn-primary py-2.5">
                  {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Transcript
                </button>
              )}
            </div>
            {records === null ? (
              <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="skeleton h-14" />)}</div>
            ) : records.length === 0 ? (
              <p className="text-muted">No results have been published for <span className="font-mono text-ink">{userData?.regNumber || 'your registration number'}</span> yet. They'll appear here as soon as your trainer submits them.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[['Cumulative', `${cum.average.toFixed(1)}%`], ['Grade', cum.grade], ['Passed', `${cum.passed}/${cum.courses}`]].map(([l, v]) => (
                    <div key={l} className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-center">
                      <p className="text-sm text-muted">{l}</p>
                      <p className="text-2xl font-display font-bold text-accent">{v}</p>
                    </div>
                  ))}
                </div>
                <ul className="space-y-3">
                  {records.map(r => {
                    const s = summarise(r.marks)
                    return (
                      <li key={r.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-white/10">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{r.faculty}</p>
                          <p className="text-sm text-subtle">{s.total} courses · {s.passed} passed</p>
                        </div>
                        <span className="px-3 py-1 rounded-lg bg-accent/10 text-accent font-bold shrink-0">{s.average.toFixed(1)}% · {s.grade}</span>
                      </li>
                    )
                  })}
                </ul>
                <Link to={`/marks?reg=${encodeURIComponent(userData?.regNumber || '')}`} className="inline-block mt-5 text-accent font-semibold hover:underline">See full course results →</Link>
              </>
            )}
          </motion.section>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>
          <Link to="/materials" className="card p-6 flex items-center gap-4 hover:border-accent/40 transition-colors group">
            <BookOpen className="text-accent" size={26} aria-hidden="true" />
            <div className="flex-1">
              <p className="font-display font-bold text-lg">Course materials</p>
              <p className="text-muted">Handouts, videos and exercises for your faculties and departments.</p>
            </div>
            <span className="text-accent group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
          </Link>
        </motion.div>
      </div>
    </PublicLayout>
  )
}
