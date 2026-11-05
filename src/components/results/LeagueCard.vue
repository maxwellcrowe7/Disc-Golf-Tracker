<script setup>
// One league: headline numbers, a season-by-season breakdown (career view), and its rounds.
import { ref, computed } from 'vue'
import Icon from '../Icon.vue'
import Plate from '../Plate.vue'
import ScoreMark from '../ScoreMark.vue'
import { state, courseById } from '../../data/store.js'
import { fmtDow, ord, money } from '../../lib/format.js'
import { percentile } from '../../lib/prefill.js'
import { openSheet } from '../../lib/sheet.js'
import RoundSheet from '../sheets/RoundSheet.vue'
import LeagueSheet from '../sheets/LeagueSheet.vue'

const props = defineProps({ league: { type: Object, required: true }, season: { type: String, default: '' } })
const l = computed(() => props.league)
const home = computed(() => courseById(l.value.home_course_id))
const all = computed(() => state.rounds.filter((r) => r.league_id === l.value.id).sort((a, b) => b.played_on.localeCompare(a.played_on)))
const rounds = computed(() => all.value.filter((r) => !props.season || r.played_on.startsWith(props.season)))

function sumUp(rs) {
  const fees = rs.reduce((a, r) => a + (r.fee || 0), 0), cash = rs.reduce((a, r) => a + (r.payout || 0), 0)
  const placed = rs.filter((r) => r.place && r.field_size)
  return {
    n: rs.length, wins: rs.filter((r) => r.place === 1).length, podiums: rs.filter((r) => r.place && r.place <= 3).length,
    fees, cash, net: cash - fees,
    topPct: placed.length ? Math.round(placed.reduce((a, r) => a + percentile(r.place, r.field_size), 0) / placed.length) : null,
  }
}
const t = computed(() => sumUp(rounds.value))
const seasons = computed(() => (props.season ? [] : [...new Set(all.value.map((r) => r.played_on.slice(0, 4)))].sort().reverse().map((y) => ({ y, ...sumUp(all.value.filter((r) => r.played_on.startsWith(y))) }))))
const showAll = ref(false)
const shown = computed(() => (showAll.value ? rounds.value : rounds.value.slice(0, 8)))
const signed = (v) => (v >= 0 ? '+' : '−') + money(Math.abs(v))
</script>

<template>
  <section class="sec">
    <div class="card list">
      <div class="lrow" style="padding: 16px">
        <Plate v-if="home" :course="home" lite class="thumb" />
        <span v-else class="league-chip" :style="{ background: l.color || 'var(--moss)', height: '54px', width: '8px' }"></span>
        <div class="body">
          <div class="name" style="font-family: var(--display); font-size: 22px; font-weight: 520; letter-spacing: -0.02em">{{ l.name }}</div>
          <div class="meta"><span :style="{ width: '8px', height: '8px', borderRadius: '2px', background: l.color || 'var(--moss)' }"></span>{{ home?.name || 'No home course' }}<template v-if="l.day_time"><span class="dot"></span>{{ l.day_time }}</template><template v-if="!l.active"><span class="dot"></span>inactive</template></div>
        </div>
        <button class="btn sm primary" @click="openSheet(RoundSheet, { leagueId: l.id })"><Icon name="plus" size="xs" />Round</button>
        <button class="icon-btn" style="width: 34px; height: 34px; box-shadow: none" aria-label="Edit league" @click="openSheet(LeagueSheet, { id: l.id })"><Icon name="edit" size="xs" /></button>
      </div>
      <div class="tally league-tally">
        <div><span class="mono">Rounds</span><span class="num">{{ t.n }}</span></div>
        <div><span class="mono">Wins</span><span class="num">{{ t.wins }}</span><span class="meta">{{ t.podiums }} podiums</span></div>
        <div><span class="mono">Avg finish</span><span class="num">{{ t.topPct ? 'Top ' + t.topPct + '%' : '—' }}</span></div>
        <div><span class="mono">Net</span><span class="num" :style="{ color: t.net >= 0 ? 'var(--good)' : 'var(--ink-2)' }">{{ signed(t.net) }}</span><span class="meta">{{ money(t.cash) }} in · {{ money(t.fees) }} fees</span></div>
      </div>
      <div v-if="seasons.length > 1" class="season-table">
        <div class="st-row st-head mono"><span>Season</span><span>Rds</span><span>Wins</span><span>Podiums</span><span>Fees</span><span>Cash</span><span>Net</span></div>
        <div v-for="s in seasons" :key="s.y" class="st-row"><b>{{ s.y }}</b><span>{{ s.n }}</span><span>{{ s.wins }}</span><span>{{ s.podiums }}</span><span>{{ money(s.fees) }}</span><span>{{ money(s.cash) }}</span><span :style="{ color: s.net >= 0 ? 'var(--good)' : 'var(--ink-2)' }">{{ signed(s.net) }}</span></div>
      </div>
      <button v-for="r in shown" :key="r.id" class="lrow" @click="openSheet(RoundSheet, { id: r.id })">
        <div class="body"><div class="name" style="font-size: 14.5px">{{ fmtDow(r.played_on) }}<span class="muted" style="font-weight: 500"> · {{ r.played_on.slice(0, 4) }}</span></div><div class="meta"><template v-if="r.place">{{ ord(r.place) }}<template v-if="r.field_size"> of {{ r.field_size }}</template></template><template v-if="r.payout"><span class="dot"></span><span style="color: var(--good); font-weight: 650">+{{ money(r.payout) }}</span></template><template v-if="r.course_id && r.course_id !== l.home_course_id"><span class="dot"></span>{{ courseById(r.course_id)?.name }}</template></div></div>
        <div class="end"><ScoreMark v-if="r.score != null && r.par != null" :score="r.score" :par="r.par" /><small>{{ r.score }} thr</small></div>
      </button>
      <button v-if="rounds.length > 8" class="btn block" style="margin: 8px 16px 16px; width: calc(100% - 32px)" @click="showAll = !showAll">{{ showAll ? 'Show fewer' : `Show all ${rounds.length} rounds` }}</button>
      <p v-if="!rounds.length" class="muted" style="padding: 0 16px 16px">No rounds {{ season ? 'in ' + season : 'yet' }}.</p>
    </div>
  </section>
</template>
