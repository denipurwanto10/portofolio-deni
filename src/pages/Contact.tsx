import {
  Github,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
} from 'lucide-react'
import SectionTitle from '../components/SectionTitle'

function Contact() {
  return (
    <section className="page-section contact-page">
      <div className="contact-panel">
        <SectionTitle
          icon={<Mail />}
          title="Contact"
          subtitle="Get in touch for collaboration."
        />

        <div className="contact-info-grid">
          <a
            className="contact-info-card reveal"
            style={{ ['--reveal-index' as string]: 0 }}
            href="mailto:denipurwanto800@gmail.com"
          >
            <span className="contact-icon contact-icon-email">
              <Mail size={17} />
            </span>

            <span className="contact-info-text">
              <small>Email</small>
              <strong>denipurwanto800@gmail.com</strong>
            </span>
          </a>

          <div className="contact-info-card reveal"
            style={{ ['--reveal-index' as string]: 1 }}
          >
            <span className="contact-icon contact-icon-location">
              <MapPin size={17} />
            </span>

            <span className="contact-info-text">
              <strong>Bandung, West Java</strong>
              <small>UTC+7 (WIB)</small>
            </span>
          </div>
        </div>

        <section className="contact-social-card reveal"
          style={{ ['--reveal-index' as string]: 2 }}>
          <h2>Social Media</h2>

          <div className="contact-social-list">
            <a
              href="https://www.linkedin.com/in/deniiprwnt/"
              target="_blank"
              rel="noreferrer"
              className="contact-social-item"
            >
              <span className="contact-social-icon linkedin">
                <Linkedin size={16} />
              </span>

              <span>
                <strong>LinkedIn</strong>
                <small>/in/deniiprwnt</small>
              </span>
            </a>

            <a
              href="https://github.com/denipurwanto10"
              target="_blank"
              rel="noreferrer"
              className="contact-social-item"
            >
              <span className="contact-social-icon github">
                <Github size={16} />
              </span>

              <span>
                <strong>GitHub</strong>
                <small>@denipurwanto10</small>
              </span>
            </a>

            <a
              href="https://www.instagram.com/deniiprwnt/"
              target="_blank"
              rel="noreferrer"
              className="contact-social-item"
            >
              <span className="contact-social-icon instagram">
                <Instagram size={16} />
              </span>

              <span>
                <strong>Instagram</strong>
                <small>@deniiprwnt</small>
              </span>
            </a>
          </div>
        </section>

        <section className="contact-availability reveal"
          style={{ ['--reveal-index' as string]: 3 }}>
          <div className="availability-title">
            <span className="availability-dot" />
            <strong>Available for Projects</strong>
          </div>

          <p>
            Open for freelance, part-time, and collaboration opportunities in Web Development.
          </p>
        </section>
      </div>
    </section>
  )
}

export default Contact
