import { describe, it, expect } from 'vitest'
import { mapLegacy, stableId } from '../src/lib/migrate.js'

// A small hand-made blob in the old app's shape (not real data).
const legacy = {
  playerName: 'Test Player', pdgaNumber: '12345', pdgaRating: 950,
  courses: [
    { id: 'home', name: 'Home Park', location: 'Lansing, MI', holes: 18, notes: '' },
    { id: 'brp', name: 'Blue Ribbon Pines', location: 'East Bethel, MN', holes: 27 },
    { id: 'nocity', name: 'Mystery Woods', location: '' },
  ],
  leagues: [
    { id: 'L1', name: 'Tuesday Doubles', day: 'Tuesday', location: 'Home Park', color: '#2f7d5b' },
    { id: 'L2', name: 'Traveling League', day: 'Thursday', location: 'Some Other Park' },
    { id: 'L3', name: 'BRP Thursday', day: 'Thursday', location: 'Blue Ribbon Pines – East Bethel, MN' },
  ],
  tournaments: [
    { id: 'T1', name: 'Spring Open', date: '2026-04-18', numDays: 2, numRounds: 3, location: 'Holt, MI', tier: 'B-Tier', division: 'MPO', field: 40, place: 3, fee: 60, prize: 75, caddy: 20, courses: ['home', 'brp'] },
    { id: 'T2', name: 'Charity Fun Run', date: '2026-06-01', numRounds: 1, tier: 'Other', courses: ['gone'] },
    { id: 'T3', name: 'No Date Event' },
    { id: 'T4', name: 'Team Cup', date: '2026-10-17', numRounds: 3, tier: 'Other', notes: 'Team match play format.', courses: ['home'] },
  ],
  tRounds: [
    { id: 'r1', tournamentId: 'T1', courseId: 'home', roundNum: 1, date: '2026-04-18', par: 57, score: 52, rating: 1001 },
    { id: 'r2', tournamentId: 'T1', courseId: 'brp', roundNum: 2, date: '2026-04-19', par: 62, score: 60, rating: 980 },
    { id: 'r3', tournamentId: 'T2', courseId: 'brp', roundNum: 1, date: '', par: 70, score: 66 },
    { id: 'r4', tournamentId: 'GONE', courseId: 'home', roundNum: 1, date: '2026-01-01', par: 57, score: 55 },
    { id: 'm1', tournamentId: 'T4', courseId: 'home', roundNum: 1, date: '2026-10-17', par: null, score: null, notes: 'Lost a close one' },
    { id: 'm2', tournamentId: 'T4', courseId: 'home', roundNum: 2, date: '2026-10-17', par: null, score: 1 },
    { id: 'm3', tournamentId: 'T4', courseId: 'brp', roundNum: 3, date: '2026-10-17', par: null, score: 2 },
  ],
  leagueRounds: [
    { id: 'l1', leagueId: 'L1', courseId: 'home', date: '2026-05-05', par: 57, score: 51, place: 2, field: 20, fee: 5, cash: 15 },
    { id: 'l2', leagueId: 'L1', courseId: 'home', date: '2026-05-12', par: 57, score: 9999, place: 9, field: 22, fee: 5, cash: 0 },
    { id: 'l3', leagueId: 'L1', courseId: 'home', date: '', par: 57, score: 54 },
  ],
}

const out = mapLegacy(legacy, { today: '2026-11-05' })
const codes = out.report.warnings.map((w) => w.code)

