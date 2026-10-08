import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FolderKanban,
  Github,
  Search,
  X,
} from 'lucide-react'
import SectionTitle from '../components/SectionTitle'
import { featuredProjects } from '../data'
import type { Project } from '../data'
import { useHeaderStuck } from '../hooks/useHeaderStuck'

const languageColors: Record<string, string> = {
  JavaScript: '#eab308',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  PHP: '#777bb4',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Java: '#b07219',
}

/** Fallback preview: kartu sosial GitHub repo (gambar OG). */
function githubShot(link: string): string {
  const match = link.match(/github\.com\/([^/]+\/[^/?#]+)/)
  return match
    ? `https://opengraph.githubassets.com/1/${match[1]}`
    : ''
}

function Projects({
  search,
  setSearch,
}: {
  search: string
  setSearch: (value: string) => void
}) {
  /* Hanya proyek berfoto yang tampil — sumbernya sama dengan
     yang dipakai asisten (featuredProjects di data.ts). */
  const featured = useMemo(
    () => featuredProjects,
    [],
  )

  const [activeCategory, setActiveCategory] =
    useState('All')
  const [selected, setSelected] =
    useState<Project | null>(null)
  const [shotIndex, setShotIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)

  const { sentinelRef, stuck } =
    useHeaderStuck()

  const categories = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(
          featured.map(
            (project) => project.category,
          ),
        ),
      ),
    ],
    [featured],
  )

  const filtered = featured.filter((project) => {
    const matchesCategory =
      activeCategory === 'All' ||
      project.category === activeCategory

    if (!matchesCategory) return false

    const keyword = search.trim().toLowerCase()

    if (!keyword) return true

    return `${project.title} ${project.description} ${project.tags.join(' ')} ${project.language} ${project.category}`
      .toLowerCase()
      .includes(keyword)
  })

  const openProject = (project: Project) => {
    setSelected(project)
    setShotIndex(0)
    setLeaving(false)
  }

  const closeProject = () => {
    setLeaving(true)
    window.setTimeout(() => {
      setSelected(null)
      setLeaving(false)
    }, 180)
  }

  /* Kunci scroll halaman saat modal terbuka + tutup via
     Escape (pola yang sama dengan modal Awards). Fokus dikurung
     di dalam dialog + dikembalikan ke pemicu saat ditutup
     (pola yang sama dengan modal Resume di Dashboard). */
  useEffect(() => {
    if (!selected) return

    document.documentElement.style.overflow =
      'hidden'
    document.body.style.overflow = 'hidden'

    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    document
      .querySelector<HTMLButtonElement>(
        '.project-modal-close',
      )
      ?.focus()

    const onKey = (
      event: globalThis.KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        closeProject()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      /* Tombol tutup adalah sibling panel, jadi kurung mencakup
         seluruh dialog (.project-modal), bukan hanya panel. */
      const dialog = document.querySelector(
        '.project-modal',
      )

      if (!dialog) {
        return
      }

      const items = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        ),
      ).filter(
        (item) => item.tabIndex >= 0,
      )

      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)

    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)

      if (trigger && document.contains(trigger)) {
        trigger.focus()
      }
    }
  }, [selected])

  const shots = selected
    ? selected.images?.length
      ? selected.images
      : [githubShot(selected.link)]
    : []

  return (
    <section className="page-section projects-page">
      <div className="projects-panel">
        <span
          ref={sentinelRef}
          className="sticky-sentinel"
          aria-hidden="true"
        />

        <div
          className="projects-head"
          data-stuck={stuck ? 'true' : undefined}
        >
          <SectionTitle
            icon={<FolderKanban />}
            title="Projects"
            subtitle={`A collection of work from GitHub — ${featured.length} projects.`}
          />

          <a
            className="projects-github"
            href="https://github.com/denipurwanto10?tab=repositories"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} />
            <span>@denipurwanto10</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* SEARCH */}

        <div className="project-search">
          <Search size={17} />

          <input
            type="search"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search projects..."
            aria-label="Search projects"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* CATEGORY FILTER */}

        <div
          className="project-filters"
          role="tablist"
          aria-label="Filter projects by category"
        >
          {categories.map((category) => {
            const isActive =
              category === activeCategory

            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={
                  isActive
                    ? 'project-filter active'
                    : 'project-filter'
                }
                onClick={() =>
                  setActiveCategory(category)
                }
              >
                {category}
              </button>
            )
          })}
        </div>

        <p className="projects-count">
          Showing {filtered.length} of{' '}
          {featured.length} projects
          {activeCategory !== 'All' &&
            ` · ${activeCategory}`}
        </p>

        {/* PROJECTS */}

        {filtered.length > 0 ? (
          <div
            className="projects-grid"
            key={activeCategory}
          >
            {filtered.map((project, index) => (
              <article
                className="project-card reveal"
                key={project.title}
                style={{
                  ['--reveal-index' as string]:
                    Math.min(index, 11),
                }}
                onClick={() =>
                  openProject(project)
                }
                onKeyDown={(event) => {
                  if (
                    event.key !== 'Enter' &&
                    event.key !== ' '
                  ) {
                    return
                  }
                  /* Fokus di link/button dalam kartu (mis. Repository):
                     biarkan aksi aslinya jalan, jangan ikut buka modal. */
                  const target =
                    event.target as HTMLElement | null
                  if (target?.closest('a,button')) {
                    return
                  }
                  event.preventDefault()
                  openProject(project)
                }}
                tabIndex={0}
                role="button"
              >
                <div className="project-shot-wrap">
                  <img
                    className="project-shot"
                    src={
                      project.images?.[0] ??
                      githubShot(project.link)
                    }
                    alt={project.title}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      const img =
                        event.currentTarget
                      const fallback =
                        githubShot(project.link)
                      if (
                        fallback &&
                        !img.src.endsWith(
                          fallback,
                        )
                      ) {
                        img.src = fallback
                      }
                    }}
                  />

                  <span className="project-category">
                    {project.category}
                  </span>
                </div>

                <div className="project-card-body">
                  <h3>{project.title}</h3>

                  <p>{project.description}</p>

                  <div className="tags">
                    {project.tags
                      .slice(0, 4)
                      .map((tag) => (
                        <span key={tag}>
                          {tag}
                        </span>
                      ))}
                  </div>

                  <div className="project-footer">
                    <span className="project-lang">
                      <i
                        style={{
                          background:
                            languageColors[
                              project.language
                            ] ?? '#94a3b8',
                        }}
                      />
                      {project.language}
                    </span>

                    <a
                      className="project-open"
                      href={project.link}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <Github size={13} />
                      Repository
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="projects-empty">
            <Search size={22} />

            <h3>No projects found</h3>

            <p>
              Try a different keyword or
              category.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch('')
                setActiveCategory('All')
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* PROJECT DETAIL MODAL — portal ke body supaya
          position:fixed tidak terjebak containing block
          ancestor (pola yang sama dengan modal Awards). */}
      {selected &&
        createPortal(
          <div
            className={
              leaving
                ? 'project-modal is-leaving'
                : 'project-modal'
            }
            onClick={closeProject}
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.title} details`}
          >
            <button
              type="button"
              className="project-modal-close"
              onClick={closeProject}
              aria-label="Close project details"
            >
              <X size={19} />
            </button>

            <div
              className={
                leaving
                  ? 'project-modal-panel is-leaving'
                  : 'project-modal-panel'
              }
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="project-modal-stage">
                {shots.length > 1 && (
                  <button
                    type="button"
                    className="project-modal-nav prev"
                    onClick={() =>
                      setShotIndex(
                        (shotIndex -
                          1 +
                          shots.length) %
                          shots.length,
                      )
                    }
                    aria-label="Previous screenshot"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}

                <img
                  key={shots[shotIndex]}
                  className="project-modal-image"
                  src={shots[shotIndex]}
                  alt={`${selected.title} — screenshot ${shotIndex + 1}`}
                  decoding="async"
                />

                {shots.length > 1 && (
                  <button
                    type="button"
                    className="project-modal-nav next"
                    onClick={() =>
                      setShotIndex(
                        (shotIndex + 1) %
                          shots.length,
                      )
                    }
                    aria-label="Next screenshot"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>

              {shots.length > 1 && (
                <div className="project-modal-thumbs">
                  {shots.map((shot, index) => (
                    <button
                      key={shot}
                      type="button"
                      className={
                        index === shotIndex
                          ? 'project-modal-thumb active'
                          : 'project-modal-thumb'
                      }
                      onClick={() =>
                        setShotIndex(index)
                      }
                      aria-label={`View screenshot ${index + 1}`}
                    >
                      <img
                        src={shot}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="project-modal-info">
                <div className="project-modal-top">
                  <span className="project-category">
                    {selected.category}
                  </span>

                  <span className="project-lang">
                    <i
                      style={{
                        background:
                          languageColors[
                            selected.language
                          ] ?? '#94a3b8',
                      }}
                    />
                    {selected.language}
                  </span>
                </div>

                <h3>{selected.title}</h3>

                <p>{selected.description}</p>

                <div className="tags">
                  {selected.tags.map((tag) => (
                    <span key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="project-divider" />

                <div className="project-modal-foot">
                  {selected.demo && (
                    <a
                      className="project-link demo"
                      href={selected.demo}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={14} />
                      View Demo
                    </a>
                  )}
                  <a
                    className="project-link demo"
                    href={selected.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Github size={14} />
                    Repository
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  )
}

export default Projects
