import { useState } from 'react'
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronUp,
} from 'lucide-react'
import SectionTitle from '../components/SectionTitle'
import { experiences } from '../data'

type ExperienceCard = (typeof experiences)[number]

function ExperienceDetails({
  item,
  index,
}: {
  item: ExperienceCard
  index: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <article
      className="experience-card reveal"
      style={{
        ['--reveal-index' as string]: index,
      }}
    >
      {/* Logo transparan (esdm1/unla): tanpa bingkai/background.
          Foto kotak penuh (mandiri/pemkab): tetap berbingkai. */}
      <div
        className={
          item.image.endsWith('.webp')
            ? 'experience-image-wrap is-logo'
            : 'experience-image-wrap'
        }
      >
        <img
          className="experience-image"
          src={item.image}
          alt={`${item.role} — ${item.company}`}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="experience-card-content">
        <h3>{item.role}</h3>

        <div className="experience-card-top">
          <div className="experience-statuses">
            <span className="experience-type">{item.type}</span>
            {item.active && (
              <span className="experience-status">
                <span className="experience-status-dot" />
                Active
              </span>
            )}
          </div>

          <span className="experience-date">
            <CalendarDays size={16} />
            {item.year}
          </span>
        </div>

        <p className="experience-company">{item.company}</p>
      <p className="experience-description">{item.description}</p>

      <div className="experience-tags">
        {item.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <button
        type="button"
        className="experience-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? 'Hide Achievement Details' : 'View Achievement Details'}
        <ChevronUp className={open ? '' : 'is-closed'} size={18} />
      </button>

        {open && (
          <div className="experience-details">
          <h4>KEY ACHIEVEMENTS &amp; RESPONSIBILITIES</h4>
          <ul>
            {item.achievements.map((achievement) => (
              <li key={achievement}>
                <CheckCircle2 size={18} />
                <span>{achievement}</span>
              </li>
            ))}
          </ul>
          </div>
        )}
      </div>
    </article>
  )
}

function Experience() {
  return (
    <section className="page-section experience-page">
      <div className="experience-panel">
        <SectionTitle
          icon={<BriefcaseBusiness />}
          title="Experience"
          subtitle="Career journey, organizations, and leadership roles."
        />

        <div className="experience-list">
        {experiences.map((item, index) => (
          <ExperienceDetails
            key={`${item.year}-${item.role}`}
            item={item}
            index={index}
          />
        ))}
        </div>
      </div>
    </section>
  )
}

export default Experience
