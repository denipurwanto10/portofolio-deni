import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import CustomCursor from './components/CustomCursor'
import './styles.css'

/**
 * BUG FIX: layar tiba-tiba blank saat pindah halaman.
 *
 * PENYEBAB: Google Translate (dipakai untuk tombol ganti bahasa)
 * membungkus setiap node teks dengan tag <font> LANGSUNG di DOM,
 * di luar sepengetahuan React. Saat pindah halaman, React mencoba
 * removeChild/insertBefore pada node yang sudah "diam-diam diubah"
 * itu, DOM sebenarnya sudah tidak cocok dengan yang React kira, lalu
 * browser melempar DOMException ("Failed to execute 'removeChild'
 * on 'Node': The node to be removed is not a child of this node").
 * Karena tidak ditangani, React langsung unmount seluruh aplikasi
 * -> layar putih kosong.
 *
 * Ini adalah masalah yang sudah lama dikenal di komunitas React saat
 * dipakai bersama Google Translate (facebook/react#11538). Perbaikan
 * standarnya: bungkus removeChild/insertBefore bawaan browser supaya
 * tidak melempar error saat relasi parent-child sudah tidak sesuai —
 * cukup diabaikan dengan aman, bukan meng-crash seluruh halaman.
 */
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild

  Node.prototype.removeChild = function <T extends Node>(
    this: Node,
    child: T,
  ): T {
    if (child.parentNode !== this) {
      // Node sudah dipindah/diubah oleh Google Translate — aman
      // untuk diabaikan, tidak perlu meng-crash seluruh aplikasi.
      return child
    }

    return originalRemoveChild.call(this, child) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore

  Node.prototype.insertBefore = function <T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode
    }

    return originalInsertBefore.call(
      this,
      newNode,
      referenceNode,
    ) as T
  }
}

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
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <CustomCursor />
  </React.StrictMode>,
)