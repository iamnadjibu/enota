import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Trash2, 
  Save, 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  Layout, 
  FileText, 
  Video, 
  HelpCircle, 
  Edit3,
  Dna,
  Link as LinkIcon,
  Eye
} from 'lucide-react'
import { db } from '../../firebase'
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, where } from 'firebase/firestore'
import { useAuth } from '../../context/AuthContext'

export default function MaterialsManager() {
  const { userData, isMaster } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCourse, setActiveCourse] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [universityFaculties, setUniversityFaculties] = useState([])


  // Form State
  const [formData, setFormData] = useState({
    title: '',
    faculties: userData?.faculty ? [userData.faculty] : ['MULTIMEDIA PRODUCTION'],
    description: '',
    units: []
  })

  useEffect(() => {
    const unsubFaculties = onSnapshot(collection(db, 'faculties'), (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data().name).sort()
      setUniversityFaculties(list)
    })

    // Wait for userData if not Master
    if (!isMaster && !userData?.faculty) return

    const q = isMaster 
      ? query(collection(db, 'courses'))
      : query(collection(db, 'courses'), where('faculties', 'array-contains', userData?.faculty))


    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    }, (err) => {
      console.error(err)
      setLoading(false)
    })

    return () => {
      unsubFaculties()
      unsubscribe()
    }
  }, [isMaster, userData?.faculty])


  const handleCreateNew = () => {
    setFormData({
      title: '',
      faculties: userData?.faculty ? [userData.faculty] : ['MULTIMEDIA PRODUCTION'],
      description: '',
      units: []
    })
    setActiveCourse(null)
    setIsEditing(true)
  }

  const handleEdit = (course) => {
    setFormData({
      ...course,
      faculties: course.faculties || (course.faculty ? [course.faculty] : [])
    })
    setActiveCourse(course.id)
    setIsEditing(true)
  }


  const handleAddUnit = () => {
    const newUnit = {
      id: Date.now(),
      title: '',
      description: '',
      chapters: [],
      assignments: [],
      assessments: [],
      caseStudies: [],
      exercises: []
    }
    setFormData({ ...formData, units: [...formData.units, newUnit] })
  }

  const handleAddContent = (unitIdx, type) => {
    const newContent = { id: Date.now(), title: '', description: '', driveLink: '' }
    const updatedUnits = [...formData.units]
    updatedUnits[unitIdx][type] = [...updatedUnits[unitIdx][type], newContent]
    setFormData({ ...formData, units: updatedUnits })
  }

  const handleUpdateContent = (unitIdx, type, contentIdx, field, value) => {
    const updatedUnits = [...formData.units]
    updatedUnits[unitIdx][type][contentIdx][field] = value
    setFormData({ ...formData, units: updatedUnits })
  }

  const handleRemoveContent = (unitIdx, type, contentIdx) => {
    const updatedUnits = [...formData.units]
    updatedUnits[unitIdx][type].splice(contentIdx, 1)
    setFormData({ ...formData, units: updatedUnits })
  }

  const handleSave = async () => {
    if (!formData.title) return alert('Please enter a course title')
    try {
      const docRef = activeCourse ? doc(db, 'courses', activeCourse) : doc(collection(db, 'courses'))
      
      // Support backward compatibility while using the new structure
      const finalData = { 
        ...formData, 
        faculty: formData.faculties[0] || 'N/A' // Legacy primary faculty for older rules/query support
      }
      
      await setDoc(docRef, finalData)

      setIsEditing(false)
      alert('Course saved successfully!')
    } catch (err) {
      console.error(err)
      alert('Error saving course')
    }
  }

  const handleDeleteSub = async (id) => {
    if (window.confirm('Are you sure you want to delete this Entire Course?')) {
      await deleteDoc(doc(db, 'courses', id))
    }
  }

  const getDrivePreview = (url) => {
    if (!url) return null
    try {
      const match = url.match(/\/file\/d\/(.+?)\/(view|edit)/) || url.match(/id=(.+?)(&|$)/)
      const id = match ? match[1] : null
      return id ? `https://drive.google.com/file/d/${id}/preview` : null
    } catch (e) { return null }
  }

  if (loading) return <div className="p-20 text-center animate-pulse">Loading Academy Structure...</div>

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Materials <span className="text-accent">Manager</span></h1>
          <p className="text-white/40 text-sm mt-1">Design Courses, Units, and Chapters for your Faculty.</p>
        </div>
        {!isEditing && (
          <button onClick={handleCreateNew} className="btn-primary py-3 px-6 flex items-center gap-2">
            <Plus size={20} /> New Course
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Base Course Info */}
            <div className="glass p-8 rounded-[40px] border border-accent/20 space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2"><BookOpen className="text-accent" /> Base Course Details</h3>
                  <button onClick={() => setIsEditing(false)} className="text-white/40 hover:text-white transition-colors">Cancel</button>
               </div>
               
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Course Title (Bold)</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-lg font-bold"
                      value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Assigned Faculties (Multiple Allowed)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(universityFaculties.length > 0 ? universityFaculties : ['FILMMAKING AND VIDEO PRODUCTION', 'MULTIMEDIA PRODUCTION', 'COLOR GRADING', 'AI FILMMAKING', 'VIBE CODING']).map(f => (
                        <button 
                          key={f}
                          type="button"
                          disabled={!isMaster}
                          onClick={() => {
                            const updated = formData.faculties.includes(f)
                              ? formData.faculties.filter(fac => fac !== f)
                              : [...formData.faculties, f]
                            setFormData({ ...formData, faculties: updated })
                          }}
                          className={`text-[10px] font-bold py-2 px-3 rounded-xl border transition-all ${formData.faculties.includes(f) ? 'bg-accent text-background border-accent' : 'border-white/10 text-white/40'}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>


               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Course Introduction (Renders Newlines)</label>
                  <textarea 
                    rows="3"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-sm"
                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  ></textarea>
               </div>
            </div>

            {/* Units List */}
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Course <span className="text-accent">Curriculum</span></h3>
                  <button onClick={handleAddUnit} className="btn-outline py-2 px-4 text-[10px] flex items-center gap-2">
                    <Plus size={14} /> Add Unit
                  </button>
               </div>

               <div className="space-y-6">
                  {formData.units.map((unit, uIdx) => (
                    <div key={unit.id} className="glass p-6 rounded-[32px] border border-white/5 space-y-6">
                       <div className="flex items-center justify-between gap-4">
                          <div className="flex-grow flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-accent text-background flex items-center justify-center font-bold">U{uIdx+1}</div>
                             <input 
                               placeholder="Unit Title..."
                               className="bg-transparent border-b border-white/10 py-2 focus:outline-none text-lg font-bold w-full"
                               value={unit.title} onChange={(e) => {
                                 const updated = [...formData.units]; 
                                 updated[uIdx].title = e.target.value; 
                                 setFormData({...formData, units: updated})
                               }}
                             />
                          </div>
                          <button onClick={() => {
                            const updated = [...formData.units]; 
                            updated.splice(uIdx, 1); 
                            setFormData({...formData, units: updated})
                          }} className="text-red-500/40 hover:text-red-500"><Trash2 size={18}/></button>
                       </div>

                       <textarea 
                         placeholder="Unit Brief Description..."
                         className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs italic"
                         value={unit.description} onChange={(e) => {
                            const updated = [...formData.units]; 
                            updated[uIdx].description = e.target.value; 
                            setFormData({...formData, units: updated})
                         }}
                       />

                       {/* Content Types */}
                       <div className="grid md:grid-cols-2 gap-8 pt-4">
                          {[
                            { type: 'chapters', label: 'Chapters', icon: <FileText size={16}/> },
                            { type: 'assignments', label: 'Assignments', icon: <Edit3 size={16}/> },
                            { type: 'assessments', label: 'Assessments', icon: <HelpCircle size={16}/> },
                            { type: 'caseStudies', label: 'Case Studies', icon: <Dna size={16}/> },
                            { type: 'exercises', label: 'Exercises', icon: <Layout size={16}/> },
                          ].map(item => (
                            <div key={item.type} className="space-y-4">
                               <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white/60">
                                    {item.icon} {item.label}
                                  </h4>
                                  <button 
                                    onClick={() => handleAddContent(uIdx, item.type)}
                                    className="text-accent hover:scale-110 transition-transform"
                                  ><Plus size={16}/></button>
                               </div>
                               <div className="space-y-3">
                                  {unit[item.type].map((c, cIdx) => (
                                    <div key={c.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3 relative group">
                                       <button 
                                        onClick={() => handleRemoveContent(uIdx, item.type, cIdx)}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500/40 hover:text-red-500 transition-all"
                                       ><Trash2 size={12}/></button>
                                       
                                       <input 
                                        placeholder="Title (Bold)..."
                                        className="w-full bg-transparent border-none text-xs font-bold focus:outline-none"
                                        value={c.title} onChange={(e) => handleUpdateContent(uIdx, item.type, cIdx, 'title', e.target.value)}
                                       />
                                       <textarea 
                                        placeholder="Brief Description..."
                                        className="w-full bg-transparent border-none text-[10px] text-white/40 focus:outline-none resize-none"
                                        value={c.description} onChange={(e) => handleUpdateContent(uIdx, item.type, cIdx, 'description', e.target.value)}
                                       />
                                       <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1.5 focus-within:bg-white/10 transition-colors">
                                          <LinkIcon size={10} className="text-white/20"/>
                                          <input 
                                            placeholder="Direct Drive Link (Handout)..."
                                            className="w-full bg-transparent border-none text-[9px] focus:outline-none text-accent"
                                            value={c.driveLink} onChange={(e) => handleUpdateContent(uIdx, item.type, cIdx, 'driveLink', e.target.value)}
                                          />
                                          {getDrivePreview(c.driveLink) && <Eye size={10} className="text-accent" />}
                                       </div>
                                    </div>
                                  ))}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <button onClick={handleSave} className="btn-primary w-full py-6 text-lg tracking-widest font-bold flex items-center justify-center gap-4">
               <Save size={24} /> PUBLISH TO ACADEMY
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
            {courses.map(course => (
              <motion.div 
                key={course.id}
                layoutId={course.id}
                className="glass p-8 rounded-[40px] border border-white/5 hover:border-accent/20 transition-all flex flex-col group h-full"
              >
                <div className="flex items-start justify-between mb-8">
                   <div className="w-14 h-14 rounded-3xl bg-accent/10 text-accent flex items-center justify-center">
                     <BookOpen size={28} />
                   </div>
                   <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(course)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10"><Edit3 size={16}/></button>
                      <button onClick={() => handleDeleteSub(course.id)} className="p-3 bg-red-500/5 text-red-500/40 rounded-2xl hover:bg-red-500/10 hover:text-red-500"><Trash2 size={16}/></button>
                   </div>
                </div>

                <h3 className="text-xl font-bold mb-3">{course.title}</h3>
                <p className="text-white/40 text-xs line-clamp-3 mb-8 italic">{course.description}</p>

                <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest leading-none">Modules</p>
                      <p className="text-sm font-bold">{course.units?.length || 0} Units</p>
                   </div>
                    <div className="text-right flex flex-col items-end">
                       <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest leading-none">Faculties</p>
                       <div className="flex flex-wrap justify-end gap-1 mt-1">
                          {(course.faculties || [course.faculty]).map(f => (
                            <span key={f} className="text-[8px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded truncate max-w-[80px]">{f}</span>
                          ))}
                       </div>
                    </div>

                </div>
              </motion.div>
            ))}

            {courses.length === 0 && (
              <div className="col-span-full py-32 glass rounded-[60px] border-white/5 text-center">
                 <Layout size={64} className="mx-auto text-white/10 mb-6" />
                 <h3 className="text-2xl font-bold mb-2">Build Your Curriculum</h3>
                 <p className="text-white/40 max-w-sm mx-auto">Click "New Course" and start designing your faculty's educational materials.</p>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
