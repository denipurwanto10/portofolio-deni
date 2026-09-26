import { useEffect } from 'react'

export type SiteLanguage = 'en' | 'id'

const LANGUAGE_STORAGE_KEY = 'portfolio-language'
const LANGUAGE_EVENT = 'portfolio-language-change'

/**
 * Kamus terjemahan manual.
 *
 * Tidak memakai Google Translate/API eksternal. Semua pasangan kalimat
 * ditulis dan dikontrol langsung di source code proyek.
 */
const translations: Record<string, string> = {
  // Navigation / common UI
  Dashboard: 'Beranda',
  Experience: 'Pengalaman',
  Projects: 'Proyek',
  'Awards & Certs': 'Penghargaan & Sertifikat',
  'Tech Stack': 'Teknologi',
  Contact: 'Kontak',
  Community: 'Komunitas',
  Blog: 'Blog',
  MENU: 'MENU',
  'DESIGNED & BUILT BY': 'DIRANCANG & DIBUAT OLEH',
  'All Rights Reserved.': 'Hak Cipta Dilindungi.',
  'Full Stack Developer': 'Pengembang Full Stack',
  'Full Stack Developer with 2+ year of experience building web applications and geospatial information systems for government agencies and educational institutions. Experienced in using Next.js, Laravel, Node.js, Leaflet.js, and QGIS, as well as integrating REST APIs and developing interactive data visualizations. Focused on building efficient, scalable, and user-friendly solutions, with experience improving data management efficiency by up to 40%. Familiar with AI-assisted coding tools to accelerate development, improve productivity, and support problem-solving throughout the software development process.':
    'Pengembang Full Stack dengan pengalaman lebih dari 2 tahun dalam membangun aplikasi web dan sistem informasi geospasial untuk instansi pemerintah dan lembaga pendidikan. Berpengalaman menggunakan Next.js, Laravel, Node.js, Leaflet.js, dan QGIS, serta mengintegrasikan REST API dan mengembangkan visualisasi data interaktif. Berfokus pada pembangunan solusi yang efisien, skalabel, dan mudah digunakan, dengan pengalaman meningkatkan efisiensi pengelolaan data hingga 40%. Terbiasa menggunakan alat bantu coding berbasis AI untuk mempercepat pengembangan, meningkatkan produktivitas, dan mendukung pemecahan masalah selama proses pengembangan perangkat lunak.',
  'Switch to English': 'Beralih ke Bahasa Inggris',
  'Ganti ke Bahasa Indonesia': 'Ganti ke Bahasa Indonesia',

  // Page headings
  'A collection of work from GitHub': 'Kumpulan karya dari GitHub',
  'Search projects...': 'Cari proyek...',
  'Filter projects by category': 'Filter proyek berdasarkan kategori',
  'No projects found': 'Proyek tidak ditemukan',
  'Awards and Certification.': 'Penghargaan dan Sertifikasi.',
  'Technologies and tools I use to build performant and scalable digital products.':
    'Teknologi dan alat yang saya gunakan untuk membangun produk digital yang cepat dan mudah dikembangkan.',
  'Technology categories': 'Kategori teknologi',
  'Get in touch for collaboration.': 'Hubungi saya untuk kolaborasi.',
  'Learning notes and technology insights.': 'Catatan pembelajaran dan wawasan teknologi.',
  'Organizations and community contributions.':
    'Organisasi dan kontribusi komunitas.',
  'Career journey, organizations, and leadership roles.':
    'Perjalanan karier, organisasi, dan peran kepemimpinan.',
  Achievement: 'Pencapaian',

  // Project titles
  'Bandung Regency MSME Portal': 'Portal UMKM Kabupaten Bandung',
  'Formatra Convert': 'Formatra Convert',
  'Disaster Monitoring Indonesia': 'Disaster Monitoring Indonesia',
  'Gudang.in — Office Inventory & Assets': 'Gudang.in — Inventaris & Aset Kantor',
  'PC Control — Multimodal Desktop Controller': 'PC Control — Multimodal Desktop Controller',
  'Placement Test Engine': 'Placement Test Engine',
  'Wisma Reservasi — Hotel Management System': 'Wisma Reservasi — Sistem Manajemen Hotel',
  'Pasarku — Multi-Vendor E-Commerce': 'Pasarku — E-Commerce Multi Penjual',
  'Attendance App': 'Aplikasi Absensi',
  'MandiriNewsApps': 'MandiriNewsApps',
  'Portfolio V2': 'Portfolio V2',
  'Borewell Pipe Visualization': 'Visualisasi Pipa Sumur Bor',
  'Measurement Track — Survey Route App': 'Lintasan Pengukuran — Aplikasi Rute Survei',
  'Diabetes Detection ML': 'Deteksi Diabetes ML',
  'PPDB Flutter — Student Admissions': 'PPDB Flutter — Penerimaan Siswa Baru',
  'Population GIS': 'GIS Penduduk',
  'PetClinic': 'PetClinic',
  'Catshop': 'Catshop',
  'Restaurant Menu': 'Menu Restoran',

  // Localized dates
  'Dec 2025 — Jun 2026': 'Des 2025 — Jun 2026',
  'Nov 2025 — Dec 2025': 'Nov 2025 — Des 2025',
  'Jan 2025 — Jun 2025': 'Jan 2025 — Jun 2025',
  'Aug 2022 — Jul 2024': 'Agu 2022 — Jul 2024',
  'Jun 2025 — Nov 2025': 'Jun 2025 — Nov 2025',
  'Aug 2024 — Jun 2025': 'Agu 2024 — Jun 2025',
  'Jun 2024 — Aug 2024': 'Jun 2024 — Agu 2024',
  'June 2026': 'Juni 2026',
  'May 2024': 'Mei 2024',
  'October 2023': 'Oktober 2023',
  'July 2024': 'Juli 2024',
  'July 2023': 'Juli 2023',

  // Dashboard
  'Secure Document Viewer': 'Penampil Dokumen Aman',
  'Download PDF': 'Unduh PDF',
  'Preview resume': 'Pratinjau CV',
  'Close preview': 'Tutup pratinjau',
  'MY TIME': 'WAKTU SAYA',
  Now: 'Sekarang',
  "What's this?": 'Apa ini?',
  "what's this?": 'apa ini?',
  Total: 'Total',
  Less: 'Lebih sedikit',
  More: 'Lebih banyak',
  Updated: 'Diperbarui',
  'As of': 'Per',
  'Longest streak': 'Streak terpanjang',
  'Showing cached contributions': 'Menampilkan kontribusi tersimpan',
  'Learn how we count contributions': 'Pelajari cara kami menghitung kontribusi',
  'GitHub contributions': 'Kontribusi GitHub',
  'GitHub contributions error:': 'Kesalahan kontribusi GitHub:',
  'GitHub returned no contribution data': 'GitHub tidak mengembalikan data kontribusi',
  'Contribution activity': 'Aktivitas kontribusi',
  'contributions on': 'kontribusi pada',

  // Additional UI translations
  'Currently open to': 'Saat ini terbuka untuk',
  'Open for freelance, part-time, and collaboration opportunities in Web Development.': 'Terbuka untuk kesempatan freelance, paruh waktu, dan kolaborasi dalam Pengembangan Web.',
  'full-time roles': 'posisi penuh waktu',
  'Ministry of Manpower of the Republic of Indonesia': 'Kementerian Ketenagakerjaan Republik Indonesia',
  'Langlangbuana University': 'Universitas Langlangbuana',
  'Muhammadiyah University of Sukabumi': 'Universitas Muhammadiyah Sukabumi',
  'Open to work': 'Terbuka untuk bekerja',
  'YOUR TIME': 'WAKTU ANDA',
  'Close theme picker': 'Tutup pemilih tema',
  'Open theme picker': 'Buka pemilih tema',
  'Switch to dark mode': 'Beralih ke mode gelap',
  'Switch to light mode': 'Beralih ke mode terang',
  'Open menu': 'Buka menu',
  'Close menu': 'Tutup menu',
  'sidebar open': 'bilah sisi terbuka',
  'Available for Projects': 'Tersedia untuk Proyek',
  'Search projects': 'Cari proyek',
  'Live chat': 'Obrolan langsung',
  'Open live chat': 'Buka obrolan langsung',
  'Close live chat': 'Tutup obrolan langsung',
  'Sign out': 'Keluar',
  'Sign in to join the conversation.': 'Masuk untuk bergabung dalam percakapan.',
  'Sign in to reply': 'Masuk untuk membalas',
  'Sign in with Google': 'Masuk dengan Google',
  'Signing in...': 'Sedang masuk...',
  'Opening Google sign-in...': 'Membuka proses masuk Google...',
  'Chat with me in realtime': 'Ngobrol dengan saya secara langsung',
  'Reply': 'Balas',
  'Cancel reply': 'Batalkan balasan',
  'Send message': 'Kirim pesan',
  'Type a message': 'Ketik pesan',
  'Type a message...': 'Ketik pesan...',
  'No messages yet — say hi! 👋': 'Belum ada pesan — sapa dulu! 👋',
  'Replying to': 'Membalas',
  '(message deleted)': '(pesan dihapus)',
  '(original message not loaded)': '(pesan asli tidak dimuat)',
  'Sign-in failed. Please try again.': 'Gagal masuk. Silakan coba lagi.',
  'Sign-out failed. Please try again.': 'Gagal keluar. Silakan coba lagi.',
  'Message failed to send. Check Firestore rules and try again.': 'Pesan gagal dikirim. Periksa aturan Firestore dan coba lagi.',
  'You': 'Anda',
  'Popup blocked by your browser. Please allow popups for this site and try again.': 'Popup diblokir oleh browser. Izinkan popup untuk situs ini lalu coba lagi.',

  // Experience
  Internship: 'Magang',
  Contract: 'Kontrak',
  'KEY ACHIEVEMENTS & RESPONSIBILITIES': 'PENCAPAIAN & TANGGUNG JAWAB UTAMA',
  'View Achievement Details': 'Lihat Detail Pencapaian',
  'Hide Achievement Details': 'Sembunyikan Detail Pencapaian',
  'Sembunyikan Detail': 'Sembunyikan Detail',

  // Project categories
  All: 'Semua',
  'Web App': 'Aplikasi Web',
  'Full-Stack': 'Full-Stack',
  'Desktop & AI': 'Desktop & AI',
  Frontend: 'Frontend',
  Backend: 'Backend',
  Mobile: 'Mobile',
  'Backend & DB': 'Backend & Basis Data',
  'Data Science': 'Sains Data',
  'Design & Tools': 'Desain & Alat',
  'Clear search': 'Hapus pencarian',
  Search: 'Cari',
  'View Demo': 'Lihat Demo',
  Code: 'Kode',

  // Tech descriptions/categories
  'Building interactive user interfaces': 'Membangun antarmuka pengguna interaktif',
  'Typed JavaScript for scalable apps': 'JavaScript bertipe untuk aplikasi yang mudah dikembangkan',
  'Production-ready React framework': 'Framework React siap produksi',
  'Modern framework for content-driven websites': 'Framework modern untuk situs berbasis konten',
  'Progressive framework for web interfaces': 'Framework progresif untuk antarmuka web',
  'Fast build tool for modern web apps': 'Build tool cepat untuk aplikasi web modern',
  'Utility-first responsive styling': 'Styling responsif berbasis utility',
  'Dynamic language for web applications': 'Bahasa dinamis untuk aplikasi web',
  'Responsive frontend component framework': 'Framework komponen frontend responsif',
  'Interactive maps and geospatial web applications':
    'Peta interaktif dan aplikasi web geospasial',
  'JavaScript runtime for backend services': 'Runtime JavaScript untuk layanan backend',
  'Open source backend platform': 'Platform backend open source',
  'Relational database for production apps': 'Basis data relasional untuk aplikasi produksi',
  'Relational database for web applications': 'Basis data relasional untuk aplikasi web',
  'PHP framework for web applications': 'Framework PHP untuk aplikasi web',
  'Lightweight PHP framework for web applications':
    'Framework PHP ringan untuk aplikasi web',
  'Backend services for modern applications': 'Layanan backend untuk aplikasi modern',
  'Data processing & scripting logic': 'Pemrosesan data dan logika scripting',
  'Complex data manipulation pipelines': 'Pipeline manipulasi data kompleks',
  'Machine learning & predictive models': 'Machine learning dan model prediktif',
  'Interactive notebook development': 'Pengembangan notebook interaktif',
  'Interface design and prototyping': 'Desain antarmuka dan pembuatan prototipe',
  'Version control and collaboration': 'Kontrol versi dan kolaborasi',
  'Code hosting and collaboration platform': 'Platform hosting kode dan kolaborasi',
  'Code editor for modern application development':
    'Editor kode untuk pengembangan aplikasi modern',
  'API testing and development platform': 'Platform pengujian dan pengembangan API',
  'Containerization platform for application deployment':
    'Platform containerization untuk deployment aplikasi',
  'Cloud platform for frontend deployment': 'Platform cloud untuk deployment frontend',
  'Web infrastructure and edge network platform':
    'Platform infrastruktur web dan jaringan edge',
  'Geospatial analysis and mapping': 'Analisis geospasial dan pemetaan',
  'Smart AI router for 60+ providers':
    'Router AI pintar untuk 60+ penyedia',
  'Self-improving AI coding agent': 'Agen coding AI yang belajar sendiri',

  // Contact
  Email: 'Email',
  'Bandung, West Java': 'Bandung, Jawa Barat',
  'Social Media': 'Media Sosial',
  'UTC+7 (WIB)': 'UTC+7 (WIB)',

  // Awards
  CERTS: 'SERTIFIKAT',
  AWARD: 'PENGHARGAAN',
  ORGANIZER: 'PENYELENGGARA',
  'Previous image': 'Gambar sebelumnya',
  'Next image': 'Gambar berikutnya',
  'Preview achievement image': 'Pratinjau gambar pencapaian',

  // Projects — descriptions
  'An all-in-one document toolkit web app — convert, merge, split, compress, protect, and edit PDF, Word, Excel, PowerPoint, and images, all running in the browser with an optional LibreOffice backend.':
    'Aplikasi web toolkit dokumen serbaguna — mengonversi, menggabungkan, memisahkan, mengompres, melindungi, dan mengedit PDF, Word, Excel, PowerPoint, serta gambar, semuanya berjalan di browser dengan backend LibreOffice opsional.',
  'Realtime Indonesian disaster monitoring — BMKG earthquakes, MAGMA volcanic activity, weather and InaTEWS tsunami alerts with interactive maps, an Express REST API plus realtime Socket.IO and a MySQL database.':
    'Pemantauan bencana Indonesia secara realtime — gempa BMKG, aktivitas vulkanik MAGMA, cuaca, dan peringatan tsunami InaTEWS dengan peta interaktif, Express REST API, Socket.IO realtime, serta database MySQL.',
  'Control a Windows PC with hand gestures (webcam), Indonesian/English voice commands, and a Telegram bot — mouse, keyboard, screenshots, and workflow automation through one safe Command Processor.':
    'Mengendalikan PC Windows dengan gestur tangan (webcam), perintah suara Bahasa Indonesia/Inggris, dan bot Telegram — mouse, keyboard, tangkapan layar, serta otomatisasi alur kerja melalui satu Command Processor yang aman.',
  'An MSME census app with an interactive map across 31 districts — catalog with filters, MSME details, Owner/Admin dashboards, verification, PDF export, and JWT login with Admin/Owner RBAC.':
    'Aplikasi pendataan UMKM dengan peta interaktif di 31 kecamatan — katalog dengan filter, detail UMKM, dasbor Pemilik/Admin, verifikasi, ekspor PDF, dan login JWT dengan RBAC Admin/Pemilik.',
  'A multi-step placement test — validated biodata form, 15 multiple-choice questions with realtime progress and localStorage autosave, results with score, level, program recommendations, and send-to-WhatsApp.':
    'Tes penempatan bertahap — formulir biodata tervalidasi, 15 soal pilihan ganda dengan progres realtime dan penyimpanan otomatis localStorage, hasil berupa skor, level, rekomendasi program, serta kirim ke WhatsApp.',
  'A Laravel inventory system — multi-warehouse, automatic in/out/transfer stock flow, loan requests with approval flow, barcode/QR codes with camera scanning, maintenance, notifications, and Excel reports.':
    'Sistem inventaris Laravel — multi-gudang, alur stok masuk/keluar/transfer otomatis, permintaan peminjaman dengan alur persetujuan, barcode/QR dengan pemindaian kamera, pemeliharaan, notifikasi, dan laporan Excel.',
  'A professional PMS-style hotel management app — 5 roles, booking calendar, housekeeping, multi-payment with automatic invoices, promos, loyalty points, guest reviews, and an installable PWA.':
    'Aplikasi manajemen hotel bergaya PMS profesional — 5 peran, kalender pemesanan, housekeeping, multi-pembayaran dengan invoice otomatis, promo, poin loyalitas, ulasan tamu, dan PWA yang dapat diinstal.',
  'A multi-seller Laravel marketplace — buyers (catalog, search/filter, cart, checkout, order history) and sellers (store dashboard, product CRUD with images, order status management).':
    'Marketplace Laravel multi-penjual — pembeli (katalog, pencarian/filter, keranjang, checkout, riwayat pesanan) dan penjual (dasbor toko, CRUD produk dengan gambar, pengelolaan status pesanan).',
  'A web-based employee attendance app — login and logout, dashboard, user and department management, clock-in and clock-out, attendance history, and reports.':
    'Aplikasi absensi karyawan berbasis web — login dan logout, dasbor, pengelolaan pengguna dan departemen, clock-in dan clock-out, riwayat absensi, serta laporan.',
  'A Kotlin Android news app — article lists from a REST API, categories (tech, business, sports), illustrated article details, and modern navigation. A Mandiri x Rakamin Academy project.':
    'Aplikasi berita Android berbasis Kotlin — daftar artikel dari REST API, kategori (teknologi, bisnis, olahraga), detail artikel bergambar, dan navigasi modern. Proyek Mandiri x Rakamin Academy.',
  'An interactive web app for visualizing borewell construction — pipes, screens, open hole, and groundwater level on a proportional canvas, plus technical data forms and photo documentation.':
    'Aplikasi web interaktif untuk memvisualisasikan konstruksi sumur bor — pipa, saringan, open hole, dan muka air tanah pada kanvas proporsional, lengkap formulir data teknis dan dokumentasi foto.',
  'A geospatial web app for planning and recording survey measurement tracks — route drawing on an interactive map, distance and track statistics, and export of measurement results.':
    'Aplikasi web geospasial untuk merencanakan dan merekam jalur pengukuran survei — penggambaran rute pada peta interaktif, statistik jarak dan lintasan, serta ekspor hasil pengukuran.',

  // Experience descriptions
  'Developed digital solutions for laboratory management, equipment borrowing services, and geospatial data visualization to support operational and technical teams':
    'Mengembangkan solusi digital untuk manajemen laboratorium, layanan peminjaman peralatan, dan visualisasi data geospasial untuk mendukung tim operasional dan teknis',
  'Developed an Android application as part of the Bank Mandiri x Rakamin Academy Virtual Internship Experience, focusing on API integration, data handling, and mobile UI/UX implementation':
    'Mengembangkan aplikasi Android sebagai bagian dari Virtual Internship Experience Bank Mandiri x Rakamin Academy, dengan fokus pada integrasi API, pengolahan data, dan implementasi UI/UX mobile',
  'Supported programming and database laboratory activities by guiding students, developing practicum materials, and maintaining laboratory infrastructure':
    'Mendukung kegiatan laboratorium pemrograman dan basis data dengan membimbing mahasiswa, mengembangkan materi praktikum, dan memelihara infrastruktur laboratorium',

  'Developed a Laravel-based laboratory management application to digitize data management and equipment borrowing processes, replacing manual paper-based workflows':
    'Mengembangkan aplikasi manajemen laboratorium berbasis Laravel untuk mendigitalisasi pengelolaan data dan proses peminjaman peralatan, menggantikan alur kerja manual berbasis kertas',
  'Built an internal Next.js application to support the digitalization of equipment borrowing and lending services':
    'Membangun aplikasi internal Next.js untuk mendukung digitalisasi layanan peminjaman dan pengembalian peralatan',
  'Developed a geospatial visualization and web mapping system for borewell data using Leaflet.js, providing interactive information to technical teams':
    'Mengembangkan sistem visualisasi geospasial dan web mapping untuk data sumur bor menggunakan Leaflet.js, sehingga memberikan informasi interaktif bagi tim teknis',
  'Developed an Android application by integrating a REST API to retrieve and display data dynamically':
    'Mengembangkan aplikasi Android dengan mengintegrasikan REST API untuk mengambil dan menampilkan data secara dinamis',
  'Applied basic UI/UX principles to create a functional and user-friendly mobile application interface':
    'Menerapkan prinsip dasar UI/UX untuk membuat antarmuka aplikasi mobile yang fungsional dan mudah digunakan',
  'Implemented JSON parsing to process and display data retrieved from the API':
    'Menerapkan parsing JSON untuk memproses dan menampilkan data yang diperoleh dari API',
  'Completed a final project evaluated by Bank Mandiri through the Rakamin Academy Virtual Internship Experience':
    'Menyelesaikan proyek akhir yang dievaluasi oleh Bank Mandiri melalui Virtual Internship Experience Rakamin Academy',
  'Developed a web-based MSME information system that improved data management and presentation efficiency by up to 40%':
    'Mengembangkan sistem informasi UMKM berbasis web yang meningkatkan efisiensi pengelolaan dan penyajian data hingga 40%',
  'Integrated Leaflet.js and QGIS to build interactive geospatial maps for visualizing and mapping MSME data':
    'Mengintegrasikan Leaflet.js dan QGIS untuk membangun peta geospasial interaktif guna memvisualisasikan dan memetakan data UMKM',
  'Developed RESTful APIs using Node.js and parameterized queries to enhance data security and data integrity':
    'Mengembangkan RESTful API menggunakan Node.js dan parameterized query untuk meningkatkan keamanan dan integritas data',
  'Guided 50+ students through programming and database practicums, covering Algorithms, Database Systems, Basic Web Development, and Web Frameworks':
    'Membimbing 50+ mahasiswa dalam praktikum pemrograman dan basis data, mencakup Algoritma, Sistem Basis Data, Dasar Pengembangan Web, dan Web Framework',
  'Designed and developed practicum modules and learning materials aligned with the academic curriculum':
    'Merancang dan mengembangkan modul praktikum serta materi pembelajaran yang selaras dengan kurikulum akademik',
  'Coordinated practicum sessions each semester, from preparation and implementation to student evaluation':
    'Mengoordinasikan sesi praktikum setiap semester, mulai dari persiapan dan pelaksanaan hingga evaluasi mahasiswa',
  'Maintained laboratory computers, software, and supporting systems to ensure smooth practicum activities':
    'Memelihara komputer laboratorium, perangkat lunak, dan sistem pendukung untuk memastikan kegiatan praktikum berjalan lancar',

  // Roles/types
  'Project-Based Intern: Mobile Apps Developer':
    'Magang Berbasis Proyek: Pengembang Aplikasi Mobile',
  // Varian lama (dengan suffix) tetap didukung bila muncul.
  'Project-Based Intern: Mobile Apps Developer - Mandiri x Rakamin Academy':
    'Magang Berbasis Proyek: Pengembang Aplikasi Mobile - Mandiri x Rakamin Academy',
  'Full Stack Developer (Pranata Komputer)': 'Pengembang Full Stack (Pranata Komputer)',
  'Laboratory Assistant': 'Asisten Laboratorium',
  'Department of Trade and Industry - Bandung Regency':
    'Dinas Perdagangan dan Perindustrian - Kabupaten Bandung',

  // Award labels
  'Center for Groundwater and Environmental Geology • June 2026':
    'Pusat Air Tanah dan Geologi Tata Lingkungan • Juni 2026',
  'Bank Mandiri Mobile Apps Developer • Dec 2025':
    'Pengembang Aplikasi Mobile Bank Mandiri • Des 2025',
  'Project Based Internship • December 2025':
    'Magang Berbasis Proyek • Desember 2025',
  'Project Based Internship':
    'Magang Berbasis Proyek',
  'Bank Mandiri Mobile Apps Developer':
    'Pengembang Aplikasi Mobile Bank Mandiri',
  'UNLA Anniversary • May 2024':
    'Dies Natalis UNLA • Mei 2024',
  'Hartik Competition 2023 • October 2023':
    'Kompetisi Hartik 2023 • Oktober 2023',
  'Informatics Engineering Study Program • July 2024':
    'Program Studi Teknik Informatika • Juli 2024',
  'Informatics Engineering Study Program • July 2023':
    'Program Studi Teknik Informatika • Juli 2023',

  'University Graduate Internship Program': 'Program Magang Lulusan Universitas',
  'Certificate of Competency': 'Sertifikat Kompetensi',
  'Best Performing Student in Academic Achievement':
    'Mahasiswa Berprestasi Terbaik dalam Prestasi Akademik',
  'Laboratory Assistant and Teaching Instructor':
    'Asisten Laboratorium dan Pengajar',
  'View University Graduate Internship Program image':
    'Lihat gambar Program Magang Lulusan Universitas',
  'View Bank Mandiri Mobile Apps Developer Certificate image':
    'Lihat gambar Sertifikat Pengembang Aplikasi Mobile Bank Mandiri',
  'View Project Based Internship Certificate image':
    'Lihat gambar Sertifikat Magang Berbasis Proyek',
  'View Best Performing Student in Academic Achievement image':
    'Lihat gambar Mahasiswa Berprestasi Terbaik dalam Prestasi Akademik',
  'View Hartik Competition 2023 image': 'Lihat gambar Kompetisi Hartik 2023',
  'View July 2024 Laboratory Assistant and Teaching Instructor image':
    'Lihat gambar Asisten Laboratorium dan Pengajar Juli 2024',
  'View July 2023 Laboratory Assistant and Teaching Instructor image':
    'Lihat gambar Asisten Laboratorium dan Pengajar Juli 2023',
  'Center for Groundwater and Environmental Geology':
    'Pusat Air Tanah dan Geologi Tata Lingkungan',
  'Informatics Engineering Study Program': 'Program Studi Teknik Informatika',

  // Misc. accessibility labels
  'Choose accent color': 'Pilih warna aksen',
  Theme: 'Tema',
  'Light mode': 'Mode terang',
  'Dark mode': 'Mode gelap',
}

