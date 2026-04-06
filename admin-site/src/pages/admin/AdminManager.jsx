import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Trash2, 
  Pause, 
  Play, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ShieldAlert
} from 'lucide-react'
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'

export default function AdminManager() {
  const { isMaster } = useAuth()
  const [admins, setAdmins] = useState([])
  const [filter, setFilter] = useState('active') // 'active', 'pending', 'declined'
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isMaster) return

    const q = query(collection(db, 'users')) // Filter for role=admin usually, but we'll fetch all and filter in JS for simplicity here
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adminList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.role === 'admin' || user.role === 'master')
      setAdmins(adminList)
      setLoading(false)
    })

    return unsubscribe
  }, [isMaster])

  const handleStatusChange = async (adminId, newStatus) => {
    try {
      await updateDoc(doc(db, 'users', adminId), { status: newStatus })
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (adminId) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await deleteDoc(doc(db, 'users', adminId))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handlePromoteToMaster = async (adminId) => {
    if (window.confirm('Are you sure you want to promote this admin to MASTER ADMIN? This cannot be undone easily.')) {
      try {
        await updateDoc(doc(db, 'users', adminId), { role: 'master' })
        alert('Admin promoted to Master!')
      } catch (err) {
        console.error(err)
      }
    }
  }

  const filteredAdmins = admins.filter(admin => {
    const matchesFilter = admin.status === filter
    const matchesSearch = 
      admin.firstName?.toLowerCase().includes(search.toLowerCase()) || 
      admin.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      admin.email?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (!isMaster) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-white/40">Access Denied. Only Master Admin can manage admins.</p>
    </div>
  )

  const tabs = [
    { id: 'active', label: 'Admitted', icon: <UserCheck size={16} /> },
    { id: 'pending', label: 'Pending', icon: <Clock size={16} /> },
    { id: 'declined', label: 'Declined', icon: <UserX size={16} /> },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Admin <span className="text-accent">Manager</span></h1>
        <p className="text-white/40 text-sm mt-1">Review and manage administrative access for eNOTA Portal.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex glass p-1 rounded-2xl border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === tab.id ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-sm w-full">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
           <input 
            type="text" 
            placeholder="Search admins..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-colors"
           />
        </div>
      </div>

      <div className="glass rounded-[40px] border border-white/5 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5 text-left">
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">Name</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">Faculty / Inst.</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40 text-center">Status</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredAdmins.map((admin) => (
                <motion.tr 
                  key={admin.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent font-display font-bold">
                        {admin.firstName?.[0]}{admin.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-bold">{admin.firstName} {admin.lastName}</p>
                        <p className="text-xs text-white/40">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div>
                      <p className="text-xs font-medium">{admin.faculty}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{admin.institution}</p>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${admin.status === 'active' ? 'bg-accent/10 text-accent' : admin.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                      {admin.status}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-end gap-2">
                       {admin.status === 'pending' ? (
                         <>
                           <button 
                            onClick={() => handleStatusChange(admin.id, 'active')}
                            className="p-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-background transition-all"
                            title="Approve"
                           >
                             <CheckCircle size={18} />
                           </button>
                           <button 
                            onClick={() => handleStatusChange(admin.id, 'declined')}
                            className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            title="Decline"
                           >
                             <XCircle size={18} />
                           </button>
                         </>
                       ) : admin.status === 'active' ? (
                         <div className="flex items-center justify-end gap-2">
                           <button 
                            onClick={() => handleStatusChange(admin.id, 'inactive')}
                            className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white transition-all transition-all"
                            title="Suspend"
                           >
                             <Pause size={18} />
                           </button>
                           <button 
                            onClick={() => handlePromoteToMaster(admin.id)}
                            className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white transition-all shadow-lg shadow-purple-500/5 group/p"
                            title="Promote to Master"
                           >
                             <ShieldAlert size={18} className="group-hover/p:scale-110 transition-transform" />
                           </button>
                           <button 
                            onClick={() => handleDelete(admin.id)}
                            className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            title="Delete"
                           >
                             <Trash2 size={18} />
                           </button>
                         </div>
                       ) : (
                         <>
                           <button 
                            onClick={() => handleStatusChange(admin.id, 'active')}
                            className="p-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-background transition-all"
                            title="Re-activate"
                           >
                             <Play size={18} />
                           </button>
                           <button 
                            onClick={() => handleDelete(admin.id)}
                            className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            title="Delete"
                           >
                             <Trash2 size={18} />
                           </button>
                         </>
                       )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {!loading && filteredAdmins.length === 0 && (
              <tr>
                <td colSpan="4" className="p-20 text-center text-white/20">
                  <Filter size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No admins found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
