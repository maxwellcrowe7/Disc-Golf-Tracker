<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHead from '../components/PageHead.vue'
import Icon from '../components/Icon.vue'
import Plate from '../components/Plate.vue'
import StatusChip from '../components/StatusChip.vue'
import TicketCard from '../components/TicketCard.vue'
import SeasonMap from '../components/SeasonMap.vue'
import { state, courseById } from '../data/store.js'
import { MON, STATUS, fmtRange, money, parseDate, isoDate, pad2 } from '../lib/format.js'
import { upcomingEvents, costFor, tripMiles } from '../lib/season.js'
import { openSheet } from '../lib/sheet.js'
import EventSheet from '../components/sheets/EventSheet.vue'

const route = useRoute(), router = useRouter()
const mode = computed(() => route.params.mode || 'list')
const filter = ref('all')
const FILTERS = ['all', 'registered', 'planning', 'interested', 'waitlisted']

const all = computed(() => upcomingEvents(state.events, state.today))
const list = computed(() => all.value.filter((e) => filter.value === 'all' || e.status === filter.value))
const tally = computed(() => ({
  events: all.value.length,
  registered: all.value.filter((e) => e.status === 'registered').length,
  cost: all.value.reduce((a, e) => a + costFor(e).total, 0),
  miles: all.value.some((e) => tripMiles(e) != null) ? all.value.reduce((a, e) => a + (tripMiles(e) || 0), 0) : null,
}))

// Tickets grouped by month, with each month's estimated spend.
const months = computed(() => {
  const g = {}
  list.value.forEach((e) => (g[e.start_date.slice(0, 7)] ||= []).push(e))
  return Object.entries(g).map(([k, evs]) => ({ k, mon: MON[+k.slice(5) - 1], year: k.slice(0, 4), evs, cost: evs.reduce((a, e) => a + costFor(e).total, 0) }))
})

// Calendar: the next twelve months, event days filled, registration openings ringed.
const calendar = computed(() => {
  const evDay = {}, regDay = {}
  for (const e of all.value) {
    for (let d = parseDate(e.start_date); d <= parseDate(e.end_date); d.setDate(d.getDate() + 1)) evDay[isoDate(d)] = e
    if (e.reg_opens_on && e.reg_opens_on >= state.today && ['interested', 'planning'].includes(e.status)) regDay[e.reg_opens_on] = e
  }
  const t = parseDate(state.today)
  return Array.from({ length: 12 }, (_, i) => {
    const first = new Date(t.getFullYear(), t.getMonth() + i, 1)
    const y = first.getFullYear(), m = first.getMonth(), n = new Date(y, m + 1, 0).getDate()
    const days = Array.from({ length: n }, (_, j) => {
      const iso = `${y}-${pad2(m + 1)}-${pad2(j + 1)}`
      return { d: j + 1, iso, ev: evDay[iso], reg: regDay[iso], we: [0, 6].includes(new Date(y, m, j + 1).getDay()) }
    })
    const evs = [...new Set(days.filter((x) => x.ev).map((x) => x.ev))]
    const regs = days.filter((x) => x.reg).map((x) => x.reg)
    return { key: `${y}-${m}`, label: MON[m] + (m === 0 || i === 0 ? ` ’${String(y).slice(2)}` : ''), lead: first.getDay(), days, evs, regs }
  })
})

// Map
const drive = ref(false)
const mapRef = ref(null)
const home = computed(() => (state.profile.home_lat != null ? { lat: state.profile.home_lat, lng: state.profile.home_lng, label: state.profile.home_label } : null))
const unplaced = computed(() => list.value.filter((e) => e.lat == null))
const firstCourse = (e) => e.courses[0] && courseById(e.courses[0].course_id)

// Sliding indicator under the active segment.
const seg = ref(null), ind = ref({})
function placeInd() {
  const on = seg.value?.querySelector('button.on')
  if (on) ind.value = { width: on.offsetWidth + 'px', transform: `translateX(${on.offsetLeft - 4}px)` }
}
onMounted(() => nextTick(placeInd))
watch(mode, () => nextTick(placeInd))
const setMode = (m) => router.replace(m === 'list' ? '/schedule' : `/schedule/${m}`)
</script>

