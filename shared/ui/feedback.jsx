import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X, Loader2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Firebase error codes -> plain sentences
// ---------------------------------------------------------------------------
const FRIENDLY = {
  'auth/email-already-in-use': 'That email is already registered. Sign in instead, or reset your password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Choose a stronger password (at least 8 characters, with a number).',
  'auth/password-does-not-meet-requirements': 'Choose a stronger password (at least 8 characters, with letters and a number).',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/user-disabled': 'This account has been disabled. Contact the eNOTA team.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
  'auth/requires-recent-login': 'Please sign in again to continue.',
  'permission-denied': "You don't have permission to do that.",
  'unavailable': 'The service is unreachable right now. Check your connection and try again.',
  'not-found': 'That record no longer exists.',
}

export function friendlyError(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback
  const code = err.code || ''
  return FRIENDLY[code] || FRIENDLY[code.replace(/^firestore\//, '')] || fallback
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------
const ToastContext = createContext(null)

const TOAST_STYLES = {
  success: { icon: CheckCircle2, ring: 'border-emerald-400/40', iconColor: 'text-emerald-300' },
  error: { icon: AlertTriangle, ring: 'border-red-400/50', iconColor: 'text-red-300' },
  info: { icon: Info, ring: 'border-accent/40', iconColor: 'text-accent' },
  loading: { icon: Loader2, ring: 'border-white/20', iconColor: 'text-accent animate-spin' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), [])

  const push = useCallback((type, message, opts = {}) => {
    const id = ++idRef.current
    setToasts(t => [...t, { id, type, message, title: opts.title }])
    const duration = opts.duration ?? (type === 'error' ? 7000 : type === 'loading' ? 0 : 4000)
    if (duration) setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const api = React.useMemo(() => ({
    success: (m, o) => push('success', m, o),
    error: (m, o) => push('error', m, o),
    info: (m, o) => push('info', m, o),
    loading: (m, o) => push('loading', m, o),
    dismiss,
    // Show a friendly message for a failed Firebase call.
    fail: (err, fallback, o) => {
      console.error(err)
      return push('error', friendlyError(err, fallback), o)
    },
  }), [push, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-[200] bottom-4 right-4 left-4 sm:left-auto sm:w-[380px] flex flex-col gap-3 pointer-events-none"
      >
        <AnimatePresence initial={false}>
          {toasts.map(t => {
            const s = TOAST_STYLES[t.type] || TOAST_STYLES.info
            const Icon = s.icon
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
                role={t.type === 'error' ? 'alert' : 'status'}
                className={`pointer-events-auto flex items-start gap-3 rounded-2xl border ${s.ring} bg-surface/95 backdrop-blur-xl p-4 shadow-2xl shadow-black/40`}
              >
                <Icon size={20} className={`${s.iconColor} shrink-0 mt-0.5`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  {t.title && <p className="font-semibold text-sm text-white mb-0.5">{t.title}</p>}
                  <p className="text-sm text-white/80 leading-relaxed">{t.message}</p>
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="text-white/50 hover:text-white rounded-lg p-1 -m-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ---------------------------------------------------------------------------
// Confirm dialog:  const ok = await confirm({ title, message, confirmLabel, tone })
// ---------------------------------------------------------------------------
const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback(opts => new Promise(resolve => {
    resolver.current = resolve
    setState({ tone: 'danger', confirmLabel: 'Confirm', cancelLabel: 'Cancel', ...opts })
  }), [])

  const close = result => {
    resolver.current?.(result)
    resolver.current = null
    setState(null)
  }

  const danger = state?.tone === 'danger'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {state && (
          <motion.div
            className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => close(false)}
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-message"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              onKeyDown={e => { if (e.key === 'Escape') close(false) }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-surface p-7 shadow-2xl"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${danger ? 'bg-red-500/15 text-red-300' : 'bg-accent/15 text-accent'}`}>
                {danger ? <AlertTriangle size={24} aria-hidden="true" /> : <Info size={24} aria-hidden="true" />}
              </div>
              <h2 id="confirm-title" className="text-xl font-display font-bold mb-2">{state.title}</h2>
              <div id="confirm-message" className="text-sm text-white/75 leading-relaxed">{state.message}</div>
              <div className="mt-7 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => close(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/15 text-white/85 hover:bg-white/5 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {state.cancelLabel}
                </button>
                <button
                  autoFocus
                  onClick={() => close(true)}
                  className={`px-5 py-2.5 rounded-xl font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${danger ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary hover:bg-primary-light text-white'}`}
                >
                  {state.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return ctx
}
