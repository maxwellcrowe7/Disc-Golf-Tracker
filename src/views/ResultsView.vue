<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHead from '../components/PageHead.vue'
import Icon from '../components/Icon.vue'
import ResultRow from '../components/ResultRow.vue'
import RoundsTable from '../components/results/RoundsTable.vue'
import LeagueCard from '../components/results/LeagueCard.vue'
import StatsPanel from '../components/results/StatsPanel.vue'
import { state } from '../data/store.js'
import { pastEvents } from '../lib/season.js'
import { seasonsIn } from '../lib/stats.js'
import { FORMAT } from '../lib/format.js'
import { openSheet } from '../lib/sheet.js'
import LeagueSheet from '../components/sheets/LeagueSheet.vue'
import QuickSheet from '../components/sheets/QuickSheet.vue'

const route = useRoute(), router = useRouter()
const tab = computed(() => route.params.tab || 'events')
const TABS = [['events', 'Events'], ['rounds', 'Rounds'], ['leagues', 'Leagues'], ['stats', 'Stats']]
const setTab = (t) => router.replace(t === 'events' ? '/results' : `/results/${t}`)

// One season picker drives every tab; '' means career.
// Only seasons with something played in them (upcoming-only years have nothing to show here).
const seasons = computed(() => seasonsIn({ events: pastEvents(state.events, state.today), rounds: state.rounds }))
const season = ref('')

// Recap card numbers for the selected season (or career).
const past = computed(() => pastEvents(state.events, state.today).filter((e) => !season.value || e.start_date.startsWith(season.value)))
const recap = computed(() => {
  const rounds = state.rounds.filter((r) => !season.value || r.played_on.startsWith(season.value))
  const rs = [...state.ratings].filter((r) => !season.value || r.effective_date.startsWith(season.value)).sort((a, b) => a.effective_date.localeCompare(b.effective_date))
  return {
    events: past.value.filter((e) => ['played', 'recorded'].includes(e.status)).length,
    podiums: past.value.filter((e) => e.place && e.place <= 3).length,
    rounds: rounds.length + state.matches.filter((m) => past.value.some((e) => e.id === m.event_id)).length,
    climb: rs.length > 1 ? rs[rs.length - 1].rating - rs[0].rating : null,
  }
})

// Events tab filters.
const fmt = ref('')
const tier = ref('')
const q = ref('')
const tiers = computed(() => [...new Set(state.events.map((e) => (e.pdga ? e.tier || 'PDGA' : 'Non-PDGA')))].sort())
const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  return past.value
    .filter((e) => !fmt.value || e.format === fmt.value)
    .filter((e) => !tier.value || (e.pdga ? e.tier || 'PDGA' : 'Non-PDGA') === tier.value)
    .filter((e) => !s || `${e.name} ${e.city || ''}`.toLowerCase().includes(s))
})
const byYear = computed(() => {
  const g = {}
  filtered.value.forEach((e) => (g[e.start_date.slice(0, 4)] ||= []).push(e))
  return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]))
})
const leagues = computed(() => [...state.leagues].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)))

const seg = ref(null), ind = ref({})
function placeInd() { const on = seg.value?.querySelector('button.on'); if (on) ind.value = { width: on.offsetWidth + 'px', transform: `translateX(${on.offsetLeft - 4}px)` } }
onMounted(() => nextTick(placeInd))
watch(tab, () => nextTick(placeInd))
</script>

<template>
  <PageHead :kick="['Tournaments · rounds · leagues · stats']" :lines="['Results']">
    <button class="icon-btn" aria-label="Log something" @click="openSheet(QuickSheet)"><Icon name="plus" size="sm" /></button>
  </PageHead>

  <div class="review">
    <div class="review-top">
      <span class="mono">{{ season ? 'Season recap' : 'Career recap' }}</span>
      <div class="season-pick">
        <button :class="{ on: !season }" @click="season = ''">Career</button>
        <button v-for="y in seasons" :key="y" :class="{ on: season === y }" @click="season = y">{{ y }}</button>
      </div>
    </div>
    <h2 v-if="season">{{ season }}, <em>in review</em></h2>
    <h2 v-else>All of it, <em>so far</em></h2>
    <div class="g">
      <div><span class="mono">Events</span><span class="num">{{ recap.events }}</span></div>
      <div><span class="mono">Podiums</span><span class="num">{{ recap.podiums }}</span></div>
      <div><span class="mono">Rounds logged</span><span class="num">{{ recap.rounds }}</span></div>
      <div><span class="mono">Rating climb</span><span class="num d">{{ recap.climb == null ? '—' : (recap.climb >= 0 ? '+' : '−') + Math.abs(recap.climb) }}</span></div>
    </div>
  </div>

  <div style="margin-top: 22px">
    <div ref="seg" class="seg">
      <span class="seg-ind" :style="ind"></span>
      <button v-for="[k, label] in TABS" :key="k" :class="{ on: tab === k }" @click="setTab(k)">{{ label }}</button>
    </div>
  </div>

  <template v-if="tab === 'events'">
    <div class="results-filters">
      <select v-model="fmt" class="input"><option value="">Every format</option><option v-for="(label, k) in FORMAT" :key="k" :value="k">{{ label }}</option></select>
      <select v-model="tier" class="input"><option value="">Every tier</option><option v-for="t in tiers" :key="t">{{ t }}</option></select>
      <label class="search"><Icon name="search" size="sm" /><input v-model="q" placeholder="Search events" /></label>
    </div>
    <template v-for="[year, evs] in byYear" :key="year">
      <div class="year-h"><h4>{{ year }}</h4><span class="rule"></span><span class="mono">{{ evs.length }} events</span></div>
      <div class="card list">
        <div class="sc-head"><span></span><span>Event</span><span class="cells" style="display: flex; gap: 4px"><span v-for="r in ['R1', 'R2', 'R3']" :key="r" style="min-width: 34px; text-align: center">{{ r }}</span></span><span class="tot">Total</span><span style="width: 46px; text-align: center">Fin.</span></div>
        <ResultRow v-for="e in evs" :key="e.id" :event="e" />
      </div>
    </template>
    <div v-if="!byYear.length" class="card page-stub" style="margin-top: 18px"><b>No events</b>{{ past.length ? 'Nothing matches those filters.' : 'Past events show up here.' }}</div>
  </template>

  <div v-else-if="tab === 'rounds'" style="margin-top: 18px"><RoundsTable :season="season" /></div>

  <template v-else-if="tab === 'leagues'">
    <LeagueCard v-for="l in leagues" :key="l.id" :league="l" :season="season" />
    <button class="btn block" style="margin-top: 18px" @click="openSheet(LeagueSheet, {})"><Icon name="plus" size="xs" />Add a league</button>
  </template>

  <div v-else style="margin-top: 18px"><StatsPanel :season="season" /></div>
</template>
