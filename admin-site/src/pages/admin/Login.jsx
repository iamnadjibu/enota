import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, LogIn, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { friendlyError } from '@shared/ui/feedback'
import { Alert, TextField, PasswordField, ForgotPasswordDialog } from '@shared/ui/forms'
import Logo from '@shared/ui/Logo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgot, setShowForgot] = useState(false)

  const { login, currentUser, resetPassword, blockedMessage } = useAuth()
  const navigate = useNavigate()

  // Signed-in users go to the dashboard; ProtectedRoute shows any
  // verification / approval step they still need.
  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true })
  }, [currentUser, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(friendlyError(err, 'Could not sign you in. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div aria-hidden="true" className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-primary-light/20 blur-[120px]" />
      <div aria-hidden="true" className="absolute -bottom-48 -left-40 w-[480px] h-[480px] rounded-full bg-accent/10 blur-[120px]" />

      <motion.main
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 160 }}
        className="card w-full max-w-md p-8 sm:p-10 shadow-2xl relative"
      >
        <div className="text-center mb-8">
          <Logo variant="full" className="h-24 mx-auto mb-6" />
          <h1 className="text-2xl font-display font-bold mb-1">Admin sign in</h1>
          <p className="text-muted text-sm">Manage marks, materials and trainees.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
          {(error || blockedMessage) && <Alert>{error || blockedMessage}</Alert>}

          <TextField label="Email address" icon={Mail} type="email" required autoComplete="email"
            placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />

          <div>
            <PasswordField label="Password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)} />
            <div className="text-right mt-2">
              <button type="button" onClick={() => setShowForgot(true)}
                className="text-sm font-medium text-accent hover:underline">
                Forgot password?
              </button>
            </div>
          </div>

          <button disabled={loading} type="submit" className="btn-primary w-full py-3.5">
            {loading ? 'Signing in…' : <>Sign in <LogIn size={18} /></>}
          </button>

          <p className="text-center text-sm text-muted pt-2">
            New admin? <Link to="/register" className="text-accent font-semibold hover:underline">Apply for access</Link>
          </p>
        </form>
      </motion.main>

      <a href="/" className="mt-8 inline-flex items-center gap-2 text-muted hover:text-ink transition-colors text-sm font-medium">
        <ArrowLeft size={16} /> Back to the public site
      </a>

      <ForgotPasswordDialog open={showForgot} onClose={() => setShowForgot(false)} onSubmit={resetPassword} />
    </div>
  )
}
