import React, { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, onSnapshot } from 'firebase/firestore'

const BrandingContext = createContext()

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState({
    portalName: 'eNOTA PORTAL',
    headerTitle: 'eNOTA PORTAL',
    logoUrl: '/apple-touch-icon.png',
    footerText: 'Designed by NAD PRODUCTION to facilitate Trainees in Filmmaking, Video Production, COLOR GRADING, AI FILMMAKING, VIBE CODING, and Others.'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const docRef = doc(db, 'settings', 'site_config')
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setBranding(docSnap.data())
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  )
}

export const useBranding = () => useContext(BrandingContext)
