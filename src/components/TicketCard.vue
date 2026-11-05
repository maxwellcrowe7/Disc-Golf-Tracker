<script setup>
// Upcoming event as a ticket: plate stub with the date, perforation, details, cost estimate, stamp.
import { computed } from 'vue'
import Icon from './Icon.vue'
import Plate from './Plate.vue'
import StatusChip from './StatusChip.vue'
import StampMark from './StampMark.vue'
import { courseById } from '../data/store.js'
import { parseDate, MON, DOW, FORMAT, fmtDate, money, daysBetween } from '../lib/format.js'
import { costFor } from '../lib/season.js'

const props = defineProps({ event: { type: Object, required: true }, today: { type: String, required: true } })
const e = computed(() => props.event)
const d = computed(() => parseDate(e.value.start_date))
const course = computed(() => (e.value.courses[0] && courseById(e.value.courses[0].course_id)) || { id: 'ev-' + e.value.id, name: e.value.name, terrain: 'mixed' })
const days = computed(() => daysBetween(e.value.start_date, e.value.end_date) + 1)
const admit = computed(() => ({ singles: 'one', doubles: 'two', team_doubles: 'two', triples: 'three', match_play: 'team' })[e.value.format])
const cost = computed(() => costFor(e.value).total)
const drive = computed(() => {
  const m = e.value.lodging?.drive_minutes ?? e.value.home_drive_minutes
  return m == null ? '' : m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m} min`
})
const reg = computed(() => {
  const x = e.value
  if (!['interested', 'planning'].includes(x.status) || !x.reg_opens_on) return null
  return x.reg_opens_on > props.today ? { open: false, text: `Reg opens ${fmtDate(x.reg_opens_on)}${x.remind ? ' · reminder on' : ''}` } : { open: true, text: 'Registration open' }
})
</script>

<template>
  <RouterLink class="ticket-wrap" :to="`/event/${e.id}`">
    <div class="ticket">
      <div class="stub">
        <Plate :course="course" lite />
        <div class="date"><span class="m">{{ MON[d.getMonth()].toUpperCase() }}</span><b>{{ d.getDate() }}</b><span>{{ days > 1 ? days + ' DAYS' : DOW[d.getDay()].toUpperCase() }}</span></div>
      </div>
      <div class="tb">
        <span class="serial">Admit {{ admit }} · {{ FORMAT[e.format] }}<template v-if="e.division"> · {{ e.division }}</template></span>
        <div class="top"><div class="name">{{ e.name }}</div><div v-if="cost" class="cost"><b>{{ money(cost) }}</b><small>EST.</small></div></div>
        <div class="meta"><template v-if="e.city"><Icon name="pin" size="xs" />{{ e.city }}</template><template v-if="drive"><span class="dot"></span><Icon name="car" size="xs" />{{ drive }}</template></div>
        <div class="chips"><StatusChip :event="e" /><span class="chip">{{ e.pdga ? 'PDGA ' + (e.tier || '') : 'Non-PDGA' }}</span></div>
        <span v-if="reg" class="reg-note" :class="{ open: reg.open }"><Icon :name="reg.open ? 'check' : 'bell'" size="xs" />{{ reg.text }}</span>
      </div>
    </div>
    <StampMark :event="e" />
  </RouterLink>
</template>
