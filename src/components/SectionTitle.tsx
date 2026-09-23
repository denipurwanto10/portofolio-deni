import type { ReactNode } from 'react'

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
  return (
    <div className="section-title">
      <span>{icon}</span>

      <div>
        <h2>{title}</h2>

        <p>{subtitle}</p>
      </div>
    </div>
  )
}

export default SectionTitle
