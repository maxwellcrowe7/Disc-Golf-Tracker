<script setup>
import PageHead from '../components/PageHead.vue'
import { state } from '../data/store.js'
import { theme, setTheme } from '../lib/theme.js'
</script>

<template>
  <PageHead :kick="[state.demo ? 'Demo data' : 'Signed in']" :lines="['Settings']" />
  <div class="card">
    <div class="ph"><h3>Player</h3></div>
    <div class="pb">
      <div class="kv"><div><div class="k">Name</div><div class="v">{{ state.profile.name || '—' }}</div></div></div>
      <div class="kv"><div><div class="k">PDGA number</div><div class="v">{{ state.profile.pdga_number || '—' }}</div></div></div>
      <div class="kv"><div><div class="k">Home base</div><div class="v">{{ state.profile.home_label || '—' }}</div></div></div>
    </div>
  </div>
  <div class="card" style="margin-top: 16px">
    <div class="ph"><h3>Appearance</h3></div>
    <div class="pb">
      <div class="kv">
        <div><div class="v">Dark mode</div><div class="k">Night map plates</div></div>
        <div class="end"><button class="switch" :class="{ on: theme === 'dark' }" aria-label="Dark mode" @click="setTheme(theme === 'dark' ? 'light' : 'dark')"></button></div>
      </div>
    </div>
  </div>
  <div class="card page-stub" style="margin-top: 16px"><b>More in build step 3</b>Sign-in, rating history and import, backup export/import, notifications.</div>
</template>
