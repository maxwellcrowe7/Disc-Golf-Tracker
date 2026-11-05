// Derived numbers shared by views. Pure functions over the store so they're easy to test.
import { state } from '../data/store.js'

export const roundsAtCourse = (courseId, rounds = state.rounds) =>
  rounds.filter((r) => r.course_id === courseId).sort((a, b) => b.played_on.localeCompare(a.played_on))

export function avgToPar(rounds) {
  const scored = rounds.filter((r) => r.score != null && r.par != null)
  if (!scored.length) return null
  return scored.reduce((a, r) => a + r.score - r.par, 0) / scored.length
}

export function avgRating(rounds) {
  const rated = rounds.filter((r) => r.rating)
  return rated.length ? Math.round(rated.reduce((a, r) => a + r.rating, 0) / rated.length) : null
}

export function bestToPar(rounds) {
  const scored = rounds.filter((r) => r.score != null && r.par != null)
  return scored.length ? Math.min(...scored.map((r) => r.score - r.par)) : null
}
