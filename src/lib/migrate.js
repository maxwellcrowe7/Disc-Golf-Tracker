// Maps the old app's single JSON blob (public.app_state, app = 'disc-golf-tracker')
// onto the dg_ tables. Pure: no Vue, no network — the app (or the dry-run script) does the writing.
//
// Row ids are derived from the old ids, so running the import twice upserts the same
// rows instead of creating duplicates.

const KNOWN_PDGA_TIERS = new Set(['A-Tier', 'B-Tier', 'C-Tier', 'NT', 'Major', 'Pro Tour', 'Elite Series', 'Silver Series', 'XC-Tier'])

// Deterministic UUID-shaped id from a string (FNV-1a with four seeds).
export function stableId(s) {
  const part = (seed) => {
    let h = seed >>> 0
    for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0 }
    return h.toString(16).padStart(8, '0')
  }
  const hex = part(2166136261) + part(0x811c9dc5 ^ 0x5bd1e995) + part(0x27d4eb2f) + part(0x165667b1)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

const num = (v) => (v === '' || v == null || isNaN(+v) ? null : +v)
const inRange = (v, lo, hi) => (v != null && v >= lo && v <= hi ? v : null)
const clean = (v) => (typeof v === 'string' ? v.trim() : v) || null

function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function splitLocation(loc) {
  const s = clean(loc)
  if (!s) return { city: null, state: null }
  const i = s.lastIndexOf(',')
  return i < 0 ? { city: s, state: null } : { city: s.slice(0, i).trim(), state: s.slice(i + 1).trim() || null }
}

/**
 * @param {object} legacy  the old app's state blob
 * @param {{ today: string }} opts  ISO date used for the imported current rating
 */
