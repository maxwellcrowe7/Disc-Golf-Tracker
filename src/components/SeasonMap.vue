<script setup>
// Leaflet map of upcoming events: a pin per event (status colour, month label), dashed lines from home,
// optional drive-time labels. Events without coordinates are listed by the parent instead.
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MON, parseDate, fmtRange } from '../lib/format.js'
import { theme } from '../lib/theme.js'

const props = defineProps({
  events: { type: Array, required: true },
  home: { type: Object, default: null }, // {lat, lng, label}
  driveTimes: Boolean,
})
const el = ref(null)
const router = useRouter()
let map = null, layer = null
const markers = {}

// Placeholder basemap until the Mapbox style is connected (build step 6).
const tiles = () => L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${theme.value === 'dark' ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'}/MapServer/tile/{z}/{y}/{x}`, { attribution: 'Tiles © Esri', maxZoom: 16 })
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()
const hhmm = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m} min`)

function draw() {
  layer?.remove()
  layer = L.layerGroup().addTo(map)
  const pts = []
  if (props.home?.lat != null) {
    pts.push([props.home.lat, props.home.lng])
    L.marker([props.home.lat, props.home.lng], { icon: L.divIcon({ className: '', html: '<div class="pin-home"><svg class="i" viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg></div>', iconSize: [30, 30], iconAnchor: [15, 15] }), zIndexOffset: 1000 })
      .addTo(layer).bindTooltip(props.home.label || 'Home', { className: 'tip', direction: 'top', offset: [0, -16] })
  }
  for (const e of props.events) {
    if (e.lat == null) continue
    pts.push([e.lat, e.lng])
    if (props.home?.lat != null) {
      const line = L.polyline([[props.home.lat, props.home.lng], [e.lat, e.lng]], { color: css('--st-' + e.status), weight: 2.5, opacity: 0.85, dashArray: '2 7', lineCap: 'round', className: props.driveTimes ? 'ants' : '' }).addTo(layer)
      const mins = e.lodging?.drive_minutes ?? e.home_drive_minutes
      if (props.driveTimes && mins != null) line.bindTooltip(hhmm(mins), { permanent: true, className: 'drive', direction: 'center' })
    }
    markers[e.id] = L.marker([e.lat, e.lng], { icon: L.divIcon({ className: '', html: `<div class="pin" style="--c:var(--st-${e.status})"><span>${MON[parseDate(e.start_date).getMonth()].toUpperCase()}</span></div>`, iconSize: [34, 34], iconAnchor: [17, 40] }), riseOnHover: true })
      .addTo(layer).bindTooltip(`<b>${e.name}</b><br>${fmtRange(e.start_date, e.end_date)}`, { className: 'tip', direction: 'top', offset: [0, -44] })
      .on('click', () => router.push(`/event/${e.id}`))
  }
  if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 9 })
  else if (pts.length) map.setView(pts[0], 8)
  else map.setView([39.5, -95], 4) // nothing placed yet: the lower 48
}

onMounted(() => {
  map = L.map(el.value, { zoomControl: false, scrollWheelZoom: false })
  tiles().addTo(map)
  L.control.zoom({ position: 'topright' }).addTo(map)
  draw()
})
onBeforeUnmount(() => map?.remove())
watch(() => [props.events, props.driveTimes, props.home], draw, { deep: true })

// Fly to an event (from the list beside the map).
function focus(id) {
  const m = markers[id]
  if (!m) return
  map.flyTo(m.getLatLng(), 9, { duration: 0.8 })
  setTimeout(() => m.openTooltip(), 850)
}
defineExpose({ focus })
</script>

<template>
  <div ref="el" class="map"></div>
</template>
