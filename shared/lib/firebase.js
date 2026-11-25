// Single Firebase initialisation shared by the public site and the admin site.
// The web config below is public by design; access is controlled by
// firestore.rules, Firebase Auth settings and App Check.
import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyDa2wnPKFQ59eZ2vtXqOMEZthTMq9vrM0U',
  authDomain: 'enotaportal.firebaseapp.com',
  projectId: 'enotaportal',
  storageBucket: 'enotaportal.firebasestorage.app',
  messagingSenderId: '188397746520',
  appId: '1:188397746520:web:71a5698e302fe82ab38d2d',
  measurementId: 'G-2J233P190W',
}

// reCAPTCHA Enterprise site key used by Firebase App Check. Site keys are
// public by design (they are visible in every page that loads reCAPTCHA).
export const RECAPTCHA_SITE_KEY = '6LeBmjEuAAAAAJAoigq-XuCL4KLftR3ZpMxTHnzx'

export const app = initializeApp(firebaseConfig)

// Local development against the Firebase emulators:
//   VITE_USE_EMULATORS=true npm run dev   (with `firebase emulators:start`)
const useEmulators = import.meta.env?.VITE_USE_EMULATORS === 'true'

// App Check: proves requests come from this website, so Firestore, Auth and
// Gemini (AI Logic) can reject scripts and bots once enforcement is on.
// On localhost a debug token is printed in the browser console; register it
// in Firebase console → App Check → Apps → Manage debug tokens.
export let appCheck = null
if (typeof window !== 'undefined' && !useEmulators) {
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env?.VITE_APPCHECK_DEBUG_TOKEN || true
  }
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    })
  } catch (err) {
    console.warn('App Check could not start', err)
  }
}

export const auth = getAuth(app)
export const db = getFirestore(app)
if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

// Google Analytics (page views), only where the browser supports it.
if (!useEmulators) isSupported().then(ok => { if (ok) getAnalytics(app) }).catch(() => {})
