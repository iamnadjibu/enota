import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  School,
  GraduationCap,
  Layout
} from 'lucide-react'
import { db } from '../../firebase'
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  addDoc, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore'
import { useAuth } from '../../context/AuthContext'

export default function UniversityManager() {
  const { isMaster } = useAuth()
  const [faculties, setFaculties] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('faculties') // 'faculties' | 'institutions'
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({ name: '' })

  useEffect(() => {
    if (!isMaster) return

    const facultiesRef = collection(db, 'faculties')
    const institutionsRef = collection(db, 'institutions')

    const unsubFaculties = onSnapshot(query(facultiesRef, orderBy('name')), (snapshot) => {
      setFaculties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    const unsubInstitutions = onSnapshot(query(institutionsRef, orderBy('name')), (snapshot) => {
      setInstitutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })

    return () => {
      unsubFaculties()
      unsubInstitutions()
    }
  }, [isMaster])

  const handleOpenModal = (item = null) => {
    setEditingItem(item)
    setFormData({ name: item ? item.name : '' })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    const colName = activeTab
    try {
      if (editingItem) {
        await setDoc(doc(db, colName, editingItem.id), {
          ...editingItem,
          name: formData.name.trim(),
          updatedAt: serverTimestamp()
        })
      } else {
        await addDoc(collection(db, colName), {
          name: formData.name.trim(),
          createdAt: serverTimestamp()
        })
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({ name: '' })
    } catch (err) {
      console.error(err)
      alert(`Error saving ${activeTab === 'faculties' ? 'Faculty' : 'Institution'}`)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab === 'faculties' ? 'Faculty' : 'Institution'}?`)) return
    
    try {
      await deleteDoc(doc(db, activeTab, id))
    } catch (err) {
      console.error(err)
      alert('Error deleting item')
    }
  }

  if (!isMaster) {
    return (
      <div className="p-20 text-center glass rounded-3xl">
        <Layout size={48} className="mx-auto text-red-500/50 mb-4" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-white/40">Only the Master Admin can manage university settings.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold">University <span className="text-accent">Settings</span></h1>
          <p className="text-white/40 text-sm mt-1">Manage global lists of faculties and partner institutions.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary py-3 px-6 flex items-center gap-2"
        >
          <Plus size={20} /> Add New {activeTab === 'faculties' ? 'Faculty' : 'Institution'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/5 pb-1">
        {[
          { id: 'faculties', label: 'Faculties', icon: <GraduationCap size={18} /> },
          { id: 'institutions', label: 'Institutions', icon: <School size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-accent' : 'text-white/40 hover:text-white'}`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Grid List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center animate-pulse text-white/20 uppercase tracking-[0.3em] font-bold">Loading Settings...</div>
        ) : (
          (activeTab === 'faculties' ? faculties : institutions).map((item) => (
            <motion.div 
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-6 rounded-[32px] border border-white/5 hover:border-accent/20 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeTab === 'faculties' ? 'bg-primary/10 text-primary-light' : 'bg-accent/10 text-accent'}`}>
                  {activeTab === 'faculties' ? <GraduationCap size={24} /> : <School size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Added {item.createdAt?.toDate().toLocaleDateString() || 'Recently'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(item)}
                  className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 hover:bg-white/5 rounded-xl text-red-500/40 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass p-10 rounded-[40px] border border-white/5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-display font-bold">{editingItem ? 'Edit' : 'Add'} {activeTab === 'faculties' ? 'Faculty' : 'Institution'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={24}/></button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{activeTab === 'faculties' ? 'Faculty' : 'Institution'} Name</label>
                  <input 
                    type="text"
                    required
                    placeholder={`e.g. ${activeTab === 'faculties' ? 'Filmmaking' : 'NAD Production'}`}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-grow btn-outline py-4"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-grow btn-primary py-4 flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
