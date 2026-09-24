import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Bot,
  LogOut,
  MessageCircle,
  MessageSquare,
  Reply,
  SendHorizonal,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore'
import { onAuthStateChanged, type User } from 'firebase/auth'
import {
  auth,
  db,
  loginWithGoogle,
  logout,
} from '../firebase'
import { experiences, projects, stack } from '../data'

type ChatReplyTo = {
  id: string
  text: string
  name: string
  uid?: string
}

type ChatMessage = {
  id: string
  text: string
  uid: string
  name: string
  photoURL: string | null
  createdAt: Timestamp | null
  replyTo: ChatReplyTo | null
}

const MESSAGES_QUERY = query(
  collection(db, 'messages'),
  orderBy('createdAt', 'asc'),
  limit(100),
)

/**
 * Membersihkan nama yang berasal dari email.
 *
 * Contoh:
 * budi.santoso@gmail.com
 * -> Budi Santoso
 */
function resolveSenderName(rawName: unknown): string {
  if (typeof rawName !== 'string') {
    return ''
  }

  const trimmed = rawName.trim()

  if (!trimmed) {
    return ''
  }

  if (!trimmed.includes('@')) {
    return trimmed
  }

  const local = trimmed.split('@')[0] ?? ''

  const cleaned = local
    .replace(/[.\_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) {
    return trimmed
  }

  return cleaned
    .split(' ')
    .map((part) =>
      part.length > 0
        ? part[0].toUpperCase() +
          part.slice(1).toLowerCase()
        : part,
    )
    .join(' ')
}

/**
 * Nilai-nilai berikut bukan nama asli.
 */
function isPlaceholderName(value: unknown): boolean {
  if (typeof value !== 'string') {
    return true
  }

  const normalized = value.trim().toLowerCase()

  return (
    normalized === '' ||
    normalized === 'guest' ||
    normalized === 'guest (legacy)' ||
    normalized === 'someone' ||
    normalized === 'user'
  )
}

/**
 * Mendapatkan nama akun yang sedang login.
 *
 * PRIORITAS:
 * 1. Google displayName
 * 2. Email
 * 3. Profile cache jika bukan placeholder
 * 4. Fallback
 */
function resolveOwnName(
  user: User | null,
  fallback: unknown,
  profileName?: string | null,
): string {
  if (!user) {
    return 'User'
  }

  // Google displayName SELALU menjadi prioritas utama.
  if (user.displayName?.trim()) {
    return user.displayName.trim()
  }

  // Jika Google displayName belum tersedia,
  // gunakan nama dari email.
  const emailName = resolveSenderName(user.email ?? '')

  if (emailName && !isPlaceholderName(emailName)) {
    return emailName
  }

  // Profile hanya sebagai fallback.
  if (
    profileName?.trim() &&
    !isPlaceholderName(profileName)
  ) {
    return profileName.trim()
  }

  // Fallback dari data lama.
  const fallbackName = resolveSenderName(fallback)

  if (
    fallbackName &&
    !isPlaceholderName(fallbackName)
  ) {
    return fallbackName
  }

  return 'User'
}

/**
 * SATU sumber nama untuk akun sendiri.
 */
function getOwnDisplayName(
  user: User | null,
  profile?: {
    name: string | null
    uid: string | null
  } | null,
  fallback?: unknown,
): string {
  if (!user) {
    return 'User'
  }

  const profileName =
    profile?.uid === user.uid
      ? profile?.name ?? null
      : null

  return resolveOwnName(
    user,
    fallback ?? '',
    profileName,
  )
}

/**
 * Foto profil akun sendiri.
 */
function resolveOwnPhoto(
  user: User | null,
  fallback: string | null,
  profilePhoto?: string | null,
): string | null {
  if (user?.photoURL) {
    return user.photoURL
  }

  if (profilePhoto) {
    return profilePhoto
  }

  return fallback
}

/**
 * Cache nama per UID.
 *
 * Digunakan terutama untuk membantu guest
 * melihat nama pengguna yang sudah pernah terlihat.
 *
 * Agar nama tetap muncul saat logout (bahkan setelah
 * refresh), cache juga disimpan ke localStorage sebagai
 * direktori per-UID: { [uid]: { name, photoURL } }.
 * Hanya nama valid (bukan placeholder) yang disimpan,
 * jadi ganti akun tidak akan menimpa nama orang lain.
 */
const knownNames = new Map<string, string>()
const knownPhotos = new Map<string, string>()

/**
 * Direktori publik per-UID (di memori).
 * Diisi dari koleksi Firestore `userProfiles/{uid}`
 * sehingga nama tiap pengirim bisa tampil walau
 * sedang logout / ganti akun / beda perangkat.
 * Tidak pernah ditimpa nama akun yang sedang login.
 */
const publicNames = new Map<string, string>()
const publicPhotos = new Map<string, string>()

const NAME_DIRECTORY_KEY =
  'livechat-name-directory-v1'

type StoredDirectoryEntry = {
  name?: unknown
  photoURL?: unknown
}

/**
 * Direktori publik di Firestore: userProfiles/{uid}.
 * Ini KUNCI perbaikan "masih User" saat logout:
 * nama tiap UID disimpan bersama, bisa dibaca semua orang
 * (termasuk tamu yang belum login), jadi tidak bergantung
 * pada localStorage perangkat sendiri.
 */
async function upsertPublicProfile(
  uid: string,
  name: string,
  photoURL: string | null,
  email: string | null,
): Promise<void> {
  try {
    if (!uid) return

    const cleaned = resolveSenderName(name)

    if (!cleaned || isPlaceholderName(cleaned)) {
      return
    }

    await setDoc(
      doc(db, 'userProfiles', uid),
      {
        name: cleaned,
        photoURL: photoURL ?? null,
        email: email ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch {
    // Rules menolak / offline — tampilan lokal tetap jalan
    // via nama di pesan + cache perangkat.
  }
}

function readNameDirectory(): Record<
  string,
  StoredDirectoryEntry
> {
  try {
    if (typeof window === 'undefined') {
      return {}
    }

    const raw = window.localStorage.getItem(
      NAME_DIRECTORY_KEY,
    )

    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as unknown

    if (
      typeof parsed !== 'object' ||
      parsed === null
    ) {
      return {}
    }

    return parsed as Record<
      string,
      StoredDirectoryEntry
    >
  } catch {
    return {}
  }
}

function getDirectoryName(
  uid: string,
): string | null {
  if (!uid) {
    return null
  }

  const memory = knownNames.get(uid)

  if (memory) {
    return memory
  }

  const entry = readNameDirectory()[uid]

  if (
    entry &&
    typeof entry.name === 'string' &&
    !isPlaceholderName(entry.name)
  ) {
    const cleaned = resolveSenderName(
      entry.name,
    )

    if (cleaned && !isPlaceholderName(cleaned)) {
      // Promosikan ke cache memori agar
      // render berikutnya tidak baca storage lagi.
      knownNames.set(uid, cleaned)
      return cleaned
    }
  }

  return null
}

function getDirectoryPhoto(
  uid: string,
): string | null {
  if (!uid) {
    return null
  }

  const memory = knownPhotos.get(uid)

  if (memory) {
    return memory
  }

  const entry = readNameDirectory()[uid]

  if (
    entry &&
    typeof entry.photoURL === 'string' &&
    entry.photoURL
  ) {
    knownPhotos.set(uid, entry.photoURL)
    return entry.photoURL
  }

  return null
}

function persistSender(
  uid: string,
  name: string | null,
  photoURL: string | null,
) {
  try {
    if (
      typeof window === 'undefined' ||
      !uid
    ) {
      return
    }

    const cleaned =
      typeof name === 'string'
        ? resolveSenderName(name)
        : ''

    const validName =
      cleaned && !isPlaceholderName(cleaned)
        ? cleaned
        : null

    if (!validName && !photoURL) {
      return
    }

    const directory = readNameDirectory()
    const prev = directory[uid] ?? {}

    directory[uid] = {
      name:
        validName ??
        (typeof prev.name === 'string'
          ? prev.name
          : ''),
      photoURL:
        photoURL ??
        (typeof prev.photoURL === 'string'
          ? prev.photoURL
          : null),
    }

    window.localStorage.setItem(
      NAME_DIRECTORY_KEY,
      JSON.stringify(directory),
    )
  } catch {
    // Private mode — cukup cache memori.
  }
}

function rememberSender(message: {
  uid: string
  name: string
  photoURL: string | null
}) {
  if (!message.uid) {
    return
  }

  if (!isPlaceholderName(message.name)) {
    const cleaned = resolveSenderName(message.name)

    if (cleaned) {
      knownNames.set(message.uid, cleaned)
    }
  }

  if (message.photoURL) {
    knownPhotos.set(
      message.uid,
      message.photoURL,
    )
  }

  // Simpan ke direktori agar tamu yang logout
  // (atau refresh) tetap melihat nama Gmail
  // yang pernah terlihat untuk UID ini.
  persistSender(
    message.uid,
    message.name,
    message.photoURL,
  )
}

/**
 * Nama untuk sebuah pesan.
 *
 * ATURAN PALING PENTING:
 *
 * Jika UID pesan == UID user yang sedang login,
 * gunakan nama Google user tersebut.
 *
 * Jadi walaupun Firestore lama:
 *
 * name: "User"
 *
 * balon tetap:
 *
 * Deni Purwanto (You)
 *
 * Saat logout, nama tetap diambil dari direktori
 * per-UID yang tersimpan di localStorage — jadi tamu
 * tetap melihat nama Gmail yang pernah terlihat
 * untuk UID tersebut, bukan "User".
 */
function getDisplayName(
  message: ChatMessage,
  user: User | null,
  profile?: {
    name: string | null
    uid: string | null
  } | null,
): string {
  const isMine =
    !!user &&
    !!message.uid &&
    message.uid === user.uid

  /**
   * PESAN MILIK SENDIRI
   *
   * Jangan gunakan message.name.
   * Gunakan akun Google yang sedang login.
   */
  if (isMine) {
    return getOwnDisplayName(
      user,
      profile,
      '',
    )
  }

  /**
   * PESAN ORANG LAIN
   *
   * Ambil nama dari Firestore.
   */
  const stored = resolveSenderName(
    message.name,
  )

  if (
    stored &&
    !isPlaceholderName(stored)
  ) {
    return stored
  }

  /**
   * Fallback berdasarkan UID — nama Firestore dulu,
   * lalu direktori PUBLIK (antar-akun & saat logout),
   * lalu cache perangkat. Tidak pernah memakai nama
   * akun yang sedang login untuk UID lain.
   */
  if (message.uid) {
    const remembered =
      knownNames.get(message.uid) ??
      publicNames.get(message.uid) ??
      getDirectoryName(message.uid)

    if (remembered) {
      return remembered
    }
  }

  return 'User'
}

/**
 * Nama untuk quote/reply.
 */
function resolveReplyName(
  replyTo: ChatReplyTo,
  messages: ChatMessage[],
  user: User | null,
  profile?: {
    name: string | null
    uid: string | null
  } | null,
): string {
  /**
   * Kalau pesan asli masih ada,
   * ambil nama langsung dari pesan asli.
   */
  if (replyTo.id) {
    const original = messages.find(
      (message) =>
        message.id === replyTo.id,
    )

    if (original) {
      return getDisplayName(
        original,
        user,
        profile,
      )
    }
  }

  /**
   * Kalau pesan asli sudah tidak ada,
   * gunakan nama yang disimpan dalam replyTo.
   */
  const stored = resolveSenderName(
    replyTo.name,
  )

  if (
    stored &&
    !isPlaceholderName(stored)
  ) {
    return stored
  }

  /**
   * Jika replyTo memiliki UID,
   * coba ambil dari direktori publik + cache agar
   * tetap muncul saat logout / ganti akun.
   */
  if (replyTo.uid) {
    const remembered =
      knownNames.get(replyTo.uid) ??
      publicNames.get(replyTo.uid) ??
      getDirectoryName(replyTo.uid)

    if (remembered) {
      return remembered
    }
  }

  return 'User'
}

/**
 * Foto profil untuk pesan.
 */
function getDisplayPhoto(
  message: ChatMessage,
  user: User | null,
  profile?: {
    photoURL: string | null
    uid: string | null
  } | null,
): string | null {
  const isMine =
    !!user &&
    !!message.uid &&
    message.uid === user.uid

  /**
   * Pesan sendiri:
   * utamakan foto Google terbaru.
   */
  if (isMine) {
    const profilePhoto =
      profile?.uid === user.uid
        ? profile.photoURL
        : null

    return resolveOwnPhoto(
      user,
      message.photoURL,
      profilePhoto,
    )
  }

  /**
   * Pesan orang lain — foto dari pesan, lalu direktori
   * publik + cache perangkat agar tetap muncul
   * saat logout / ganti akun.
   */
  if (message.photoURL) {
    return message.photoURL
  }

  if (message.uid) {
    return (
      knownPhotos.get(message.uid) ??
      publicPhotos.get(message.uid) ??
      getDirectoryPhoto(message.uid)
    )
  }

  return null
}

function formatDateTime(
  value: Timestamp | null,
): string {
  if (!value) {
    return ''
  }

  try {
    const date = value.toDate()
    const now = new Date()

    const sameDay =
      date.getFullYear() ===
        now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()

    const time =
      date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })

    if (sameDay) {
      return `Today · ${time}`
    }

    const day =
      date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })

    return `${day} · ${time}`
  } catch {
    return ''
  }
}

