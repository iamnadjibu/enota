import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Building2, MailCheck, ArrowRight, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { friendlyError } from '@shared/ui/feedback'
import { Alert, TextField, SelectField, PasswordField, ChipSelect, passwordProblem } from '@shared/ui/forms'
import { useFaculties, useInstitutions } from '@shared/lib/useCatalog'
import { chipOptions, expandScope } from '@shared/lib/faculties'
import Logo from '@shared/ui/Logo'

export default function Register() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', gender: 'Male', email: '',
    password: '', confirmPassword: '', faculty: [], institution: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { faculties } = useFaculties()
  const institutions = useInstitutions()
  const { register, currentUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (currentUser && !success) navigate('/dashboard', { replace: true })
  }, [currentUser, success, navigate])

  useEffect(() => {
    if (!form.institution && institutions.length) set('institution', institutions[0].name)
  }, [institutions]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.faculty.length === 0) return setError('Choose at least one faculty or department you will manage.')
    if (!form.institution) return setError('Choose your institution.')
    const pwIssue = passwordProblem(form.password)
    if (pwIssue) return setError(pwIssue)
    if (form.password !== form.confirmPassword) return setError("The two passwords don't match.")

    setLoading(true)
    try {
      const { confirmPassword, password, ...profile } = form
      setSuccess(true) // keep the success screen when auth state changes
      await register(form.email.trim(), password, { ...profile, scope: expandScope(faculties, form.faculty) })
    } catch (err) {
      setSuccess(false)
      setError(friendlyError(err, 'Your application could not be sent. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div aria-hidden="true" className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-primary-light/20 blur-[120px]" />

      <motion.main
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-2xl p-8 sm:p-12 shadow-2xl relative"
      >
        {success && !loading ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/40 flex items-center justify-center text-accent mb-8 mx-auto">
              <MailCheck size={38} />
            </div>
            <h1 className="text-3xl font-display font-bold mb-4">Application sent</h1>
            <ol className="text-muted mb-8 max-w-md mx-auto leading-relaxed text-left space-y-3 list-decimal pl-5">
              <li>Open the verification link we sent to <span className="text-ink font-medium">{form.email}</span>.</li>
              <li>The Super Admin reviews your application.</li>
              <li>Once approved, sign in here to start managing your faculty.</li>
            </ol>
            <Link to="/dashboard" className="btn-primary px-8 py-3.5">Continue <ArrowRight size={18} /></Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <Logo variant="mark" className="h-12 mx-auto mb-5" />
              <h1 className="text-3xl font-display font-bold mb-2">Admin application</h1>
              <p className="text-muted">Apply to manage marks and materials for your faculty. The Super Admin approves every application.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <Alert>{error}</Alert>}

              <div className="grid sm:grid-cols-2 gap-5">
                <TextField label="First name" icon={User} required autoComplete="given-name"
                  value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                <TextField label="Last name" icon={User} required autoComplete="family-name"
                  value={form.lastName} onChange={e => set('lastName', e.target.value)} />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <TextField label="Email address" icon={Mail} type="email" required autoComplete="email"
                  placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                <SelectField label="Gender" options={['Male', 'Female']} value={form.gender}
                  onChange={e => set('gender', e.target.value)} />
              </div>

              <ChipSelect label="Faculties or departments you will manage" options={chipOptions(faculties)}
                value={form.faculty} onChange={v => set('faculty', v)}
                hint="Tap to select. Choosing a whole faculty includes all of its departments." />

              <SelectField label="Institution" icon={Building2}
                options={institutions.length ? institutions.map(i => i.name) : [{ value: '', label: 'Loading…' }]}
                value={form.institution} onChange={e => set('institution', e.target.value)} />

              <div className="grid sm:grid-cols-2 gap-5">
                <PasswordField label="Password" required autoComplete="new-password"
                  hint="At least 8 characters, with letters and numbers."
                  value={form.password} onChange={e => set('password', e.target.value)} />
                <PasswordField label="Confirm password" required autoComplete="new-password"
                  value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
              </div>

              <button disabled={loading} type="submit" className="btn-primary w-full py-4 text-base">
                {loading ? 'Sending application…' : <>Submit application <ArrowRight size={18} /></>}
              </button>

              <p className="text-center text-sm text-muted">
                Already an admin? <Link to="/login" className="text-accent font-semibold hover:underline">Sign in</Link>
              </p>
            </form>
          </>
        )}
      </motion.main>

      <a href="/" className="mt-8 inline-flex items-center gap-2 text-muted hover:text-ink text-sm font-medium">
        <ArrowLeft size={16} /> Back to the public site
      </a>
    </div>
  )
}
