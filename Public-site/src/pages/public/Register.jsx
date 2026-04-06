import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, User, Mail, Lock, GraduationCap, Building2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import PublicLayout from '../../layouts/PublicLayout'
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
    regNumber: '',
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
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }

    setLoading(true)
    try {
      const { confirmPassword, ...profileData } = formData
      await register(formData.email, formData.password, profileData)
      setSuccess(true)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-20">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          <div className="lg:w-1/3">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-display font-extrabold mb-6"
            >
              Join the <br />
              <span className="text-accent">eNOTA Portal</span>
            </motion.h1>
            <p className="text-white/50 text-sm leading-relaxed mb-8">Create your account to track your marks, access course materials, and stay updated with your performance.</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-white/40 font-bold uppercase tracking-widest">
                <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center text-accent">1</div>
                Fill the form
              </div>
              <div className="flex items-center gap-3 text-xs text-white/40 font-bold uppercase tracking-widest">
                <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center text-accent">2</div>
                Verify Email
              </div>
              <div className="flex items-center gap-3 text-xs text-white/40 font-bold uppercase tracking-widest">
                <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center text-accent">3</div>
                Access Dashboard
              </div>
            </div>
          </div>

          <div className="lg:w-2/3 w-full">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass p-12 rounded-[40px] border border-accent/20 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/40 flex items-center justify-center text-accent mb-8 mx-auto">
                    <CheckCircle size={40} />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Registration Successful!</h2>
                  <p className="text-white/60 mb-8">We've sent a verification link to <span className="text-white font-medium">{formData.email}</span>. Please verify your email to access materials.</p>
                  <Link to="/materials" className="btn-primary block w-full py-4">Check Materials</Link>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass p-10 lg:p-12 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden"
                >
                   {/* Background Gradient */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[80px] -mr-16 -mt-16"></div>

                   <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                     {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 flex items-center gap-2 text-sm">
                           <AlertCircle size={18} /> {error}
                        </div>
                     )}

                     <div className="grid sm:grid-cols-2 gap-6">
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">First Name</label>
                         <div className="relative">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                           <input 
                            type="text" required placeholder="John" 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors"
                            value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Last Name</label>
                         <div className="relative">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                           <input 
                            type="text" required placeholder="Doe" 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors"
                            value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          />
                         </div>
                       </div>
                     </div>

                     <div className="grid sm:grid-cols-2 gap-6">
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Reg Number</label>
                         <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            <input 
                              type="text" required placeholder="KSP0101XXX" 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors uppercase"
                              value={formData.regNumber} onChange={(e) => setFormData({...formData, regNumber: e.target.value.toUpperCase()})}
                            />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Gender</label>
                         <select 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent transition-colors appearance-none"
                          value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}
                         >
                           <option value="Male" className="bg-background">Male</option>
                           <option value="Female" className="bg-background">Female</option>
                         </select>
                       </div>
                     </div>

                     <div className="space-y-2">
                       <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                       <div className="relative">
                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                         <input 
                          type="email" required placeholder="name@example.com" 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors"
                          value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                       </div>
                     </div>

                     <div className="grid sm:grid-cols-2 gap-6">
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Faculty</label>
                         <div className="relative">
                            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            <select 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors appearance-none"
                              value={formData.faculty} onChange={(e) => setFormData({...formData, faculty: e.target.value})}
                            >
                              {faculties.map(f => <option key={f} value={f} className="bg-background">{f}</option>)}
                            </select>
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Institution</label>
                         <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            <select 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors appearance-none"
                              value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})}
                            >
                              {institutions.map(i => <option key={i} value={i} className="bg-background">{i}</option>)}
                            </select>
                         </div>
                       </div>
                     </div>

                     <div className="grid sm:grid-cols-2 gap-6">
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Password</label>
                         <div className="relative">
                           <input 
                            type={showPassword ? 'text' : 'password'} required placeholder="At least 6 chars" 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 focus:outline-none focus:border-accent transition-colors"
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
                         <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Confirm</label>
                         <input 
                            type={showPassword ? 'text' : 'password'} required placeholder="At least 6 chars" 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent transition-colors"
                            value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          />
                       </div>
                     </div>

                     <button 
                      disabled={loading}
                      type="submit" 
                      className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2 group mt-4"
                     >
                       {loading ? 'Creating Account...' : 'Continue to Register'}
                       {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> }
                     </button>

                     <p className="text-center text-xs text-white/40 mt-8">
                       Already have an account? <Link to="/materials" className="text-accent underline font-bold uppercase tracking-widest">Sign In</Link>
                     </p>
                   </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
