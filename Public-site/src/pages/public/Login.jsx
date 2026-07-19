import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, LogIn, KeyRound, CheckCircle, X } from 'lucide-react'
import PublicLayout from '../../layouts/PublicLayout'
import { useAuth } from '../../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Forgot Password state
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const [unverified, setUnverified] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  const { login, resetPassword, resendVerificationLink } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setUnverified(false)
    setResendMsg('')
    setLoading(true)

    try {
      const res = await login(formData.email, formData.password)
      if (!res.user.emailVerified) {
        setError('Please verify your email before accessing the portal. Check your inbox or spam folder.')
        setUnverified(true)
      } else {
        navigate('/materials')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to log in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResending(true)
    setResendMsg('')
    try {
      await resendVerificationLink()
      setResendMsg('Verification link sent successfully! Check your spam folder.')
    } catch (err) {
      setError('Failed to send verification link. Please try again.')
    } finally {
      setResending(false)
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
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-20">
        <div className="flex flex-col lg:flex-row gap-16 items-center justify-center min-h-[60vh]">
          <div className="lg:w-1/2 text-center lg:text-left">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl md:text-6xl font-display font-extrabold mb-6"
            >
              Welcome <br />
              <span className="text-accent">Back!</span>
            </motion.h1>
            <p className="text-white/50 text-lg leading-relaxed mb-8 max-w-md">
              Log in to your eNOTA portal to access your materials, track marks, and continue your learning journey.
            </p>
          </div>

          <div className="lg:w-1/2 w-full max-w-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-10 lg:p-12 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[80px] -mr-16 -mt-16"></div>

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto mb-4">
                    <LogIn size={32} />
                  </div>
                  <h2 className="text-2xl font-bold">Sign In</h2>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 flex flex-col gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" /> <p>{error}</p>
                    </div>
                    {unverified && (
                      <div className="pl-6 pt-2">
                        <button 
                          type="button"
                          onClick={handleResendVerification}
                          disabled={resending}
                          className="text-xs font-bold uppercase tracking-widest bg-red-500/20 hover:bg-red-500/30 text-white py-2 px-4 rounded-lg transition-colors"
                        >
                          {resending ? 'Sending...' : 'Resend Verification Link'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {resendMsg && (
                  <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl text-accent text-sm">
                    {resendMsg}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type="email" 
                      required 
                      placeholder="name@example.com" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-accent transition-colors"
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-[10px] font-bold text-accent/70 hover:text-accent uppercase tracking-widest transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required 
                      placeholder="Your password" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 pr-12 focus:outline-none focus:border-accent transition-colors"
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-accent transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  disabled={loading}
                  type="submit" 
                  className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2 group mt-4"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                  {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> }
                </button>

                <p className="text-center text-xs text-white/40 mt-8">
                  Don't have an account yet? <Link to="/register" className="text-accent underline font-bold uppercase tracking-widest">Register here</Link>
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

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
    </PublicLayout>
  )
}
