import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MailCheck, RefreshCw, Clock, ShieldCheck, Ban, LogOut, Crown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast, friendlyError } from '@shared/ui/feedback'
import Logo from '@shared/ui/Logo'

function GateCard({ icon, title, children, actions }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 180 }}
        className="card w-full max-w-lg p-10 text-center shadow-2xl"
      >
        <Logo variant="mark" className="h-10 mx-auto mb-8 opacity-90" />
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent mx-auto mb-6">
          {icon}
        </div>
        <h1 className="text-2xl font-display font-bold mb-3">{title}</h1>
        <div className="text-muted leading-relaxed space-y-3">{children}</div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">{actions}</div>
      </motion.div>
    </div>
  )
}

export function VerifyEmailGate() {
  const { currentUser, sendVerificationLink, refreshUser, logout } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const resend = async () => {
    setBusy(true)
    try {
      await sendVerificationLink()
      toast.success(`Verification link sent to ${currentUser.email}. Check your inbox and spam folder.`)
    } catch (err) {
      toast.error(friendlyError(err, 'Could not send the link. Please try again in a minute.'))
    } finally { setBusy(false) }
  }

  const check = async () => {
    setBusy(true)
    try {
      const ok = await refreshUser()
      if (ok) toast.success('Email verified. Welcome!')
      else toast.info("We couldn't confirm it yet. Open the link in the email, then try again.")
    } catch (err) {
      toast.error(friendlyError(err))
    } finally { setBusy(false) }
  }

  return (
    <GateCard
      icon={<MailCheck size={30} />}
      title="Verify your email"
      actions={<>
        <button onClick={check} disabled={busy} className="btn-primary"><RefreshCw size={16} /> I've verified</button>
        <button onClick={resend} disabled={busy} className="btn-outline">Send link again</button>
        <button onClick={logout} className="btn-ghost"><LogOut size={16} /> Sign out</button>
      </>}
    >
      <p>Admin access requires a verified email. Open the link we sent to <span className="text-ink font-semibold">{currentUser?.email}</span>, then come back and press <em>I've verified</em>.</p>
    </GateCard>
  )
}

export function ClaimSuperAdminCard({ compact = false }) {
  const { claimSuperAdmin } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const claim = async () => {
    setBusy(true)
    try {
      await claimSuperAdmin()
      toast.success('You are now the Super Admin of eNOTA Portal.', { title: 'Super Admin activated' })
    } catch (err) {
      if (err.code === 'permission-denied') {
        toast.error('Only the portal owner account can claim Super Admin.')
      } else toast.error(friendlyError(err))
    } finally { setBusy(false) }
  }

  if (compact) {
    return (
      <div className="card p-6 border-accent/30 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Crown className="text-accent shrink-0" size={28} />
        <div className="flex-1">
          <p className="font-semibold">No Super Admin has been set up yet</p>
          <p className="text-sm text-muted">If you own this portal, claim Super Admin to approve and manage other admins.</p>
        </div>
        <button onClick={claim} disabled={busy} className="btn-primary">Claim Super Admin</button>
      </div>
    )
  }
  return null
}

export default function ProtectedRoute({ children }) {
  const { currentUser, userData, emailVerified, isAdmin, superAdminClaimed, superAdminLoading, logout } = useAuth()

  if (!currentUser) return <Navigate to="/login" replace />
  if (!emailVerified) return <VerifyEmailGate />
  if (superAdminLoading) return <div className="min-h-screen bg-background" />

  if (!isAdmin) {
    if (!superAdminClaimed) {
      return (
        <GateCard
          icon={<Crown size={30} />}
          title="Set up the Super Admin"
          actions={<button onClick={logout} className="btn-ghost"><LogOut size={16} /> Sign out</button>}
        >
          <p>This portal has no Super Admin yet. The owner account can claim it once; after that, only the Super Admin approves and promotes other admins.</p>
          <div className="pt-2"><ClaimSuperAdminCard compact /></div>
        </GateCard>
      )
    }

    const status = userData?.status
    if (status === 'pending' || !userData) {
      return (
        <GateCard icon={<Clock size={30} />} title="Waiting for approval"
          actions={<button onClick={logout} className="btn-outline"><LogOut size={16} /> Sign out</button>}>
          <p>Your admin application has been received. The Super Admin will review it, and you'll get access as soon as it's approved.</p>
        </GateCard>
      )
    }
    if (status === 'declined' || status === 'inactive' || status === 'suspended') {
      return (
        <GateCard icon={<Ban size={30} />} title={status === 'declined' ? 'Application declined' : 'Access suspended'}
          actions={<button onClick={logout} className="btn-outline"><LogOut size={16} /> Sign out</button>}>
          <p>{status === 'declined'
            ? 'Your admin application was not approved. Contact the Super Admin if you think this is a mistake.'
            : 'Your admin access is currently suspended. Contact the Super Admin to restore it.'}</p>
        </GateCard>
      )
    }
    return (
      <GateCard icon={<ShieldCheck size={30} />} title="Admins only"
        actions={<a href="/" className="btn-primary">Go to the public site</a>}>
        <p>This area is for eNOTA administrators. Trainees can sign in on the public site.</p>
      </GateCard>
    )
  }

  return children
}
