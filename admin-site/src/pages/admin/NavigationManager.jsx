import React, { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { Link as LinkIcon, Plus, Trash2, GripVertical, Save, Globe } from 'lucide-react'
import { db } from '../../firebase'

export default function NavigationManager() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'siteConfig', 'navigation'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().links) {
        setLinks(docSnap.data().links)
      } else {
        // Fallback defaults
        setLinks([
          { name: 'HOME', path: '/' },
          { name: 'MATERIALS', path: '/materials' },
          { name: 'MARKS', path: '/marks' },
          { name: 'ABOUT US', path: '/about' },
          { name: 'CONTACT US', path: '/contact' },
        ])
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const handleAddLink = () => {
    setLinks([...links, { name: '', path: '' }])
  }

  const handleUpdateLink = (index, field, value) => {
    const newLinks = [...links]
    newLinks[index][field] = value
    setLinks(newLinks)
  }

  const handleRemoveLink = (index) => {
    const newLinks = [...links]
    newLinks.splice(index, 1)
    setLinks(newLinks)
  }

  const handleMoveUp = (index) => {
    if (index === 0) return
    const newLinks = [...links]
    const temp = newLinks[index - 1]
    newLinks[index - 1] = newLinks[index]
    newLinks[index] = temp
    setLinks(newLinks)
  }

  const handleMoveDown = (index) => {
    if (index === links.length - 1) return
    const newLinks = [...links]
    const temp = newLinks[index + 1]
    newLinks[index + 1] = newLinks[index]
    newLinks[index] = temp
    setLinks(newLinks)
  }

  const handleSave = async () => {
    // Validate
    if (links.some(l => !l.name.trim() || !l.path.trim())) {
      alert("All links must have a name and a path.")
      return
    }

    setSaving(true)
    try {
      await setDoc(doc(db, 'siteConfig', 'navigation'), { links })
      alert("Navigation Links saved successfully!")
    } catch (e) {
      console.error(e)
      alert("Failed to save navigation links.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse text-white/50">Loading Config...</div>

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Navigation <span className="text-accent">Manager</span></h1>
          <p className="text-white/40 text-sm mt-1">Configure the main top bar links for the Public Site.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary py-3 px-6 flex items-center gap-2">
           <Save size={20} /> {saving ? 'Saving...' : 'Publish Navigation'}
        </button>
      </div>

      <div className="glass p-8 rounded-[40px] border border-white/5">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
           <h3 className="text-xl font-bold flex items-center gap-2"><Globe className="text-accent" /> Public Top Bar Links</h3>
           <button onClick={handleAddLink} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-accent">
              <Plus size={20} />
           </button>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 flex items-start gap-4">
           <LinkIcon className="text-accent mt-1" size={20} />
           <p className="text-sm text-white/60 leading-relaxed">
             <strong>Internal Links:</strong> Use paths starting with a forward slash (e.g., <code className="bg-black/40 px-1 py-0.5 rounded text-accent">/marks</code>).<br />
             <strong>External Links:</strong> Use full URLs (e.g., <code className="bg-black/40 px-1 py-0.5 rounded text-accent">https://youtube.com</code>). External links will automatically open in a new tab.<br />
             <strong>Note:</strong> The "HOME" link (/) will be prominently enforced by the layout system if omitted.
           </p>
        </div>

        <div className="space-y-4">
           <AnimatePresence>
             {links.map((link, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group relative"
                >
                   <div className="flex flex-col gap-1 items-center px-2 border-r border-white/10">
                      <button onClick={() => handleMoveUp(idx)} disabled={idx === 0} className="hover:text-accent disabled:opacity-30"><GripVertical size={14} /></button>
                      <button onClick={() => handleMoveDown(idx)} disabled={idx === links.length - 1} className="hover:text-accent disabled:opacity-30"><GripVertical size={14} /></button>
                   </div>
                   
                   <div className="flex-grow grid md:grid-cols-2 gap-4 w-full">
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest pl-1">Display Name</label>
                        <input 
                           type="text"
                           placeholder="e.g. HOME"
                           value={link.name}
                           onChange={(e) => handleUpdateLink(idx, 'name', e.target.value.toUpperCase())}
                           className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest pl-1">URL Path</label>
                        <input 
                           type="text"
                           placeholder="e.g. /marks or https://google.com"
                           value={link.path}
                           onChange={(e) => handleUpdateLink(idx, 'path', e.target.value)}
                           className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-accent text-accent"
                        />
                     </div>
                   </div>

                   <button 
                     onClick={() => handleRemoveLink(idx)}
                     className="sm:absolute -top-3 -right-3 sm:top-1/2 sm:-translate-y-1/2 sm:right-6 w-10 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full flex items-center justify-center transition-colors"
                   >
                      <Trash2 size={16} />
                   </button>
                </motion.div>
             ))}
           </AnimatePresence>

           {links.length === 0 && (
              <div className="text-center p-12 text-white/40 border border-white/5 rounded-2xl border-dashed">
                 No navigation links configured. Visitors will only see the Home button.
              </div>
           )}
        </div>
      </div>
    </div>
  )
}
