import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import {
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  FileText,
  Download,
  X,
  CodeXml,
  GraduationCap,
  ChevronRight,
} from 'lucide-react'
import {
  useCountUp,
  useInView,
} from '../hooks/useMotion'
import streakRecordData from '../data/streakRecord.json'
import {
  fetchVisitorPlace,
  formatGmt,
  getHomeOffsetMinutes,
  getVisitorTimeZone,
  getZoneCountry,
  homeBase,
  visitorLocationSource,
  type VisitorPlace,
} from '../data'
import {
  getStoredLanguage,
  LANGUAGE_EVENT,
  type SiteLanguage,
} from '../manualTranslations'

/*
 * Rekor streak sepanjang masa — lihat catatan di dekat
 * `displayStreak` di bawah. Fallback supaya tampilan tidak
 * kosong kalau file JSON somehow tidak terbaca.
 */
const streakRecord =
  streakRecordData.allTimeLongestStreak
    ? streakRecordData
    : {
        username: streakRecordData.username,
        allTimeLongestStreak: {
          length: 0,
          start: null,
          end: null,
        },
      }

// Harus sama dengan durasi animasi keluar modal di styles.css
// (--modal-exit), supaya modal tidak terpotong saat ditutup.
const MODAL_EXIT_MS = 200

type GithubContribution = {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

type ContributionWeek = GithubContribution[]
type MonthLabel = {
  label: string
  column: number
}

function parseGithubDate(date: string) {
  const [year, month, day] =
    date.split('-').map(Number)

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  )
}

function formatGithubDate(date: string) {
  return parseGithubDate(date).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    },
  )
}

function buildContributionWeeks(
  contributions: GithubContribution[],
): ContributionWeek[] {
  if (!contributions.length) {
    return []
  }

  const sorted = [...contributions].sort(
    (a, b) =>
      parseGithubDate(a.date).getTime() -
      parseGithubDate(b.date).getTime(),
  )

  const map = new Map(
    sorted.map((item) => [
      item.date,
      item,
    ]),
  )

  const latestItem =
    sorted[sorted.length - 1]

  if (!latestItem) {
    return []
  }

  const latestDate = parseGithubDate(
    latestItem.date,
  )

  /*
   * GitHub contribution graph:
   * Sunday → Saturday
   */

  const endDate = new Date(latestDate)

  endDate.setUTCDate(
    endDate.getUTCDate() +
      (6 - endDate.getUTCDay()),
  )

  const startDate = new Date(endDate)

  startDate.setUTCDate(
    startDate.getUTCDate() - 364,
  )

  startDate.setUTCDate(
    startDate.getUTCDate() -
      startDate.getUTCDay(),
  )

  const weeks: ContributionWeek[] = []

  const cursor = new Date(startDate)

  while (
    cursor.getTime() <= endDate.getTime()
  ) {
    const week: ContributionWeek = []

    for (let i = 0; i < 7; i++) {
      const dateKey = cursor
        .toISOString()
        .slice(0, 10)

      week.push(
        map.get(dateKey) ?? {
          date: dateKey,
          count: 0,
          level: 0,
        },
      )

      cursor.setUTCDate(
        cursor.getUTCDate() + 1,
      )
    }

    weeks.push(week)
  }

  return weeks.slice(-53)
}

function buildMonthLabels(
  weeks: ContributionWeek[],
): MonthLabel[] {
  const labels: MonthLabel[] = []

  let previousMonth = ''
  let lastColumn = -10

  weeks.forEach((week, index) => {
    const firstDay = week[0]

    if (!firstDay) {
      return
    }

    const date = parseGithubDate(
      firstDay.date,
    )

    const monthKey =
      `${date.getUTCFullYear()}-${date.getUTCMonth()}`

    if (monthKey !== previousMonth) {
      previousMonth = monthKey

      /*
       * Kartu kini setengah lebar: dua pergantian bulan bisa jatuh
       * di minggu bersebelahan (mis. Sep → Oct) sehingga labelnya
       * bertumpuk ("Saoct"). Lewati label yang terlalu dekat dengan
       * label sebelumnya — satu label butuh ±3 kolom.
       */
      const column = index + 1

      if (column - lastColumn < 3) {
        return
      }

      lastColumn = column

      labels.push({
        label: date.toLocaleDateString(
          'en-US',
          {
            month: 'short',
            timeZone: 'UTC',
          },
        ),
        column,
      })
    }
  })

  return labels
}

