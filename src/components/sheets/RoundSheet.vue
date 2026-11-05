<script setup>
import { reactive, ref, computed } from 'vue'
import SheetFrame from '../SheetFrame.vue'
import Icon from '../Icon.vue'
import Plate from '../Plate.vue'
import { state, eventById, leagueById, courseById } from '../../data/store.js'
import { saveRound, deleteRound, setEventStatus } from '../../data/mutate.js'
import { trackDirty, commit } from '../../lib/sheet.js'
import { fmtDow, relTxt, scClass, money } from '../../lib/format.js'
import { eventDays, nextRoundNumber, suggestCourse, suggestDate, lastLeagueNight, percentile } from '../../lib/prefill.js'
import { toast } from '../../lib/toast.js'

const props = defineProps({ id: String, eventId: String, leagueId: String, courseId: String })
const existing = props.id ? state.rounds.find((r) => r.id === props.id) : null
const ev = eventById(props.eventId || existing?.event_id)
const lg = leagueById(props.leagueId || existing?.league_id)
const kind = existing?.kind || (ev ? 'tournament' : lg ? 'league' : 'casual')

// ── smart defaults (only for new rounds) ──
let why = ''
const init = { round_number: null, course_id: props.courseId || null, played_on: state.today, par: '', score: '', rating: '', place: '', field_size: '', fee: '', payout: '', notes: '' }
if (!existing && ev) {
  init.round_number = nextRoundNumber(ev, state.rounds)
  const s = suggestCourse(ev, state.rounds)
  init.course_id = s.courseId
  why = s.why
  init.played_on = suggestDate(ev, init.round_number)
}
if (!existing && lg) {
  init.course_id = lg.home_course_id
  init.played_on = lastLeagueNight(lg, state.today)
  const last = state.rounds.filter((r) => r.league_id === lg.id && r.fee != null).sort((a, b) => b.played_on.localeCompare(a.played_on))[0]
  init.fee = last?.fee ?? ''
}
const form = reactive({ ...init, ...(existing ? Object.fromEntries(Object.entries(existing).map(([k, v]) => [k, v ?? ''])) : {}) })
trackDirty(form)

const isTeam = computed(() => !!ev && ev.format !== 'singles')
const showRating = computed(() => kind === 'tournament' && !isTeam.value)
const courseChoices = computed(() => (ev ? ev.courses.map((x) => courseById(x.course_id)).filter(Boolean) : []))
const allCourses = computed(() => [...state.courses].sort((a, b) => a.name.localeCompare(b.name)))
const loggedNumbers = computed(() => (ev ? state.rounds.filter((r) => r.event_id === ev.id && r.id !== existing?.id).map((r) => r.round_number) : []))
const roundOptions = computed(() => Array.from({ length: Math.max(ev?.rounds_planned || 0, (form.round_number || 0), loggedNumbers.value.length + 1) }, (_, i) => i + 1))
const days = computed(() => (ev ? eventDays(ev) : []))
const lastPar = computed(() => {
  if (!form.course_id) return null
  const r = state.rounds.filter((x) => x.course_id === form.course_id && x.par && x.id !== existing?.id).sort((a, b) => b.played_on.localeCompare(a.played_on))[0]
  return r ? r.par : null
})

// ── score pad: the frame morphs circle (under) ↔ box (over) as the score crosses par ──
const diff = computed(() => (form.par !== '' && form.score !== '' ? +form.score - +form.par : null))
const dir = ref('')
function bump(by) {
  const base = form.score !== '' ? +form.score : form.par !== '' ? +form.par : 54
  form.score = Math.max(18, base + by)
  dir.value = ''
  requestAnimationFrame(() => { dir.value = by > 0 ? 'up' : 'down' })
}

const pct = computed(() => percentile(+form.place, +form.field_size))
const net = computed(() => (form.fee === '' && form.payout === '' ? null : (+form.payout || 0) - (+form.fee || 0)))

