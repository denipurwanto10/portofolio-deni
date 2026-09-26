import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
  type UserCredential,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Config dibaca dari environment variable (lihat .env.example).
// Fallback literal dipertahankan agar aplikasi tetap jalan tanpa .env.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Init Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Auth
export const auth: Auth = getAuth(app);
const provider = new GoogleAuthProvider();
export const loginWithGoogle = (): Promise<UserCredential> =>
  signInWithPopup(auth, provider);
export const logout = (): Promise<void> => signOut(auth);

// Firestore
export const db: Firestore = getFirestore(app);
