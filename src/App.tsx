import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ElementType } from 'react'
import {
  Award,
  BriefcaseBusiness,
  Code2,
  Grid2X2,
  Mail,
  Menu,
  MonitorCog,
  X,
} from 'lucide-react'

import Dashboard from './pages/Dashboard'
import ThemeToggle from './components/ThemeToggle'
import AccentPicker from './components/ThemeCard'
import LanguageToggle from './components/LanguageToggle'
import { useManualTranslation } from './manualTranslations'
// Halaman non-dashboard di-lazy-load: bundle awal hanya berisi
// Dashboard + shell, halaman lain diunduh saat pertama dibuka.
// Tampilan identik — hanya momentum unduh yang berubah.
const Experience = lazy(() => import('./pages/Experience'))
const Projects = lazy(() => import('./pages/Projects'))
const Awards = lazy(() => import('./pages/Awards'))
const TechStack = lazy(() => import('./pages/TechStack'))
const Community = lazy(() => import('./pages/Community'))
const Blog = lazy(() => import('./pages/Blog'))
const Contact = lazy(() => import('./pages/Contact'))
// LiveChat (±4500 baris + Firebase) juga lazy: panel + SDK
// tidak membebani first paint sebelum tombol chat dibuka.
const LiveChat = lazy(() => import('./components/LiveChat'))
// Prefetch panel chat saat browser idle supaya tombol chat
// tetap terasa instan walau chunk-nya lazy.
if (typeof window !== 'undefined') {
  const preloadChat = () => import('./components/LiveChat')
  const idle =
    (window as unknown as {
      requestIdleCallback?: (cb: () => void) => number
    }).requestIdleCallback
  if (typeof idle === 'function') {
    idle.call(window, preloadChat)
  } else {
    window.setTimeout(preloadChat, 3000)
  }
}

type SectionId =
  | 'dashboard'
  | 'experience'
  | 'projects'
  | 'awards'
  | 'stack'
  | 'community'
  | 'blog'
  | 'contact'

type NavItem = {
  id: SectionId
  label: string
  icon: ElementType
  path: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Grid2X2, path: '/' },
  { id: 'experience', label: 'Experience', icon: BriefcaseBusiness, path: '/experience' },
  { id: 'projects', label: 'Projects', icon: Code2, path: '/projects' },
  { id: 'awards', label: 'Awards & Certs', icon: Award, path: '/awards-certs' },
  { id: 'stack', label: 'Tech Stack', icon: MonitorCog, path: '/tech-stack' },
  // { id: 'community', label: 'Community', icon: UsersRound, path: '/community' },
  // { id: 'blog', label: 'Blog', icon: BookOpen, path: '/blog' },
  { id: 'contact', label: 'Contact', icon: Mail, path: '/contact' },
]

const pathToSection: Record<string, SectionId> = Object.fromEntries(
  navItems.map((item) => [item.path, item.id]),
)

function getInitialSection(): SectionId {
  if (typeof window === 'undefined') {
    return 'dashboard'
  }

  return (
    pathToSection[window.location.pathname] ||
    'dashboard'
  )
}

