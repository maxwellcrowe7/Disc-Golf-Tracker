<script setup>
// Results → Stats: every block from the old Stats tab, for the selected season or the whole career.
import { computed } from 'vue'
import { state, eventById, courseById } from '../../data/store.js'
import { statsFor } from '../../lib/stats.js'
import { money, fmtDateY, ord } from '../../lib/format.js'

const props = defineProps({ season: { type: String, default: '' } })
const s = computed(() => statsFor(state, props.season || undefined))
const signed = (v) => (v >= 0 ? '+' : '−') + money(Math.abs(v))
const roundLabel = (r) => `${eventById(r.event_id)?.name || '—'} · R${r.round_number || '?'}`
</script>

<template>
  <div class="stats-grid">
    <div class="card stat-block wide">
      <div class="ph"><h3>Tournaments</h3><span class="mono">{{ season || 'Career' }}</span></div>
      <div class="tally">
        <div><span class="mono">Events</span><span class="num">{{ s.tournament.events }}</span><span class="meta">{{ s.tournament.rounds }} rounds</span></div>
        <div><span class="mono">Avg rating</span><span class="num">{{ s.tournament.avgRating || '—' }}</span><span class="meta">Best {{ s.tournament.bestRating || '—' }}</span></div>
        <div><span class="mono">Wins</span><span class="num">{{ s.tournament.wins }}</span><span class="meta">{{ s.tournament.podiums }} podiums</span></div>
        <div><span class="mono">Avg finish</span><span class="num">{{ s.tournament.avgFinishPct != null ? 'Top ' + s.tournament.avgFinishPct + '%' : '—' }}</span><span v-if="s.tournament.bestFinish" class="meta">Best: {{ ord(s.tournament.bestFinish.place) }} of {{ s.tournament.bestFinish.field_size }}</span></div>
      </div>
      <p v-if="s.tournament.matchRecord.w + s.tournament.matchRecord.l + s.tournament.matchRecord.p" class="meta" style="padding: 0 18px 16px">Match play record: {{ s.tournament.matchRecord.w }}–{{ s.tournament.matchRecord.l }}–{{ s.tournament.matchRecord.p }} (W–L–P)</p>
    </div>

    <div class="card stat-block wide">
      <div class="ph"><h3>Leagues</h3></div>
      <div class="tally">
        <div><span class="mono">Rounds</span><span class="num">{{ s.leagues.rounds }}</span></div>
        <div><span class="mono">Wins</span><span class="num">{{ s.leagues.wins }}</span><span class="meta">{{ s.leagues.podiums }} podiums</span></div>
        <div><span class="mono">Net</span><span class="num" :style="{ color: s.leagues.net >= 0 ? 'var(--good)' : 'var(--ink-2)' }">{{ signed(s.leagues.net) }}</span></div>
        <div><span class="mono">Cash in / out</span><span class="num" style="font-size: 22px">{{ money(s.leagues.cash) }}</span><span class="meta">Fees {{ money(s.leagues.fees) }}</span></div>
      </div>
    </div>

    <div class="card stat-block">
      <div class="ph"><h3>Money</h3></div>
      <div class="pb receipt-lines">
        <div class="ln2"><span>Entry fees</span><span class="lead"></span><span>{{ money(s.money.entry) }}</span></div>
        <div v-if="s.money.caddy" class="ln2"><span>Caddies</span><span class="lead"></span><span>{{ money(s.money.caddy) }}</span></div>
        <div v-if="s.money.lodging" class="ln2"><span>Stays</span><span class="lead"></span><span>{{ money(s.money.lodging) }}</span></div>
        <div v-if="s.money.gas" class="ln2"><span>Gas (est.)</span><span class="lead"></span><span>{{ money(s.money.gas) }}</span></div>
        <div class="ln2"><span>League fees</span><span class="lead"></span><span>{{ money(s.money.leagueFees) }}</span></div>
        <div class="ln2 pay"><span>Tournament winnings</span><span class="lead"></span><span>+{{ money(s.money.tournamentEarnings) }}</span></div>
        <div class="ln2 pay"><span>League cash</span><span class="lead"></span><span>+{{ money(s.money.leagueCash) }}</span></div>
        <div class="totl"><span class="mono">Overall net</span><span class="num" :style="{ color: s.money.net >= 0 ? 'var(--good)' : 'var(--ink)' }">{{ signed(s.money.net) }}</span></div>
      </div>
    </div>

    <div class="card stat-block">
      <div class="ph"><h3>By tier</h3></div>
      <div class="pb">
        <div class="mini-table"><span class="mono">Tier</span><span class="mono">Events</span><span class="mono">Top 10</span><span class="mono">Avg place</span>
          <template v-for="t in s.tiers" :key="t.tier"><b>{{ t.tier }}</b><span>{{ t.events }}</span><span>{{ t.top10 }}</span><span>{{ t.avgPlace != null ? t.avgPlace.toFixed(1) : '—' }}</span></template>
        </div>
        <p v-if="!s.tiers.length" class="muted">No events.</p>
      </div>
    </div>

    <div class="card stat-block">
      <div class="ph"><h3>Rating by year</h3><span class="mono">Round ratings</span></div>
      <div class="pb">
        <div class="mini-table"><span class="mono">Year</span><span class="mono">Rounds</span><span class="mono">Avg</span><span class="mono">Best</span>
          <template v-for="y in s.byYear" :key="y.year"><b>{{ y.year }}</b><span>{{ y.rounds }}</span><span>{{ y.avg }}</span><span>{{ y.best }}</span></template>
        </div>
        <p v-if="!s.byYear.length" class="muted">No rated rounds.</p>
      </div>
    </div>

    <div class="card stat-block">
      <div class="ph"><h3>Best &amp; worst rounds</h3></div>
      <div class="pb">
        <div v-for="r in s.best" :key="r.id" class="kv"><div><div class="v">{{ roundLabel(r) }}</div><div class="k">{{ courseById(r.course_id)?.name }} · {{ fmtDateY(r.played_on) }}</div></div><span class="end num" style="font-size: 22px; color: var(--good)">{{ r.rating }}</span></div>
        <template v-if="s.worst.length">
          <div class="mono" style="margin: 14px 0 4px">Lowest</div>
          <div v-for="r in s.worst" :key="'w' + r.id" class="kv"><div><div class="v">{{ roundLabel(r) }}</div><div class="k">{{ courseById(r.course_id)?.name }} · {{ fmtDateY(r.played_on) }}</div></div><span class="end num" style="font-size: 22px; color: var(--ink-2)">{{ r.rating }}</span></div>
        </template>
        <p v-if="!s.best.length" class="muted">No rated rounds.</p>
        <RouterLink to="/results/rounds" class="meta" style="display: block; margin-top: 10px; text-decoration: underline">All rounds, sortable →</RouterLink>
      </div>
    </div>

    <div class="card stat-block wide">
      <div class="ph"><h3>Courses</h3><span class="mono">Tournament round ratings</span></div>
      <div class="pb">
        <div class="mini-table five"><span class="mono">Course</span><span class="mono">Rounds</span><span class="mono">Avg</span><span class="mono">Best</span><span class="mono">Worst</span>
          <template v-for="c in s.courses" :key="c.course.id"><RouterLink :to="`/course/${c.course.id}`"><b>{{ c.course.name }}</b></RouterLink><span>{{ c.rounds }}</span><span>{{ c.avg }}</span><span style="color: var(--good)">{{ c.best }}</span><span>{{ c.worst }}</span></template>
        </div>
        <p v-if="!s.courses.length" class="muted">No rated rounds.</p>
      </div>
    </div>

    <div class="card stat-block wide">
      <div class="ph"><h3>Divisions</h3></div>
      <div class="pb division-row">
        <div v-for="d in s.divisions" :key="d.division" class="division">
          <b class="num">{{ d.division }}</b>
          <span>{{ d.events }} event{{ d.events === 1 ? '' : 's' }} · {{ d.wins }} win{{ d.wins === 1 ? '' : 's' }}</span>
          <span class="mono">{{ d.years.join(', ') }}</span>
        </div>
        <p v-if="!s.divisions.length" class="muted">No events.</p>
      </div>
    </div>
  </div>
</template>
