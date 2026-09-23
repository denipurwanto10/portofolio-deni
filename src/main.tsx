import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

// Matikan scroll restoration bawaan browser.
//
// Tanpa ini, saat halaman di-reload/di-load ulang, browser akan
// mencoba mengembalikan posisi scroll terakhir (dari history),
// padahal konten React baru saja dirender ulang dari awal.
// Hasilnya: halaman terasa "melompat" ke tengah, bukan mulai dari
// paling atas seperti seharusnya pada first load.
if (
  typeof window !== 'undefined' &&
  'scrollRestoration' in window.history
) {
  window.history.scrollRestoration = 'manual'
}

if (typeof window !== 'undefined') {
  window.scrollTo(0, 0)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)