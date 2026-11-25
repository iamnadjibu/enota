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
  ExternalLink,
  Lock,
  LogIn,
  Mail
} from 'lucide-react'
import PublicLayout from '../../layouts/PublicLayout'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import VerifyEmailCard from '../../components/VerifyEmailCard'
import { useFaculties } from '@shared/lib/useCatalog'
import { asList, parentOf } from '@shared/lib/faculties'

export default function Materials() {
  const { currentUser, userData: authUserData } = useAuth()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [expandedUnit, setExpandedUnit] = useState(null)
  const [previewItem, setPreviewItem] = useState(null)
  const { faculties } = useFaculties()
  const [deptFilter, setDeptFilter] = useState('All')
  const [courseSearch, setCourseSearch] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const mine = asList(authUserData?.faculty).slice(0, 30)
    if (!currentUser || !currentUser.emailVerified || !mine.length) {
      setLoading(false)
      return
    }
    setLoading(true)
    // Courses store their faculty + parent faculty, so querying with the
    // trainee's own faculties also returns courses of their departments.
    const q = query(collection(db, 'courses'), where('faculties', 'array-contains-any', mine))
    return onSnapshot(q,
      snapshot => { setCourses(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); setLoadError(''); setLoading(false) },
      () => { setLoadError('Your materials could not be loaded. Refresh the page, or contact the eNOTA team if this continues.'); setLoading(false) })
  }, [currentUser, currentUser?.emailVerified, authUserData?.faculty])

  // Group courses by department (or faculty) so they are easy to find.
  const groups = React.useMemo(() => {
    const q = courseSearch.trim().toLowerCase()
    const map = new Map()
    courses
      .filter(c => !q || `${c.title} ${c.description}`.toLowerCase().includes(q))
      .forEach(c => {
        const tags = asList(c.tags || c.faculties || c.faculty)
        const key = tags.find(t => parentOf(faculties, t)) || tags[0] || 'General'
        if (!map.has(key)) map.set(key, [])
        map.get(key).push(c)
      })
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [courses, faculties, courseSearch])

  const safeHref = url => (/^https:\/\//i.test(url || '') ? url : null)

  const getDrivePreview = (url) => {
    if (!url) return null
    const match = url.match(/\/file\/d\/(.+?)\/(view|edit)/) || url.match(/id=(.+?)(&|$)/)
    const id = match ? match[1] : null
    return id ? `https://drive.google.com/file/d/${id}/preview` : null
  }

  const getYoutubePreview = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1` : null
  }

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
           <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 min-h-[80vh]">
        {!currentUser ? (
          <div className="max-w-2xl mx-auto text-center space-y-12">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-8 text-xs font-bold text-accent uppercase tracking-widest">
                 Secure Academy Portal
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-extrabold mb-6 tracking-tight">
                Access <span className="text-accent">Learning</span> Vault
              </h1>
              <p className="text-muted text-lg max-w-lg mx-auto mb-10">
                You must be logged in to access your faculty's exclusive learning materials and handouts.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/login" className="btn-primary py-4 px-10 rounded-2xl text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <LogIn size={18} /> Sign In to Access
                </Link>
                <Link to="/register" className="btn-outline py-4 px-10 rounded-2xl text-sm font-bold uppercase tracking-widest">
                  Create Account
                </Link>
              </div>
            </motion.div>

            <div className="pt-20 opacity-20 flex justify-center gap-12">
               <BookOpen size={48} />
               <Lock size={48} />
               <FileText size={48} />
            </div>
          </div>
        ) : !currentUser.emailVerified ? (
          <div className="max-w-2xl mx-auto mt-6"><VerifyEmailCard /></div>
        ) : (
          <div className="space-y-12">
            {/* Student Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
               <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <p className="text-accent text-xs font-bold uppercase tracking-[0.3em] mb-3">Student Session Active</p>
                  <h2 className="text-4xl font-display font-bold mb-2">{authUserData?.firstName} {authUserData?.lastName}</h2>
                  <div className="flex items-center gap-4 text-muted text-sm">
                    <span className="flex items-center gap-1.5"><Folder size={14} className="text-accent" /> {Array.isArray(authUserData?.faculty) ? authUserData.faculty.join(', ') : authUserData?.faculty}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                    <span>{authUserData?.regNumber}</span>
                  </div>
               </motion.div>
               <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  Logged In
               </div>
            </div>

            {/* Courses View */}
            <div className="grid lg:grid-cols-12 gap-10">
               {/* Course List Sidebar */}
               <div className="lg:col-span-4 space-y-6">
                  <h3 className="text-sm font-semibold text-muted">Your courses</h3>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" size={16} aria-hidden="true" />
                    <input type="search" aria-label="Search courses" placeholder="Search courses" value={courseSearch}
                      onChange={e => setCourseSearch(e.target.value)} className="field-input pl-11 py-2.5" />
                  </div>
                  {groups.length > 1 && (
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by department">
                      {['All', ...groups.map(([k]) => k)].map(k => (
                        <button key={k} onClick={() => setDeptFilter(k)} aria-pressed={deptFilter === k}
                          className={`chip text-xs ${deptFilter === k ? 'chip-on' : 'chip-off'}`}>{k === 'All' ? 'All departments' : k}</button>
                      ))}
                    </div>
                  )}
                  {loadError && <p role="alert" className="text-red-200 bg-red-500/10 border border-red-400/30 rounded-2xl p-4 text-sm">{loadError}</p>}
                  {groups.filter(([k]) => deptFilter === 'All' || deptFilter === k).map(([dept, list]) => (
                    <section key={dept} className="space-y-4" aria-label={dept}>
                      <p className="flex items-center gap-2 text-sm font-semibold text-accent pt-2"><Folder size={15} aria-hidden="true" /> {dept}</p>
                      {list.map(course => (
                    <div key={course.id} className="glass p-6 rounded-[32px] border border-white/5 space-y-6">
                       <div>
                          <h4 className="text-xl font-bold mb-2">{course.title}</h4>
                          <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{course.description}</p>
                       </div>
                       
                       <div className="space-y-3">
                          {course.units?.map((unit, uIdx) => (
                            <div key={uIdx} className="space-y-2">
                               <button 
                                onClick={() => setExpandedUnit(expandedUnit === `${course.id}-${uIdx}` ? null : `${course.id}-${uIdx}`)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${expandedUnit === `${course.id}-${uIdx}` ? 'bg-accent text-background font-bold' : 'bg-white/5 hover:bg-white/10 text-white/80'}`}
                               >
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs opacity-60">U{uIdx+1}</span>
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
                                            className={`w-full text-left p-2.5 rounded-lg text-sm font-medium flex items-center justify-between group transition-colors ${previewItem?.id === item.id ? 'text-accent bg-accent/5' : 'text-muted hover:text-white hover:bg-white/5'}`}
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
                    </section>
                  ))}
                  {courses.length === 0 && (
                    <div className="py-20 glass rounded-[40px] border border-white/5 text-center">
                       <BookOpen size={48} className="mx-auto text-subtle mb-4" />
                       <p className="text-muted text-sm">No materials have been published for {asList(authUserData?.faculty).join(', ')} yet. Check back soon.</p>
                    </div>
                  )}
               </div>

               {/* Preview Area */}
               <div className="lg:col-span-8">
                  <AnimatePresence mode="wait">
                    {previewItem ? (
                      <motion.div 
                        key={previewItem.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass rounded-[48px] border border-white/5 overflow-hidden flex flex-col h-full sticky top-32"
                      >
                         <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div>
                               <span className="text-xs font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-1 rounded mb-2 inline-block">
                                 {previewItem.catLabel}
                               </span>
                               <h3 className="text-2xl font-bold">{previewItem.title}</h3>
                               <p className="text-muted text-xs mt-1 whitespace-pre-wrap">{previewItem.description}</p>
                            </div>
                            <button onClick={() => setPreviewItem(null)} aria-label="Close preview" className="p-3 hover:bg-white/5 rounded-full transition-colors text-muted">
                               <X size={24} />
                            </button>
                         </div>
                         
                         <div className="flex-grow aspect-video bg-black/40 relative">
                            {getYoutubePreview(previewItem.youtubeLink) ? (
                              <iframe 
                                src={getYoutubePreview(previewItem.youtubeLink)} 
                                className="w-full h-full border-none"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="YouTube Viewer"
                              ></iframe>
                            ) : getDrivePreview(previewItem.driveLink) ? (
                              <iframe 
                                src={getDrivePreview(previewItem.driveLink)} 
                                className="w-full h-full border-none"
                                allow="autoplay"
                                title="Material Viewer"
                              ></iframe>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
                                 <ExternalLink size={48} className="text-subtle mb-4" />
                                 <p className="text-muted mb-6">This content cannot be previewed directly.</p>
                                 {safeHref(previewItem.youtubeLink || previewItem.driveLink)
                                   ? <a href={safeHref(previewItem.youtubeLink || previewItem.driveLink)} target="_blank" rel="noopener noreferrer" className="btn-primary py-3 px-8">Open in a new tab</a>
                                   : <p className="text-subtle text-sm">No link has been added for this item yet.</p>}
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
                         <p className="text-muted max-w-sm mx-auto leading-relaxed">
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
