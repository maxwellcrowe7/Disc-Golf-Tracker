<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import SheetFrame from '../SheetFrame.vue'
import Icon from '../Icon.vue'
import { state, eventById, courseById } from '../../data/store.js'
import { saveEvent, deleteEvent } from '../../data/mutate.js'
import { trackDirty, setDirty, commit } from '../../lib/sheet.js'
import { FORMAT, STATUS } from '../../lib/format.js'
import { toast } from '../../lib/toast.js'

const props = defineProps({ id: String })
const router = useRouter()
const existing = props.id ? eventById(props.id) : null

const TIERS = ['C-Tier', 'B-Tier', 'A-Tier', 'Major', 'Elite Series', 'Silver Series', 'NT', 'Pro Tour', 'XC-Tier']
const DIVISIONS = ['MPO', 'MA1', 'MA2', 'MA3', 'MA40', 'MA50', 'FPO', 'FA1', 'FA2']
const TEAM = { doubles: 2, team_doubles: 2, triples: 3 }

const blank = {
  name: '', start_date: state.today, end_date: '', city: '', pdga: true, tier: 'B-Tier', division: 'MPO', format: 'singles',
  status: 'interested', waitlist_pos: '', reg_opens_on: '', remind: false, event_url: '', entry_fee: '', fee_split: 1,
  had_caddy: false, caddy_fee: '', rounds_planned: '', holes_per_match: 12, team_name: '', partners: [],
  place: '', field_size: '', field_unit: 'players', payout: '', notes: '', courses: [], lodging: null,
}
const form = reactive(structuredClone({ ...blank, ...(existing ? JSON.parse(JSON.stringify(existing)) : {}) }))
if (!form.end_date) form.end_date = form.start_date
const stay = reactive({ type: 'Airbnb', name: '', nights: 1, cost: '', split: 1, ...(form.lodging || {}) })
const hasStay = ref(!!form.lodging)

// Team formats: one name field per teammate, and the entry fee splits by default.
const teammates = computed(() => (TEAM[form.format] || 1) - 1)
watch(() => form.format, (f) => {
  form.partners = Array.from({ length: (TEAM[f] || 1) - 1 }, (_, i) => form.partners[i] || '')
  if (!existing) { form.fee_split = TEAM[f] || 1; form.field_unit = f === 'singles' ? 'players' : 'teams' }
}, { immediate: true })
watch(() => form.start_date, (s, old) => { if (!form.end_date || form.end_date === old || form.end_date < s) form.end_date = s })
// Registered after the set-up watchers above so opening the sheet doesn't count as an edit.
trackDirty(form)
trackDirty(stay)
watch(hasStay, () => setDirty(true))

const showResults = computed(() => ['played', 'recorded'].includes(form.status) || form.start_date <= state.today)

// ── courses played ──
const courseQ = ref('')
const picked = computed(() => form.courses.map((x) => courseById(x.course_id)).filter(Boolean))
const matches = computed(() => {
  const s = courseQ.value.trim().toLowerCase()
  return state.courses.filter((c) => !form.courses.some((x) => x.course_id === c.id) && (!s || `${c.name} ${c.city}`.toLowerCase().includes(s))).slice(0, s ? 8 : 5)
})
const addCourse = (c) => { form.courses.push({ course_id: c.id, drive_minutes: null, drive_miles: null }); courseQ.value = '' }
const dropCourse = (id) => { form.courses = form.courses.filter((x) => x.course_id !== id) }

const n = (v) => (v === '' || v == null ? null : +v)

function save() {
  if (!form.name.trim()) return toast('Give the event a name')
  if (!form.start_date) return toast('Pick a start date')
  if (form.had_caddy && form.caddy_fee === '') return toast('Add the caddy fee, or uncheck “I had a caddy”')
  commit(async () => {
    const id = await saveEvent({
      ...form,
      name: form.name.trim(),
      tier: form.pdga ? form.tier : null,
      waitlist_pos: form.status === 'waitlisted' ? n(form.waitlist_pos) : null,
      reg_opens_on: form.reg_opens_on || null,
      entry_fee: n(form.entry_fee), fee_split: +form.fee_split || 1,
      caddy_fee: form.had_caddy ? n(form.caddy_fee) : null,
      rounds_planned: n(form.rounds_planned),
      holes_per_match: form.format === 'match_play' ? n(form.holes_per_match) : null,
      team_name: form.format === 'match_play' ? form.team_name || null : null,
      partners: form.partners.map((p) => p.trim()).filter(Boolean),
      place: n(form.place), field_size: n(form.field_size), payout: n(form.payout),
      lodging: hasStay.value ? { ...stay, nights: n(stay.nights), cost: n(stay.cost), split: +stay.split || 1 } : null,
    })
    toast(existing ? 'Event updated' : 'Event added')
    if (!existing) router.push(`/event/${id}`)
  })
}

