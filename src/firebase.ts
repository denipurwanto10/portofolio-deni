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
//
// PENTING: Vite membekukan import.meta.env saat BUILD, bukan saat
// runtime. Kalau env belum diisi di Vercel, semua nilai di bawah
// jadi undefined, dan initializeApp() melempar — modul ini di-import
// oleh chunk chat, sehingga crash-nya menjatuhkan SELURUH halaman
// (bukan cuma panel chat).
//
// Solusinya: initializeApp() hanya melempar kalau config-nya
// null/undefined sama sekali, bukan kalau isinya tidak valid.
// Jadi saat env kosong, kita isi placeholder agar init tetap sukses.
// Panggilan jaringan (Firestore/Auth) kemudian gagal dengan diam-diam
// di sisi client, dan UI yang sudah menangani error itu tetap jalan.
// Akibatnya: asisten virtual tetap bisa dipakai, hanya login Google
// dan realtime yang nonaktif sampai env diisi di dashboard Vercel.
const PLACEHOLDER = "not-configured";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || PLACEHOLDER,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || PLACEHOLDER,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || PLACEHOLDER,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || PLACEHOLDER,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || PLACEHOLDER,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || PLACEHOLDER,
};

// Deteksi config kosong supaya UI bisa menonaktifkan fitur realtime
// dengan rapi alih-alih menampilkan error ke pengguna.
export const firebaseEnabled = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID,
);

if (!firebaseEnabled && import.meta.env.DEV) {
  console.warn(
    "[firebase] Config belum lengkap. Isi VITE_FIREBASE_* di .env " +
      "(lihat .env.example). Fitur chat realtime & login Google akan " +
      "nonaktif sampai itu diisi; asisten virtual tetap jalan.",
  );
}

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
