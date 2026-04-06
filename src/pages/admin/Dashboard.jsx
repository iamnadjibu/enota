import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, GraduationCap, Award, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import { collection, query, getDocs, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'

export default function Dashboard() {
  const { userData, isMaster } = useAuth()
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageGrade: 'N/A',
    topFaculty: 'N/A',
    passingRate: 0
  })
  const [chartData, setChartData] = useState([])
  const [genderData, setGenderData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const marksRef = collection(db, 'marks')
        let q = marksRef
        
        // If not master, filter by faculty
        if (!isMaster && userData?.faculty && userData.faculty !== 'N/A') {
          q = query(marksRef, where('faculty', '==', userData.faculty))
        }

        const querySnapshot = await getDocs(q)
        const data = querySnapshot.docs.map(doc => doc.data())

        // Calculate Stats
        if (data.length > 0) {
          const total = data.length
          const avg = (data.reduce((acc, curr) => acc + (parseFloat(curr.averageMarks) || 0), 0) / total).toFixed(2)
          const passing = (data.filter(d => parseFloat(d.averageMarks) >= 50).length / total * 100).toFixed(0)

          setStats({
            totalStudents: total,
            averageGrade: `${avg}%`,
            topFaculty: userData?.faculty || 'All Faculties',
            passingRate: `${passing}%`
          })

          // Chart Data (Course Averages)
          const courseAvgs = [
            { name: 'Filmmaking', value: (data.reduce((acc, curr) => acc + (parseFloat(curr.filmmakingMarks) || 0), 0) / total).toFixed(1) },
            { name: 'Camera Op', value: (data.reduce((acc, curr) => acc + (parseFloat(curr.cameraOperationMarks) || 0), 0) / total).toFixed(1) },
            { name: 'Video Editing', value: (data.reduce((acc, curr) => acc + (parseFloat(curr.videoEditingMarks) || 0), 0) / total).toFixed(1) },
          ]
          setChartData(courseAvgs)

          // Gender Performance
          const maleMarks = data.filter(d => d.gender === 'Male')
          const femaleMarks = data.filter(d => d.gender === 'Female')
          
          setGenderData([
            { name: 'Male', value: maleMarks.length > 0 ? (maleMarks.reduce((acc, curr) => acc + (parseFloat(curr.averageMarks) || 0), 0) / maleMarks.length).toFixed(1) : 0 },
            { name: 'Female', value: femaleMarks.length > 0 ? (femaleMarks.reduce((acc, curr) => acc + (parseFloat(curr.averageMarks) || 0), 0) / femaleMarks.length).toFixed(1) : 0 }
          ])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isMaster, userData?.faculty])

  const COLORS = ['#285A48', '#408A71', '#B0E4CC', '#091413']

  const statCards = [
    { label: 'Registered Students', value: stats.totalStudents, icon: <Users className="text-accent" />, trend: '+12% from last month' },
    { label: 'Global Average Marks', value: stats.averageGrade, icon: <GraduationCap className="text-secondary" />, trend: 'Stable' },
    { label: 'Passing Rate', value: stats.passingRate, icon: <Award className="text-accent" />, trend: 'Target: 95%' },
    { label: 'Active Faculty', value: stats.topFaculty, icon: <TrendingUp className="text-secondary" />, truncate: true },
  ]

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Welcome Back, {userData?.firstName}</h1>
          <p className="text-white/40 text-sm mt-1">Here's a summary of class performances today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline py-2 px-4 text-xs font-bold uppercase tracking-widest">Generate Report</button>
          <button className="btn-primary py-2 px-4 text-xs font-bold uppercase tracking-widest">Add New Mark</button>
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
              <p className="text-white/40 text-xs mt-1">Average marks across major modules</p>
            </div>
          </div>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
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

      {/* Recent Activity or Quick List Placeholder */}
      <div className="glass p-8 rounded-[40px] border border-white/5">
         <h4 className="text-lg font-bold mb-6">Quick Overview</h4>
         <div className="space-y-4">
            {['Multimedia Production', 'Filmmaking', 'Color Grading'].map((faculty, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-accent">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm">{faculty}</h5>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Active Class</p>
                  </div>
                </div>
                <button className="text-accent text-xs font-bold hover:underline">VIEW DATA</button>
              </div>
            ))}
         </div>
      </div>
    </div>
  )
}