describe('stable ids', () => {
  it('are uuid-shaped and repeatable', () => {
    expect(stableId('course:home')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(stableId('course:home')).toBe(stableId('course:home'))
    expect(stableId('course:home')).not.toBe(stableId('course:brp'))
  })
})

describe('courses', () => {
  it('splits city and state', () => expect(out.courses[0]).toMatchObject({ city: 'Lansing', state: 'MI' }))
  it('infers a fixed layout when every round there had the same par', () => {
    expect(out.courses.find((c) => c.legacy_id === 'home')).toMatchObject({ layout_mode: 'fixed', fixed_par: 57 })
    expect(out.courses.find((c) => c.legacy_id === 'brp')).toMatchObject({ layout_mode: 'varies', fixed_par: null })
  })
  it('flags a course with no city', () => expect(codes).toContain('no-location'))
})

describe('leagues', () => {
  it('links the home course by name', () => {
    const home = out.courses.find((c) => c.legacy_id === 'home')
    expect(out.leagues[0].home_course_id).toBe(home.id)
  })
  it('keeps an unknown home course in the notes', () => expect(out.leagues[1].notes).toContain('Some Other Park'))
  it('matches "Name – City, ST" picks from the old form', () => {
    expect(out.leagues[2].home_course_id).toBe(out.courses.find((c) => c.legacy_id === 'brp').id)
  })
})

describe('events', () => {
  const t1 = out.events.find((e) => e.legacy_id === 'T1')
  it('derives the end date from the day count', () => expect(t1).toMatchObject({ start_date: '2026-04-18', end_date: '2026-04-19' }))
  it('maps money, placing and caddy', () => expect(t1).toMatchObject({ entry_fee: 60, payout: 75, had_caddy: true, caddy_fee: 20, place: 3, field_size: 40 }))
  it('marks events with missing rounds as Played', () => expect(t1.status).toBe('played'))
  it('treats unknown tiers as non-PDGA', () => expect(out.events.find((e) => e.legacy_id === 'T2')).toMatchObject({ pdga: false, tier: null, status: 'recorded' }))
  it('skips events with no date at all', () => expect(out.events.some((e) => e.legacy_id === 'T3')).toBe(false))
  it('links courses and drops missing ones', () => {
    expect(out.eventCourses.filter((x) => x.event_id === t1.id)).toHaveLength(2)
    expect(codes).toContain('event-course')
  })
})

describe('rounds', () => {
  it('keeps par on every imported round', () => expect(out.rounds.filter((r) => r.score != null).every((r) => r.par != null)).toBe(true))
  it('falls back to the event date when a round has none', () => expect(out.rounds.find((r) => r.legacy_id === 't:r3').played_on).toBe('2026-06-01'))
  it('skips rounds whose tournament is gone', () => expect(out.rounds.some((r) => r.legacy_id === 't:r4')).toBe(false))
  it('blanks out-of-range scores instead of failing the import', () => {
    expect(out.rounds.find((r) => r.legacy_id === 'l:l2').score).toBeNull()
    expect(codes).toContain('bad-score')
  })
  it('maps league money and placing', () => expect(out.rounds.find((r) => r.legacy_id === 'l:l1')).toMatchObject({ kind: 'league', place: 2, field_size: 20, fee: 5, payout: 15 }))
  it('skips undated league rounds', () => expect(out.rounds.some((r) => r.legacy_id === 'l:l3')).toBe(false))
})

describe('match play', () => {
  const t4 = out.events.find((e) => e.legacy_id === 'T4')
  const ms = out.matches.filter((m) => m.event_id === t4.id)
  it('detects par-less match-point "rounds" as a match play event', () => expect(t4.format).toBe('match_play'))
  it('turns them into matches with results from the points', () => {
    expect(ms.map((m) => m.result)).toEqual(['L', 'P', 'W'])
    expect(ms[0].notes).toBe('Lost a close one')
    expect(ms[2].course_id).toBe(out.courses.find((c) => c.legacy_id === 'brp').id)
  })
  it('does not also import them as rounds', () => expect(out.rounds.some((r) => r.event_id === t4.id)).toBe(false))
})

describe('profile and rating', () => {
  it('copies name and PDGA number', () => expect(out.profile).toEqual({ name: 'Test Player', pdga_number: '12345' }))
  it('saves the current rating as a dated history entry', () => expect(out.ratings).toEqual([{ effective_date: '2026-11-05', rating: 950, source: 'legacy' }]))
})
