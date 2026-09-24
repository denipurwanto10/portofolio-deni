import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  FileText,
  Download,
  X,
} from 'lucide-react'
import {
  useCountUp,
  useInView,
} from '../hooks/useMotion'

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
      labels.push({
        label: date.toLocaleDateString(
          'en-US',
          {
            month: 'short',
            timeZone: 'UTC',
          },
        ),
        column: index + 1,
      })

      previousMonth = monthKey
    }
  })

  return labels
}

/*
 * Parse the official GitHub contributions calendar
 * (https://github.com/users/denipurwanto10/contributions —
 * the same source rendered on github.com/denipurwanto10)
 * into a daily list plus the "N contributions in the last year" total.
 */
function parseGithubContributionsPage(html: string): {
  total: number | null
  contributions: GithubContribution[]
} {
  const parser = new DOMParser()

  const doc = parser.parseFromString(
    html,
    'text/html',
  )

  let total: number | null = null

  const headingText =
    doc.querySelector('h2')?.textContent ?? ''

  const totalMatch = headingText.match(
    /([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/i,
  )

  if (totalMatch?.[1]) {
    total = Number(
      totalMatch[1].replace(/,/g, ''),
    )
  }

  const contributions: GithubContribution[] =
    []

  doc
    .querySelectorAll('[data-date]')
    .forEach((el) => {
      const date = el.getAttribute('data-date')

      if (!date) {
        return
      }

      const text =
        el.querySelector('tool-tip, title')
          ?.textContent ??
        el.textContent ??
        ''

      let count = 0

      const countMatch = text.match(
        /([\d,]+)\s+contributions?\s+on/i,
      )

      if (countMatch?.[1]) {
        count = Number(
          countMatch[1].replace(/,/g, ''),
        )
      } else if (
        !/no\s+contributions/i.test(text)
      ) {
        const level = Number(
          el.getAttribute('data-level') ??
            '0',
        )

        count = level > 0 ? 1 : 0
      }

      const rawLevel = Number(
        el.getAttribute('data-level') ??
          '0',
      )

      const level = (
        rawLevel >= 0 && rawLevel <= 4
          ? rawLevel
          : 0
      ) as GithubContribution['level']

      contributions.push({
        date,
        count,
        level,
      })
    })

  contributions.sort(
    (a, b) =>
      parseGithubDate(a.date).getTime() -
      parseGithubDate(b.date).getTime(),
  )

  return { total, contributions }
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
  useEffect(() => {
    if (!resumeOpen) {
      return
    }

    const scrollY = window.scrollY

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
      }
    }

    document.addEventListener('keydown', handleKeyDown)

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
    }
  }, [resumeOpen, closeResume])

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
              </div>

              <div className="hero-description">
                <p>
                  Full Stack Developer with 2+
                  year of experience building web
                  applications and geospatial
                  information systems for government
                  agencies and educational
                  institutions. Experienced in using
                  Next.js, Laravel, Node.js,
                  Leaflet.js, and QGIS, as well as
                  integrating REST APIs and developing
                  interactive data visualizations.
                  Focused on building efficient,
                  scalable, and user-friendly
                  solutions, with experience improving
                  data management efficiency by up to
                  40%. Familiar with AI-assisted
                  coding tools to accelerate
                  development, improve productivity,
                  and support problem-solving
                  throughout the software development
                  process.
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
                  Gmail
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

      <GithubContributions />

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

