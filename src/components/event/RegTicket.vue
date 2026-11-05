<script setup>
// Registration ticket on an upcoming event: date stub, when registration opens, entry fee,
// reminder toggle, and the status stamp (which lands when the status changes to Registered/Waitlist).
import { computed } from 'vue'
import Icon from '../Icon.vue'
import StampMark from '../StampMark.vue'
import { parseDate, MON, DOW, fmtDateY, money, daysBetween } from '../../lib/format.js'
import { saveEvent } from '../../data/mutate.js'
import { toast } from '../../lib/toast.js'

const props = defineProps({ event: { type: Object, required: true }, today: String, slam: Boolean })
const e = computed(() => props.event)
const d = computed(() => parseDate(e.value.start_date))
const admit = computed(() => ({ singles: 'ONE', doubles: 'TWO', team_doubles: 'TWO', triples: 'THREE', match_play: 'TEAM' })[e.value.format])
const regDays = computed(() => (e.value.reg_opens_on ? daysBetween(props.today, e.value.reg_opens_on) : null))

async function toggleRemind() {
  try {
    await saveEvent({ ...e.value, remind: !e.value.remind })
    toast(e.value.remind ? 'Reminder on — 8:00 AM the day it opens' : 'Reminder off')
  } catch (err) { toast(err.message) }
}
</script>

<template>
  <div class="ticket-wrap reg-ticket">
    <div class="ticket">
      <div class="stub">
        <span class="m">{{ MON[d.getMonth()].toUpperCase() }}</span>
        <b>{{ d.getDate() }}</b>
        <span class="d">{{ e.start_date === e.end_date ? DOW[d.getDay()].toUpperCase() : 'THRU ' + parseDate(e.end_date).getDate() }}</span>
        <span class="admit">ADMIT {{ admit }}</span>
      </div>
      <div class="tb">
        <div v-if="e.reg_opens_on" class="kv">
          <div><div class="k">Registration {{ regDays > 0 ? 'opens' : 'opened' }}</div><div class="v">{{ fmtDateY(e.reg_opens_on) }} <span class="reg-note" :class="{ open: regDays <= 0 }" style="margin-left: 4px">{{ regDays > 0 ? `in ${regDays} days` : 'open' }}</span></div></div>
        </div>
        <div v-if="e.entry_fee != null" class="kv">
          <div><div class="k">Entry fee</div><div class="v">{{ money(e.entry_fee) }}<span v-if="e.fee_split > 1" class="muted" style="font-weight: 500; font-size: 13px"> / team · {{ money(e.entry_fee / e.fee_split) }} yours</span></div></div>
        </div>
        <div v-if="regDays > 0 && ['interested', 'planning'].includes(e.status)" class="remind">
          <Icon name="bell" size="sm" class="bell" />
          <div><b>Notify me when it opens</b><small>Push at 8:00 AM on the day</small></div>
          <button class="switch" :class="{ on: e.remind }" aria-label="Reminder" @click="toggleRemind"></button>
        </div>
        <div v-if="e.event_url" class="kv"><a class="btn sm" :href="e.event_url" target="_blank" rel="noopener"><Icon name="external" size="xs" />Event page</a></div>
        <p v-if="!e.reg_opens_on && e.entry_fee == null && !e.event_url" class="meta">Add the registration date, fee or event page from Edit.</p>
      </div>
    </div>
    <StampMark :event="e" :slam="slam" />
  </div>
</template>
