<script setup>
// Past event scorecard: one column per round (planned or logged) — course, par, score, to-par, rating.
// Missing rounds get a + to log them; tapping a logged round opens it for editing.
import { computed } from 'vue'
import Icon from '../Icon.vue'
import ScoreMark from '../ScoreMark.vue'
import StampMark from '../StampMark.vue'
import { state, courseById } from '../../data/store.js'
import { openSheet } from '../../lib/sheet.js'
import RoundSheet from '../sheets/RoundSheet.vue'

const props = defineProps({ event: { type: Object, required: true }, slam: Boolean })
const e = computed(() => props.event)
const logged = computed(() => state.rounds.filter((r) => r.event_id === e.value.id))
const cols = computed(() => {
  const n = Math.max(e.value.rounds_planned || 0, ...logged.value.map((r) => r.round_number || 0), logged.value.length, 1)
  return Array.from({ length: n }, (_, i) => logged.value.find((r) => r.round_number === i + 1) || null)
})
const extra = computed(() => logged.value.filter((r) => !r.round_number)) // rounds saved without a number
const scoredRounds = computed(() => logged.value.filter((r) => r.score != null && r.par != null))
const tot = computed(() => ({ s: scoredRounds.value.reduce((a, r) => a + r.score, 0), p: scoredRounds.value.reduce((a, r) => a + r.par, 0) }))
const rated = computed(() => logged.value.some((r) => r.rating))
const short = (id) => courseById(id)?.name.split(' ')[0] || '—'
const edit = (r) => openSheet(RoundSheet, { id: r.id })
const add = () => openSheet(RoundSheet, { eventId: e.value.id })
</script>

<template>
  <div class="card scorecard">
    <div class="ph" style="padding-bottom: 12px">
      <h3>Scorecard<span v-if="e.format !== 'singles'" class="mono">team score</span></h3>
      <button class="btn sm" @click="add"><Icon name="plus" size="xs" />Round</button>
    </div>
    <div style="overflow-x: auto">
      <table>
        <tr><th>Round</th><th v-for="(r, i) in cols" :key="i">R{{ i + 1 }}</th><th class="tot">Tot</th></tr>
        <tr><td>Course</td><td v-for="(r, i) in cols" :key="i" class="cname">{{ r ? short(r.course_id) : '—' }}</td><td class="tot"></td></tr>
        <tr><td>Par</td><td v-for="(r, i) in cols" :key="i">{{ r?.par ?? '—' }}</td><td class="tot">{{ tot.p || '' }}</td></tr>
        <tr>
          <td>Score</td>
          <td v-for="(r, i) in cols" :key="i">
            <button v-if="r" style="font-weight: var(--w-strong)" @click="edit(r)">{{ r.score ?? '—' }}</button>
            <button v-else class="addbtn" aria-label="Log this round" @click="add"><Icon name="plus" size="xs" /></button>
          </td>
          <td class="tot"><b>{{ tot.s || '' }}</b></td>
        </tr>
        <tr><td>To par</td><td v-for="(r, i) in cols" :key="i"><ScoreMark v-if="r && r.score != null && r.par != null" :score="r.score" :par="r.par" /><span v-else class="muted">—</span></td><td class="tot"><ScoreMark v-if="scoredRounds.length" :score="tot.s" :par="tot.p" /></td></tr>
        <tr v-if="rated"><td>Rating</td><td v-for="(r, i) in cols" :key="i" style="font-family: var(--mono); font-size: var(--t-small)">{{ r?.rating || '—' }}</td><td class="tot"></td></tr>
      </table>
    </div>
    <p v-if="extra.length" class="meta" style="padding: 10px 18px 0">{{ extra.length }} more round{{ extra.length > 1 ? 's' : '' }} without a round number — open it from the Rounds table to number it.</p>
    <p v-if="e.format !== 'singles'" class="meta" style="padding: 10px 18px 14px">Team rounds aren't PDGA-rated, so they stay out of your rating stats.</p>
    <div v-else style="height: 12px"></div>
    <StampMark v-if="e.status === 'recorded'" :event="e" recorded :slam="slam" />
  </div>
</template>
