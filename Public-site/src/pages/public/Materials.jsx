import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Folder, FileText, ExternalLink, AlertCircle, Bookmark, ChevronRight } from 'lucide-react'
import PublicLayout from '../../layouts/PublicLayout'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'

export default function Materials() {
  const [regNumber, setRegNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState(null)
  const [error, setError] = useState('')

  const checkRegistration = async (e) => {
    e.preventDefault()
    if (!regNumber.trim()) return

    setLoading(true)
    setError('')
    setUserData(null)

    try {
      // Check in users collection first
      const q = query(collection(db, 'users'), where('regNumber', '==', regNumber.trim()))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        setUserData(querySnapshot.docs[0].data())
      } else {
        setError('You are not registered yet. Please register to access materials.')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const materials = [
    { title: 'Introduction to Filmmaking', type: 'PDF', size: '2.4 MB', faculty: 'FILMMAKING AND VIDEO PRODUCTION' },
    { title: 'Camera Angles & Composition', type: 'Video', duration: '15:20', faculty: 'FILMMAKING AND VIDEO PRODUCTION' },
    { title: 'Basic Color Grading with DaVinci', type: 'PDF', size: '5.1 MB', faculty: 'MULTIMEDIA PRODUCTION' },
    { title: 'Scriptwriting Fundamentals', type: 'DOC', size: '1.2 MB', faculty: 'MULTIMEDIA PRODUCTION' },
    { title: 'Lighting Techniques for Interviews', type: 'Video', duration: '22:45', faculty: 'FILMMAKING AND VIDEO PRODUCTION' },
  ]

  const filteredMaterials = userData 
    ? materials.filter(m => m.faculty === userData.faculty || !userData.faculty || userData.faculty === 'N/A')
    : []

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-20">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-display font-extrabold mb-4 tracking-tight"
          >
            Learning <span className="text-accent">Materials</span>
          </motion.h1>
          <p className="text-white/50 max-w-xl mx-auto">Access exclusively curated content for your department. Enter your Reg Number to unlock your resources.</p>
        </div>

        <AnimatePresence mode="wait">
          {!userData ? (
            <motion.div 
              key="search"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <form onSubmit={checkRegistration} className="relative mb-8">
                <div className="flex items-center glass p-2 rounded-full border-white/10 group focus-within:border-accent/50 transition-colors">
                  <Search className="ml-4 text-white/40" size={24} />
                  <input 
                    type="text" 
                    required
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="Enter Registered Reg Number" 
                    className="w-full bg-transparent border-none py-4 px-4 text-white focus:outline-none"
                  />
                  <button 
                    disabled={loading}
                    className="btn-primary py-3 px-8 text-sm disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Access'}
                  </button>
                </div>
              </form>

              {error && (
                <div className="text-center">
                  <p className="text-red-400 mb-6 flex items-center justify-center gap-2">
                    <AlertCircle size={20} /> {error}
                  </p>
                  <Link to="/register" className="btn-outline">Register Now</Link>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-8 gap-6">
                <div>
                  <p className="text-accent text-xs font-bold uppercase tracking-widest mb-2">Welcome Back</p>
                  <h2 className="text-3xl font-display font-bold">{userData.firstName} {userData.lastName}</h2>
                  <p className="text-white/40 text-sm mt-1">{userData.faculty}</p>
                </div>
                <button onClick={() => setUserData(null)} className="text-xs text-white/40 hover:text-white underline">Change Account</button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaterials.length > 0 ? filteredMaterials.map((material, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass p-6 rounded-3xl border border-white/5 hover:border-accent/30 transition-all group flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                        {material.type === 'Video' ? <Folder size={24} /> : <FileText size={24} />}
                      </div>
                      <span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded text-white/60 uppercase tracking-tighter">{material.type}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 flex-grow">{material.title}</h3>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                      <span className="text-xs text-white/40">{material.size || material.duration}</span>
                      <button className="flex items-center gap-1 text-accent text-xs font-bold group-hover:gap-2 transition-all">
                        VIEW FILE <ChevronRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                )) : (
                   <div className="col-span-full py-20 glass rounded-3xl text-center border-dashed border-white/10">
                      <Bookmark size={48} className="mx-auto text-white/10 mb-4" />
                      <p className="text-white/40">No materials available for your department yet.</p>
                   </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicLayout>
  )
}
