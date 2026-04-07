import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, GraduationCap, Award, TrendingUp, BarChart3, PieChart as PieChartIcon, ChevronRight, ChevronDown } from 'lucide-react'
import { collection, query, getDocs, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'

export default function Dashboard() {
  const { userData, isMaster } = useAuth()
  const navigate = useNavigate()
  const [rawMarks, setRawMarks] = useState([])
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedFaculty, setExpandedFaculty] = useState(null)
  
  // Master Admin can select 'All' or a specific faculty
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState('All')

  useEffect(() => {
    // Fetch dynamic faculties list
    const unsubFaculties = onSnapshot(collection(db, 'faculties'), (snapshot) => {
      setFaculties(snapshot.docs.map(doc => doc.data().name).sort())
    })
    return () => unsubFaculties()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!isMaster && !userData?.faculty) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const marksRef = collection(db, 'marks')
        let q = marksRef
        
        // Non-masters only get their faculty's data
        if (!isMaster && userData?.faculty && userData.faculty !== 'N/A') {
          q = query(marksRef, where('faculty', '==', userData.faculty))
        }

        const querySnapshot = await getDocs(q)
        setRawMarks(querySnapshot.docs.map(doc => doc.data()))
      } catch (err) {
        console.error("Dashboard error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isMaster, userData?.faculty])

  // Filter marks based on the selected dropdown
  const filteredMarks = useMemo(() => {
    if (selectedFacultyFilter === 'All') return rawMarks
    return rawMarks.filter(mark => mark.faculty === selectedFacultyFilter)
  }, [rawMarks, selectedFacultyFilter])

  // Global Stats based on filter
  const stats = useMemo(() => {
    if (filteredMarks.length === 0) return { totalStudents: 0, averageGrade: 'N/A', topFaculty: selectedFacultyFilter, passingRate: '0%' }
    
    const total = filteredMarks.length
    const avg = (filteredMarks.reduce((acc, curr) => acc + (parseFloat(curr.averageMarks) || 0), 0) / total).toFixed(2)
    const passing = (filteredMarks.filter(d => parseFloat(d.averageMarks) >= 50).length / total * 100).toFixed(0)

    return {
      totalStudents: total,
      averageGrade: `${avg}%`,
      topFaculty: selectedFacultyFilter === 'All' ? 'All Faculties' : selectedFacultyFilter,
      passingRate: `${passing}%`
    }
  }, [filteredMarks, selectedFacultyFilter])

  // Chart Data
  const chartData = useMemo(() => {
    if (filteredMarks.length === 0) return []
    // Dynamically calculate averages for all courses present in the dataset
    const courseTotals = {}
    const courseCounts = {}
    
    filteredMarks.forEach(student => {
      if (student.marks) {
        Object.entries(student.marks).forEach(([course, mark]) => {
          const val = parseFloat(mark) || 0
          courseTotals[course] = (courseTotals[course] || 0) + val
          courseCounts[course] = (courseCounts[course] || 0) + 1
        })
      }
    })

    return Object.keys(courseTotals).map(course => ({
      name: course.length > 15 ? course.substring(0, 15) + '...' : course,
      value: parseFloat((courseTotals[course] / courseCounts[course]).toFixed(1))
    }))
  }, [filteredMarks])

  // Gender Data
  const genderData = useMemo(() => {
    const maleMarks = filteredMarks.filter(d => d.gender === 'Male')
    const femaleMarks = filteredMarks.filter(d => d.gender === 'Female')
    
    return [
      { name: 'Male', value: maleMarks.length > 0 ? parseFloat((maleMarks.reduce((acc, curr) => acc + (parseFloat(curr.averageMarks) || 0), 0) / maleMarks.length).toFixed(1)) : 0 },
      { name: 'Female', value: femaleMarks.length > 0 ? parseFloat((femaleMarks.reduce((acc, curr) => acc + (parseFloat(curr.averageMarks) || 0), 0) / femaleMarks.length).toFixed(1)) : 0 }
    ]
  }, [filteredMarks])


  // Helper to get stats for a specific faculty (for the accordion menu)
  const getFacultyStats = (facultyName) => {
    const data = rawMarks.filter(m => m.faculty === facultyName)
    if (data.length === 0) return { avg: 'N/A', count: 0, pass: 'N/A' }
    
    const total = data.length
    const avg = (data.reduce((acc, curr) => acc + (parseFloat(curr.averageMarks) || 0), 0) / total).toFixed(1)
    const passing = (data.filter(d => parseFloat(d.averageMarks) >= 50).length / total * 100).toFixed(0)
    
    return { avg: `${avg}%`, count: total, pass: `${passing}%` }
  }


  const statCards = [
    { label: 'Registered Students', value: stats.totalStudents, icon: <Users className="text-accent" />, trend: 'Active' },
    { label: 'Average Marks', value: stats.averageGrade, icon: <GraduationCap className="text-secondary" />, trend: 'Overall Focus' },
    { label: 'Passing Rate', value: stats.passingRate, icon: <Award className="text-accent" />, trend: 'Target: >50%' },
    { label: 'Active Faculty', value: stats.topFaculty, icon: <TrendingUp className="text-secondary" />, truncate: true },
  ]

  if (loading) return <div className="p-20 text-center text-white/50 animate-pulse tracking-widest font-bold">Loading Analytics...</div>

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Welcome Back, {userData?.firstName}</h1>
          <p className="text-white/40 text-sm mt-1">Here's a summary of class performances today.</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {isMaster && (
            <div className="relative">
              <select 
                className="appearance-none bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-sm font-bold text-accent focus:outline-none focus:border-accent cursor-pointer"
                value={selectedFacultyFilter}
                onChange={(e) => setSelectedFacultyFilter(e.target.value)}
              >
                <option value="All" className="bg-background text-white">All Faculties</option>
                {faculties.map(f => (
                  <option key={f} value={f} className="bg-background text-white">{f}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-accent pointer-events-none" />
            </div>
          )}
          <button onClick={() => navigate('/marks')} className="btn-outline py-3 px-6 text-xs font-bold uppercase tracking-widest">Generate Report</button>
          <button onClick={() => navigate('/marks')} className="btn-primary py-3 px-6 text-xs font-bold uppercase tracking-widest">Manage Marks</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 -mr-12 -mt-12 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                {card.icon}
              </div>
            </div>
            <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-1">{card.label}</p>
            <h3 className={`text-2xl font-bold ${card.truncate ? 'truncate max-w-[150px]' : ''}`}>{card.value}</h3>
            <p className="text-[10px] text-accent/60 mt-4 font-medium">{card.trend}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Course Performance Histogram */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 rounded-[40px] border border-white/5 min-h-[400px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="text-accent" size={20} /> Course Performance
              </h4>
              <p className="text-white/40 text-xs mt-1">Average marks across active modules</p>
            </div>
          </div>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#112220', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="value" fill="#285A48" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gender Performance */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass p-8 rounded-[40px] border border-white/5 min-h-[400px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-lg font-bold flex items-center gap-2">
                <PieChartIcon className="text-accent" size={20} /> Gender Performance
              </h4>
              <p className="text-white/40 text-xs mt-1">Comparing Male vs Female average marks</p>
            </div>
          </div>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#112220', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="value" fill="#B0E4CC" radius={[0, 8, 8, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Faculty Data Dropdown */}
      <div className="glass p-8 rounded-[40px] border border-white/5 text-left">
         <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold">Faculty Analytics Comparison</h4>
            {!isMaster && <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-white/40 uppercase tracking-widest">My Faculty Only</span>}
         </div>
         <div className="space-y-4">
            {(isMaster ? faculties : [userData?.faculty]).map((faculty, i) => {
              if (!faculty) return null
              const fStats = getFacultyStats(faculty)
              return (
                <div key={i} className="space-y-2">
                  <div 
                    onClick={() => setExpandedFaculty(expandedFaculty === faculty ? null : faculty)}
                    className={`flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer border ${expandedFaculty === faculty ? 'border-accent/30 bg-accent/5' : 'border-transparent'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${expandedFaculty === faculty ? 'bg-accent text-background' : 'bg-primary/20 text-accent'}`}>
                        <GraduationCap size={20} />
                      </div>
                      <div className="text-left">
                        <h5 className="font-bold text-sm text-left">{faculty}</h5>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Performance Insights</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="text-right hidden sm:block">
                          <p className="text-xs font-bold text-accent">View Detailed Stats</p>
                       </div>
                       <motion.div
                        animate={{ rotate: expandedFaculty === faculty ? 90 : 0 }}
                       >
                         <ChevronRight size={18} className="text-white/20" />
                       </motion.div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedFaculty === faculty && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl mx-2 mb-4 grid sm:grid-cols-3 gap-6">
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Average Mark</p>
                              <p className="text-xl font-bold text-accent">{fStats.avg}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Total Trainees</p>
                              <p className="text-xl font-bold text-white">{fStats.count}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Pass Rate</p>
                              <p className="text-xl font-bold text-secondary">{fStats.pass}</p>
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
         </div>
      </div>
    </div>
  )
}
