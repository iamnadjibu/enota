import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MailCheck, RefreshCw, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast, friendlyError } from '@shared/ui/feedback'

/** Shown until the trainee confirms their email address. */
export default function VerifyEmailCard({ justRegistered = false }) {
  const { currentUser, resendVerificationLink, refreshUser } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const check = async () => {
    setBusy(true)
    try {
      if (await refreshUser()) {
        toast.success('Email verified — welcome to eNOTA!')
        navigate('/materials')
      } else {
        toast.info("Not verified yet. Open the link in the email, then press this button again.")
      }
    } catch (err) { toast.error(friendlyError(err)) } finally { setBusy(false) }
  }

  const resend = async () => {
    setBusy(true)
    try {
      await resendVerificationLink()
      toast.success('A new link is on its way. Check your inbox and spam folder.')
    } catch (err) {
      toast.error(friendlyError(err, 'Could not send the link. Wait a minute and try again.'))
    } finally { setBusy(false) }
  }

  return (
    <div className="card p-8 sm:p-12 text-center border-accent/25">
      <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/40 flex items-center justify-center text-accent mb-7 mx-auto">
        <MailCheck size={38} aria-hidden="true" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">{justRegistered ? 'Account created — check your inbox' : 'Verify your email'}</h2>
      <p className="text-muted mb-8 max-w-md mx-auto leading-relaxed">
        We sent a verification link to <span className="text-ink font-semibold break-all">{currentUser?.email}</span>.
        Open it to unlock your course materials. It can take a minute, and may land in spam.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={check} disabled={busy} className="btn-primary px-7 py-3.5"><RefreshCw size={18} /> I've verified</button>
        <button onClick={resend} disabled={busy} className="btn-outline px-7 py-3.5"><Send size={18} /> Send the link again</button>
      </div>
      <p className="text-sm text-subtle mt-8">Meanwhile you can <Link to="/marks" className="text-accent hover:underline">check your marks</Link> — that doesn't need an account.</p>
    </div>
  )
}
