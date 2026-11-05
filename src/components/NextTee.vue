<script>
// The disc flies once per visit (module scope survives leaving and returning to Home).
let flown = false
</script>

<script setup>
// Home hero: the next event's plate (the disc flies once per visit), countdown and registration note.
import { ref, computed, onMounted } from 'vue'
import Icon from './Icon.vue'
import StatusChip from './StatusChip.vue'
import { courseById, plateNumber } from '../data/store.js'
import { plateSvg } from '../lib/plate.js'
import { fmtRange, fmtDate, daysBetween, splitLast } from '../lib/format.js'

const props = defineProps({ event: { type: Object, required: true }, today: { type: String, required: true } })
const course = computed(() => (props.event.courses[0] && courseById(props.event.courses[0].course_id)) || { id: 'ev-' + props.event.id, name: props.event.name, terrain: 'mixed' })
const svg = computed(() => plateSvg(course.value, { fly: true, dot: 0.5 }))
const title = computed(() => splitLast(props.event.name))
const days = computed(() => daysBetween(props.today, props.event.start_date))
const regNote = computed(() => {
  const e = props.event
  if (!e.reg_opens_on || !['interested', 'planning'].includes(e.status)) return ''
  return e.reg_opens_on > props.today ? `Reg opens ${fmtDate(e.reg_opens_on)}` : 'Registration open'
})

const art = ref(null)
function fly() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !art.value) return
  art.value.classList.remove('flying')
  void art.value.offsetWidth
  art.value.classList.add('flying')
  try { art.value.querySelector('animateMotion')?.beginElement() } catch (e) {}
}
// After the first flight the plate just shows its printed flight line.
onMounted(() => { if (!flown) { flown = true; setTimeout(fly, 500) } })
</script>

<template>
  <RouterLink class="hero" :to="`/event/${event.id}`">
    <div ref="art" class="art">
      <div style="display: contents" v-html="svg" />
      <div class="marks">
        <span class="scale"><i></i>0 · 100 ft</span>
        <span v-if="event.courses[0]" class="plate-no">{{ plateNumber(course.id) }}</span>
      </div>
    </div>
    <button class="replay" @click.prevent.stop="fly"><Icon name="replay" size="xs" />Replay flight</button>
    <div class="hero-panel">
      <span class="mono">{{ fmtRange(event.start_date, event.end_date) }}<template v-if="event.city"> · <b>{{ event.city }}</b></template></span>
      <h3>{{ title.head }} <em>{{ title.last }}</em></h3>
      <div class="count">
        <span class="num">{{ days }}</span>
        <span class="cap">{{ days === 1 ? 'day' : 'days' }} to<br />the first tee</span>
      </div>
      <div class="foot">
        <StatusChip :event="event" />
        <span class="chip">{{ event.pdga ? 'PDGA ' + (event.tier || '') : 'Non-PDGA' }}</span>
        <span v-if="regNote" class="bell"><Icon name="bell" size="xs" />{{ regNote }}</span>
      </div>
    </div>
  </RouterLink>
</template>
