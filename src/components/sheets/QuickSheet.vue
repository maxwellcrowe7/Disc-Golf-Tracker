<script setup>
// The + button: log a round (tournament, league, casual), or add an event, course or league.
import { ref, computed } from 'vue'
import SheetFrame from '../SheetFrame.vue'
import Icon from '../Icon.vue'
import Plate from '../Plate.vue'
import StatusChip from '../StatusChip.vue'
import RoundSheet from './RoundSheet.vue'
import MatchSheet from './MatchSheet.vue'
import EventSheet from './EventSheet.vue'
import CourseSheet from './CourseSheet.vue'
import LeagueSheet from './LeagueSheet.vue'
import { state, courseById } from '../../data/store.js'
import { openSheet } from '../../lib/sheet.js'
import { fmtDateY, FORMAT } from '../../lib/format.js'

const pick = ref('') // '' | 'event' | 'league'

// An event that's been played but is missing rounds goes to the top.
const pending = computed(() => state.events
  .filter((e) => e.status === 'played' && e.format !== 'match_play' && state.rounds.filter((r) => r.event_id === e.id).length < (e.rounds_planned || 1))
  .sort((a, b) => b.start_date.localeCompare(a.start_date))[0])
const pendingNext = computed(() => pending.value ? state.rounds.filter((r) => r.event_id === pending.value.id).length + 1 : 0)

// Events you'd log a round for: anything that has started, newest first.
const recentEvents = computed(() => state.events.filter((e) => e.start_date <= state.today && e.status !== 'withdrew').sort((a, b) => b.start_date.localeCompare(a.start_date)).slice(0, 12))
const leagues = computed(() => state.leagues.filter((l) => l.active))

const logEvent = (e) => openSheet(e.format === 'match_play' ? MatchSheet : RoundSheet, { eventId: e.id })
function logLeague() {
  if (leagues.value.length === 1) openSheet(RoundSheet, { leagueId: leagues.value[0].id })
  else pick.value = 'league'
}
const firstCourse = (e) => e.courses[0] && courseById(e.courses[0].course_id)
</script>

<template>
  <SheetFrame :title="pick === 'event' ? 'Which event?' : pick === 'league' ? 'Which league?' : 'Log something'">
    <template v-if="!pick">
      <div class="quick">
        <button v-if="pending" class="feature" @click="openSheet(RoundSheet, { eventId: pending.id })">
          <span class="ic-tile"><Icon name="note" /></span><div><b>Finish {{ pending.name }}</b><small>Round {{ pendingNext }} — course and date ready</small></div><Icon name="arrowR" size="sm" class="chev" />
        </button>
        <button @click="pick = 'event'"><span class="ic-tile"><Icon name="trophy" /></span><div><b>Tournament round</b><small>Or a match-play match</small></div></button>
        <button @click="logLeague"><span class="ic-tile"><Icon name="users" /></span><div><b>League round</b><small>{{ leagues.length === 1 ? leagues[0].name : 'Pick a league' }}</small></div></button>
        <button @click="openSheet(RoundSheet, {})"><span class="ic-tile"><Icon name="course" /></span><div><b>Casual round</b><small>Any course</small></div></button>
        <button @click="openSheet(EventSheet, {})"><span class="ic-tile"><Icon name="calendar" /></span><div><b>Event</b><small>Upcoming or past</small></div></button>
      </div>
      <div class="quick-more">
        <button class="btn" @click="openSheet(CourseSheet, {})"><Icon name="plus" size="xs" />Course</button>
        <button class="btn" @click="openSheet(LeagueSheet, {})"><Icon name="plus" size="xs" />League</button>
      </div>
    </template>

    <div v-else-if="pick === 'event'" class="card list" style="box-shadow: inset 0 0 0 1px var(--line)">
      <button v-for="e in recentEvents" :key="e.id" class="lrow" @click="logEvent(e)">
        <Plate v-if="firstCourse(e)" :course="firstCourse(e)" lite class="thumb sm" />
        <div class="body"><div class="name">{{ e.name }}</div><div class="meta">{{ fmtDateY(e.start_date) }}<span class="dot"></span>{{ FORMAT[e.format] }}</div></div>
        <StatusChip :event="e" />
      </button>
      <p v-if="!recentEvents.length" class="muted" style="padding: 16px">No events yet — add one first.</p>
    </div>

    <div v-else class="card list" style="box-shadow: inset 0 0 0 1px var(--line)">
      <button v-for="l in leagues" :key="l.id" class="lrow" @click="openSheet(RoundSheet, { leagueId: l.id })">
        <span class="league-chip" :style="{ background: l.color || 'var(--moss)' }"></span>
        <div class="body"><div class="name">{{ l.name }}</div><div class="meta">{{ l.day_time }}</div></div>
        <Icon name="chevR" size="sm" class="chev" />
      </button>
      <p v-if="!leagues.length" class="muted" style="padding: 16px">No leagues yet.</p>
    </div>

    <template v-if="pick" #foot><button class="btn" @click="pick = ''"><Icon name="chevL" size="xs" />Back</button></template>
  </SheetFrame>
</template>
