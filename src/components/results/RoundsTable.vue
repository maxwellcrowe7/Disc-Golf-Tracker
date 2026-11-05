<script setup>
// Every round in one sortable table, with quick filters ("1000+ rated", "Under par", …).
// Tap a row to edit the round; the event or league name links to its page.
import { ref, computed } from 'vue'
import Icon from '../Icon.vue'
import ScoreMark from '../ScoreMark.vue'
import { state, courseById, eventById, leagueById } from '../../data/store.js'
import { fmtDateY, ord } from '../../lib/format.js'
import { openSheet } from '../../lib/sheet.js'
import RoundSheet from '../sheets/RoundSheet.vue'

const props = defineProps({ season: { type: String, default: '' } }) // '' = career

const QUICK = [
  { k: '1000', label: '1000+ rated', test: (r) => r.rating >= 1000 },
  { k: 'under', label: 'Under par', test: (r) => r.score != null && r.par != null && r.score < r.par },
  { k: 'rated', label: 'Rated only', test: (r) => !!r.rating },
  { k: 'team', label: 'Team rounds', test: (r) => r.is_team },
]
const quick = ref('')
const kind = ref('all')
const courseId = ref('')
const q = ref('')
const sort = ref({ key: 'played_on', dir: -1 })

const label = (r) => (r.event_id ? eventById(r.event_id)?.name : r.league_id ? leagueById(r.league_id)?.name : 'Casual round') || '—'
const link = (r) => (r.event_id ? `/event/${r.event_id}` : r.league_id ? '/results/leagues' : null)
const diff = (r) => (r.score != null && r.par != null ? r.score - r.par : null)

const courses = computed(() => [...new Set(state.rounds.map((r) => r.course_id).filter(Boolean))].map(courseById).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name)))
const rows = computed(() => {
  const s = q.value.trim().toLowerCase(), qk = QUICK.find((x) => x.k === quick.value)
  const keyOf = { played_on: (r) => r.played_on, label: (r) => label(r).toLowerCase(), course: (r) => (courseById(r.course_id)?.name || '').toLowerCase(), diff: (r) => diff(r) ?? 999, rating: (r) => r.rating ?? -1, score: (r) => r.score ?? 999 }[sort.value.key]
  return state.rounds
    .filter((r) => !props.season || r.played_on.startsWith(props.season))
    .filter((r) => kind.value === 'all' || r.kind === kind.value)
    .filter((r) => !courseId.value || r.course_id === courseId.value)
    .filter((r) => !qk || qk.test(r))
    .filter((r) => !s || `${label(r)} ${courseById(r.course_id)?.name || ''} ${r.notes || ''}`.toLowerCase().includes(s))
    .sort((a, b) => (keyOf(a) < keyOf(b) ? -1 : keyOf(a) > keyOf(b) ? 1 : 0) * sort.value.dir || b.played_on.localeCompare(a.played_on))
})
const summary = computed(() => {
  const rated = rows.value.filter((r) => r.rating && !r.is_team)
  return { n: rows.value.length, avg: rated.length ? Math.round(rated.reduce((a, r) => a + r.rating, 0) / rated.length) : null, best: rated.length ? Math.max(...rated.map((r) => r.rating)) : null }
})
function by(key) {
  sort.value = sort.value.key === key ? { key, dir: -sort.value.dir } : { key, dir: key === 'label' || key === 'course' || key === 'diff' || key === 'score' ? 1 : -1 }
}
const arrow = (key) => (sort.value.key === key ? (sort.value.dir > 0 ? '↑' : '↓') : '')
</script>

<template>
  <div class="rounds-tools">
    <div class="pills">
      <button v-for="x in QUICK" :key="x.k" class="pill" :class="{ on: quick === x.k }" @click="quick = quick === x.k ? '' : x.k">{{ x.label }}</button>
    </div>
    <div class="rounds-filters">
      <select v-model="kind" class="input"><option value="all">All rounds</option><option value="tournament">Tournament</option><option value="league">League</option><option value="casual">Casual</option></select>
      <select v-model="courseId" class="input"><option value="">Every course</option><option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option></select>
      <label class="search"><Icon name="search" size="sm" /><input v-model="q" placeholder="Search events, courses, notes" /></label>
    </div>
  </div>

  <div class="rounds-summary mono">{{ summary.n }} rounds<template v-if="summary.avg"> · avg rating {{ summary.avg }} · best {{ summary.best }}</template></div>

  <div class="card rounds-table">
    <div class="rt-head">
      <button @click="by('played_on')">Date {{ arrow('played_on') }}</button>
      <button @click="by('label')">Event / league {{ arrow('label') }}</button>
      <button class="desktop-only" @click="by('course')">Course {{ arrow('course') }}</button>
      <button class="num-col desktop-only" @click="by('score')">Score {{ arrow('score') }}</button>
      <button class="num-col" @click="by('diff')">To par {{ arrow('diff') }}</button>
      <button class="num-col" @click="by('rating')">Rating {{ arrow('rating') }}</button>
    </div>
    <button v-for="r in rows" :key="r.id" class="rt-row" @click="openSheet(RoundSheet, { id: r.id })">
      <span class="d">{{ fmtDateY(r.played_on) }}</span>
      <span class="l">
        <RouterLink v-if="link(r)" :to="link(r)" @click.stop>{{ label(r) }}</RouterLink><template v-else>{{ label(r) }}</template>
        <small>{{ r.kind === 'tournament' ? 'R' + (r.round_number || '?') : r.kind === 'league' ? (r.place ? ord(r.place) + (r.field_size ? ' of ' + r.field_size : '') : 'League') : 'Casual' }}<template v-if="r.is_team"> · team</template><span class="mobile-only"> · {{ courseById(r.course_id)?.name }}</span></small>
      </span>
      <span class="c desktop-only">{{ courseById(r.course_id)?.name || '—' }}</span>
      <span class="num-col desktop-only s">{{ r.score ?? '—' }}<small v-if="r.par"> / {{ r.par }}</small></span>
      <span class="num-col"><ScoreMark v-if="diff(r) !== null" :diff="diff(r)" /><template v-else>—</template></span>
      <span class="num-col rtg" :class="{ hi: r.rating >= 1000 }">{{ r.rating || '—' }}</span>
    </button>
    <p v-if="!rows.length" class="muted" style="padding: 18px">No rounds match.</p>
  </div>
</template>
