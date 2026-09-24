import { useEffect, useRef, useState } from 'react'
import './CustomCursor.css'

/**
 * Custom cursor panah navigasi modern (badan hitam, outline putih
 * bercahaya hijau, sliver gradasi di dalam) dengan efek klik
 * cipratan air.
 *
 *  - Panah menempel persis di posisi mouse (tanpa lag), ujung
 *    panah = titik klik yang sebenarnya.
 *  - Hover elemen interaktif: panah membesar sedikit + glow.
 *  - Di atas input teks: berubah jadi I-beam.
 *  - Klik: panah menekan sedikit + cipratan air (tetesan terlontar
 *    ke segala arah lalu jatuh oleh gravitasi) + riak di permukaan.
 *
 * Catatan:
 *  - Hanya aktif di perangkat dengan mouse (hover + pointer: fine).
 *  - Cursor bawaan baru disembunyikan setelah mouse bergerak
 *    (class `cc-active`), jadi aman kalau JS gagal jalan.
 *  - Respect `prefers-reduced-motion`: tanpa efek air.
 */

const INTERACTIVE = [
  'a[href]',
  'button',
  'summary',
  'select',
  'label[for]',
  '[role="button"]',
  '[role="tab"]',
  '[role="switch"]',
  '[role="menuitem"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  'input[type="range"]',
  'input[type="submit"]',
  'input[type="button"]',
  '.award-image',
  '[data-cursor="hover"]',
].join(',')

const TEXT_FIELD = [
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="submit"]):not([type="button"]):not([type="file"])',
  'textarea',
  '[contenteditable=""]',
  '[contenteditable="true"]',
].join(',')

/** Riak di permukaan: jeda, durasi (ms), dan diameter (px). */
const RIPPLES = [{ delay: 0, duration: 600, size: 64 }]

/** Cipratan: jumlah tetesan, gravitasi (px/s²), dan waktu terbang (s). */
const DROPLETS = 6
const GRAVITY = 560
const FLIGHT_STEPS = 10

/** Batas elemen efek di DOM supaya klik beruntun tidak menumpuk. */
const MAX_FX = 64

type CursorState = 'default' | 'hover' | 'text' | 'disabled' | 'hidden'

function detectState(target: Element | null): CursorState {
  if (!target) return 'default'
  if (target.tagName === 'IFRAME') return 'hidden'
  if (target.closest(TEXT_FIELD)) return 'text'
  if (target.closest(':disabled, [aria-disabled="true"]')) return 'disabled'
  if (target.closest(INTERACTIVE)) return 'hover'
  return 'default'
}

