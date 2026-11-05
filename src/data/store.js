// App data, shaped like the dg_ tables in docs/REBUILD-SPEC.md (snake_case, one array per table).
// Until Supabase is wired up the store is filled from the demo data.
import { reactive } from 'vue'
import * as demo from './demo.js'
import { isoDate } from '../lib/format.js'

export const state = reactive({
  ready: false,
  demo: true,
  today: isoDate(new Date()),
  profile: { name: '', pdga_number: '', home_label: '', home_lat: null, home_lng: null },
  ratings: [],
  courses: [],
  leagues: [],
  events: [],
  rounds: [],
  matches: [],
})

export const courseById = (id) => state.courses.find((c) => c.id === id)
export const eventById = (id) => state.events.find((e) => e.id === id)
export const leagueById = (id) => state.leagues.find((l) => l.id === id)
export const plateNumber = (id) => 'Pl. ' + String(state.courses.findIndex((c) => c.id === id) + 1).padStart(2, '0')

// '1h 05m' / '28 min' → minutes
function minutes(t) {
  if (!t) return null
  const h = /(\d+)\s*h/.exec(t), m = /(\d+)\s*m/.exec(t)
  return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0)
}

// Translate the design-sample data into the table shapes.
export function demoData() {
  const fixed = new Set(['c1', 'c2'])
  const courses = demo.COURSES.map((c) => {
    const [city, st] = c.city.split(', ')
    return {
      id: c.id, name: c.name, city, state: st, lat: c.lat, lng: c.lng, holes: c.holes, terrain: c.terrain,
      layout_mode: fixed.has(c.id) ? 'fixed' : 'varies', fixed_par: fixed.has(c.id) ? c.par : null,
      length_ft: +c.length.replace(/\D/g, ''), notes: '',
    }
  })
  const fmt = { 'match-play': 'match_play', 'team-doubles': 'team_doubles' }
  const events = demo.EVENTS.map((e) => ({
    id: e.id, name: e.name, start_date: e.start, end_date: e.end, city: e.city, lat: e.lat, lng: e.lng,
    pdga: e.pdga, tier: e.tier || null, division: e.division || null, format: fmt[e.format] || e.format,
    status: e.status, waitlist_pos: e.waitlistPos || null, reg_opens_on: e.regOpens || null, remind: !!e.remind,
    event_url: '', entry_fee: e.fee, fee_split: e.feeSplit || 1, had_caddy: false, caddy_fee: null,
    rounds_planned: e.rounds || (e.roundLog || []).length || null, holes_per_match: e.holesPerMatch || null,
    team_name: e.team || null, partners: e.partner ? e.partner.split(', ') : [],
    place: e.result?.place ?? null, field_size: e.result?.field ?? null, field_unit: e.result?.unit || 'players',
    payout: e.result?.payout ?? null, notes: e.notes || '',
    home_drive_minutes: minutes(e.drive?.fromHome?.time), home_drive_miles: e.drive?.fromHome?.mi ?? null,
    courses: e.courses.map((cid) => ({
      course_id: cid, drive_minutes: minutes(e.drive?.toCourses?.[cid]?.time), drive_miles: e.drive?.toCourses?.[cid]?.mi ?? null,
    })),
    lodging: e.lodging ? { ...e.lodging } : null,
  }))
  const rounds = []
  demo.EVENTS.forEach((e) => (e.roundLog || []).forEach((r) => rounds.push({
    id: `${e.id}-r${r.n}`, kind: 'tournament', event_id: e.id, league_id: null, course_id: r.course, played_on: r.date,
    round_number: r.n, par: r.par, score: r.score, rating: r.rating || null, place: null, field_size: null,
    fee: null, payout: null, is_team: e.format !== 'singles', notes: '',
  })))
  demo.LEAGUE_ROUNDS.forEach((r) => rounds.push({
    id: r.id, kind: 'league', event_id: null, league_id: r.league, course_id: r.course, played_on: r.date,
    round_number: null, par: r.par, score: r.score, rating: null, place: r.place, field_size: r.field,
    fee: r.fee, payout: r.cash, is_team: false, notes: '',
  }))
  const matches = []
  demo.EVENTS.forEach((e) => (e.matches || []).forEach((m) => matches.push({
    id: `${e.id}-m${m.n}`, event_id: e.id, match_number: m.n, opponent: m.opponent, opponent_team: m.oppTeam, holes: m.holes,
  })))
  return {
    today: isoDate(demo.TODAY),
    profile: { name: demo.PLAYER.name, pdga_number: String(demo.PLAYER.pdga), home_label: demo.HOME.city, home_lat: demo.HOME.lat, home_lng: demo.HOME.lng },
    ratings: demo.RATING_HISTORY.map((r, i) => ({ id: 'rh' + i, effective_date: r.d + '-01', rating: r.r, source: 'manual' })),
    courses,
    leagues: demo.LEAGUES.map((l) => ({ id: l.id, name: l.name, day_time: l.when, home_course_id: l.course, color: l.color, notes: '', active: true, next_on: l.next })),
    events, rounds, matches,
  }
}

export function loadDemo() {
  Object.assign(state, demoData(), { demo: true, ready: true })
}
