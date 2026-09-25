import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

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

let accentTransitionTimer: number | undefined

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
  const root = document.documentElement

  root.setAttribute(
    'data-accent',
    id,
  )

  /*
   * Samakan dengan withThemeTransition di ThemeToggle:
   * pasang atribut ±450ms supaya SELURUH elemen berubah
   * warna serempak (lihat html[data-accent-transition] di
   * styles.css), bukan cuma yang punya transisi sendiri.
   */
  root.setAttribute('data-accent-transition', '')

  window.clearTimeout(accentTransitionTimer)

  accentTransitionTimer = window.setTimeout(() => {
    root.removeAttribute('data-accent-transition')
  }, 450)

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
 * Pemilih warna aksen — dipasang di sidebar tepat di bawah
 * ThemeToggle (dark/light). Dots warna langsung mengganti
 * variabel --accent situs (lihat blok [data-accent] di styles.css).
 * Pilihan tersimpan di localStorage dan diterapkan sebelum
 * React render (lihat script anti-flash di index.html).
 */
function AccentPicker() {
  const [accent, setAccent] =
    useState<AccentId>(() => getStoredAccent())

  // Terapkan warna tersimpan saat pertama dipasang.
  useEffect(() => {
    applyAccent(getStoredAccent())
  }, [])

  return (
    <div className="accent-picker">
      <span className="accent-picker-label">
        Accent color
      </span>

      <div
        className="accent-swatches"
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
              className={[
                'accent-swatch',
                item.id === 'default'
                  ? 'accent-swatch-default'
                  : '',
                selected ? 'selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
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
                <Check
                  size={12}
                  strokeWidth={3.5}
                  className="accent-check"
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default AccentPicker
