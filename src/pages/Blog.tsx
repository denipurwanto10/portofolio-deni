import { BookOpen } from 'lucide-react'
import SectionTitle from '../components/SectionTitle'

function Blog() {
  return (
    <section className="page-section blog-page">
      <div className="blog-panel">
      <SectionTitle
        icon={<BookOpen />}
        title="Blog"
        subtitle="Learning notes and technology insights."
      />

      <div className="cards-grid">
        <article
          className="project-card reveal"
          style={{ ['--reveal-index' as string]: 0 }}
        >
          <span className="eyebrow">
            COMING SOON
          </span>

          <h3>
            Full-Stack Learning Notes
          </h3>

          <p>
            Documenting my learning process,
            experiments, and best practices
            in web application development.
          </p>
        </article>
      </div>
      </div>
    </section>
  )
}

export default Blog
