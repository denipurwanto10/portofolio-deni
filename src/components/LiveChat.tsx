import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  LogOut,
  MessageCircle,
  Reply,
  SendHorizonal,
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
          className={
            closing
              ? 'chat-panel is-closing'
              : 'chat-panel'
          }
          role="dialog"
          aria-modal="false"
          aria-label="Live chat"
        >
          <header className="chat-panel-header">
            <span className="chat-status-dot" />

            <div className="chat-panel-heading">
              <strong>
                Live Chat
              </strong>

              <span>
                {user
                  ? `Signed in as ${getOwnDisplayName(
                      user,
                      profile,
                      '',
                    )}`
                  : 'Chat with me in realtime'}
              </span>
            </div>

            {user && (
              <button
                type="button"
                className="chat-icon-button"
                onClick={
                  handleLogout
                }
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut
                  size={17}
                />
              </button>
            )}

            <button
              type="button"
              className="chat-icon-button"
              onClick={closeChat}
              aria-label="Close live chat"
            >
              <X size={19} />
            </button>
          </header>

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
                    size={18}
                  />
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </>
  )
}