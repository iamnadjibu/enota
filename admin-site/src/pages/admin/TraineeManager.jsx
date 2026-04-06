import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search, 
  Mail, 
  GraduationCap, 
  Building2,
  Calendar,
  ShieldCheck,
  UserCheck
} from 'lucide-react'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'

export default function TraineeManager() {
  const { isMaster } = useAuth()
  const [trainees, setTrainees] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setTrainees(userList)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const filteredTrainees = trainees.filter(t => 
    t.firstName?.toLowerCase().includes(search.toLowerCase()) || 
    t.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.regNumber?.toLowerCase().includes(search.toLowerCase())
  )

  if (!isMaster) return <div className="p-10 text-center text-white/40">Only Master Admin can access detailed trainee analytics.</div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Trainee <span className="text-accent">Manager</span></h1>
          <p className="text-white/40 text-sm mt-1">View and manage all students who have joined the eNOTA system.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
           <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <UserCheck size={20} />
           </div>
           <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Joined</p>
              <p className="text-xl font-bold">{trainees.length}</p>
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative max-w-md w-full">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
           <input 
            type="text" 
            placeholder="Search trainees by name, email or reg..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-colors"
           />
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTrainees.map((trainee) => (
          <motion.div 
            key={trainee.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-[32px] border border-white/5 hover:border-accent/20 transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
               <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                  <Users size={24} />
               </div>
               {trainee.role === 'admin' ? (
                 <span className="px-2 py-1 rounded-md bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                   <ShieldCheck size={10} /> Faculty
                 </span>
               ) : (
                 <span className="px-2 py-1 rounded-md bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest">Trainee</span>
               )}
            </div>

            <div className="space-y-4">
               <div>
                  <h3 className="text-lg font-bold">{trainee.firstName} {trainee.lastName}</h3>
                  <p className="text-xs text-white/40 flex items-center gap-2 mt-1">
                    <Mail size={12} /> {trainee.email}
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1">
                        <GraduationCap size={10} /> Faculty
                     </p>
                     <p className="text-xs font-medium truncate">{trainee.faculty || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1">
                        <Building2 size={10} /> Institution
                     </p>
                     <p className="text-xs font-medium truncate">{trainee.institution || 'eNOTA'}</p>
                  </div>
               </div>

               <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                     <Calendar size={12} />
                     Joined {trainee.createdAt ? new Date(trainee.createdAt).toLocaleDateString() : 'Recently'}
                  </div>
                  <div className="text-[10px] font-bold text-accent uppercase tracking-widest">
                    {trainee.regNumber || 'PROVISIONAL'}
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTrainees.length === 0 && (
        <div className="text-center py-20 glass rounded-[40px] border border-white/5">
           <Users size={48} className="mx-auto text-white/10 mb-4" />
           <h3 className="text-xl font-bold mb-2">No Trainees Found</h3>
           <p className="text-white/40 max-w-xs mx-auto">Try adjusting your search or wait for new students to join.</p>
        </div>
      )}
    </div>
  )
}
