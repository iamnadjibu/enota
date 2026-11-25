import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  School, Building2, Plus, Edit2, Trash2, FolderTree, CornerDownRight, RefreshCw, Layers, Crown,
} from 'lucide-react'
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { useToast, useConfirm } from '@shared/ui/feedback'
import { TextField, SelectField } from '@shared/ui/forms'
import { useFaculties, useInstitutions } from '@shared/lib/useCatalog'
import { topLevel, departmentsOf, expandScope, asList } from '@shared/lib/faculties'
import { PageHeader, EmptyState, Modal } from '../../components/ui'

export default function UniversityManager() {
  const { isSuperAdmin } = useAuth()
  const { faculties, loading } = useFaculties()
  const institutions = useInstitutions()
  const toast = useToast()
  const confirm = useConfirm()

  const [tab, setTab] = useState('faculties')
  const [modal, setModal] = useState(null) // { kind, item?, parent? }
  const [name, setName] = useState('')
  const [parent, setParent] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const tops = useMemo(() => topLevel(faculties), [faculties])
  const orphans = useMemo(() => faculties.filter(f => f.parent && !tops.some(t => t.name === f.parent)), [faculties, tops])

  if (!isSuperAdmin) return <EmptyState icon={Crown} title="Super Admin only" text="Only the Super Admin can manage faculties, departments and institutions." />

  const open = (kind, item = null, parentName = '') => {
    setModal({ kind, item })
    setName(item?.name || '')
    setParent(item?.parent ?? parentName)
  }

  const save = async e => {
    e.preventDefault()
    const n = name.trim().toUpperCase()
    if (!n) return
    const col = modal.kind === 'institution' ? 'institutions' : 'faculties'
    const list = col === 'faculties' ? faculties : institutions
    if (list.some(x => x.name.toUpperCase() === n && x.id !== modal.item?.id)) return toast.error(`“${n}” already exists.`)
    if (col === 'faculties' && parent === n) return toast.error('A faculty cannot be its own department.')
    setSaving(true)
    try {
      const data = col === 'faculties' ? { name: n, parent: parent || '' } : { name: n }
      if (modal.item) {
        await updateDoc(doc(db, col, modal.item.id), { ...data, updatedAt: serverTimestamp() })
        if (modal.item.name !== n) toast.info('Renamed. Records that used the old name keep it — update them or re-sync links if needed.', { duration: 8000 })
      } else {
        await addDoc(collection(db, col), { ...data, createdAt: serverTimestamp() })
      }
      toast.success(`${modal.kind === 'department' || parent ? 'Department' : modal.kind === 'institution' ? 'Institution' : 'Faculty'} “${n}” saved.`)
      setModal(null)
    } catch (err) {
      toast.fail(err, 'Could not save.')
    } finally { setSaving(false) }
  }

  const remove = async (col, item) => {
    const deps = col === 'faculties' ? departmentsOf(faculties, item.name) : []
    const ok = await confirm({
      title: `Delete “${item.name}”?`,
      message: deps.length
        ? `Its ${deps.length} department(s) will become standalone faculties. Existing trainees, courses and marks keep the name.`
        : 'Existing trainees, courses and marks keep the name, but it will no longer be offered in forms.',
      confirmLabel: 'Delete',
    })
    if (!ok) return
    try {
      const batch = writeBatch(db)
      deps.forEach(d => batch.update(doc(db, 'faculties', d.id), { parent: '' }))
      batch.delete(doc(db, col, item.id))
      await batch.commit()
      toast.success(`“${item.name}” deleted.`)
    } catch (err) { toast.fail(err, 'Could not delete.') }
  }

  // Recompute the faculty scope stored on courses, marks and user profiles
  // after departments are moved between faculties.
  const resync = async () => {
    const ok = await confirm({
      title: 'Re-sync faculty links?',
      message: 'Updates every course, marks record and profile so departments are linked to their current faculty. Use this after moving departments.',
      confirmLabel: 'Re-sync', tone: 'info',
    })
    if (!ok) return
    setSyncing(true)
    try {
      let changed = 0
      const same = (a, b) => a.length === b.length && a.every(x => b.includes(x))
      const jobs = []
      for (const [col, field, base] of [['courses', 'faculties', d => asList(d.faculties || d.faculty)], ['marks', 'faculties', d => asList(d.faculty)], ['users', 'scope', d => asList(d.faculty)]]) {
        const snap = await getDocs(collection(db, col))
        snap.docs.forEach(s => {
          const d = s.data()
          const wanted = expandScope(faculties, base(d))
          if (wanted.length && !same(asList(d[field]), wanted)) jobs.push([s.ref, { [field]: wanted }])
        })
      }
      for (let i = 0; i < jobs.length; i += 400) {
        const batch = writeBatch(db)
        jobs.slice(i, i + 400).forEach(([ref, data]) => batch.update(ref, data))
        await batch.commit()
        changed += Math.min(400, jobs.length - i)
      }
      toast.success(changed ? `Updated ${changed} record(s).` : 'Everything is already in sync.')
    } catch (err) { toast.fail(err, 'Re-sync stopped part-way. You can run it again safely.') } finally { setSyncing(false) }
  }

  const Row = ({ item, depth = 0 }) => (
    <motion.li layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/[0.03] hover:border-accent/30 transition-colors ${depth ? 'ml-6 sm:ml-10' : ''}`}>
      {depth ? <CornerDownRight size={18} className="text-subtle shrink-0" aria-hidden="true" /> : <School size={20} className="text-accent shrink-0" aria-hidden="true" />}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{item.name}</p>
        <p className="text-xs text-subtle">{depth ? 'Department' : `Faculty${departmentsOf(faculties, item.name).length ? ` · ${departmentsOf(faculties, item.name).length} departments` : ''}`}</p>
      </div>
      {!depth && (
        <button onClick={() => open('department', null, item.name)} className="btn-ghost text-sm hidden sm:inline-flex" aria-label={`Add department to ${item.name}`}>
          <Plus size={15} /> Department
        </button>
      )}
      <button onClick={() => open(depth ? 'department' : 'faculty', item)} className="p-2 rounded-xl text-muted hover:text-ink hover:bg-white/5" aria-label={`Edit ${item.name}`}><Edit2 size={17} /></button>
      <button onClick={() => remove('faculties', item)} className="p-2 rounded-xl text-red-300/70 hover:text-red-300 hover:bg-red-500/10" aria-label={`Delete ${item.name}`}><Trash2 size={17} /></button>
    </motion.li>
  )

  return (
    <div className="space-y-8">
      <PageHeader title="Faculties" accent="& departments" subtitle="A faculty can contain departments. A department can also be chosen on its own by trainees and admins.">
        {tab === 'faculties' && <button onClick={resync} disabled={syncing} className="btn-outline"><RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing…' : 'Re-sync links'}</button>}
        <button onClick={() => open(tab === 'faculties' ? 'faculty' : 'institution')} className="btn-primary"><Plus size={18} /> Add {tab === 'faculties' ? 'faculty' : 'institution'}</button>
      </PageHeader>

      <div role="tablist" className="inline-flex gap-1 glass p-1 rounded-2xl">
        {[['faculties', 'Faculties', FolderTree], ['institutions', 'Institutions', Building2]].map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold ${tab === id ? 'text-white' : 'text-muted hover:text-ink'}`}>
            {tab === id && <motion.span layoutId="uniTab" className="absolute inset-0 bg-primary rounded-xl" />}
            <Icon size={16} className="relative" /><span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'faculties' ? (
          <motion.div key="f" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {!loading && faculties.length === 0 ? (
              <EmptyState icon={Layers} title="No faculties yet" text="Add your first faculty, then add departments under it." />
            ) : (
              <ul className="space-y-3">
                {tops.map(f => (
                  <React.Fragment key={f.id}>
                    <Row item={f} />
                    {departmentsOf(faculties, f.name).map(d => <Row key={d.id} item={d} depth={1} />)}
                  </React.Fragment>
                ))}
                {orphans.map(d => <Row key={d.id} item={d} depth={1} />)}
              </ul>
            )}
          </motion.div>
        ) : (
          <motion.ul key="i" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {institutions.map(i => (
              <li key={i.id} className="flex items-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/[0.03]">
                <Building2 size={20} className="text-accent" aria-hidden="true" />
                <p className="flex-1 font-semibold truncate">{i.name}</p>
                <button onClick={() => open('institution', i)} className="p-2 rounded-xl text-muted hover:text-ink" aria-label={`Edit ${i.name}`}><Edit2 size={17} /></button>
                <button onClick={() => remove('institutions', i)} className="p-2 rounded-xl text-red-300/70 hover:text-red-300" aria-label={`Delete ${i.name}`}><Trash2 size={17} /></button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={`${modal?.item ? 'Edit' : 'Add'} ${modal?.kind === 'institution' ? 'institution' : parent ? 'department' : 'faculty'}`}
        subtitle={modal?.kind !== 'institution' ? 'Pick a parent faculty to make this a department, or leave it empty for a faculty.' : undefined}>
        <form onSubmit={save} className="space-y-5">
          <TextField label="Name" required autoFocus inputClassName="uppercase" value={name} onChange={e => setName(e.target.value)}
            placeholder={modal?.kind === 'institution' ? 'e.g. KSP RWANDA' : 'e.g. PHOTOGRAPHY AND GRAPHIC DESIGN'} />
          {modal?.kind !== 'institution' && (
            <SelectField label="Belongs to faculty" value={parent} onChange={e => setParent(e.target.value)}
              options={[{ value: '', label: '— None (this is a faculty) —' }, ...tops.filter(t => t.id !== modal?.item?.id).map(t => t.name)]}
              hint={modal?.item && departmentsOf(faculties, modal.item.name).length ? 'This faculty has departments, so it should stay top level.' : undefined} />
          )}
          <button type="submit" disabled={saving} className="btn-primary w-full py-3.5">{saving ? 'Saving…' : 'Save'}</button>
        </form>
      </Modal>
    </div>
  )
}
