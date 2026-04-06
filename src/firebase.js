// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDa2wnPKFQ59eZ2vtXqOMEZthTMq9vrM0U",
  authDomain: "enotaportal.firebaseapp.com",
  projectId: "enotaportal",
  storageBucket: "enotaportal.firebasestorage.app",
  messagingSenderId: "188397746520",
  appId: "1:188397746520:web:71a5698e302fe82ab38d2d",
  measurementId: "G-2J233P190W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, db, googleProvider };
