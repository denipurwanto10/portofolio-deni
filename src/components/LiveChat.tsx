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
  text: 'Halo, saya Asisten Virtual Deni 👋 Silakan tanya seputar proyek, pengalaman, teknologi yang dikuasai, atau cara menghubungi Deni.',
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

/**
 * Ringkasan tiap proyek — singkat, 1 kalimat, gaya santai.
 * Kunci = kunci PROJECT_ALIASES (awalan judul di data.ts).
 */
const PROJECT_SUMMARIES_ID: Record<string, string> = {
  Formatra:
    'toolkit dokumen serbaguna — convert, merge, split, sampai edit PDF/Word/Excel langsung di browser.',
  Disaster:
    'monitoring bencana Indonesia realtime — gempa BMKG, gunung MAGMA, sampai peringatan tsunami, lengkap sama peta interaktif.',
  'PC Control':
    'kontrol PC pakai gestur tangan, perintah suara, sampai bot Telegram. Mouse, keyboard, screenshot — bisa semua.',
  Bandung:
    'pendataan UMKM 31 kecamatan — ada peta interaktif, katalog, dashboard admin, sampai ekspor PDF.',
  Placement:
    'tes penempatan online — isi biodata, jawab 15 soal, langsung dapat skor + rekomendasi program.',
  Gudang:
    'sistem inventaris kantor — multi-gudang, stok otomatis, barcode/QR, sampai laporan Excel.',
  Wisma:
    'sistem manajemen hotel — kalender booking, housekeeping, pembayaran + invoice otomatis, sampai PWA.',
  Pasarku:
    'marketplace multi-penjual — ada katalog, keranjang, checkout, plus dashboard toko buat seller.',
  Attendance:
    'aplikasi absensi karyawan — clock-in/out, kelola user & departemen, sampai laporan.',
  MandiriNews:
    'aplikasi berita Android — artikel dari REST API, ada kategori teknologi, bisnis, olahraga. Proyek Mandiri x Rakamin.',
}

function projectAliasKey(title: string): string | null {
  return (
    Object.keys(PROJECT_ALIASES).find((key) =>
      title.startsWith(key),
    ) ?? null
  )
}

function projectSummaryId(title: string): string | null {
  const key = projectAliasKey(title)
  return key
    ? (PROJECT_SUMMARIES_ID[key] ?? null)
    : null
}

/**
 * Format 1 proyek: judul + ringkasan + link klik +
 * "selengkapnya di halaman Proyek ya". Singkat.
 */
function formatProjectReply(
  title: string,
  extra?: string,
): string {
  const project = projects.find(
    (item) => item.title === title,
  )

  if (!project) {
    return extra ?? title
  }

  const summary = projectSummaryId(
    project.title,
  )

  const lines = [
    `${project.title} — ${summary ?? project.category}.`,
    project.demo ?? project.link,
    'Selengkapnya di halaman Proyek ya.',
  ]

  if (extra) {
    lines.push(extra)
  }

  return lines.join('\n')
}

/**
 * Daftar proyek: tiap item judul + link, maks 3 item.
 */
function formatProjectListReply(
  items: { title: string; link: string }[],
  opener: string,
  invite: string,
): string {
  const lines = [
    opener,
    ...items
      .slice(0, 3)
      .map(
        (item) =>
          `• ${item.title}\n  ${item.link}`,
      ),
  ]

  if (items.length > 3) {
    lines.push(
      `...dan ${items.length - 3} lainnya.`,
    )
  }

  lines.push(invite)
  return lines.join('\n')
}

function normalizeAssistantInput(
  raw: string,
): string {
  let s = raw.trim().toLowerCase()

  const reps: Array<[RegExp, string]> = [
    [/\bdmn\b|\bdmna\b|\bdimn\b/g, 'dimana'],
    [/\bgmn\b|\bgimana\b/g, 'bagaimana'],
    [/\bkpn\b/g, 'kapan'],
    [/\bbrp\b/g, 'berapa'],
    [/\byg\b/g, 'yang'],
    [/\bdgn\b|\bdng\b/g, 'dengan'],
    [/\butk\b/g, 'untuk'],
    [/\borg\b/g, 'orang'],
    [/\btrs\b|\btrus\b/g, 'terus'],
    [/\bkrn\b/g, 'karena'],
    [/\bskrg\b/g, 'sekarang'],
    [/\budh\b|\buda\b/g, 'sudah'],
    [/\bblm\b/g, 'belum'],
    [
      /\bnggak\b|\bngga\b|\bgak\b|\bga\b/g,
      'tidak',
    ],
    [/\bprojek\b/g, 'proyek'],
    [/\bskil\b/g, 'skill'],
    [/\bkontac\b/g, 'kontak'],
    [/\bemial\b/g, 'email'],
    [/\blinkdin\b|\blinked\b/g, 'linkedin'],
    [/\bgithb\b|\bgitub\b/g, 'github'],
    [/\binstgram\b/g, 'instagram'],
    [/\bexperiance\b/g, 'experience'],
    [/\bteknology\b/g, 'teknologi'],
    [/\bunversitas\b/g, 'universitas'],
    [
      /\bpngalaman\b|\bpenglaman\b/g,
      'pengalaman',
    ],
    [/\bsertifkat\b/g, 'sertifikat'],
  ]

  for (const [
    pattern,
    replacement,
  ] of reps) {
    s = s.replace(pattern, replacement)
  }

  return s.replace(/\s+/g, ' ')
}