/**
 * VIRTUAL ASSISTANT — bot ringan berbasis kata kunci.
 * Tidak memanggil API eksternal apa pun; semua jawaban
 * diambil dari data portfolio (data.ts) supaya selalu
 * konsisten dan tidak butuh biaya/API key.
 */
type AssistantMessage = {
  id: string
  from: 'bot' | 'user'
  text: string
}

const ASSISTANT_WELCOME: AssistantMessage = {
  id: 'welcome',
  from: 'bot',
  text: 'Halo, saya asisten virtual Deni 👋 Silakan tanya seputar proyek, pengalaman, teknologi yang dikuasai, atau cara menghubungi Deni.',
}

const ASSISTANT_QUICK_REPLIES = [
  'Tentang Deni',
  'Proyek',
  'Pengalaman',
  'Keahlian',
  'Penghargaan',
  'Kontak',
]

/**
 * Cocokkan kata kunci di awal kata (bukan di tengah kata),
 * supaya "hi" tidak ikut terpicu oleh kata seperti "achievement".
 * Awalan tetap cocok, jadi "proyeknya" tetap terdeteksi sebagai "proyek".
 * Kata kunci pendek (≤ 3 huruf, mis. "cv", "hi", "ig") harus
 * cocok utuh agar tidak salah tangkap ("ig" vs "ignore").
 */
