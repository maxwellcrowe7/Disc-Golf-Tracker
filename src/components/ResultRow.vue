<script setup>
// One past event as a scorecard row: plate, name, R1–R3 in scorecard notation, total, finish medal.
import { computed } from 'vue'
import Plate from './Plate.vue'
import ScoreMark from './ScoreMark.vue'
import { state, courseById } from '../data/store.js'
import { fmtDateY, FORMAT, ord } from '../lib/format.js'
import { matchResult, matchRecord } from '../lib/matchplay.js'

const props = defineProps({ event: { type: Object, required: true } })
const e = computed(() => props.event)
const course = computed(() => e.value.courses[0] && courseById(e.value.courses[0].course_id))
const rounds = computed(() => state.rounds.filter((r) => r.event_id === e.value.id).sort((a, b) => (a.round_number || 0) - (b.round_number || 0)))
const matches = computed(() => state.matches.filter((m) => m.event_id === e.value.id).sort((a, b) => a.match_number - b.match_number))
const isMatch = computed(() => e.value.format === 'match_play')
const total = computed(() => {
  const s = rounds.value.filter((r) => r.score != null && r.par != null)
  return s.length ? { score: s.reduce((a, r) => a + r.score, 0), par: s.reduce((a, r) => a + r.par, 0), n: s.length } : null
})
const rec = computed(() => matchRecord(matches.value))
const missing = computed(() => e.value.status === 'played')
const medal = computed(() => [null, ['#F3D46B', '#C99A22'], ['#E2E6EB', '#9AA4B0'], ['#EBC09A', '#B97A47']][e.value.place] || null)
const suffix = computed(() => (e.value.place ? ord(e.value.place).slice(String(e.value.place).length) : ''))
</script>

<template>
  <RouterLink class="sc-row" :to="`/event/${e.id}`">
    <Plate v-if="course" :course="course" lite class="thumb" />
    <span v-else class="thumb art"></span>
    <div style="min-width: 0">
      <div class="name">{{ e.name }}</div>
      <div class="meta">{{ fmtDateY(e.start_date) }}<span class="dot"></span>{{ FORMAT[e.format] }}<template v-if="missing"><span class="dot"></span><span style="color: var(--st-played); font-weight: var(--w-strong)">Needs details</span></template></div>
    </div>
    <div class="cells">
      <template v-if="isMatch">
        <span v-for="m in matches.slice(0, 3)" :key="m.id" class="sc" :class="{ W: 'under', L: 'over', P: 'even' }[matchResult(m)]" style="font-family: var(--mono); font-size: var(--t-label)">{{ matchResult(m) }}</span>
      </template>
      <template v-else>
        <template v-for="i in 3" :key="i">
          <ScoreMark v-if="rounds[i - 1] && rounds[i - 1].score != null && rounds[i - 1].par != null" :score="rounds[i - 1].score" :par="rounds[i - 1].par" />
          <span v-else-if="i <= (e.rounds_planned || rounds.length)" class="sc blank">—</span>
          <span v-else class="sc" style="visibility: hidden">·</span>
        </template>
      </template>
    </div>
    <div class="tot">
      <template v-if="isMatch"><span class="num" style="font-size: var(--t-name)">{{ rec.w }}–{{ rec.l }}–{{ rec.p }}</span><small>W–L–P</small></template>
      <template v-else-if="total"><ScoreMark :score="total.score" :par="total.par" /><small>{{ total.n }} rds</small></template>
    </div>
    <div class="place">
      <svg v-if="medal" viewBox="0 0 46 46"><circle cx="23" cy="23" r="21" :fill="medal[0]" /><circle cx="23" cy="23" r="17" fill="none" :stroke="medal[1]" stroke-width="1" stroke-dasharray="1.4 2.4" /></svg>
      <span v-if="e.place" class="num" :style="medal ? { color: '#3a2c06' } : {}">{{ e.place }}<sup>{{ suffix }}</sup></span>
      <span v-else class="mono">—</span>
    </div>
  </RouterLink>
</template>
