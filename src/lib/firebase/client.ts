import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, browserLocalPersistence, setPersistence, type Auth } from 'firebase/auth'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const isBrowser = typeof window !== 'undefined'
const app: FirebaseApp | null = isBrowser
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null

const auth = app ? getAuth(app) : (null as unknown as Auth)

// Ensure Firebase auth persistence is set to local storage
if (auth && isBrowser) {
  setPersistence(auth, browserLocalPersistence).catch(console.error)
}

export const firebaseAuth = auth
export const googleAuthProvider = app ? new GoogleAuthProvider() : (null as unknown as GoogleAuthProvider)
export const firebaseStorage = app ? getStorage(app) : (null as unknown as FirebaseStorage)