const patterns: Array<[RegExp, (match: RegExpExecArray) => string]> = [
  [
    /^A collection of work from GitHub — (\d+) projects\.$/,
    (m) => `Kumpulan karya dari GitHub — ${m[1]} proyek.`,
  ],
  [
    /^(\d+) projects$/,
    (m) => `${m[1]} proyek`,
  ],
  [
    /^Showing (\d+) projects$/,
    (m) => `Menampilkan ${m[1]} proyek`,
  ],
  [
    /^(\d+) contributions on (.+)$/,
    (m) => `${m[1]} kontribusi pada ${m[2]}`,
  ],
  [
    /^Updated (.+)$/,
    (m) => `Diperbarui ${m[1]}`,
  ],
  [
    /^As of (.+)$/,
    (m) => `Per ${m[1]}`,
  ],
  [
    /^Longest streak: (.+)$/,
    (m) => `Rangkaian terpanjang: ${m[1]}`,
  ],
  [
    /^View (.+)$/,
    (m) => `Lihat ${m[1]}`,
  ],
]

export function translateText(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return value

  const direct = translations[normalized]
  if (direct) {
    return value.replace(normalized, direct)
  }

  for (const [pattern, replacer] of patterns) {
    const match = pattern.exec(normalized)
    if (match) return value.replace(normalized, replacer(match))
  }

  return value
}

