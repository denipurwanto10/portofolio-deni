import {
  Suspense,
  lazy,
  useCallback,
  useRef,
  useState,
} from 'react'
import { MessageSquareText } from 'lucide-react'

// Panel chat (±4500 baris + Firebase SDK) diunduh hanya saat
// tombol pertama kali dibuka — first paint tidak terbebani.
// Tombol buka tetap instan karena dirender langsung di sini.
const LiveChatPanel = lazy(
  () => import('./LiveChat'),
)

/*
 * Pembungkus ringan: tombol buka selalu tersedia seketika,
 * panel berat di-lazy di bawahnya. Prefetch dimulai saat ada
 * NIAT membuka (hover/focus/sentuh) — bukan otomatis saat boot —
 * supaya chunk ±ratusan KB tidak berebut bandwidth dengan
 * gambar LCP di jaringan HP. Tampilan & perilaku identik
 * dengan sebelumnya.
 */
function LiveChatLoader() {
  const [opened, setOpened] =
    useState(false)

  // Cegah prefetch ganda dari hover+focus+touch yang berurutan.
  const prefetched =
    useRef(false)

  const prefetchPanel = useCallback(() => {
    if (prefetched.current) {
      return
    }

    prefetched.current = true
    void import('./LiveChat')
  }, [])

  const handleOpen = useCallback(() => {
    setOpened(true)
  }, [])

  return (
    <>
      {!opened && (
        <button
          type="button"
          className="chat-button"
          onClick={handleOpen}
          onMouseEnter={prefetchPanel}
          onFocus={prefetchPanel}
          onTouchStart={prefetchPanel}
          onPointerDown={prefetchPanel}
          aria-label="Open live chat"
        >
          {/* Ikon chat gaya baru — styling tombol tetap seperti semula. */}
          <MessageSquareText size={29} />
        </button>
      )}

      {opened && (
        <Suspense fallback={null}>
          <LiveChatPanel startOpen />
        </Suspense>
      )}
    </>
  )
}

export default LiveChatLoader