const confirmDupe = ref(false)
const dupe = computed(() => ev && form.round_number && loggedNumbers.value.includes(+form.round_number))

const n = (v) => (v === '' || v == null ? null : +v)
function save() {
  if (!form.course_id && kind !== 'tournament') return toast('Pick a course')
  if (!form.played_on) return toast('Pick a date')
  if (form.par === '' || form.score === '') return toast('Enter the par and your score')
  if (!(+form.par >= 18 && +form.par <= 200)) return toast('Par should be between 18 and 200')
  if (form.rating !== '' && !(+form.rating >= 400 && +form.rating <= 1200)) return toast('Rating should be between 400 and 1200')
  if (dupe.value && !confirmDupe.value) { confirmDupe.value = true; return }
  commit(async () => {
    await saveRound({
      id: existing?.id, kind, event_id: ev?.id || null, league_id: lg?.id || null, course_id: form.course_id || null,
      played_on: form.played_on, round_number: kind === 'tournament' ? n(form.round_number) : null,
      par: n(form.par), score: n(form.score), rating: showRating.value ? n(form.rating) : null,
      place: kind === 'league' ? n(form.place) : null, field_size: kind === 'league' ? n(form.field_size) : null,
      fee: kind === 'league' ? n(form.fee) : null, payout: kind === 'league' ? n(form.payout) : null,
      is_team: isTeam.value, notes: form.notes,
    })
    // Logging the last missing round of a played event marks it Recorded.
    const done = ev && ev.status === 'played' && state.rounds.filter((r) => r.event_id === ev.id).length >= (ev.rounds_planned || 1)
    if (done) await setEventStatus(ev.id, 'recorded')
    toast(done ? `${ev.name} is now Recorded` : existing ? 'Round updated' : `Round saved · ${relTxt(diff.value)}`)
  })
}

function remove() {
  if (!confirm('Delete this round?')) return
  commit(async () => { await deleteRound(existing.id); toast('Round deleted') })
}

const title = existing ? 'Edit round' : kind === 'tournament' ? `Round ${form.round_number}` : kind === 'league' ? 'League round' : 'Casual round'
</script>

