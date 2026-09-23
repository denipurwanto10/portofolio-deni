import { HeartHandshake } from 'lucide-react'
import SectionTitle from '../components/SectionTitle'

function Community() {
  return (
    <section className="page-section community-page">
      <div className="community-panel">
      <SectionTitle
        icon={<HeartHandshake />}
        title="Community"
        subtitle="Organizations and community contributions."
      />

      <div
        className="community-card reveal"
        style={{ ['--reveal-index' as string]: 0 }}
      >
        <h3>
          Leadership & Collaboration
        </h3>

        <p>
          I take part in organizations,
          technology activities, and
          collaborations to share knowledge
          and build useful solutions.
        </p>
      </div>
      </div>
    </section>
  )
}

export default Community