/**
 * Topik pembicaraan terakhir — dipakai untuk menjawab
 * pertanyaan susulan yang singkat ("dimana?", "kapan?",
 * "jelaskan", "teknologinya apa?").
 */
type AssistantTopic =
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'awards'
  | 'contact'
  | 'location'
  | 'cv'

type AssistantContext = {
  topic: AssistantTopic | null
  projectTitle: string | null
  tech: string | null
}

function detectAssistantTopic(
  input: string,
): AssistantTopic | null {
  if (
    includesAnyKeyword(input, [
      'kuliah',
      'kampus',
      'universitas',
      'jurusan',
      'prodi',
      'pendidikan',
      'sekolah',
      'unla',
      'aslab',
      'praktikum',
      'laboratorium',
      'instruktur',
      'study',
      'college',
      'major',
      'graduate',
      'lulusan',
    ])
  ) {
    return 'education'
  }

  if (
    includesAnyKeyword(input, [
      'pengalaman',
      'kerja',
      'magang',
      'kantor',
      'perusahaan',
      'karir',
      'karier',
      'jabatan',
      'esdm',
      'mandiri',
      'rakamin',
      'disdag',
      'pemkab',
      'patgl',
      'job',
      'career',
      'worked',
      'works',
      'intern',
    ])
  ) {
    return 'experience'
  }

  if (
    includesAnyKeyword(input, [
      'proyek',
      'project',
      'aplikasi',
      'website',
      'karya',
      'portfolio',
      'portofolio',
      'demo',
    ])
  ) {
    return 'projects'
  }

  if (
    includesAnyKeyword(input, [
      'skill',
      'keahlian',
      'kemampuan',
      'teknologi',
      'tech',
      'framework',
      'database',
      'frontend',
      'backend',
      'dikuasai',
    ])
  ) {
    return 'skills'
  }

  if (
    includesAnyKeyword(input, [
      'penghargaan',
      'sertifikat',
      'prestasi',
      'juara',
      'lomba',
      'award',
      'achievement',
    ])
  ) {
    return 'awards'
  }

  if (
    includesAnyKeyword(input, [
      'kontak',
      'email',
      'hubungi',
      'linkedin',
      'github',
      'instagram',
      'whatsapp',
      'contact',
    ])
  ) {
    return 'contact'
  }

  if (
    includesAnyKeyword(input, [
      'cv',
      'resume',
      'riwayat hidup',
    ])
  ) {
    return 'cv'
  }

  if (
    includesAnyKeyword(input, [
      'lokasi',
      'domisili',
      'tinggal',
      'dimana',
      'di mana',
      'kota',
      'bandung',
      'location',
      'based',
      'live',
      'where',
    ])
  ) {
    return 'location'
  }

  return null
}

/**
 * Membaca konteks dari riwayat percakapan (maks. 8 pesan
 * terakhir): topik terakhir, proyek terakhir, dan teknologi
 * terakhir yang dibahas.
 */