function includesAnyKeyword(
  input: string,
  words: string[],
): boolean {
  return words.some((word) => {
    const escaped = word.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    )
    const tail = word.length <= 3 ? '($|[^a-z0-9])' : ''
    return new RegExp(
      `(^|[^a-z0-9])${escaped}${tail}`,
    ).test(input)
  })
}

const MONTHS_ID: Record<string, string> = {
  Jan: 'Jan',
  Feb: 'Feb',
  Mar: 'Mar',
  Apr: 'Apr',
  May: 'Mei',
  Jun: 'Jun',
  Jul: 'Jul',
  Aug: 'Agu',
  Sep: 'Sep',
  Oct: 'Okt',
  Nov: 'Nov',
  Dec: 'Des',
}

/** "Dec 2025 — Jun 2026" -> "Des 2025 — Jun 2026" */
function localizeYear(value: string): string {
  return value
    .replace(
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g,
      (m) => MONTHS_ID[m] ?? m,
    )
    .replace(/\bPresent\b/gi, 'Sekarang')
}

/**
 * Daftar penghargaan untuk asisten (versi Bahasa Indonesia).
 * Sumbernya sama dengan halaman Awards — kalau menambah
 * penghargaan di sana, tambahkan juga di sini.
 */
const ASSISTANT_AWARDS = [
  'Program Magang Lulusan Universitas — Pusat Air Tanah dan Geologi Lingkungan (Juni 2026)',
  'Mahasiswa Berprestasi Akademik Terbaik — HUT UNLA (Mei 2024)',
  'Juara 2 Lomba UI/UX Design — Hartik Competition 2023 (Oktober 2023)',
  'Asisten Laboratorium & Instruktur Pengajar — Prodi Teknik Informatika (Juli 2023 & Juli 2024)',
]

/**
 * Kata kunci tambahan untuk menanyakan proyek tertentu lewat
 * namanya. Kunci = awalan judul proyek di data.ts.
 * Nama lengkap proyek (sebelum tanda "—") otomatis ikut dicocokkan.
 */
const PROJECT_ALIASES: Record<string, string[]> = {
  Formatra: ['formatra', 'konversi dokumen'],
  Disaster: ['disaster', 'bencana', 'gempa'],
  'PC Control': ['pc control', 'pccontrol', 'kontrol pc'],
  Bandung: ['umkm', 'msme'],
  Placement: ['placement', 'tes penempatan'],
  Gudang: ['gudang', 'inventaris', 'inventory'],
  Wisma: ['wisma', 'reservasi', 'hotel'],
  Pasarku: ['pasarku', 'marketplace', 'e-commerce', 'ecommerce'],
  Attendance: ['attendance', 'absensi'],
  MandiriNews: ['mandirinews', 'mandiri news', 'berita'],
}

function findProjectByName(input: string) {
  return projects.find((item) => {
    const base = item.title.split('—')[0].trim().toLowerCase()
    const aliasKey = Object.keys(PROJECT_ALIASES).find((key) =>
      item.title.startsWith(key),
    )
    const words = [
      base,
      ...(aliasKey ? PROJECT_ALIASES[aliasKey] : []),
    ]
    return includesAnyKeyword(input, words)
  })
}

/** Semua nama teknologi yang muncul di data portofolio. */
function collectTechLabels(): string[] {
  const all = new Set<string>()
  projects.forEach((item) =>
    item.tags.forEach((tag) => all.add(tag)),
  )
  experiences.forEach((item) =>
    item.tags.forEach((tag) => all.add(tag)),
  )
  stack.forEach((tag) => all.add(tag))
  return Array.from(all)
}

/** "Node.js" -> ["node.js", "nodejs", "node js"] */
function techVariants(label: string): string[] {
  const lower = label.toLowerCase()
  return Array.from(
    new Set([
      lower,
      lower.replace(/[.\s]/g, ''),
      lower.replace(/\./g, ' '),
    ]),
  )
}

/** "Laravel 11" dianggap sama dengan "Laravel" (versi diabaikan). */
function sameTech(a: string, b: string): boolean {
  const clean = (value: string) =>
    value.toLowerCase().replace(/\s+\d+(\.\d+)*$/, '')
  return clean(a) === clean(b)
}

function findTechInInput(input: string): string | undefined {
  return collectTechLabels().find((label) =>
    techVariants(label).some((variant) =>
      new RegExp(
        `(^|[^a-z0-9])${variant.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        )}($|[^a-z0-9])`,
      ).test(input),
    ),
  )
}

