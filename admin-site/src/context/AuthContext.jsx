import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

const verifyLinkSettings = () => ({ url: window.location.origin + '/admin/' })

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [superAdminDoc, setSuperAdminDoc] = useState(undefined) // undefined = loading, null = unclaimed
  const [blockedMessage, setBlockedMessage] = useState('')
  const [loading, setLoading] = useState(true)
  // Bumped after reload() so derived values pick up emailVerified changes.
  const [, setVersion] = useState(0)

  async function register(email, password, profileData) {
    const res = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(res.user, {
      displayName: `${profileData.firstName} ${profileData.lastName}`,
    })
    // Admin applications always start as "pending"; the rules enforce this.
    const { role: _ignored, status: _ignored2, ...profile } = profileData
    await setDoc(doc(db, 'users', res.user.uid), {
      ...profile,
      uid: res.user.uid,
      email: res.user.email,
      role: 'admin',
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
    await sendEmailVerification(res.user, verifyLinkSettings())
    return res.user
  }

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

  function sendVerificationLink() {
    if (!auth.currentUser) return Promise.reject(new Error('Not signed in'))
    return sendEmailVerification(auth.currentUser, verifyLinkSettings())
  }

  // Re-read the account after the user clicks the verification link,
  // and refresh the ID token so Firestore sees email_verified = true.
  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return false
    await auth.currentUser.reload()
    await auth.currentUser.getIdToken(true)
    setCurrentUser(auth.currentUser)
    setVersion(v => v + 1)
    return auth.currentUser.emailVerified
  }, [])

  // One-time claim: the first verified owner account becomes the founding Super Admin.
  async function claimSuperAdmin() {
    const user = auth.currentUser
    if (!user) throw new Error('Not signed in')
    await user.getIdToken(true)
    await setDoc(doc(db, 'system', 'superadmin'), {
      uid: user.uid,
      email: user.email,
      claimedAt: new Date().toISOString(),
    })
    const { id: _id, ...existing } = userData || {}
    const profile = {
      ...existing,
      uid: user.uid,
      email: user.email,
      firstName: userData?.firstName || (user.displayName || '').split(' ')[0] || 'Super',
      lastName: userData?.lastName || (user.displayName || '').split(' ').slice(1).join(' ') || 'Admin',
      role: 'superadmin',
      status: 'active',
      createdAt: userData?.createdAt || new Date().toISOString(),
    }
    await setDoc(doc(db, 'users', user.uid), profile)
    setUserData(profile)
  }

  // Live profile + Super Admin record + blacklist check.
  useEffect(() => {
    let unsubProfile = () => {}
    let unsubSuper = () => {}

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubProfile()
      unsubSuper()
      if (!user) {
        setCurrentUser(null)
        setUserData(null)
        setSuperAdminDoc(undefined)
        setLoading(false)
        return
      }

      try {
        const black = await getDoc(doc(db, 'blacklist', user.uid))
        if (black.exists()) {
          setBlockedMessage('This account has been removed from eNOTA Portal. Contact the Super Admin if you think this is a mistake.')
          await signOut(auth)
          return
        }
      } catch (err) {
        console.warn('Blacklist check failed', err)
      }

      // The ID token can lag behind the account (e.g. the email was verified
      // in another tab). Refresh it so Firestore rules see email_verified.
      try {
        await user.reload()
        const token = await user.getIdTokenResult()
        if (user.emailVerified && !token.claims.email_verified) await user.getIdToken(true)
      } catch { /* offline: keep the cached token */ }

      setCurrentUser(user)
      unsubSuper = onSnapshot(
        doc(db, 'system', 'superadmin'),
        snap => setSuperAdminDoc(snap.exists() ? snap.data() : null),
        () => setSuperAdminDoc(null),
      )
      unsubProfile = onSnapshot(
        doc(db, 'users', user.uid),
        snap => {
          setUserData(snap.exists() ? { id: snap.id, ...snap.data() } : null)
          setLoading(false)
        },
        () => { setUserData(null); setLoading(false) },
      )
    })

    return () => { unsubscribe(); unsubProfile(); unsubSuper() }
  }, [])

  const emailVerified = !!currentUser?.emailVerified
  const isFounder = !!currentUser && superAdminDoc?.uid === currentUser.uid
  const isSuperAdmin = emailVerified && (isFounder || (
    ['superadmin', 'master'].includes(userData?.role) && userData?.status === 'active'
  ))
  const isAdmin = isSuperAdmin || (emailVerified && userData?.role === 'admin' && userData?.status === 'active')

  const value = {
    currentUser,
    userData,
    register,
    login,
    logout,
    resetPassword,
    sendVerificationLink,
    refreshUser,
    claimSuperAdmin,
    blockedMessage,
    emailVerified,
    superAdminClaimed: superAdminDoc !== null,
    superAdminLoading: superAdminDoc === undefined,
    superAdminUid: superAdminDoc?.uid || null,
    isFounder,
    isSuperAdmin,
    // Kept for older components; "Master Admin" is now called "Super Admin".
    isMaster: isSuperAdmin,
    isAdmin,
    isApproved: isAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
