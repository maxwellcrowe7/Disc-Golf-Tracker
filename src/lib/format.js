// Dates, money, and scorecard formatting shared across views.

export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Noon avoids a date slipping a day across time zones.
export const parseDate = (iso) => new Date(iso + 'T12:00:00')
export const isoDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
export const pad2 = (n) => String(n).padStart(2, '0')

export const fmtDate = (iso) => { const d = parseDate(iso); return `${MON[d.getMonth()]} ${d.getDate()}` }
export const fmtDateY = (iso) => `${fmtDate(iso)}, ${parseDate(iso).getFullYear()}`
export const fmtDow = (iso) => `${DOW[parseDate(iso).getDay()]}, ${fmtDate(iso)}`

export function fmtRange(start, end) {
  if (!end || start === end) return fmtDow(start)
  const a = parseDate(start), b = parseDate(end)
  if (a.getMonth() === b.getMonth()) return `${MON[a.getMonth()]} ${a.getDate()}–${b.getDate()}`
  return `${fmtDate(start)} – ${fmtDate(end)}`
}

export const daysBetween = (fromIso, toIso) => Math.round((parseDate(toIso) - parseDate(fromIso)) / 864e5)

export const money = (v) => '$' + Math.round(v).toLocaleString()

export function ord(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export const coords = (lat, lng) =>
  `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`

// ── Scorecard notation: circle = under par, double circle = 5+ under, box = over ──
export const relTxt = (d) => (d === 0 ? 'E' : d > 0 ? '+' + d : '−' + Math.abs(d))
export const scClass = (d) => (d <= -5 ? 'eagle' : d < 0 ? 'under' : d > 0 ? 'over' : 'even')

export const FORMAT = { singles: 'Singles', doubles: 'Doubles', triples: 'Triples', team_doubles: 'Team Doubles', match_play: 'Match Play' }
export const STATUS = { interested: 'Interested', planning: 'Planning', registered: 'Registered', waitlisted: 'Waitlisted', withdrew: 'Withdrew', played: 'Played', recorded: 'Recorded' }

// Splits a title so the last word can be set in italic.
export function splitLast(s) {
  const w = s.trim().split(' ')
  return w.length < 2 ? { head: '', last: s } : { head: w.slice(0, -1).join(' '), last: w[w.length - 1] }
}