function inferAssistantContext(
  history: AssistantMessage[],
): AssistantContext {
  const ctx: AssistantContext = {
    topic: null,
    projectTitle: null,
    tech: null,
  }

  const recent = history.slice(-8)

  for (
    let i = recent.length - 1;
    i >= 0;
    i--
  ) {
    const msg = recent[i]

    if (!msg) {
      continue
    }

    const text = msg.text
      .trim()
      .toLowerCase()

    if (!text) {
      continue
    }

    if (!ctx.projectTitle) {
      const hit =
        projects.find((item) =>
          text.includes(
            item.title.toLowerCase(),
          ),
        ) ?? findProjectByName(text)

      if (hit) {
        ctx.projectTitle = hit.title
      }
    }

    if (!ctx.tech && !ctx.projectTitle) {
      const hit = findTechInInput(text)

      if (hit) {
        ctx.tech = hit
      }
    }

    // Topik hanya dibaca dari pesan USER — jawaban bot
    // menyebut banyak kata kunci (mis. "Bandung") yang
    // bisa mengacaukan konteks pertanyaan susulan.
    if (!ctx.topic && msg.from === 'user') {
      const topic =
        detectAssistantTopic(text)

      if (topic) {
        ctx.topic = topic
      }
    }

    if (
      ctx.topic &&
      (ctx.projectTitle || ctx.tech)
    ) {
      break
    }
  }

  return ctx
}

/**
 * Pertanyaan susulan yang pendek dan tidak menyebut entitas
 * ("dimana?", "kapan?", "jelaskan") — dijawab dari konteks.
 */
function isBareFollowUp(
  input: string,
): boolean {
  const cleaned = input.replace(
    /[^a-z0-9\s]/g,
    ' ',
  )

  const words = cleaned
    .split(' ')
    .filter(Boolean)

  if (words.length > 4) {
    return false
  }

  // Kata berimbuhan "-nya" ("teknologinya", "demonya",
  // "kantornya") merujuk ke subjek sebelumnya, bukan
  // entitas baru — kecualikan dari tes entitas.
  const entityTestInput = words
    .filter(
      (word) =>
        !(
          word.length > 5 &&
          word.endsWith('nya')
        ),
    )
    .join(' ')

  const hasEntity = includesAnyKeyword(
    entityTestInput,
    [
      'deni',
      'kuliah',
      'kampus',
      'kerja',
      'magang',
      'proyek',
      'project',
      'pengalaman',
      'kontak',
      'email',
      'cv',
      'resume',
      'teknologi',
      'skill',
      'penghargaan',
      'sertifikat',
      'lokasi',
      'bandung',
      'github',
      'linkedin',
      'instagram',
      'blog',
      'komunitas',
      'gaji',
      'freelance',
      'hobi',
      'umur',
      'nama',
      'kabar',
      'halo',
      'hai',
      'hello',
      'bantuan',
      'help',
      'tentang',
      'profil',
      'karya',
      'aplikasi',
      'website',
      'jasa',
      'lomba',
    ],
  )

  if (hasEntity) {
    return false
  }

  return includesAnyKeyword(input, [
    'dimana',
    'di mana',
    'kapan',
    'siapa',
    'berapa',
    'apa',
    'bagaimana',
    'kenapa',
    'yang',
    'itu',
    'tersebut',
    'detail',
    'deskripsi',
    'teknologi',
    'stack',
    'demo',
    'link',
    'fitur',
    'jelaskan',
    'jelasin',
    'contoh',
    'terus',
    'lalu',
    'apakah',
    'maksudnya',
    'mana',
  ])
}

/**
 * Menjawab pertanyaan susulan berdasarkan topik atau proyek
 * terakhir yang dibahas.
 */