const originalText = new WeakMap<Text, string>()
const originalAttributes = new WeakMap<Element, Map<string, string>>()

/**
 * Subtree yang ISINYA tidak diterjemahkan (konten buatan pengguna yang
 * berubah tiap detik: pesan chat, kalender kontribusi). Dilewati saat
 * walk + observer supaya mutasi high-churn tidak memicu full-body walk.
 * Struktur/tombol statis di dalamnya tetap diterjemahkan normal karena
 * pemicu (addedNodes) tetap memproses node baru di luar area ini.
 */
const SKIP_TRANSLATE_SELECTOR =
  '.chat-messages, .chat-bubble, .github-calendar, .cc-root'

function translateDom(
  language: SiteLanguage,
  scope?: ParentNode,
) {
  const root = document.body
  if (!root) return

  // Batasi ke subtree yang berubah bila diberi scope (dari observer) —
  // jauh lebih murah daripada walk seluruh body tiap mutasi.
  const walkerRoot = scope ?? root

  const walker = document.createTreeWalker(
    walkerRoot,
    NodeFilter.SHOW_TEXT,
  )
  let node: Node | null

  while ((node = walker.nextNode())) {
    const textNode = node as Text
    const parent = textNode.parentElement

    if (!parent || parent.closest('.notranslate, [translate="no"]')) continue
    if (parent.closest(SKIP_TRANSLATE_SELECTOR)) continue
    if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') continue

    const current = textNode.nodeValue ?? ''
    const knownOriginal = originalText.get(textNode)

    if (knownOriginal === undefined) {
      originalText.set(textNode, current)
    } else if (
      current !== knownOriginal &&
      current !== translateText(knownOriginal)
    ) {
      // React dapat memperbarui node teks yang sama dengan string Inggris
      // baru. Simpan string baru tersebut sebagai sumber agar terjemahan
      // tidak memakai nilai lama.
      originalText.set(textNode, current)
    }

    const source = originalText.get(textNode) ?? current
    textNode.nodeValue = language === 'id' ? translateText(source) : source
  }

  const elements = walkerRoot.querySelectorAll<HTMLElement>(
    'input, textarea, button, [aria-label], [title], img',
  )

  elements.forEach((element) => {
    if (element.closest('.notranslate, [translate="no"]')) return
    if (element.closest(SKIP_TRANSLATE_SELECTOR)) return

    let attrs = originalAttributes.get(element)
    if (!attrs) {
      attrs = new Map()
      originalAttributes.set(element, attrs)
    }

    ;['placeholder', 'aria-label', 'title', 'alt'].forEach((attribute) => {
      const value = element.getAttribute(attribute)
      if (value === null) return

      const knownOriginal = attrs!.get(attribute)
      if (
        knownOriginal === undefined ||
        (value !== knownOriginal && value !== translateText(knownOriginal))
      ) {
        attrs!.set(attribute, value)
      }

      const source = attrs!.get(attribute) ?? value
      element.setAttribute(
        attribute,
        language === 'id' ? translateText(source) : source,
      )
    })
  })

  document.documentElement.lang = language
  document.documentElement.dataset.language = language
}

