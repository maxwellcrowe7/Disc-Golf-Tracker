// Derived numbers shared by views. Pure functions over plain arrays so they're easy to test.
import { state } from '../data/store.js'
import { costFor } from './season.js'
import { matchRecord } from './matchplay.js'

export const roundsAtCourse = (courseId, rounds = state.rounds) =>
  rounds.filter((r) => r.course_id === courseId).sort((a, b) => b.played_on.localeCompare(a.played_on))

const scored = (rounds) => rounds.filter((r) => r.score != null && r.par != null)

export function avgToPar(rounds) {
  const s = scored(rounds)
  return s.length ? s.reduce((a, r) => a + r.score - r.par, 0) / s.length : null
}

export function avgRating(rounds) {
  const rated = rounds.filter((r) => r.rating)
  return rated.length ? Math.round(rated.reduce((a, r) => a + r.rating, 0) / rated.length) : null
}

export function bestToPar(rounds) {
  const s = scored(rounds)
  return s.length ? Math.min(...s.map((r) => r.score - r.par)) : null
}

const sum = (xs) => xs.reduce((a, b) => a + b, 0)
const year = (iso) => iso.slice(0, 4)

/**
 * Everything on Results → Stats. `season` limits it to one year ('2026'); omit for career.
 * Team rounds (doubles etc.) are left out of rating and to-par figures — they aren't PDGA-rated.
 */
export function statsFor({ events, rounds, matches, courses }, season) {
  const inSeason = (iso) => !season || year(iso) === season
  const evs = events.filter((e) => ['played', 'recorded'].includes(e.status) && inSeason(e.start_date))
  const evIds = new Set(evs.map((e) => e.id))
  const tRounds = rounds.filter((r) => r.kind === 'tournament' && evIds.has(r.event_id))
  const rated = tRounds.filter((r) => r.rating && !r.is_team)
  const league = rounds.filter((r) => r.kind === 'league' && inSeason(r.played_on))
  const placed = evs.filter((e) => e.place && e.field_size)

  const tournament = {
    events: evs.length,
    rounds: tRounds.length,
    avgRating: avgRating(rated),
    bestRating: rated.length ? Math.max(...rated.map((r) => r.rating)) : null,
    wins: evs.filter((e) => e.place === 1).length,
    podiums: evs.filter((e) => e.place && e.place <= 3).length,
    avgFinishPct: placed.length ? Math.round((sum(placed.map((e) => e.place / e.field_size)) / placed.length) * 100) : null,
    bestFinish: placed.length ? [...placed].sort((a, b) => a.place / a.field_size - b.place / b.field_size)[0] : null,
    matchRecord: matchRecord(matches.filter((m) => evIds.has(m.event_id))),
  }

  const leagueFees = sum(league.map((r) => r.fee || 0)), leagueCash = sum(league.map((r) => r.payout || 0))
  const leagues = {
    rounds: league.length,
    wins: league.filter((r) => r.place === 1).length,
    podiums: league.filter((r) => r.place && r.place <= 3).length,
    fees: leagueFees, cash: leagueCash, net: leagueCash - leagueFees,
  }

  // Tiers in the order players think of them.
  const TIER_ORDER = ['Major', 'Elite Series', 'NT', 'Pro Tour', 'Silver Series', 'A-Tier', 'B-Tier', 'C-Tier', 'XC-Tier']
  const tierKey = (e) => (e.pdga ? e.tier || 'PDGA' : 'Non-PDGA')
  const tiers = [...new Set(evs.map(tierKey))]
    .sort((a, b) => (TIER_ORDER.indexOf(a) + 1 || 99) - (TIER_ORDER.indexOf(b) + 1 || 99))
    .map((tier) => {
      const t = evs.filter((e) => tierKey(e) === tier), p = t.filter((e) => e.place)
      return { tier, events: t.length, top10: p.filter((e) => e.place <= 10).length, avgPlace: p.length ? sum(p.map((e) => e.place)) / p.length : null }
    })

  const divisions = [...new Set(evs.map((e) => e.division || '—'))].map((division) => {
    const d = evs.filter((e) => (e.division || '—') === division)
    return { division, events: d.length, wins: d.filter((e) => e.place === 1).length, years: [...new Set(d.map((e) => year(e.start_date)))].sort() }
  }).sort((a, b) => b.events - a.events)

  const costs = evs.map(costFor)
  const money = {
    entry: sum(costs.map((c) => c.entry)), caddy: sum(costs.map((c) => c.caddy)), lodging: sum(costs.map((c) => c.lodging)), gas: sum(costs.map((c) => c.gas)),
    tournamentEarnings: sum(evs.map((e) => e.payout || 0)), leagueFees, leagueCash,
  }
  money.spent = money.entry + money.caddy + money.lodging + money.gas + leagueFees
  money.earned = money.tournamentEarnings + leagueCash
  money.net = money.earned - money.spent

  const byYear = [...new Set(rated.map((r) => year(r.played_on)))].sort().reverse().map((y) => {
    const rs = rated.filter((r) => year(r.played_on) === y)
    return { year: y, rounds: rs.length, avg: avgRating(rs), best: Math.max(...rs.map((r) => r.rating)) }
  })

  const byRating = [...rated].sort((a, b) => b.rating - a.rating)
  // Lowest three only once there are enough rounds that the two lists can't overlap.
  const best = byRating.slice(0, 3), worst = byRating.length >= 6 ? byRating.slice(-3).reverse() : []

  const courseRows = courses.map((c) => {
    const rs = rated.filter((r) => r.course_id === c.id)
    return rs.length ? { course: c, rounds: rs.length, avg: avgRating(rs), best: Math.max(...rs.map((r) => r.rating)), worst: Math.min(...rs.map((r) => r.rating)) } : null
  }).filter(Boolean).sort((a, b) => b.avg - a.avg)

  return { tournament, leagues, tiers, divisions, money, byYear, best, worst, courses: courseRows }
}

// Seasons that have anything in them, newest first.
export const seasonsIn = ({ events, rounds }) =>
  [...new Set([...events.map((e) => year(e.start_date)), ...rounds.map((r) => year(r.played_on))])].sort().reverse()
