<script setup>
import { computed } from 'vue'
import PageHead from '../components/PageHead.vue'
import SecHead from '../components/SecHead.vue'
import Icon from '../components/Icon.vue'
import ScoreMark from '../components/ScoreMark.vue'
import NextTee from '../components/NextTee.vue'
import Climb from '../components/Climb.vue'
import SeasonTrail from '../components/SeasonTrail.vue'
import ResultRow from '../components/ResultRow.vue'
import { state, courseById } from '../data/store.js'
import { fmtDow, fmtDate, ord, money, parseDate, isoDate, DOW } from '../lib/format.js'
import { upcomingEvents, pastEvents, costFor, tripMiles, todos } from '../lib/season.js'
import { openSheet } from '../lib/sheet.js'
import EventSheet from '../components/sheets/EventSheet.vue'
import RoundSheet from '../components/sheets/RoundSheet.vue'

const first = computed(() => state.profile.name?.split(' ')[0] || 'there')
const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Morning,' : h < 17 ? 'Afternoon,' : 'Evening,' })()

const upcoming = computed(() => upcomingEvents(state.events, state.today))
const next = computed(() => upcoming.value[0])
const yearOut = computed(() => { const d = parseDate(state.today); d.setFullYear(d.getFullYear() + 1); return isoDate(d) })
const ahead = computed(() => upcoming.value.filter((e) => e.start_date <= yearOut.value))
const ledger = computed(() => ({
  events: ahead.value.length,
  registered: ahead.value.filter((e) => e.status === 'registered').length,
  cost: ahead.value.reduce((a, e) => a + costFor(e).total, 0),
  miles: ahead.value.some((e) => tripMiles(e) != null) ? ahead.value.reduce((a, e) => a + (tripMiles(e) || 0), 0) : null,
}))
const ratings = computed(() => [...state.ratings].sort((a, b) => a.effective_date.localeCompare(b.effective_date)))
const list = computed(() => todos(state, state.today))
const recent = computed(() => pastEvents(state.events, state.today).slice(0, 4))

// League nights: active leagues, their last round and the next night on the calendar.
const leagues = computed(() => state.leagues.filter((l) => l.active).map((l) => {
  const last = state.rounds.filter((r) => r.league_id === l.id).sort((a, b) => b.played_on.localeCompare(a.played_on))[0]
  const dow = DOW.indexOf((l.day_time || '').slice(0, 3))
  let nextNight = null
  if (dow >= 0) { const d = parseDate(state.today); while (d.getDay() !== dow) d.setDate(d.getDate() + 1); nextNight = isoDate(d) }
  return { l, last, nextNight, course: courseById(l.home_course_id) }
}))
</script>

