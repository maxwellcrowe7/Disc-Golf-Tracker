<script setup>
import { computed } from 'vue'
import Plate from '../components/Plate.vue'
import Icon from '../components/Icon.vue'
import ScoreMark from '../components/ScoreMark.vue'
import StatusChip from '../components/StatusChip.vue'
import { state, courseById, eventById, leagueById, plateNumber } from '../data/store.js'
import { fmtDateY, coords, ord, splitLast } from '../lib/format.js'
import { roundsAtCourse, avgToPar, avgRating, bestToPar } from '../lib/stats.js'

const props = defineProps({ id: { type: String, required: true } })
const c = computed(() => courseById(props.id))
const title = computed(() => splitLast(c.value?.name || ''))
const rounds = computed(() => (c.value ? roundsAtCourse(c.value.id) : []))
const singles = computed(() => rounds.value.filter((r) => !r.is_team))
const events = computed(() => state.events.filter((e) => e.courses.some((x) => x.course_id === props.id)))

const label = (r) => (r.event_id ? eventById(r.event_id)?.name : leagueById(r.league_id)?.name) || 'Casual round'
const sub = (r) => (r.kind === 'tournament' ? `Round ${r.round_number}${r.is_team ? ' · team' : ''}` : r.place ? `${ord(r.place)} of ${r.field_size}` : '')
const link = (r) => (r.event_id ? `/event/${r.event_id}` : '/results/leagues')
</script>

<template>
  <template v-if="c">
    <div class="banner">
      <Plate :course="c" :dot="0.4" marks no-scale />
      <div class="floating">
        <a class="icon-btn" aria-label="Back" @click="$router.back()"><Icon name="chevL" /></a>
      </div>
      <div class="legend-box">
        <div class="lh"><span class="mono">{{ plateNumber(c.id) }} · {{ c.terrain }}</span><span class="mono">{{ coords(c.lat, c.lng) }}</span></div>
        <h2 data-sentinel>{{ title.head }} <em>{{ title.last }}</em></h2>
        <div class="lf">
          <span class="meta" style="color: var(--ink-2); font-weight: 600">{{ c.city }}{{ c.state ? ', ' + c.state : '' }}<template v-if="c.length_ft"> · {{ c.length_ft.toLocaleString() }} ft</template></span>
          <span class="chips"><span class="chip">{{ c.holes }} holes</span></span>
        </div>
      </div>
    </div>

    <div class="notes-grid">
      <div><span class="mono">Rounds</span><span class="num">{{ rounds.length }}</span></div>
      <div><span class="mono">Avg to par</span><span class="num"><ScoreMark v-if="avgToPar(singles) !== null" :diff="+avgToPar(singles).toFixed(1)" /><template v-else>—</template></span></div>
      <div><span class="mono">Personal best</span><span class="num"><ScoreMark v-if="bestToPar(singles) !== null" :diff="bestToPar(singles)" /><template v-else>—</template></span></div>
      <div><span class="mono">Avg rating</span><span class="num">{{ avgRating(rounds) || '—' }}</span></div>
    </div>

    <div class="detail-grid">
      <div class="col">
        <div class="card list">
          <div class="ph" style="padding-bottom: 10px"><h3>Round history</h3></div>
          <RouterLink v-for="r in rounds" :key="r.id" class="lrow" :to="link(r)">
            <div class="body"><div class="name" style="font-size: 14.5px">{{ label(r) }}</div><div class="meta">{{ fmtDateY(r.played_on) }} · {{ sub(r) }}</div></div>
            <span class="mono">{{ r.rating || '' }}</span>
            <div class="end"><ScoreMark :score="r.score" :par="r.par" /><small>{{ r.score }} thr · par {{ r.par }}</small></div>
          </RouterLink>
          <p v-if="!rounds.length" class="muted" style="padding: 16px">No rounds here yet.</p>
        </div>
      </div>
      <div class="col">
        <div class="card">
          <div class="ph"><h3>Events here</h3></div>
          <div class="pb" style="padding-top: 6px">
            <RouterLink v-for="e in events" :key="e.id" class="lrow" style="padding: 11px 0" :to="`/event/${e.id}`">
              <div class="body"><div class="name" style="font-size: 14.5px">{{ e.name }}</div><div class="meta">{{ fmtDateY(e.start_date) }}</div></div>
              <StatusChip :event="e" />
            </RouterLink>
            <p v-if="!events.length" class="muted">None yet.</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  <p v-else class="page-stub"><b>Course not found</b><RouterLink to="/courses">Back to the atlas</RouterLink></p>
</template>
