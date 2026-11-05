// Event-level derived data: upcoming vs past, trip costs, and the "before the next round" list.
// Pure functions over plain arrays (callers pass the store) so they're easy to test.
import { daysBetween, fmtDate } from './format.js'

const GAS_PER_MILE = 3.4 / 27 // $/gal ÷ mpg — a rough estimate for the trip receipt

// An event is upcoming until its last day has passed (and it hasn't been logged as played).
export const isUpcoming = (e, today) => (e.end_date || e.start_date) >= today && !['played', 'recorded'].includes(e.status)
export const upcomingEvents = (events, today) => events.filter((e) => isUpcoming(e, today) && e.status !== 'withdrew').sort((a, b) => a.start_date.localeCompare(b.start_date))
export const pastEvents = (events, today) => events.filter((e) => !isUpcoming(e, today)).sort((a, b) => b.start_date.localeCompare(a.start_date))

// Round-trip miles from home (to the stay if there is one, else straight to the event).
export const tripMiles = (e) => {
  const one = e.lodging?.drive_miles ?? e.home_drive_miles
  return one == null ? null : one * 2
}

// What the trip costs you: your share of entry, caddy, your share of the stay, and gas.
export function costFor(e) {
  const entry = e.entry_fee != null ? e.entry_fee / (e.fee_split || 1) : 0
  const caddy = e.had_caddy ? e.caddy_fee || 0 : 0
  const lodging = e.lodging?.cost ? e.lodging.cost / (e.lodging.split || 1) : 0
  const miles = tripMiles(e)
  const gas = miles ? Math.round((miles * GAS_PER_MILE) / (e.lodging?.split || 1)) : 0
  return { entry, caddy, lodging, gas, total: entry + caddy + lodging + gas, payout: e.payout || 0 }
}

// To-dos for Home: finish played events, registrations opening soon, waitlists.
export function todos({ events, rounds, matches }, today) {
  const out = []
  for (const e of events.filter((x) => x.status === 'played').sort((a, b) => b.start_date.localeCompare(a.start_date))) {
    const logged = e.format === 'match_play' ? matches.filter((m) => m.event_id === e.id).length : rounds.filter((r) => r.event_id === e.id).length
    const missing = (e.rounds_planned || 0) - logged
    const unit = e.format === 'match_play' ? (missing > 1 ? 'matches' : 'match') : missing > 1 ? 'rounds' : 'round'
    out.push({ kind: 'finish', event: e, tone: 'played', title: `Finish ${e.name}`, sub: missing > 0 ? `${missing} ${unit} still to log` : 'Add notes, then mark it recorded', when: 'Now' })
  }
  for (const e of upcomingEvents(events, today)) {
    if (['interested', 'planning'].includes(e.status) && e.reg_opens_on) {
      const d = daysBetween(today, e.reg_opens_on)
      if (d >= 0 && d <= 130) out.push({ kind: 'register', event: e, tone: 'planning', title: `Register · ${e.name}`, sub: `Opens ${fmtDate(e.reg_opens_on)}${e.remind ? ' · reminder set' : ''}`, when: d === 0 ? 'Today' : `${d} days` })
      else if (d < 0 && e.status === 'planning') out.push({ kind: 'register', event: e, tone: 'planning', title: `Register · ${e.name}`, sub: 'Registration is open', when: 'Open' })
    }
    if (e.status === 'waitlisted') out.push({ kind: 'waitlist', event: e, tone: 'waitlisted', title: `Waitlist · ${e.name}`, sub: e.waitlist_pos ? `You're #${e.waitlist_pos}` : 'On the waitlist', when: fmtDate(e.start_date) })
  }
  return out
}