function buildAssistantReply(rawInput: string): string {
  const input = rawInput.trim().toLowerCase()

  if (!input) {
    return 'Maaf, saya belum menangkap maksudnya. Coba tanyakan tentang proyek, pengalaman, keahlian, atau kontak.'
  }

  // Bantuan / daftar topik
  if (
    includesAnyKeyword(input, [
      'bantuan',
      'bantu',
      'help',
      'menu',
      'fitur',
      'bisa apa',
      'topik',
    ])
  ) {
    return 'Saya bisa menjawab seputar:\n• Tentang Deni\n• Proyek (bisa sebut nama proyek atau teknologi, mis. "proyek React")\n• Pengalaman & pendidikan\n• Keahlian\n• Penghargaan & sertifikat\n• Lokasi & status ketersediaan\n• Kontak, media sosial, dan CV'
  }

  // Tentang Deni
  if (
    includesAnyKeyword(input, [
      'tentang deni',
      'tentang kamu',
      'siapa deni',
      'profil',
      'profile',
      'perkenalan',
      'kenalan',
      'about',
    ])
  ) {
    return 'Deni Purwanto adalah seorang Full Stack Developer yang berbasis di Bandung, Jawa Barat. Ia berlatar Teknik Informatika, berpengalaman membangun aplikasi web dan mobile, dan saat ini terbuka untuk posisi full-time.\n\nTanyakan lebih lanjut soal proyek, pengalaman, atau keahliannya.'
  }

  // Pendidikan
  if (
    includesAnyKeyword(input, [
      'pendidikan',
      'kuliah',
      'kampus',
      'universitas',
      'jurusan',
      'prodi',
      'lulusan',
      'education',
      'sekolah',
    ])
  ) {
    return 'Deni menempuh pendidikan di Program Studi Teknik Informatika, Universitas Langlangbuana (UNLA). Selama kuliah ia menjadi asisten laboratorium dan instruktur pengajar (2022–2024), serta meraih penghargaan mahasiswa berprestasi akademik.'
  }

  // Penghargaan & sertifikat
  if (
    includesAnyKeyword(input, [
      'penghargaan',
      'sertifikat',
      'sertifikasi',
      'award',
      'prestasi',
      'juara',
      'lomba',
      'kompetisi',
      'achievement',
      'certificate',
      'cert',
    ])
  ) {
    return `Penghargaan & pencapaian Deni:\n${ASSISTANT_AWARDS.map(
      (item) => `• ${item}`,
    ).join('\n')}\n\nLihat bukti dan detailnya di halaman Penghargaan & Sertifikat.`
  }

  // Lokasi
  if (
    includesAnyKeyword(input, [
      'lokasi',
      'domisili',
      'tinggal',
      'alamat',
      'dimana',
      'di mana',
      'kota',
      'zona waktu',
      'timezone',
      'location',
    ])
  ) {
    return 'Deni berbasis di Bandung, Jawa Barat (zona waktu WIB, UTC+7).'
  }

  // Ketersediaan / rekrutmen / kolaborasi
  if (
    includesAnyKeyword(input, [
      'lowongan',
      'rekrut',
      'hire',
      'hiring',
      'full-time',
      'fulltime',
      'full time',
      'available',
      'tersedia',
      'terbuka',
      'open to',
      'kolaborasi',
      'kerja sama',
      'kerjasama',
      'tawaran',
    ])
  ) {
    return 'Deni saat ini terbuka untuk posisi full-time dan kolaborasi. Silakan hubungi lewat email denipurwanto800@gmail.com atau LinkedIn (deniiprwnt).'
  }

  // CV
  if (
    includesAnyKeyword(input, [
      'cv',
      'resume',
      'riwayat hidup',
      'curriculum',
    ])
  ) {
    return 'Kamu bisa melihat dan mengunduh CV Deni lewat halaman Beranda (tombol "Download CV").'
  }

  // Kontak & media sosial
  if (
    includesAnyKeyword(input, [
      'kontak',
      'contact',
      'email',
      'hubungi',
      'whatsapp',
      'wa',
      'linkedin',
      'github',
      'instagram',
      'ig',
      'sosmed',
      'media sosial',
      'sosial media',
    ])
  ) {
    return 'Kamu bisa menghubungi Deni lewat:\n• Email: denipurwanto800@gmail.com\n• LinkedIn: deniiprwnt\n• GitHub: denipurwanto10\n• Instagram: @deniiprwnt\n\nInfo lengkapnya ada di halaman Kontak.'
  }

  // Proyek tertentu (lewat nama)
  const namedProject = findProjectByName(input)
  if (namedProject) {
    const lines = [
      `${namedProject.title} (${namedProject.category})`,
      `Teknologi: ${namedProject.tags.join(', ')}`,
      `GitHub: ${namedProject.link}`,
    ]
    if (namedProject.demo) {
      lines.push(`Demo: ${namedProject.demo}`)
    }
    return `${lines.join('\n')}\n\nDeskripsi lengkapnya ada di halaman Proyek.`
  }

  // Teknologi tertentu (mis. "React", "Laravel", "Python")
  const tech = findTechInInput(input)
  if (tech) {
    const usedInProjects = projects.filter((item) =>
      item.tags.some((tag) => sameTech(tag, tech)),
    )
    const usedInJobs = experiences.filter((item) =>
      item.tags.some((tag) => sameTech(tag, tech)),
    )

    if (usedInProjects.length || usedInJobs.length) {
      const parts: string[] = []

      if (usedInProjects.length) {
        parts.push(
          `Deni memakai ${tech} di ${usedInProjects.length} proyek:\n${usedInProjects
            .slice(0, 5)
            .map((item) => `• ${item.title}`)
            .join('\n')}`,
        )
      }

      if (usedInJobs.length) {
        parts.push(
          `${tech} juga dipakai saat ia bekerja/magang di:\n${usedInJobs
            .slice(0, 3)
            .map((item) => `• ${item.company}`)
            .join('\n')}`,
        )
      }

      return parts.join('\n\n')
    }

    return `${tech} termasuk teknologi yang dikuasai Deni. Daftar lengkapnya ada di halaman Teknologi.`
  }

  // Proyek (umum)
  if (
    includesAnyKeyword(input, [
      'proyek',
      'project',
      'portfolio',
      'portofolio',
      'karya',
      'aplikasi',
      'website',
      'web app',
    ])
  ) {
    const top = projects
      .slice(0, 3)
      .map(
        (item) =>
          `• ${item.title} — ${item.tags.slice(0, 3).join(', ')}`,
      )
      .join('\n')

    return `Beberapa proyek terbaru Deni:\n${top}\n\nSelengkapnya ada di halaman Proyek. Kamu juga bisa menyebut nama proyek atau teknologi tertentu, mis. "Formatra" atau "proyek Laravel".`
  }

  // Pengalaman
  if (
    includesAnyKeyword(input, [
      'pengalaman',
      'experience',
      'kerja',
      'karir',
      'karier',
      'magang',
      'intern',
      'jabatan',
      'posisi',
      'work',
    ])
  ) {
    const top = experiences
      .slice(0, 3)
      .map(
        (item) =>
          `• ${item.role} — ${item.company} (${localizeYear(item.year)})`,
      )
      .join('\n')

    return `Pengalaman terbaru Deni:\n${top}\n\nDetail lengkapnya ada di halaman Pengalaman.`
  }

  // Keahlian (umum)
  if (
    includesAnyKeyword(input, [
      'keahlian',
      'skill',
      'kemampuan',
      'keterampilan',
      'kompetensi',
      'dikuasai',
      'stack',
      'teknologi',
      'tech',
      'framework',
      'database',
      'tools',
      'bahasa pemrograman',
    ])
  ) {
    return `Deni banyak bekerja dengan ${stack
      .slice(0, 10)
      .join(', ')}, dan masih banyak lagi. Daftar lengkapnya ada di halaman Teknologi.`
  }

  // Identitas bot
  if (
    includesAnyKeyword(input, [
      'siapa kamu',
      'kamu siapa',
      'siapa ini',
      'siapa anda',
      'who are you',
      'kamu bot',
      'kamu ai',
    ])
  ) {
    return 'Saya asisten virtual untuk portofolio Deni Purwanto, seorang Full Stack Developer. Tanyakan saja soal proyek, pengalaman, atau cara menghubunginya.'
  }

  // Terima kasih
  if (
    includesAnyKeyword(input, [
      'terima kasih',
      'makasih',
      'trims',
      'thanks',
      'thank you',
      'thx',
    ])
  ) {
    return 'Sama-sama! Silakan tanya lagi kalau ada yang ingin diketahui tentang portofolio ini 🙌'
  }

  // Pamit
  if (
    includesAnyKeyword(input, [
      'dadah',
      'sampai jumpa',
      'sampai ketemu',
      'bye',
      'selamat tinggal',
      'pamit',
    ])
  ) {
    return 'Sampai jumpa! Kalau ada yang ingin ditanyakan lagi, saya di sini 👋'
  }

  // Sapaan
  if (
    includesAnyKeyword(input, [
      'halo',
      'hai',
      'hi',
      'hello',
      'hey',
      'selamat',
      'assalamualaikum',
      'permisi',
    ])
  ) {
    return 'Halo juga 👋 Tanyakan apa saja tentang proyek, pengalaman kerja, teknologi, atau cara menghubungi Deni.'
  }

  return "Maaf, saya belum paham maksudnya. Coba tanyakan tentang 'proyek', 'pengalaman', 'keahlian', 'penghargaan', atau 'kontak' — atau ketik 'bantuan' untuk melihat daftar topik. Kamu juga bisa pindah ke Global Chat untuk ngobrol langsung dengan Deni."
}

