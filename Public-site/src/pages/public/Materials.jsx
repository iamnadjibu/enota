import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Folder, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  Play, 
  X, 
  Award,
  Edit3,
  HelpCircle,
  Dna,
  Layout,
  ExternalLink
} from 'lucide-react'
import PublicLayout from '../../layouts/PublicLayout'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'

export default function Materials() {
  const [regNumber, setRegNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState(null)
  const [error, setError] = useState('')
  const [courses, setCourses] = useState([])
  const [expandedUnit, setExpandedUnit] = useState(null)
  const [previewItem, setPreviewItem] = useState(null)

  const checkRegistration = async (e) => {
    e.preventDefault()
    if (!regNumber.trim()) return
    setLoading(true)
    setError('')
    
    // Simulate lookup or fetch from Firestore
    // For this implementation, we'll fetch from 'users' collection
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('regNumber', '==', regNumber.trim()))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setUserData(snapshot.docs[0].data())
        fetchCourses(snapshot.docs[0].data().faculty)
      } else {
        setError('Reg Number not found. Please register first.')
        setLoading(false)
      }
    })
  }

  const fetchCourses = (faculty) => {
    const q = query(collection(db, 'courses'), where('faculty', '==', faculty))
    onSnapshot(q, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
  }

  const getDrivePreview = (url) => {
    if (!url) return null
    const match = url.match(/\/file\/d\/(.+?)\/(view|edit)/) || url.match(/id=(.+?)(&|$)/)
    const id = match ? match[1] : null
    return id ? `https://drive.google.com/file/d/${id}/preview` : null
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 min-h-[80vh]">
        {!userData ? (
          <div className="max-w-2xl mx-auto text-center space-y-12">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-8 text-xs font-bold text-accent uppercase tracking-widest">
                 Secure Academy Portal
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-extrabold mb-6 tracking-tight">
                Access <span className="text-accent">Learning</span> Vault
              </h1>
              <p className="text-white/40 text-lg max-w-lg mx-auto">
                Enter your university-issued Registration Number to unlock your faculty's exclusive materials.
              </p>
            </motion.div>

            <form onSubmit={checkRegistration} className="relative group">
               <div className="flex items-center glass p-2 rounded-[32px] border-white/10 focus-within:border-accent/40 transition-all shadow-2xl">
                  <Search className="ml-6 text-white/20" size={24} />
                  <input 
                    type="text" 
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="Reg Number (e.g. NAD-2024-001)"
                    className="flex-grow bg-transparent border-none py-6 px-6 text-white text-lg font-bold focus:outline-none"
                  />
                  <button 
                    disabled={loading}
                    className="btn-primary py-4 px-10 rounded-2xl text-sm font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Unlock'}
                  </button>
               </div>
            </form>

            {error && <p className="text-red-400 font-bold flex items-center justify-center gap-2"><AlertCircle size={18} /> {error}</p>}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Student Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
               <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <p className="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-3">Trainee Session Active</p>
                  <h2 className="text-4xl font-display font-bold mb-2">{userData.firstName} {userData.lastName}</h2>
                  <div className="flex items-center gap-4 text-white/40 text-sm">
                    <span className="flex items-center gap-1.5"><Folder size={14} className="text-accent" /> {userData.faculty}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                    <span>{userData.regNumber}</span>
                  </div>
               </motion.div>
               <button onClick={() => setUserData(null)} className="btn-outline py-2 px-6 text-[10px] font-bold uppercase">Exit Portal</button>
            </div>

            {/* Courses View */}
            <div className="grid lg:grid-cols-12 gap-10">
               {/* Course List Sidebar */}
               <div className="lg:col-span-4 space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/20">Your Enrolled Courses</h3>
                  {courses.map(course => (
                    <div key={course.id} className="glass p-6 rounded-[32px] border border-white/5 space-y-6">
                       <div>
                          <h4 className="text-xl font-bold mb-2">{course.title}</h4>
                          <p className="text-xs text-white/40 leading-relaxed whitespace-pre-wrap">{course.description}</p>
                       </div>
                       
                       <div className="space-y-3">
                          {course.units?.map((unit, uIdx) => (
                            <div key={uIdx} className="space-y-2">
                               <button 
                                onClick={() => setExpandedUnit(expandedUnit === `${course.id}-${uIdx}` ? null : `${course.id}-${uIdx}`)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${expandedUnit === `${course.id}-${uIdx}` ? 'bg-accent text-background font-bold' : 'bg-white/5 hover:bg-white/10 text-white/80'}`}
                               >
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] opacity-60">U{uIdx+1}</span>
                                    <span className="text-sm">{unit.title}</span>
                                  </div>
                                  {expandedUnit === `${course.id}-${uIdx}` ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                               </button>

                               <AnimatePresence>
                                  {expandedUnit === `${course.id}-${uIdx}` && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden space-y-1 pl-4 border-l border-white/10 ml-4"
                                    >
                                       {[
                                         { type: 'chapters', label: 'Chapter', icon: <FileText size={12}/> },
                                         { type: 'assignments', label: 'Assignment', icon: <Edit3 size={12}/> },
                                         { type: 'assessments', label: 'Assessment', icon: <HelpCircle size={12}/> },
                                         { type: 'caseStudies', label: 'Case Study', icon: <Dna size={12}/> },
                                         { type: 'exercises', label: 'Exercise', icon: <Layout size={12}/> },
                                       ].map(cat => (
                                         unit[cat.type]?.map((item, iIdx) => (
                                           <button 
                                            key={iIdx}
                                            onClick={() => setPreviewItem({ ...item, catLabel: cat.label })}
                                            className={`w-full text-left p-2.5 rounded-lg text-[11px] font-medium flex items-center justify-between group transition-colors ${previewItem?.driveLink === item.driveLink ? 'text-accent bg-accent/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                           >
                                              <span className="flex items-center gap-2">
                                                 {cat.icon}
                                                 {item.title}
                                              </span>
                                              <Play size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                           </button>
                                         ))
                                       ))}
                                    </motion.div>
                                  )}
                               </AnimatePresence>
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}

                  {courses.length === 0 && (
                    <div className="py-20 glass rounded-[40px] border border-white/5 text-center">
                       <BookOpen size={48} className="mx-auto text-white/10 mb-4" />
                       <p className="text-white/40 text-sm">No courses assigned to your faculty yet.</p>
                    </div>
                  )}
               </div>

               {/* Preview Area */}
               <div className="lg:col-span-8">
                  <AnimatePresence mode="wait">
                    {previewItem ? (
                      <motion.div 
                        key={previewItem.driveLink}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass rounded-[48px] border border-white/5 overflow-hidden flex flex-col h-full sticky top-32"
                      >
                         <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div>
                               <span className="text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-1 rounded mb-2 inline-block">
                                 {previewItem.catLabel}
                               </span>
                               <h3 className="text-2xl font-bold">{previewItem.title}</h3>
                               <p className="text-white/40 text-xs mt-1 whitespace-pre-wrap">{previewItem.description}</p>
                            </div>
                            <button onClick={() => setPreviewItem(null)} className="p-3 hover:bg-white/5 rounded-full transition-colors text-white/40">
                               <X size={24} />
                            </button>
                         </div>
                         
                         <div className="flex-grow aspect-video bg-black/40 relative">
                            {getDrivePreview(previewItem.driveLink) ? (
                              <iframe 
                                src={getDrivePreview(previewItem.driveLink)} 
                                className="w-full h-full border-none"
                                allow="autoplay"
                                title="Material Viewer"
                              ></iframe>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
                                 <ExternalLink size={48} className="text-white/10 mb-4" />
                                 <p className="text-white/40 mb-6">This content cannot be previewed directly.</p>
                                 <a href={previewItem.driveLink} target="_blank" rel="noopener noreferrer" className="btn-primary py-3 px-8 text-xs">Open in New Tab</a>
                              </div>
                            )}
                         </div>
                      </motion.div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-20 glass rounded-[64px] border border-white/5 border-dashed">
                         <div className="w-24 h-24 rounded-full bg-accent/5 flex items-center justify-center text-accent/20 mb-8 border border-accent/10">
                            <BookOpen size={48} />
                         </div>
                         <h3 className="text-3xl font-display font-bold mb-4">Ready to <span className="text-accent">Learn?</span></h3>
                         <p className="text-white/40 max-w-sm mx-auto leading-relaxed">
                           Select a unit and content from the curriculum sidebar to start viewing handouts and assignments.
                         </p>
                      </div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
