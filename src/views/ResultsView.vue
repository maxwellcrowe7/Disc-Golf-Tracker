<script setup>
// Interim results (step 4): leagues with edit + log. Events, the Rounds table and Stats land in step 5.
import { computed } from 'vue'
import PageHead from '../components/PageHead.vue'
import Icon from '../components/Icon.vue'
import { state, courseById } from '../data/store.js'
import { openSheet } from '../lib/sheet.js'
import LeagueSheet from '../components/sheets/LeagueSheet.vue'
import RoundSheet from '../components/sheets/RoundSheet.vue'

const leagues = computed(() => [...state.leagues].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)))
const count = (id) => state.rounds.filter((r) => r.league_id === id).length
</script>

<template>
  <PageHead :kick="['Tournaments · rounds · leagues · stats']" :lines="['Results']">
    <button class="icon-btn" aria-label="Add league" @click="openSheet(LeagueSheet, {})"><Icon name="plus" size="sm" /></button>
  </PageHead>
  <div class="year-h"><h4>Leagues</h4><span class="rule"></span></div>
  <div class="card list">
    <div v-for="l in leagues" :key="l.id" class="lrow">
      <span class="league-chip" :style="{ background: l.color || 'var(--moss)' }"></span>
      <div class="body"><div class="name">{{ l.name }}</div><div class="meta">{{ l.day_time }}<template v-if="l.home_course_id"><span class="dot"></span>{{ courseById(l.home_course_id)?.name }}</template><span class="dot"></span>{{ count(l.id) }} rounds<template v-if="!l.active"><span class="dot"></span>inactive</template></div></div>
      <button class="btn sm" @click="openSheet(RoundSheet, { leagueId: l.id })"><Icon name="plus" size="xs" />Round</button>
      <button class="icon-btn" style="width: 34px; height: 34px; box-shadow: none" aria-label="Edit league" @click="openSheet(LeagueSheet, { id: l.id })"><Icon name="edit" size="xs" /></button>
    </div>
    <p v-if="!leagues.length" class="muted" style="padding: 16px">No leagues yet.</p>
  </div>
  <div class="card page-stub" style="margin-top: 16px"><b>More in build step 5</b>Event results, the Rounds table with quick filters, league breakdowns and stats.</div>
</template>