/** Ubah URL di dalam jawaban bot menjadi tautan yang bisa diklik. */
function renderAssistantText(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noreferrer noopener"
        className="assistant-link"
      >
        {part}
      </a>
    ) : (
      part
    ),
  )
}

// Harus sama dengan durasi animasi keluar panel di styles.css.
const CHAT_EXIT_MS = 180

export default function LiveChat() {
  const [open, setOpen] =
    useState(false)

  const [closing, setClosing] =
    useState(false)

  const closeTimer =
    useRef<number | undefined>(undefined)

  // Tutup panel dengan animasi keluar (bukan langsung hilang).
  const closeChat = useCallback(() => {
    setClosing(true)

    window.clearTimeout(closeTimer.current)

    closeTimer.current = window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, CHAT_EXIT_MS)
  }, [])

  useEffect(
    () => () => window.clearTimeout(closeTimer.current),
    [],
  )

  // Tab aktif di dalam panel chat: asisten virtual (default)
  // atau Global Chat (room realtime Firebase yang sudah ada).
  const [activeChatTab, setActiveChatTab] = useState<
    'assistant' | 'global'
  >('assistant')

  const [assistantMessages, setAssistantMessages] = useState<
    AssistantMessage[]
  >([ASSISTANT_WELCOME])

  const [assistantDraft, setAssistantDraft] = useState('')
  const [assistantTyping, setAssistantTyping] = useState(false)
  const assistantBottomRef = useRef<HTMLDivElement | null>(null)
  const assistantTimer = useRef<number | undefined>(undefined)

  useEffect(
    () => () => window.clearTimeout(assistantTimer.current),
    [],
  )

  useEffect(() => {
    assistantBottomRef.current?.scrollIntoView({
      block: 'end',
    })
  }, [assistantMessages, assistantTyping])

  const sendAssistantMessage = useCallback(
    (textOverride?: string) => {
      const text = (
        textOverride ?? assistantDraft
      ).trim()

      if (!text) {
        return
      }

      setAssistantMessages((prev) => [
        ...prev,
        {
          id: `u-${Date.now()}`,
          from: 'user',
          text,
        },
      ])

      setAssistantDraft('')
      setAssistantTyping(true)

      window.clearTimeout(assistantTimer.current)

      assistantTimer.current = window.setTimeout(
        () => {
          setAssistantMessages((prev) => [
            ...prev,
            {
              id: `b-${Date.now()}`,
              from: 'bot',
              text: buildAssistantReply(text),
            },
          ])
          setAssistantTyping(false)
        },
        500,
      )
    },
    [assistantDraft],
  )

  const clearAssistantConversation = useCallback(() => {
    window.clearTimeout(assistantTimer.current)
    setAssistantTyping(false)
    setAssistantMessages([ASSISTANT_WELCOME])
  }, [])

  // Scroll pertama kali (riwayat pesan dimuat) langsung ke bawah;
  // smooth hanya untuk pesan baru — menggulir dari atas ke bawah
  // di seluruh riwayat terasa lambat dan patah-patah.
  const initialScrollDone = useRef(false)

  const [user, setUser] =
    useState<User | null>(
      auth.currentUser,
    )

  const [profile, setProfile] =
    useState<{
      name: string
      photoURL: string | null
      email: string | null
      uid: string | null
    } | null>(null)

  /**
   * Dipakai hanya untuk memaksa render ulang saat
   * direktori nama (userProfiles / localStorage)
   * kedatangan data baru — karena cache-nya
   * module-level (Map), bukan state.
   */
  const [, setDirectoryTick] =
    useState(0)

  const [authBusy, setAuthBusy] =
    useState(false)

  const [authError, setAuthError] =
    useState<string | null>(null)

  const [messages, setMessages] =
    useState<ChatMessage[]>([])

  const [loadingMessages, setLoadingMessages] =
    useState(true)

  const [draft, setDraft] =
    useState('')

  const [sending, setSending] =
    useState(false)

  const [sendError, setSendError] =
    useState<string | null>(null)

  const [replyTo, setReplyTo] =
    useState<ChatReplyTo | null>(null)

  const inputRef =
    useRef<HTMLInputElement | null>(null)

  const bottomRef =
    useRef<HTMLDivElement | null>(null)

  /**
   * AUTH STATE
   */
  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (nextUser) => {
          setUser(nextUser)

          if (!nextUser) {
            return
          }

          const syncProfile =
            async () => {
              try {
                await nextUser.reload()
              } catch {
                // Gunakan data yang tersedia.
              }

              const current =
                auth.currentUser ??
                nextUser

              /**
               * Google displayName adalah
               * sumber utama.
               */
              const rawName =
                current.displayName ??
                current.providerData.find(
                  (info) =>
                    !!info.displayName,
                )?.displayName ??
                current.email ??
                current.providerData.find(
                  (info) =>
                    !!info.email,
                )?.email ??
                ''

              const name =
                resolveSenderName(
                  rawName,
                )

              const photoURL =
                current.photoURL ??
                current.providerData.find(
                  (info) =>
                    !!info.photoURL,
                )?.photoURL ??
                null

              if (name) {
                const nextProfile = {
                  name,
                  photoURL,
                  email:
                    current.email ?? null,
                  uid: current.uid,
                }

                setProfile(
                  nextProfile,
                )

                /**
                 * Cache profil + direktori per-UID agar
                 * nama sendiri tetap muncul saat logout.
                 */
                try {
                  window.localStorage.setItem(
                    'livechat-profile',
                    JSON.stringify(
                      nextProfile,
                    ),
                  )
                } catch {
                  // Abaikan jika storage tidak tersedia.
                }

                persistSender(
                  current.uid,
                  name,
                  photoURL,
                )

                /**
                 * KUNCI: simpan nama tiap UID ke direktori
                 * publik `userProfiles/{uid}` — sekali login,
                 * nama itu bisa dibaca SEMUA orang (termasuk
                 * tamu logout & perangkat lain), jadi tidak
                 * akan tampil "User" lagi.
                 */
                void upsertPublicProfile(
                  current.uid,
                  name,
                  photoURL,
                  current.email ?? null,
                )
              }
            }

          void syncProfile()
        },
      )

    /**
     * Load profile cache.
     */
    try {
      const raw =
        window.localStorage.getItem(
          'livechat-profile',
        )

      if (raw) {
        const saved =
          JSON.parse(raw) as {
            name?: unknown
            photoURL?: unknown
            email?: unknown
            uid?: unknown
          }

        if (
          typeof saved.name ===
          'string'
        ) {
          setProfile({
            name: saved.name,
            photoURL:
              typeof saved.photoURL ===
              'string'
                ? saved.photoURL
                : null,
            email:
              typeof saved.email ===
              'string'
                ? saved.email
                : null,
            uid:
              typeof saved.uid ===
              'string'
                ? saved.uid
                : null,
          })
        }
      }
    } catch {
      // Cache rusak → abaikan.
    }

    return unsubscribe
  }, [])

  /**
   * HEAL PESAN LAMA MILIK SENDIRI.
   *
   * Jika pesan sendiri masih:
   *
   * name: "User"
   *
   * maka Firestore diperbaiki menjadi:
   *
   * name: "Deni Purwanto"
   */
  useEffect(() => {
    if (!user) {
      return
    }

    const ownName =
      getOwnDisplayName(
        user,
        profile,
        '',
      )

    const ownPhoto =
      profile?.uid === user.uid
        ? profile.photoURL ??
          user.photoURL ??
          null
        : user.photoURL ?? null

    if (
      !ownName ||
      ownName === 'User'
    ) {
      return
    }

    let cancelled = false

    const heal =
      async () => {
        /**
         * Hanya pesan dengan UID
         * yang benar-benar sama.
         */
        const targets =
          messages.filter(
            (message) =>
              message.uid ===
                user.uid &&
              (
                isPlaceholderName(
                  message.name,
                ) ||
                (
                  ownPhoto !== null &&
                  message.photoURL !==
                    ownPhoto
                )
              ),
          )

        for (
          const message of targets.slice(
            0,
            20,
          )
        ) {
          if (cancelled) {
            return
          }

          try {
            await updateDoc(
              doc(
                db,
                'messages',
                message.id,
              ),
              {
                name: ownName,

                ...(ownPhoto
                  ? {
                      photoURL:
                        ownPhoto,
                    }
                  : {}),
              },
            )
          } catch {
            /**
             * Tampilan frontend tetap
             * menggunakan nama Google.
             */
            return
          }
        }
      }

    void heal()

    return () => {
      cancelled = true
    }
  }, [
    user,
    profile,
    messages,
  ])

  /**
   * DIREKTORI NAMA PUBLIK — dibaca SEMUA orang
   * (login / logout / ganti akun).
   * Setiap ada pesan masuk, catat UID yang terlihat
   * lalu ambil namanya dari `userProfiles/{uid}`.
   * Inilah yang bikin "User" berubah jadi nama Gmail
   * asli walau sedang tidak login.
   */
  useEffect(() => {
    const uids = new Set<string>()

    for (const message of messages) {
      if (
        message.uid &&
        !publicNames.has(message.uid)
      ) {
        uids.add(message.uid)
      }
    }

    if (uids.size === 0) {
      return
    }

    let cancelled = false

    const load = async () => {
      let changed = false

      for (const uid of uids) {
        if (cancelled) return

        try {
          const snap = await getDoc(
            doc(db, 'userProfiles', uid),
          )

          if (!snap.exists()) continue

          const data = snap.data() as {
            name?: unknown
            photoURL?: unknown
          }

          if (
            typeof data.name === 'string' &&
            !isPlaceholderName(data.name)
          ) {
            const cleaned = resolveSenderName(
              data.name,
            )

            if (
              cleaned &&
              !isPlaceholderName(cleaned)
            ) {
              publicNames.set(uid, cleaned)
              knownNames.set(uid, cleaned)
              persistSender(
                uid,
                cleaned,
                typeof data.photoURL ===
                  'string'
                  ? data.photoURL
                  : null,
              )
              changed = true
            }
          }

          if (
            typeof data.photoURL === 'string' &&
            data.photoURL
          ) {
            publicPhotos.set(uid, data.photoURL)
            knownPhotos.set(uid, data.photoURL)
            changed = true
          }
        } catch {
          // Abaikan — fallback lokal tetap jalan.
        }
      }

      if (changed && !cancelled) {
        setDirectoryTick((tick) => tick + 1)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [messages])

  /**
   * FIRESTORE REALTIME LISTENER
   */
  useEffect(() => {
    if (!open) {
      return
    }

    setLoadingMessages(true)

    const unsubscribe =
      onSnapshot(
        MESSAGES_QUERY,
        (snapshot) => {
          const next =
            snapshot.docs.map(
              (messageDoc) => {
                const data =
                  messageDoc.data() as DocumentData

                const rawReply =
                  data.replyTo as
                    | DocumentData
                    | null

                return {
                  id: messageDoc.id,

                  text:
                    typeof data.text ===
                    'string'
                      ? data.text
                      : '',

                  uid:
                    typeof data.uid ===
                    'string'
                      ? data.uid
                      : '',

                  name:
                    typeof data.name ===
                    'string'
                      ? data.name
                      : '',

                  photoURL:
                    typeof data.photoURL ===
                    'string'
                      ? data.photoURL
                      : null,

                  createdAt:
                    (data.createdAt as
                      | Timestamp
                      | null) ??
                    null,

                  replyTo:
                    rawReply &&
                    typeof rawReply.text ===
                      'string'
                      ? {
                          id:
                            typeof rawReply.id ===
                            'string'
                              ? rawReply.id
                              : '',

                          text:
                            rawReply.text.slice(
                              0,
                              140,
                            ),

                          name:
                            typeof rawReply.name ===
                            'string'
                              ? rawReply.name
                              : '',

                          uid:
                            typeof rawReply.uid ===
                            'string'
                              ? rawReply.uid
                              : undefined,
                        }
                      : null,
                }
              },
            )

          setMessages(next)

          next.forEach(
            rememberSender,
          )

          setLoadingMessages(false)
        },
        () => {
          setLoadingMessages(false)
        },
      )

    return unsubscribe
  }, [open])

  /**
   * AUTO SCROLL
   */
  useEffect(() => {
    if (!open) {
      return
    }

    bottomRef.current?.scrollIntoView({
      behavior: initialScrollDone.current
        ? 'smooth'
        : 'auto',
      block: 'end',
    })

    if (messages.length > 0) {
      initialScrollDone.current = true
    }
  }, [
    messages.length,
    open,
  ])

  // Reset saat panel ditutup: buka berikutnya juga langsung ke bawah.
  useEffect(() => {
    if (!open) {
      initialScrollDone.current = false
    }
  }, [open])

  /**
   * LOGIN
   */
  const handleLogin =
    useCallback(async () => {
      if (authBusy) {
        return
      }

      setAuthBusy(true)
      setAuthError(null)

      const failsafe =
        window.setTimeout(() => {
          setAuthBusy(false)
        }, 8000)

      try {
        await loginWithGoogle()

        window.clearTimeout(
          failsafe,
        )
      } catch (error) {
        window.clearTimeout(
          failsafe,
        )

        const code =
          typeof error ===
            'object' &&
          error !== null &&
          'code' in error
            ? String(
                (
                  error as {
                    code?: unknown
                  }
                ).code,
              )
            : ''

        if (
          code ===
            'auth/popup-closed-by-user' ||
          code ===
            'auth/cancelled-popup-request'
        ) {
          return
        }

        if (
          code ===
          'auth/popup-blocked'
        ) {
          setAuthError(
            'Popup blocked by your browser. Please allow popups for this site and try again.',
          )

          return
        }

        setAuthError(
          'Sign-in failed. Please try again.',
        )
      } finally {
        setAuthBusy(false)
      }
    }, [authBusy])

  /**
   * LOGOUT
   */
  const handleLogout =
    useCallback(async () => {
      try {
        await logout()
      } catch {
        setAuthError(
          'Sign-out failed. Please try again.',
        )
      }
    }, [])

  /**
   * SEND MESSAGE
   */
  const handleSend =
    useCallback(async () => {
      const text =
        draft.trim()

      if (
        !text ||
        !user ||
        sending
      ) {
        return
      }

      setSending(true)
      setSendError(null)

      try {
        /**
         * Selalu ambil nama Google terbaru.
         */
        const senderName =
          getOwnDisplayName(
            user,
            profile,
            '',
          )

        const senderPhoto =
          profile?.uid === user.uid
            ? profile.photoURL ??
              user.photoURL ??
              null
            : user.photoURL ??
              null

        await addDoc(
          collection(
            db,
            'messages',
          ),
          {
            text: text.slice(
              0,
              500,
            ),

            /**
             * UID user yang sebenarnya.
             */
            uid: user.uid,

            /**
             * Nama Google.
             */
            name: senderName,

            photoURL:
              senderPhoto,

            createdAt:
              serverTimestamp(),

            replyTo: replyTo
              ? {
                  id: replyTo.id,

                  text:
                    replyTo.text.slice(
                      0,
                      140,
                    ),

                  name:
                    replyTo.name,

                  ...(replyTo.uid
                    ? {
                        uid:
                          replyTo.uid,
                      }
                    : {}),
                }
              : null,
          },
        )

        setDraft('')
        setReplyTo(null)
      } catch {
        setSendError(
          'Message failed to send. Check Firestore rules and try again.',
        )
      } finally {
        setSending(false)
      }
    }, [
      draft,
      profile,
      replyTo,
      sending,
      user,
    ])

  /**
   * REPLY
   */
  const startReply =
    useCallback(
      (message: ChatMessage) => {
        if (!user) {
          void handleLogin()
          return
        }

        setReplyTo({
          id: message.id,

          text:
            message.text.slice(
              0,
              140,
            ),

          name: getDisplayName(
            message,
            user,
            profile,
          ),

          uid:
            message.uid ||
            undefined,
        })

        setSendError(null)

        window.setTimeout(() => {
          inputRef.current?.focus()
        }, 50)
      },
      [
        handleLogin,
        profile,
        user,
      ],
    )

  const messagesById =
    useMemo(
      () =>
        new Map(
          messages.map(
            (message) => [
              message.id,
              message,
            ],
          ),
        ),
      [messages],
    )

  const replyTargetMissing =
    replyTo !== null &&
    replyTo.id !== '' &&
    !messagesById.has(
      replyTo.id,
    )

  return (
    <>
      <button
        type="button"
        className={
          open
            ? 'chat-button chat-button-hidden'
            : 'chat-button'
        }
        onClick={() => {
          window.clearTimeout(closeTimer.current)
          setClosing(false)
          setOpen(true)
        }}
        aria-label="Open live chat"
        aria-hidden={open}
        tabIndex={
          open ? -1 : 0
        }
      >
        <MessageCircle
          size={23}
        />
      </button>

      {open && (
        <section
          className={[
            'chat-panel',
            closing ? 'is-closing' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="dialog"
          aria-modal="false"
          aria-label="Live chat"
        >
          <header className="chat-panel-header">
            <div className="chat-panel-top">
              <span className="chat-panel-avatar">
                {activeChatTab === 'assistant' ? (
                  <Bot size={19} />
                ) : (
                  <Users size={19} />
                )}
              </span>

              <div className="chat-panel-heading">
                <strong>
                  {activeChatTab === 'assistant'
                    ? 'Virtual Assistant'
                    : 'Global Room'}
                </strong>

                <span className="chat-panel-status">
                  <span className="chat-status-dot" />
                  Online
                </span>
              </div>

              <div className="chat-panel-actions">
                {activeChatTab === 'assistant' ? (
                  <button
                    type="button"
                    className="chat-icon-button"
                    onClick={clearAssistantConversation}
                    aria-label="Hapus percakapan"
                    title="Hapus percakapan"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : (
                  <>
                    {user && (
                      <button
                        type="button"
                        className="chat-icon-button"
                        onClick={handleLogout}
                        aria-label="Sign out"
                        title="Sign out"
                      >
                        <LogOut size={15} />
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  className="chat-icon-button"
                  onClick={closeChat}
                  aria-label="Close live chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div
              className="chat-tabs"
              role="tablist"
              aria-label="Chat sections"
            >
              <button
                type="button"
                role="tab"
                aria-selected={
                  activeChatTab === 'assistant'
                }
                className={
                  activeChatTab === 'assistant'
                    ? 'chat-tab active'
                    : 'chat-tab'
                }
                onClick={() =>
                  setActiveChatTab('assistant')
                }
              >
                Virtual Assistant
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={
                  activeChatTab === 'global'
                }
                className={
                  activeChatTab === 'global'
                    ? 'chat-tab active'
                    : 'chat-tab'
                }
                onClick={() =>
                  setActiveChatTab('global')
                }
              >
                Global Chat
              </button>
            </div>
          </header>

          {activeChatTab === 'assistant' && (
            <>
              <div
                className="chat-messages assistant-messages notranslate"
                translate="no"
                aria-live="polite"
              >
                {assistantMessages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.from === 'user'
                        ? 'chat-message mine'
                        : 'chat-message'
                    }
                  >
                    {message.from === 'bot' && (
                      <span className="chat-avatar chat-avatar-fallback assistant-avatar">
                        <Bot size={14} />
                      </span>
                    )}

                    <div className="chat-bubble">
                      <p className="assistant-text">
                        {message.from === 'bot'
                          ? renderAssistantText(message.text)
                          : message.text}
                      </p>
                    </div>
                  </div>
                ))}

                {assistantTyping && (
                  <div className="chat-message">
                    <span className="chat-avatar chat-avatar-fallback assistant-avatar">
                      <Bot size={14} />
                    </span>

                    <div className="chat-bubble assistant-typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}

                <div ref={assistantBottomRef} />
              </div>

              <div
                className="assistant-quick-replies notranslate"
                translate="no"
                onWheel={(event) => {
                  // Roda mouse (vertikal) menggeser chip ke samping di desktop.
                  const el = event.currentTarget
                  if (el.scrollWidth > el.clientWidth) {
                    el.scrollLeft += event.deltaY + event.deltaX
                  }
                }}
              >
                {ASSISTANT_QUICK_REPLIES.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className="assistant-quick-reply"
                    onClick={() =>
                      sendAssistantMessage(label)
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>

              <form
                className="chat-composer notranslate"
                translate="no"
                onSubmit={(event) => {
                  event.preventDefault()
                  sendAssistantMessage()
                }}
              >
                <div className="chat-composer-field">
                  <MessageSquare
                    className="chat-composer-icon"
                    size={21}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />

                  <input
                    type="text"
                    value={assistantDraft}
                    onChange={(event) =>
                      setAssistantDraft(
                        event.target.value,
                      )
                    }
                    placeholder="Tanya soal proyek, pengalaman..."
                    maxLength={300}
                    aria-label="Tanya asisten virtual"
                  />

                  <button
                    type="submit"
                    className="chat-send"
                    disabled={!assistantDraft.trim()}
                    aria-label="Kirim pesan"
                    title="Kirim pesan"
                  >
                    <SendHorizonal
                      size={19}
                      strokeWidth={1.9}
                    />
                  </button>
                </div>
              </form>
            </>
          )}

          {activeChatTab === 'global' && (
            <>
          {(authError ||
            sendError) && (
            <p
              className="chat-error"
              role="alert"
            >
              {sendError ??
                authError}
            </p>
          )}

          <div
            className="chat-messages"
            aria-live="polite"
          >
            {loadingMessages ? (
              <div className="chat-loading">
                <span className="skeleton chat-skeleton" />
                <span className="skeleton chat-skeleton" />
                <span className="skeleton chat-skeleton short" />
              </div>
            ) : messages.length ===
              0 ? (
              <p className="chat-empty">
                No messages yet — say hi! 👋
              </p>
            ) : (
              messages.map(
                (message) => {
                  /**
                   * PESAN MILIK SENDIRI
                   */
                  const mine =
                    !!user &&
                    !!message.uid &&
                    message.uid ===
                      user.uid

                  const displayName =
                    getDisplayName(
                      message,
                      user,
                      profile,
                    )

                  const displayPhoto =
                    getDisplayPhoto(
                      message,
                      user,
                      profile,
                    )

                  return (
                    <div
                      key={
                        message.id
                      }
                      className={
                        mine
                          ? 'chat-message mine'
                          : 'chat-message'
                      }
                    >
                      {!mine &&
                        (displayPhoto ? (
                          <img
                            src={
                              displayPhoto
                            }
                            alt=""
                            className="chat-avatar"
                            loading="lazy"
                          />
                        ) : (
                          <span className="chat-avatar chat-avatar-fallback">
                            {displayName
                              .slice(
                                0,
                                1,
                              )
                              .toUpperCase()}
                          </span>
                        ))}

                      <div className="chat-bubble">
                        <span className="chat-name">
                          {mine
                            ? `${displayName} (You)`
                            : displayName}
                        </span>

                        {message.replyTo && (
                          <span className="chat-quote">
                            <strong>
                              {resolveReplyName(
                                message.replyTo,
                                messages,
                                user,
                                profile,
                              )}
                            </strong>

                            <em>
                              {message
                                .replyTo
                                .text ||
                                ' (message deleted)'}
                            </em>
                          </span>
                        )}

                        <p>
                          {
                            message.text
                          }
                        </p>

                        <span className="chat-meta">
                          {message.createdAt && (
                            <span className="chat-time">
                              {formatDateTime(
                                message.createdAt,
                              )}
                            </span>
                          )}

                          <button
                            type="button"
                            className="chat-reply-button"
                            onClick={() =>
                              startReply(
                                message,
                              )
                            }
                            aria-label={`Reply to ${displayName}`}
                            title={
                              user
                                ? 'Reply'
                                : 'Sign in to reply'
                            }
                          >
                            <Reply
                              size={13}
                            />
                            Reply
                          </button>
                        </span>
                      </div>

                      {mine &&
                        (displayPhoto ? (
                          <img
                            src={
                              displayPhoto
                            }
                            alt=""
                            className="chat-avatar"
                            loading="lazy"
                          />
                        ) : (
                          <span className="chat-avatar chat-avatar-fallback">
                            {displayName
                              .slice(
                                0,
                                1,
                              )
                              .toUpperCase()}
                          </span>
                        ))}
                    </div>
                  )
                },
              )
            )}

            <div
              ref={bottomRef}
            />
          </div>

          {!user ? (
            <div className="chat-guest-bar">
              <p>
                {authBusy
                  ? 'Opening Google sign-in...'
                  : 'Sign in to join the conversation.'}
              </p>

              <button
                type="button"
                className="chat-google-button"
                onClick={
                  handleLogin
                }
                disabled={
                  authBusy
                }
              >
                <span
                  className="chat-google-icon"
                  aria-hidden="true"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                    />

                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
                    />

                    <path
                      fill="#FBBC05"
                      d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
                    />

                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                    />
                  </svg>
                </span>

                {authBusy
                  ? 'Signing in...'
                  : 'Sign in with Google'}
              </button>
            </div>
          ) : (
            <>
              {replyTo && (
                <div className="chat-reply-preview">
                  <div className="chat-reply-preview-text">
                    <strong>
                      Replying to{' '}
                      {
                        replyTo.name
                      }

                      {replyTargetMissing
                        ? ' (original message not loaded)'
                        : ''}
                    </strong>

                    <span>
                      {replyTo.text ||
                        ' (message deleted)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="chat-icon-button chat-reply-cancel"
                    onClick={() =>
                      setReplyTo(
                        null,
                      )
                    }
                    aria-label="Cancel reply"
                  >
                    <X
                      size={15}
                    />
                  </button>
                </div>
              )}

              <form
                className="chat-composer"
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleSend()
                }}
              >
                <div className="chat-composer-field">
                  <MessageSquare
                    className="chat-composer-icon"
                    size={21}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />

                  <input
                    ref={inputRef}
                    type="text"
                    value={draft}
                    onChange={(event) =>
                      setDraft(
                        event.target.value,
                      )
                    }
                    placeholder={
                      replyTo
                        ? `Reply to ${replyTo.name}...`
                        : 'Type a message...'
                    }
                    maxLength={500}
                    aria-label="Type a message"
                  />

                  <button
                    type="submit"
                    className="chat-send"
                    disabled={
                      !draft.trim() ||
                      sending
                    }
                    aria-label="Send message"
                    title="Send message"
                  >
                    <SendHorizonal
                      size={19}
                      strokeWidth={1.9}
                    />
                  </button>
                </div>
              </form>
            </>
          )}
            </>
          )}
        </section>
      )}
    </>
  )
}