export type Project = {
  title: string
  description: string
  tags: string[]
  link: string
  demo?: string
  language: string
  category: string
  images?: string[]
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
    demo: 'https://formatraa.vercel.app/',
    language: 'JavaScript',
    category: 'Web App',
    images: ['/projects/formatra1.png', '/projects/formatra2.png', '/projects/formatra3.png'],
  },
  {
    title: 'Disaster Monitoring Indonesia',
    description:
      'Realtime Indonesian disaster monitoring — BMKG earthquakes, MAGMA volcanic activity, weather and InaTEWS tsunami alerts with interactive maps, an Express REST API plus realtime Socket.IO and a MySQL database.',
    tags: ['Next.js', 'TypeScript', 'Express', 'Socket.IO', 'MySQL', 'Leaflet'],
    link: 'https://github.com/denipurwanto10/Disaster-Monitoring',
    language: 'TypeScript',
    category: 'Full-Stack',
    images: ['/projects/disaster1.png', '/projects/disaster2.png', '/projects/disaster3.png'],
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
    images: ['/projects/umkm1.png', '/projects/umkm2.png', '/projects/umkm3.png'],
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
    images: ['/projects/gudang1.png', '/projects/gudang2.png', '/projects/gudang3.png'],
  },
  {
    title: 'Wisma Reservasi — Hotel Management System',
    description:
      'A professional PMS-style hotel management app — 5 roles, booking calendar, housekeeping, multi-payment with automatic invoices, promos, loyalty points, guest reviews, and an installable PWA.',
    tags: ['Next.js', 'MySQL', 'PWA', 'Role-Based Access'],
    link: 'https://github.com/denipurwanto10/reservasi_hotel',
    language: 'JavaScript',
    category: 'Full-Stack',
    images: ['/projects/hotel1.png', '/projects/hotel2.png', '/projects/hotel3.png'],
  },
  {
    title: 'Pasarku — Multi-Vendor E-Commerce',
    description:
      'A multi-seller Laravel marketplace — buyers (catalog, search/filter, cart, checkout, order history) and sellers (store dashboard, product CRUD with images, order status management).',
    tags: ['Laravel 11', 'MySQL', 'Tailwind CSS'],
    link: 'https://github.com/denipurwanto10/Pasarku_Ecommerce',
    language: 'PHP',
    category: 'Backend',
    images: ['/projects/toko1.png', '/projects/toko2.png', '/projects/toko3.png'],
  },
  {
    title: 'Attendance App',
    description:
      'A web-based employee attendance app — login and logout, dashboard, user and department management, clock-in and clock-out, attendance history, and reports.',
    tags: ['Laravel', 'PHP', 'MySQL', 'Bootstrap'],
    link: 'https://github.com/denipurwanto10/absensi-app',
    language: 'PHP',
    category: 'Backend',
    images: ['/projects/absen1.png', '/projects/absen2.png', '/projects/absen3.png'],
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
    title: 'Borewell Pipe Visualization',
    description:
      'An interactive web app for visualizing borewell construction — pipes, screens, open hole, and groundwater level on a proportional canvas, plus technical data forms and photo documentation.',
    tags: ['Vite', 'React', 'Tailwind CSS', 'pdf-lib'],
    link: 'https://github.com/denipurwanto10/visualisasi_pipa',
    demo: 'https://visualisasi-pipa.vercel.app',
    language: 'JavaScript',
    category: 'Web App',
  },
  {
    title: 'Measurement Track — Survey Route App',
    description:
      'A geospatial web app for planning and recording survey measurement tracks — route drawing on an interactive map, distance and track statistics, and export of measurement results.',
    tags: ['Vite', 'React', 'Tailwind CSS'],
    link: 'https://github.com/denipurwanto10/lintasan-pengukuran',
    demo: 'https://lintasan-pengukuran.vercel.app',
    language: 'JavaScript',
    category: 'Web App',
  },
  {
    title: 'Diabetes Detection ML',
    description:
      'A Flask web app for diabetes prediction — KNN model on medical parameters (pregnancies, glucose, blood pressure, BMI, age) with a form input and result page.',
    tags: ['Python', 'Flask', 'scikit-learn', 'NumPy'],
    link: 'https://github.com/denipurwanto10/Tugas-ML-Deteksi-Diabetes',
    language: 'Python',
    category: 'Machine Learning',
  },
  {
    title: 'PPDB Flutter — Student Admissions',
    description:
      'A Flutter mobile app for new student admissions (PPDB) — auth, role-based dashboards, student data management with search/filter, grade input, and automatic selection.',
    tags: ['Flutter', 'Dart', 'Firebase'],
    link: 'https://github.com/denipurwanto10/PPDB-Flutter',
    language: 'Dart',
    category: 'Mobile',
  },
  {
    title: 'Population GIS',
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
    title: 'Restaurant Menu',
    description:
      'A Java desktop app for restaurant menu management — secure login/registration, category and menu CRUD, and MySQL integration via JDBC with a Swing interface.',
    tags: ['Java', 'Swing', 'MySQL', 'JDBC'],
    link: 'https://github.com/denipurwanto10/MenuRestoran',
    language: 'Java',
    category: 'Desktop',
    images: ['/projects/resto1.png', '/projects/resto2.png', '/projects/resto3.png'],
  },
]

