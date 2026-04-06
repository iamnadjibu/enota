import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useBranding } from '../../context/BrandingContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, register } = useAuth()
  const { branding } = useBranding()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/user-not-found' && email === 'nadjibullahu@gmail.com' && password === 'Nadjibullah001!') {
        // Auto-onboard Master Admin if not exists
        try {
          await register(email, password, {
            firstName: 'Nadjibullah',
            lastName: 'Uwabato',
            faculty: 'N/A',
            institution: 'NAD PRODUCTION',
            role: 'admin',
            status: 'active'
          })
          navigate('/admin/dashboard')
        } catch (regErr) {
          console.error(regErr)
          setError('Failed to initialize Master Admin. Please contact support.')
        }
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.')
      } else {
        setError('Invalid email or password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[url('/bg-pattern.svg')] bg-center bg-no-repeat bg-fixed">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-10 rounded-[40px] border border-white/5 shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[60px] -mr-16 -mt-16"></div>
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-3xl bg-primary border border-accent overflow-hidden mb-6 mx-auto shadow-lg shadow-accent/20">
            <img src={branding.logoUrl} alt={branding.portalName} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2 uppercase">{branding.portalName}</h1>
          <p className="text-white/40 text-sm">Sign in to manage student performance.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 flex items-center gap-2 text-sm">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="email" required placeholder="admin@enota.com" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} required placeholder="••••••••" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 focus:outline-none focus:border-accent transition-colors"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-accent transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Verifying...' : 'Sign In Now'}
            {!loading && <LogIn size={18} />}
          </button>

          <p className="text-center text-xs text-white/30 mt-8">
            Don't have an admin account? <Link to="/register" className="text-accent underline font-bold uppercase tracking-widest">Apply here</Link>
          </p>
        </form>
      </motion.div>

      <a href="/" className="mt-8 text-white/30 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold">
        ← Back to Public Site
      </a>
    </div>
  )
}
