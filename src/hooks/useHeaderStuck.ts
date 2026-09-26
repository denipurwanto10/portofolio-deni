import { useEffect, useState } from 'react'
import { useRef } from 'react'

/*
 * useHeaderStuck — menandai header sticky dengan atribut
 * `data-stuck` tepat saat ia mulai menempel di atas viewport.
 *
 * Cara kerja: komponen merender satu `<span class="sticky-sentinel">`
 * SEBELUM header (lihat SectionTitle.tsx & Projects.tsx). Selama
 * sentinel masih terlihat di viewport, header belum nempel →
 * `stuck` false → header transparan. Begitu sentinel keluar ke atas,
 * header sudah nempel → `stuck` true → header dapat latar kaca.
 *
 * Pakai IntersectionObserver, bukan scroll listener, jadi tidak ada
 * work per-frame saat halaman di-scroll.
 */
export function useHeaderStuck() {
  const sentinelRef = useRef<HTMLSpanElement | null>(
    null,
  )
  const [stuck, setStuck] =
    useState(false)

  useEffect(() => {
    const el = sentinelRef.current

    if (
      !el ||
      typeof IntersectionObserver ===
        'undefined'
    ) {
      return
    }

    const io =
      new IntersectionObserver(
        (entries) => {
          const entry = entries[0]

          if (!entry) {
            return
          }

          /*
           * Header sticky berada DI BAWAH sentinel. Begitu
           * sentinel terdorong keluar viewport ke atas, header
           * sudah menempel di `top: 14px`.
           */
          setStuck(
            !entry.isIntersecting &&
              entry.boundingClientRect.top < 0,
          )
        },
        { threshold: 0 },
      )

    io.observe(el)

    return () => {
      io.disconnect()
    }
  }, [])

  return { sentinelRef, stuck }
}