/* Hanya proyek yang punya foto preview yang tampil di halaman
   Projects. Sumber tunggal — dipakai halaman dan asisten, jadi
   jawaban bot tidak pernah beda dengan yang terlihat di menu. */
export const featuredProjects: Project[] = projects.filter(
  (project) => project.images?.length,
)

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

/*
 * Basis rumah: 1 baris ini yang diganti tiap pindah kota.
 * MY TIME + lokasi hero ngikut otomatis — tanpa backend, tanpa GPS.
 * Contoh: 'Asia/Makassar' (WITA), 'Asia/Jayapura' (WIT),
 * 'America/New_York', 'Europe/London'.
 */
export const homeBase = {
  city: 'Bandung',
  province: 'West Java',
  country: 'Indonesia',
  timeZone: 'Asia/Jakarta',
}

/*
 * Sumber lokasi blok YOUR TIME:
 * - 'ip' (default): kota+negara dari IP geolocation — akurat untuk
 *   pengunjung asli, tapi ganti zona OS tanpa VPN tidak mengubahnya
 *   (IP-nya memang tidak pindah).
 * - 'timezone': negara dari zona IANA OS — ganti region di OS lalu
 *   refresh langsung berubah, tanpa VPN. Kota tidak ditampilkan
 *   (satu zona mencakup banyak kota, jadi kota dari zona tebakan).
 * Ganti 1 baris ini saja untuk pindah mode.
 */
export const visitorLocationSource: 'ip' | 'timezone' =
  'ip'

/*
 * Offset zona rumah untuk tanggal yang sama, dihitung lewat Intl
 * supaya DST ikut benar (mis. America/New_York geser -5/-4).
 * Dipakai Dashboard (MY TIME + hero) dan Contact (kartu lokasi).
 */
export function getHomeOffsetMinutes(
  at: Date = new Date(),
) {
  const parts: Record<string, string> = {}

  for (const part of new Intl.DateTimeFormat('en-US', {
    timeZone: homeBase.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(at)) {
    parts[part.type] = part.value
  }

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  )

  return Math.round((asUtc - at.getTime()) / 60000)
}

export function formatGmt(offsetMinutes: number) {
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)

  return `GMT${sign}${Math.floor(abs / 60)}${
    abs % 60
      ? `:${String(abs % 60).padStart(2, '0')}`
      : ''
  }`
}

export function getHomeGmtLabel(at: Date = new Date()) {
  return formatGmt(getHomeOffsetMinutes(at))
}

/*
 * Singkatan zona Indonesia (WIB/WITA/WIT). Zona lain → null,
 * pemanggil cukup tampilkan label GMT apa adanya.
 */
