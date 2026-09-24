/**
 * Vercel Serverless Function: /api/github-contributions
 *
 * Mengambil kalender kontribusi RESMI dari GitHub (sumber yang sama
 * dengan angka di github.com/<username>) lalu mengembalikannya sebagai
 * JSON kecil. Dijalankan di server sehingga tidak kena masalah CORS
 * dan tidak bergantung pada mirror pihak ketiga yang datanya bisa
 * tertinggal beberapa jam.
 */

const GITHUB_USERNAME = 'denipurwanto10'

const CALENDAR_URL = `https://github.com/users/${GITHUB_USERNAME}/contributions`

function parseCalendar(html) {
  // Peta: id sel -> jumlah kontribusi (dari <tool-tip for="id">)
  const counts = new Map()
  for (const match of html.matchAll(
    /<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>\s*([^<]*?)\s*<\/tool-tip>/gi,
  )) {
    const amount = match[2].match(/^([\d,]+)\s+contributions?\s+on/i)
    counts.set(match[1], amount ? Number(amount[1].replace(/,/g, '')) : 0)
  }

  const contributions = []
  for (const match of html.matchAll(/<td\b[^>]*\bdata-date="[^"]+"[^>]*>/gi)) {
    const tag = match[0]
    const date = tag.match(/\bdata-date="(\d{4}-\d{2}-\d{2})"/)?.[1]
    const id = tag.match(/\bid="([^"]+)"/)?.[1]
    const level = Number(tag.match(/\bdata-level="(\d)"/)?.[1] ?? 0)

    if (!date) continue

    contributions.push({
      date,
      count: id ? (counts.get(id) ?? 0) : 0,
      level: level >= 0 && level <= 4 ? level : 0,
    })
  }

  contributions.sort((a, b) => a.date.localeCompare(b.date))

  // Total resmi dari judul "N contributions in the last year".
  const headline = html.match(
    /([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/i,
  )
  const total = headline
    ? Number(headline[1].replace(/,/g, ''))
    : contributions.reduce((sum, item) => sum + item.count, 0)

  return { total, contributions }
}

export default async function handler(req, res) {
  try {
    const response = await fetch(CALENDAR_URL, {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; portfolio-contributions/1.0)',
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub responded with ${response.status}`)
    }

    const data = parseCalendar(await response.text())

    if (!data.contributions.length) {
      throw new Error('GitHub calendar could not be parsed')
    }

    // Cache di CDN 5 menit: cukup segar, tapi tidak membebani GitHub.
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600',
    )
    res.status(200).json({ ...data, source: 'github', fetchedAt: new Date().toISOString() })
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store')
    res.status(502).json({ error: String(error && error.message ? error.message : error) })
  }
}
