// Sign-in state and the launch sequence: demo mode without Supabase, otherwise resume a saved login.
import { supabase, isConfigured } from '../lib/supabase.js'
import { state, loadDemo } from './store.js'
import { loadAll, fetchLegacy } from './api.js'
import { isoDate } from '../lib/format.js'

export { isConfigured }

// Opening the app from a password-reset email signs in from the link and fires this.
if (supabase) supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') state.recovery = true })

export async function refresh() {
  const data = await loadAll()
  Object.assign(state, {
    today: isoDate(new Date()),
    profile: { name: '', pdga_number: '', home_label: '', home_lat: null, home_lng: null, ...(data.profile || {}) },
    ratings: data.ratings, courses: data.courses, leagues: data.leagues,
    events: data.events, rounds: data.rounds, matches: data.matches,
  })
}

async function start(session) {
  state.userId = session.user.id
  state.email = session.user.email
  state.demo = false
  await refresh()
  // First visit after the rebuild: offer to bring the old app's data across.
  if (!state.profile.legacy_imported_at) state.legacy = await fetchLegacy()
  state.ready = true
}

export async function restoreSession() {
  if (!isConfigured) { loadDemo(); return }
  const { data } = await supabase.auth.getSession()
  if (data.session) await start(data.session)
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  await start(data.session)
}

// Returns true when the account is ready to use, false when Supabase wants the email confirmed first.
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  if (!data.session) return false
  await start(data.session)
  return true
}

export async function sendReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })
  if (error) throw error
}

export async function setNewPassword(password) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
  state.recovery = false
  if (!state.ready) {
    const { data } = await supabase.auth.getSession()
    if (data.session) await start(data.session)
  }
}

// Signing out reloads the page so no data stays in memory.
export async function signOut() {
  await supabase?.auth.signOut()
  location.replace(location.pathname + '#/login')
  location.reload()
}