export function getHomeZoneShort(): string | null {
  switch (homeBase.timeZone) {
    case 'Asia/Jakarta':
      return 'WIB'
    case 'Asia/Makassar':
      return 'WITA'
    case 'Asia/Jayapura':
      return 'WIT'
    default:
      return null
  }
}

/* Sub-label kartu lokasi Contact: "UTC+7 (WIB)" / "GMT-5". */
export function getHomeContactSubLabel(
  at: Date = new Date(),
) {
  const short = getHomeZoneShort()
  const gmt = getHomeGmtLabel(at)

  if (short) {
    return `UTC${gmt.slice(3)} (${short})`
  }

  return gmt
}

/*
 * Negara pengunjung dari zona IANA browser
 * (Intl.DateTimeFormat().resolvedOptions().timeZone).
 * Browser tidak memberi negara secara langsung — yang tersedia
 * hanya nama zona seperti "Asia/Tokyo", jadi kota diambil dari
 * segmen terakhir dan negara dicocokkan ke tabel umum di bawah.
 * Format nilai: 'English|Indonesia'; tanpa pipa = sama di
 * kedua bahasa. Zona di luar tabel tetap tampil kotanya saja.
 */
const ZONE_COUNTRY: Record<string, string> = {
  'Asia/Jakarta': 'Indonesia',
  'Asia/Pontianak': 'Indonesia',
  'Asia/Makassar': 'Indonesia',
  'Asia/Jayapura': 'Indonesia',
  'Asia/Singapore': 'Singapore|Singapura',
  'Asia/Kuala_Lumpur': 'Malaysia',
  'Asia/Kuching': 'Malaysia',
  'Asia/Brunei': 'Brunei',
  'Asia/Bangkok': 'Thailand',
  'Asia/Phnom_Penh': 'Cambodia|Kamboja',
  'Asia/Vientiane': 'Laos',
  'Asia/Yangon': 'Myanmar',
  'Asia/Ho_Chi_Minh': 'Vietnam',
  'Asia/Manila': 'Philippines|Filipina',
  'Asia/Taipei': 'Taiwan',
  'Asia/Hong_Kong': 'Hong Kong',
  'Asia/Shanghai': 'China|Tiongkok',
  'Asia/Seoul': 'South Korea|Korea Selatan',
  'Asia/Tokyo': 'Japan|Jepang',
  'Asia/Pyongyang': 'North Korea|Korea Utara',
  'Asia/Ulaanbaatar': 'Mongolia',
  'Asia/Dubai': 'United Arab Emirates|Uni Emirat Arab',
  'Asia/Qatar': 'Qatar',
  'Asia/Kuwait': 'Kuwait',
  'Asia/Riyadh': 'Saudi Arabia|Arab Saudi',
  'Asia/Jerusalem': 'Israel',
  'Asia/Amman': 'Jordan|Yordania',
  'Asia/Beirut': 'Lebanon',
  'Asia/Istanbul': 'Turkey|Turki',
  'Asia/Tehran': 'Iran',
  'Asia/Karachi': 'Pakistan',
  'Asia/Kolkata': 'India',
  'Asia/Colombo': 'Sri Lanka',
  'Asia/Dhaka': 'Bangladesh',
  'Asia/Kathmandu': 'Nepal',
  'Asia/Almaty': 'Kazakhstan',
  'Asia/Tashkent': 'Uzbekistan',
  'Asia/Baku': 'Azerbaijan',
  'Asia/Tbilisi': 'Georgia',
  'Asia/Yerevan': 'Armenia',
  'Asia/Nicosia': 'Cyprus|Siprus',
  'Europe/London': 'United Kingdom|Inggris',
  'Europe/Dublin': 'Ireland|Irlandia',
  'Europe/Lisbon': 'Portugal',
  'Europe/Madrid': 'Spain|Spanyol',
  'Europe/Paris': 'France|Prancis',
  'Europe/Brussels': 'Belgium|Belgia',
  'Europe/Amsterdam': 'Netherlands|Belanda',
  'Europe/Berlin': 'Germany|Jerman',
  'Europe/Zurich': 'Switzerland|Swiss',
  'Europe/Vienna': 'Austria',
  'Europe/Rome': 'Italy|Italia',
  'Europe/Prague': 'Czechia|Ceko',
  'Europe/Warsaw': 'Poland|Polandia',
  'Europe/Budapest': 'Hungary|Hungaria',
  'Europe/Bucharest': 'Romania|Rumania',
  'Europe/Athens': 'Greece|Yunani',
  'Europe/Helsinki': 'Finland|Finlandia',
  'Europe/Stockholm': 'Sweden|Swedia',
  'Europe/Oslo': 'Norway|Norwegia',
  'Europe/Copenhagen': 'Denmark',
  'Europe/Moscow': 'Russia|Rusia',
  'Europe/Kyiv': 'Ukraine|Ukraina',
  'Europe/Belgrade': 'Serbia',
  'Europe/Zagreb': 'Croatia|Kroasia',
  'Europe/Sofia': 'Bulgaria',
  'Europe/Riga': 'Latvia',
  'Europe/Vilnius': 'Lithuania|Lituania',
  'Europe/Tallinn': 'Estonia',
  'Atlantic/Reykjavik': 'Iceland|Islandia',
  'Atlantic/Azores': 'Portugal',
  'Atlantic/Cape_Verde': 'Cape Verde|Tanjung Verde',
  'America/New_York': 'United States|Amerika Serikat',
  'America/Chicago': 'United States|Amerika Serikat',
  'America/Denver': 'United States|Amerika Serikat',
  'America/Los_Angeles': 'United States|Amerika Serikat',
  'America/Anchorage': 'United States|Amerika Serikat',
  'America/Phoenix': 'United States|Amerika Serikat',
  'America/Detroit': 'United States|Amerika Serikat',
  'Pacific/Honolulu': 'United States|Amerika Serikat',
  'America/Toronto': 'Canada|Kanada',
  'America/Vancouver': 'Canada|Kanada',
  'America/Edmonton': 'Canada|Kanada',
  'America/Winnipeg': 'Canada|Kanada',
  'America/Halifax': 'Canada|Kanada',
  'America/St_Johns': 'Canada|Kanada',
  'America/Mexico_City': 'Mexico|Meksiko',
  'America/Bogota': 'Colombia',
  'America/Lima': 'Peru',
  'America/Santiago': 'Chile',
  'America/Sao_Paulo': 'Brazil',
  'America/Buenos_Aires': 'Argentina',
  'America/Caracas': 'Venezuela',
  'America/Havana': 'Cuba|Kuba',
  'America/Jamaica': 'Jamaica',
  'America/Panama': 'Panama',
  'America/Costa_Rica': 'Costa Rica|Kosta Rika',
  'America/El_Salvador': 'El Salvador',
  'America/Managua': 'Nicaragua|Nikaragua',
  'America/Santo_Domingo': 'Dominican Republic|Republik Dominika',
  'America/La_Paz': 'Bolivia',
  'America/Asuncion': 'Paraguay',
  'America/Montevideo': 'Uruguay',
  'America/Paramaribo': 'Suriname',
  'America/Cayenne': 'French Guiana|Guyana Prancis',
  'America/Guyana': 'Guyana',
  'America/Nuuk': 'Greenland|Greenland',
  'Africa/Cairo': 'Egypt|Mesir',
  'Africa/Lagos': 'Nigeria',
  'Africa/Nairobi': 'Kenya',
  'Africa/Johannesburg': 'South Africa|Afrika Selatan',
  'Africa/Accra': 'Ghana',
  'Africa/Addis_Ababa': 'Ethiopia',
  'Africa/Casablanca': 'Morocco|Maroko',
  'Africa/Algiers': 'Algeria|Aljazair',
  'Africa/Tunis': 'Tunisia',
  'Africa/Tripoli': 'Libya',
  'Africa/Dakar': 'Senegal',
  'Africa/Abidjan': 'Ivory Coast|Pantai Gading',
  'Africa/Dar_es_Salaam': 'Tanzania',
  'Africa/Kampala': 'Uganda',
  'Africa/Kigali': 'Rwanda',
  'Africa/Luanda': 'Angola',
  'Africa/Maputo': 'Mozambique|Mozambik',
  'Africa/Windhoek': 'Namibia',
  'Africa/Gaborone': 'Botswana',
  'Africa/Harare': 'Zimbabwe',
  'Australia/Sydney': 'Australia',
  'Australia/Melbourne': 'Australia',
  'Australia/Brisbane': 'Australia',
  'Australia/Perth': 'Australia',
  'Australia/Adelaide': 'Australia',
  'Australia/Darwin': 'Australia',
  'Pacific/Auckland': 'New Zealand|Selandia Baru',
  'Pacific/Fiji': 'Fiji',
  'Pacific/Guam': 'Guam',
  'Pacific/Port_Moresby': 'Papua New Guinea|Papua Nugini',
  'Pacific/Noumea': 'New Caledonia|Kaledonia Baru',
  'Pacific/Papeete': 'French Polynesia|Polinesia Prancis',
  'Pacific/Apia': 'Samoa',
  'Pacific/Tongatapu': 'Tonga',
  'Pacific/Majuro': 'Marshall Islands|Kepulauan Marshall',
}

