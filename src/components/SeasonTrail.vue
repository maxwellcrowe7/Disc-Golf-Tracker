<script setup>
// The season as a winding trail from "You are here" through the next twelve months.
// Events are stations; registration openings are diamonds; labels sit on rows that never collide.
import { computed } from 'vue'
import { parseDate, isoDate, fmtDate, fmtRange, MON, STATUS } from '../lib/format.js'

const props = defineProps({ events: { type: Array, required: true }, today: { type: String, required: true } })

const W = 1000, H = 340, X0 = 46, X1 = 960, ROWS = [30, 250, 74, 294], MID = 162
const start = computed(() => parseDate(props.today))
const span = 365
const xOf = (iso) => X0 + Math.min(1, Math.max(0, (parseDate(iso) - start.value) / 864e5 / span)) * (X1 - X0)
const yOf = (x) => MID + 36 * Math.sin(x / 135 + 0.8) + 11 * Math.sin(x / 57)
const P = (x, y) => ({ left: (x / W) * 100 + '%', top: (y / H) * 100 + '%' })

function smooth(p) {
  let d = `M${p[0][0]} ${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}
const path = (() => { const s = []; for (let x = X0; x <= X1; x += 8) s.push([x, yOf(x)]); s.push([X1, yOf(X1)]); return smooth(s) })()

const end = computed(() => { const d = new Date(start.value); d.setDate(d.getDate() + span); return isoDate(d) })
const inRange = computed(() => props.events.filter((e) => e.start_date >= props.today && e.start_date <= end.value))

const months = computed(() => {
  const out = []
  const d = new Date(start.value.getFullYear(), start.value.getMonth() + 1, 1)
  for (let i = 0; i < 12; i++, d.setMonth(d.getMonth() + 1)) out.push({ x: xOf(isoDate(d)), label: MON[d.getMonth()] + (d.getMonth() === 0 ? ` ’${String(d.getFullYear()).slice(2)}` : '') })
  return out
})

// Each callout takes the first row where it fits (widths estimated in viewBox units).
const stops = computed(() => {
  const ends = ROWS.map(() => -1e9)
  return inRange.value.map((e, i) => {
    const x = xOf(e.start_date), w = Math.max(e.name.length * 7, 150) + 20
    const edge = x > 880 ? 'r' : x < 120 ? 'l' : ''
    const left = edge === 'r' ? x - w + 14 : edge === 'l' ? x - 14 : x - w / 2
    let r = ROWS.findIndex((_, k) => left > ends[k] + 10)
    if (r < 0) r = 0
    ends[r] = left + w
    return { e, i, x, y: yOf(x), row: ROWS[r], up: ROWS[r] < MID, edge }
  })
})
const monYr = (iso) => `${MON[+iso.slice(5, 7) - 1]} ’${iso.slice(2, 4)}`
const regs = computed(() => inRange.value.filter((e) => ['interested', 'planning'].includes(e.status) && e.reg_opens_on && e.reg_opens_on >= props.today && e.reg_opens_on <= end.value))
</script>

<template>
  <div class="card trail-card in">
    <div class="th">
      <span class="mono">{{ monYr(today) }} → {{ monYr(end) }} · {{ inRange.length }} {{ inRange.length === 1 ? 'stop' : 'stops' }}</span>
      <span class="mono mobile-only">Swipe the trail →</span>
    </div>
    <div class="trail-scroll">
      <div class="trail-map">
        <svg :viewBox="`0 0 ${W} ${H}`">
          <path class="path-base" :d="path" />
          <line v-for="s in stops" :key="'l' + s.e.id" class="leader" :x1="s.x" :x2="s.x" :y1="s.up ? s.y - 12 : s.y + 12" :y2="s.up ? s.row + 16 : s.row - 16" />
        </svg>
        <template v-for="m in months" :key="m.label">
          <span class="mtick" :style="{ left: (m.x / W) * 100 + '%' }"></span>
          <span class="mt" :style="{ left: (m.x / W) * 100 + '%' }">{{ m.label }}</span>
        </template>
        <span v-for="e in regs" :key="'r' + e.id" class="reg-d" :title="`Registration opens ${fmtDate(e.reg_opens_on)} — ${e.name}`" :style="P(xOf(e.reg_opens_on), yOf(xOf(e.reg_opens_on)))"></span>
        <span class="you" :style="P(X0, yOf(X0))"><i></i><span>You are here</span></span>
        <RouterLink v-for="s in stops" :key="s.e.id" class="stn" :class="s.e.status" :to="`/event/${s.e.id}`" :style="{ ...P(s.x, s.y), '--c': `var(--st-${s.e.status})` }"><span class="dot"></span></RouterLink>
        <RouterLink v-for="s in stops" :key="'t' + s.e.id" class="stag" :class="s.edge" :to="`/event/${s.e.id}`" :style="P(s.x, s.row)">
          <b>{{ s.e.name }}</b><small>{{ fmtRange(s.e.start_date, s.e.end_date) }} · {{ STATUS[s.e.status] }}</small>
        </RouterLink>
      </div>
    </div>
    <div class="legend">
      <span v-for="s in ['registered', 'planning', 'interested', 'waitlisted']" :key="s" :style="{ '--c': `var(--st-${s})` }"><i></i>{{ STATUS[s] }}</span>
      <span><i style="background: none; border-radius: 2px; transform: rotate(45deg) scale(0.8); box-shadow: inset 0 0 0 2px var(--st-planning)"></i>Registration opens</span>
    </div>
  </div>
</template>
