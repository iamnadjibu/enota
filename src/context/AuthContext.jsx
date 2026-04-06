import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  async function register(email, password, profileData) {
    const res = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(res.user, {
      displayName: `${profileData.firstName} ${profileData.lastName}`
    })
    
    const userDoc = {
      uid: res.user.uid,
      email: res.user.email,
      ...profileData,
      role: profileData.role || 'student', // 'student' or 'admin'
      status: profileData.role === 'admin' ? 'pending' : 'active',
      createdAt: new Date().toISOString()
    }

    await setDoc(doc(db, 'users', res.user.uid), userDoc)
    
    if (profileData.role !== 'admin') {
      await sendEmailVerification(res.user)
    }
    
    return res.user
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function logout() {
    return signOut(auth)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        const docRef = doc(db, 'users', user.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setUserData(docSnap.data())
        }
      } else {
        setCurrentUser(null)
        setUserData(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userData,
    register,
    login,
    logout,
    isAdmin: userData?.role === 'admin' || userData?.email === 'nadjibullahu@gmail.com',
    isMaster: userData?.email === 'nadjibullahu@gmail.com',
    isApproved: userData?.status === 'active' || userData?.email === 'nadjibullahu@gmail.com'
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
