import React, { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserCheck, Clock, UserX, Ban, Search, X, CheckCircle, XCircle, Pause, Play,
  Crown, ShieldMinus, Trash2, RotateCcw, Users,
} from 'lucide-react'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { useToast, useConfirm } from '@shared/ui/feedback'
import { setStatus, setRole, removeAccount, reviveAccount, roleLabel, fullName } from '../../lib/accounts'
import { PageHeader, EmptyState, TableSkeleton } from '../../components/ui'

const TABS = [
  { id: 'active', label: 'Active', icon: UserCheck },
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'inactive', label: 'Suspended', icon: UserX },
  { id: 'removed', label: 'Removed', icon: Ban },
]

const isSuper = (u) => u.role === 'superadmin' || u.role === 'master'

export default function AdminManager() {
  const { isSuperAdmin, currentUser, superAdminUid } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [admins, setAdmins] = useState([])
  const [removed, setRemoved] = useState([])
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (!isSuperAdmin) return
    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), where('role', 'in', ['admin', 'superadmin', 'master'])),
      snap => { setAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) },
      err => { toast.fail(err, 'Could not load admins.'); setLoading(false) },
    )
    const unsubBlack = onSnapshot(
      collection(db, 'blacklist'),
      snap => setRemoved(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => b.role !== 'student')),
      () => {},
    )
    return () => { unsubUsers(); unsubBlack() }
  }, [isSuperAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => ({
    active: admins.filter(a => a.status === 'active').length,
    pending: admins.filter(a => a.status === 'pending').length,
    inactive: admins.filter(a => ['declined', 'inactive', 'suspended'].includes(a.status)).length,
    removed: removed.length,
  }), [admins, removed])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = tab === 'removed'
      ? removed.map(r => ({ ...r, ...(r.profile || {}), id: r.uid, _entry: r }))
      : admins.filter(a => tab === 'inactive'
        ? ['declined', 'inactive', 'suspended'].includes(a.status)
        : a.status === tab)
    if (!q) return list
    return list.filter(a => [fullName(a), a.email, [].concat(a.faculty || []).join(' '), a.institution]
      .join(' ').toLowerCase().includes(q))
  }, [admins, removed, tab, search])

  if (!isSuperAdmin) {
    return <EmptyState icon={Crown} title="Super Admin only" text="Only the Super Admin can approve and manage admins." />
  }

  const run = async (id, fn, success) => {
    setBusyId(id)
    try { await fn(); toast.success(success) } catch (err) { toast.fail(err, 'That change could not be saved.') } finally { setBusyId(null) }
  }

  const approve = a => run(a.id, () => setStatus(a.id, 'active'), `${fullName(a)} can now sign in as a Faculty Admin.`)
  const decline = async a => {
    if (await confirm({ title: `Decline ${fullName(a)}?`, message: 'They will not get admin access. You can re-activate them later.', confirmLabel: 'Decline' }))
      run(a.id, () => setStatus(a.id, 'declined'), `${fullName(a)}'s application was declined.`)
  }
  const suspend = async a => {
    if (await confirm({ title: `Suspend ${fullName(a)}?`, message: 'They lose admin access immediately until you re-activate them.', confirmLabel: 'Suspend' }))
      run(a.id, () => setStatus(a.id, 'suspended'), `${fullName(a)} has been suspended.`)
  }
  const reactivate = a => run(a.id, () => setStatus(a.id, 'active'), `${fullName(a)} is active again.`)
  const promote = async a => {
    if (await confirm({
      title: `Make ${fullName(a)} a Super Admin?`,
      message: 'Super Admins can approve, promote, suspend and remove every admin and trainee, and edit site settings.',
      confirmLabel: 'Promote', tone: 'info',
    })) run(a.id, () => setRole(a.id, 'superadmin'), `${fullName(a)} is now a Super Admin.`)
  }
  const demote = async a => {
    if (await confirm({ title: `Return ${fullName(a)} to Faculty Admin?`, message: 'They keep access to their own faculties only.', confirmLabel: 'Demote' }))
      run(a.id, () => setRole(a.id, 'admin'), `${fullName(a)} is now a Faculty Admin.`)
  }
  const remove = async a => {
    if (await confirm({
      title: `Remove ${fullName(a)}?`,
      message: <>Their profile is deleted and the account is <strong>blacklisted</strong>: they can't sign in to the portal again unless you revive them from the <em>Removed</em> tab.</>,
      confirmLabel: 'Remove and blacklist',
    })) run(a.id, () => removeAccount(a, currentUser.email), `${fullName(a)} was removed and blacklisted.`)
  }
  const revive = a => run(a.id, () => reviveAccount(a._entry), `${fullName(a)} has been revived.`)

  const Btn = ({ onClick, title, tone, icon: Icon, a }) => (
    <button onClick={onClick} disabled={busyId === a.id} title={title} aria-label={`${title}: ${fullName(a)}`}
      className={`p-2.5 rounded-xl transition-all disabled:opacity-40 ${tone}`}>
      <Icon size={18} />
    </button>
  )
  const tones = {
    ok: 'bg-accent/10 text-accent hover:bg-accent hover:text-background',
    warn: 'bg-amber-400/10 text-amber-300 hover:bg-amber-400 hover:text-background',
    bad: 'bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white',
    vip: 'bg-violet-400/10 text-violet-300 hover:bg-violet-400 hover:text-background',
  }

  const actions = a => {
    const self = a.id === currentUser.uid
    const founder = a.id === superAdminUid
    if (tab === 'removed') return <Btn a={a} onClick={() => revive(a)} title="Revive" icon={RotateCcw} tone={tones.ok} />
    if (self || founder) return <span className="text-xs text-subtle">{founder ? 'Founding Super Admin' : 'You'}</span>
    if (a.status === 'pending') return <>
      <Btn a={a} onClick={() => approve(a)} title="Approve" icon={CheckCircle} tone={tones.ok} />
      <Btn a={a} onClick={() => decline(a)} title="Decline" icon={XCircle} tone={tones.bad} />
    </>
    if (a.status === 'active') return <>
      {isSuper(a)
        ? <Btn a={a} onClick={() => demote(a)} title="Make Faculty Admin" icon={ShieldMinus} tone={tones.warn} />
        : <Btn a={a} onClick={() => promote(a)} title="Make Super Admin" icon={Crown} tone={tones.vip} />}
      <Btn a={a} onClick={() => suspend(a)} title="Suspend" icon={Pause} tone={tones.warn} />
      <Btn a={a} onClick={() => remove(a)} title="Remove" icon={Trash2} tone={tones.bad} />
    </>
    return <>
      <Btn a={a} onClick={() => reactivate(a)} title="Re-activate" icon={Play} tone={tones.ok} />
      <Btn a={a} onClick={() => remove(a)} title="Remove" icon={Trash2} tone={tones.bad} />
    </>
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Admin" accent="Manager" subtitle="Approve applications, promote Super Admins, and suspend or remove access." />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div role="tablist" className="flex gap-1 glass p-1 rounded-2xl overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === t.id ? 'text-white' : 'text-muted hover:text-ink'}`}>
              {tab === t.id && <motion.span layoutId="adminTab" className="absolute inset-0 bg-primary rounded-xl shadow-lg" transition={{ type: 'spring', damping: 26, stiffness: 300 }} />}
              <t.icon size={16} className="relative" />
              <span className="relative">{t.label}</span>
              {counts[t.id] > 0 && <span className={`relative text-xs px-2 py-0.5 rounded-full ${t.id === 'pending' ? 'bg-amber-400 text-background' : 'bg-white/10'}`}>{counts[t.id]}</span>}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" size={18} aria-hidden="true" />
          <input type="search" aria-label="Search admins" placeholder="Search name, email or faculty" value={search}
            onChange={e => setSearch(e.target.value)} className="field-input pl-12 pr-10 py-3" />
          {search && <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-subtle hover:text-ink"><X size={16} /></button>}
        </div>
      </div>

      {loading ? <TableSkeleton rows={5} /> : rows.length === 0 ? (
        <EmptyState icon={Users} title={search ? 'No matches' : 'Nothing here yet'}
          text={search ? `No admins match “${search}”.` : tab === 'pending' ? 'New admin applications will appear here.' : 'No admins in this list.'} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-white/[0.04] text-left text-sm text-muted">
                  <th scope="col" className="p-5 font-semibold">Name</th>
                  <th scope="col" className="p-5 font-semibold">Faculties</th>
                  <th scope="col" className="p-5 font-semibold">Role</th>
                  <th scope="col" className="p-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {rows.map((a, i) => (
                    <motion.tr key={a.id} layout
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.04, 0.4) } }} exit={{ opacity: 0, x: -20 }}
                      className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/40 border border-accent/20 flex items-center justify-center text-accent font-display font-bold text-sm shrink-0">
                            {(a.firstName?.[0] || '?')}{a.lastName?.[0] || ''}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{fullName(a)}</p>
                            <p className="text-sm text-subtle truncate">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-sm">
                        <p className="text-ink/90">{[].concat(a.faculty || []).join(', ') || '—'}</p>
                        <p className="text-subtle">{a.institution}</p>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${isSuper(a) ? 'bg-violet-400/15 text-violet-200' : 'bg-accent/10 text-accent'}`}>
                          {isSuper(a) && <Crown size={12} />}{roleLabel(a.role)}
                        </span>
                        {tab === 'removed' && <p className="text-xs text-subtle mt-1">Removed {a._entry?.removedAt?.slice(0, 10)}</p>}
                      </td>
                      <td className="p-5"><div className="flex items-center justify-end gap-2">{actions(a)}</div></td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
