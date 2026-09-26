import type { ReactNode } from 'react'
import { useHeaderStuck } from '../hooks/useHeaderStuck'

type SectionTitleProps = {
  icon: ReactNode
  title: string
  subtitle: string
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode
  title: string
  subtitle: string
}) {
  const { sentinelRef, stuck } =
    useHeaderStuck()

  return (
    <>
      <span
        ref={sentinelRef}
        className="sticky-sentinel"
        aria-hidden="true"
      />

      <div
        className="section-title"
        data-stuck={stuck ? 'true' : undefined}
      >
      <span>{icon}</span>

      <div>
        <h2>{title}</h2>

        <p>{subtitle}</p>
      </div>
      </div>
    </>
  )
}

export default SectionTitle
