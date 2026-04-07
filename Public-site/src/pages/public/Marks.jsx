import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileText, Download, AlertCircle, TrendingUp, User, GraduationCap, MapPin } from 'lucide-react'
import PublicLayout from '../../layouts/PublicLayout'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function Marks() {
  const getProfessionalComment = (grade) => {
    const comments = {
      'A+': "Congratulations! You have excelled in your academic pursuit with exceptional distinction.",
      'A': "Congratulations! An outstanding result showcasing a high level of academic competence.",
      'B+': "Congratulations! A very commendable performance; keep maintaining these high standards.",
      'B': "Congratulations! You have performed well and met the core objectives of the program.",
      'C+': "Satisfactory performance. Nice job on successfully navigating the requirements.",
      'C': "Passed. You have demonstrated the necessary knowledge to meet the course standards.",
      'D': "Passed. You have met the minimum requirements. Consistent effort will yield even better results.",
      'E': "Passed. Requirement met. We encourage you to intensify your efforts for future modules.",
      'F': "Unsatisfactory. You did not meet the minimum threshold. Please consult your instructor for a review."
    }
    return comments[grade] || "Result processed. Please contact administration for more details."
  }
  const [regNumber, setRegNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  
  // Claim Your Spot State
  const [showClaimForm, setShowClaimForm] = useState(false)
  const [claimData, setClaimData] = useState({
    firstName: '',
    lastName: '',
    regNumber: '',
    gender: 'Male',
    faculty: 'FILMMAKING AND VIDEO PRODUCTION',
    institution: 'NAD CLASS'
  })

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!regNumber.trim()) return

    setLoading(true)
    setError('')
    setResults([])

    try {
      const q = query(collection(db, 'marks'), where('regNumber', '==', regNumber.trim().toUpperCase()))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        setResults(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } else {
        setError('No records found for this Registration Number.')
        setShowClaimForm(true)
        setClaimData({ ...claimData, regNumber: regNumber.toUpperCase() })
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while fetching data.')
    } finally {
      setLoading(false)
    }
  }


  const downloadPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const elements = document.querySelectorAll('.report-card-container')
    
    setLoading(true)
    for (let i = 0; i < elements.length; i++) {
      const canvas = await html2canvas(elements[i], { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    }
    
    const name = results[0] ? `${results[0].firstName}_${results[0].lastName}` : 'Marks'
    pdf.save(`${name}_Full_Report.pdf`)
    setLoading(false)
  }


  const handleClaimSpot = (e) => {
    e.preventDefault()
    const message = `Hello eNOTA Team, I want to claim my spot.%0A%0A*First Name:* ${claimData.firstName}%0A*Last Name:* ${claimData.lastName}%0A*Reg Number:* ${claimData.regNumber}%0A*Gender:* ${claimData.gender}%0A*Faculty:* ${claimData.faculty}%0A*Institution:* ${claimData.institution}`
    window.open(`https://wa.me/250786487234?text=${message}`, '_blank')
  }

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-20">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-display font-extrabold mb-4 tracking-tight"
          >
            Check your <span className="text-accent">Marks</span>
          </motion.h1>
          <p className="text-white/50">Enter your Registration Number to view your progress report.</p>
        </div>

        <form onSubmit={handleSearch} className="relative mb-16 max-w-2xl mx-auto">
          <div className="flex items-center glass p-2 rounded-full border-white/10 group focus-within:border-accent/50 transition-colors">
            <Search className="ml-4 text-white/40" size={24} />
            <input 
              type="text" 
              required
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              placeholder="Enter Reg Number (e.g. KSP0101998)" 
              className="w-full bg-transparent border-none py-4 px-4 text-white focus:outline-none placeholder:text-white/20"
            />
            <button 
              disabled={loading}
              className="btn-primary py-3 px-8 text-sm disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 flex items-center gap-3 justify-center mb-8"
            >
              <AlertCircle size={24} /> {error}
            </motion.div>
          )}

          {showClaimForm && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-8 rounded-[40px] border border-accent/20 space-y-8"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold tracking-tight mb-2">Claim <span className="text-accent">Your Spot</span></h3>
                    <p className="text-white/40 text-sm">Fill in your correct details and the eNOTA team will attend to your enrollment.</p>
                  </div>

                  <form onSubmit={handleClaimSpot} className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">First Name</label>
                       <input 
                        type="text" required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-sm"
                        value={claimData.firstName} onChange={(e) => setClaimData({...claimData, firstName: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Last Name</label>
                       <input 
                        type="text" required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-sm"
                        value={claimData.lastName} onChange={(e) => setClaimData({...claimData, lastName: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Reg Number</label>
                       <input 
                        type="text" disabled
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-sm opacity-50 cursor-not-allowed"
                        value={claimData.regNumber}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Gender</label>
                       <select 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-sm appearance-none"
                        value={claimData.gender} onChange={(e) => setClaimData({...claimData, gender: e.target.value})}
                       >
                         <option className="bg-background">Male</option>
                         <option className="bg-background">Female</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Faculty</label>
                       <select 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-sm appearance-none"
                        value={claimData.faculty} onChange={(e) => setClaimData({...claimData, faculty: e.target.value})}
                       >
                         {['FILMMAKING AND VIDEO PRODUCTION', 'MULTIMEDIA PRODUCTION', 'COLOR GRADING', 'AI FILMMAKING', 'VIBE CODING'].map(f => (
                           <option key={f} className="bg-background">{f}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Institution</label>
                       <select 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent text-sm appearance-none"
                        value={claimData.institution} onChange={(e) => setClaimData({...claimData, institution: e.target.value})}
                       >
                         {['NAD CLASS', 'KSP RWANDA', 'NAD PRODUCTION'].map(i => (
                           <option key={i} className="bg-background">{i}</option>
                         ))}
                       </select>
                    </div>
                    
                    <button type="submit" className="md:col-span-2 btn-primary py-4 text-sm font-bold flex items-center justify-center gap-3">
                       Send to WhatsApp (+250786487234)
                    </button>
                  </form>
                </motion.div>
              )}
          {results.length > 0 && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16"
            >
              {results.map((studentData) => (
                <div key={studentData.id} className="report-card-container space-y-8">
                  <div className="report-card bg-white text-black p-8 md:p-12 rounded-lg shadow-2xl overflow-hidden font-sans border border-primary/20">
                    <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-primary/20 pb-8 mb-8 gap-6">
                      <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                        <img src="/android-chrome-512x512.png" alt="eNOTA Logo" className="w-16 h-16 rounded-xl border border-primary/10 shadow-sm" />
                        <div>
                          <h2 className="text-3xl font-extrabold text-primary mb-1 tracking-tighter">eNOTA PORTAL</h2>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-primary opacity-60">The Marks Report</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 bg-primary/5 px-6 py-4 rounded-xl border border-primary/10">
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-primary/60">Overall Grade</p>
                          <p className="text-3xl font-extrabold text-primary leading-none">{studentData.overallGrade}</p>
                        </div>
                        <div className="w-px h-8 bg-primary/20"></div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-primary/60">T. Average</p>
                          <p className="text-3xl font-extrabold text-primary leading-none">{studentData.averageMarks}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <User size={18} className="text-primary" />
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">Student Name</p>
                            <p className="font-bold text-lg">{studentData.firstName} {studentData.lastName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <GraduationCap size={18} className="text-primary" />
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">Faculty/Department</p>
                            <p className="font-bold text-lg">{studentData.faculty || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-primary" />
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">Reg Number</p>
                            <p className="font-bold text-lg">{studentData.regNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin size={18} className="text-primary" />
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">Institution</p>
                            <p className="font-bold text-lg">{studentData.institution || 'NAD CLASS'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <User size={18} className="text-primary opacity-40" />
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">Gender</p>
                            <p className="font-bold text-lg">{studentData.gender || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 mb-12 italic">
                       <p className="text-sm text-primary font-medium text-center">
                         "{getProfessionalComment(studentData.overallGrade)}"
                       </p>
                    </div>

                    <table className="w-full border-collapse border border-primary overflow-hidden rounded-t-xl mb-12">
                      <thead>
                        <tr className="bg-primary text-white">
                          <th className="py-4 px-6 text-left font-bold uppercase tracking-widest text-xs">Courses</th>
                          <th className="py-4 px-6 text-center font-bold uppercase tracking-widest text-xs">Marks</th>
                          <th className="py-4 px-6 text-center font-bold uppercase tracking-widest text-xs">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentData.marks ? (
                          Object.entries(studentData.marks).map(([course, mark]) => (
                            <tr key={course} className="border-b border-primary/10">
                              <td className="py-4 px-6 font-bold uppercase text-xs">{course}</td>
                              <td className="py-4 px-6 text-center font-bold">{mark}</td>
                              <td className="py-4 px-6 text-center">
                                <span className="font-bold text-primary">
                                  {studentData[`grade${course.replace(/\s+/g, '')}`] || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <>
                            <tr className="border-b border-primary/10">
                              <td className="py-4 px-6 font-medium">FILMMAKING</td>
                              <td className="py-4 px-6 text-center font-bold">{studentData.filmmakingMarks ?? 'N/A'}</td>
                              <td className="py-4 px-6 text-center"><span className="font-bold text-primary">{studentData.gradeFilmmaking || 'N/A'}</span></td>
                            </tr>
                            <tr className="border-b border-primary/10">
                              <td className="py-4 px-6 font-medium">CAMERA OPERATION</td>
                              <td className="py-4 px-6 text-center font-bold">{studentData.cameraOperationMarks ?? 'N/A'}</td>
                              <td className="py-4 px-6 text-center"><span className="font-bold text-primary">{studentData.gradeCameraOperation || 'N/A'}</span></td>
                            </tr>
                            <tr className="border-b border-primary/20">
                              <td className="py-4 px-6 font-medium">VIDEO EDITING</td>
                              <td className="py-4 px-6 text-center font-bold">{studentData.videoEditingMarks ?? 'N/A'}</td>
                              <td className="py-4 px-6 text-center"><span className="font-bold text-primary">{studentData.gradeVideoEditing || 'N/A'}</span></td>
                            </tr>
                          </>
                        )}
                        <tr className="bg-primary/5">
                          <td className="py-4 px-6 font-bold text-primary uppercase text-sm">AVERAGE</td>
                          <td className="py-4 px-6 text-center font-extrabold text-primary text-lg">{studentData.averageMarks}</td>
                          <td className="py-4 px-6"></td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="border border-primary rounded-xl p-6 bg-primary/2">
                        <h4 className="text-[10px] uppercase font-bold text-primary/60 mb-4 tracking-widest">Master Grading Scale Reference</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-4 gap-x-2 text-[10px]">
                          <div><span className="font-bold text-primary">A+:</span> 90-100 (Excelled)</div>
                          <div><span className="font-bold text-primary">A:</span> 80-89.9 (Very Good)</div>
                          <div><span className="font-bold text-primary">B+:</span> 75-79.9 (Nice)</div>
                          <div><span className="font-bold text-primary">B:</span> 70-74.9 (Good)</div>
                          <div><span className="font-bold text-primary">C+:</span> 65-69.9 (Satisfactory)</div>
                          <div><span className="font-bold text-primary">C:</span> 60-64.9 (Passed)</div>
                          <div><span className="font-bold text-primary">D:</span> 55-59.9 (Passed)</div>
                          <div><span className="font-bold text-primary">E:</span> 50-54.9 (Passed)</div>
                          <div><span className="font-bold text-red-500">F:</span> &lt; 50 (Failed)</div>
                        </div>
                    </div>

                    <div className="mt-12 text-center py-6 border-y border-primary/5">
                        <p className="text-xl font-display font-bold italic text-primary/80">
                          "Well begun is half done"
                        </p>
                        <p className="text-xs font-bold text-primary/40 uppercase tracking-widest mt-2">
                          — Aristotle
                        </p>
                    </div>

                    <div className="mt-8 text-center">
                      <p className="text-[10px] text-gray-400 font-medium">Generated by eNOTA Portal • nadproduction.com</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-center pb-20">
                <button 
                  onClick={downloadPDF}
                  className="btn-primary flex items-center gap-2 px-12 py-4 shadow-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Download size={20} /> Download Combined Report
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicLayout>
  )
}