<template>
  <PageHead :kick="[fmtDow(state.today), state.demo ? 'Demo data' : `${upcoming.length} upcoming`]" :lines="[greeting, `*${first}.*`]">
    <RouterLink class="icon-btn mobile-only" to="/settings" aria-label="Settings"><Icon name="user" size="sm" /></RouterLink>
  </PageHead>

  <div class="home-grid">
    <section class="full">
      <SecHead :no="1" title="Next tee" />
      <NextTee v-if="next" :event="next" :today="state.today" />
      <div v-else class="card empty-hero">
        <b>No events on the calendar yet</b>
        <span class="muted">Add the tournaments you're eyeing — even maybes — and they'll show up here with a countdown.</span>
        <button class="btn disc" @click="openSheet(EventSheet, {})"><Icon name="plus" size="xs" />Add an event</button>
      </div>
    </section>

    <section class="sec">
      <SecHead :no="2" title="The" em="climb"><RouterLink to="/settings">Ratings <Icon name="arrowR" size="xs" /></RouterLink></SecHead>
      <Climb v-if="ratings.length" :ratings="ratings" />
      <div v-else class="card page-stub"><b>No ratings yet</b>Add your rating in <RouterLink to="/settings" style="text-decoration: underline">Settings</RouterLink> to start the climb.</div>
    </section>

    <section class="sec">
      <SecHead :no="3" title="Ledger"><RouterLink to="/schedule">Season <Icon name="arrowR" size="xs" /></RouterLink></SecHead>
      <div class="card ledger">
        <div class="row"><span class="k">Events ahead</span><span class="dots"></span><span class="num">{{ ledger.events }}</span></div>
        <div class="row"><span class="k">Signed up</span><span class="dots"></span><span class="num">{{ ledger.registered }}</span></div>
        <div class="row"><span class="k">Est. cost</span><span class="dots"></span><span class="num">{{ money(ledger.cost) }}</span></div>
        <div class="row"><span class="k">Road miles</span><span class="dots"></span><span class="num">{{ ledger.miles != null ? ledger.miles.toLocaleString() : '—' }}<small v-if="ledger.miles != null">mi</small></span></div>
      </div>
    </section>

    <section v-if="ahead.length" class="sec full">
      <SecHead :no="4" title="Season" em="trail"><RouterLink to="/schedule/map">Map <Icon name="arrowR" size="xs" /></RouterLink></SecHead>
      <SeasonTrail :events="ahead" :today="state.today" />
    </section>

    <section class="sec">
      <SecHead :no="5" title="Before the" em="next round" />
      <div class="card list">
        <RouterLink v-for="t in list" :key="t.kind + t.event.id" class="todo lrow" :to="`/event/${t.event.id}`" :style="{ '--c': `var(--st-${t.tone})` }">
          <span class="check"><Icon name="check" size="xs" /></span>
          <div class="body"><b>{{ t.title }}</b><span>{{ t.sub }}</span></div>
          <span class="when">{{ t.when }}</span>
        </RouterLink>
        <p v-if="!list.length" class="muted" style="padding: 16px">All caught up.</p>
      </div>
    </section>

    <section class="sec">
      <SecHead :no="6" title="League" em="nights"><RouterLink to="/results/leagues">All <Icon name="arrowR" size="xs" /></RouterLink></SecHead>
      <div class="card list">
        <div v-for="x in leagues" :key="x.l.id" class="lrow">
          <span class="league-chip" :style="{ background: x.l.color || 'var(--moss)' }"></span>
          <div class="body"><div class="name">{{ x.l.name }}</div><div class="meta">{{ x.l.day_time || 'No night set' }}<template v-if="x.nextNight"><span class="dot"></span>Next {{ fmtDate(x.nextNight) }}</template></div></div>
          <div v-if="x.last && x.last.score != null && x.last.par != null" class="end"><ScoreMark :score="x.last.score" :par="x.last.par" /><small>Last<template v-if="x.last.place"> · {{ ord(x.last.place) }}</template></small></div>
        </div>
        <p v-if="!leagues.length" class="muted" style="padding: 16px">No active leagues.</p>
        <div v-if="leagues.length" style="padding: 6px 16px 16px"><button class="btn block" @click="openSheet(RoundSheet, { leagueId: leagues[0].l.id })"><Icon name="plus" size="xs" />Log {{ leagues[0].l.name }}</button></div>
      </div>
    </section>

    <section class="sec full">
      <SecHead :no="7" title="Scorecard"><RouterLink to="/results">All results <Icon name="arrowR" size="xs" /></RouterLink></SecHead>
      <div class="card list">
        <div class="sc-head"><span></span><span>Event</span><span class="cells" style="display: flex; gap: 4px"><span v-for="r in ['R1', 'R2', 'R3']" :key="r" style="min-width: 34px; text-align: center">{{ r }}</span></span><span class="tot">Total</span><span style="width: 46px; text-align: center">Fin.</span></div>
        <ResultRow v-for="e in recent" :key="e.id" :event="e" />
        <p v-if="!recent.length" class="muted" style="padding: 16px">No results yet.</p>
      </div>
    </section>
  </div>
</template>
