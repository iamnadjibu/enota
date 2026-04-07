import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  FileSpreadsheet, 
  AlertCircle,
  X,
  Save,
  CheckCircle,
  Database
} from 'lucide-react'
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, where, getDocs, writeBatch, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'

export default function MarksManager() {
  const { isMaster, userData } = useAuth()
  const [marks, setMarks] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [availableCourses, setAvailableCourses] = useState([])
  const [selectedCourses, setSelectedCourses] = useState([])
  const [selectedMark, setSelectedMark] = useState(null)
  const [isSeeding, setIsSeeding] = useState(false)
  const [universityFaculties, setUniversityFaculties] = useState([])
  const [universityInstitutions, setUniversityInstitutions] = useState([])

  // Report Generation State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportColumns, setReportColumns] = useState({
    firstName: true,
    lastName: true,
    regNumber: true,
    faculty: true,
    institution: false,
    gender: false,
    coursesMarks: true,
    averageMarks: true,
    overallGrade: true
  })

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    regNumber: '',
    faculty: userData?.faculty || 'MULTIMEDIA PRODUCTION',
    institution: 'NAD CLASS',
    gender: 'Male',
    marks: {} // { 'Filmmaking': 85, 'Camera Operation': 90 }
  })



  useEffect(() => {
    // Fetch Global Config
    const unsubFaculties = onSnapshot(query(collection(db, 'faculties'), orderBy('name')), (snapshot) => {
      setUniversityFaculties(snapshot.docs.map(doc => doc.data().name))
    })
    const unsubInstitutions = onSnapshot(query(collection(db, 'institutions'), orderBy('name')), (snapshot) => {
      setUniversityInstitutions(snapshot.docs.map(doc => doc.data().name))
    })

    const marksRef = collection(db, 'marks')
    let q = marksRef
    
    // If not master, filter by faculty
    if (!isMaster && userData?.faculty && userData.faculty !== 'N/A') {
      q = query(marksRef, where('faculty', '==', userData.faculty))
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const markList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setMarks(markList)
      setLoading(false)
    })

    return () => {
      unsubFaculties()
      unsubInstitutions()
      unsubscribe()
    }
  }, [isMaster, userData?.faculty])


  const calculateGrade = (m) => {
    if (m === 'N/A' || m === 0 || m === '0' || !m) return 'F'
    const marks = parseFloat(m)
    if (marks >= 90) return 'A+'
    if (marks >= 80) return 'A'
    if (marks >= 75) return 'B+'
    if (marks >= 70) return 'B'
    if (marks >= 65) return 'C+'
    if (marks >= 60) return 'C'
    if (marks >= 55) return 'D'
    if (marks >= 50) return 'E'
    return 'F'
  }

  // Fetch Available Courses for Picker
  useEffect(() => {
    if (!formData.faculty || formData.faculty === 'N/A') {
      setAvailableCourses([])
      return
    }

    const q = query(collection(db, 'courses'), where('faculties', 'array-contains', formData.faculty))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const courseList = snapshot.docs.map(doc => doc.data().title)
      const uniqueCourses = [...new Set(courseList)]
      setAvailableCourses(uniqueCourses)
    })

    return unsubscribe
  }, [formData.faculty])


  // Report Generation Logic
  const handlePrintPDF = () => {
    window.print() 
    setIsReportModalOpen(false)
  }

  const handleExportCSV = () => {
    const headers = []
    if (reportColumns.firstName) headers.push('First Name')
    if (reportColumns.lastName) headers.push('Last Name')
    if (reportColumns.regNumber) headers.push('Reg Number')
    if (reportColumns.faculty) headers.push('Faculty')
    if (reportColumns.institution) headers.push('Institution')
    if (reportColumns.gender) headers.push('Gender')
    
    // Extrapolate dynamic course columns
    const allCoursesInView = new Set()
    if (reportColumns.coursesMarks) {
      filteredMarks.forEach(m => Object.keys(m.marks || {}).forEach(c => allCoursesInView.add(c)))
      allCoursesInView.forEach(c => headers.push(c))
    }
    
    if (reportColumns.averageMarks) headers.push('Average %')
    if (reportColumns.overallGrade) headers.push('Grade')

    const rows = filteredMarks.map(mark => {
      const row = []
      if (reportColumns.firstName) row.push(`"${mark.firstName || ''}"`)
      if (reportColumns.lastName) row.push(`"${mark.lastName || ''}"`)
      if (reportColumns.regNumber) row.push(`"${mark.regNumber || ''}"`)
      if (reportColumns.faculty) row.push(`"${mark.faculty || ''}"`)
      if (reportColumns.institution) row.push(`"${mark.institution || ''}"`)
      if (reportColumns.gender) row.push(`"${mark.gender || ''}"`)
      
      if (reportColumns.coursesMarks) {
        allCoursesInView.forEach(c => row.push(`"${mark.marks?.[c] || '0'}"`))
      }
      
      if (reportColumns.averageMarks) row.push(`"${mark.averageMarks || '0'}"`)
      if (reportColumns.overallGrade) row.push(`"${mark.overallGrade || 'F'}"`)
      
      return row.join(',')
    })

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `eNOTA_Report_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setIsReportModalOpen(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (selectedCourses.length === 0) return alert('Please select at least one course')
    setLoading(true)

    const marksValues = selectedCourses.map(c => parseFloat(formData.marks[c] || 0))
    const total = marksValues.reduce((a, b) => a + b, 0)
    const avg = (total / selectedCourses.length).toFixed(2)
    const overallGrade = calculateGrade(avg)
    
    // Include individual grades for legacy compatibility
    const individualGrades = {}
    selectedCourses.forEach(c => {
      individualGrades[`grade${c.replace(/\s+/g, '')}`] = calculateGrade(formData.marks[c])
    })

    const finalMarks = {}
    selectedCourses.forEach(c => {
      finalMarks[c] = formData.marks[c] || 0
    })

    const finalData = {
      ...formData,
      marks: finalMarks,
      averageMarks: avg,
      overallGrade,
      ...individualGrades,
      updatedAt: new Date().toISOString()
    }

    try {
      if (selectedMark) {
        await updateDoc(doc(db, 'marks', selectedMark.id), finalData)
      } else {
        await addDoc(collection(db, 'marks'), { ...finalData, createdAt: new Date().toISOString() })
      }
      setIsModalOpen(false)
      setSelectedMark(null)
      setSelectedCourses([])
      setFormData({
        firstName: '', lastName: '', regNumber: '', faculty: isMaster ? 'MULTIMEDIA PRODUCTION' : (userData?.faculty || ''), 
        institution: 'NAD CLASS', gender: 'Male',
        marks: {}
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }


  const handleDelete = async (id) => {
    if (window.confirm('Delete this record?')) {
      try {
        await deleteDoc(doc(db, 'marks', id))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const seedInitialData = async () => {
    if (!window.confirm('This will seed the initial student marks, faculties, and courses. Continue?')) return
    setIsSeeding(true)
    try {
      const batch = writeBatch(db)

      // 1. Seed Faculties
      const facultyList = [
        'MULTIMEDIA PRODUCTION',
        'FILMMAKING AND VIDEO PRODUCTION',
        'PHOTOGRAPHY',
        'COLOR GRADING',
        'AI FILMMAKING',
        'VIBE CODING'
      ]
      facultyList.forEach(f => {
        const docRef = doc(db, 'faculties', f.replace(/\s+/g, '-')) // Stable IDs
        batch.set(docRef, { name: f, createdAt: new Date().toISOString() })
      })

      // 2. Seed Institutions
      const instList = ['NAD CLASS', 'KSP RWANDA', 'NAD PRODUCTION']
      instList.forEach(i => {
        const docRef = doc(db, 'institutions', i.replace(/\s+/g, '-'))
        batch.set(docRef, { name: i, createdAt: new Date().toISOString() })
      })

      // 3. Seed Courses with respective Faculty assignments
      const coursesToSeed = [
        { 
          title: 'FILMMAKING', 
          faculties: ['MULTIMEDIA PRODUCTION', 'FILMMAKING AND VIDEO PRODUCTION'],
          description: 'Master the art of storytelling and cinematic production.'
        },
        { 
          title: 'CAMERA OPERATION', 
          faculties: ['MULTIMEDIA PRODUCTION', 'FILMMAKING AND VIDEO PRODUCTION', 'PHOTOGRAPHY'],
          description: 'Technical mastery of professional cinema and photography cameras.'
        },
        { 
          title: 'VIDEO EDITING', 
          faculties: ['MULTIMEDIA PRODUCTION', 'FILMMAKING AND VIDEO PRODUCTION'],
          description: 'Post-production excellence using industry software.'
        }
      ]

      coursesToSeed.forEach(c => {
        const docRef = doc(db, 'courses', c.title.replace(/\s+/g, '-'))
        batch.set(docRef, { 
          ...c, 
          faculty: c.faculties[0], // Legacy support
          units: [], 
          createdAt: new Date().toISOString() 
        })
      })

      // 4. Seed Student Marks
      const csvData = [
        ["DORA SHOLAMI","MWAMIKAZI","KSP0103999","N/A",54,"E",73,"B",95,"A+",74.00,"B"],
        ["MARIE ASSOUMPTA","UWAMAHORO","KSP0103023","N/A",90,"A+",97,"A+",94,"A+",93.67,"A+"],
        ["LEATITIA","NIYOMUBYEYI","KSP0103942","MULTIMEDIA PRODUCTION",71,"B",93,"A+",60,"C",74.67,"B"],
        ["REHEMA","IKIREZI","KSP0103929","MULTIMEDIA PRODUCTION",52,"E",78,"B+",71,"B",67.00,"C+"],
        ["JEAN D'AMOUR","BYIRINGIRO","KSP0103955","MULTIMEDIA PRODUCTION",50,"E",76,"B+",44,"F",56.67,"D"],
        ["ALBERT","DUSHIMIMANA","KSP0101952","FILMMAKING AND VIDEO PRODUCTION",3,"F",74,"B",46,"F",41.00,"F"],
        ["JEAN CHRISOSTOME","TUMWESIGE","KSP0101998","FILMMAKING AND VIDEO PRODUCTION",51,"E",74,"B",80,"A",68.33,"C+"],
        ["ALAIN CRISPIN","HIRWA","KSP0101953","FILMMAKING AND VIDEO PRODUCTION",14,"F",61,"C",62,"C",45.67,"F"],
        ["MUS'AB","RUGAMBA","KSP01013010","N/A",95,"A+",96,"A+",99,"A+",96.67,"A+"],
        ["EDMOND","SHEMA","KSP0103918","N/A",60,"C",98,"A+",57,"D",71.67,"B"],
        ["PASCAL","TUYIZERE","KSP01031003","N/A",71,"B",81,"A",74,"B",75.33,"B+"],
        ["MICHAEL","KAMANZI","KSP01031011","N/A",61,"C",75,"B+",94,"A+",76.67,"B+"],
        ["ALIANE","ISIMBI","KSP010301140","N/A",70,"B",73,"B",96,"A+",79.67,"B+"],
        ["ERIC","MATSIKO","KSP010301234","N/A",27,"F",31,"F",37,"F",31.67,"F"],
        ["NELLY","MUGWANEZA","KSP010301151","N/A",71,"B",23,"F",92,"A+",62.00,"C"],
        ["CLEMENTINE","NYIRAHABIMANA","KSP010301257","N/A",65,"C+",0,"F",71,"B",45.33,"F"],
        ["PATRICK","ITANGISHAKA","KSP010301313","N/A",44,"F",0,"F",67,"C+",37.00,"F"],
        ["DONAT","SIKWIREBA","KSP010101133","N/A",28,"F",41,"F",71,"B",46.67,"F"],
        ["CHRISTELLAH","UMURERWA","KSP010301207","N/A",83,"A",70,"B",93,"A+",82.00,"A"],
        ["JEAN GENTILLE","DUSHIMEYEZU","KSP010301163","N/A",0,"F",74,"B",89,"A",54.33,"E"],
        ["GAD DAVID","FARADJA","KSP010301167","N/A",80,"A",88,"A",83,"A",83.67,"A"],
        ["GRACE","UWERA","KSP01031024","N/A",70,"B",96,"A+",98,"A+",88.00,"A"],
        ["PACIFIQUE","KAYITARE","KSP01031045","N/A",98,"A+",96,"A+",98,"A+",97.33,"A+"],
        ["JEAN YVES","HARORIMANA","N/A","MULTIMEDIA PRODUCTION",84.17,"A",92,"A+",88.65,"A",88.27,"A"],
        ["SANO AURORE","ISIMBI","KSP0101898","FILMMAKING AND VIDEO PRODUCTION",76.77,"B+",82.47,"A",86.5,"A",81.91,"A"],
        ["UWASE SQUELY KESSY","MUSIRUKA","N/A","N/A",77.33,"B+",65,"C+",79,"B+",73.78,"B"],
        ["CEDRIC","ISHIMWE","N/A","N/A",61.67,"C",37.75,"F",68,"C+",55.81,"D"],
        ["LOIC","NTIRANDEKURA","N/A","N/A",42.67,"F",57.7,"D",36,"F",45.46,"F"],
        ["IDRISSA","BAYIZERE","N/A","N/A",43.67,"F",0,"F",68,"C+",37.22,"F"],
        ["ROSINE","NZAKIZWANIMANA","N/A","N/A",0,"F",0,"F",82,"A",27.33,"F"],
        ["THEONESTE","SEBERA","N/A","N/A",0,"F",0,"F",82,"A",27.33,"F"],
        ["KENNY BLAISE","RUGAMBA","N/A","N/A",30.67,"F",43.1,"F",7,"F",26.92,"F"],
        ["DJAMUHULI","MUKIZA","KSP0103882","MULTIMEDIA PRODUCTION",74.5,"B",81,"A",79.5,"B+",78.33,"B+"],
        ["ALEX","GASANA","N/A","N/A",0,"F",0,"F",78,"B+",26.00,"F"],
        ["ANASTASE","NTEZIRYAYO","N/A","N/A",0,"F",0,"F",60,"C",20.00,"F"],
        ["GAD","TUYISENGE","KSP0101944","FILMMAKING AND VIDEO PRODUCTION",90.5,"A+",99,"A+",91,"A+",93.50,"A+"],
        ["UZARAMA JEAN CLAUDE","MUVUNYI","KSP0103939","MULTIMEDIA PRODUCTION",0,"F",0,"F",0,"F",0.00,"F"],
        ["WELLARS","GAKIRE","KSP01019445","FILMMAKING AND VIDEO PRODUCTION",62,"C",85,"A",78.5,"B+",75.17,"B+"],
        ["SAMUEL","GAKUBA","KSP0103938","MULTIMEDIA PRODUCTION",51,"E",88,"A",48.5,"F",62.50,"C"],
        ["JEANNE","UWIMBABAZI","KSP0101943","FILMMAKING AND VIDEO PRODUCTION",67,"C+",88,"A",85,"A",80.00,"A"],
        ["SHEMA ALLIANCE","HABIYAREMYE","KSP 0103919","MULTIMEDIA PRODUCTION",92,"A+",90,"A+",70,"B",84.00,"B+"],
        ["ARCHANGE","MBABAZI","KSP0101951","FILMMAKING AND VIDEO PRODUCTION",73,"B",66,"C+",66,"C+",68.33,"C+"],
        ["CHANCELINE","UWIMANA","KSP0103937","MULTIMEDIA PRODUCTION",71,"B",89,"A",88.5,"A",82.83,"A"],
        ["MUGABO REMY","KWIZERA","KSP0103924","MULTIMEDIA PRODUCTION",71,"B",97,"A+",82.5,"A",83.50,"A"],
        ["STEVEN","MUHIZI","N/A","FILMMAKING AND VIDEO PRODUCTION",62,"C",0,"F",0,"F",20.67,"F"],
        ["PATRICK","KAYITARE","N/A","FILMMAKING AND VIDEO PRODUCTION",43,"F",0,"F",0,"F",14.33,"F"],
        ["JOSELYNE","NIKUZE","N/A","FILMMAKING AND VIDEO PRODUCTION",96,"A+",0,"F",0,"F",32.00,"F"],
        ["CHARLES","TUYISENGE","KSP0101963","FILMMAKING AND VIDEO PRODUCTION",70,"B",75,"B+",54,"E",66.33,"C+"],
        ["BRUCE","MANZI","KSP0103960","MULTIMEDIA PRODUCTION",56,"D",80,"A",0,"F",45.33,"F"],
        ["EMMANUEL","ABAYEZU","KSP0/03974","MULTIMEDIA PRODUCTION",0,"F",72,"B",0,"F",24.00,"F"],
        ["CHARLES LWANGA","NIYORUGIRA","KSP0103958","MULTIMEDIA PRODUCTION",72,"B",78,"B+",66.5,"C+",72.17,"B"],
        ["THIERRY","IRADUKUNDA","KSP0101946","MULTIMEDIA PRODUCTION",93,"A+",90,"A+",95.5,"A+",92.83,"A+"],
        ["JACQUELINE","UWERA","KSP0103957","MULTIMEDIA PRODUCTION",80,"A",93,"A+",50.5,"E",74.50,"B"],
        ["SIMPLICE","KWIZERA","KSP0103961","MULTIMEDIA PRODUCTION",0,"F",73,"B",82.5,"A",51.83,"E"],
        ["EMMANUEL","ISHIMWE","KSP0103959","MULTIMEDIA PRODUCTION",74,"B",0,"F",64,"C",46.00,"F"],
        ["EVIDENCE","MUGISHA","KSP0103925","MULTIMEDIA PRODUCTION",41,"F",81,"A",63,"C",61.67,"C"],
        ["ALLAN CHRISTOPHER","TABAARA","KSP0101983","FILMMAKING AND VIDEO PRODUCTION",68,"C+",78,"B+",86,"A",77.33,"B+"]
      ]

      csvData.forEach(row => {
        const docRef = doc(collection(db, 'marks'))
        batch.set(docRef, {
          firstName: row[0],
          lastName: row[1],
          regNumber: row[2],
          faculty: row[3],
          marks: {
            'FILMMAKING': row[4],
            'CAMERA OPERATION': row[6],
            'VIDEO EDITING': row[8]
          },
          averageMarks: row[10],
          overallGrade: row[11],
          institution: 'NAD CLASS',
          gender: 'Male',
          createdAt: new Date().toISOString()
        })
      })

      await batch.commit()
      alert('Full initial data seeded successfully (Faculties, Institutions, Courses, and Marks)!')
    } catch (err) {
      console.error(err)
      alert('Seeding failed.')
    } finally {
      setIsSeeding(false)
    }
  }


  const filteredMarks = marks.filter(mark => 
    mark.firstName?.toLowerCase().includes(search.toLowerCase()) || 
    mark.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    mark.regNumber?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Marks <span className="text-accent">Manager</span></h1>
          <p className="text-white/40 text-sm mt-1">Manage and update student records and performance marks.</p>
        </div>
        <div className="flex items-center gap-3">
          {isMaster && (
             <button 
              onClick={seedInitialData}
              disabled={isSeeding}
              className="btn-outline flex items-center gap-2 border-accent/20 text-accent hover:bg-accent/10"
             >
               <Database size={16} /> {isSeeding ? 'Seeding...' : 'Seed Data'}
             </button>
          )}
          <button 
            onClick={() => {
              setSelectedMark(null)
              setFormData({
                firstName: '',
                lastName: '',
                regNumber: '',
                faculty: userData?.faculty || 'MULTIMEDIA PRODUCTION',
                institution: 'NAD CLASS',
                gender: 'Male',
                marks: {}
              })
              setSelectedCourses([])
              setIsModalOpen(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Add Student
          </button>
          
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="btn-outline flex items-center gap-2 bg-white/5 hover:bg-white/10"
          >
            <FileSpreadsheet size={18} /> Generate Report
          </button>

        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative max-w-md w-full">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
           <input 
            type="text" 
            placeholder="Search by name or reg number..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-colors"
           />
        </div>
        <div className="text-xs text-white/40 font-bold uppercase tracking-widest">
           Showing {filteredMarks.length} Records
        </div>
      </div>

      <div className="glass rounded-[40px] border border-white/5 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5 text-left">
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">Student</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">Faculty</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40 text-center">Avg %</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40 text-center">Grade</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMarks.map((mark) => (
              <tr key={mark.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-6">
                  <div>
                    <p className="font-bold">{mark.firstName} {mark.lastName}</p>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{mark.regNumber}</p>
                  </div>
                </td>
                <td className="p-6">
                  <p className="text-xs text-white/60 font-bold uppercase">{mark.faculty}</p>
                  <p className="text-[10px] text-white/30 truncate max-w-[150px]">
                    {Object.keys(mark.marks || {}).join(', ')}
                  </p>
                </td>
                <td className="p-6 text-center">
                  <p className="font-bold text-accent">{mark.averageMarks}%</p>
                </td>
                <td className="p-6 text-center">
                  <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary-light font-bold text-xs">{mark.overallGrade}</span>
                </td>
                <td className="p-6">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => {
                        setSelectedMark(mark)
                        const existingMarks = mark.marks || {}
                        setFormData({
                          ...mark,
                          marks: existingMarks
                        })
                        setSelectedCourses(Object.keys(existingMarks))
                        setIsModalOpen(true)
                      }}
                      className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button 
                      onClick={() => handleDelete(mark.id)}
                      className="p-2 hover:bg-white/5 rounded-lg text-red-500/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {/* Report Generation Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReportModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl glass p-10 rounded-[40px] border border-white/5 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-2xl font-display font-bold text-accent">Custom Report Generator</h3>
                   <p className="text-xs text-white/40 mt-1">Select columns to include in your export.</p>
                </div>
                <button onClick={() => setIsReportModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {Object.keys(reportColumns).map(key => (
                  <label key={key} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                    <input 
                      type="checkbox" 
                      className="accent-accent w-4 h-4 cursor-pointer"
                      checked={reportColumns[key]}
                      onChange={(e) => setReportColumns({...reportColumns, [key]: e.target.checked})}
                    />
                    <span className="text-sm font-bold text-white/80">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                <button 
                  onClick={handleExportCSV}
                  className="w-full btn-primary py-4 text-xs tracking-widest font-bold flex items-center justify-center gap-2"
                >
                   <Download size={18} /> EXCEL (CSV)
                </button>
                <button 
                  onClick={handlePrintPDF}
                  className="w-full btn-outline py-4 text-xs tracking-widest font-bold flex items-center justify-center gap-2"
                >
                   <FileSpreadsheet size={18} /> PRINT PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass p-10 rounded-[40px] border border-white/5 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-display font-bold">{selectedMark ? 'Edit' : 'Add'} Student Mark</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={24}/></button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">First Name</label>
                     <input 
                      type="text" required 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-sm"
                      value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Last Name</label>
                     <input 
                      type="text" required 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-sm"
                      value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                     />
                   </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Reg Number</label>
                     <input 
                      type="text" required 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-sm"
                      value={formData.regNumber} onChange={(e) => setFormData({...formData, regNumber: e.target.value.toUpperCase()})}
                     />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Faculty</label>
                      {isMaster ? (
                        <select 
                         className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-sm appearance-none"
                         value={formData.faculty} 
                         onChange={(e) => {
                           setFormData({...formData, faculty: e.target.value, marks: {}})
                           setSelectedCourses([])
                         }}
                         >
                          {universityFaculties.length > 0 ? (
                            universityFaculties.map(f => (
                              <option key={f} value={f} className="bg-background">{f}</option>
                            ))
                          ) : (
                            <option value={userData?.faculty} className="bg-background">{userData?.faculty}</option>
                          )}
                          <option value="N/A" className="bg-background">Other/General</option>
                        </select>

                      ) : (
                        <input 
                         type="text" disabled 
                         className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm opacity-50 cursor-not-allowed"
                         value={formData.faculty}
                        />
                      )}
                   </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Gender</label>
                      <select 
                       className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent transition-colors appearance-none text-sm"
                       value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      >
                        <option value="Male" className="bg-background">Male</option>
                        <option value="Female" className="bg-background">Female</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Institution</label>
                      <select 
                       className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent appearance-none text-sm transition-colors"
                       value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})}
                      >
                        {universityInstitutions.length > 0 ? (
                          universityInstitutions.map(inst => (
                            <option key={inst} value={inst} className="bg-background">{inst}</option>
                          ))
                        ) : (
                          <option value="NAD CLASS" className="bg-background">NAD CLASS</option>
                        )}
                        <option value="Other" className="bg-background">Other</option>
                      </select>
                    </div>

                 </div>

                 <div className="pt-6 border-t border-white/5 space-y-8">
                   <div className="space-y-4">
                     <h4 className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">Step 1: Select Courses for this Student</h4>
                     <div className="flex flex-wrap gap-2">
                        {availableCourses.length > 0 ? (
                          availableCourses.map(course => (
                            <button 
                              key={course}
                              type="button"
                              onClick={() => {
                                const updated = selectedCourses.includes(course)
                                  ? selectedCourses.filter(c => c !== course)
                                  : [...selectedCourses, course]
                                setSelectedCourses(updated)
                              }}
                              className={`text-[10px] font-bold py-2.5 px-4 rounded-xl border transition-all ${selectedCourses.includes(course) ? 'bg-accent text-background border-accent' : 'border-white/10 text-white/40 hover:border-white/20'}`}
                            >
                              {course}
                            </button>
                          ))
                        ) : (
                          <p className="text-white/20 text-[10px] italic">No active courses found for this faculty in the curriculum system.</p>
                        )}
                     </div>
                   </div>

                   {selectedCourses.length > 0 && (
                     <div className="space-y-6 pt-6 border-t border-white/5">
                        <h4 className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">Step 2: Enter Component Marks</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {selectedCourses.map((course) => (
                            <div key={course} className="space-y-4 bg-white/2 p-6 rounded-3xl border border-white/5 hover:border-accent/10 transition-all">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-white uppercase tracking-widest">{course}</label>
                                <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-lg">{calculateGrade(formData.marks[course] || 0)}</span>
                              </div>
                              <div className="relative">
                                <input 
                                  type="number" min="0" max="100"
                                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-xl font-bold tracking-tighter"
                                  value={formData.marks[course] || ''} 
                                  onChange={(e) => setFormData({
                                    ...formData, 
                                    marks: { ...formData.marks, [course]: e.target.value }
                                  })}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 font-bold">%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                     </div>
                   )}
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 mt-8"
                >
                  <Save size={18} /> {selectedMark ? 'Update Record' : 'Save New Record'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
