<script setup>
// Travel: home → (stay) → each course with drive times, plus a small map when locations are known.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Icon from '../Icon.vue'
import { state, courseById } from '../../data/store.js'
import { theme } from '../../lib/theme.js'

const props = defineProps({ event: { type: Object, required: true } })
const e = computed(() => props.event)
const hhmm = (m) => (m == null ? '' : m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m} min`)
const courses = computed(() => e.value.courses.map((x) => ({ ...x, c: courseById(x.course_id) })).filter((x) => x.c))
const fromHome = computed(() => ({ minutes: e.value.lodging?.drive_minutes ?? e.value.home_drive_minutes, miles: e.value.lodging?.drive_miles ?? e.value.home_drive_miles }))

const mapEl = ref(null)
let map = null
const origin = computed(() => (e.value.lodging?.lat != null ? [e.value.lodging.lat, e.value.lodging.lng] : state.profile.home_lat != null ? [state.profile.home_lat, state.profile.home_lng] : null))
const placed = computed(() => courses.value.filter((x) => x.c.lat != null))
const showMap = computed(() => placed.value.length > 0)

onMounted(() => {
  if (!showMap.value) return
  map = L.map(mapEl.value, { zoomControl: false, attributionControl: false, scrollWheelZoom: false, dragging: !L.Browser.mobile })
  L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${theme.value === 'dark' ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'}/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 16 }).addTo(map)
  const disc = getComputedStyle(document.documentElement).getPropertyValue('--disc').trim()
  const pts = []
  if (origin.value) {
    pts.push(origin.value)
    const stay = e.value.lodging?.lat != null
    L.marker(origin.value, { icon: L.divIcon({ className: '', html: `<div class="pin-home ${stay ? 'base' : ''}"><svg class="i" viewBox="0 0 24 24">${stay ? '<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="2"/>' : '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'}</svg></div>`, iconSize: [30, 30], iconAnchor: [15, 15] }), zIndexOffset: 1000 }).addTo(map)
  }
  for (const x of placed.value) {
    const p = [x.c.lat, x.c.lng]
    pts.push(p)
    if (origin.value) {
      const line = L.polyline([origin.value, p], { color: disc, weight: 2.5, dashArray: '2 7', lineCap: 'round' }).addTo(map)
      if (x.drive_minutes != null) line.bindTooltip(hhmm(x.drive_minutes), { permanent: true, className: 'drive', direction: 'center' })
    }
    L.marker(p, { icon: L.divIcon({ className: '', html: '<div class="pin-course"><svg class="i" viewBox="0 0 24 24"><path d="M12 3v15"/><path d="M5.5 8h13L17 13H7z"/><path d="M8 21h8"/></svg></div>', iconSize: [28, 28], iconAnchor: [14, 14] }) }).addTo(map).bindTooltip(x.c.name, { className: 'tip', direction: 'top', offset: [0, -14] })
  }
  if (pts.length > 1) map.fitBounds(pts, { padding: [50, 50], maxZoom: 10 })
  else map.setView(pts[0], 10)
})
onBeforeUnmount(() => map?.remove())
</script>

<template>
  <div class="card">
    <div class="ph"><h3>Travel</h3></div>
    <div class="pb">
      <div class="trip in">
        <span class="route"><i></i></span>
        <div class="stop" style="--c: var(--disc)"><div><b>Home</b><small>{{ state.profile.home_label || 'Set your home base in Settings' }}</small></div></div>
        <div class="leg"><Icon name="car" size="xs" />{{ fromHome.minutes != null ? `${hhmm(fromHome.minutes)}${fromHome.miles ? ' · ' + fromHome.miles + ' mi' : ''}` : e.lodging ? 'Drive time not set' : 'Drive' }}</div>
        <div v-if="e.lodging" class="stop" style="--c: var(--plum)"><div><b>{{ e.lodging.name || e.lodging.type }}</b><small>{{ e.lodging.type }}<template v-if="e.lodging.nights"> · {{ e.lodging.nights }} night{{ e.lodging.nights === 1 ? '' : 's' }}</template> · home base</small></div></div>
        <div v-for="x in courses" :key="x.course_id" class="stop" style="--c: var(--moss)">
          <div><b>{{ x.c.name }}</b><small>{{ x.drive_miles != null ? `${x.drive_miles} mi from ${e.lodging ? 'the stay' : 'home'}` : x.c.city || '' }}</small></div>
          <span class="t">{{ hhmm(x.drive_minutes) }}</span>
        </div>
        <p v-if="!courses.length" class="meta" style="padding: 6px 0">Add the courses from Edit.</p>
      </div>
      <div v-if="showMap" ref="mapEl" class="minimap"></div>
      <p v-else class="meta" style="margin-top: 10px">Drive times and the map fill in once locations are looked up automatically (build step 6).</p>
    </div>
  </div>
</template>
