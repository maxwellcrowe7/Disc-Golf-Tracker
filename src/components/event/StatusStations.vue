<script setup>
// Status as trail stations: Interested → Planning → Registered → Played → Recorded. Tap a station to move.
import { ref, computed, onMounted } from 'vue'
import StatusChip from '../StatusChip.vue'
import { STATUS, fmtDate, daysBetween } from '../../lib/format.js'
import { setEventStatus } from '../../data/mutate.js'
import { toast } from '../../lib/toast.js'

const props = defineProps({ event: { type: Object, required: true }, today: String })
const emit = defineEmits(['changed'])
const STEPS = ['interested', 'planning', 'registered', 'played', 'recorded']
const cur = computed(() => (props.event.status === 'waitlisted' ? 2 : STEPS.indexOf(props.event.status)))
const pre = ref(true)
onMounted(() => requestAnimationFrame(() => requestAnimationFrame(() => { pre.value = false })))

const note = computed(() => {
  const e = props.event, reg = e.reg_opens_on && daysBetween(props.today, e.reg_opens_on)
  return {
    interested: reg > 0 ? `On the radar. Registration opens ${fmtDate(e.reg_opens_on)}.` : 'On the radar.',
    planning: reg > 0 ? `Registration opens ${fmtDate(e.reg_opens_on)} — ${reg} days.` : 'Registration is open — go sign up.',
    registered: `You're in. ${Math.max(0, daysBetween(props.today, e.start_date))} days to go.`,
    waitlisted: e.waitlist_pos ? `#${e.waitlist_pos} on the waitlist.` : 'On the waitlist.',
    withdrew: 'You withdrew from this event.',
    played: 'Played — log the rounds and notes to finish it.',
    recorded: 'Rounds and notes are in. Complete.',
  }[e.status]
})

async function set(status) {
  if (status === props.event.status) return
  try {
    await setEventStatus(props.event.id, status)
    emit('changed', status)
    toast(`Status set to ${STATUS[status]}`)
  } catch (e) { toast(e.message) }
}
</script>

<template>
  <div class="card">
    <div class="ph"><h3>Status</h3><StatusChip :event="event" /></div>
    <div class="stations" :class="{ pre }" :style="{ '--sc': `var(--st-${event.status})`, '--p': Math.max(cur, 0) / 4 }">
      <span class="prog"></span>
      <button v-for="(s, i) in STEPS" :key="s" class="st" :class="{ done: i <= cur, cur: i === cur }" :style="{ '--i': i }" @click="set(s)">
        <span class="o"></span><span class="lb">{{ i === 2 && event.status === 'waitlisted' ? 'Waitlist' : STATUS[s] }}</span>
      </button>
    </div>
    <div class="step-foot">
      <span>{{ note }}</span>
      <span style="display: flex; gap: 6px">
        <button v-if="!['waitlisted', 'played', 'recorded'].includes(event.status)" class="btn sm" @click="set('waitlisted')">Waitlisted?</button>
        <button v-if="!['withdrew', 'played', 'recorded'].includes(event.status)" class="btn sm" @click="set('withdrew')">Withdrew</button>
      </span>
    </div>
  </div>
</template>
