<script setup>
import { reactive, ref, computed, watch } from 'vue'
import SheetFrame from '../SheetFrame.vue'
import Icon from '../Icon.vue'
import Plate from '../Plate.vue'
import { state, eventById, courseById } from '../../data/store.js'
import { saveMatch, deleteMatch } from '../../data/mutate.js'
import { trackDirty, setDirty, commit } from '../../lib/sheet.js'
import { holeTally } from '../../lib/matchplay.js'
import { toast } from '../../lib/toast.js'

const props = defineProps({ eventId: String, id: String })
const existing = props.id ? state.matches.find((m) => m.id === props.id) : null
const ev = eventById(props.eventId || existing?.event_id)
const others = computed(() => state.matches.filter((m) => m.event_id === ev.id && m.id !== existing?.id))

const holeCount = existing?.hole_count || ev.holes_per_match || 12
const form = reactive({
  match_number: existing?.match_number || Math.max(0, ...others.value.map((m) => m.match_number)) + 1,
  course_id: existing?.course_id || (ev.courses.length === 1 ? ev.courses[0].course_id : null),
  opponent: existing?.opponent || '', opponent_team: existing?.opponent_team || '',
  hole_count: holeCount, notes: existing?.notes || '', result: existing?.result || null,
  holes: (existing?.holes || '').padEnd(holeCount, '-').slice(0, holeCount).split('').map((h) => (h === '-' ? '' : h)),
})
// Hole by hole is optional — older matches (and quick logging) just record the result.
const byHole = ref(existing ? !!existing.holes : true)
trackDirty(form)
watch(byHole, () => setDirty(true))

watch(() => form.hole_count, (c) => {
  const k = Math.max(1, Math.min(27, +c || 12))
  form.holes = Array.from({ length: k }, (_, i) => form.holes[i] || '')
})

const tally = computed(() => holeTally(form.holes.join('')))
const played = computed(() => form.holes.filter(Boolean).length)
const courses = computed(() => ev.courses.map((x) => courseById(x.course_id)).filter(Boolean))
const tapped = ref(-1)
function tap(i) {
  const cycle = ['', 'W', 'P', 'L']
  form.holes[i] = cycle[(cycle.indexOf(form.holes[i]) + 1) % 4]
  tapped.value = -1
  requestAnimationFrame(() => { tapped.value = i })
}

function save() {
  const holes = byHole.value ? form.holes.map((h) => h || 'P').join('') : ''
  const result = byHole.value ? (played.value ? holeTally(holes).res : null) : form.result
  if (!result) return toast(byHole.value ? 'Tap at least one hole' : 'Pick the result')
  commit(async () => {
    await saveMatch({ id: existing?.id, event_id: ev.id, match_number: +form.match_number, course_id: form.course_id, opponent: form.opponent.trim() || null, opponent_team: form.opponent_team.trim() || null, holes, hole_count: +form.hole_count || null, result, notes: form.notes })
    toast(existing ? 'Match updated' : `Match ${form.match_number} saved`)
  })
}
function remove() {
  if (!confirm(`Delete match ${existing.match_number}?`)) return
  commit(async () => { await deleteMatch(existing.id); toast('Match deleted') })
}
</script>

<template>
  <SheetFrame :title="existing ? `Edit match ${form.match_number}` : `Match ${form.match_number}`">
    <div class="ctx"><div><span class="mono">{{ ev.team_name || 'Match play' }}</span><b>{{ ev.name }}</b></div><span class="lock"><Icon name="lock" size="sm" /></span></div>

    <div class="field two">
      <div><div class="lbl">Opponent</div><input v-model="form.opponent" class="input" placeholder="Name" /></div>
      <div><div class="lbl">Their team</div><input v-model="form.opponent_team" class="input" placeholder="Team" /></div>
    </div>
    <div v-if="courses.length > 1" class="field">
      <div class="lbl">Course</div>
      <div class="choice"><button v-for="c in courses" :key="c.id" type="button" :class="{ on: form.course_id === c.id }" @click="form.course_id = c.id"><Plate :course="c" lite class="thumb sm" /><span>{{ c.name }}</span></button></div>
    </div>

    <div class="kv" style="margin-top: 14px">
      <div><div class="v">Track hole by hole</div><div class="k">Or just record the result</div></div>
      <button class="end switch" :class="{ on: byHole }" type="button" aria-label="Track hole by hole" @click="byHole = !byHole"></button>
    </div>

    <template v-if="byHole">
      <div class="field">
        <div class="lbl">Holes<span class="hint sug">Tap · win → push → loss</span></div>
        <div class="hole-grid">
          <button v-for="(h, i) in form.holes" :key="i" type="button" :class="[h, { tap: tapped === i }]" @click="tap(i)"><small>{{ i + 1 }}</small>{{ h || '·' }}</button>
        </div>
        <div class="live">
          <span>{{ tally.W }} won · {{ tally.P }} pushed · {{ tally.L }} lost</span>
          <span class="num" :style="{ color: played ? (tally.res === 'W' ? 'var(--good)' : 'var(--ink)') : 'var(--faint)' }">{{ played ? { W: `${tally.W - tally.L} up`, L: `${tally.L - tally.W} down`, P: 'All square' }[tally.res] : '—' }}</span>
        </div>
      </div>
      <div class="field" style="max-width: 160px"><div class="lbl">Holes in match</div><input v-model="form.hole_count" class="input" inputmode="numeric" /></div>
    </template>
    <div v-else class="field">
      <div class="lbl">Result</div>
      <div class="choice compact">
        <button type="button" :class="{ on: form.result === 'W' }" @click="form.result = 'W'">Won</button>
        <button type="button" :class="{ on: form.result === 'P' }" @click="form.result = 'P'">Tied</button>
        <button type="button" :class="{ on: form.result === 'L' }" @click="form.result = 'L'">Lost</button>
      </div>
    </div>

    <div class="field"><div class="lbl">Notes</div><textarea v-model="form.notes" class="input" placeholder="How it went"></textarea></div>
    <button v-if="existing" class="btn block danger" style="margin-top: 22px" @click="remove">Delete match</button>
    <template #foot><button class="btn disc" @click="save">{{ existing ? 'Save changes' : 'Save match' }}</button></template>
  </SheetFrame>
</template>
