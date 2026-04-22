import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, LogIn } from 'lucide-react'
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

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(formData.email, formData.password)
      navigate('/materials')
    } catch (err) {
      console.error(err)
      setError('Failed to log in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
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
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 flex items-center gap-2 text-sm">
                    <AlertCircle size={18} /> {error}
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
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Password</label>
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
    </PublicLayout>
  )
}
