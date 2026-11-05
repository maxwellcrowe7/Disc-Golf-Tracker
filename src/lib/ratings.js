// Parse pasted rating history — e.g. a copy of the PDGA "Ratings History" table, or plain
// "2026-10-14 1001" lines. Each line needs a date and a rating (400–1200); anything else is ignored.

const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 }
const pad = (n) => String(n).padStart(2, '0')

const DATE_PATTERNS = [
  // 2026-10-14
  [/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/, (m) => [+m[1], +m[2], +m[3]]],
  // 14-Oct-2026 (PDGA)
  [/\b(\d{1,2})-([A-Za-z]{3,4})-(\d{4})\b/, (m) => [+m[3], MON[m[2].toLowerCase()], +m[1]]],
  // Oct 14, 2026 / October 14 2026
  [/\b([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})\b/, (m) => [+m[3], MON[m[1].slice(0, 3).toLowerCase()], +m[2]]],
  // 10/14/2026
  [/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/, (m) => [+m[3], +m[1], +m[2]]],
]

export function parseRatingLines(text) {
  const out = new Map() // one rating per date; a later line for the same date wins
  for (const line of text.split(/\r?\n/)) {
    for (const [re, toYmd] of DATE_PATTERNS) {
      const m = re.exec(line)
      if (!m) continue
      const [y, mo, d] = toYmd(m)
      if (!y || !mo || !d || mo > 12 || d > 31) break
      const rest = line.slice(0, m.index) + ' ' + line.slice(m.index + m[0].length)
      const rating = (rest.match(/(?<![+\-\d])\d{3,4}(?!\d)/g) || []).map(Number).find((n) => n >= 400 && n <= 1200)
      if (rating) out.set(`${y}-${pad(mo)}-${pad(d)}`, rating)
      break
    }
  }
  return [...out].map(([effective_date, rating]) => ({ effective_date, rating })).sort((a, b) => a.effective_date.localeCompare(b.effective_date))
}
