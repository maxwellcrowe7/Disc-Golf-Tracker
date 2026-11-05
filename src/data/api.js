// Supabase reads and writes. Every write touches only the rows it changes, so two
// open devices can't overwrite each other the way the old single-blob save could.
import { supabase } from '../lib/supabase.js'
import { mapLegacy } from '../lib/migrate.js'

const TABLES = ['dg_profiles', 'dg_rating_history', 'dg_courses', 'dg_leagues', 'dg_events', 'dg_event_courses', 'dg_lodging', 'dg_rounds', 'dg_matches']

async function q(promise) {
  const { data, error } = await promise
  if (error) throw error
  return data
}

const all = (table) => q(supabase.from(table).select('*'))

// Fetch every table and shape it for the store (events carry their courses + lodging).
export async function loadAll() {
  const [profiles, ratings, courses, leagues, events, eventCourses, lodging, rounds, matches] = await Promise.all(TABLES.map(all))
  return {
    profile: profiles[0] || null,
    ratings: ratings.sort((a, b) => a.effective_date.localeCompare(b.effective_date)),
    courses: courses.sort((a, b) => a.name.localeCompare(b.name)),
    leagues,
    events: events.map((e) => ({
      ...e,
      courses: eventCourses.filter((x) => x.event_id === e.id).sort((a, b) => a.sort - b.sort)
        .map(({ course_id, drive_minutes, drive_miles }) => ({ course_id, drive_minutes, drive_miles })),
      lodging: lodging.find((x) => x.event_id === e.id) || null,
    })),
    rounds,
    matches,
  }
}

// ── profile ──
export const saveProfile = (userId, fields) =>
  q(supabase.from('dg_profiles').upsert({ user_id: userId, ...fields }, { onConflict: 'user_id' }).select().single())

// ── rating history (one entry per date; saving a date again replaces its rating) ──
export const saveRatings = (rows) =>
  q(supabase.from('dg_rating_history').upsert(rows, { onConflict: 'user_id,effective_date' }).select())

export const deleteRating = (id) => q(supabase.from('dg_rating_history').delete().eq('id', id))

// ── the old app's data (public.app_state) ──
export async function fetchLegacy() {
  const row = await q(supabase.from('app_state').select('data, updated_at').eq('app', 'disc-golf-tracker').maybeSingle())
  return row ? { blob: row.data, savedAt: row.updated_at } : null
}

// Copy the old blob into the new tables. Ids are derived from the old ids, so this is
// safe to repeat: rows are upserted, never duplicated. The old app_state row is left as-is.
export async function runLegacyImport(userId, blob, today, onStep = () => {}) {
  const m = mapLegacy(blob, { today })
  const steps = [
    ['courses', () => m.courses.length && q(supabase.from('dg_courses').upsert(m.courses))],
    ['leagues', () => m.leagues.length && q(supabase.from('dg_leagues').upsert(m.leagues))],
    ['events', () => m.events.length && q(supabase.from('dg_events').upsert(m.events))],
    ['event courses', () => m.eventCourses.length && q(supabase.from('dg_event_courses').upsert(m.eventCourses, { onConflict: 'event_id,course_id' }))],
    ['rounds', () => m.rounds.length && q(supabase.from('dg_rounds').upsert(m.rounds))],
    ['matches', () => m.matches.length && q(supabase.from('dg_matches').upsert(m.matches))],
    // Keep any rating already entered for the same date.
    ['rating', () => m.ratings.length && q(supabase.from('dg_rating_history').upsert(m.ratings, { onConflict: 'user_id,effective_date', ignoreDuplicates: true }))],
  ]
  for (const [label, run] of steps) { onStep(label); await run() }
  onStep('profile')
  const existing = await q(supabase.from('dg_profiles').select('*').eq('user_id', userId).maybeSingle())
  await saveProfile(userId, {
    name: existing?.name || m.profile.name,
    pdga_number: existing?.pdga_number || m.profile.pdga_number,
    legacy_imported_at: new Date().toISOString(),
  })
  return m.report
}

// ── backup: every dg_ table as JSON; restore merges rows back in (upsert, never deletes) ──
export async function exportBackup() {
  const tables = {}
  for (const t of TABLES) tables[t] = await all(t)
  return { app: 'disc-golf-tracker', version: 2, exported_at: new Date().toISOString(), tables }
}

const CONFLICT = { dg_profiles: 'user_id', dg_rating_history: 'user_id,effective_date', dg_event_courses: 'event_id,course_id' }

export async function restoreBackup(backup) {
  if (backup?.app !== 'disc-golf-tracker' || backup.version !== 2 || !backup.tables) throw new Error("That file isn't a backup from this version of the app")
  for (const t of TABLES) {
    const rows = backup.tables[t] || []
    if (!rows.length) continue
    // user_id comes from the signed-in account, not the file (lets a backup move between accounts).
    const clean = rows.map(({ user_id, created_at, updated_at, ...r }) => r)
    await q(supabase.from(t).upsert(clean, CONFLICT[t] ? { onConflict: CONFLICT[t] } : {}))
  }
}
