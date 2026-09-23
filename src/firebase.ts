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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyBSbby4tDPnVlSz8SgwCsJn5nI3d9IpO5o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "webportofolio-cfc01.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "webportofolio-cfc01",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "webportofolio-cfc01.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "714853391679",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:714853391679:web:bd33b84f8e70b9e795878a",
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
