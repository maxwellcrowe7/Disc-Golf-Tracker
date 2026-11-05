<script setup>
import { computed } from 'vue'
import PageHead from '../components/PageHead.vue'
import { state } from '../data/store.js'
import { fmtDow } from '../lib/format.js'

const first = computed(() => state.profile.name.split(' ')[0] || 'there')
const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Morning,' : h < 17 ? 'Afternoon,' : 'Evening,' })()
</script>

<template>
  <PageHead :kick="[fmtDow(state.today), state.demo ? 'Demo data' : '']" :lines="[greeting, `*${first}.*`]" />
  <div class="card page-stub"><b>Home is next</b>Next tee, the climb, ledger, season trail, to-dos, league nights and the scorecard land in build step 5.</div>
</template>
