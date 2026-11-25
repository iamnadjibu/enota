import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, LogIn } from 'lucide-react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import PublicLayout from '../../layouts/PublicLayout'
import { useAuth } from '../../context/AuthContext'
import { friendlyError } from '@shared/ui/feedback'
import { Alert, TextField, PasswordField, ForgotPasswordDialog } from '@shared/ui/forms'
import VerifyEmailCard from '../../components/VerifyEmailCard'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const { login, resetPassword, currentUser, blockedMessage, refreshUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const from = location.state?.from || '/materials'

  // Returning from the verification email: refresh the account.
  useEffect(() => { if (params.get('verified') && currentUser) refreshUser() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentUser?.emailVerified) navigate(from, { replace: true })
  }, [currentUser, navigate, from])

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(friendlyError(err, 'Could not log you in. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-12 py-14 sm:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center justify-center min-h-[60vh]">
          <div className="lg:w-1/2 text-center lg:text-left">
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl md:text-6xl font-display font-extrabold mb-5">
              Welcome <span className="text-accent">back</span>
            </motion.h1>
            <p className="text-muted text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
              Log in to open your course materials and keep track of your progress.
            </p>
            {params.get('verified') && !currentUser && (
              <div className="mt-6 max-w-md mx-auto lg:mx-0"><Alert tone="success">Your email is verified. Log in to continue.</Alert></div>
            )}
          </div>

          <div className="lg:w-1/2 w-full max-w-md">
            {currentUser && !currentUser.emailVerified ? (
              <VerifyEmailCard />
            ) : (
              <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="card p-7 sm:p-10 space-y-5 shadow-2xl">
                {(error || blockedMessage) && <Alert>{error || blockedMessage}</Alert>}
                <TextField label="Email address" icon={Mail} type="email" required autoComplete="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
                <div>
                  <PasswordField label="Password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
                  <div className="text-right mt-2">
                    <button type="button" onClick={() => setShowForgot(true)} className="text-sm font-medium text-accent hover:underline">Forgot password?</button>
                  </div>
                </div>
                <button disabled={loading} type="submit" className="btn-primary w-full py-4 text-lg">
                  {loading ? 'Logging in…' : <>Log in <LogIn size={20} /></>}
                </button>
                <p className="text-center text-muted">
                  New here? <Link to="/register" className="text-accent font-semibold hover:underline">Create an account</Link>
                </p>
              </motion.form>
            )}
          </div>
        </div>
      </div>
      <ForgotPasswordDialog open={showForgot} onClose={() => setShowForgot(false)} onSubmit={resetPassword} />
    </PublicLayout>
  )
}
