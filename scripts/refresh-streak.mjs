// Refresh src/data/streakRecord.json dari riwayat penuh GitHub.
//
// GithubGraphQL di-paginate per 1 tahun karena window
// contributionsCollection dibatasi ~1 tahun per request.
//
//   node scripts/refresh-streak.mjs
//
// Butuh `gh auth login` dengan scope read:org (repo juga cukup).

import { execFile } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const exec = promisify(execFile)

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, '..', 'src', 'data', 'streakRecord.json')

const USER = process.env.GITHUB_USERNAME ?? 'denipurwanto10'

const QUERY = `
query($from: DateTime!, $to: DateTime!) {
  user(login: "${USER}") {
    createdAt
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`

async function fetchWindow(from, to) {
  const { stdout } = await exec(
    'gh',
    [
      'api',
      'graphql',
      '-f',
      `query=${QUERY}`,
      '-F',
      `from=${from}`,
      '-F',
      `to=${to}`,
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  )

  const json = JSON.parse(stdout)
  const weeks =
    json?.data?.user?.contributionsCollection?.contributionCalendar
      ?.weeks ?? []

  const counts = new Map()

  for (const week of weeks) {
    for (const day of week.contributionDays) {
      counts.set(day.date, day.contributionCount)
    }
  }

  return { counts, createdAt: json?.data?.user?.createdAt }
}

// Algoritma SAMA dengan calculateLongestStreak() di src/pages/Dashboard.tsx
// supaya angkanya konsisten dengan kartu di halaman.
function findRuns(byDate) {
  const dates = [...byDate.keys()].sort()

  let longest = 0
  let longestStart = null
  let longestEnd = null
  let current = 0
  let currentStart = null
  let previous = null
  const runs = []

  for (const date of dates) {
    if ((byDate.get(date) ?? 0) <= 0) {
      if (current >= 4) {
        runs.push({
          length: current,
          start: currentStart,
          end: previous,
        })
      }

      current = 0
      currentStart = null
      previous = null
      continue
    }

    const day = new Date(`${date}T00:00:00Z`)

    if (
      previous &&
      currentStart &&
      day.getTime() - previous.getTime() === 86400000
    ) {
      current++
    } else {
      current = 1
      currentStart = date
    }

    previous = day

    if (current > longest) {
      longest = current
      longestStart = currentStart
      longestEnd = date
    }
  }

  if (current >= 4) {
    runs.push({
      length: current,
      start: currentStart,
      end: previous,
    })
  }

  return { longest, longestStart, longestEnd, runs }
}

const byDate = new Map()
let createdAt = null
let accountStart = null

const account = await fetchWindow(
  '2008-01-01T00:00:00Z',
  new Date().toISOString().slice(0, 10) + 'T23:59:59Z'
)
accountStart = new Date(account.createdAt ?? '2022-01-01T00:00:00Z')

const TODAY = new Date()
const cursor = new Date(accountStart)
cursor.setUTCHours(0, 0, 0, 0)

while (cursor <= TODAY) {
  const end = new Date(cursor)
  end.setUTCFullYear(end.getUTCFullYear() + 1)
  end.setUTCDate(end.getUTCDate() - 1)
  if (end > TODAY) end.setTime(TODAY.getTime())

  const { counts, createdAt: ca } = await fetchWindow(
    cursor.toISOString(),
    end.toISOString()
  )
  if (ca) createdAt = ca
  for (const [date, count] of counts) byDate.set(date, count)

  console.log(
    `page ${cursor.toISOString().slice(0, 10)} -> ${end
      .toISOString()
      .slice(0, 10)}: ${counts.size} hari`
  )

  cursor.setTime(end.getTime())
  cursor.setUTCDate(cursor.getUTCDate() + 1)
  cursor.setUTCHours(0, 0, 0, 0)
}

const { longest, longestStart, longestEnd, runs } = findRuns(byDate)

const record = {
  username: USER,
  note: 'Rekor kontribusi dihitung dari riwayat penuh via GitHub GraphQL contributionsCollection (bukan kalender publik 365 hari). Diperbarui manual via: node scripts/refresh-streak.mjs',
  accountCreatedAt: createdAt,
  calculatedAt: new Date().toISOString(),
  allTimeLongestStreak: {
    length: longest,
    start: longestStart,
    end: longestEnd,
  },
  topRuns: runs
    .sort((a, b) => b.length - a.length)
    .slice(0, 5),
}

await writeFile(OUT, JSON.stringify(record, null, 2) + '\n', 'utf8')

console.log('')
console.log(
  'REKOR SEPANJANG MASA:',
  longest,
  '=',
  longestStart,
  '->',
  longestEnd
)
console.log('ditulis ke', OUT)