function CustomCursor() {
  // Hanya untuk perangkat dengan mouse/trackpad.
  const [enabled] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  )

  const rootRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const fxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return

    const root = rootRef.current
    const cursor = cursorRef.current
    const fx = fxRef.current
    if (!root || !cursor || !fx) return

    const html = document.documentElement
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    let shown = false
    let lastTarget: Element | null = null

    const setVisible = (value: boolean) => {
      shown = value
      root.dataset.visible = String(value)
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return

      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`

      if (!shown) {
        html.classList.add('cc-active')
        setVisible(true)
      }

      const target = event.target as Element | null
      if (target !== lastTarget) {
        lastTarget = target
        root.dataset.state = detectState(target)
      }
    }

    /** Cipratan air di titik klik. */
    const splash = (x: number, y: number) => {
      if (reduceMotion) return

      while (fx.childElementCount > MAX_FX) {
        fx.firstElementChild?.remove()
      }

      const spawn = (className: string, size: number) => {
        const el = document.createElement('span')
        el.className = className
        el.style.left = `${x}px`
        el.style.top = `${y}px`
        el.style.width = `${size}px`
        el.style.height = `${size}px`
        fx.appendChild(el)
        return el
      }

      const cleanup = (el: HTMLElement, animation: Animation) => {
        animation.finished.then(() => el.remove()).catch(() => el.remove())
      }

      // Percikan pusat (titik benturan)
      const impact = spawn('cc-impact', 16)
      cleanup(
        impact,
        impact.animate(
          [
            { transform: 'translate(-50%, -50%) scale(0.25)', opacity: 0.95 },
            { transform: 'translate(-50%, -50%) scale(1.7)', opacity: 0 },
          ],
          { duration: 360, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
        ),
      )

      // Riak di permukaan air
      RIPPLES.forEach(({ delay, duration, size }) => {
        const ripple = spawn('cc-ripple', size)
        cleanup(
          ripple,
          ripple.animate(
            [
              {
                transform: 'translate(-50%, -50%) scale(0.08)',
                opacity: 0.9,
                offset: 0,
              },
              {
                transform: 'translate(-50%, -50%) scale(0.6)',
                opacity: 0.5,
                offset: 0.45,
              },
              {
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 0,
                offset: 1,
              },
            ],
            { duration, delay, easing: 'cubic-bezier(0.16, 0.7, 0.3, 1)' },
          ),
        )
      })

      // Tetesan air: gerak parabola (lontar lalu jatuh oleh gravitasi)
      for (let i = 0; i < DROPLETS; i += 1) {
        const width = 2.5 + Math.random() * 3
        const droplet = spawn('cc-droplet', width)
        droplet.style.height = `${width * 1.7}px`

        // Sebar merata ke segala arah dengan sedikit acak,
        // condong ke atas seperti percikan sungguhan.
        const angle =
          -Math.PI / 2 +
          ((i / DROPLETS) * 2 - 1) * Math.PI * 0.95 +
          (Math.random() - 0.5) * 0.35
        const speed = 85 + Math.random() * 115
        const vx = Math.cos(angle) * speed
        const vy = Math.sin(angle) * speed
        const flight = 0.55 + Math.random() * 0.3

        const frames: Keyframe[] = []
        for (let step = 0; step <= FLIGHT_STEPS; step += 1) {
          const progress = step / FLIGHT_STEPS
          const t = flight * progress
          const px = vx * t
          const py = vy * t + 0.5 * GRAVITY * t * t
          // Ujung tetesan selalu mengarah ke arah gerak
          const heading = Math.atan2(vy + GRAVITY * t, vx)
          const rotate = (heading * 180) / Math.PI - 90
          frames.push({
            transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px)) rotate(${rotate}deg) scale(${1 - progress * 0.55})`,
            opacity: progress < 0.65 ? 1 : 1 - (progress - 0.65) / 0.35,
            offset: progress,
          })
        }

        cleanup(
          droplet,
          droplet.animate(frames, {
            duration: flight * 1000,
            easing: 'linear',
          }),
        )
      }
    }

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.button !== 0) return
      root.dataset.pressed = 'true'
      splash(event.clientX, event.clientY)
    }

    const onUp = () => {
      root.dataset.pressed = 'false'
    }

    // Mouse keluar jendela / masuk area scrollbar -> sembunyikan.
    const onOut = (event: MouseEvent) => {
      if (!event.relatedTarget) {
        setVisible(false)
        root.dataset.pressed = 'false'
        lastTarget = null
      }
    }

    const onHide = () => setVisible(false)

    root.dataset.state = 'default'
    root.dataset.pressed = 'false'
    root.dataset.visible = 'false'

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onUp, { passive: true })
    document.addEventListener('mouseout', onOut)
    window.addEventListener('blur', onHide)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.removeEventListener('mouseout', onOut)
      window.removeEventListener('blur', onHide)
      html.classList.remove('cc-active')
      fx.replaceChildren()
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div className="cc-root" ref={rootRef} aria-hidden="true">
      <div className="cc-fx" ref={fxRef} />
      <div className="cc-cursor" ref={cursorRef}>
        {/* Panah navigasi: ujung (0,0) = titik klik */}
        <svg
          className="cc-arrow"
          width="17"
          height="21.7"
          viewBox="-4 -4 30 38"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="cc-sliver-grad"
              x1="0"
              y1="0"
              x2="0.35"
              y2="1"
            >
              <stop offset="0" className="cc-stop-top" />
              <stop offset="1" className="cc-stop-bottom" />
            </linearGradient>
          </defs>
          {/* Outline putih tebal */}
          <path
            className="cc-arrow-outline"
            d="M0 0 L21.6 21.9 L10.5 22.6 L4.4 30 Z"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          {/* Badan hitam */}
          <path
            className="cc-arrow-body"
            d="M0 0 L21.6 21.9 L10.5 22.6 L4.4 30 Z"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Sliver gradasi di dalam badan */}
          <path
            className="cc-arrow-sliver"
            d="M2.6 5.2 L7.4 19.2 L4.6 17.4 Z"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </svg>
        {/* I-beam untuk input teks */}
        <svg
          className="cc-ibeam"
          width="9"
          height="17"
          viewBox="0 0 14 26"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 2.5 H10 M7 2.5 V23.5 M4 23.5 H10"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  )
}

export default CustomCursor
