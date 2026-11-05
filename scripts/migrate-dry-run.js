// Dry run of the old → new data import. Reads an export from the current app and prints
// what would be written — nothing touches Supabase.
//   node scripts/migrate-dry-run.js dg-tracker-2026-11-05.json
import { readFileSync } from 'node:fs'
import { mapLegacy } from '../src/lib/migrate.js'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/migrate-dry-run.js <export.json>')
  process.exit(1)
}

const today = new Date().toISOString().slice(0, 10)
const { report, events, rounds, leagues } = mapLegacy(JSON.parse(readFileSync(file, 'utf8')), { today })

console.log('\nOld app                     → New tables')
console.log(`  ${report.source.courses} courses                 → ${report.counts.courses} dg_courses`)
console.log(`  ${report.source.leagues} leagues                  → ${report.counts.leagues} dg_leagues`)
console.log(`  ${report.source.tournaments} tournaments             → ${report.counts.events} dg_events (+ ${report.counts.eventCourses} event-course links)`)
console.log(`  ${report.source.tRounds} tournament rounds       → ${report.counts.tournamentRounds} dg_rounds (tournament)`)
console.log(`  ${report.source.leagueRounds} league rounds           → ${report.counts.leagueRounds} dg_rounds (league)`)
console.log(`  match-point "rounds"      → ${report.counts.matches} dg_matches`)
console.log(`  current rating            → ${report.counts.ratings} dg_rating_history`)

console.log(`\nLeague home courses linked: ${leagues.filter((l) => l.home_course_id).length} of ${leagues.length}`)
console.log(`Event formats: ${[...new Set(events.map((e) => e.format))].map((f) => `${events.filter((e) => e.format === f).length} ${f}`).join(', ')}`)
console.log(`Event statuses: ${['recorded', 'played'].map((s) => `${events.filter((e) => e.status === s).length} ${s}`).join(', ')}`)
console.log(`Rated rounds: ${rounds.filter((r) => r.rating).length} · rounds missing a score or par: ${rounds.filter((r) => r.par == null || r.score == null).length}`)

const groups = {}
for (const w of report.warnings) (groups[w.code] ||= []).push(w.msg)
console.log(`\nNotes (${report.warnings.length})`)
for (const [code, msgs] of Object.entries(groups)) {
  console.log(`\n  [${code}] ×${msgs.length}`)
  msgs.forEach((m) => console.log('   · ' + m))
}
console.log('')
