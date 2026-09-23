import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'portfolio-theme'

function getSystemTheme(): ThemeMode {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  } catch {
    return 'light'
  }
}

export function getStoredTheme(): ThemeMode {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (raw === 'light' || raw === 'dark') {
      return raw
    }
  } catch {
    // Storage tidak tersedia — pakai preferensi sistem.
  }

  return getSystemTheme()
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme)

  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Persist best-effort saja.
  }
}

/*
 * Saat tema berganti, semua elemen (bukan hanya yang terdaftar di
 * aturan transisi global) ikut berubah warna dengan halus. Atribut
 * dipasang sebentar saja supaya tidak mengganggu transisi hover dll.
 */
let themeTransitionTimer: number | undefined

export function withThemeTransition() {
  const root = document.documentElement

  root.setAttribute('data-theme-transition', '')

  window.clearTimeout(themeTransitionTimer)

  themeTransitionTimer = window.setTimeout(() => {
    root.removeAttribute('data-theme-transition')
  }, 450)
}

/*
 * Saklar mode gelap/terang. Nilai diterapkan langsung ke
 * <html data-theme="..."> (lihat variabel warna di styles.css)
 * dan disimpan ke localStorage supaya tetap konsisten saat
 * halaman di-refresh.
 */
function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    getStoredTheme(),
  )

  // Pastikan atribut di <html> sinkron dengan state (juga
  // menutup kemungkinan race dengan script anti-flash di index.html).
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-checked={isDark}
      aria-label={
        isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'
      }
      title={isDark ? 'Light mode' : 'Dark mode'}
      onClick={() => {
        withThemeTransition()

        setTheme((current) =>
          current === 'dark' ? 'light' : 'dark',
        )
      }}
    >
      <span className="theme-toggle-icon">
        {isDark ? <Moon size={14} /> : <Sun size={14} />}
      </span>

      <span className="theme-toggle-label">
        {isDark ? 'Dark mode' : 'Light mode'}
      </span>

      <span
        className={
          isDark
            ? 'theme-toggle-switch on'
            : 'theme-toggle-switch'
        }
        aria-hidden="true"
      >
        <span className="theme-toggle-knob" />
      </span>
    </button>
  )
}

export default ThemeToggle