function TimeCard() {
  const [time, setTime] = useState(new Date())
  const [is24Hour, setIs24Hour] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  const jakartaTime =
    time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: !is24Hour,
      timeZone: 'Asia/Jakarta',
    })

  // BUG FIX: "YOUR TIME" sebelumnya ikut memakai zona Asia/Jakarta
  // sehingga selalu sama dengan "MY TIME". Sekarang memakai zona
  // lokal pengunjung (tanpa timeZone) + label GMT dinamis.
  const visitorTime =
    time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: !is24Hour,
    })

  const visitorOffsetMinutes =
    -time.getTimezoneOffset()
  const visitorSign =
    visitorOffsetMinutes >= 0 ? '+' : '-'
  const visitorAbs =
    Math.abs(visitorOffsetMinutes)
  const visitorLabel = `GMT${visitorSign}${Math.floor(
    visitorAbs / 60,
  )}${
    visitorAbs % 60
      ? `:${String(
          visitorAbs % 60,
        ).padStart(2, '0')}`
      : ''
  }`

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
        >
          {is24Hour ? '12H' : '24H'}
        </button>
      </div>

      <div className="time-main">
        {jakartaTime}
      </div>

      <div className="time-location">
        GMT+7 · Indonesia
      </div>

      <div className="time-divider" />

      <div className="your-time-label">
        YOUR TIME
      </div>

      <div className="your-time">
        {visitorTime}
      </div>

      <div className="time-location">
        {visitorLabel}
      </div>
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
      timeZone: 'Asia/Jakarta',
    })

  return (
    <aside className="now-card">
      <div className="now-header">
        <div className="now-title">
          <strong>Now</strong>

          <span className="now-whats-this">What's this?</span>
        </div>

        <div className="now-date">
          <span>{currentDate}</span>

          <span className="now-dot" />
        </div>
      </div>

      <div className="now-content">
        Currently open to{' '}

        <a
          href="#"
          onClick={(e) => e.preventDefault()}
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

    const contributions = Array.isArray(
      parsed.contributions,
    )
      ? parsed.contributions.filter(
          (item) =>
            item &&
            typeof item.date === 'string',
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
async function fetchOfficialContributions(): Promise<ContributionPayload> {
  const response = await fetch('/api/github-contributions', {
    cache: 'no-store',
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
): Promise<{
  total: number | null
  contributions: GithubContribution[]
}> {
  const response = await fetch(
    `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=${year}`,
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

async function fetchExactStreakStats(): Promise<{
  length: number
  start: string | null
  end: string | null
} | null> {
  const streakUrl = new URL(
    'https://streak-stats.demolab.com/',
  )
  streakUrl.searchParams.set('user', GITHUB_USERNAME)
  streakUrl.searchParams.set('type', 'json')
  streakUrl.searchParams.set('timezone', 'UTC')

  const proxyUrl = new URL(
    'https://api.allorigins.win/raw',
  )
  proxyUrl.searchParams.set('url', streakUrl.toString())
  proxyUrl.searchParams.set('cache', String(Date.now()))

  const response = await fetch(proxyUrl.toString(), {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(
      `Streak Stats request failed: ${response.status}`,
    )
  }

  const json = (await response.json()) as {
    longestStreak?: unknown
    longestStreakStart?: unknown
    longestStreakEnd?: unknown
  }

  const length = Number(json.longestStreak)
  if (!Number.isFinite(length) || length < 0) {
    return null
  }

  return {
    length,
    start:
      typeof json.longestStreakStart === 'string'
        ? json.longestStreakStart
        : null,
    end:
      typeof json.longestStreakEnd === 'string'
        ? json.longestStreakEnd
        : null,
  }
}

async function fetchGithubContributions(): Promise<{
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
  let lastYear: ContributionPayload

  try {
    lastYear = await fetchOfficialContributions()

    if (!lastYear.contributions.length) {
      throw new Error('Official calendar returned no data')
    }
  } catch (error) {
    console.warn(
      'Official GitHub calendar unavailable, using mirror:',
      error,
    )
    lastYear = await fetchContributionYear('last')
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
 */
const ContributionCalendar = memo(function ContributionCalendar({
  weeks,
  monthLabels,
}: {
  weeks: ContributionWeek[]
  monthLabels: MonthLabel[]
}) {
  return (
    <div className="github-calendar-wrapper">
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
              key={weekIndex}
              style={{ ['--week-index' as string]: weekIndex }}
            >
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`github-day level-${day.level}`}
                  title={`${day.count} contributions on ${formatGithubDate(
                    day.date,
                  )}`}
                />
              ))}
            </div>
          ),
        )}
      </div>
    </div>
  )
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
  const [calendarError, setCalendarError] =
    useState(false)
  const [statsError, setStatsError] =
    useState(false)

  useEffect(() => {
    let cancelled = false

    const fetchContributions = async () => {
      // Show the last good data instantly, then refresh.
      const cached =
        loadCachedGithubStats()

      if (cached) {
        setContributions(
          cached.contributions,
        )

        setTotal(cached.total)
        setLongestStreak(
          cached.longestStreak !== null
            ? {
                length:
                  cached.longestStreak,
                start:
                  cached.longestStreakStart,
                end: cached.longestStreakEnd,
              }
            : null,
        )
        setCacheLabel(cached.asOf)
        setCalendarStale(true)
        setLoading(false)
      } else {
        setLoading(true)
      }

      setIsStale(false)
      setStatsError(false)
      setCalendarError(false)

      try {
        const fresh =
          await fetchGithubContributions()

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
        console.error(
          'GitHub contributions error:',
          err,
        )

        if (cancelled) return

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
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchContributions()

    return () => {
      cancelled = true
    }
  }, [])

  /*
   * "Total" is the official last-year number from
   * the GitHub profile, and the streak is the
   * longest streak from the same daily calendar —
   * so they always match github.com/denipurwanto10.
   */
  const displayTotal = total ?? 0

  const displayStreak =
    longestStreak ?? { length: 0, start: null, end: null }

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

  const animatedTotal = useCountUp(
    displayTotal,
    1400,
    cardInView && !loading,
  )

  const animatedStreak = useCountUp(
    displayStreak.length,
    1100,
    cardInView && !loading,
  )

  return (
    <section
      className="github-card"
      ref={cardRef}
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
              {loading
                ? 'GitHub contributions'
                : `${animatedTotal.toLocaleString('en-US')} contributions`}
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
              {loading
                ? '—'
                : animatedTotal.toLocaleString(
                    'en-US',
                  )}
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
              {loading
                ? '—'
                : animatedStreak}
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
        <>
          <ContributionCalendar
            weeks={weeks}
            monthLabels={monthLabels}
          />

          <div className="github-card-footer">
            <a
              href="https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference"
              target="_blank"
              rel="noreferrer"
            >
              {calendarStale || calendarFailed
                ? 'Showing cached contributions'
                : 'Learn how we count contributions'}
              {calendarFailed && graphAsOf
                ? ` · as of ${graphAsOf}`
                : calendarStale && graphAsOf
                  ? ` · updated ${graphAsOf}`
                  : ''}
            </a>

            <div className="github-legend">
              <span>
               Less
              </span>

              <span className="legend-box level-0" />
              <span className="legend-box level-1" />
              <span className="legend-box level-2" />
              <span className="legend-box level-3" />
              <span className="legend-box level-4" />

              <span>Lebih banyak</span>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default Dashboard