<template>
  <PageHead :kick="['Next twelve months', `${all.length} events`]" :lines="['The', '*season*']">
    <button class="icon-btn" aria-label="Add event" @click="openSheet(EventSheet, {})"><Icon name="plus" size="sm" /></button>
  </PageHead>

  <div class="tally">
    <div><span class="mono">Events</span><span class="num">{{ tally.events }}</span></div>
    <div><span class="mono">Signed up</span><span class="num">{{ tally.registered }}</span></div>
    <div><span class="mono">Est. cost</span><span class="num">{{ money(tally.cost) }}</span></div>
    <div><span class="mono">Miles</span><span class="num">{{ tally.miles != null ? (tally.miles / 1000).toFixed(1) + 'k' : '—' }}</span></div>
  </div>

  <div class="controls">
    <div ref="seg" class="seg">
      <span class="seg-ind" :style="ind"></span>
      <button :class="{ on: mode === 'list' }" @click="setMode('list')"><Icon name="list" size="sm" />Tickets</button>
      <button :class="{ on: mode === 'cal' }" @click="setMode('cal')"><Icon name="calendar" size="sm" />Calendar</button>
      <button :class="{ on: mode === 'map' }" @click="setMode('map')"><Icon name="map" size="sm" />Map</button>
    </div>
    <div v-if="mode !== 'cal'" class="pills">
      <button v-for="f in FILTERS" :key="f" class="pill" :class="{ on: filter === f }" @click="filter = f">
        {{ f === 'all' ? 'All' : STATUS[f] }}<span class="n">{{ f === 'all' ? all.length : all.filter((e) => e.status === f).length }}</span>
      </button>
    </div>
  </div>

  <!-- Tickets -->
  <template v-if="mode === 'list'">
    <div v-if="months.length" class="tl">
      <template v-for="m in months" :key="m.k">
        <div class="tl-month"><h4>{{ m.mon }}<span>{{ m.year }}</span></h4><span v-if="m.cost" class="mono">{{ money(m.cost) }} est.</span></div>
        <div><TicketCard v-for="e in m.evs" :key="e.id" :event="e" :today="state.today" /></div>
      </template>
    </div>
    <div v-else class="card empty-hero" style="margin-top: 20px">
      <b>{{ all.length ? 'Nothing with that status' : 'No upcoming events' }}</b>
      <span class="muted">Add tournaments you're registered for, planning, or just interested in — the season builds from here.</span>
      <button class="btn disc" @click="openSheet(EventSheet, {})"><Icon name="plus" size="xs" />Add an event</button>
    </div>
  </template>

  <!-- Calendar -->
  <template v-else-if="mode === 'cal'">
    <div class="cal-grid">
      <div v-for="mo in calendar" :key="mo.key" class="card mini">
        <h5>{{ mo.label }}<span>{{ mo.evs.length ? `${mo.evs.length} EVENT${mo.evs.length > 1 ? 'S' : ''}` : '' }}</span></h5>
        <div class="days">
          <span v-for="(d, i) in ['S', 'M', 'T', 'W', 'T', 'F', 'S']" :key="'w' + i" class="dow">{{ d }}</span>
          <span v-for="i in mo.lead" :key="'b' + i"></span>
          <template v-for="d in mo.days" :key="d.iso">
            <RouterLink v-if="d.ev" class="day ev-day" :style="{ '--c': `var(--st-${d.ev.status})` }" :to="`/event/${d.ev.id}`" :title="d.ev.name">{{ d.d }}</RouterLink>
            <RouterLink v-else-if="d.reg" class="day reg" :to="`/event/${d.reg.id}`" :title="`Registration opens: ${d.reg.name}`"><span>{{ d.d }}</span></RouterLink>
            <span v-else class="day" :class="{ we: d.we }">{{ d.d }}</span>
          </template>
        </div>
        <div v-if="mo.evs.length || mo.regs.length" class="evs">
          <RouterLink v-for="e in mo.evs" :key="e.id" :to="`/event/${e.id}`" :style="{ '--c': `var(--st-${e.status})` }"><i></i>{{ e.name }}</RouterLink>
          <RouterLink v-for="e in mo.regs" :key="'r' + e.id" :to="`/event/${e.id}`" style="color: var(--muted)"><i style="background: none; border-radius: 1px; transform: rotate(45deg); box-shadow: inset 0 0 0 1.5px var(--st-planning)"></i>Reg · {{ e.name }}</RouterLink>
        </div>
      </div>
    </div>
    <div class="legend" style="margin-top: 16px">
      <span v-for="s in ['registered', 'planning', 'interested', 'waitlisted']" :key="s" :style="{ '--c': `var(--st-${s})` }"><i></i>{{ STATUS[s] }}</span>
      <span><i style="background: none; border-radius: 1px; transform: rotate(45deg) scale(0.85); box-shadow: inset 0 0 0 1.5px var(--st-planning)"></i>Registration opens</span>
    </div>
  </template>

  <!-- Map -->
  <div v-else class="map-wrap">
    <SeasonMap ref="mapRef" :events="list" :home="home" :drive-times="drive" />
    <div class="card list">
      <div class="map-tools">
        <div><b style="font-size: var(--t-body)">Drive times</b><div class="meta">{{ home ? 'From ' + (home.label || 'home') : 'Set your home base in Settings' }}</div></div>
        <button class="switch" :class="{ on: drive }" aria-label="Show drive times" @click="drive = !drive"></button>
      </div>
      <button v-for="e in list" :key="e.id" class="lrow" @click="e.lat != null ? mapRef.focus(e.id) : router.push(`/event/${e.id}`)">
        <Plate v-if="firstCourse(e)" :course="firstCourse(e)" lite class="thumb sm" />
        <div class="body"><div class="name">{{ e.name }}</div><div class="meta">{{ fmtRange(e.start_date, e.end_date) }}<template v-if="e.lat == null"><span class="dot"></span>not on the map yet</template></div></div>
        <StatusChip :event="e" />
      </button>
      <p v-if="unplaced.length" class="meta" style="padding: 12px 16px">Events without a location stay off the map until locations are looked up automatically (build step 6).</p>
    </div>
  </div>

  <p style="margin-top: 26px" class="meta"><RouterLink to="/results" style="text-decoration: underline">Past events live in Results →</RouterLink></p>
</template>
