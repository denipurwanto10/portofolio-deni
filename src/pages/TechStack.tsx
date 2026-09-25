import { useMemo, useState } from 'react'
import {
  BarChart3,
  CodeXml,
  Database,
  Palette,
} from 'lucide-react'
import SectionTitle from '../components/SectionTitle'

type TechItem = {
  name: string
  description: string
  mark: string
  markClass: string
  logo: string
}

type Category = {
  id: string
  label: string
  icon: typeof CodeXml
  items: TechItem[]
}

const categories: Category[] = [
  {
    id: 'frontend',
    label: 'Frontend',
    icon: CodeXml,
    items: [
    { name: 'React', description: 'Building interactive user interfaces', mark: '⚛', markClass: 'react', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
{ name: 'TypeScript', description: 'Typed JavaScript for scalable apps', mark: 'TS', markClass: 'js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
{ name: 'Next.js', description: 'Production-ready React framework', mark: 'N', markClass: 'next', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
{ name: 'Astro', description: 'Modern framework for content-driven websites', mark: '✦', markClass: 'astro', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/astro/astro-original.svg' },
{ name: 'Vue.js', description: 'Progressive framework for web interfaces', mark: 'V', markClass: 'vue', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg' },
{ name: 'Vite', description: 'Fast build tool for modern web apps', mark: '⚡', markClass: 'vite', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg' },
{ name: 'Tailwind CSS', description: 'Utility-first responsive styling', mark: '≋', markClass: 'tailwind', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg' },
{ name: 'JavaScript', description: 'Dynamic language for web applications', mark: 'JS', markClass: 'javascript', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
{ name: 'Bootstrap', description: 'Responsive frontend component framework', mark: 'B', markClass: 'bootstrap', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg' },
{
  name: 'Leaflet.js',
  description: 'Interactive maps and geospatial web applications',
  mark: 'L',
  markClass: 'leaflet',
  logo: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/src/images/logo.svg',
},
    ],
  },
{
  id: 'backend',
  label: 'Backend & DB',
  icon: Database,
  items: [
    {
      name: 'Node.js',
      description: 'JavaScript runtime for backend services',
      mark: 'JS',
      markClass: 'node',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    },
    {
      name: 'Supabase',
      description: 'Open source backend platform',
      mark: 'S',
      markClass: 'supabase',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/supabase/supabase-original.svg',
    },
    {
      name: 'PostgreSQL',
      description: 'Relational database for production apps',
      mark: 'PG',
      markClass: 'postgres',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    },
    {
      name: 'MySQL',
      description: 'Relational database for web applications',
      mark: 'SQL',
      markClass: 'mysql',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    },
    {
      name: 'Laravel',
      description: 'PHP framework for web applications',
      mark: 'L',
      markClass: 'laravel',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg',
    },
    {
      name: 'CodeIgniter',
      description: 'Lightweight PHP framework for web applications',
      mark: 'CI',
      markClass: 'codeigniter',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/codeigniter/codeigniter-plain.svg',
    },
    {
      name: 'Firebase',
      description: 'Backend services for modern applications',
      mark: 'F',
      markClass: 'firebase',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg',
    },
  ],
},
  {
    id: 'data',
    label: 'Data Science',
    icon: BarChart3,
    items: [
      { name: 'Python', description: 'Data processing & scripting logic', mark: 'Py', markClass: 'python', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
      { name: 'Pandas', description: 'Complex data manipulation pipelines', mark: 'pd', markClass: 'pandas', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg' },
      { name: 'Scikit-Learn', description: 'Machine learning & predictive models', mark: 'sk', markClass: 'sklearn', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/scikitlearn/scikitlearn-original.svg' },
      { name: 'Jupyter', description: 'Interactive notebook development', mark: 'J', markClass: 'jupyter', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jupyter/jupyter-original.svg' },
    ],
  },
  {
    id: 'design',
    label: 'Design & Tools',
    icon: Palette,
    items: [
    { name: 'Figma', description: 'Interface design and prototyping', mark: 'Fi', markClass: 'figma', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg' },
{ name: 'Git', description: 'Version control and collaboration', mark: 'git', markClass: 'git', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
{ name: 'GitHub', description: 'Code hosting and collaboration platform', mark: 'GH', markClass: 'github', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg' },
{ name: 'VS Code', description: 'Code editor for modern application development', mark: 'VS', markClass: 'vscode', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg' },
{ name: 'Postman', description: 'API testing and development platform', mark: 'P', markClass: 'postman', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postman/postman-original.svg' },
{ name: 'Docker', description: 'Containerization platform for application deployment', mark: 'D', markClass: 'docker', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
{ name: 'Vercel', description: 'Cloud platform for frontend deployment', mark: '▲', markClass: 'vercel', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vercel/vercel-original.svg' },
{ name: 'Cloudflare', description: 'Web infrastructure and edge network platform', mark: 'CF', markClass: 'cloudflare', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cloudflare/cloudflare-original.svg' },
{
  name: 'QGIS',
  description: 'Geospatial analysis and mapping',
  mark: 'Q',
  markClass: 'qgis',
  logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/QGIS_logo_new.svg',
},
    ],
  },
]
function TechStack() {
  const [activeCategory, setActiveCategory] = useState('frontend')

  // B22: fallback eksplisit bila kategori tak ketemu & array kosong.
  const active =
    useMemo(
      () =>
        categories.find(
          (category) => category.id === activeCategory,
        ) ?? categories[0] ?? {
          id: 'frontend',
          label: 'Frontend',
          icon: CodeXml,
          items: [],
        },
      [activeCategory],
    )

  return (
    <section className="page-section techstack-page">
      <div className="techstack-panel">
        <SectionTitle
          icon={<CodeXml />}
          title="Tech Stack"
          subtitle="Technologies and tools I use to build performant and scalable digital products."
        />

        <div className="techstack-tabs" role="tablist" aria-label="Technology categories">
          {categories.map((category) => {
            const Icon = category.icon
            const isActive = category.id === activeCategory

            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={isActive ? 'techstack-tab active' : 'techstack-tab'}
                onClick={() => setActiveCategory(category.id)}
              >
                <Icon size={19} strokeWidth={2} />
                <span>{category.label}</span>
              </button>
            )
          })}
        </div>

        <div className="techstack-grid" key={active.id}>
          {active.items.map((item, index) => (
            <article
              className="techstack-card reveal"
              key={item.name}
              style={{
                ['--reveal-index' as string]:
                  Math.min(index, 11),
              }}
            >
              <div className={`techstack-mark ${item.markClass}`} aria-hidden="true">
                <img
                  src={item.logo}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width={28}
                  height={28}
                />
              </div>

              <h2>{item.name}</h2>
              <p>{item.description}</p>
            </article>
          ))}
        </div>

        <div className="techstack-pagination" aria-label="Active category">
          {categories.map((category) => (
            <span
              key={category.id}
              className={category.id === activeCategory ? 'active' : ''}
            />
          ))}
        </div>

        <button
          type="button"
          className="techstack-hint"
          onClick={() => {
            const current = categories.findIndex((category) => category.id === activeCategory)
            const next = categories[(current + 1) % categories.length]
            setActiveCategory(next.id)
          }}
        >
          <span>›</span>
          Click a category to explore different skills
        </button>
      </div>
    </section>
  )
}

export default TechStack
