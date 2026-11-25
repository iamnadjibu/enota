import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

const verifyLinkSettings = () => ({ url: window.location.origin + '/login?verified=1' })

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [blockedMessage, setBlockedMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [, setVersion] = useState(0)

  async function register(email, password, profileData) {
    const res = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(res.user, { displayName: `${profileData.firstName} ${profileData.lastName}` })
    const userDoc = {
      ...profileData,
      uid: res.user.uid,
      email: res.user.email,
      role: 'student',
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    await setDoc(doc(db, 'users', res.user.uid), userDoc)
    setUserData(userDoc)
    await sendEmailVerification(res.user, verifyLinkSettings())
    return res.user
  }

  function resendVerificationLink() {
    if (!auth.currentUser) return Promise.reject(new Error('No user is currently logged in'))
    return sendEmailVerification(auth.currentUser, verifyLinkSettings())
  }

  // Reload after the user clicks the email link, and refresh the token so
  // Firestore sees the verified address.
  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return false
    await auth.currentUser.reload()
    await auth.currentUser.getIdToken(true)
    setCurrentUser(auth.currentUser)
    setVersion(v => v + 1)
    return auth.currentUser.emailVerified
  }, [])

  function login(email, password) {
    setBlockedMessage('')
    return signInWithEmailAndPassword(auth, email, password)
  }

  function logout() {
    return signOut(auth)
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  useEffect(() => {
    let unsubProfile = () => {}
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubProfile()
      if (!user) {
        setCurrentUser(null)
        setUserData(null)
        setLoading(false)
        return
      }
      try {
        const black = await getDoc(doc(db, 'blacklist', user.uid))
        if (black.exists()) {
          setBlockedMessage('This account has been removed from eNOTA Portal. Contact the eNOTA team if you think this is a mistake.')
          await signOut(auth)
          return
        }
      } catch { /* ignore: rules or network */ }

      // The ID token can lag behind the account (e.g. the email was verified
      // in another tab). Refresh it so Firestore rules see email_verified.
      try {
        await user.reload()
        const token = await user.getIdTokenResult()
        if (user.emailVerified && !token.claims.email_verified) await user.getIdToken(true)
      } catch { /* offline: keep the cached token */ }

      setCurrentUser(user)
      unsubProfile = onSnapshot(doc(db, 'users', user.uid),
        snap => { setUserData(snap.exists() ? snap.data() : null); setLoading(false) },
        () => { setUserData(null); setLoading(false) })
    })
    return () => { unsubscribe(); unsubProfile() }
  }, [])

  const value = {
    currentUser,
    userData,
    blockedMessage,
    emailVerified: !!currentUser?.emailVerified,
    register,
    login,
    logout,
    resetPassword,
    resendVerificationLink,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {loading ? <div className="min-h-screen bg-background" aria-busy="true" /> : children}
    </AuthContext.Provider>
  )
}
