import {
  useEffect,
  useRef,
  useState,
} from 'react'

/*
 * Count-up animasi ala referensi: angka berjalan
 * dari 0 ke nilai akhir dengan easing keluar.
 * Menghormati prefers-reduced-motion.
 */
export function useCountUp(
  target: number,
  duration = 1200,
  start = true,
): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) {
      return
    }

    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      ).matches
    ) {
      setValue(target)
      return
    }

    let frame = 0

    const t0 = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(
        (now - t0) / duration,
        1,
      )

      // easeOutCubic
      const eased =
        1 - Math.pow(1 - progress, 3)

      setValue(
        Math.round(target * eased),
      )

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [target, duration, start])

  return value
}

/*
 * Reveal-on-scroll: mengembalikan ref + status
 * terlihat. Dipakai untuk memicu animasi (misal
 * count-up) hanya saat elemen masuk viewport.
 */
export function useInView<T extends HTMLElement>(
  threshold = 0.3,
) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    // A8: ref bisa null saat effect pertama (konten async/tertunda) —
    // coba lagi via rAF beberapa kali alih-alih menyerah selamanya.
    let attempts = 0
    let raf = 0
    let observer: IntersectionObserver | null = null

    const attach = () => {
      const el = ref.current

      if (!el) {
        attempts += 1

        if (attempts < 30) {
          raf = requestAnimationFrame(attach)
        }

        return
      }

      if (
        typeof IntersectionObserver ===
        'undefined'
      ) {
        setInView(true)
        return
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setInView(true)
              observer?.disconnect()
            }
          })
        },
        { threshold },
      )

      observer.observe(el)
    }

    attach()

    return () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf)
      }

      observer?.disconnect()
    }
  }, [threshold])

  return { ref, inView }
}
