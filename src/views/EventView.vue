<script setup>
// Interim event page (step 4): details, rounds/matches, and the edit/log sheets.
// The full ticket / travel / receipt / scorecard design lands in step 5.
import { computed } from 'vue'
import PageHead from '../components/PageHead.vue'
import Icon from '../components/Icon.vue'
import ScoreMark from '../components/ScoreMark.vue'
import StatusChip from '../components/StatusChip.vue'
import { state, eventById, courseById } from '../data/store.js'
import { fmtRange, fmtDow, money, ord, FORMAT } from '../lib/format.js'
import { matchResult } from '../lib/matchplay.js'
import { openSheet } from '../lib/sheet.js'
import EventSheet from '../components/sheets/EventSheet.vue'
import RoundSheet from '../components/sheets/RoundSheet.vue'
import MatchSheet from '../components/sheets/MatchSheet.vue'

const props = defineProps({ id: { type: String, required: true } })
const e = computed(() => eventById(props.id))
const rounds = computed(() => state.rounds.filter((r) => r.event_id === props.id).sort((a, b) => (a.round_number || 0) - (b.round_number || 0)))
const matches = computed(() => state.matches.filter((m) => m.event_id === props.id).sort((a, b) => a.match_number - b.match_number))
const isMatch = computed(() => e.value?.format === 'match_play')
const courseName = (id) => courseById(id)?.name || 'No course'
</script>

<template>
  <template v-if="e">
    <PageHead :kick="[fmtRange(e.start_date, e.end_date) + (e.start_date.slice(0, 4) !== state.today.slice(0, 4) ? ', ' + e.start_date.slice(0, 4) : ''), e.city || '']" :lines="[e.name]">
      <button class="icon-btn" aria-label="Edit event" @click="openSheet(EventSheet, { id: e.id })"><Icon name="edit" size="sm" /></button>
    </PageHead>
    <div class="detail-grid" style="margin-top: 0">
      <div class="col">
        <div class="card">
          <div class="ph"><h3>{{ isMatch ? 'Matches' : 'Rounds' }}</h3>
            <button class="btn sm" @click="openSheet(isMatch ? MatchSheet : RoundSheet, { eventId: e.id })"><Icon name="plus" size="xs" />{{ isMatch ? 'Match' : 'Round' }}</button>
          </div>
          <div class="pb" style="padding-top: 6px">
            <template v-if="isMatch">
              <button v-for="m in matches" :key="m.id" class="lrow" style="padding: 11px 0" @click="openSheet(MatchSheet, { id: m.id })">
                <span class="res" :class="matchResult(m)">{{ matchResult(m) }}</span>
                <div class="body"><div class="name" style="font-size: 14.5px">Match {{ m.match_number }}{{ m.opponent ? ' · vs ' + m.opponent : '' }}</div><div class="meta">{{ courseName(m.course_id) }}{{ m.holes ? ' · ' + m.holes.length + ' holes tracked' : '' }}</div></div>
                <Icon name="chevR" size="sm" class="chev" />
              </button>
              <p v-if="!matches.length" class="muted">No matches logged.</p>
            </template>
            <template v-else>
              <button v-for="r in rounds" :key="r.id" class="lrow" style="padding: 11px 0" @click="openSheet(RoundSheet, { id: r.id })">
                <span class="mono" style="width: 30px">R{{ r.round_number }}</span>
                <div class="body"><div class="name" style="font-size: 14.5px">{{ courseName(r.course_id) }}</div><div class="meta">{{ fmtDow(r.played_on) }} · {{ r.score }} thr · par {{ r.par }}{{ r.rating ? ' · ' + r.rating : '' }}</div></div>
                <div class="end"><ScoreMark v-if="r.score != null && r.par != null" :score="r.score" :par="r.par" /></div>
              </button>
              <p v-if="!rounds.length" class="muted">No rounds logged.</p>
            </template>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="card">
          <div class="ph"><h3>Details</h3><StatusChip :event="e" /></div>
          <div class="pb">
            <div class="kv"><div><div class="k">Format</div><div class="v">{{ FORMAT[e.format] }}{{ e.partners.length ? ' · with ' + e.partners.join(', ') : '' }}</div></div></div>
            <div class="kv"><div><div class="k">Sanctioning</div><div class="v">{{ e.pdga ? 'PDGA ' + (e.tier || '') : 'Non-PDGA' }}{{ e.division ? ' · ' + e.division : '' }}</div></div></div>
            <div class="kv"><div><div class="k">Courses</div><div class="v">{{ e.courses.map((x) => courseName(x.course_id)).join(', ') || '—' }}</div></div></div>
            <div v-if="e.entry_fee != null" class="kv"><div><div class="k">Entry</div><div class="v">{{ money(e.entry_fee) }}{{ e.fee_split > 1 ? ` · split ${e.fee_split} ways` : '' }}{{ e.had_caddy ? ` · caddy ${money(e.caddy_fee || 0)}` : '' }}</div></div></div>
            <div v-if="e.place" class="kv"><div><div class="k">Finish</div><div class="v">{{ ord(e.place) }}{{ e.field_size ? ` of ${e.field_size} ${e.field_unit}` : '' }}{{ e.payout ? ' · won ' + money(e.payout) : '' }}</div></div></div>
            <div v-if="e.lodging" class="kv"><div><div class="k">Stay</div><div class="v">{{ e.lodging.type }} · {{ e.lodging.name }}{{ e.lodging.nights ? ` · ${e.lodging.nights} night${e.lodging.nights === 1 ? '' : 's'}` : '' }}</div></div></div>
            <p v-if="e.notes" class="notes-q" style="margin-top: 12px">“{{ e.notes }}”</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  <p v-else class="page-stub"><b>Event not found</b><RouterLink to="/schedule">Back to the schedule</RouterLink></p>
</template>
