<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import PageHead from '../components/PageHead.vue'
import Icon from '../components/Icon.vue'
import { state } from '../data/store.js'
import { saveProfile, saveRatings, deleteRating, exportBackup, restoreBackup, fetchLegacy } from '../data/api.js'
import { refresh, signOut } from '../data/session.js'
import { parseRatingLines } from '../lib/ratings.js'
import { fmtDateY } from '../lib/format.js'
import { theme, setTheme } from '../lib/theme.js'
import { toast } from '../lib/toast.js'

const router = useRouter()
const live = computed(() => !state.demo)
const demoOnly = () => toast('Sign in to save changes — this is demo data')

// ── player ──
const form = reactive({ name: state.profile.name || '', pdga_number: state.profile.pdga_number || '', home_label: state.profile.home_label || '' })
const dirty = computed(() => ['name', 'pdga_number', 'home_label'].some((k) => (form[k] || '') !== (state.profile[k] || '')))
async function savePlayer() {
  if (!live.value) return demoOnly()
  try {
    const row = await saveProfile(state.userId, { name: form.name.trim() || null, pdga_number: form.pdga_number.trim() || null, home_label: form.home_label.trim() || null })
    Object.assign(state.profile, row)
    toast('Profile saved')
  } catch (e) { toast(e.message) }
}
const pdgaUrl = computed(() => (state.profile.pdga_number ? `https://www.pdga.com/player/${state.profile.pdga_number}` : ''))

// ── rating history ──
const history = computed(() => [...state.ratings].sort((a, b) => b.effective_date.localeCompare(a.effective_date)))
const add = reactive({ date: state.today, rating: '' })
async function addRating() {
  const r = +add.rating
  if (!add.date || !(r >= 400 && r <= 1200)) return toast('Enter a date and a rating between 400 and 1200')
  if (!live.value) return demoOnly()
  try {
    await saveRatings([{ effective_date: add.date, rating: r, source: 'manual' }])
    await refresh()
    add.rating = ''
    toast(`Rating ${r} saved`)
  } catch (e) { toast(e.message) }
}
async function removeRating(row) {
  if (!live.value) return demoOnly()
  if (!confirm(`Delete the ${row.rating} rating from ${fmtDateY(row.effective_date)}?`)) return
  try { await deleteRating(row.id); await refresh(); toast('Rating deleted') } catch (e) { toast(e.message) }
}

const pasting = ref(false)
const pasted = ref('')
const parsed = computed(() => parseRatingLines(pasted.value))
async function importPasted() {
  if (!live.value) return demoOnly()
  try {
    await saveRatings(parsed.value.map((r) => ({ ...r, source: 'pdga_import' })))
    await refresh()
    toast(`${parsed.value.length} ratings imported`)
    pasting.value = false
    pasted.value = ''
  } catch (e) { toast(e.message) }
}

// ── data ──
async function downloadBackup() {
  if (!live.value) return demoOnly()
  try {
    const blob = new Blob([JSON.stringify(await exportBackup(), null, 2)], { type: 'application/json' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `fairway-backup-${state.today}.json` })
    a.click()
    URL.revokeObjectURL(a.href)
    toast('Backup downloaded')
  } catch (e) { toast(e.message) }
}
async function restoreFrom(ev) {
  const file = ev.target.files[0]
  ev.target.value = ''
  if (!file) return
  if (!live.value) return demoOnly()
  if (!confirm('Merge this backup into your data? Matching entries are updated; nothing is deleted.')) return
  try { await restoreBackup(JSON.parse(await file.text())); await refresh(); toast('Backup restored') } catch (e) { toast(e.message) }
}
async function reimport() {
  if (!live.value) return demoOnly()
  state.legacy = await fetchLegacy()
  if (state.legacy) router.push('/import')
  else toast('No saved data from the old app on this account')
}
</script>

