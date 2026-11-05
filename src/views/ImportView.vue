<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import PageHead from '../components/PageHead.vue'
import Icon from '../components/Icon.vue'
import { state } from '../data/store.js'
import { runLegacyImport } from '../data/api.js'
import { refresh } from '../data/session.js'
import { mapLegacy } from '../lib/migrate.js'
import { fmtDateY } from '../lib/format.js'
import { toast } from '../lib/toast.js'

const router = useRouter()
const step = ref('')
const error = ref('')
const busy = ref(false)

const preview = computed(() => (state.legacy ? mapLegacy(state.legacy.blob, { today: state.today }) : null))
const rows = computed(() => {
  const c = preview.value?.report.counts, s = preview.value?.report.source
  if (!c) return []
  return [
    ['Courses', s.courses, c.courses],
    ['Leagues', s.leagues, c.leagues],
    ['Tournaments → events', s.tournaments, c.events],
    ['Tournament rounds', s.tRounds, c.tournamentRounds + c.matches],
    ['League rounds', s.leagueRounds, c.leagueRounds],
  ]
})

async function bringOver() {
  busy.value = true
  error.value = ''
  try {
    await runLegacyImport(state.userId, state.legacy.blob, state.today, (s) => { step.value = s })
    step.value = 'loading'
    await refresh()
    state.legacy = null
    toast('Your data is in')
    router.replace('/')
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

function later() {
  state.legacy = null // asks again next sign-in, or any time from Settings
  router.replace('/')
}
</script>

<template>
  <div class="import-page">
    <PageHead :kick="['One-time move', state.legacy?.savedAt ? 'Last saved ' + fmtDateY(state.legacy.savedAt.slice(0, 10)) : '']" :lines="['Bring your', '*history over*']" />

    <template v-if="preview">
      <p class="lede">Your data from the old app is still saved. Here's how it lands in the new one — nothing is copied until you say so, and the old copy stays as a backup.</p>

      <div class="card import-table">
        <div class="it-row it-head"><span></span><span class="mono">Old app</span><span class="mono">New app</span></div>
        <div v-for="r in rows" :key="r[0]" class="it-row"><span>{{ r[0] }}</span><span class="num">{{ r[1] }}</span><span class="num">{{ r[2] }}</span></div>
      </div>

      <div v-if="preview.report.warnings.length" class="card import-notes">
        <div class="ph"><h3>Worth knowing</h3></div>
        <ul class="pb">
          <li v-for="(w, i) in preview.report.warnings" :key="i">{{ w.msg }}</li>
        </ul>
      </div>

      <p v-if="error" class="signin-msg err">Something went wrong: {{ error }}. Nothing is lost — try again.</p>
      <div class="import-actions">
        <button class="btn disc big" :disabled="busy" @click="bringOver">
          <Icon :name="busy ? 'clock' : 'check'" size="sm" />{{ busy ? `Copying ${step}…` : 'Bring it over' }}
        </button>
        <button class="btn big" :disabled="busy" @click="later">Not now</button>
      </div>
    </template>

    <div v-else class="card page-stub"><b>Nothing to bring over</b>No saved data from the old app on this account.<br /><RouterLink to="/">Go to Home</RouterLink></div>
  </div>
</template>
