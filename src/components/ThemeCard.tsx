import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { Palette, X } from 'lucide-react'

export const ACCENTS = [
  { id: 'default', name: 'Default', hex: '#111111' },
  { id: 'ocean', name: 'Ocean', hex: '#2563eb' },
  { id: 'emerald', name: 'Emerald', hex: '#059669' },
  { id: 'violet', name: 'Violet', hex: '#7c3aed' },
  { id: 'orange', name: 'Sunset', hex: '#ea580c' },
  { id: 'rose', name: 'Rose', hex: '#e11d48' },
] as const

export type AccentId =
  (typeof ACCENTS)[number]['id']

const STORAGE_KEY = 'portfolio-accent'

export function getStoredAccent(): AccentId {
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY)

    if (
      ACCENTS.some(
        (accent) => accent.id === raw,
      )
    ) {
      return raw as AccentId
    }
  } catch {
    // Storage tidak tersedia — pakai default.
  }

  return 'default'
}

export function applyAccent(id: AccentId) {
  document.documentElement.setAttribute(
    'data-accent',
    id,
  )

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      id,
    )
  } catch {
    // Persist best-effort saja.
  }
}

/*
 * Tombol theme mengambang — duduk tepat di atas
 * tombol chat. Diklik → membuka menu pilihan warna
 * aksen (menutup saat klik di luar / tekan Escape).
 * Pilihan tersimpan di localStorage.
 */
function ThemePicker() {
  const [accent, setAccent] =
    useState<AccentId>(() => getStoredAccent())

  const [open, setOpen] = useState(false)

  const rootRef =
    useRef<HTMLDivElement | null>(null)

  // Terapkan warna tersimpan saat pertama dipasang.
  useEffect(() => {
    applyAccent(getStoredAccent())
  }, [])

  // Tutup menu saat klik di luar / tekan Escape.
  useEffect(() => {
    if (!open) {
      return
    }

    const onPointerDown = (
      event: PointerEvent,
    ) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false)
      }
    }

    const onKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener(
      'pointerdown',
      onPointerDown,
    )
    document.addEventListener(
      'keydown',
      onKeyDown,
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        onPointerDown,
      )
      document.removeEventListener(
        'keydown',
        onKeyDown,
      )
    }
  }, [open])

  const active =
    ACCENTS.find(
      (item) => item.id === accent,
    ) ?? ACCENTS[0]

  return (
    <div
      className="theme-fab-root"
      ref={rootRef}
    >
      {open && (
        <div
          className="theme-menu"
          role="menu"
          aria-label="Choose accent color"
        >
          <p className="theme-menu-title">
            ACCENT COLOR
          </p>

          <div
            className="theme-swatches"
            role="radiogroup"
            aria-label="Choose accent color"
          >
            {ACCENTS.map((item) => {
              const selected =
                item.id === accent

              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  title={item.name}
                  aria-label={`${item.name} theme`}
                  className={
                    selected
                      ? 'theme-swatch selected'
                      : 'theme-swatch'
                  }
                  style={{
                    ['--swatch' as string]:
                      item.hex,
                  }}
                  onClick={() => {
                    setAccent(item.id)
                    applyAccent(item.id)
                  }}
                >
                  {selected && (
                    <span className="theme-check">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <p className="theme-menu-name">
            <strong>{active.name}</strong>
            <span> · saved automatically</span>
          </p>
        </div>
      )}

      <button
        type="button"
        className={
          open
            ? 'theme-fab open'
            : 'theme-fab'
        }
        onClick={() =>
          setOpen((value) => !value)
        }
        aria-expanded={open}
        aria-label={
          open
            ? 'Close theme picker'
            : 'Open theme picker'
        }
        title="Theme"
      >
        {open ? (
          <X size={22} />
        ) : (
          <Palette size={22} />
        )}
      </button>
    </div>
  )
}

export default ThemePicker
