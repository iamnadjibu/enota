import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, Building2, GraduationCap, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    email: '',
    password: '',
    confirmPassword: '',
    faculty: 'FILMMAKING AND VIDEO PRODUCTION',
    institution: 'NAD CLASS'
  })

  const { register } = useAuth()

  const faculties = [
    'FILMMAKING AND VIDEO PRODUCTION',
    'MULTIMEDIA PRODUCTION',
    'COLOR GRADING',
    'AI FILMMAKING',
    'VIBE CODING'
  ]

  const institutions = [
    'NAD CLASS',
    'KSP RWANDA',
    'NAD PRODUCTION'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

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
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Faculty</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors appearance-none text-sm"
                      value={formData.faculty} onChange={(e) => setFormData({...formData, faculty: e.target.value})}
                    >
                      {faculties.map(f => <option key={f} value={f} className="bg-background">{f}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Institution</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors appearance-none text-sm"
                      value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})}
                    >
                      {institutions.map(i => <option key={i} value={i} className="bg-background">{i}</option>)}
                    </select>
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
                disabled={loading}
                type="submit" 
                className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 group mt-4 shadow-lg shadow-primary/20"
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