const SHOWCASE_TECH: {
  name: string
  logo: string
  logoDark?: string
  darkAdapt?: boolean
}[] = [
  { name: 'React', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
  { name: 'TypeScript', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
  { name: 'Next.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg', darkAdapt: true },
  { name: 'Astro', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/astro/astro-original.svg' },
  { name: 'Vue.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg' },
  { name: 'Vite', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg' },
  { name: 'Tailwind CSS', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg' },
  { name: 'JavaScript', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
  { name: 'Bootstrap', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg' },
  { name: 'Leaflet.js', logo: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/src/images/logo.svg' },
  { name: 'Node.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
  { name: 'Supabase', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/supabase/supabase-original.svg' },
  { name: 'PostgreSQL', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
  { name: 'MySQL', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg' },
  { name: 'Laravel', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg' },
  { name: 'CodeIgniter', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/codeigniter/codeigniter-plain.svg' },
  { name: 'Firebase', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg' },
  { name: 'Python', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { name: 'Pandas', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg' },
  { name: 'Scikit-Learn', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/scikitlearn/scikitlearn-original.svg' },
  { name: 'Jupyter', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jupyter/jupyter-original.svg' },
  { name: 'Figma', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg' },
  { name: 'Git', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
  { name: 'GitHub', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg', darkAdapt: true },
  { name: 'Antigravity', logo: 'https://cdn.jsdelivr.net/gh/selfhst/icons/png/google-antigravity.png' },
  { name: 'Postman', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postman/postman-original.svg' },
  { name: 'Docker', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
  { name: 'Vercel', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vercel/vercel-original.svg', darkAdapt: true },
  { name: 'Cloudflare', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cloudflare/cloudflare-original.svg' },
  { name: 'QGIS', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/QGIS_logo_new.svg' },
  { name: '9Router', logo: 'https://cdn.jsdelivr.net/gh/selfhst/icons/svg/9router.svg' },
  { name: 'Hermes Agent', logo: '/images/nous-girl-dark.png', logoDark: '/images/nous-girl.png' },
]

/*
 * Pindah halaman dari dalam Dashboard. App hanya mendengar
 * popstate, jadi dispatch event itu setelah pushState supaya
 * tidak reload penuh seperti <a href> biasa.
 */
function goToPath(path: string) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function TechShowcase() {
  const marqueeRef = useRef<HTMLDivElement | null>(null)

  /* Loop marquee 84s berjalan tanpa henti. Jeda saat kartu keluar
     viewport atau tab disembunyikan supaya tidak ada compositing
     sia-sia (pola classList langsung, tanpa re-render). */
  useEffect(() => {
    const el = marqueeRef.current

    if (!el) {
      return
    }

    let onScreen = true

    const apply = () => {
      el.classList.toggle(
        'is-idle',
        !onScreen || document.hidden,
      )
    }

    const onVisibility = () => apply()
    document.addEventListener(
      'visibilitychange',
      onVisibility,
    )

    if (typeof IntersectionObserver === 'undefined') {
      return () => {
        document.removeEventListener(
          'visibilitychange',
          onVisibility,
        )
      }
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]

      if (!entry) {
        return
      }

      onScreen = entry.isIntersecting
      apply()
    })

    observer.observe(el)
    apply()

    return () => {
      observer.disconnect()
      document.removeEventListener(
        'visibilitychange',
        onVisibility,
      )
    }
  }, [])

  return (
    <section
      className="tech-marquee-card"
      aria-label="Tech Stack"
    >
      <div className="tech-marquee-head">
        <div className="tech-marquee-title">
          <CodeXml
            size={18}
            className="tech-marquee-icon"
          />

          <h2>Tech Stack</h2>
        </div>

        <button
          type="button"
          className="tech-marquee-all"
          onClick={() => goToPath('/tech-stack')}
        >
          <span>View all</span>

          <ChevronRight size={14} />
        </button>
      </div>

      <div className="tech-marquee" ref={marqueeRef}>
        <div className="tech-marquee-track">
          {[0, 1].map((copy) => (
            <div
              className="tech-marquee-group"
              key={copy}
              aria-hidden={copy === 1 ? true : undefined}
            >
              {SHOWCASE_TECH.map((item) => (
                <div
                  className="tech-chip"
                  key={item.name}
                >
                  <div className="tech-chip-logo">
                    <img
                      src={item.logo}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={34}
                      height={34}
                      className={
                        item.logoDark
                          ? 'tech-chip-logo-light'
                          : item.darkAdapt
                            ? 'logo-dark-adapt'
                            : undefined
                      }
                    />

                    {item.logoDark && (
                      <img
                        className="tech-chip-logo-dark"
                        src={item.logoDark}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width={34}
                        height={34}
                      />
                    )}
                  </div>

                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function EducationMini() {
  return (
    <article className="mini-card education-narrow">
      <div className="mini-head">
        <GraduationCap
          size={17}
          className="mini-icon"
        />

        <span>Education</span>
      </div>

      <div className="mini-body">
        <div className="mini-value">S1</div>

        <div className="mini-side">
          <p className="mini-caption">
            Informatics Engineering
          </p>

          <p className="mini-meta">
            <span>Langlangbuana University</span>
            {' · '}
            <span className="mini-nowrap">Graduated Jun 2025</span>
            {' · '}
            <span className="mini-nowrap">GPA: 3.46</span>
          </p>
        </div>
      </div>
    </article>
  )
}

function Dashboard() {
  const [resumeOpen, setResumeOpen] = useState(false)
  const [resumeLeaving, setResumeLeaving] = useState(false)
  const resumeCloseTimer = useRef<number | null>(null)

  // Terapkan aksen tersimpan sepagi mungkin supaya
  // warna tidak "flash" hitam saat halaman dimuat.

  const openResume = () => {
    if (resumeCloseTimer.current) {
      window.clearTimeout(resumeCloseTimer.current)
    }

    setResumeLeaving(false)
    setResumeOpen(true)
  }

  const closeResume = useCallback(() => {
    if (!resumeOpen || resumeLeaving) {
      return
    }

    setResumeLeaving(true)

    if (resumeCloseTimer.current) {
      window.clearTimeout(resumeCloseTimer.current)
    }

    resumeCloseTimer.current = window.setTimeout(() => {
      setResumeOpen(false)
      setResumeLeaving(false)
    }, MODAL_EXIT_MS)
  }, [resumeOpen, resumeLeaving])

  // Kunci scroll body + tutup dengan Escape selama modal resume
  // terbuka, sama seperti modal di halaman Awards & Certs.
  // A5: dependensi HANYA [resumeOpen] — sebelumnya closeResume ikut
  // jadi dep sehingga cleanup (buka kunci + scrollTo) jalan terlalu
  // dini saat animasi tutup dimulai (resumeLeaving=true).
  // Harden: dialog mengurung fokus (Tab) + autofocus tombol tutup
  // saat dibuka + fokus kembali ke tombol Resume saat ditutup.
  useEffect(() => {
    if (!resumeOpen) {
      return
    }

    const scrollY = window.scrollY
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeResume()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const panel = document.querySelector(
        '.resume-modal-panel',
      )

      if (!panel) {
        return
      }

      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        ),
      ).filter(
        (item) => item.tabIndex >= 0,
      )

      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    document
      .querySelector<HTMLButtonElement>(
        '.resume-modal-close',
      )
      ?.focus()

    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''

      window.scrollTo(0, scrollY)
      document.removeEventListener('keydown', handleKeyDown)

      if (trigger && document.contains(trigger)) {
        trigger.focus()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeOpen])

  useEffect(
    () => () => {
      if (resumeCloseTimer.current) {
        window.clearTimeout(resumeCloseTimer.current)
      }
    },
    [],
  )

  return (
    <section className="dashboard">
      <div className="dashboard-top">
        <div className="hero-card">
          <div className="hero-content">
            <div className="hero-main">
              <div className="hero-name">
                <h1>Deni Purwanto</h1>

                <span className="hero-location">
                  {homeBase.city}, {homeBase.country}
                </span>
              </div>

              <div className="hero-description">
                <p>
                  Full Stack Developer with 2+
                  years of experience building
                  geospatial information systems
                  and web applications for
                  government agencies and
                  educational institutions —
                  improving data management
                  efficiency by up to 40%.
                  Experienced in Next.js, Laravel,
                  Node.js, Leaflet.js, and QGIS,
                  with REST API integration and
                  interactive data visualizations.
                </p>
              </div>

              <div className="hero-actions">
                <a
                  className="button primary"
                  href="https://www.linkedin.com/in/deniiprwnt/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Linkedin size={17} />
                  LinkedIn
                </a>

                <a
                  className="button outline"
                  href="https://github.com/denipurwanto10"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github size={17} />
                  GitHub
                </a>

                <a
                  className="button outline"
                  href="mailto:denipurwanto800@gmail.com"
                >
                  <Mail size={17} />
                  Email
                </a>

                <button
                  type="button"
                  className="button outline"
                  onClick={openResume}
                >
                  <FileText size={17} />
                  Resume
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-side">
          <div>
            <TimeCard />
          </div>

          <div>
            <NowCard />
          </div>
        </div>
      </div>

      <div className="dashboard-showcase">
        <div className="dashboard-showcase-left">
          <EducationMini />

          <TechShowcase />
        </div>

        <div className="dashboard-showcase-right">
          <GithubContributions />
        </div>
      </div>

    {resumeOpen &&
  createPortal(
    <div
      className={
        resumeLeaving
          ? 'resume-modal is-leaving'
          : 'resume-modal'
      }
      onClick={closeResume}
      role="dialog"
      aria-modal="true"
      aria-label="Preview resume"
    >
      <div
        className={
          resumeLeaving
            ? 'resume-modal-panel is-leaving'
            : 'resume-modal-panel'
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div className="resume-modal-header">
          <div className="resume-modal-title">
            <span className="resume-modal-title-icon">
              <FileText size={18} />
            </span>

            <div>
              <h3>CV_Deni_Purwanto.pdf</h3>
              <p>Secure Document Viewer</p>
            </div>
          </div>

          <div className="resume-modal-actions">
            <a
              className="resume-modal-download"
              href="/resume/CV%20Deni%20Purwanto.pdf"
              download="CV_Deni_Purwanto.pdf"
            >
              <Download size={15} />
              <span>Download PDF</span>
            </a>

            <span className="resume-modal-divider" />

            <button
              type="button"
              className="resume-modal-close"
              onClick={closeResume}
              aria-label="Close preview"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="resume-modal-frame">
          <iframe
            src="/resume/CV%20Deni%20Purwanto.pdf#toolbar=1&navpanes=1&view=FitH"
            title="Deni Purwanto Resume"
          />
        </div>
      </div>
    </div>,
    document.body,
  )}
    </section>
  )
}

// Helper zona rumah (formatGmt, getHomeOffsetMinutes,
// getHomeGmtLabel) tinggal di src/data.ts — dipakai bersama
// Dashboard + Contact supaya satu sumber.

function TimeCard() {
  const [time, setTime] = useState(new Date())
  const [is24Hour, setIs24Hour] = useState(false)

  // Bahasa aktif: label "Same as your time" dirender langsung dalam
  // bahasa aktif — komponen ini me-render ulang tiap detik, jadi
  // tidak diandalkan ke DOM walker kamus.
  const [language, setLanguage] =
    useState<SiteLanguage>(() => getStoredLanguage())

  useEffect(() => {
    const onLanguageChange = (event: Event) => {
      setLanguage(
        (event as CustomEvent<SiteLanguage>).detail,
      )
    }

    window.addEventListener(
      LANGUAGE_EVENT,
      onLanguageChange,
    )

    return () => {
      window.removeEventListener(
        LANGUAGE_EVENT,
        onLanguageChange,
      )
    }
  }, [])

  // Perf: interval dijeda saat tab disembunyikan — sebelumnya
  // membangunkan main thread tiap detik walau tab tidak terlihat.
  useEffect(() => {
    if (document.hidden) {
      return
    }

    const timer = window.setInterval(() => {
      setTime(new Date())
    }, 1000)

    const onVisibility = () => {
      if (!document.hidden) {
        setTime(new Date())
      }
    }

    document.addEventListener(
      'visibilitychange',
      onVisibility,
    )

    return () => {
      window.clearInterval(timer)
      document.removeEventListener(
        'visibilitychange',
        onVisibility,
      )
    }
  }, [])

  // Basis rumah dari src/data.ts: ganti 1 baris tiap pindah kota,
  // MY TIME + label GMT ngikut otomatis (WIB/WITA/WIT/luar negeri).
  const homeTime = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !is24Hour,
    timeZone: homeBase.timeZone,
  })

  // Offset zona rumah pada tanggal yang sama — bukan offset lokal.
  const homeOffsetMinutes = getHomeOffsetMinutes(time)

  const homeLabel = formatGmt(homeOffsetMinutes)

  // BUG FIX: "YOUR TIME" sebelumnya ikut memakai zona Asia/Jakarta
  // sehingga selalu sama dengan "MY TIME". Sekarang memakai zona
  // lokal pengunjung (tanpa timeZone) + label GMT dinamis.
  const visitorTime = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !is24Hour,
  })

  const visitorOffsetMinutes = -time.getTimezoneOffset()
  const visitorLabel = formatGmt(visitorOffsetMinutes)

  // Lokasi pengunjung — sumber dipilih via visitorLocationSource
  // di src/data.ts:
  // - 'ip': negara dari IP (kota tidak ditampilkan — hanya negara).
  // - 'timezone': negara dari zona OS — ganti region lalu refresh
  //   langsung berubah, tanpa VPN.
  // Zona IANA juga fallback bila fetch IP gagal.
  const [visitorPlaceIp, setVisitorPlaceIp] =
    useState<VisitorPlace | null>(null)

  const visitorTimeZone = getVisitorTimeZone()
  const visitorCountry = getZoneCountry(
    visitorTimeZone,
    language,
  )

  useEffect(() => {
    if (visitorLocationSource !== 'ip') {
      return
    }

    let cancelled = false

    fetchVisitorPlace(language).then(
      (place) => {
        if (!cancelled && place) {
          setVisitorPlaceIp(place)
        }
      },
    )

    return () => {
      cancelled = true
    }
  }, [language, visitorTimeZone])

  const ipCountry = (visitorPlaceIp?.country || '').trim()

  const visitorPlace =
    visitorLocationSource === 'timezone'
      ? visitorCountry
      : ipCountry || visitorCountry

  // Layout: pengunjung yang zonanya sama dengan rumah melihat waktu
  // yang sama dua kali — blok kedua runtuh jadi catatan satu baris
  // tanpa sufiks lokasi.
  const isVisitorSameZone =
    visitorOffsetMinutes === homeOffsetMinutes

  return (
    <aside className="time-card">
      <div className="time-header">
        <div className="time-heading">
          <span className="time-status" />

          <strong>MY TIME</strong>
        </div>

        <button
          type="button"
          className="time-zone"
          onClick={() =>
            setIs24Hour((value) => !value)
          }
          aria-label={`Switch to ${
            is24Hour ? '12-hour' : '24-hour'
          } format`}
          title={`Switch to ${
            is24Hour ? '12-hour' : '24-hour'
          } format`}
        >
          {is24Hour ? '12H' : '24H'}
        </button>
      </div>

      <div className="time-main">
        {homeTime}
      </div>

      <div className="time-location">
        {homeLabel} · {homeBase.country}
      </div>

      {isVisitorSameZone ? (
        <>
          <div className="time-divider" />

          <div className="time-location" translate="no">
            {language === 'id'
              ? 'Sama seperti waktumu'
              : 'Same as your time'}
          </div>
        </>
      ) : (
        <>
          <div className="time-divider" />

          <div className="your-time-label">
            YOUR TIME
          </div>

          <div className="your-time">
            {visitorTime}
          </div>

          <div className="time-location">
            {visitorPlace
              ? `${visitorLabel} · ${visitorPlace}`
              : visitorLabel}
          </div>
        </>
      )}
    </aside>
  )
}

function NowCard() {
  const [today, setToday] = useState(new Date())

  useEffect(() => {
    const updateDate = () => {
      setToday(new Date())
    }

    updateDate()

    const timer = window.setInterval(
      updateDate,
      60 * 1000,
    )

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  const currentDate =
    today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: homeBase.timeZone,
    })

  return (
    <aside className="now-card">
      <div className="now-header">
        <div className="now-title">
          <strong>Now</strong>
        </div>

        <div className="now-date">
          <span>{currentDate}</span>

          <span className="now-dot" />
        </div>
      </div>

      <div className="now-content">
        Currently open to{' '}

        <a
          href="mailto:denipurwanto800@gmail.com?subject=Full-time%20role%20enquiry"
        >
          full-time roles
        </a>
      </div>
    </aside>
  )
}

const GITHUB_USERNAME = 'denipurwanto10'

const GITHUB_STATS_CACHE_KEY =
  'github-stats-cache-v3'

/*
 * Verified against github.com/denipurwanto10 on
 * Sep 23, 2026 ("170 contributions in the last
 * year"). Last-resort fallback only, so the card
 * never shows 0 by mistake when the network and
 * the local cache both fail.
 */

type GithubStats = {
  total: number | null
  longestStreak: number | null
  longestStreakStart: string | null
  longestStreakEnd: string | null
}

type CachedGithubStats = GithubStats & {
  contributions: GithubContribution[]
  asOf: string
}

/*
 * Longest streak = the longest run of consecutive
 * active days anywhere in the calendar — computed
 * from the same daily data as the GitHub graph.
 * Returns the length plus its date range so the
 * card can show real, verifiable data.
 */
function calculateLongestStreak(
  contributions: GithubContribution[],
): {
  length: number
  start: string | null
  end: string | null
} {
  const byDate = new Map(
    contributions.map((item) => [
      item.date,
      item.count,
    ]),
  )

  const dates = [...byDate.keys()].sort()

  let longest = 0
  let longestStart: string | null = null
  let longestEnd: string | null = null
  let current = 0
  let currentStart: string | null = null
  let previous: Date | null = null

  dates.forEach((date) => {
    if ((byDate.get(date) ?? 0) <= 0) {
      current = 0
      currentStart = null
      previous = null
      return
    }

    const day = parseGithubDate(date)

    if (
      previous &&
      currentStart &&
      day.getTime() - previous.getTime() ===
        24 * 60 * 60 * 1000
    ) {
      current++
    } else {
      current = 1
      currentStart = date
    }

    previous = day

    if (current > longest) {
      longest = current
      longestStart = currentStart
      longestEnd = date
    }
  })

  return {
    length: longest,
    start: longestStart,
    end: longestEnd,
  }
}

function loadCachedGithubStats():
  | CachedGithubStats
  | null {
  try {
    const raw = window.localStorage.getItem(
      GITHUB_STATS_CACHE_KEY,
    )

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<
      CachedGithubStats
    >

    if (!parsed) {
      return null
    }

    // A9: validasi ketat — count/level ikut dicek. Cache korup
    // (mis. count string) sebelumnya lolos lalu meracuni reduce
    // menjadi konkatenasi string.
    const contributions = Array.isArray(
      parsed.contributions,
    )
      ? parsed.contributions.filter(
          (item) =>
            item &&
            typeof item.date === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
            typeof item.count === 'number' &&
            Number.isFinite(item.count) &&
            typeof item.level === 'number' &&
            item.level >= 0 &&
            item.level <= 4,
        )
      : []

    return {
      total:
        typeof parsed.total === 'number'
          ? parsed.total
          : null,
      longestStreak:
        typeof parsed.longestStreak ===
        'number'
          ? parsed.longestStreak
          : null,
      longestStreakStart:
        typeof parsed.longestStreakStart ===
        'string'
          ? parsed.longestStreakStart
          : null,
      longestStreakEnd:
        typeof parsed.longestStreakEnd ===
        'string'
          ? parsed.longestStreakEnd
          : null,
      contributions,
      asOf:
        typeof parsed.asOf === 'string'
          ? parsed.asOf
          : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
  } catch {
    return null
  }
}

function saveCachedGithubStats(
  data: GithubStats & {
    contributions: GithubContribution[]
  },
) {
  try {
    const asOf = new Date().toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      },
    )

    window.localStorage.setItem(
      GITHUB_STATS_CACHE_KEY,
      JSON.stringify({ ...data, asOf }),
    )
  } catch {
    // Private mode etc. — cache is best-effort only.
  }
}

type ContributionPayload = {
  total: number | null
  contributions: GithubContribution[]
}

function normalizeContributionList(
  rawList: unknown[],
): GithubContribution[] {
  return rawList
    .filter(
      (item): item is Record<string, unknown> =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as { date?: unknown }).date === 'string',
    )
    .map((item) => {
      const rawLevel = Number(
        (item as { level?: unknown }).level ?? 0,
      )

      return {
        date: (item as { date: string }).date,
        count: Number(
          (item as { count?: unknown }).count,
        ) || 0,
        level: (
          rawLevel >= 0 && rawLevel <= 4 ? rawLevel : 0
        ) as GithubContribution['level'],
      }
    })
}

/*
 * SUMBER UTAMA: /api/github-contributions (Vercel Serverless
 * Function di folder /api). Fungsi itu membaca kalender resmi
 * github.com/denipurwanto10 langsung dari server, jadi angkanya
 * selalu sama dengan yang tampil di profil GitHub (tanpa CORS
 * dan tanpa mirror pihak ketiga yang datanya bisa tertinggal).
 *
 * Saat `npm run dev` (tanpa Vercel) route ini tidak ada dan
 * mengembalikan HTML, sehingga otomatis jatuh ke sumber cadangan.
 */
async function fetchOfficialContributions(
  signal?: AbortSignal,
): Promise<ContributionPayload> {
  const response = await fetch('/api/github-contributions', {
    cache: 'no-store',
    signal,
  })

  if (!response.ok) {
    throw new Error(
      `Official contributions API failed: ${response.status}`,
    )
  }

  const contentType =
    response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    throw new Error(
      'Official contributions API is not available here',
    )
  }

  const json = (await response.json()) as {
    total?: unknown
    contributions?: unknown
  }

  const contributions = normalizeContributionList(
    Array.isArray(json.contributions)
      ? json.contributions
      : [],
  )

  return {
    total:
      typeof json.total === 'number' ? json.total : null,
    contributions,
  }
}

/*
 * "170 contributions in the last year" from the
 * official GitHub calendar. GitHub pages cannot be
 * fetched directly from the browser (CORS), so the
 * primary source is a CORS-friendly mirror of that
 * official calendar, with the official HTML calendar
 * through a public CORS proxy as backup.
 */
async function fetchContributionYear(
  year: string,
  signal?: AbortSignal,
): Promise<{
  total: number | null
  contributions: GithubContribution[]
}> {
  const response = await fetch(
    `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=${year}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error(`GitHub contribution request failed for ${year}`)
  }

  const json = (await response.json()) as {
    total?: { lastYear?: unknown }
    contributions?: unknown
  }

  const contributions = normalizeContributionList(
    Array.isArray(json.contributions)
      ? json.contributions
      : [],
  )

  return {
    total:
      typeof json.total?.lastYear === 'number'
        ? json.total.lastYear
        : null,
    contributions,
  }
}

async function fetchGithubContributions(
  signal?: AbortSignal,
): Promise<{
  total: number | null
  contributions: GithubContribution[]
  streakContributions: GithubContribution[]
}> {
  // Request only the last-year dataset. The previous implementation made
  // one request for every year since 2008, which triggered HTTP 429 rate
  // limits and was unnecessary for the visible contribution calendar.
  //
  // Urutan sumber: (1) kalender resmi GitHub lewat /api, lalu
  // (2) mirror pihak ketiga sebagai cadangan. Mirror bisa tertinggal
  // beberapa jam (mis. total 172 padahal GitHub sudah 173), jadi
  // hanya dipakai kalau sumber resmi gagal.
  //
  // B12: signal diteruskan — unmount membatalkan request beneran,
  // bukan cuma mengabaikan hasilnya.
  let lastYear: ContributionPayload

  try {
    lastYear = await fetchOfficialContributions(signal)

    if (!lastYear.contributions.length) {
      throw new Error('Official calendar returned no data')
    }
  } catch (error) {
    // Dibatalkan → jangan fallback, langsung lempar.
    if (signal?.aborted) {
      throw error
    }

    // Bukan error: saat `npm run dev` (tanpa Vercel) route /api tidak
    // ada dan mengembalikan HTML, sehingga otomatis memakai mirror
    // cadangan. Di production (Vercel) sumber resmi dipakai.
    console.info(
      'Official GitHub calendar not available here, using mirror fallback.',
    )
    lastYear = await fetchContributionYear('last', signal)
  }

  if (!lastYear.contributions.length) {
    throw new Error('GitHub returned no contribution data')
  }

  const total =
    typeof lastYear.total === 'number'
      ? lastYear.total
      : lastYear.contributions.reduce(
          (sum, item) => sum + item.count,
          0,
        )

  return {
    total,
    contributions: lastYear.contributions,
    // Calculate streaks only from real data returned by GitHub.
    streakContributions: lastYear.contributions,
  }
}

/*
 * Kalender kontribusi dipisah sebagai komponen memo: ±370 sel ini
 * tidak perlu dirender ulang saat angka count-up berubah tiap frame.
 *
 * Tooltip DIPINDAH ke level kalender (satu bubble portal): tiap kotak
 * hanya mengirim data hover-nya, bubble dirender sekali di wrapper
 * dengan posisi dari getBoundingClientRect. Ini memperbaiki bug
 * tooltip kepotong — sebelumnya bubble dirender DI DALAM kotak
 * (overflow:hidden wrapper + scale hover + 370 state) sehingga
 * terpotong di tepi atas/kartu dan berat (±370 listener + animasi).
 * Sekarang responsif di semua ukuran: posisi dihitung dari viewport
 * (fixed), flip otomatis atas/bawah/kiri/kanan, ikut theme + accent.
 */
function ContributionDay({
  day,
  tabIndex,
  cellRef,
  onHover,
  onLeave,
}: {
  day: GithubContribution
  tabIndex: number
  cellRef: (node: HTMLDivElement | null) => void
  onHover: (day: GithubContribution, rect: DOMRect) => void
  onLeave: () => void
}) {
  const label = `${day.count} contribution${day.count === 1 ? '' : 's'} on ${formatGithubDate(day.date)}`

  return (
    <div
      ref={cellRef}
      className={`github-day level-${day.level}`}
      tabIndex={tabIndex}
      role="gridcell"
      aria-label={label}
      onMouseEnter={(event) =>
        onHover(
          day,
          event.currentTarget.getBoundingClientRect(),
        )
      }
      onMouseMove={(event) =>
        onHover(
          day,
          event.currentTarget.getBoundingClientRect(),
        )
      }
      onMouseLeave={onLeave}
      onFocus={(event) =>
        onHover(
          day,
          event.currentTarget.getBoundingClientRect(),
        )
      }
      onBlur={onLeave}
      onTouchStart={(event) =>
        onHover(
          day,
          event.currentTarget.getBoundingClientRect(),
        )
      }
      onTouchEnd={onLeave}
    />
  )
}

const ContributionCalendar = memo(function ContributionCalendar({
  weeks,
  monthLabels,
}: {
  weeks: ContributionWeek[]
  monthLabels: MonthLabel[]
}) {
  // Satu tooltip untuk seluruh kalender — diposisikan fixed dari
  // rect kotak yang di-hover, jadi tidak pernah kepotong wrapper.
  const [tip, setTip] = useState<{
    day: GithubContribution
    rect: DOMRect
  } | null>(null)

  const handleHover = useCallback(
    (day: GithubContribution, rect: DOMRect) => {
      setTip({ day, rect })
    },
    [],
  )

  const handleLeave = useCallback(() => {
    setTip(null)
  }, [])

    /*
   * Akses keyboard: seluruh grid ini SATU tab stop, bukan 371.
   * Setiap sel punya aria-label yang lengkap, jadi informasinya
   * tetap terjangkau keyboard - hanya jumlah stop-nya yang
   * berkurang dari 371 menjadi 1. Pola roving tabindex: satu
   * sel yang bisa difokuskan (tabIndex 0), sisanya -1, dan
   * satu handler keydown menggeser fokus dengan tombol panah.
   *
   * Kolom = indeks minggu (+/-1), baris = hari dalam minggu
   * (+/-7). Home/End lompat ke tepi baris, PageUp/PageDown
   * ke minggu pertama/terakhir.
   */
  /*
   * Peta tanggal -> indeks rata, supaya tiap sel tahu posisinya
   * di grid tanpa harus menghitung ulang saat render.
   */
  const cellIndexByDate = useMemo(() => {
    const map = new Map<string, number>()

    let index = 0

    for (const week of weeks) {
      for (const day of week) {
        map.set(day.date, index)
        index += 1
      }
    }

    return map
  }, [weeks])

  const cellNodes = useRef<Array<HTMLDivElement | null>>([])

  const [focusIndex, setFocusIndex] = useState(0)

  const totalCells = useMemo(
    () => weeks.reduce((n, week) => n + week.length, 0),
    [weeks],
  )

  // Jaga indeks tetap sah saat data berubah (cache lalu refresh).
  const activeIndex =
    totalCells === 0
      ? 0
      : Math.min(focusIndex, totalCells - 1)

  const focusCell = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalCells) {
        return
      }

      setFocusIndex(index)
      cellNodes.current[index]?.focus()
    },
    [totalCells],
  )

  const handleGridKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const weekCount = weeks.length

      if (weekCount === 0) {
        return
      }

      // Petakan indeks rata -> (minggu, hari dalam minggu) dengan
      // melewati panjang tiap minggu. Tidak bisa memakai
      // findIndex terhadap tanggal: tanggal sel berada di tengah
      // minggu, bukan selalu hari pertama.
      let weekIndex = 0
      let dayIndex = 0
      let seen = 0

      for (let w = 0; w < weeks.length; w += 1) {
        const length = weeks[w].length

        if (activeIndex < seen + length) {
          weekIndex = w
          dayIndex = activeIndex - seen
          break
        }

        seen += length
      }

      // Kolom visual = minggu, baris visual = hari dalam minggu.
      // Kartesius contribution graph memakai ini: panah kiri/kanan
      // pindah minggu, panah atas/bawah pindah hari.
      const moveToDay = (nextDay: number) => {
        const week = weeks[weekIndex]
        const clamped = Math.max(
          0,
          Math.min(week.length - 1, nextDay),
        )

        const before = weeks
          .slice(0, weekIndex)
          .reduce((n, w) => n + w.length, 0)

        focusCell(before + clamped)
      }

      const moveToWeek = (nextWeek: number) => {
        const clamped = Math.max(
          0,
          Math.min(weekCount - 1, nextWeek),
        )

        const targetWeek = weeks[clamped]
        const targetDay = Math.min(
          dayIndex,
          targetWeek.length - 1,
        )

        const before = weeks
          .slice(0, clamped)
          .reduce((n, week) => n + week.length, 0)

        focusCell(before + Math.max(0, targetDay))
      }

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault()
          moveToWeek(weekIndex + 1)
          break

        case 'ArrowLeft':
          event.preventDefault()
          moveToWeek(weekIndex - 1)
          break

        case 'ArrowDown':
          event.preventDefault()
          moveToDay(dayIndex + 1)
          break

        case 'ArrowUp':
          event.preventDefault()
          moveToDay(dayIndex - 1)
          break

        case 'Home': {
          event.preventDefault()
          moveToDay(0)
          break
        }

        case 'End': {
          event.preventDefault()
          moveToDay(weeks[weekIndex].length - 1)
          break
        }

        case 'PageDown':
          event.preventDefault()
          moveToWeek(weeks.length - 1)
          break

        case 'PageUp':
          event.preventDefault()
          moveToWeek(0)
          break

        default:
          break
      }
    },
    [activeIndex, focusCell, totalCells, weeks],
  )

  // Posisi bubble: di atas kotak; flip ke bawah bila mentok atas,
  // geser horizontal agar selalu di dalam viewport.
  const tipPlacement = useMemo(() => {
    if (!tip || typeof window === 'undefined') {
      return undefined
    }

    const { rect } = tip
    const cx = rect.left + rect.width / 2
    const halfWidth = 88
    const gap = 10
    const height = 52

    const fitsAbove = rect.top >= height + gap + 8

    const top = fitsAbove
      ? rect.top - gap - height
      : rect.bottom + gap

    const left = Math.min(
      Math.max(cx, halfWidth + 8),
      window.innerWidth - halfWidth - 8,
    )

    return { top, left, isBelow: !fitsAbove }
  }, [tip])

  return (
    <div className="github-calendar-wrapper">
      <div
        className="github-calendar-grid"
        role="grid"
        tabIndex={0}
        aria-label="Contribution activity"
        onKeyDown={handleGridKeyDown}
      >
      <div className="github-months">
        {monthLabels.map(
          (month, index) => (
            <span
              key={`${month.label}-${index}`}
              style={{
                gridColumnStart:
                  month.column,
              }}
            >
              {month.label}
            </span>
          ),
        )}
      </div>

      <div className="github-calendar">
        {weeks.map(
          (week, weekIndex) => (
            <div
              className="github-week"
              role="row"
              key={weekIndex}
              style={{ ['--week-index' as string]: weekIndex }}
            >
              {week.map((day) => {
                const cellIndex = cellIndexByDate.get(
                  day.date,
                )

                return (
                  <ContributionDay
                    key={day.date}
                    day={day}
                    tabIndex={
                      cellIndex === activeIndex ? 0 : -1
                    }
                    cellRef={(node) => {
                      if (cellIndex !== undefined) {
                        cellNodes.current[
                          cellIndex
                        ] = node
                      }
                    }}
                    onHover={handleHover}
                    onLeave={handleLeave}
                  />
                )
              })}
            </div>
          ),
        )}
      </div>
      </div>

      {tip &&
        createPortal(
          <div
            className={
              tipPlacement?.isBelow
                ? 'github-tip is-below'
                : 'github-tip'
            }
            role="tooltip"
            style={{
              top: tipPlacement?.top,
              left: tipPlacement?.left,
            }}
          >
            <strong>
              {tip.day.count} contribution
              {tip.day.count === 1 ? '' : 's'}
            </strong>
            <span className="github-tip-sep" aria-hidden="true">
              |
            </span>
            <span>{formatGithubDate(tip.day.date)}</span>
          </div>,
          document.body,
        )}
    </div>
  )
})

/*
 * Angka count-up terisolasi: komponen memo kecil ini yang me-render
 * ulang tiap frame rAF, BUKAN seluruh GithubContributions.
 * Sebelumnya 2× useCountUp di parent me-re-render seluruh kartu
 * (±60×/detik): header, stats, toLocaleString tiap frame.
 * Tampilan & angka akhir identik.
 */
const AnimatedTotalHeading = memo(function AnimatedTotalHeading({
  total,
  start,
  loading,
  error,
}: {
  total: number
  start: boolean
  loading: boolean
  error: boolean
}) {
  const value = useCountUp(total, 1400, start)

  /*
   * Kegagalan fetch BUKAN nol. Menampilkan "0" di sini
   * mengklaim tidak ada aktivitas sama sekali, padahal
   * angkanya memang tidak diketahui - dan PRODUCT.md
   * meletakkan "no invented numbers" sebagai constraint
   * pertama. Tiga state: memuat (label), gagal (label
   * yang sama karena tidak ada angka untuk disebut),
   * sukses (angka).
   */
  if (loading || error) {
    return <>GitHub contributions</>
  }

  return <>{`${value.toLocaleString('en-US')} contributions`}</>
})

const AnimatedTotalStat = memo(function AnimatedTotalStat({
  total,
  start,
  loading,
  error,
}: {
  total: number
  start: boolean
  loading: boolean
  error: boolean
}) {
  const value = useCountUp(total, 1400, start)

  if (loading || error) {
    return <>—</>
  }

  return <>{value.toLocaleString('en-US')}</>
})

const AnimatedStreakStat = memo(function AnimatedStreakStat({
  length,
  start,
  loading,
  error,
}: {
  length: number
  start: boolean
  loading: boolean
  error: boolean
}) {
  const value = useCountUp(length, 1100, start)

  if (loading || error) {
    return <>—</>
  }

  return <>{value}</>
})

function GithubContributions() {
  const [contributions, setContributions] =
    useState<GithubContribution[]>([])

  const [total, setTotal] = useState<
    number | null
  >(null)

  const [longestStreak, setLongestStreak] =
    useState<{
      length: number
      start: string | null
      end: string | null
    } | null>(null)

  const [cacheLabel, setCacheLabel] =
    useState<string | null>(null)

  const [calendarStale, setCalendarStale] =
    useState(false)

  const [isStale, setIsStale] = useState(false)

  const [loading, setLoading] = useState(true)
  // Refresh data fresh di latar setelah cache tampil — bila berjalan
  // lama (>600ms), tampilkan overlay skeleton tipis di atas data cache
  // supaya jelas sedang memuat, bukan macet.
  const [refreshing, setRefreshing] = useState(false)
  const [calendarError, setCalendarError] =
    useState(false)
  const [statsError, setStatsError] =
    useState(false)

  // Perf/LCP: fetch jaringan DITUNDA sampai kartu masuk viewport
  // (atau 2,5 dtk setelah mount bila observer tak tersedia) — supaya
  // request API + mirror tidak berebut bandwidth dengan gambar LCP
  // & CSS saat first paint di jaringan HP. Cache lokal tetap
  // dibaca sinkron saat mount agar kartu tidak kosong.
  const [fetchArmed, setFetchArmed] =
    useState(false)

  const { ref: fetchGateRef } = useInView<HTMLElement>(0)

  useEffect(() => {
    const el = fetchGateRef.current

    if (!el) {
      return
    }

    if (
      typeof IntersectionObserver ===
      'undefined'
    ) {
      setFetchArmed(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some(
            (entry) => entry.isIntersecting,
          )
        ) {
          setFetchArmed(true)
          observer.disconnect()
        }
      },
    )

    observer.observe(el)

    const fallback = window.setTimeout(() => {
      setFetchArmed(true)
    }, 2500)

    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [fetchGateRef])

  useEffect(() => {
    // Cache lokal: baca sinkron saat mount — tanpa jaringan.
    const cached =
      loadCachedGithubStats()

    if (!cached) {
      return
    }

    setContributions(cached.contributions)
    setTotal(cached.total)
    setLongestStreak(
      cached.longestStreak !== null
        ? {
            length: cached.longestStreak,
            start:
              cached.longestStreakStart,
            end: cached.longestStreakEnd,
          }
        : null,
    )
    setCacheLabel(cached.asOf)
    setCalendarStale(true)
    setLoading(false)
  }, [])

  // Gate jaringan: hanya refresh saat kartu terlihat.
  const cachedForGate = useMemo(
    loadCachedGithubStats,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchArmed],
  )

  useEffect(() => {
    if (!fetchArmed) {
      return
    }

    let cancelled = false
    // B12: batalkan request jaringan + timeout 15 detik agar loading
    // tidak menggantung selamanya saat fetch macet.
    const controller = new AbortController()
    const timeout = window.setTimeout(
      () => controller.abort(),
      15000,
    )

    const cached = cachedForGate

    const fetchContributions = async () => {
      if (!cached) {
        setLoading(true)
      }

      setIsStale(false)
      setStatsError(false)
      setCalendarError(false)

      // Tandai refresh berjalan; timer 600ms supaya refresh cepat
      // (<600ms) tidak mem-flash overlay sama sekali.
      const refreshTimer = cached
        ? window.setTimeout(() => {
            if (!cancelled) {
              setRefreshing(true)
            }
          }, 600)
        : undefined

      try {
        const fresh =
          await fetchGithubContributions(
            controller.signal,
          )

        if (cancelled) return

        const calculatedStreak =
          calculateLongestStreak(
            fresh.streakContributions,
          )

        // Use only the locally calculated streak from real GitHub data.
        const freshStreak = calculatedStreak

        setContributions(
          fresh.contributions,
        )
        setTotal(fresh.total)
        setLongestStreak(freshStreak)
        setCalendarStale(false)
        setCalendarError(false)
        setStatsError(false)
        setIsStale(false)
        setCacheLabel(null)

        saveCachedGithubStats({
          total: fresh.total,
          longestStreak:
            freshStreak.length,
          longestStreakStart:
            freshStreak.start,
          longestStreakEnd: freshStreak.end,
          contributions:
            fresh.contributions,
        })
      } catch (err) {
        if (cancelled) return

        // Abort murni (unmount/timeout tanpa cache) → anggap gagal
        // memuat, bukan error misterius.
        if (
          controller.signal.aborted &&
          !cached
        ) {
          setCalendarError(true)
          setStatsError(true)
          return
        }

        console.error(
          'GitHub contributions error:',
          err,
        )

        if (cached) {
          // Cached official data: keep showing it,
          // flagged as stale instead of failing.
          setIsStale(true)
          setStatsError(false)
          setCalendarError(false)
        } else {
          setCalendarError(true)
          setStatsError(true)
        }
      } finally {
        if (refreshTimer !== undefined) {
          window.clearTimeout(refreshTimer)
        }

        if (!cancelled) {
          setRefreshing(false)
          setLoading(false)
        }
      }
    }

    fetchContributions()

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [fetchArmed, cachedForGate])

  /*
   * "Total" is the official last-year number from
   * the GitHub profile.
   *
   * "Longest streak" sengaja memakai REKOR SEPANJANG MASA dari
   * src/data/streakRecord.json, bukan hasil hitungan kalender
   * 365 hari. Alasannya: kalender publik GitHub (dan mirror-nya)
   * hanya menampilkan 365 hari terakhir, sehingga streak yang
   * sudah/lewat melewati 1 tahun akan HILANG dan angkanya
   * diam-diam turun — padahal rekor aslinya masih berlaku.
   * File JSON itu ditulis dari riwayat penuh via GraphQL.
   */
  /*
   * Angka "0" pada state gagal bukan nol — itu klaim data
   * yang salah, sedangkan yang sebenarnya adalah "tidak
   * diketahui". Flag ini dipakai ketiga komponen stat agar
   * merender tanda hubung, bukan angka.
   */
  const statsUnavailable = statsError && total === null

  const displayTotal = total ?? 0

  const displayStreak = streakRecord.allTimeLongestStreak

  const streakRange =
    displayStreak.start && displayStreak.end
      ? `${formatGithubDate(displayStreak.start)} – ${formatGithubDate(displayStreak.end)}`
      : null


  const asOfLabel = cacheLabel
  const showAsOf = isStale && Boolean(asOfLabel)

  /*
   * The graph renders from live data, cache, or the
   * bundled snapshot — in that order — so it is
   * never empty just because one source failed.
   */
  const graphContributions = contributions
  const usingFallbackGraph = contributions.length === 0

  const calendarFailed =
    calendarError && usingFallbackGraph

  const graphAsOf = cacheLabel ?? null

  // Dihitung sekali per data — count-up me-render ulang komponen ini
  // setiap frame, jadi hasil ini tidak boleh dihitung ulang tiap render.
  const weeks = useMemo(
    () => buildContributionWeeks(graphContributions),
    [graphContributions],
  )

  const monthLabels = useMemo(
    () => buildMonthLabels(weeks),
    [weeks],
  )

  const { ref: cardRef, inView: cardInView } =
    useInView<HTMLElement>(0.25)

  // B13: angka tidak restart dari 0 saat data fresh tiba — mulai
  // dari nilai cache yang sedang tampil supaya tidak melompat mundur.
  const countStart = cardInView && !loading

  return (
    <section
      className="github-card"
      ref={(node) => {
        // Dua ref pada satu section: gate fetch + inView count-up.
        ;(
          cardRef as React.MutableRefObject<HTMLElement | null>
        ).current = node
        ;(
          fetchGateRef as React.MutableRefObject<HTMLElement | null>
        ).current = node
      }}
    >
      {/* HEADER */}

      <div className="github-card-header">
        <div className="github-profile-info">
          <Github
            size={29}
            strokeWidth={1.8}
            className="github-card-icon"
          />

          <div className="github-heading">
            <h2>
              <AnimatedTotalHeading
                total={displayTotal}
                start={countStart}
                loading={loading}
                error={statsUnavailable}
              />
            </h2>

            <a
              href="https://github.com/denipurwanto10"
              target="_blank"
              rel="noreferrer"
              className="github-username"
            >
              @denipurwanto10

              <ExternalLink size={13} />
            </a>

            {showAsOf && asOfLabel && (
              <span className="github-asof">
                {isStale ? 'Updated' : 'As of'}{' '}
                {asOfLabel}
              </span>
            )}
          </div>
        </div>

        <div className="github-stats">
          <div className="github-stat">
            <strong>
              <AnimatedTotalStat
                total={displayTotal}
                start={countStart}
                loading={loading}
                error={statsUnavailable}
              />
            </strong>

            <span>Total</span>
          </div>

          <div
            className="github-stat"
            title={
              streakRange
                ? `Longest streak: ${streakRange}`
                : 'Longest streak'
            }
          >
            <strong>
              <AnimatedStreakStat
                length={displayStreak.length}
                start={countStart}
                loading={loading}
                error={statsUnavailable}
              />
            </strong>

            <span>Streak</span>
          </div>
        </div>
      </div>

      {/* CONTENT */}

      {loading ? (
        <div
          className="github-loading"
          aria-live="polite"
        >
          <div className="github-skeleton-stats">
            <span className="skeleton" />
            <span className="skeleton" />
          </div>

          <div className="github-skeleton-grid">
            {Array.from({ length: 78 }).map(
              (_, index) => (
                <span
                  key={index}
                  className="skeleton"
                  style={{
                    ['--reveal-index' as string]:
                      index % 26,
                  }}
                />
              ),
            )}
          </div>

          <span className="github-loading-text">
            Loading GitHub contributions...
          </span>
        </div>
      ) : statsError &&
        contributions.length === 0 ? (
        <div className="github-error">
          <span>
            Unable to load GitHub contributions.
          </span>

          <a
            href="https://github.com/denipurwanto10"
            target="_blank"
            rel="noreferrer"
          >
            View GitHub profile
          </a>
        </div>
      ) : (
        <div className="github-content">
          <ContributionCalendar
            weeks={weeks}
            monthLabels={monthLabels}
          />

          {refreshing && (
            <div
              className="github-refresh-overlay"
              aria-live="polite"
              aria-label="Refreshing GitHub contributions"
            >
              <div className="github-skeleton-grid overlay">
                {Array.from({ length: 52 }).map(
                  (_, index) => (
                    <span
                      key={index}
                      className="skeleton"
                    />
                  ),
                )}
              </div>

              <span className="github-loading-text">
                Refreshing contributions...
              </span>
            </div>
          )}

          <div className="github-card-footer">
            <a
              href={
                statsUnavailable
                  ? `https://github.com/${GITHUB_USERNAME}`
                  : 'https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference'
              }
              target="_blank"
              rel="noreferrer"
            >
              {statsUnavailable
                ? 'Could not reach GitHub'
                : calendarStale || calendarFailed
                  ? 'Showing cached contributions'
                  : 'Learn how we count contributions'}
              {calendarStale && graphAsOf
                ? ` · updated ${graphAsOf}`
                : ''}
            </a>

            <div className="github-legend">
              <span>Less</span>

              <span className="legend-box level-0" />
              <span className="legend-box level-1" />
              <span className="legend-box level-2" />
              <span className="legend-box level-3" />
              <span className="legend-box level-4" />

              <span>More</span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Dashboard
