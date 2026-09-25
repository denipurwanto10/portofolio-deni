import { useMemo, useState } from 'react'
import type { ElementType } from 'react'
import {
  Cpu,
  Database,
  ExternalLink,
  FolderKanban,
  Github,
  Globe,
  Layers3,
  Rocket,
  Search,
  Smartphone,
  X,
} from 'lucide-react'
import SectionTitle from '../components/SectionTitle'
import { projects } from '../data'

const categoryIcons: Record<string, ElementType> = {
  'Web App': Globe,
  'Full-Stack': Layers3,
  'Desktop & AI': Cpu,
  Frontend: FolderKanban,
  Backend: Database,
  Mobile: Smartphone,
}

const languageColors: Record<string, string> = {
  JavaScript: '#eab308',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  PHP: '#777bb4',
  Kotlin: '#A97BFF',
}

function Projects({
  search,
  setSearch,
}: {
  search: string
  setSearch: (value: string) => void
}) {
  const [activeCategory, setActiveCategory] =
    useState('All')

  const categories = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(
          projects.map(
            (project) => project.category,
          ),
        ),
      ),
    ],
    [],
  )

  const filtered = projects.filter((project) => {
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

  return (
    <section className="page-section projects-page">
      <div className="projects-panel">
        <div className="projects-head">
          <SectionTitle
            icon={<FolderKanban />}
            title="Projects"
            subtitle={`A collection of work from GitHub — ${projects.length} projects.`}
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
          {projects.length} projects
          {activeCategory !== 'All' &&
            ` · ${activeCategory}`}
        </p>

        {/* PROJECTS */}

        {filtered.length > 0 ? (
          <div
            className="projects-grid"
            key={activeCategory}
          >
            {filtered.map((project, index) => {
              const Icon =
                categoryIcons[
                  project.category
                ] ?? FolderKanban

              return (
                <article
                  className="project-card reveal"
                  key={project.title}
                  style={{
                    ['--reveal-index' as string]:
                      Math.min(index, 11),
                  }}
                >
                  <div className="project-card-top">
                    <span className="project-icon">
                      <Icon size={19} />
                    </span>

                    <span className="project-category">
                      {project.category}
                    </span>
                  </div>

                  <h3>{project.title}</h3>

                  <p>{project.description}</p>

                  <div className="tags">
                    {project.tags.map((tag) => (
                      <span key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="project-divider" />

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

                    <span className="project-links">
                      {project.demo && (
                        <a
                          href={project.demo}
                          target="_blank"
                          rel="noreferrer"
                          className="project-link demo"
                        >
                          <Rocket size={13} />
                          Live Demo
                        </a>
                      )}

                      <a
                        href={project.link}
                        target="_blank"
                        rel="noreferrer"
                        className="project-link"
                      >
                        <Github size={13} />
                        GitHub
                        <ExternalLink
                          size={12}
                        />
                      </a>
                    </span>
                  </div>
                </article>
              )
            })}
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
    </section>
  )
}

export default Projects
