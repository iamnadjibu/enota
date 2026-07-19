import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, Building2, GraduationCap, Clock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../../firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [faculties, setFaculties] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    email: '',
    password: '',
    confirmPassword: '',
    faculty: [],
    institution: ''
  })

  const { register, currentUser, isApproved } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (currentUser && isApproved) {
      navigate('/dashboard')
    }
  }, [currentUser, isApproved, navigate])

  // Fetch faculties and institutions from Firestore
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true)
      try {
        const [facultiesSnap, institutionsSnap] = await Promise.all([
          getDocs(query(collection(db, 'faculties'), orderBy('name'))),
          getDocs(query(collection(db, 'institutions'), orderBy('name')))
        ])

        const fetchedFaculties = facultiesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        const fetchedInstitutions = institutionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        setFaculties(fetchedFaculties)
        setInstitutions(fetchedInstitutions)

        // Set defaults to first item if available
        if (fetchedInstitutions.length > 0) {
          setFormData(prev => ({ ...prev, institution: fetchedInstitutions[0].name }))
        }
      } catch (err) {
        console.error('Failed to load faculties/institutions:', err)
        setError('Failed to load faculty and institution options. Please refresh the page.')
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchOptions()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.faculty || formData.faculty.length === 0) return setError('Please select at least one faculty.')
    if (!formData.institution) return setError('Please select an institution.')
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.')
    }
    if (formData.password.length < 6 || !/\d/.test(formData.password)) {
      return setError('Password must be at least 6 characters and include numbers.')
    }

    setLoading(true)
    try {
      const { confirmPassword, ...profileData } = formData
      await register(formData.email, formData.password, { ...profileData, role: 'admin' })
      setSuccess(true)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Application failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[url('/bg-pattern.svg')] bg-center bg-no-repeat bg-fixed">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl glass p-10 lg:p-12 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[60px] -mr-16 -mt-16"></div>

        {success ? (
          <div className="text-center py-10">
            <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/40 flex items-center justify-center text-accent mb-8 mx-auto">
              <Clock size={40} className="animate-pulse" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">Application Pending</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto leading-relaxed">
              Your admin application has been submitted. Please wait for the <span className="text-white font-medium">Master Admin</span> to review and approve your access.
            </p>
            <a href="/" className="btn-primary block w-full py-4 max-w-xs mx-auto text-center">Return to Public Site</a>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-display font-bold mb-2">Admin <span className="text-accent">Application</span></h1>
              <p className="text-white/40 text-sm">Join the administration team of eNOTA Portal.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 flex items-center gap-2 text-sm">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">First Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type="text" required placeholder="John" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors text-sm"
                      value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type="text" required placeholder="Doe" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors text-sm"
                      value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
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
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type="email" required placeholder="admin@enota.com" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors text-sm"
                      value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Faculty — fetched from Firestore */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Faculty</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    {loadingOptions ? (
                      <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 flex items-center gap-2 text-white/30 text-sm">
                        <Loader2 size={16} className="animate-spin" /> Loading...
                      </div>
                    ) : (
                      <select 
                        required
                        multiple
                        size={4}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors text-sm"
                        value={formData.faculty} 
                        onChange={(e) => {
                          const options = Array.from(e.target.selectedOptions, option => option.value)
                          setFormData({...formData, faculty: options})
                        }}
                      >
                        {faculties.map(f => (
                          <option key={f.id} value={f.name} className="bg-background hover:bg-white/10 p-2 rounded-lg">{f.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Institution — fetched from Firestore */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Institution</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    {loadingOptions ? (
                      <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 flex items-center gap-2 text-white/30 text-sm">
                        <Loader2 size={16} className="animate-spin" /> Loading...
                      </div>
                    ) : (
                      <select 
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors appearance-none text-sm"
                        value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})}
                      >
                        <option value="" className="bg-background">— Select Institution —</option>
                        {institutions.map(i => (
                          <option key={i.id} value={i.name} className="bg-background">{i.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} required placeholder="6+ chars & numbers" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 focus:outline-none focus:border-accent transition-colors text-sm"
                      value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button 
                      type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-accent transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Confirm</label>
                  <input 
                    type={showPassword ? 'text' : 'password'} required placeholder="Confirm Password" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent transition-colors text-sm"
                    value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              <button 
                disabled={loading || loadingOptions}
                type="submit" 
                className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 group mt-4 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? 'Submitting Application...' : 'Send Application'}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>

              <p className="text-center text-xs text-white/30 mt-8">
                Already an admin? <Link to="/login" className="text-accent underline font-bold uppercase tracking-widest">Sign In</Link>
              </p>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
