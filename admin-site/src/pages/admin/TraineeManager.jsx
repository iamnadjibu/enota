import React, { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { Search, X, Users, Trash2, RotateCcw, Ban, Mail, Download } from 'lucide-react'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { useToast, useConfirm } from '@shared/ui/feedback'
import { asList } from '@shared/lib/faculties'
import { toCSV, downloadCSV } from '@shared/lib/csv'
import { removeAccount, reviveAccount, fullName } from '../../lib/accounts'
import { PageHeader, EmptyState, TableSkeleton, Pagination, usePagination } from '../../components/ui'

export default function TraineeManager() {
  const { isSuperAdmin, userData, currentUser } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [trainees, setTrainees] = useState([])
  const [removed, setRemoved] = useState([])
  const [showRemoved, setShowRemoved] = useState(false)
  const [search, setSearch] = useState('')
  const [facultyFilter, setFacultyFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  // Faculty admins query by their own faculties; "scope" also covers
  // trainees registered under one of those faculties' departments.
  const myFaculties = useMemo(() => asList(userData?.faculty).slice(0, 30), [userData?.faculty])

  useEffect(() => {
    const accept = docs => docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.role === 'student')
    const sort = list => list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

    if (isSuperAdmin) {
      return onSnapshot(query(collection(db, 'users'), where('role', '==', 'student')),
        snap => { setTrainees(sort(accept(snap.docs))); setLoading(false) },
        err => { toast.fail(err, 'Could not load trainees.'); setLoading(false) })
    }
    if (!myFaculties.length) { setLoading(false); return }

    const parts = { scope: [], faculty: [] }
    const merge = () => {
      const byId = new Map()
      ;[...parts.scope, ...parts.faculty].forEach(u => byId.set(u.id, u))
      setTrainees(sort([...byId.values()]))
      setLoading(false)
    }
    const subs = ['scope', 'faculty'].map(field => onSnapshot(
      query(collection(db, 'users'), where(field, 'array-contains-any', myFaculties)),
      snap => { parts[field] = accept(snap.docs); merge() },
      err => { toast.fail(err, 'Could not load trainees.'); setLoading(false) },
    ))
    return () => subs.forEach(u => u())
  }, [isSuperAdmin, myFaculties.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isSuperAdmin) return
    return onSnapshot(query(collection(db, 'blacklist'), where('role', '==', 'student')),
      snap => setRemoved(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {})
  }, [isSuperAdmin])

  const facultyOptions = useMemo(() => {
    const set = new Set()
    trainees.forEach(t => asList(t.faculty).forEach(f => set.add(f)))
    return ['All', ...[...set].sort()]
  }, [trainees])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = showRemoved ? removed.map(r => ({ ...(r.profile || {}), ...r, id: r.uid, _entry: r })) : trainees
    return list.filter(t => {
      if (facultyFilter !== 'All' && !asList(t.faculty).includes(facultyFilter)) return false
      if (!q) return true
      return [fullName(t), t.email, t.regNumber, asList(t.faculty).join(' '), t.institution]
        .join(' ').toLowerCase().includes(q)
    })
  }, [trainees, removed, showRemoved, search, facultyFilter])

  const pager = usePagination(filtered, 25)

  const remove = async t => {
    const ok = await confirm({
      title: `Remove ${fullName(t)}?`,
      message: <>Their profile is deleted and the account is <strong>blacklisted</strong>: they can't sign in again unless you revive them. Their marks records are kept.</>,
      confirmLabel: 'Remove and blacklist',
    })
    if (!ok) return
    try { await removeAccount(t, currentUser.email); toast.success(`${fullName(t)} was removed.`) }
    catch (err) { toast.fail(err, 'Could not remove this trainee.') }
  }
  const revive = async t => {
    try { await reviveAccount(t._entry); toast.success(`${fullName(t)} has been revived.`) }
    catch (err) { toast.fail(err, 'Could not revive this trainee.') }
  }

  const exportCsv = () => {
    const rows = filtered.map(t => ({
      'First name': t.firstName, 'Last name': t.lastName, 'Reg number': t.regNumber, Email: t.email,
      Gender: t.gender, Faculties: asList(t.faculty).join('; '), Institution: t.institution, Joined: (t.createdAt || '').slice(0, 10),
    }))
    downloadCSV(toCSV(rows), `eNOTA_Trainees_${new Date().toISOString().slice(0, 10)}.csv`)
    toast.success(`Exported ${rows.length} trainees.`)
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Trainee" accent="Manager"
        subtitle={isSuperAdmin ? 'Every trainee registered on eNOTA Portal.' : 'Trainees in your faculties and departments.'}>
        <button onClick={exportCsv} disabled={!filtered.length} className="btn-outline"><Download size={16} /> Export CSV</button>
      </PageHeader>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Trainees', value: trainees.length },
          { label: 'Faculties represented', value: facultyOptions.length - 1 },
          { label: 'Joined in the last 30 days', value: trainees.filter(t => t.createdAt && Date.now() - new Date(t.createdAt) < 30 * 864e5).length },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08 } }} className="card p-5">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="text-3xl font-display font-bold mt-1">{loading ? '—' : s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" size={18} aria-hidden="true" />
          <input type="search" aria-label="Search trainees" placeholder="Search name, email, reg number or faculty"
            value={search} onChange={e => setSearch(e.target.value)} className="field-input pl-12 pr-10 py-3" />
          {search && <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-subtle hover:text-ink"><X size={16} /></button>}
        </div>
        <select aria-label="Filter by faculty" value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)} className="field-input lg:max-w-xs py-3">
          {facultyOptions.map(f => <option key={f} value={f} className="bg-surface">{f === 'All' ? 'All faculties' : f}</option>)}
        </select>
        {isSuperAdmin && (
          <button onClick={() => setShowRemoved(s => !s)} aria-pressed={showRemoved}
            className={`btn-ghost border ${showRemoved ? 'border-red-400/40 text-red-200' : 'border-white/10'}`}>
            <Ban size={16} /> Removed ({removed.length})
          </button>
        )}
      </div>

      {loading ? <TableSkeleton /> : filtered.length === 0 ? (
        <EmptyState icon={Users} title={search ? 'No matches' : showRemoved ? 'No removed trainees' : 'No trainees yet'}
          text={search ? `Nobody matches “${search}”.` : 'Trainees appear here after they register on the public site.'} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="bg-white/[0.04] text-left text-sm text-muted">
                  <th scope="col" className="p-4 pl-6 font-semibold">Trainee</th>
                  <th scope="col" className="p-4 font-semibold">Reg number</th>
                  <th scope="col" className="p-4 font-semibold">Faculties</th>
                  <th scope="col" className="p-4 font-semibold">Joined</th>
                  {isSuperAdmin && <th scope="col" className="p-4 pr-6 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {pager.slice.map((t, i) => (
                  <motion.tr key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.03, 0.4) } }}
                    className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="p-4 pl-6">
                      <p className="font-semibold">{fullName(t)}</p>
                      <a href={`mailto:${t.email}`} className="text-sm text-subtle hover:text-accent inline-flex items-center gap-1"><Mail size={12} />{t.email}</a>
                    </td>
                    <td className="p-4 font-mono text-sm">{t.regNumber || '—'}</td>
                    <td className="p-4 text-sm">
                      <div className="flex flex-wrap gap-1.5">
                        {asList(t.faculty).map(f => <span key={f} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">{f}</span>)}
                      </div>
                      <p className="text-subtle text-xs mt-1">{t.institution}</p>
                    </td>
                    <td className="p-4 text-sm text-muted">{(showRemoved ? t._entry?.removedAt : t.createdAt)?.slice(0, 10) || '—'}</td>
                    {isSuperAdmin && (
                      <td className="p-4 pr-6 text-right">
                        {showRemoved
                          ? <button onClick={() => revive(t)} className="p-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-background" aria-label={`Revive ${fullName(t)}`} title="Revive"><RotateCcw size={18} /></button>
                          : <button onClick={() => remove(t)} className="p-2.5 rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white" aria-label={`Remove ${fullName(t)}`} title="Remove"><Trash2 size={18} /></button>}
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4"><Pagination {...pager} label="trainees" /></div>
        </div>
      )}
    </div>
  )
}
