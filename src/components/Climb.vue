<script setup>
// "The climb": player rating history drawn as an elevation profile, with a summit flag and a drag-to-read scrubber.
import { ref, computed } from 'vue'
import { MON } from '../lib/format.js'

const props = defineProps({ ratings: { type: Array, required: true } }) // [{effective_date, rating}], oldest first

const W = 600, H = 200, TOP = 22, BOT = 6
const vals = computed(() => props.ratings.map((r) => r.rating))
const labels = computed(() => props.ratings.map((r) => `${MON[+r.effective_date.slice(5, 7) - 1]} ’${r.effective_date.slice(2, 4)}`))
const lo = computed(() => Math.floor((Math.min(...vals.value) - 8) / 10) * 10)
const hi = computed(() => Math.ceil((Math.max(...vals.value) + 6) / 10) * 10)
const y = (v) => TOP + (1 - (v - lo.value) / (hi.value - lo.value)) * (H - TOP - BOT)
const pts = computed(() => vals.value.map((v, i) => [(i / Math.max(1, vals.value.length - 1)) * W, y(v)]))

function smooth(p) {
  let d = `M${p[0][0]} ${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}
const line = computed(() => smooth(pts.value))
const grid = computed(() => { const g = []; for (let v = lo.value + 10; v < hi.value; v += 10) g.push(v); return g })
const peak = computed(() => vals.value.indexOf(Math.max(...vals.value)))
const gain = computed(() => vals.value[vals.value.length - 1] - vals.value[0])
const xLabels = computed(() => labels.value.filter((_, i, a) => a.length <= 6 || i % Math.ceil(a.length / 5) === 0 || i === a.length - 1))

// ── scrubber ──
const plot = ref(null)
const at = ref(-1)
const touch = ref(false)
const release = () => setTimeout(() => { touch.value = false }, 1400)
function move(x) {
  const r = plot.value.getBoundingClientRect()
  if (!r.width) return
  at.value = Math.round(Math.min(1, Math.max(0, (x - r.left) / r.width)) * (pts.value.length - 1))
}
const scrub = computed(() => {
  const i = at.value < 0 ? pts.value.length - 1 : at.value
  const fx = pts.value[i][0] / W
  return { left: fx * 100 + '%', top: (pts.value[i][1] / H) * 100 + '%', text: `${labels.value[i]} · ${vals.value[i]}`, shift: fx > 0.85 ? '-90%' : fx < 0.15 ? '-10%' : '-50%' }
})
</script>

<template>
  <div class="card climb in">
    <div class="top">
      <div class="now">
        <span class="mono">PDGA rating · now</span>
        <span class="num">{{ vals[vals.length - 1] }}</span>
        <span v-if="vals.length > 1" class="delta">{{ gain >= 0 ? '▲' : '▼' }} {{ Math.abs(gain) }} pts since {{ labels[0] }}</span>
      </div>
      <div class="legend-r"><span class="mono">Elevation profile</span><br /><span class="mono" style="color: var(--faint)">Drag to read</span></div>
    </div>

    <template v-if="vals.length > 1">
      <div ref="plot" class="plot" :class="{ touch }" style="height: var(--ph, 170px)"
        @pointermove="move($event.clientX)" @pointerdown="touch = true; move($event.clientX)" @pointerup="release">
        <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" style="height: 100%">
          <defs><pattern id="climb-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--pi)" stroke-width="1.2" stroke-opacity=".38" /></pattern></defs>
          <g class="grid"><line v-for="g in grid" :key="g" x1="0" :x2="W" :y1="y(g)" :y2="y(g)" /></g>
          <path :d="`${line}L${W} ${H}L0 ${H}Z`" fill="url(#climb-hatch)" />
          <path class="ridge" :d="line" transform="translate(0 14)" stroke-width="1.2" stroke-opacity=".45" />
          <path class="ridge" :d="line" transform="translate(0 28)" stroke-width="1" stroke-opacity=".25" />
          <path class="main" :d="line" />
        </svg>
        <span v-for="g in grid" :key="'l' + g" class="ylab" :style="{ top: (y(g) / H) * 100 + '%' }">{{ g }}</span>
        <span class="lbl" :class="{ r: pts[peak][0] / W > 0.8 }" :style="{ left: (pts[peak][0] / W) * 100 + '%', top: (pts[peak][1] / H) * 100 + '%' }">
          <svg width="18" height="26" viewBox="0 0 18 26" style="display: block; margin: 0 0 -2px 8px; overflow: visible"><line x1="1" y1="26" x2="1" y2="1" stroke="var(--ink)" stroke-width="1.4" /><path d="M1 1 15 5.5 1 10Z" fill="var(--disc)" /></svg>Summit · <b>{{ vals[peak] }}</b>
        </span>
        <span class="scrub" :style="{ left: scrub.left }"><i :style="{ top: scrub.top }"></i><span :style="{ transform: `translateX(${scrub.shift})` }">{{ scrub.text }}</span></span>
      </div>
      <div class="mono" style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 9.5px; color: var(--faint)"><span v-for="l in xLabels" :key="l">{{ l }}</span></div>
    </template>
    <p v-else class="meta" style="margin-top: 14px">
      The chart starts once there are two ratings. Add each update, or paste your past ratings, in
      <RouterLink to="/settings" style="text-decoration: underline">Settings</RouterLink>.
    </p>
  </div>
</template>
