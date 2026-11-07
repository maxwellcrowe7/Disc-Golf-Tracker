<script setup>
import { ref, computed, watch } from 'vue'
import Icon from '../components/Icon.vue'
import Plate from '../components/Plate.vue'
import RegTicket from '../components/event/RegTicket.vue'
import StatusStations from '../components/event/StatusStations.vue'
import TravelCard from '../components/event/TravelCard.vue'
import TripReceipt from '../components/event/TripReceipt.vue'
import EventScorecard from '../components/event/EventScorecard.vue'
import MatchList from '../components/event/MatchList.vue'
import { state, eventById, courseById, plateNumber } from '../data/store.js'
import { fmtRange, coords, ord, money, FORMAT, splitLast } from '../lib/format.js'
import { isUpcoming } from '../lib/season.js'
import { avgRating } from '../lib/stats.js'
import { matchRecord, holeTally } from '../lib/matchplay.js'
import { openSheet } from '../lib/sheet.js'
import EventSheet from '../components/sheets/EventSheet.vue'

const props = defineProps({ id: { type: String, required: true } })
const e = computed(() => eventById(props.id))
const up = computed(() => e.value && isUpcoming(e.value, state.today))
const plateCourse = computed(() => (e.value?.courses[0] && courseById(e.value.courses[0].course_id)) || { id: 'ev-' + props.id, name: e.value?.name || '', terrain: 'mixed' })
const title = computed(() => splitLast(e.value?.name || ''))
const year = computed(() => (e.value && e.value.start_date.slice(0, 4) !== state.today.slice(0, 4) ? ', ' + e.value.start_date.slice(0, 4) : ''))
const courses = computed(() => (e.value?.courses || []).map((x) => ({ ...x, c: courseById(x.course_id) })).filter((x) => x.c))
const isMatch = computed(() => e.value?.format === 'match_play')
const hhmm = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m} min`)

// Result strip numbers.
const rounds = computed(() => state.rounds.filter((r) => r.event_id === props.id))
const matches = computed(() => state.matches.filter((m) => m.event_id === props.id))
const avg = computed(() => avgRating(rounds.value.filter((r) => !r.is_team)))
const rec = computed(() => matchRecord(matches.value))
const holesWon = computed(() => matches.value.reduce((a, m) => a + (m.holes ? holeTally(m.holes).W : 0), 0))
const suffix = (n) => ord(n).slice(String(n).length)

// The stamp lands once when the status changes on this page.
const slam = ref(false)
watch(() => e.value?.status, (s, old) => { if (old && s !== old) slam.value = true })
</script>

<template>
  <template v-if="e">
    <div class="banner">
      <Plate :course="plateCourse" :dot="0.4" marks no-scale />
      <div class="floating">
        <a class="icon-btn" aria-label="Back" @click="$router.back()"><Icon name="chevL" /></a>
        <button class="icon-btn" aria-label="Edit event" @click="openSheet(EventSheet, { id: e.id })"><Icon name="edit" size="sm" /></button>
      </div>
      <div class="legend-box">
        <div class="lh">
          <span class="mono">{{ e.courses[0] ? plateNumber(plateCourse.id) + ' · ' + plateCourse.name : FORMAT[e.format] }}</span>
          <span class="mono">{{ e.lat != null ? coords(e.lat, e.lng) : e.city || '' }}</span>
        </div>
        <h2 data-sentinel>{{ title.head }} <em>{{ title.last }}</em></h2>
        <div class="lf">
          <span class="meta" style="color: var(--ink); font-weight: var(--w-strong)">{{ fmtRange(e.start_date, e.end_date) }}{{ year }}<template v-if="e.city"> · {{ e.city }}</template></span>
          <span class="chips"><span class="chip">{{ e.pdga ? 'PDGA ' + (e.tier || '') : 'Non-PDGA' }}</span><span class="chip">{{ FORMAT[e.format] }}<template v-if="e.division"> · {{ e.division }}</template></span></span>
        </div>
      </div>
    </div>

    <div class="detail-grid">
      <div class="col">
        <template v-if="up">
          <RegTicket :event="e" :today="state.today" :slam="slam" />
          <StatusStations :event="e" :today="state.today" />
        </template>
        <template v-else>
          <div v-if="e.status === 'played'" class="nudge-card">
            <span class="ic-tile"><Icon name="note" size="sm" /></span>
            <div><b>Almost recorded</b><span>Log the remaining {{ isMatch ? 'matches' : 'rounds' }} and notes to finish it.</span></div>
          </div>
          <div class="card result-strip">
            <div><span class="mono">{{ isMatch ? 'Team finish' : 'Finish' }}</span><span class="num">{{ e.place || '—' }}<sup v-if="e.place">{{ suffix(e.place) }}</sup></span><span class="meta">{{ e.field_size ? `of ${e.field_size} ${e.field_unit}` : 'Add from Edit' }}</span></div>
            <div v-if="isMatch"><span class="mono">Your record</span><span class="num">{{ rec.w }}–{{ rec.l }}–{{ rec.p }}</span><span class="meta">W–L–P{{ holesWon ? ` · ${holesWon} holes won` : '' }}</span></div>
            <div v-else><span class="mono">Avg rating</span><span class="num">{{ avg || '—' }}</span><span class="meta">{{ avg ? `${rounds.filter((r) => r.rating && !r.is_team).length} rated rounds` : e.format !== 'singles' ? 'Team rounds aren’t rated' : 'No ratings yet' }}</span></div>
            <div><span class="mono">Payout</span><span class="num" :style="e.payout ? { color: 'var(--good)' } : {}">{{ e.payout ? money(e.payout) : '$0' }}</span><span class="meta">{{ e.payout ? 'cashed' : 'no cash' }}</span></div>
          </div>
          <MatchList v-if="isMatch" :event="e" />
          <EventScorecard v-else :event="e" :slam="slam" />
          <div class="card">
            <div class="ph"><h3>Field notes</h3></div>
            <div class="pb">
              <p v-if="e.notes" class="notes-q">“{{ e.notes }}”</p>
              <button v-else class="btn block" @click="openSheet(EventSheet, { id: e.id })"><Icon name="note" size="sm" />Add notes</button>
            </div>
          </div>
        </template>

        <div v-if="up" class="card">
          <div class="ph"><h3>{{ courses.length > 1 ? courses.length + ' courses' : 'Course' }}</h3><span class="mono">Tap for the plate</span></div>
          <div class="pb" style="padding-top: 8px">
            <RouterLink v-for="x in courses" :key="x.course_id" class="course-card" :to="`/course/${x.course_id}`">
              <Plate :course="x.c" lite class="thumb" />
              <div style="flex: 1; min-width: 0"><span class="mono" style="font-size: var(--t-label)">{{ plateNumber(x.course_id) }}</span><b style="display: block; font-size: var(--t-body); font-weight: var(--w-strong)">{{ x.c.name }}</b><div class="meta">{{ x.c.holes }} holes<template v-if="x.c.city"><span class="dot"></span>{{ x.c.city }}</template></div></div>
              <span v-if="x.drive_minutes != null" class="meta" style="color: var(--ink); font-weight: var(--w-strong)"><Icon name="car" size="xs" />{{ hhmm(x.drive_minutes) }}</span>
              <Icon v-else name="chevR" size="sm" />
            </RouterLink>
            <p v-if="!courses.length" class="meta">No courses yet — add them from Edit.</p>
          </div>
        </div>

        <div v-if="up && (e.partners.length || e.team_name)" class="card">
          <div class="ph"><h3>{{ isMatch ? 'Team' : e.partners.length > 1 ? 'Teammates' : 'Partner' }}</h3></div>
          <div class="pb">
            <div v-for="n in (isMatch ? [e.team_name] : e.partners)" :key="n" class="kv">
              <span class="ic-tile" style="font-weight: var(--w-strong); font-size: var(--t-small); --c: var(--plum)">{{ n.split(' ').map((w) => w[0]).join('').slice(0, 2) }}</span>
              <div><div class="v">{{ n }}</div><div class="k">{{ isMatch ? `${e.holes_per_match || 12}-hole matches · holes won decide it` : 'Best shot · one team score' }}</div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col">
        <template v-if="up">
          <TravelCard :event="e" />
          <TripReceipt :event="e" :today="state.today" />
        </template>
        <template v-else>
          <StatusStations :event="e" :today="state.today" />
          <div v-if="e.partners.length || e.team_name" class="card">
            <div class="ph"><h3>{{ isMatch ? 'Team' : e.partners.length > 1 ? 'Teammates' : 'Partner' }}</h3></div>
            <div class="pb"><div v-for="n in (isMatch ? [e.team_name] : e.partners)" :key="n" class="kv"><span class="ic-tile" style="font-weight: var(--w-strong); font-size: var(--t-small); --c: var(--plum)">{{ n.split(' ').map((w) => w[0]).join('').slice(0, 2) }}</span><div class="v">{{ n }}</div></div></div>
          </div>
          <div class="card">
            <div class="ph"><h3>{{ courses.length > 1 ? courses.length + ' courses' : 'Course' }}</h3></div>
            <div class="pb" style="padding-top: 8px">
              <RouterLink v-for="x in courses" :key="x.course_id" class="course-card" :to="`/course/${x.course_id}`">
                <Plate :course="x.c" lite class="thumb" />
                <div style="flex: 1; min-width: 0"><b style="display: block; font-size: var(--t-body); font-weight: var(--w-strong)">{{ x.c.name }}</b><div class="meta">{{ x.c.holes }} holes<template v-if="x.c.city"><span class="dot"></span>{{ x.c.city }}</template></div></div>
                <Icon name="chevR" size="sm" />
              </RouterLink>
              <p v-if="!courses.length" class="meta">No courses linked.</p>
            </div>
          </div>
          <TripReceipt :event="e" :today="state.today" />
        </template>
      </div>
    </div>
  </template>
  <p v-else class="page-stub"><b>Event not found</b><RouterLink to="/schedule">Back to the schedule</RouterLink></p>
</template>
