import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, KeyRound, CheckCircle, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useBranding } from '../../context/BrandingContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Forgot Password state
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const { login, register, currentUser, isApproved, resetPassword } = useAuth()
  const { branding } = useBranding()
  const navigate = useNavigate()

  useEffect(() => {
    if (currentUser && isApproved) {
      navigate('/dashboard')
    }
  }, [currentUser, isApproved, navigate])

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
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect password.')
      } else {
        setError('Invalid email or password.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setResetError('')
    setResetLoading(true)
    try {
      await resetPassword(resetEmail)
      setResetSent(true)
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/user-not-found') {
        setResetError('No account found with this email address.')
      } else if (err.code === 'auth/invalid-email') {
        setResetError('Please enter a valid email address.')
      } else {
        setResetError('Failed to send reset link. Please try again.')
      }
    } finally {
      setResetLoading(false)
    }
  }

  const closeForgot = () => {
    setShowForgot(false)
    setResetEmail('')
    setResetError('')
    setResetSent(false)
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
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Password</label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-[10px] font-bold text-accent/70 hover:text-accent uppercase tracking-widest transition-colors"
              >
                Forgot Password?
              </button>
            </div>
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

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && closeForgot()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm glass p-8 rounded-[32px] border border-white/10 shadow-2xl relative"
            >
              <button
                onClick={closeForgot}
                className="absolute top-5 right-5 text-white/30 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              {resetSent ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 mx-auto mb-6">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Reset Link Sent!</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-6">
                    A password reset link has been sent to <span className="text-white font-medium">{resetEmail}</span>. Check your inbox and follow the instructions.
                  </p>
                  <button
                    onClick={closeForgot}
                    className="btn-primary w-full py-3 text-sm font-bold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      <KeyRound size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Reset Password</h3>
                      <p className="text-white/40 text-xs">We'll send a link to your email</p>
                    </div>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    {resetError && (
                      <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 flex items-center gap-2 text-xs">
                        <AlertCircle size={16} /> {resetError}
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                          type="email"
                          required
                          placeholder="your@email.com"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-11 focus:outline-none focus:border-accent transition-colors text-sm"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
