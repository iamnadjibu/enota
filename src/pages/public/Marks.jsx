import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileText, Download, AlertCircle, TrendingUp, User, GraduationCap, MapPin } from 'lucide-react'
import PublicLayout from '../../layouts/PublicLayout'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function Marks() {
  const [regNumber, setRegNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [studentData, setStudentData] = useState(null)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!regNumber.trim()) return

    setLoading(true)
    setError('')
    setStudentData(null)

    try {
      const q = query(collection(db, 'marks'), where('regNumber', '==', regNumber.trim()))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        setStudentData(querySnapshot.docs[0].data())
      } else {
        setError('No records found for this Registration Number.')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while fetching data.')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    const element = document.getElementById('report-card')
    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`${studentData.firstName}_${studentData.lastName}_Marks.pdf`)
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

          {studentData && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Report Preview */}
              <div id="report-card" className="bg-white text-black p-8 md:p-12 rounded-lg shadow-2xl overflow-hidden font-sans border border-primary/20">
                <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-primary/20 pb-8 mb-8 gap-6">
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-extrabold text-primary mb-1 tracking-tighter">ENOTA PORTAL</h2>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-primary opacity-60">The Marks Report</p>
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
                  </div>
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
                    <tr className="bg-primary/5">
                      <td className="py-4 px-6 font-bold text-primary uppercase text-sm">AVERAGE</td>
                      <td className="py-4 px-6 text-center font-extrabold text-primary text-lg">{studentData.averageMarks}</td>
                      <td className="py-4 px-6"></td>
                    </tr>
                  </tbody>
                </table>

                <div className="border border-primary rounded-xl p-6 bg-primary/2">
                   <h4 className="text-[10px] uppercase font-bold text-primary/60 mb-4 tracking-widest">Grading Scale Reference</h4>
                   <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-[10px]">
                      <div><span className="font-bold">A+:</span> 90-100</div>
                      <div><span className="font-bold">A:</span> 80-89.9</div>
                      <div><span className="font-bold">B+:</span> 75-79.9</div>
                      <div><span className="font-bold">B:</span> 70-74.9</div>
                      <div><span className="font-bold">C+:</span> 65-69.9</div>
                   </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100 text-center">
                  <p className="text-[10px] text-gray-400 font-medium">Generated by eNOTA Portal • nadproduction.com</p>
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={downloadPDF}
                  className="btn-primary flex items-center gap-2 px-12 py-4"
                >
                  <Download size={20} /> Download Report
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicLayout>
  )
}