export function mapLegacy(legacy, { today }) {
  const warn = []
  const note = (code, msg) => warn.push({ code, msg })
  const tournaments = legacy.tournaments || [], tRounds = legacy.tRounds || []
  const leagues = legacy.leagues || [], leagueRounds = legacy.leagueRounds || [], oldCourses = legacy.courses || []

  // ── courses (+ layout inference: one par across every round there → fixed layout) ──
  const courseId = new Map(oldCourses.map((c) => [c.id, stableId('course:' + c.id)]))
  const parsAt = new Map()
  for (const r of [...tRounds, ...leagueRounds]) {
    const par = inRange(num(r.par), 18, 200)
    if (r.courseId && par) (parsAt.get(r.courseId) || parsAt.set(r.courseId, []).get(r.courseId)).push(par)
  }
  const courses = oldCourses.map((c) => {
    const pars = parsAt.get(c.id) || []
    const distinct = [...new Set(pars)]
    const fixed = pars.length >= 2 && distinct.length === 1
    if (fixed) note('layout-fixed', `${c.name}: every round was par ${distinct[0]} (${pars.length} rounds) — set as a fixed layout`)
    else if (distinct.length > 1) note('layout-varies', `${c.name}: pars ${distinct.sort((a, b) => a - b).join(', ')} across ${pars.length} rounds — layout varies`)
    const holes = num(c.holes)
    if (holes != null && inRange(holes, 1, 54) == null) note('bad-holes', `${c.name}: hole count ${holes} out of range — left blank`)
    const loc = splitLocation(c.location)
    if (!loc.city) note('no-location', `${c.name}: no city — add one so it can go on the map`)
    return {
      id: courseId.get(c.id), legacy_id: c.id, name: clean(c.name) || 'Unnamed course', ...loc,
      holes: inRange(holes, 1, 54), terrain: 'mixed', layout_mode: fixed ? 'fixed' : 'varies', fixed_par: fixed ? distinct[0] : null,
      notes: clean(c.notes),
    }
  })
  const courseByName = new Map(courses.map((c) => [c.name.toLowerCase(), c.id]))
  // The old league form saved picks as "Name – City, ST"; match on the name part too.
  const findCourse = (text) => courseByName.get(text.toLowerCase()) || courseByName.get(text.split(' – ')[0].trim().toLowerCase()) || null

  // ── leagues ──
  const leagueId = new Map(leagues.map((l) => [l.id, stableId('league:' + l.id)]))
  const outLeagues = leagues.map((l) => {
    const home = clean(l.location)
    const homeId = home ? findCourse(home) : null
    if (home && !homeId) note('league-course', `${l.name}: home course “${home}” isn't in your course list — kept in the league notes`)
    return {
      id: leagueId.get(l.id), legacy_id: l.id, name: clean(l.name) || 'League', day_time: clean(l.day),
      home_course_id: homeId, color: clean(l.color), active: true,
      notes: [clean(l.notes), home && !homeId ? `Home course: ${home}` : null].filter(Boolean).join('\n') || null,
    }
  })

  // ── events ──
  const eventId = new Map(tournaments.map((t) => [t.id, stableId('event:' + t.id)]))
  const roundsOf = (tid) => tRounds.filter((r) => r.tournamentId === tid)
  const events = [], eventCourses = [], matchEvents = new Set()
  for (const t of tournaments) {
    const rs = roundsOf(t.id)
    const roundDates = rs.map((r) => r.date).filter(Boolean).sort()
    const start = clean(t.date) || roundDates[0]
    if (!start) { note('event-no-date', `${t.name}: no date and no dated rounds — skipped`); eventId.delete(t.id); continue }
    let end = addDays(start, Math.max(1, num(t.numDays) || 1) - 1)
    if (roundDates.length && roundDates[roundDates.length - 1] > end) end = roundDates[roundDates.length - 1]
    const tier = clean(t.tier)
    const pdga = KNOWN_PDGA_TIERS.has(tier)
    if (!pdga) note('tier', `${t.name}: tier “${tier || 'none'}” — imported as non-PDGA; flip it if it was sanctioned`)
    const planned = num(t.numRounds)
    const status = planned && rs.length < planned ? 'played' : 'recorded'
    // The old app had no match play, so it was logged as par-less "rounds" whose score is the
    // match points (2 win, 1 tie, 0/blank loss). Turn those into real matches.
    const blank = (v) => v == null || v === ''
    const isMatch = rs.length > 0 && rs.every((r) => blank(r.par) && (blank(r.score) || +r.score <= 2)) && /match/i.test(`${t.name} ${t.notes || ''}`)
    if (isMatch) { matchEvents.add(t.id); note('match-play', `${t.name}: imported as match play — ${rs.length} matches from the round scores (2 = win, 1 = tie, 0 or blank = loss); add opponents and holes later if you like`) }
    if (status === 'played') note('missing-rounds', `${t.name}: ${rs.length} of ${planned} rounds logged — marked Played so it shows up as needing details`)
    const caddy = num(t.caddy)
    events.push({
      id: eventId.get(t.id), legacy_id: t.id, name: clean(t.name) || 'Event', start_date: start, end_date: end,
      city: clean(t.location), // events keep "City, ST" together
      pdga, tier: pdga ? tier : null, division: clean(t.division), format: isMatch ? 'match_play' : 'singles', status,
      event_url: clean(t.url), entry_fee: num(t.fee), fee_split: 1, had_caddy: caddy > 0, caddy_fee: caddy > 0 ? caddy : null,
      rounds_planned: planned, place: num(t.place), field_size: num(t.field), field_unit: 'players', payout: num(t.prize),
      notes: clean(t.notes),
    })
    ;(t.courses || []).forEach((cid, i) => {
      if (courseId.has(cid)) eventCourses.push({ event_id: eventId.get(t.id), course_id: courseId.get(cid), sort: i })
      else note('event-course', `${t.name}: references a course that no longer exists — dropped`)
    })
  }

  // ── rounds (and matches, for match play events) ──
  const rounds = [], matches = []
  const score = (r, label) => {
    const par = inRange(num(r.par), 18, 200), sc = inRange(num(r.score), 18, 300), rating = inRange(num(r.rating), 400, 1200)
    if (r.par != null && r.par !== '' && par == null) note('bad-par', `${label}: par ${r.par} out of range — left blank`)
    if (r.score != null && r.score !== '' && sc == null) note('bad-score', `${label}: score ${r.score} out of range — left blank`)
    if (r.rating != null && r.rating !== '' && rating == null) note('bad-rating', `${label}: rating ${r.rating} out of range — left blank`)
    if (par == null || sc == null) note('no-score', `${label}: missing ${par == null ? 'par' : 'score'}`)
    return { par, score: sc, rating }
  }
  for (const r of tRounds) {
    const t = tournaments.find((x) => x.id === r.tournamentId)
    const ev = eventId.get(r.tournamentId)
    const label = `${t?.name || 'Unknown event'} R${r.roundNum ?? '?'}`
    if (!ev) { note('orphan-round', `${label}: its tournament is gone — skipped`); continue }
    if (r.courseId && !courseId.has(r.courseId)) note('round-course', `${label}: course no longer exists — course left blank`)
    if (matchEvents.has(r.tournamentId)) {
      matches.push({
        id: stableId('match:' + r.id), legacy_id: 'm:' + r.id, event_id: ev, match_number: num(r.roundNum) ?? matches.filter((m) => m.event_id === ev).length + 1,
        course_id: courseId.get(r.courseId) || null, holes: '', result: { 2: 'W', 1: 'P' }[num(r.score)] || 'L', notes: clean(r.notes),
      })
      continue
    }
    const ev2 = events.find((e) => e.id === ev)
    rounds.push({
      id: stableId('tround:' + r.id), legacy_id: 't:' + r.id, kind: 'tournament', event_id: ev, league_id: null,
      course_id: courseId.get(r.courseId) || null, played_on: clean(r.date) || ev2.start_date, round_number: num(r.roundNum),
      ...score(r, label), is_team: false, notes: clean(r.notes),
    })
  }
  for (const r of leagueRounds) {
    const l = leagues.find((x) => x.id === r.leagueId)
    const label = `${l?.name || 'League'} ${r.date || '(no date)'}`
    if (!clean(r.date)) { note('league-no-date', `${label}: no date — skipped`); continue }
    if (r.leagueId && !leagueId.has(r.leagueId)) note('round-league', `${label}: league no longer exists — imported without a league`)
    rounds.push({
      id: stableId('lround:' + r.id), legacy_id: 'l:' + r.id, kind: 'league', event_id: null, league_id: leagueId.get(r.leagueId) || null,
      course_id: courseId.get(r.courseId) || null, played_on: r.date, round_number: null,
      ...score(r, label), place: num(r.place), field_size: num(r.field), fee: num(r.fee), payout: num(r.cash), is_team: false, notes: clean(r.notes),
    })
  }

  // ── profile + current rating ──
  const rating = inRange(num(legacy.pdgaRating), 400, 1200)
  const ratings = rating ? [{ effective_date: today, rating, source: 'legacy' }] : []
  if (rating) note('rating', `Current rating ${rating} saved as of ${today}; import past ratings from PDGA in Settings`)
  const profile = { name: clean(legacy.playerName), pdga_number: clean(legacy.pdgaNumber) }

  const report = {
    counts: { courses: courses.length, leagues: outLeagues.length, events: events.length, eventCourses: eventCourses.length, rounds: rounds.length, tournamentRounds: rounds.filter((r) => r.kind === 'tournament').length, leagueRounds: rounds.filter((r) => r.kind === 'league').length, matches: matches.length, ratings: ratings.length },
    source: { courses: oldCourses.length, leagues: leagues.length, tournaments: tournaments.length, tRounds: tRounds.length, leagueRounds: leagueRounds.length },
    warnings: warn,
  }
  return { profile, ratings, courses, leagues: outLeagues, events, eventCourses, rounds, matches, report }
}
