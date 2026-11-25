import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Building2, IdCard, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicLayout from '../../layouts/PublicLayout'
import { useAuth } from '../../context/AuthContext'
import { friendlyError } from '@shared/ui/feedback'
import { Alert, TextField, SelectField, PasswordField, ChipSelect, passwordProblem } from '@shared/ui/forms'
import { useFaculties, useInstitutions } from '@shared/lib/useCatalog'
import { chipOptions, expandScope } from '@shared/lib/faculties'
import VerifyEmailCard from '../../components/VerifyEmailCard'

const STEPS = ['Fill in the form', 'Verify your email', 'Open your materials']

export default function Register() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', regNumber: '', gender: 'Male',
    email: '', password: '', confirmPassword: '', faculty: [], institution: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { register, currentUser } = useAuth()
  const { faculties } = useFaculties()
  const institutions = useInstitutions()

  useEffect(() => {
    if (!form.institution && institutions.length) set('institution', institutions[0].name)
  }, [institutions]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!form.faculty.length) return setError('Choose at least one faculty or department.')
    if (!form.institution) return setError('Choose your institution.')
    if (!/^[A-Z0-9-]{4,}$/.test(form.regNumber)) return setError('Enter your registration number as printed on your card, e.g. KSP0101998.')
    const pw = passwordProblem(form.password)
    if (pw) return setError(pw)
    if (form.password !== form.confirmPassword) return setError("The two passwords don't match.")

    setLoading(true)
    try {
      const { confirmPassword, password, ...profile } = form
      await register(form.email.trim(), password, {
        ...profile,
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        scope: expandScope(faculties, form.faculty),
      })
      setDone(true)
    } catch (err) {
      setError(friendlyError(err, 'Your account could not be created. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const step = done ? 1 : 0

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-12 py-14 sm:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          <aside className="lg:w-1/3 lg:sticky lg:top-28">
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl sm:text-5xl font-display font-extrabold mb-5 leading-tight">
              Join the <br /><span className="text-accent">eNOTA Portal</span>
            </motion.h1>
            <p className="text-muted text-lg leading-relaxed mb-8">Create your trainee account to open your faculty's course materials and follow your results.</p>
            <ol className="space-y-4" aria-label="Registration steps">
              {STEPS.map((s, i) => (
                <li key={s} className={`flex items-center gap-3 font-medium ${i <= step ? 'text-ink' : 'text-subtle'}`} aria-current={i === step ? 'step' : undefined}>
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${i < step ? 'bg-accent text-background' : i === step ? 'bg-accent/20 text-accent border border-accent/40' : 'bg-white/5 text-subtle'}`}>{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </aside>

          <div className="lg:w-2/3 w-full">
            <AnimatePresence mode="wait">
              {done || (currentUser && !currentUser.emailVerified) ? (
                <motion.div key="verify" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                  <VerifyEmailCard justRegistered={done} />
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="card p-6 sm:p-10 space-y-6 shadow-2xl" noValidate={false}>
                  {error && <Alert>{error}</Alert>}

                  <div className="grid sm:grid-cols-2 gap-5">
                    <TextField label="First name" icon={User} required autoComplete="given-name" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                    <TextField label="Last name" icon={User} required autoComplete="family-name" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <TextField label="Registration number" icon={IdCard} required placeholder="KSP0101998" inputClassName="uppercase font-mono"
                      hint="As printed on your enrolment card." value={form.regNumber}
                      onChange={e => set('regNumber', e.target.value.replace(/\s+/g, '').toUpperCase())} />
                    <SelectField label="Gender" options={['Male', 'Female']} value={form.gender} onChange={e => set('gender', e.target.value)} />
                  </div>

                  <TextField label="Email address" icon={Mail} type="email" required autoComplete="email" placeholder="you@example.com"
                    hint="We'll send a link to confirm it." value={form.email} onChange={e => set('email', e.target.value)} />

                  <ChipSelect label="Your faculties or departments" options={chipOptions(faculties)} value={form.faculty} onChange={v => set('faculty', v)}
                    hint="Tap every programme you're enrolled in. Choose “All of …” only if you study the whole faculty." />

                  <SelectField label="Institution" icon={Building2}
                    options={institutions.length ? institutions.map(i => i.name) : [{ value: '', label: 'Loading…' }]}
                    value={form.institution} onChange={e => set('institution', e.target.value)} />

                  <div className="grid sm:grid-cols-2 gap-5">
                    <PasswordField label="Password" required autoComplete="new-password" hint="At least 8 characters, with letters and numbers."
                      value={form.password} onChange={e => set('password', e.target.value)} />
                    <PasswordField label="Confirm password" required autoComplete="new-password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
                  </div>

                  <button disabled={loading} type="submit" className="btn-primary w-full py-4 text-lg">
                    {loading ? 'Creating your account…' : <>Create account <ArrowRight size={20} /></>}
                  </button>

                  <p className="text-center text-muted">
                    Already registered? <Link to="/login" className="text-accent font-semibold hover:underline">Log in</Link>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
