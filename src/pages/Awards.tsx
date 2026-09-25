import {
  Award,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Trophy,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import SectionTitle from '../components/SectionTitle'

// Harus sama dengan durasi animasi keluar modal di styles.css
// (--modal-exit), supaya modal tidak terpotong saat ditutup.
const MODAL_EXIT_MS = 200

type AwardItem = {
  image: string
  title: string
  subtitle: string
  alt: string
  label: string
}

const awardItems: AwardItem[] = [
  {
    image: '/awards/maganghub.webp',
    title: 'University Graduate Internship Program',
    subtitle: 'Center for Groundwater and Environmental Geology • June 2026',
    alt: 'University Graduate Internship Program',
    label: 'View University Graduate Internship Program image',
  },
  {
    image: '/awards/pbi.webp',
    title: 'Certificate of Competency',
    subtitle: 'Project Based Internship • December 2025',
    alt: 'Certificate of Competency – Project Based Internship',
    label: 'View Project Based Internship Certificate image',
  },
  {
    image: '/awards/piagam.webp',
    title: 'Best Performing Student in Academic Achievement',
    subtitle: 'UNLA Anniversary • May 2024',
    alt: 'Best Performing Student in Academic Achievement',
    label: 'View Best Performing Student in Academic Achievement image',
  },
  {
    image: '/awards/hartik2.webp',
    title: '2nd Place Award – UI/UX Design Competition',
    subtitle: 'Hartik Competition 2023 • October 2023',
    alt: 'Hartik Competition 2023',
    label: 'View Hartik Competition 2023 image',
  },
  {
    image: '/awards/aslab1.webp',
    title: 'Laboratory Assistant and Teaching Instructor',
    subtitle: 'Informatics Engineering Study Program • July 2024',
    alt: 'Laboratory Assistant and Teaching Instructor',
    label: 'View July 2024 Laboratory Assistant and Teaching Instructor image',
  },
  {
    image: '/awards/aslab2.webp',
    title: 'Laboratory Assistant and Teaching Instructor',
    subtitle: 'Informatics Engineering Study Program • July 2023',
    alt: 'Laboratory Assistant and Teaching Instructor',
    label: 'View July 2023 Laboratory Assistant and Teaching Instructor image',
  },
]

function Awards() {
  const [selectedIndex, setSelectedIndex] =
    useState<number | null>(null)
  const [leaving, setLeaving] =
    useState(false)
  const [direction, setDirection] = useState<
    'next' | 'prev'
  >('next')
  const closeTimer = useRef<number | null>(
    null,
  )

  const selectedAward =
    selectedIndex === null
      ? null
      : (awardItems[selectedIndex] ?? null)

  const closeModal = useCallback(() => {
    if (
      selectedIndex === null ||
      leaving
    ) {
      return
    }

    setLeaving(true)

    if (closeTimer.current) {
      window.clearTimeout(
        closeTimer.current,
      )
    }

    closeTimer.current = window.setTimeout(
      () => {
        setSelectedIndex(null)
        setLeaving(false)
      },
      MODAL_EXIT_MS,
    )
  }, [selectedIndex, leaving])

  const goTo = useCallback(
    (index: number) => {
      const total = awardItems.length

      if (!total) {
        return
      }

      setDirection(
        index > (selectedIndex ?? 0)
          ? 'next'
          : 'prev',
      )

      setSelectedIndex(
        ((index % total) + total) % total,
      )
    },
    [selectedIndex],
  )

  const step = useCallback(
    (delta: 1 | -1) => {
      goTo((selectedIndex ?? 0) + delta)
    },
    [goTo, selectedIndex],
  )

  const openImage = (index: number) => {
    if (closeTimer.current) {
      window.clearTimeout(
        closeTimer.current,
      )
    }

    setLeaving(false)
    setDirection('next')
    setSelectedIndex(index)
  }

  // Kunci scroll body selama modal terbuka. Pakai teknik
  // position:fixed (bukan sekadar overflow:hidden) supaya
  // benar-benar tidak bisa di-scroll, termasuk lewat touch
  // di mobile Safari — lalu posisi scroll dikembalikan
  // persis seperti semula saat modal ditutup.
  useEffect(() => {
    if (selectedIndex === null) {
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

    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''

      window.scrollTo(0, scrollY)
    }
  }, [selectedIndex === null])

  // Close the modal with the Escape key, navigate with arrows
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        closeModal()
      } else if (
        selectedIndex !== null &&
        event.key === 'ArrowRight'
      ) {
        step(1)
      } else if (
        selectedIndex !== null &&
        event.key === 'ArrowLeft'
      ) {
        step(-1)
      }
    }

    if (selectedAward) {
      document.addEventListener(
        'keydown',
        handleKeyDown,
      )
    }

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [selectedAward, selectedIndex, closeModal, step])

  useEffect(
    () => () => {
      if (closeTimer.current) {
        window.clearTimeout(
          closeTimer.current,
        )
      }
    },
    [],
  )

  return (
    <section className="page-section awards-page">
      <div className="awards-panel">

        <SectionTitle
          icon={<Award />}
          title="Achievement"
          subtitle="Awards and Certification."
        />

        <div className="awards-content">

          <section className="awards-section">

            <div className="awards-grid">

              {/* Achievement 1 */}
              <article className="award-card reveal" style={{ ['--reveal-index' as string]: 0 }}>
                <div className="award-image-wrap">
                  <button
                    type="button"
                    className="award-image"
                    onClick={() => openImage(0)}
                    aria-label="View University Graduate Internship Program image"
                  >
                    <img
                      src="/awards/maganghub.webp"
                      alt="University Graduate Internship Program"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>

                  <span className="award-badge">
                    <Trophy size={21} />
                  </span>
                </div>

                <div className="award-card-content">
                  <div className="award-meta">
                    <span>CERTS</span>
                    <i />
                    <CalendarDays size={14} />
                    <span className="award-date">June 2026</span>
                  </div>

                  <h3>
                    University Graduate Internship Program
                  </h3>

                  <p>
                    Center for Groundwater and Environmental Geology
                  </p>

                  <div className="award-divider" />

                  <div className="award-organizer">
                    <span>ORGANIZER</span>

                    <strong>
                      Ministry of Manpower of the Republic of Indonesia
                    </strong>
                  </div>
                </div>
              </article>

<article
  className="award-card reveal"
  style={{ ['--reveal-index' as string]: 1 }}
>
  <div className="award-image-wrap">
    <button
      type="button"
      className="award-image"
      onClick={() => openImage(1)}
      aria-label="View Project Based Internship Certificate image"
    >
      <img
        src="/awards/pbi.webp"
        alt="Certificate of Competency – Project Based Internship"
        loading="lazy"
        decoding="async"
      />
    </button>

    <span className="award-badge">
      <Trophy size={21} />
    </span>
  </div>

  <div className="award-card-content">
    <div className="award-meta">
      <span>CERTS</span>
      <i />
      <CalendarDays size={14} />
      <span className="award-date">December 2025</span>
    </div>

    <h3>Certificate of Competency</h3>

    <p>
      Project Based Internship
    </p>

    <div className="award-divider" />

    <div className="award-organizer">
      <span>ORGANIZER</span>
      <strong>Bank Mandiri • Rakamin Academy</strong>
    </div>
  </div>
</article>
              {/* Achievement 2 */}
              <article className="award-card reveal" style={{ ['--reveal-index' as string]: 2 }}>
                <div className="award-image-wrap">
                  <button
                    type="button"
                    className="award-image"
                    onClick={() => openImage(2)}
                    aria-label="View Best Performing Student in Academic Achievement image"
                  >
                    <img
                      src="/awards/piagam.webp"
                      alt="Best Performing Student in Academic Achievement"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>

                  <span className="award-badge">
                    <Trophy size={21} />
                  </span>
                </div>

                <div className="award-card-content">
                  <div className="award-meta">
                    <span>AWARD</span>
                    <i />
                    <CalendarDays size={14} />
                    May 2024
                  </div>

                  <h3>
                    Best Performing Student in Academic Achievement
                  </h3>

                  <p>
                    UNLA Anniversary
                  </p>

                  <div className="award-divider" />

                  <div className="award-organizer">
                    <span>ORGANIZER</span>

                    <strong>
                      Langlangbuana University
                    </strong>
                  </div>
                </div>
              </article>

              {/* Achievement 3 */}
              <article className="award-card reveal" style={{ ['--reveal-index' as string]: 3 }}>
                <div className="award-image-wrap">
                  <button
                    type="button"
                    className="award-image"
                    onClick={() => openImage(3)}
                    aria-label="View Hartik Competition 2023 image"
                  >
                    <img
                      src="/awards/hartik2.webp"
                      alt="Hartik Competition 2023"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>

                  <span className="award-badge">
                    <Trophy size={21} />
                  </span>
                </div>

                <div className="award-card-content">
                  <div className="award-meta">
                    <span>AWARD</span>
                    <i />
                    <CalendarDays size={14} />
                    October 2023
                  </div>

                  <h3>
                    2nd Place Award – UI/UX Design Competition
                  </h3>

                  <p>
                    Hartik Competition 2023
                  </p>

                  <div className="award-divider" />

                  <div className="award-organizer">
                    <span>ORGANIZER</span>

                    <strong>
                      Muhammadiyah University of Sukabumi
                    </strong>
                  </div>
                </div>
              </article>

              {/* Achievement 4 */}
              <article className="award-card reveal" style={{ ['--reveal-index' as string]: 4 }}>
                <div className="award-image-wrap">
                  <button
                    type="button"
                    className="award-image"
                    onClick={() => openImage(4)}
                    aria-label="View July 2024 Laboratory Assistant and Teaching Instructor image"
                  >
                    <img
                      src="/awards/aslab1.webp"
                      alt="Laboratory Assistant and Teaching Instructor"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>

                  <span className="award-badge">
                    <Trophy size={21} />
                  </span>
                </div>

                <div className="award-card-content">
                  <div className="award-meta">
                    <span>AWARD</span>
                    <i />
                    <CalendarDays size={14} />
                    July 2024
                  </div>

                  <h3>
                    Laboratory Assistant and Teaching Instructor
                  </h3>

                  <p>
                    Informatics Engineering Study Program
                  </p>

                  <div className="award-divider" />

                  <div className="award-organizer">
                    <span>ORGANIZER</span>

                    <strong>
                      Langlangbuana University
                    </strong>
                  </div>
                </div>
              </article>

              {/* Achievement 5 */}
              <article className="award-card reveal" style={{ ['--reveal-index' as string]: 5 }}>
                <div className="award-image-wrap">
                  <button
                    type="button"
                    className="award-image"
                    onClick={() => openImage(5)}
                    aria-label="View July 2023 Laboratory Assistant and Teaching Instructor image"
                  >
                    <img
                      src="/awards/aslab2.webp"
                      alt="Laboratory Assistant and Teaching Instructor"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>

                  <span className="award-badge">
                    <Trophy size={21} />
                  </span>
                </div>

                <div className="award-card-content">
                  <div className="award-meta">
                    <span>AWARD</span>
                    <i />
                    <CalendarDays size={14} />
                    July 2023
                  </div>

                  <h3>
                    Laboratory Assistant and Teaching Instructor
                  </h3>

                  <p>
                    Informatics Engineering Study Program
                  </p>

                  <div className="award-divider" />

                  <div className="award-organizer">
                    <span>ORGANIZER</span>

                    <strong>
                      Langlangbuana University
                    </strong>
                  </div>
                </div>
              </article>

            </div>

          </section>

        </div>
      </div>

      {/* Image Preview Modal — dirender via portal ke document.body
          supaya position:fixed-nya selalu relatif ke viewport,
          tidak terjebak containing-block dari ancestor manapun
          (mis. elemen yang punya animasi transform). */}
      {selectedAward &&
        createPortal(
          <div
            className={
              leaving
                ? 'award-modal is-leaving'
                : 'award-modal'
            }
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-label="Preview achievement image"
          >
            <button
              type="button"
              className="award-modal-close"
              onClick={closeModal}
              aria-label="Close preview"
            >
              <X size={20} />
            </button>

            <div
              className={
                leaving
                  ? 'award-modal-panel is-leaving'
                  : 'award-modal-panel'
              }
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="award-modal-stage">
                {awardItems.length > 1 && (
                  <button
                    type="button"
                    className="award-modal-nav prev"
                    onClick={() => step(-1)}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}

                <img
                  key={`${selectedAward.image}-${selectedIndex}-${direction}`}
                  className={`award-modal-image slide-${direction}`}
                  src={selectedAward.image}
                  alt={selectedAward.title}
                />

                {awardItems.length > 1 && (
                  <button
                    type="button"
                    className="award-modal-nav next"
                    onClick={() => step(1)}
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>

              <div className="award-modal-caption">
                <h3>{selectedAward.title}</h3>
                <p>{selectedAward.subtitle}</p>

                {awardItems.length > 1 && (
                  <div className="award-modal-dots">
                    {awardItems.map(
                      (item, index) => (
                        <button
                          key={item.image}
                          type="button"
                          className={
                            index === selectedIndex
                              ? 'active'
                              : ''
                          }
                          onClick={() =>
                            goTo(index)
                          }
                          aria-label={`View ${item.title}`}
                        />
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

    </section>
  )
}

export default Awards