export function getStoredLanguage(): SiteLanguage {
  if (typeof window === 'undefined') return 'en'
  // A10: storage bisa melempar (mode privat/pemblokir) — jangan crash boot.
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'id'
      ? 'id'
      : 'en'
  } catch {
    return 'en'
  }
}

export function setSiteLanguage(language: SiteLanguage) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Persist best-effort saja — bahasa sesi tetap diterapkan.
  }
  translateDom(language)
  window.dispatchEvent(
    new CustomEvent<SiteLanguage>(LANGUAGE_EVENT, {
      detail: language,
    }),
  )
}

export function useManualTranslation() {
  useEffect(() => {
    let language = getStoredLanguage()
    let disposed = false
    let observer: MutationObserver | null = null

    let translating = false
    let scheduled = false
    const pendingScopes: ParentNode[] = []

    const runTranslation = () => {
      if (translating) return
      translating = true
      try {
        translateDom(language)
      } finally {
        translating = false
      }
    }

    const attachObserver = () => {
      if (disposed || observer) return

      // Observe only DOM insertions/removals. Do NOT observe characterData:
      // translateDom() itself changes text nodes, which would otherwise trigger
      // this observer again and create an endless loop that freezes the page.
      //
      // Perf: terjemahkan hanya subtree yang berubah (addedNodes) — bukan
      // full-body walk tiap pesan chat masuk. Node teks konten pengguna
      // (chat/kalender) dilewati via SKIP_TRANSLATE_SELECTOR.
      observer = new MutationObserver((records) => {
        const scopes = new Set<ParentNode>()

        for (const record of records) {
          for (const node of Array.from(record.addedNodes)) {
            if (node instanceof HTMLElement) {
              // Subtree high-churn → lewati sepenuhnya.
              if (node.closest?.(SKIP_TRANSLATE_SELECTOR)) continue
              scopes.add(node)
            } else if (
              node instanceof Text &&
              node.parentElement &&
              !node.parentElement.closest?.(SKIP_TRANSLATE_SELECTOR)
            ) {
              scopes.add(node.parentElement)
            }
          }
        }

        if (scopes.size === 0) {
          // Perubahan murni di area skip (mis. pesan chat baru) —
          // tidak ada yang perlu diterjemahkan.
          return
        }

        if (scheduled || translating) {
          // Batch tertunda: tandai agar mencakup scope baru ini juga.
          pendingScopes.push(...scopes)
          return
        }

        scheduled = true
        pendingScopes.length = 0
        pendingScopes.push(...scopes)
        requestAnimationFrame(() => {
          scheduled = false
          const batch = pendingScopes.splice(0)
          translating = true
          try {
            if (batch.length === 0) {
              translateDom(language)
            } else {
              for (const scope of batch) {
                if (scope.isConnected) {
                  translateDom(language, scope)
                }
              }
            }
          } finally {
            translating = false
          }
        })
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })
    }

    // Perf/LCP: bahasa default situs adalah Inggris — tidak ada yang
    // perlu diubah saat boot bila masih 'en'. Observer dipasang
    // MALAS (idle/setelah paint) supaya first paint tidak membayar
    // biaya MutationObserver + walk awal.
    const needsBootWalk = language !== 'en'

    if (needsBootWalk) {
      runTranslation()
      attachObserver()
    } else {
      document.documentElement.lang = language
      document.documentElement.dataset.language = language

      if (
        typeof window !== 'undefined' &&
        typeof window.requestIdleCallback === 'function'
      ) {
        const idleId = window.requestIdleCallback(
          () => attachObserver(),
          { timeout: 2000 },
        )
        void idleId
      } else {
        window.setTimeout(attachObserver, 1200)
      }
    }

    const onLanguageChange = (event: Event) => {
      language = (event as CustomEvent<SiteLanguage>).detail
      attachObserver()
      translateDom(language)
    }

    window.addEventListener(LANGUAGE_EVENT, onLanguageChange)
    return () => {
      disposed = true
      observer?.disconnect()
      observer = null
      window.removeEventListener(LANGUAGE_EVENT, onLanguageChange)
    }
  }, [])
}