function answerFromContext(
  input: string,
  ctx: AssistantContext,
): string | null {
  // Susulan soal proyek tertentu
  // ("teknologinya?", "demonya?", "deskripsinya?").
  if (ctx.projectTitle) {
    const project = projects.find(
      (item) =>
        item.title === ctx.projectTitle,
    )

    if (project) {
      if (
        includesAnyKeyword(input, [
          'teknologi',
          'tech',
          'dibuat dengan',
          'pakai apa',
          'pake apa',
          'stack',
          'bahasa',
        ])
      ) {
        return `Teknologinya: ${project.tags.slice(0, 4).join(', ')}.`
      }

      if (
        includesAnyKeyword(input, [
          'demo',
          'coba',
          'link',
          'buka',
          'lihat',
        ])
      ) {
        if (project.demo) {
          return `Nih link demonya, bisa langsung dicoba: ${project.demo}`
        }

        return `Belum ada demo publiknya, tapi kodenya bisa dilihat di sini: ${project.link}`
      }

      if (
        includesAnyKeyword(input, [
          'github',
          'repo',
          'source',
          'kode',
        ])
      ) {
        return `${project.link}\nSelengkapnya di halaman Proyek ya.`
      }

      if (
        includesAnyKeyword(input, [
          'apa',
          'detail',
          'jelaskan',
          'jelasin',
          'ceritakan',
          'cerita',
          'tentang',
          'deskripsi',
          'itu',
          'tersebut',
          'yang',
          'mana',
          'maksudnya',
        ])
      ) {
        const summary = projectSummaryId(
          project.title,
        )

        return summary
          ? `${project.title} — ${summary}\n${project.link}`
          : `${project.title}. Cek halaman Proyek ya.`
      }
    }
  }

  if (
    includesAnyKeyword(input, [
      'dimana',
      'di mana',
      'mana',
    ])
  ) {
    if (ctx.topic === 'education') {
      return 'Deni kuliah di UNLA, Bandung — jurusan Teknik Informatika.'
    }

    if (ctx.topic === 'experience') {
      return 'Deni pernah di PATGL, Mandiri x Rakamin, Disdagperin, dan UNLA.'
    }

    if (
      ctx.topic === 'location' ||
      !ctx.topic
    ) {
      return 'Deni tinggal di Bandung, Jawa Barat (WIB).'
    }
  }

  if (
    includesAnyKeyword(input, ['kapan'])
  ) {
    if (ctx.topic === 'education') {
      return 'Deni jadi aslab tahun 2022–2024, dan dapat penghargaan mahasiswa berprestasi Mei 2024.'
    }

    if (ctx.topic === 'experience') {
      return 'Deni di UNLA 2022–2024, Disdagperin awal 2025, Mandiri akhir 2025, lalu PATGL Des 2025 — Jun 2026.'
    }
  }

  if (
    includesAnyKeyword(input, ['siapa'])
  ) {
    if (ctx.topic === 'education') {
      return 'Deni kuliah sebagai mahasiswa Informatika UNLA, sambil jadi aslab juga.'
    }

    return 'Yang kita bahas Deni Purwanto — Full Stack Developer dari Bandung.'
  }

  if (
    includesAnyKeyword(input, ['berapa'])
  ) {
    if (ctx.topic === 'projects') {
      return `Total ada ${projects.length} proyek di portfolio ini.`
    }

    if (ctx.topic === 'experience') {
      return 'Pengalaman Deni 2+ tahun di web dan sistem geospasial.'
    }
  }

  if (
    includesAnyKeyword(input, [
      'detail',
      'jelaskan',
      'jelasin',
      'contoh',
      'ceritakan',
      'cerita',
      'maksudnya',
      'terus',
      'lalu',
      'apakah',
      'itu',
      'tersebut',
    ])
  ) {
    switch (ctx.topic) {
      case 'education':
        return 'Deni kuliah Informatika di UNLA — jadi aslab 2022–2024, dapat penghargaan Mei 2024.'
      case 'experience':
        return `Pengalaman terakhir Deni:\n${experiences
          .slice(0, 3)
          .map(
            (item) =>
              `• ${item.company} (${localizeYear(item.year)})`,
          )
          .join(
            '\n',
          )}`
      case 'projects':
        return formatProjectListReply(
          projects,
          'Misal nih:',
          'Sebut namanya buat detail.',
        )
      case 'skills':
        return `Teknologi andalan Deni: ${stack
          .slice(0, 6)
          .join(', ')}.`
      case 'awards':
        return `${ASSISTANT_AWARDS.slice(0, 3).join('\n')}`
      case 'contact':
        return 'Deni bisa dihubungi via email denipurwanto800@gmail.com atau LinkedIn deniiprwnt.'
      case 'location':
        return 'Deni tinggal di Bandung, Jawa Barat (WIB).'
      case 'cv':
        return 'CV Deni ada di Beranda, klik tombol "Resume".'
      default:
        return null
    }
  }

  return null
}

