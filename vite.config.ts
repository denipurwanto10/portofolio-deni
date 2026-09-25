import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Perf: pecah vendor agar cache browser lebih granular —
    // ubah kode portfolio tidak membatalkan cache react/firebase.
    // Tampilan & perilaku identik, hanya file JS terbelah.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
    // Target modern: output lebih kecil (tanpa helper lama).
    // Browser yang didukung: Chrome/Edge 87+, Firefox 78+, Safari 14+.
    target: 'es2020',
  },
})