<template>
  <SheetFrame :title="title">
    <div v-if="ev" class="ctx">
      <Plate v-if="ev.courses[0] && courseById(ev.courses[0].course_id)" :course="courseById(ev.courses[0].course_id)" lite class="thumb sm" />
      <div><span class="mono">Event</span><b>{{ ev.name }}</b></div><span class="lock"><Icon name="lock" size="sm" /></span>
    </div>
    <div v-else-if="lg" class="ctx">
      <span class="league-chip" :style="{ background: lg.color || 'var(--moss)', margin: '0 6px 0 4px' }"></span>
      <div><span class="mono">League</span><b>{{ lg.name }}</b></div><span class="lock"><Icon name="lock" size="sm" /></span>
    </div>

    <div v-if="ev" class="field">
      <div class="lbl">Round<span v-if="!existing" class="hint"><Icon name="check" size="xs" />Next unlogged</span></div>
      <div class="choice compact">
        <button v-for="r in roundOptions" :key="r" type="button" :class="{ on: +form.round_number === r, done: loggedNumbers.includes(r) }" @click="form.round_number = r">R{{ r }}<template v-if="loggedNumbers.includes(r)"> ✓</template></button>
      </div>
      <p v-if="dupe" class="meta" style="color: var(--st-waitlisted); margin-top: 8px">Round {{ form.round_number }} is already logged for this event.{{ confirmDupe ? ' Tap save again to keep both.' : '' }}</p>
    </div>

    <div class="field">
      <div class="lbl">Course
        <span v-if="!existing && why === 'only'" class="hint"><Icon name="check" size="xs" />Only course at this event</span>
        <span v-else-if="!existing && why === 'least'" class="hint"><Icon name="sparkle" size="xs" />Least played here so far</span>
        <span v-else-if="!existing && kind === 'league' && form.course_id" class="hint"><Icon name="check" size="xs" />League home course</span>
      </div>
      <div v-if="courseChoices.length" class="choice">
        <button v-for="c in courseChoices" :key="c.id" type="button" :class="{ on: form.course_id === c.id }" @click="form.course_id = c.id">
          <Plate :course="c" lite class="thumb sm" /><span>{{ c.name }}<small>{{ state.rounds.filter((r) => r.event_id === ev.id && r.course_id === c.id && r.id !== existing?.id).map((r) => 'R' + r.round_number).join(', ') || 'Not played yet' }}</small></span>
          <span v-if="form.course_id === c.id" class="ck"><Icon name="check" /></span>
        </button>
      </div>
      <select v-else v-model="form.course_id" class="input"><option :value="null">Choose a course…</option><option v-for="c in allCourses" :key="c.id" :value="c.id">{{ c.name }}</option></select>
    </div>

    <div class="field">
      <div class="lbl">Date</div>
      <div v-if="days.length > 1" class="choice compact"><button v-for="d in days" :key="d" type="button" :class="{ on: form.played_on === d }" @click="form.played_on = d">{{ fmtDow(d) }}</button></div>
      <input v-else v-model="form.played_on" class="input" type="date" />
    </div>

    <div class="field">
      <div class="lbl">Par<span v-if="lastPar" class="hint sug">Last time here: {{ lastPar }}</span></div>
      <input v-model="form.par" class="input" inputmode="numeric" placeholder="Par for this layout" />
    </div>

    <div class="field">
      <div class="lbl">{{ isTeam ? 'Team score' : 'Score' }}<span class="hint sug">Circle = under · box = over</span></div>
      <div class="pad">
        <button type="button" aria-label="One fewer" @click="bump(-1)">−</button>
        <div class="mid">
          <span class="shape" :class="diff === null ? 'even' : scClass(diff)"></span>
          <span class="val" :class="dir">{{ diff === null ? '—' : relTxt(diff) }}</span>
          <input v-model="form.score" class="thr-input" inputmode="numeric" placeholder="throws" aria-label="Throws" />
        </div>
        <button type="button" aria-label="One more" @click="bump(1)">+</button>
      </div>
    </div>

    <div v-if="showRating" class="field"><div class="lbl">PDGA round rating<span class="hint sug">Optional · add later</span></div><input v-model="form.rating" class="input" inputmode="numeric" placeholder="e.g. 1001" /></div>
    <p v-else-if="isTeam" class="meta" style="margin-top: 14px">{{ ev.format === 'triples' ? 'Triples' : 'Doubles' }} rounds aren't PDGA-rated, so there's no rating.</p>

    <template v-if="kind === 'league'">
      <div class="field two">
        <div><div class="lbl">Place</div><input v-model="form.place" class="input" inputmode="numeric" placeholder="3" /></div>
        <div><div class="lbl">Field<span v-if="pct" class="hint">Top {{ pct }}%</span></div><input v-model="form.field_size" class="input" inputmode="numeric" placeholder="24" /></div>
      </div>
      <div class="field two">
        <div><div class="lbl">Fee</div><input v-model="form.fee" class="input" inputmode="decimal" placeholder="$" /></div>
        <div><div class="lbl">Payout<span v-if="net !== null" class="hint" :class="{ sug: net < 0 }">Net {{ net >= 0 ? '+' : '−' }}{{ money(Math.abs(net)) }}</span></div><input v-model="form.payout" class="input" inputmode="decimal" placeholder="$0" /></div>
      </div>
    </template>

    <div class="field"><div class="lbl">Field notes</div><textarea v-model="form.notes" class="input" placeholder="Wind, putting, what clicked…"></textarea></div>
    <button v-if="existing" class="btn block danger" style="margin-top: 22px" @click="remove">Delete round</button>
    <template #foot><button class="btn disc" @click="save">{{ confirmDupe ? 'Save anyway' : existing ? 'Save changes' : 'Save round' }}</button></template>
  </SheetFrame>
</template>
