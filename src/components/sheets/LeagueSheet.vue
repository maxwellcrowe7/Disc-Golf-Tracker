<script setup>
import { reactive, computed } from 'vue'
import SheetFrame from '../SheetFrame.vue'
import { state, leagueById } from '../../data/store.js'
import { saveLeague, deleteLeague } from '../../data/mutate.js'
import { trackDirty, commit } from '../../lib/sheet.js'
import { DOW } from '../../lib/format.js'
import { toast } from '../../lib/toast.js'

const props = defineProps({ id: String })
const existing = props.id ? leagueById(props.id) : null
const COLORS = ['#2F7D5B', '#C0702E', '#3C6DB4', '#6A4C95', '#B5483B', '#C48A12', '#2C8C8C', '#15211B']

// day_time is stored as text ("Tue · 6:00 PM"); split it for the pickers.
const [day0, time0] = (existing?.day_time || '').split(' · ')
const to24 = (t) => {
  const m = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec(t || '')
  if (!m) return '18:00'
  let h = +m[1] % 12
  if (m[3].toUpperCase() === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${m[2]}`
}
const form = reactive({
  name: existing?.name || '', day: DOW.includes(day0) ? day0 : 'Tue', time: to24(time0),
  home_course_id: existing?.home_course_id || '', color: existing?.color || COLORS[0], notes: existing?.notes || '', active: existing?.active ?? true,
})
trackDirty(form)

const courses = computed(() => [...state.courses].sort((a, b) => a.name.localeCompare(b.name)))
const roundCount = computed(() => (props.id ? state.rounds.filter((r) => r.league_id === props.id).length : 0))

function dayTime() {
  const [h, m] = form.time.split(':').map(Number)
  return `${form.day} · ${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function save() {
  if (!form.name.trim()) return toast('Give the league a name')
  commit(async () => {
    await saveLeague({ id: existing?.id, name: form.name.trim(), day_time: dayTime(), home_course_id: form.home_course_id || null, color: form.color, notes: form.notes, active: form.active })
    toast(existing ? 'League updated' : 'League added')
  })
}

function remove() {
  const extra = roundCount.value ? ` Its ${roundCount.value} rounds stay in your history.` : ''
  if (!confirm(`Delete ${existing.name}?${extra}`)) return
  commit(async () => { await deleteLeague(existing.id); toast('League deleted') })
}
</script>

<template>
  <SheetFrame :title="existing ? 'Edit league' : 'New league'">
    <div class="field" style="margin-top: 0"><div class="lbl">Name</div><input v-model="form.name" class="input" placeholder="e.g. Tuesday Night Doubles" /></div>
    <div class="field">
      <div class="lbl">Night</div>
      <div class="choice compact"><button v-for="d in DOW" :key="d" type="button" :class="{ on: form.day === d }" @click="form.day = d">{{ d }}</button></div>
    </div>
    <div class="field two">
      <div><div class="lbl">Start time</div><input v-model="form.time" class="input" type="time" /></div>
      <div>
        <div class="lbl">Home course</div>
        <select v-model="form.home_course_id" class="input"><option value="">None</option><option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option></select>
      </div>
    </div>
    <div class="field">
      <div class="lbl">Color</div>
      <div class="swatches"><button v-for="c in COLORS" :key="c" type="button" :class="{ on: form.color === c }" :style="{ background: c }" :aria-label="'Color ' + c" @click="form.color = c"></button></div>
    </div>
    <div class="field"><div class="lbl">Notes</div><textarea v-model="form.notes" class="input" placeholder="Format, payouts, bag tags…"></textarea></div>
    <div v-if="existing" class="kv" style="margin-top: 12px">
      <div><div class="v">Still playing it</div><div class="k">Inactive leagues drop off Home</div></div>
      <button class="end switch" :class="{ on: form.active }" type="button" aria-label="Active" @click="form.active = !form.active"></button>
    </div>
    <button v-if="existing" class="btn block danger" style="margin-top: 18px" @click="remove">Delete league</button>
    <template #foot><button class="btn disc" @click="save">{{ existing ? 'Save changes' : 'Add league' }}</button></template>
  </SheetFrame>
</template>