<template>
  <PageHead :kick="[state.demo ? 'Demo data' : state.email]" :lines="['Settings']" />

  <div class="settings-grid">
    <div class="col">
      <div class="card">
        <div class="ph"><h3>Player</h3><a v-if="pdgaUrl" class="btn sm" :href="pdgaUrl" target="_blank" rel="noopener"><Icon name="external" size="xs" />PDGA profile</a></div>
        <div class="pb">
          <div class="field" style="margin-top: 0"><div class="lbl">Name</div><input v-model="form.name" class="input" autocomplete="name" /></div>
          <div class="field"><div class="lbl">PDGA number</div><input v-model="form.pdga_number" class="input" inputmode="numeric" /></div>
          <div class="field">
            <div class="lbl">Home base<span class="hint sug">For drive times</span></div>
            <input v-model="form.home_label" class="input" placeholder="City, State" />
          </div>
          <button class="btn primary block" style="margin-top: 16px" :disabled="!dirty" @click="savePlayer">Save</button>
        </div>
      </div>

      <div class="card">
        <div class="ph"><h3>Appearance</h3></div>
        <div class="pb">
          <div class="kv">
            <div><div class="v">Dark mode</div><div class="k">Night-map plates</div></div>
            <div class="end"><button class="switch" :class="{ on: theme === 'dark' }" aria-label="Dark mode" @click="setTheme(theme === 'dark' ? 'light' : 'dark')"></button></div>
          </div>
        </div>
      </div>
    </div>

    <div class="col">
      <div class="card">
        <div class="ph"><h3>Rating history</h3><span class="mono">{{ history.length }} entries</span></div>
        <div class="pb">
          <p class="meta" style="margin-bottom: 12px">Your official PDGA rating over time — this draws “the climb” on Home. Add a rating each time it updates.</p>
          <div class="rating-add">
            <input v-model="add.date" class="input" type="date" aria-label="Date" />
            <input v-model="add.rating" class="input" inputmode="numeric" placeholder="Rating" aria-label="Rating" @keydown.enter="addRating" />
            <button class="btn primary" @click="addRating"><Icon name="plus" size="xs" />Add</button>
          </div>

          <button v-if="!pasting" class="btn block" style="margin-top: 10px" @click="pasting = true">Paste past ratings from PDGA</button>
          <div v-else class="paste-box">
            <p class="meta">On your <a v-if="state.profile.pdga_number" :href="`https://www.pdga.com/player/${state.profile.pdga_number}/history`" target="_blank" rel="noopener">PDGA ratings history page</a><template v-else>PDGA ratings history page</template>, select the table, copy, and paste it here. Plain “2026-10-14 1001” lines work too.</p>
            <textarea v-model="pasted" class="input" rows="6" placeholder="14-Oct-2026   1001   +5   …"></textarea>
            <div class="paste-actions">
              <span class="mono">{{ parsed.length }} ratings found</span>
              <button class="btn sm" @click="pasting = false; pasted = ''">Cancel</button>
              <button class="btn sm disc" :disabled="!parsed.length" @click="importPasted">Import {{ parsed.length || '' }}</button>
            </div>
          </div>

          <div class="rating-list">
            <div v-for="r in history" :key="r.id || r.effective_date" class="kv">
              <div><div class="v num" style="font-size: var(--t-name)">{{ r.rating }}</div><div class="k">{{ fmtDateY(r.effective_date) }}<template v-if="r.source !== 'manual'"> · {{ r.source === 'pdga_import' ? 'from PDGA' : 'from old app' }}</template></div></div>
              <button class="end icon-btn" style="width: 32px; height: 32px; box-shadow: none" aria-label="Delete rating" @click="removeRating(r)"><Icon name="x" size="xs" /></button>
            </div>
            <p v-if="!history.length" class="muted">No ratings yet.</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="ph"><h3>Your data</h3></div>
        <div class="pb">
          <div class="kv"><div><div class="v">Download a backup</div><div class="k">Everything, as a JSON file</div></div><button class="end btn sm" @click="downloadBackup">Download</button></div>
          <div class="kv"><div><div class="v">Restore a backup</div><div class="k">Merges in; never deletes</div></div><label class="end btn sm" style="cursor: pointer">Choose file<input type="file" accept=".json" hidden @change="restoreFrom" /></label></div>
          <div class="kv"><div><div class="v">Old app data</div><div class="k">Copy it in again (safe to repeat)</div></div><button class="end btn sm" @click="reimport">Import</button></div>
        </div>
      </div>

      <button v-if="!state.demo" class="btn block big" @click="signOut">Sign out</button>
    </div>
  </div>
</template>