function App() {
  useManualTranslation()
  // A6: inisializer harus murni — tanpa replaceState saat render.
  const [active, setActive] = useState<SectionId>(getInitialSection)

  // URL tak dikenal dinormalkan sekali setelah mount.
  useEffect(() => {
    if (!pathToSection[window.location.pathname]) {
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Pastikan halaman selalu mulai dari paling atas saat pertama
  // kali dimuat, terlepas dari posisi scroll sebelumnya.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Konten halaman diganti seketika (key={active}), jadi scroll ke atas
  // juga harus seketika dan sebelum paint. Sebelumnya memakai smooth
  // scroll, sehingga halaman baru muncul di posisi lama lalu "meluncur"
  // ke atas bersamaan dengan animasi fade-in — terasa patah-patah.
  const firstRender = useRef(true)

  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }

    window.scrollTo(0, 0)
  }, [active])


  useEffect(() => {
    const onPopState = () => {
      const section =
        pathToSection[window.location.pathname] ||
        'dashboard'

      setActive(section)
      setMobileOpen(false)
    }

    window.addEventListener('popstate', onPopState)

    return () => {
      window.removeEventListener(
        'popstate',
        onPopState,
      )
    }
  }, [])

  // Lindungi konten portfolio dari aksi copy/drag/context-menu.
  // Field input/textarea/contenteditable tetap dibiarkan normal agar
  // pengguna masih bisa mengetik dan mengedit pesan di Live Chat.
  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      const element = target as HTMLElement | null
      if (!element) return false

      return Boolean(
        element.closest(
          'input, textarea, select, [contenteditable="true"]',
        ),
      )
    }

    const blockContextMenu = (event: MouseEvent) => {
      if (!isEditableTarget(event.target)) {
        event.preventDefault()
      }
    }

    const blockCopy = (event: ClipboardEvent) => {
      if (!isEditableTarget(event.target)) {
        event.preventDefault()
      }
    }

    const blockDrag = (event: DragEvent) => {
      if (!isEditableTarget(event.target)) {
        event.preventDefault()
      }
    }

    const blockCopyShortcut = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return

      const key = event.key.toLowerCase()
      if ((event.ctrlKey || event.metaKey) && (key === 'c' || key === 'x')) {
        event.preventDefault()
      }
    }

    document.addEventListener('contextmenu', blockContextMenu)
    document.addEventListener('copy', blockCopy)
    document.addEventListener('cut', blockCopy)
    document.addEventListener('dragstart', blockDrag)
    document.addEventListener('keydown', blockCopyShortcut)

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu)
      document.removeEventListener('copy', blockCopy)
      document.removeEventListener('cut', blockCopy)
      document.removeEventListener('dragstart', blockDrag)
      document.removeEventListener('keydown', blockCopyShortcut)
    }
  }, [])

  // BUG FIX (mobile): kunci scroll body + tutup dengan Escape
  // selama drawer sidebar terbuka, supaya konten belakang
  // tidak ikut kegeser saat menu digeser/di-scroll.
  useEffect(() => {
    if (!mobileOpen) {
      return
    }

    document.documentElement.style.overflow =
      'hidden'
    document.body.style.overflow = 'hidden'

    const onKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
      }
    }

    document.addEventListener(
      'keydown',
      onKeyDown,
    )

    return () => {
      document.documentElement.style.overflow =
        ''
      document.body.style.overflow = ''
      document.removeEventListener(
        'keydown',
        onKeyDown,
      )
    }
  }, [mobileOpen])

  const goTo = (id: SectionId) => {
  const item = navItems.find(
    (nav) => nav.id === id,
  )

  if (!item) return

  if (window.location.pathname !== item.path) {
    window.history.pushState({}, '', item.path)
  }

  setActive(id)
  setMobileOpen(false)

  // Pindah halaman: scroll ke atas ditangani useLayoutEffect di atas.
  // Klik menu halaman yang sedang aktif: smooth scroll ke atas.
  if (id === active) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
}

  return (
    <div className="app">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={
          mobileOpen
            ? 'sidebar open'
            : 'sidebar'
        }
      >
        <div className="profile">
          <div className="avatar-wrap">
            <img
              src="/profil.png"
              alt="Deni Purwanto"
              className="avatar"
              width={76}
              height={76}
              decoding="async"
              onError={(e) => {
                const img =
                  e.currentTarget
                // Cegah loop jika fallback ikut gagal.
                img.onerror = null
                img.src =
                  '/profile-placeholder.svg'
              }}
            />

            <span className="status-dot" />
          </div>

          <h2 className="notranslate" translate="no">
            Deni Purwanto
          </h2>

          <p>Full Stack Developer</p>

          <LanguageToggle />
        </div>

        <div className="menu-label">
          MENU
        </div>

        <nav className="nav">
          {navItems.map(
            ({
              id,
              label,
              icon: Icon,
            }) => (
              <button
                type="button"
                key={id}
                className={
                  active === id
                    ? 'nav-item active'
                    : 'nav-item'
                }
                onClick={() => goTo(id)}
              >
                <Icon
                  size={18}
                  strokeWidth={1.8}
                />

                <span>{label}</span>
              </button>
            ),
          )}
        </nav>

        <ThemeToggle />

        <AccentPicker />

        <div className="sidebar-footer">
          <strong>
            DESIGNED & BUILT BY
          </strong>

          <span className="notranslate" translate="no">
            Deni Purwanto
          </span>

          <small>
            © 2026 All Rights Reserved.
          </small>
        </div>
      </aside>

      <button
        type="button"
        className={`sidebar-overlay ${mobileOpen ? 'is-visible' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-label="Close menu"
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
      />

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="main">
        <header className={`mobile-header ${mobileOpen ? 'is-open' : ''}`}>
          <div className="mobile-header-profile">
            <img
              src="/profil.png"
              alt="Deni Purwanto"
              className="mobile-header-avatar"
              width={34}
              height={34}
              decoding="async"
              onError={(e) => {
                const img = e.currentTarget
                img.onerror = null
                img.src = '/profile-placeholder.svg'
              }}
            />
            <strong>Deni Purwanto</strong>
          </div>

          <button
            type="button"
            className="mobile-header-menu"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} strokeWidth={2.2} /> : (
              <Menu size={21} strokeWidth={2.1} />
            )}
          </button>
        </header>

        <div className="content">
          <div key={active} className="page-swap">
            <Suspense fallback={null}>
              {active === 'dashboard' && <Dashboard />}
              {active === 'experience' && <Experience />}
              {active === 'projects' && (
                <Projects search={search} setSearch={setSearch} />
              )}
              {active === 'awards' && <Awards />}
              {active === 'stack' && <TechStack />}
              {active === 'community' && <Community />}
              {active === 'blog' && <Blog />}
              {active === 'contact' && <Contact />}
            </Suspense>

          </div>

          <footer className="mobile-footer">
            Designed & built by{' '}
            <b>Deni Purwanto</b>
          </footer>
        </div>
      </main>

      <Suspense fallback={null}>
        <LiveChat />
      </Suspense>
    </div>
  )
}

export default App
