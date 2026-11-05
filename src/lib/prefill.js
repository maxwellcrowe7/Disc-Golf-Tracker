// Smart defaults for the round sheet: work out what's being logged from where it was opened.
// Pure functions over plain data so they're easy to test.
import { parseDate, isoDate, DOW } from './format.js'

export function eventDays(ev) {
  const days = []
  for (let d = parseDate(ev.start_date); d <= parseDate(ev.end_date || ev.start_date); d.setDate(d.getDate() + 1)) days.push(isoDate(d))
  return days
}

// First round number not logged yet (fills gaps, e.g. R2 missing while R3 exists).
export function nextRoundNumber(ev, rounds) {
  const logged = new Set(rounds.filter((r) => r.event_id === ev.id).map((r) => r.round_number))
  const upTo = Math.max(ev.rounds_planned || 0, logged.size + 1)
  for (let n = 1; n <= upTo; n++) if (!logged.has(n)) return n
  return upTo + 1
}

// One course → that course. Several → the one played least so far in this event; a tie → none (ask).
export function suggestCourse(ev, rounds) {
  const ids = (ev.courses || []).map((c) => c.course_id)
  if (ids.length === 1) return { courseId: ids[0], why: 'only' }
  if (!ids.length) return { courseId: null, why: 'none' }
  const used = (id) => rounds.filter((r) => r.event_id === ev.id && r.course_id === id).length
  const min = Math.min(...ids.map(used))
  const least = ids.filter((id) => used(id) === min)
  return least.length === 1 ? { courseId: least[0], why: 'least' } : { courseId: null, why: 'pick' }
}

// Spread planned rounds across the event's days (3 rounds over 2 days → R1, R2 day one; R3 day two).
export function suggestDate(ev, roundNumber) {
  const days = eventDays(ev)
  const perDay = Math.ceil((ev.rounds_planned || days.length) / days.length)
  return days[Math.min(days.length - 1, Math.floor((roundNumber - 1) / perDay))]
}

// Most recent league night on or before today, from day_time like "Tue · 6:00 PM".
export function lastLeagueNight(league, today) {
  const dow = DOW.indexOf((league.day_time || '').slice(0, 3))
  if (dow < 0) return today
  const d = parseDate(today)
  while (d.getDay() !== dow) d.setDate(d.getDate() - 1)
  return isoDate(d)
}

// For leagues: "Top 12%"-style finish from place and field size.
export const percentile = (place, field) => (place > 0 && field >= place ? Math.max(1, Math.round((place / field) * 100)) : null)
