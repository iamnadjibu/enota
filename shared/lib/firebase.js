// Single Firebase initialisation shared by the public site and the admin site.
// The web config below is public by design; access is controlled by
// firestore.rules, Firebase Auth settings and App Check.
import { initializeApp } from 'firebase/app'
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

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Local development against the Firebase emulators:
//   VITE_USE_EMULATORS=true npm run dev   (with `firebase emulators:start`)
const useEmulators = import.meta.env?.VITE_USE_EMULATORS === 'true'
if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

// Google Analytics (page views), only where the browser supports it.
if (!useEmulators) isSupported().then(ok => { if (ok) getAnalytics(app) }).catch(() => {})
