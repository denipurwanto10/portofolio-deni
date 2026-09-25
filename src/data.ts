export type Project = {
  title: string
  description: string
  tags: string[]
  link: string
  demo?: string
  language: string
  category: string
}

export type ExperienceItem = {
  year: string
  role: string
  company: string
  description: string
  type: string
  active: boolean
  tags: string[]
  achievements: string[]
  image: string
}

export const projects: Project[] = [
  {
    title: 'Formatra Convert',
    description:
      'An all-in-one document toolkit web app — convert, merge, split, compress, protect, and edit PDF, Word, Excel, PowerPoint, and images, all running in the browser with an optional LibreOffice backend.',
    tags: ['React', 'Vite', 'Tailwind CSS', 'pdf-lib', 'LibreOffice'],
    link: 'https://github.com/denipurwanto10/Formatra-Convert',
    demo: 'https://formatra-ten.vercel.app',
    language: 'JavaScript',
    category: 'Web App',
  },
  {
    title: 'Disaster Monitoring Indonesia',
    description:
      'Realtime Indonesian disaster monitoring — BMKG earthquakes, MAGMA volcanic activity, weather and InaTEWS tsunami alerts with interactive maps, an Express REST API plus realtime Socket.IO and a MySQL database.',
    tags: ['Next.js', 'TypeScript', 'Express', 'Socket.IO', 'MySQL', 'Leaflet'],
    link: 'https://github.com/denipurwanto10/Disaster-Monitoring',
    language: 'TypeScript',
    category: 'Full-Stack',
  },
  {
    title: 'PC Control — Multimodal Desktop Controller',
    description:
      'Control a Windows PC with hand gestures (webcam), Indonesian/English voice commands, and a Telegram bot — mouse, keyboard, screenshots, and workflow automation through one safe Command Processor.',
    tags: ['Python', 'MediaPipe', 'OpenCV', 'Speech Recognition', 'Telegram Bot'],
    link: 'https://github.com/denipurwanto10/PC-Control',
    language: 'Python',
    category: 'Desktop & AI',
  },
  {
    title: 'Bandung Regency MSME Portal',
    description:
      'An MSME census app with an interactive map across 31 districts — catalog with filters, MSME details, Owner/Admin dashboards, verification, PDF export, and JWT login with Admin/Owner RBAC.',
    tags: ['React', 'Node.js', 'Express', 'MySQL', 'Leaflet', 'JWT'],
    link: 'https://github.com/denipurwanto10/Website-UMKM-V2',
    language: 'JavaScript',
    category: 'Full-Stack',
  },
  {
    title: 'Placement Test Engine',
    description:
      'A multi-step placement test — validated biodata form, 15 multiple-choice questions with realtime progress and localStorage autosave, results with score, level, program recommendations, and send-to-WhatsApp.',
    tags: ['React 19', 'Vite', 'React Router', 'Tailwind CSS'],
    link: 'https://github.com/denipurwanto10/Mini-Project',
    demo: 'https://placement-test-ashy.vercel.app/',
    language: 'JavaScript',
    category: 'Frontend',
  },
  {
    title: 'Gudang.in — Office Inventory & Assets',
    description:
      'A Laravel inventory system — multi-warehouse, automatic in/out/transfer stock flow, loan requests with approval flow, barcode/QR codes with camera scanning, maintenance, notifications, and Excel reports.',
    tags: ['Laravel 11', 'MySQL', 'Blade', 'Tailwind', 'Alpine.js', 'Chart.js'],
    link: 'https://github.com/denipurwanto10/inventaris_app',
    language: 'PHP',
    category: 'Backend',
  },
  {
    title: 'Wisma Reservasi — Hotel Management System',
    description:
      'A professional PMS-style hotel management app — 5 roles, booking calendar, housekeeping, multi-payment with automatic invoices, promos, loyalty points, guest reviews, and an installable PWA.',
    tags: ['Next.js', 'MySQL', 'PWA', 'Role-Based Access'],
    link: 'https://github.com/denipurwanto10/reservasi_hotel',
    language: 'JavaScript',
    category: 'Full-Stack',
  },
  {
    title: 'Pasarku — Multi-Vendor E-Commerce',
    description:
      'A multi-seller Laravel marketplace — buyers (catalog, search/filter, cart, checkout, order history) and sellers (store dashboard, product CRUD with images, order status management).',
    tags: ['Laravel 11', 'MySQL', 'Tailwind CSS'],
    link: 'https://github.com/denipurwanto10/Pasarku_Ecommerce',
    language: 'PHP',
    category: 'Backend',
  },
  {
    title: 'Attendance App',
    description:
      'A web-based employee attendance app — login and logout, dashboard, user and department management, clock-in and clock-out, attendance history, and reports.',
    tags: ['Laravel', 'PHP', 'MySQL', 'Bootstrap'],
    link: 'https://github.com/denipurwanto10/absensi-app',
    language: 'PHP',
    category: 'Backend',
  },
  {
    title: 'MandiriNewsApps',
    description:
      'A Kotlin Android news app — article lists from a REST API, categories (tech, business, sports), illustrated article details, and modern navigation. A Mandiri x Rakamin Academy project.',
    tags: ['Kotlin', 'Android SDK', 'Gradle', 'REST API'],
    link: 'https://github.com/denipurwanto10/MandiriNewsApps',
    language: 'Kotlin',
    category: 'Mobile',
  },
  {
    title: 'Portfolio V2',
    description:
      'A modern interactive developer portfolio — responsive project showcase, experience timeline, skills overview, animations (Framer Motion, GSAP), 3D elements (Three.js), and a contact section.',
    tags: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Three.js'],
    link: 'https://github.com/denipurwanto10/Portfolio-V2',
    language: 'TypeScript',
    category: 'Frontend',
  },
  {
    title: 'Visualisasi Pipa Sumur Bor',
    description:
      'An interactive web app for visualizing borewell construction — pipes, screens, open hole, and groundwater level on a proportional canvas, plus technical data forms and photo documentation.',
    tags: ['Vite', 'React', 'Tailwind CSS'],
    link: 'https://github.com/denipurwanto10/visualisasi_pipa',
    demo: 'https://visualisasi-pipa.vercel.app',
    language: 'JavaScript',
    category: 'Web App',
  },
  {
    title: 'Deteksi Diabetes ML',
    description:
      'A simple machine learning model for diabetes prediction — Logistic Regression on medical parameters (glucose, blood pressure, BMI, age) with positive/negative prediction output.',
    tags: ['Python', 'scikit-learn', 'Pandas', 'NumPy', 'Jupyter'],
    link: 'https://github.com/denipurwanto10/Tugas-ML-Deteksi-Diabetes',
    language: 'Python',
    category: 'Desktop & AI',
  },
  {
    title: 'PPDB Flutter',
    description:
      'A Flutter mobile app for new student admissions (PPDB) — auth, role-based dashboards, student data management with search/filter, grade input, and automatic selection.',
    tags: ['Flutter', 'Dart', 'Firebase'],
    link: 'https://github.com/denipurwanto10/PPDB-Flutter',
    language: 'Dart',
    category: 'Mobile',
  },
  {
    title: 'GIS Penduduk',
    description:
      'A web-based geospatial population information system — interactive Leaflet.js maps, resident CRUD, dynamic filters (RT/RW, gender, status), statistics, and a MySQL database.',
    tags: ['PHP', 'MySQL', 'Leaflet.js', 'JavaScript'],
    link: 'https://github.com/denipurwanto10/GisPenduduk',
    language: 'PHP',
    category: 'Full-Stack',
  },
  {
    title: 'PetClinic',
    description:
      'A web-based veterinary clinic management app — pet, doctor, and owner data management, visit scheduling, fast search, and a responsive Bootstrap interface.',
    tags: ['PHP', 'MySQL', 'Bootstrap', 'JavaScript'],
    link: 'https://github.com/denipurwanto10/Petclinic',
    language: 'PHP',
    category: 'Backend',
  },
  {
    title: 'Catshop',
    description:
      'A PHP-based online shop web app for cat products — catalog, cart, checkout, and product management with a MySQL database.',
    tags: ['PHP', 'MySQL', 'HTML', 'CSS'],
    link: 'https://github.com/denipurwanto10/Catshop',
    language: 'PHP',
    category: 'Backend',
  },
  {
    title: 'Menu Restoran',
    description:
      'A Java desktop app for restaurant menu management — secure login/registration, category and menu CRUD, and MySQL integration via JDBC with a Swing interface.',
    tags: ['Java', 'Swing', 'MySQL', 'JDBC'],
    link: 'https://github.com/denipurwanto10/MenuRestoran',
    language: 'Java',
    category: 'Desktop & AI',
  },
]

