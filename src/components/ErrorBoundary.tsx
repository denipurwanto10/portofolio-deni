import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

type Props = {
  children: ReactNode
  /**
   * Konten cadangan saat ada error. Kalau tidak diberikan,
   * dipakai tampilan "Ups, ada yang tidak beres" + tombol
   * muat ulang. Scope ErrorBoundary di LiveChatLoader memakai
   * fallback supaya panel chat yang gagal TIDAK menjatuhkan
   * seluruh halaman.
   */
  fallback?: ReactNode
}

type State = {
  hasError: boolean
}

/**
 * Jaring pengaman terakhir.
 *
 * Tanpa ini, error React apa pun (termasuk yang dipicu gangguan DOM
 * dari Google Translate yang tidak tertangkap oleh patch di
 * main.tsx) membuat seluruh aplikasi unmount dan pengguna hanya
 * melihat layar putih kosong tanpa penjelasan atau jalan keluar.
 *
 * Dengan ErrorBoundary ini, pengguna tetap melihat pesan singkat
 * dan tombol untuk memuat ulang halaman.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Terjadi error yang tidak tertangani:', error, info)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    // Fallback custom (mis. panel chat) — halaman tetap hidup.
    if (this.props.fallback) {
      return this.props.fallback
    }

    return (
      <div className="error-boundary">
        <div className="error-boundary-card">
          <h2>Ups, ada yang tidak beres</h2>

          <p>
            Halaman mengalami kendala saat menampilkan konten. Coba
            muat ulang halaman.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={16} />
            Muat ulang halaman
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
