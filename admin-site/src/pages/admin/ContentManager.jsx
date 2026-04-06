import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Building2, GraduationCap, Edit, Trash2, Plus, Save, AlertCircle } from 'lucide-react'
import { db } from '../../firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { useAuth } from '../../context/AuthContext'

export default function ContentManager() {
  const { isMaster } = useAuth()
  const [config, setConfig] = useState({
    institutions: ['NAD CLASS', 'KSP RWANDA', 'NAD PRODUCTION'],
    faculties: [
      'FILMMAKING AND VIDEO PRODUCTION',
      'MULTIMEDIA PRODUCTION',
      'COLOR GRADING',
      'AI FILMMAKING',
      'VIBE CODING'
    ],
    headerTitle: 'eNOTA PORTAL',
    footerText: 'Designed by NAD PRODUCTION to facilitate Trainees in Filmmaking and Video Production, COLOR GRADING, AI FILMMAKING, VIBE CODING, and Others. Primarily from NAD CLASS and KSP RWANDA.'
  })
  const [loading, setLoading] = useState(true)
  const [newInst, setNewInst] = useState('')
  const [newFaculty, setNewFaculty] = useState('')

  useEffect(() => {
    if (!isMaster) return

    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'site_config')
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setConfig(docSnap.data())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [isMaster])

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'settings', 'site_config'), config)
      alert('Config updated!')
    } catch (err) {
      console.error(err)
    }
  }

  if (!isMaster) return <div className="p-10 text-center text-white/40">Only Master Admin can access this page.</div>

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-display font-bold">Site <span className="text-accent">Content</span></h1>
        <p className="text-white/40 text-sm mt-1">Manage global settings, institutions, and faculties.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Settings Form */}
        <div className="glass p-10 rounded-[40px] border border-white/5 space-y-8">
           <h3 className="text-lg font-bold flex items-center gap-2"><Settings size={20} className="text-accent" /> General Settings</h3>
           
           <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Portal Title</label>
                <input 
                  type="text" 
                  value={config.headerTitle}
                  onChange={(e) => setConfig({...config, headerTitle: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Footer Description</label>
                <textarea 
                  rows="4"
                  value={config.footerText}
                  onChange={(e) => setConfig({...config, footerText: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-sm resize-none"
                ></textarea>
              </div>
           </div>

           <button onClick={handleSave} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
              <Save size={18} /> Update Content
           </button>
        </div>

        {/* Institutions & Faculties */}
        <div className="space-y-10">
           <div className="glass p-8 rounded-[40px] border border-white/5">
              <h4 className="text-sm font-bold uppercase tracking-widest text-accent mb-6 flex items-center gap-2">
                 <Building2 size={16} /> Institutions
              </h4>
              <div className="space-y-3 mb-6">
                 {config.institutions.map((inst, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-xs font-medium">
                       {inst}
                       <button 
                        onClick={() => setConfig({...config, institutions: config.institutions.filter((_, idx) => idx !== i)})}
                        className="text-red-500/40 hover:text-red-500 transition-colors"
                       ><Trash2 size={14}/></button>
                    </div>
                 ))}
              </div>
              <div className="flex gap-2">
                 <input 
                  type="text" 
                  placeholder="New Institution..."
                  value={newInst}
                  onChange={(e) => setNewInst(e.target.value)}
                  className="flex-grow bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none"
                 />
                 <button 
                  onClick={() => {
                    if (newInst) {
                      setConfig({...config, institutions: [...config.institutions, newInst]})
                      setNewInst('')
                    }
                  }}
                  className="p-3 bg-accent/10 text-accent rounded-xl"
                 ><Plus size={18}/></button>
              </div>
           </div>

           <div className="glass p-8 rounded-[40px] border border-white/5">
              <h4 className="text-sm font-bold uppercase tracking-widest text-accent mb-6 flex items-center gap-2">
                 <GraduationCap size={16} /> Faculties
              </h4>
              <div className="space-y-3 mb-6">
                 {config.faculties.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-xs font-medium">
                       {f}
                       <button 
                        onClick={() => setConfig({...config, faculties: config.faculties.filter((_, idx) => idx !== i)})}
                        className="text-red-500/40 hover:text-red-500 transition-colors"
                       ><Trash2 size={14}/></button>
                    </div>
                 ))}
              </div>
              <div className="flex gap-2">
                 <input 
                  type="text" 
                  placeholder="New Faculty..."
                  value={newFaculty}
                  onChange={(e) => setNewFaculty(e.target.value)}
                  className="flex-grow bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none"
                 />
                 <button 
                  onClick={() => {
                    if (newFaculty) {
                      setConfig({...config, faculties: [...config.faculties, newFaculty]})
                      setNewFaculty('')
                    }
                  }}
                  className="p-3 bg-accent/10 text-accent rounded-xl"
                 ><Plus size={18}/></button>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