function remove() {
  const rounds = state.rounds.filter((r) => r.event_id === existing.id).length + state.matches.filter((m) => m.event_id === existing.id).length
  if (!confirm(`Delete ${existing.name}${rounds ? ` and its ${rounds} logged rounds/matches` : ''}? This can't be undone.`)) return
  commit(async () => { await deleteEvent(existing.id); toast('Event deleted'); router.replace('/schedule') })
}
</script>

<template>
  <SheetFrame :title="existing ? 'Edit event' : 'New event'">
    <div class="field" style="margin-top: 0"><div class="lbl">Event name</div><input v-model="form.name" class="input" placeholder="e.g. Glass City Open" /></div>
    <div class="field two">
      <div><div class="lbl">Starts</div><input v-model="form.start_date" class="input" type="date" /></div>
      <div><div class="lbl">Ends</div><input v-model="form.end_date" class="input" type="date" :min="form.start_date" /></div>
    </div>
    <div class="field"><div class="lbl">Location</div><input v-model="form.city" class="input" placeholder="City, State" /></div>
    <div class="field"><div class="lbl">Event page<span class="hint sug">PDGA or Disc Golf Scene link</span></div><input v-model="form.event_url" class="input" type="url" placeholder="https://" /></div>

    <div class="field">
      <div class="lbl">Format</div>
      <div class="choice compact"><button v-for="(label, k) in FORMAT" :key="k" type="button" :class="{ on: form.format === k }" @click="form.format = k">{{ label }}</button></div>
    </div>
    <div v-if="teammates" class="field" :class="{ two: teammates === 2 }">
      <div v-for="(p, i) in teammates" :key="i"><div class="lbl">{{ teammates === 1 ? 'Partner' : `Teammate ${i + 1}` }}</div><input v-model="form.partners[i]" class="input" placeholder="Name" /></div>
    </div>
    <div v-if="form.format === 'match_play'" class="field two">
      <div><div class="lbl">Your team</div><input v-model="form.team_name" class="input" placeholder="Team name" /></div>
      <div><div class="lbl">Holes per match</div><input v-model="form.holes_per_match" class="input" inputmode="numeric" /></div>
    </div>

    <div class="field">
      <div class="lbl">Sanctioning</div>
      <div class="choice compact"><button type="button" :class="{ on: form.pdga }" @click="form.pdga = true">PDGA</button><button type="button" :class="{ on: !form.pdga }" @click="form.pdga = false">Non-PDGA</button></div>
    </div>
    <div class="field two">
      <div v-if="form.pdga"><div class="lbl">Tier</div><select v-model="form.tier" class="input"><option v-for="t in TIERS" :key="t">{{ t }}</option></select></div>
      <div><div class="lbl">Division</div><input v-model="form.division" class="input" list="divisions" /><datalist id="divisions"><option v-for="d in DIVISIONS" :key="d" :value="d" /></datalist></div>
    </div>

    <div class="field">
      <div class="lbl">Status</div>
      <div class="choice compact"><button v-for="(label, k) in STATUS" :key="k" type="button" :class="{ on: form.status === k }" @click="form.status = k"><span class="status" :class="k" style="background: none; padding: 0">{{ label }}</span></button></div>
    </div>
    <div v-if="form.status === 'waitlisted'" class="field"><div class="lbl">Waitlist position</div><input v-model="form.waitlist_pos" class="input" inputmode="numeric" placeholder="#" /></div>

    <div class="field two">
      <div><div class="lbl">Registration opens</div><input v-model="form.reg_opens_on" class="input" type="date" /></div>
      <div><div class="lbl">Rounds</div><input v-model="form.rounds_planned" class="input" inputmode="numeric" placeholder="e.g. 3" /></div>
    </div>
    <div v-if="form.reg_opens_on" class="kv">
      <div><div class="v">Remind me when it opens</div><div class="k">Notification at 8:00 AM</div></div>
      <button class="end switch" :class="{ on: form.remind }" type="button" aria-label="Reminder" @click="form.remind = !form.remind"></button>
    </div>

    <div class="field two">
      <div><div class="lbl">Entry fee<span class="hint sug">{{ teammates ? 'Per team' : '' }}</span></div><input v-model="form.entry_fee" class="input" inputmode="decimal" placeholder="$" /></div>
      <div v-if="teammates"><div class="lbl">Split</div><select v-model.number="form.fee_split" class="input"><option :value="1">I paid it all</option><option v-for="k in [2, 3, 4]" :key="k" :value="k">{{ k }} ways</option></select></div>
    </div>
    <div class="kv">
      <div><div class="v">I had a caddy</div><div class="k">Adds a caddy fee</div></div>
      <button class="end switch" :class="{ on: form.had_caddy }" type="button" aria-label="Had a caddy" @click="form.had_caddy = !form.had_caddy"></button>
    </div>
    <div v-if="form.had_caddy" class="field" style="margin-top: 8px"><div class="lbl">Caddy fee</div><input v-model="form.caddy_fee" class="input" inputmode="decimal" placeholder="$" /></div>

    <div class="field">
      <div class="lbl">Courses</div>
      <div v-if="picked.length" class="picked">
        <span v-for="c in picked" :key="c.id" class="chip">{{ c.name }}<button type="button" :aria-label="'Remove ' + c.name" @click="dropCourse(c.id)"><Icon name="x" size="xs" /></button></span>
      </div>
      <input v-model="courseQ" class="input" placeholder="Search your courses" />
      <div v-if="matches.length" class="pick-list">
        <button v-for="c in matches" :key="c.id" type="button" @click="addCourse(c)"><Icon name="plus" size="xs" />{{ c.name }}<span class="muted">{{ c.city }}</span></button>
      </div>
      <p v-else-if="courseQ" class="meta" style="margin-top: 6px">No match — add the course from the atlas first.</p>
    </div>

    <div class="kv" style="margin-top: 14px">
      <div><div class="v">Overnight stay</div><div class="k">Hotel, Airbnb — for travel and budget</div></div>
      <button class="end switch" :class="{ on: hasStay }" type="button" aria-label="Overnight stay" @click="hasStay = !hasStay"></button>
    </div>
    <template v-if="hasStay">
      <div class="field two" style="margin-top: 8px">
        <div><div class="lbl">Type</div><select v-model="stay.type" class="input"><option>Airbnb</option><option>Hotel</option><option>Camping</option><option>Friend's place</option></select></div>
        <div><div class="lbl">Nights</div><input v-model="stay.nights" class="input" inputmode="numeric" /></div>
      </div>
      <div class="field"><div class="lbl">Name</div><input v-model="stay.name" class="input" placeholder="e.g. East Village loft" /></div>
      <div class="field two">
        <div><div class="lbl">Total cost</div><input v-model="stay.cost" class="input" inputmode="decimal" placeholder="$" /></div>
        <div><div class="lbl">Split</div><select v-model.number="stay.split" class="input"><option :value="1">Just me</option><option v-for="k in [2, 3, 4, 5, 6]" :key="k" :value="k">{{ k }} ways</option></select></div>
      </div>
    </template>

    <template v-if="showResults">
      <div class="sheet-sub">Result</div>
      <div class="field two" style="margin-top: 10px">
        <div><div class="lbl">Place</div><input v-model="form.place" class="input" inputmode="numeric" placeholder="e.g. 4" /></div>
        <div><div class="lbl">Field</div><input v-model="form.field_size" class="input" inputmode="numeric" placeholder="e.g. 38" /></div>
      </div>
      <div class="field two">
        <div><div class="lbl">Field counts</div><select v-model="form.field_unit" class="input"><option value="players">Players</option><option value="teams">Teams</option></select></div>
        <div><div class="lbl">Payout</div><input v-model="form.payout" class="input" inputmode="decimal" placeholder="$0" /></div>
      </div>
    </template>

    <div class="field"><div class="lbl">Notes</div><textarea v-model="form.notes" class="input" placeholder="Anything worth remembering"></textarea></div>
    <button v-if="existing" class="btn block danger" style="margin-top: 22px" @click="remove">Delete event</button>
    <template #foot><button class="btn disc" @click="save">{{ existing ? 'Save changes' : 'Add event' }}</button></template>
  </SheetFrame>
</template>