function buildAssistantReply(
  rawInput: string,
  history: AssistantMessage[] = [],
): string {
  const input = normalizeAssistantInput(rawInput)

  if (!input) {
    return 'Hmm, pesannya kosong 😅 Coba tanya misal "kuliah di mana?" atau "kerja di mana?"'
  }

  const ctx = inferAssistantContext(history)

  // Pertanyaan susulan yang pendek ("dimana?", "kapan?",
  // "jelaskan") — jawab dari konteks pembicaraan terakhir.
  if (isBareFollowUp(input)) {
    const contextual = answerFromContext(
      input,
      ctx,
    )

    if (contextual) {
      return contextual
    }
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
      'list',
    ])
  ) {
    return 'Aku bisa jawab soal Deni: kuliah, kerja, proyek, skill, kontak, sampai CV. Coba tanya "kuliah di mana?"'
  }

  // Kabar
  if (
    includesAnyKeyword(input, [
      'apa kabar',
      'apakah kabar',
      'gimana kabar',
      'bagaimana kabar',
      'how are you',
    ])
  ) {
    return 'Kabar aku baik 😊 Mau tanya apa soal Deni? Bisa soal kuliah, kerja, atau proyeknya.'
  }

  // Nama / biodata singkat
  if (
    includesAnyKeyword(input, [
      'nama lengkap',
      'nama panjang',
      'namanya siapa',
      'nama kamu siapa',
      'nama beliau',
      'umur',
      'usia',
      'tanggal lahir',
      'biodata',
      'tentang deni',
      'tentang kamu',
      'siapa deni',
      'profil',
      'profile',
      'perkenalan',
      'kenalan',
      'about',
      'who is deni',
    ])
  ) {
    return 'Deni itu Full Stack Developer dari Bandung. Lulusan Informatika UNLA, 2+ tahun bikin aplikasi web dan GIS.'
  }

  // Pendidikan — termasuk "Deni kuliah di mana?"
  // Dicek LEBIH DULU dari lokasi/pengalaman supaya kata
  // "dimana" + "kuliah" tidak nyasar ke jawaban lokasi.
  const educationHit =
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
      'unla',
      'langlangbuana',
      'aslab',
      'asisten lab',
      'praktikum',
      'study',
      'student',
      'college',
      'major',
    ]) ||
    (includesAnyKeyword(input, [
      'dimana',
      'di mana',
      'mana',
    ]) &&
      includesAnyKeyword(input, [
        'belajar',
        'menempuh',
        'sekolah',
        'kuliah',
        'kampus',
        'unla',
      ]))

  if (educationHit) {
    // "mengajar / instruktur / dosen" + kuliah = peran
    // asisten lab, bukan info kampus umum.
    if (
      includesAnyKeyword(input, [
        'mengajar',
        'instruktur',
        'dosen',
        'asisten lab',
        'aslab',
        'laboratorium',
        'praktikum',
      ])
    ) {
      return 'Pas kuliah Deni jadi aslab & instruktur (2022–2024) — bimbing 50+ mahasiswa praktikum Algoritma, Database, sama Web.'
    }

    if (
      includesAnyKeyword(input, [
        'gelar',
        'sarjana',
        'lulus kapan',
        'kapan lulus',
      ])
    ) {
      return 'Deni kuliah Teknik Informatika UNLA, aslab 2022–2024. Tahun lulusnya nggak ditulis di sini — tapi pengalamannya udah 2+ tahun.'
    }

    return 'Deni kuliah Informatika di UNLA, Bandung. Selama kuliah dia jadi aslab dan instruktur (2022–2024).'
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
      'piagam',
      'hartik',
    ])
  ) {
    // Sebut 3 aja biar ringkas, sisanya di halaman Awards.
    return `Penghargaannya Deni:\n${ASSISTANT_AWARDS.slice(
      0,
      3,
    )
      .map(
        (item) => `• ${item}`,
      )
      .join(
        '\n',
      )}\n\nSisanya cek di halaman Penghargaan ya. Ada yang mau ditanyain lagi?`
  }

  // Pengalaman di tempat tertentu — dicek dulu sebelum
  // cabang umum, supaya "pengalaman di Mandiri" dapat
  // jawaban spesifik, bukan daftar umum.
  const workplaceHit = (
    needles: string[],
  ) =>
    includesAnyKeyword(input, needles)

  if (
    workplaceHit([
      'mandiri',
      'rakamin',
      'bank mandiri',
    ])
  ) {
    // Kalau nyebut nama proyek spesifik ("mandirinews",
    // "umkm", "formatra") → langsung ke detail proyek,
    // JANGAN ke jawaban pengalaman kerja.
    const directProject = findProjectByName(input)

    

    return 'Di Mandiri x Rakamin (Nov–Des 2025) Deni jadi Mobile Dev — bikin aplikasi berita Android (MandiriNewsApps).'
  }

  if (
    workplaceHit([
      'esdm',
      'patgl',
      'air tanah',
      'geologi',
      'groundwater',
    ])
  ) {
    const directProject = findProjectByName(input)

    if (directProject) {
      return formatProjectReply(directProject.title)
    }

    return 'Di PATGL/ESDM (Des 2025 — Jun 2026) Deni jadi Full Stack Dev — bikin app lab dan peta sumur bor pakai Leaflet.js.'
  }

  if (
    workplaceHit([
      'disdag',
      'disperindag',
      'perdagangan',
      'perindustrian',
      'pemkab',
      'kabupaten bandung',
      'dinas',
      'umkm',
    ])
  ) {
    const directProject = findProjectByName(input)

    if (directProject) {
      return formatProjectReply(directProject.title)
    }

    return 'Di Disdagperin (Jan–Jun 2025) Deni jadi Full Stack Dev — bikin sistem UMKM plus peta interaktif. Ketik "umkm" buat lihat proyeknya.'
  }

  if (
    workplaceHit([
      'aslab',
      'asisten lab',
      'laboratorium',
      'mengajar',
      'instruktur',
      'guru',
    ])
  ) {
    return 'Di UNLA (2022–2024) Deni jadi aslab — bimbing 50+ mahasiswa praktikum, susun modul, sampai ngurus lab. Kuliahnya juga di UNLA, Teknik Informatika.'
  }

  // English: pendidikan & pengalaman & lokasi — dicek sebelum
  // cabang Indonesia supaya "where did deni study" tidak
  // jatuh ke jawaban generik.
  if (
    includesAnyKeyword(input, [
      'where did deni study',
      'where does deni study',
      'deni study',
      'deni university',
      'deni college',
      'deni education',
    ])
  ) {
    return 'Deni kuliah Teknik Informatika di UNLA, Bandung — sempat jadi aslab juga (2022–2024).'
  }

  if (
    includesAnyKeyword(input, [
      'where does deni work',
      'where did deni work',
      'deni work',
      'deni job',
      'deni experience',
    ])
  ) {
    return 'Deni pernah di PATGL/ESDM, Mandiri x Rakamin, Disdagperin Kab. Bandung, sama UNLA. Tanya aja misal "pengalaman di Mandiri".'
  }

  if (
    includesAnyKeyword(input, [
      'where is deni',
      'where does deni live',
      'deni location',
      'deni based',
    ])
  ) {
    return 'Deni di Bandung, Jawa Barat (WIB).'
  }

  // Lokasi — termasuk "Deni di mana?" / "tinggal di mana?"
  // Dicek SETELAH pendidikan & pengalaman supaya kata
  // "dimana" + "kuliah"/"kerja" tidak nyasar ke sini.
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
    return 'Deni di Bandung, Jawa Barat (WIB). Mau ngobrol langsung? Ketik "kontak".'
  }

  // Ketersediaan / rekrutmen / kolaborasi / freelance / gaji
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
      'freelance',
      'part-time',
      'part time',
      'jasa',
      'dibayar',
      'gaji',
      'salary',
      'rate',
    ])
  ) {
    if (
      includesAnyKeyword(input, [
        'gaji',
        'salary',
        'rate',
        'dibayar',
      ])
    ) {
      return 'Rate/gaji nggak ditulis di sini — langsung tanya Deni aja via email denipurwanto800@gmail.com.'
    }

    return 'Deni open buat full-time, freelance, dan kolaborasi web dev. Hubungi via email denipurwanto800@gmail.com.'
  }

  // Layanan / bisa bikin apa
  if (
    includesAnyKeyword(input, [
      'bisa bikin',
      'bisa buat',
      'bisa membuat',
      'layanan',
      'service',
      'jasa apa',
      'keunggulan',
      'kelebihan',
      'spesialis',
      'fokus',
    ])
  ) {
    return 'Deni bisa bikin web full-stack, sistem inventaris, dashboard/peta, REST API, dan aplikasi Android.'
  }

  // Pengalaman kerja saat ini / "Deni kerja di mana?"

  // CV — termasuk "minta CV" / "download CV"
  if (
    includesAnyKeyword(input, [
      'cv',
      'resume',
      'riwayat hidup',
      'curriculum',
      'download',
      'unduh',
    ]) &&
    includesAnyKeyword(input, [
      'cv',
      'resume',
      'riwayat hidup',
      'curriculum',
      'deni',
      'kamu',
      'download',
      'unduh',
      'minta',
      'lihat',
      'buka',
    ])
  ) {
    return 'CV Deni ada di Beranda, klik tombol "Resume" — bisa preview dan download PDF.'
  }

  // Media sosial spesifik
  const socialHit = (
    needles: string[],
  ) =>
    includesAnyKeyword(input, needles)

  if (socialHit(['whatsapp', 'wa', 'nomor hp', 'nomor telepon', 'telepon', 'nomor'])) {
    return 'No WA-nya nggak ditulis di sini. Email aja ke denipurwanto800@gmail.com, nanti dilanjut di sana.'
  }

  if (socialHit(['linkedin'])) {
    return 'LinkedIn Deni: https://www.linkedin.com/in/deniiprwnt/'
  }

  if (
    socialHit([
      'instagram',
      'ig',
    ])
  ) {
    return 'Instagram Deni: https://www.instagram.com/deniiprwnt/'
  }

  if (socialHit(['github'])) {
    return 'GitHub Deni: https://github.com/denipurwanto10'
  }

  if (socialHit(['email'])) {
    return 'Email Deni: denipurwanto800@gmail.com'
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
    return 'Bisa dihubungi via:\nEmail: denipurwanto800@gmail.com\nLinkedIn: https://www.linkedin.com/in/deniiprwnt/\nGitHub: https://github.com/denipurwanto10\nInstagram: https://www.instagram.com/deniiprwnt/'
  }

  // Proyek tertentu (lewat nama) — interaktif + link klik
  const namedProject = findProjectByName(input)
  if (namedProject) {
    const shortName = namedProject.title
      .split('—')[0]
      .trim()

    return formatProjectReply(
      namedProject.title,
    )
  }

  // "Proyek <teknologi> apa saja?" — mis. "proyek Laravel",
  // "aplikasi Python", "web React" — dijawab spesifik dulu
  // sebelum cabang teknologi umum.
  const techForProjects = findTechInInput(input)
  const asksProjectList =
    techForProjects &&
    includesAnyKeyword(input, [
      'proyek',
      'project',
      'aplikasi',
      'website',
      'karya',
      'apanya',
      'apa saja',
      'apa aja',
      'list',
      'daftar',
      'mana',
      'yang',
    ])

  if (techForProjects && asksProjectList) {
    const matched = projects.filter((item) =>
      item.tags.some((tag) =>
        sameTech(tag, techForProjects),
      ),
    )

    if (matched.length) {
      return formatProjectListReply(
        matched,
        `Nih ${techForProjects}-nya:`,
        'Sebut namanya buat detail.',
      )
    }

    return `Belum ada proyek ${techForProjects} di sini, tapi Deni bisa kok. Cek halaman Teknologi aja.`
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
      if (usedInProjects.length) {
        return formatProjectListReply(
          usedInProjects,
          `Nih ${tech}-nya:`,
          'Sebut namanya buat detail.',
        )
      }

      return `${tech} dipakai Deni waktu di ${usedInJobs[0]?.company}. Iya, dia bisa ${tech}.`
    }

    return `${tech}? Bisa kok. Daftar lengkapnya ada di halaman Teknologi.`
  }

  // Proyek (umum) — termasuk "ada berapa proyek?"
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
      'berapa proyek',
      'jumlah proyek',
      'total proyek',
    ])
  ) {
    if (
      includesAnyKeyword(input, [
        'berapa',
        'jumlah',
        'total',
      ])
    ) {
      return `Total ada ${projects.length} proyek di portfolio ini.`
    }

    return formatProjectListReply(
      projects,
      'Nih yang terbaru:',
      `Total ${projects.length} — detail di halaman Proyek.`,
    )
  }

  // Kategori proyek: mobile / frontend / backend / AI / fullstack
  if (
    includesAnyKeyword(input, [
      'mobile',
      'android',
      'kotlin',
      'ios',
    ]) &&
    !findTechInInput(input)
  ) {
    const matched = projects.filter(
      (item) => item.category === 'Mobile',
    )

    return matched.length
      ? formatProjectListReply(
          matched,
          'Mobile-nya:',
          'Sebut namanya buat detail.',
        )
      : 'Ada, MandiriNewsApps — aplikasi berita Android (Kotlin).'
  }

  if (
    includesAnyKeyword(input, [
      'fullstack',
      'full-stack',
      'full stack',
    ])
  ) {
    const matched = projects.filter(
      (item) => item.category === 'Full-Stack',
    )

    return formatProjectListReply(
      matched,
      'Full-stack-nya:',
      'Sebut namanya buat detail.',
    )
  }

  if (
    includesAnyKeyword(input, [
      ' ai',
      'kecerdasan buatan',
      'machine learning',
      'gesture',
      'voice',
      'suara',
    ])
  ) {
    const pcControl = projects.find((item) =>
      item.title.startsWith('PC Control'),
    )

    return pcControl
      ? formatProjectReply(pcControl.title)
      : 'Ada, PC Control. Kontrol PC pakai gestur + suara + bot Telegram.'
  }

  // Pengalaman — termasuk "Deni kerja di mana?"
  // (catatan: pengalaman di Mandiri / ESDM / Disdag / Aslab
  // sudah ditangani spesifik di atas, jadi cabang ini aman
  // untuk pertanyaan umum)
  const experienceHit =
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
      'kantor',
      'perusahaan',
      'bekerja',
    ]) ||
    (includesAnyKeyword(input, [
      'dimana',
      'di mana',
      'mana',
    ]) &&
      includesAnyKeyword(input, [
        'kerja',
        'magang',
        'kantor',
        'perusahaan',
        'deni',
        'sekarang',
        'dulu',
        'pernah',
      ]))

  if (experienceHit) {
    if (
      includesAnyKeyword(input, [
        'sekarang',
        'saat ini',
        'terakhir',
        'terbaru',
        'current',
      ])
    ) {
      const last = experiences[0]

      return last
        ? `Terakhir di ${last.company} sebagai ${last.role}.`
        : 'Cek halaman Pengalaman ya.'
    }

    return `Deni pernah di:\n${experiences
      .map(
        (item) => `• ${item.company}`,
      )
      .join(
        '\n',
      )}`
  }

  // Keahlian (umum) — termasuk "Deni bisa X?"
  const skillHit =
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
      'bisa apa',
      'menguasai',
      'jago',
    ]) ||
    (includesAnyKeyword(input, [
      'bisa',
      'paham',
      'ngerti',
      'mengerti',
    ]) &&
      !findTechInInput(input))

  if (skillHit) {
    return `Teknologi andalan Deni: ${stack
      .slice(0, 6)
      .join(', ')}.`
  }

  // Navigasi halaman portfolio
  if (
    includesAnyKeyword(input, [
      'halaman',
      'navigasi',
      'menu web',
      'bagian',
      'section',
      'tab',
      'fitur web',
      'isi web',
      'isi portfolio',
    ])
  ) {
    return 'Ada Beranda, Pengalaman, Proyek, Penghargaan, Teknologi, Kontak. Klik aja di sidebar.'
  }

  if (
    includesAnyKeyword(input, [
      'blog',
      'artikel',
      'tulisan',
      'catatan',
    ])
  ) {
    return 'Blog-nya masih coming soon. Tanya soal proyek / pengalaman aja dulu.'
  }

  if (
    includesAnyKeyword(input, [
      'komunitas',
      'organisasi',
      'community',
      'leadership',
    ])
  ) {
    return 'Deni aktif di komunitas & suka sharing ilmu. Detailnya di halaman Komunitas.'
  }

  if (
    includesAnyKeyword(input, [
      'github deni',
      'akun github',
      'repo',
      'repositori',
      'open source',
    ])
  ) {
    return 'GitHub Deni: https://github.com/denipurwanto10'
  }

  // Hobi / fakta ringan
  if (
    includesAnyKeyword(input, [
      'hobi',
      'hobby',
      'kesukaan',
      'suka apa',
      'minat',
      'fakta unik',
      'fakta menarik',
    ])
  ) {
    return 'Deni suka peta/geospasial, eksperimen AI, dan desain UI/UX. Pernah juara 2 lomba UI/UX 2023 😄'
  }

  // Bahasa / English
  if (
    includesAnyKeyword(input, [
      'bahasa inggris',
      'english',
      'speak english',
    ])
  ) {
    return 'Bisa kok, tanya aja pakai Inggris. Misal "where did Deni study?"'
  }

  if (
    includesAnyKeyword(input, [
      'who is deni',
      'what projects',
      'deni projects',
      'what can you do',
    ])
  ) {
    return 'Deni — Full Stack Developer dari Bandung. Lulusan Informatika UNLA, 2+ tahun bikin web & GIS. Open full-time.'
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
    return 'Aku asisten virtual untuk portfolio Deni. Tanya aja soal kuliah, kerja, atau proyeknya.'
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
    return 'Sama-sama! Tanya lagi aja kalau butuh 🙌'
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
    return 'Dadah! Aku di sini kalau butuh 👋'
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
    return 'Halo juga 👋 Mau tanya apa soal Deni?'
  }

  return "Aku kurang nangkep 😅 Coba tanya 'kuliah di mana?', 'proyek laravel?', atau ketik 'bantuan'."
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

      // Riwayat untuk konteks: semua pesan sejauh ini
      // + pesan user yang baru, supaya pertanyaan susulan
      // ("dimana?", "teknologinya?") tahu topik terakhir.
      const userMsg: AssistantMessage =
        {
          id: `u-${Date.now()}`,
          from: 'user',
          text,
        }

      const historyForReply = [
        ...assistantMessages,
        userMsg,
      ]

      setAssistantMessages(historyForReply)

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
              text: buildAssistantReply(
                text,
                historyForReply,
              ),
            },
          ])
          setAssistantTyping(false)
        },
        500,
      )
    },
    [assistantDraft, assistantMessages],
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