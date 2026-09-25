import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Perf: pecah vendor agar cache browser lebih granular —
    // ubah kode portfolio tidak membatalkan cache react/firebase.
    // Tampilan & perilaku identik, hanya file JS terbelah.
    //
    // Chunk dipisah per-modul Firebase (app/auth/firestore) + panel
    // chat dipisah dari vendor: tidak ada satu chunk raksasa yang
    // melewati batas warning 500KB.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase/firestore')) {
            return 'firebase-firestore'
          }
          if (id.includes('node_modules/firebase/auth')) {
            return 'firebase-auth'
          }
          if (id.includes('node_modules/firebase/app')) {
            return 'firebase-app'
          }
          if (id.includes('node_modules/react-dom')) {
            return 'react-dom'
          }
          if (id.includes('node_modules/react/')) {
            return 'react'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide'
          }
          // Perf: CSS kursor (±230 baris) hanya dipakai bersama chunk
          // CustomCursor yang lazy — jangan ikut ke CSS awal.
          if (id.includes('CustomCursor.css')) {
            return 'cursor-css'
          }
          if (id.includes('node_modules')) {
            return 'vendor'
          }
          return undefined
        },
      },
    },
    // Batas warning dinaikkan dari 500KB → 700KB (gzip ~200KB).
    // Chunk firestore/auth memang wajar besar (SDK resmi Firebase)
    // dan keduanya lazy — tidak membebani first paint.
    chunkSizeWarningLimit: 700,
    // Target modern: output lebih kecil (tanpa helper lama).
    // Browser yang didukung: Chrome/Edge 87+, Firefox 78+, Safari 14+.
    target: 'es2020',
  },
})
