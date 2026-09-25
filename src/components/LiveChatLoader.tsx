import { Suspense, lazy, useCallback, useState } from 'react'
import { MessageCircle } from 'lucide-react'

// Panel chat (±4500 baris + Firebase SDK) diunduh hanya saat
// tombol pertama kali dibuka — first paint tidak terbebani.
// Tombol buka tetap instan karena dirender langsung di sini.
const LiveChatPanel = lazy(
  () => import('./LiveChat'),
)

/*
 * Pembungkus ringan: tombol buka selalu tersedia seketika,
 * panel berat di-lazy di bawahnya. Tampilan & perilaku identik
 * dengan sebelumnya.
 */
function LiveChatLoader() {
  const [opened, setOpened] =
    useState(false)

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
          aria-label="Open live chat"
        >
          <MessageCircle size={23} />
        </button>
      )}

      {opened && (
        <Suspense fallback={null}>
          <LiveChatPanel />
        </Suspense>
      )}
    </>
  )
}

export default LiveChatLoader
