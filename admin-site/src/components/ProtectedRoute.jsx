import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = true }) {
  const { currentUser, isAdmin, isApproved } = useAuth()

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />
  }

  if (adminOnly && !isApproved) {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-display text-accent mb-4">Account Pending Approval</h1>
      <p className="text-white/70 max-w-md">Your account is currently being reviewed by the Master Admin. You will be notified once you are approved.</p>
      <button onClick={() => window.location.href = '/'} className="mt-8 btn-outline">Go back Home</button>
    </div>
  }

  return children
}
