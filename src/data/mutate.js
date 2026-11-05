// Create / update / delete for every kind of record. Signed in, each call writes just the
// rows it touches to Supabase and reloads; in demo mode the same calls edit the in-memory data
// so every flow can be tried without an account.
import { supabase } from '../lib/supabase.js'
import { state } from './store.js'
import { refresh } from './session.js'

const newId = () => crypto.randomUUID()

async function q(promise) {
  const { data, error } = await promise
  if (error) throw error
  return data
}

// Keep only the columns a table accepts (forms carry extra UI-only fields).
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k] === '' ? null : obj[k]]))

const COLS = {
  dg_courses: ['id', 'name', 'city', 'state', 'lat', 'lng', 'holes', 'terrain', 'length_ft', 'notes'],
  dg_leagues: ['id', 'name', 'day_time', 'home_course_id', 'color', 'notes', 'active'],
  dg_events: ['id', 'name', 'start_date', 'end_date', 'city', 'lat', 'lng', 'pdga', 'tier', 'division', 'format', 'status', 'waitlist_pos', 'reg_opens_on', 'remind', 'event_url', 'entry_fee', 'fee_split', 'had_caddy', 'caddy_fee', 'rounds_planned', 'holes_per_match', 'team_name', 'partners', 'place', 'field_size', 'field_unit', 'payout', 'home_drive_minutes', 'home_drive_miles', 'notes'],
  dg_lodging: ['id', 'event_id', 'type', 'name', 'address', 'lat', 'lng', 'nights', 'cost', 'split', 'drive_minutes', 'drive_miles'],
  dg_rounds: ['id', 'kind', 'event_id', 'league_id', 'course_id', 'played_on', 'round_number', 'par', 'score', 'rating', 'place', 'field_size', 'fee', 'payout', 'is_team', 'notes'],
  dg_matches: ['id', 'event_id', 'match_number', 'course_id', 'opponent', 'opponent_team', 'holes', 'hole_count', 'result', 'notes'],
}
const STATE_KEY = { dg_courses: 'courses', dg_leagues: 'leagues', dg_rounds: 'rounds', dg_matches: 'matches' }

function localUpsert(list, row) {
  const i = list.findIndex((x) => x.id === row.id)
  if (i < 0) list.push(row)
  else list[i] = { ...list[i], ...row }
}

async function save(table, obj) {
  const row = pick({ ...obj, id: obj.id || newId() }, COLS[table])
  if (state.demo) localUpsert(state[STATE_KEY[table]], row)
  else { await q(supabase.from(table).upsert(row)); await refresh() }
  return row.id
}

async function remove(table, id) {
  if (state.demo) {
    const key = STATE_KEY[table]
    state[key] = state[key].filter((x) => x.id !== id)
  } else {
    await q(supabase.from(table).delete().eq('id', id))
    await refresh()
  }
}

export const saveCourse = (c) => save('dg_courses', c)
export const saveLeague = (l) => save('dg_leagues', l)
export const saveRound = (r) => save('dg_rounds', r)
export const saveMatch = (m) => save('dg_matches', m)
export const deleteLeague = (id) => remove('dg_leagues', id)
export const deleteRound = (id) => remove('dg_rounds', id)
export const deleteMatch = (id) => remove('dg_matches', id)

export async function deleteCourse(id) {
  await remove('dg_courses', id)
  if (state.demo) {
    // Mirror the database: rounds keep their row but lose the course; event links go away.
    state.rounds.forEach((r) => { if (r.course_id === id) r.course_id = null })
    state.events.forEach((e) => { e.courses = e.courses.filter((x) => x.course_id !== id) })
  }
}

/**
 * Events carry their course links and overnight stay; all three are saved together.
 * @param {object} ev  dg_events fields plus `courses: [{course_id, drive_minutes, drive_miles}]` and `lodging` (object or null)
 */
export async function saveEvent(ev) {
  const id = ev.id || newId()
  const row = pick({ ...ev, id }, COLS.dg_events)
  const links = (ev.courses || []).map((c, i) => ({ event_id: id, course_id: c.course_id, sort: i, drive_minutes: c.drive_minutes ?? null, drive_miles: c.drive_miles ?? null }))
  const stay = ev.lodging && (ev.lodging.name || ev.lodging.cost) ? pick({ ...ev.lodging, id: ev.lodging.id || newId(), event_id: id }, COLS.dg_lodging) : null

  if (state.demo) {
    localUpsert(state.events, { ...row, courses: links.map(({ course_id, drive_minutes, drive_miles }) => ({ course_id, drive_minutes, drive_miles })), lodging: stay })
    return id
  }
  await q(supabase.from('dg_events').upsert(row))
  // Replace the course links wholesale — simpler than diffing, and they're tiny.
  await q(supabase.from('dg_event_courses').delete().eq('event_id', id))
  if (links.length) await q(supabase.from('dg_event_courses').insert(links))
  if (stay) await q(supabase.from('dg_lodging').upsert(stay, { onConflict: 'event_id' }))
  else await q(supabase.from('dg_lodging').delete().eq('event_id', id))
  await refresh()
  return id
}

export async function setEventStatus(id, status) {
  if (state.demo) { const e = state.events.find((x) => x.id === id); if (e) e.status = status; return }
  await q(supabase.from('dg_events').update({ status }).eq('id', id))
  await refresh()
}

export async function deleteEvent(id) {
  if (state.demo) {
    state.events = state.events.filter((e) => e.id !== id)
    state.rounds = state.rounds.filter((r) => r.event_id !== id)
    state.matches = state.matches.filter((m) => m.event_id !== id)
    return
  }
  // Rounds, matches, course links and the stay are removed by the database (on delete cascade).
  await q(supabase.from('dg_events').delete().eq('id', id))
  await refresh()
}