export const experiences: ExperienceItem[] = [
  {
    year: 'Dec 2025 — Jun 2026',
    role: 'Full Stack Developer (Pranata Komputer)',
    company: 'Center for Groundwater and Environmental Geology',
    description:
      'Developed digital solutions for laboratory management, equipment borrowing services, and geospatial data visualization to support operational and technical teams',
    type: 'Internship',
    active: false,
    image: '/experience/esdm1-nobg.webp',
    tags: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Leaflet.js', 'Laravel', 'MySQL', 'Tailwind CSS'],
    achievements: [
      'Developed a Laravel-based laboratory management application to digitize data management and equipment borrowing processes, replacing manual paper-based workflows',
      'Built an internal Next.js application to support the digitalization of equipment borrowing and lending services',
      'Developed a geospatial visualization and web mapping system for borewell data using Leaflet.js, providing interactive information to technical teams',
    ],
  },
  {
    year: 'Nov 2025 — Dec 2025',
    role: 'Project-Based Intern: Mobile Apps Developer',
    company: 'Bank Mandiri - Rakamin Academy',
    description:
      'Developed an Android application as part of the Bank Mandiri x Rakamin Academy Virtual Internship Experience, focusing on API integration, data handling, and mobile UI/UX implementation',
    type: 'Internship',
    active: false,
    image: '/experience/mandiri.jpg',
    tags: ['Kotlin', 'REST API', 'UI/UX', 'Gradle'],
    achievements: [
      'Developed an Android application by integrating a REST API to retrieve and display data dynamically',
      'Applied basic UI/UX principles to create a functional and user-friendly mobile application interface',
      'Implemented JSON parsing to process and display data retrieved from the API',
      'Completed a final project evaluated by Bank Mandiri through the Rakamin Academy Virtual Internship Experience',
    ],
  },
  {
    year: 'Jan 2025 — Jun 2025',
    role: 'Full Stack Developer',
    company: 'Department of Trade and Industry - Bandung Regency',
    // A7: deskripsi sebelumnya copy-paste identik dengan pengalaman
    // laboratorium/geospasial sumur bor di atas — diperbaiki sesuai
    // tags & achievements (UMKM, CodeIgniter, QGIS/Leaflet).
    description:
      'Developed an MSME information system with interactive geospatial mapping to improve data management and presentation for the trade and industry office',
    type: 'Internship',
    active: false,
    image: '/experience/pemkab-nobg.webp',
    tags: ['Codeigniter', 'Bootstrap', 'MySQL', 'QGIS', 'Leaflet.js', 'Node.js', 'Express.js'],
    achievements: [
      'Developed a web-based MSME information system that improved data management and presentation efficiency by up to 40%',
      'Integrated Leaflet.js and QGIS to build interactive geospatial maps for visualizing and mapping MSME data',
      'Developed RESTful APIs using Node.js and parameterized queries to enhance data security and data integrity',
    ],
  },
  {
    year: 'Aug 2022 — Jul 2024',
    role: 'Laboratory Assistant',
    company: 'Langlangbuana University',
    description:
      'Supported programming and database laboratory activities by guiding students, developing practicum materials, and maintaining laboratory infrastructure',
    type: 'Contract',
    active: false,
    image: '/experience/unla-nobg.webp',
    tags: ['Codeigniter', 'MySQL', 'Bootstrap', 'Tailwind CSS'],
    achievements: [
      'Guided 50+ students through programming and database practicums, covering Algorithms, Database Systems, Basic Web Development, and Web Frameworks',
      'Designed and developed practicum modules and learning materials aligned with the academic curriculum',
      'Coordinated practicum sessions each semester, from preparation and implementation to student evaluation',
      'Maintained laboratory computers, software, and supporting systems to ensure smooth practicum activities',
    ],
  },
]

export const stack = [
  'React',
  'TypeScript',
  'Next.js',
  'Laravel',
  'Node.js',
  'Express',
  'PostgreSQL',
  'MongoDB',
  'Tailwind CSS',
  'Leaflet.js',
  'QGIS',
  'REST API',
  'Git',
  'Figma',
]
