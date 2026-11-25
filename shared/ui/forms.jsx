import React, { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, KeyRound, Mail, X, CheckCircle2, AlertCircle, Check } from 'lucide-react'

export function Alert({ tone = 'error', children }) {
  const styles = tone === 'error'
    ? 'bg-red-500/10 border-red-400/30 text-red-200'
    : tone === 'success'
      ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-100'
      : 'bg-accent/10 border-accent/30 text-accent-soft'
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`border p-4 rounded-2xl flex items-start gap-3 text-sm leading-relaxed ${styles}`}>
      <Icon size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">{children}</div>
    </div>
  )
}

/** Labelled text input with optional leading icon and hint. */
export function TextField({ label, icon: Icon, hint, className = '', inputClassName = '', id, ...props }) {
  const autoId = useId()
  const fieldId = id || autoId
  const hintId = hint ? `${fieldId}-hint` : undefined
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="field-label">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" size={18} aria-hidden="true" />}
        <input id={fieldId} aria-describedby={hintId} className={`field-input ${Icon ? 'pl-12' : ''} ${inputClassName}`} {...props} />
      </div>
      {hint && <p id={hintId} className="field-hint">{hint}</p>}
    </div>
  )
}

export function SelectField({ label, icon: Icon, hint, options, className = '', id, ...props }) {
  const autoId = useId()
  const fieldId = id || autoId
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="field-label">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" size={18} aria-hidden="true" />}
        <select id={fieldId} className={`field-input appearance-none pr-10 ${Icon ? 'pl-12' : ''}`} {...props}>
          {options.map(o => {
            const value = typeof o === 'string' ? o : o.value
            const text = typeof o === 'string' ? o : o.label
            return <option key={value} value={value} className="bg-surface">{text}</option>
          })}
        </select>
        <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

export function PasswordField({ label = 'Password', hint, className = '', id, ...props }) {
  const autoId = useId()
  const fieldId = id || autoId
  const [show, setShow] = useState(false)
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="field-label">{label}</label>
      <div className="relative">
        <input id={fieldId} type={show ? 'text' : 'password'} className="field-input pr-12" {...props} />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-subtle hover:text-accent transition-colors"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

/** Password strength rule shared by both sites. */
export function passwordProblem(pw) {
  if (!pw || pw.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Use both letters and numbers.'
  return ''
}

/**
 * Multi-select as tappable chips. `options` can be strings or
 * { value, label, group } objects; grouped options are shown under headings.
 */
export function ChipSelect({ label, options, value = [], onChange, hint, emptyText = 'Loading…' }) {
  const groupId = useId()
  const toggle = v => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  const items = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o))
  const groups = items.reduce((acc, o) => {
    const g = o.group || ''
    ;(acc[g] = acc[g] || []).push(o)
    return acc
  }, {})

  return (
    <fieldset aria-describedby={hint ? `${groupId}-hint` : undefined}>
      <legend className="field-label">{label}</legend>
      {items.length === 0 && <p className="text-sm text-subtle ml-1">{emptyText}</p>}
      <div className="space-y-3">
        {Object.entries(groups).map(([group, opts]) => (
          <div key={group || 'all'}>
            {group && <p className="text-xs font-semibold text-subtle mb-2 ml-1">{group}</p>}
            <div className="flex flex-wrap gap-2">
              {opts.map(o => {
                const on = value.includes(o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(o.value)}
                    className={`chip ${on ? 'chip-on' : 'chip-off'}`}
                  >
                    {on && <Check size={14} aria-hidden="true" />}
                    {o.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {hint && <p id={`${groupId}-hint`} className="field-hint">{hint}</p>}
    </fieldset>
  )
}

/** "Forgot password" dialog. Never reveals whether an account exists. */
export function ForgotPasswordDialog({ open, onClose, onSubmit }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const close = () => { setEmail(''); setSent(false); setError(''); onClose() }

  const submit = async e => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await onSubmit(email.trim())
      setSent(true)
    } catch (err) {
      if (err.code === 'auth/invalid-email') setError('Please enter a valid email address.')
      else if (err.code === 'auth/too-many-requests') setError('Too many attempts. Please wait a few minutes.')
      else setSent(true) // don't reveal whether the account exists
    } finally { setBusy(false) }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && close()}
        >
          <motion.div
            role="dialog" aria-modal="true" aria-labelledby="forgot-title"
            initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
            onKeyDown={e => e.key === 'Escape' && close()}
            className="card w-full max-w-sm p-8 shadow-2xl relative"
          >
            <button onClick={close} aria-label="Close" className="absolute top-4 right-4 p-1.5 rounded-lg text-subtle hover:text-ink">
              <X size={20} />
            </button>
            {sent ? (
              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mx-auto mb-5">
                  <CheckCircle2 size={30} />
                </div>
                <h2 id="forgot-title" className="text-xl font-display font-bold mb-3">Check your inbox</h2>
                <p className="text-muted text-sm leading-relaxed mb-6">
                  If an account exists for <span className="text-ink font-medium">{email}</span>, we've sent a link to reset the password. It may take a minute — check your spam folder too.
                </p>
                <button onClick={close} className="btn-primary w-full py-3">Done</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h2 id="forgot-title" className="font-display font-bold text-lg">Reset password</h2>
                    <p className="text-subtle text-sm">We'll email you a reset link</p>
                  </div>
                </div>
                <form onSubmit={submit} className="space-y-4">
                  {error && <Alert>{error}</Alert>}
                  <TextField label="Email address" icon={Mail} type="email" required autoComplete="email" autoFocus
                    placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                  <button type="submit" disabled={busy} className="btn-primary w-full py-3">
                    {busy ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
