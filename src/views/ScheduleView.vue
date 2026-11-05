<script setup>
// Interim schedule (step 4): every event, newest season first. Tickets, calendar and map land in step 5.
import { computed } from 'vue'
import PageHead from '../components/PageHead.vue'
import Icon from '../components/Icon.vue'
import StatusChip from '../components/StatusChip.vue'
import { state } from '../data/store.js'
import { fmtRange, FORMAT } from '../lib/format.js'
import { openSheet } from '../lib/sheet.js'
import EventSheet from '../components/sheets/EventSheet.vue'

const byYear = computed(() => {
  const g = {}
  ;[...state.events].sort((a, b) => b.start_date.localeCompare(a.start_date)).forEach((e) => (g[e.start_date.slice(0, 4)] ||= []).push(e))
  return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]))
})
</script>

<template>
  <PageHead :kick="[`${state.events.length} events`]" :lines="['Schedule']">
    <button class="icon-btn" aria-label="Add event" @click="openSheet(EventSheet, {})"><Icon name="plus" size="sm" /></button>
  </PageHead>
  <section v-for="[year, evs] in byYear" :key="year">
    <div class="year-h"><h4>{{ year }}</h4><span class="rule"></span><span class="mono">{{ evs.length }} events</span></div>
    <div class="card list">
      <RouterLink v-for="e in evs" :key="e.id" class="lrow" :to="`/event/${e.id}`">
        <div class="body"><div class="name">{{ e.name }}</div><div class="meta">{{ fmtRange(e.start_date, e.end_date) }}<span class="dot"></span>{{ FORMAT[e.format] }}<template v-if="e.city"><span class="dot"></span>{{ e.city }}</template></div></div>
        <StatusChip :event="e" />
      </RouterLink>
    </div>
  </section>
  <div v-if="!state.events.length" class="card page-stub"><b>No events yet</b>Tap + to add your first.</div>
</template>
