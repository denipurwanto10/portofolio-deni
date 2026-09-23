import { useEffect, useState } from 'react'
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
import Experience from './pages/Experience'
import Projects from './pages/Projects'
import Awards from './pages/Awards'
import TechStack from './pages/TechStack'
import Community from './pages/Community'
import Blog from './pages/Blog'
import Contact from './pages/Contact'
import LiveChat from './components/LiveChat'
import ThemeToggle from './components/ThemeToggle'

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
  { id: 'dashboard', label: 'Dashboard', icon: Grid2X2, path: '/dashboard' },
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

function App() {
  const [active, setActive] = useState<SectionId>(() => {
    if (typeof window === 'undefined') {
      return 'dashboard'
    }

    const section =
      pathToSection[window.location.pathname] ||
      'dashboard'

    if (!pathToSection[window.location.pathname]) {
      window.history.replaceState({}, '', '/dashboard')
    }

    return section
  })

  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Pastikan halaman selalu mulai dari paling atas saat pertama
  // kali dimuat, terlepas dari posisi scroll sebelumnya.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])


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

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
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

          <h2>Deni Purwanto</h2>

          <p>Full Stack Developer</p>
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

        <div className="sidebar-footer">
          <strong>
            DESIGNED & BUILT BY
          </strong>

          <span>Deni Purwanto</span>

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
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} strokeWidth={2.2} /> : (
              <Menu size={21} strokeWidth={2.1} />
            )}
          </button>
        </header>

        <div className="content">
          <div key={active} className="page-swap">
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

          </div>

          <footer className="mobile-footer">
            Designed & built by{' '}
            <b>Deni Purwanto</b>
          </footer>
        </div>
      </main>

      <LiveChat />
    </div>
  )
}

export default App