export function getVisitorTimeZone(): string {
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'UTC'
    )
  } catch {
    return 'UTC'
  }
}

/*
 * Lokasi pengunjung dari IP — "kota, negara" bila lengkap, cukup
 * "negara" bila kota kosong. Primer: BigDataCloud (tanpa key,
 * terbukti akurat level kota); cadangan: ipwho.is bila primer
 * gagal; terakhir: negara dari zona OS. Selalu fetch segar tiap
 * mount (tanpa cache) supaya pindah region/VPN langsung berubah.
 * Satu-dua request ringan per buka halaman, timeout 8 detik tiap
 * sumber, gagal diam-diam. Tanpa izin GPS (tanpa prompt).
 */
export type VisitorPlace = {
  city: string
  country: string
}

async function fetchWithTimeout(
  url: string,
  timeoutMs = 8000,
): Promise<Response> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    window.clearTimeout(timer)
  }
}

export async function fetchVisitorPlace(
  language: 'en' | 'id' = 'en',
): Promise<VisitorPlace | null> {
  // Primer: BigDataCloud.
  try {
    const response = await fetchWithTimeout(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=${
        language === 'id' ? 'id' : 'en'
      }`,
    )

    if (response.ok) {
      const data = (await response.json()) as {
        city?: string
        locality?: string
        countryName?: string
      }
      const city = data.city || data.locality || ''
      const country = data.countryName || ''

      if (city || country) {
        return { city, country }
      }
    }
  } catch {
    // Lanjut ke cadangan.
  }

  // Cadangan: ipwho.is (tanpa key).
  try {
    const response = await fetchWithTimeout(
      'https://ipwho.is/?lang=en',
    )

    if (response.ok) {
      const data = (await response.json()) as {
        success?: boolean
        city?: string
        country?: string
      }

      if (data.success !== false) {
        const city = data.city || ''
        const country = data.country || ''

        if (city || country) {
          return { city, country }
        }
      }
    }
  } catch {
    return null
  }

  return null
}

/* "Japan" / "Jepang" — negara dari zona IANA. Kota dari nama
   zona TIDAK dipakai: satu zona mencakup banyak kota (mis.
   Asia/Jakarta = Jakarta, Bandung, Surabaya sekaligus), jadi
   kota dari zona selalu tebakan. Zona hanya boleh memberi
   negara; kota harus dari IP geolocation atau tidak sama sekali. */
export function getZoneCountry(
  timeZone: string,
  language: 'en' | 'id' = 'en',
): string {
  const entry = ZONE_COUNTRY[timeZone]

  if (!entry) {
    return ''
  }

  const [en, id] = entry.split('|')

  return language === 'id' ? id || en : en
}
