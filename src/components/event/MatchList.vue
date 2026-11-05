<script setup>
// Match play: each match with its result (circle won, box lost), hole strip when tracked, notes.
import { computed } from 'vue'
import Icon from '../Icon.vue'
import { state, courseById } from '../../data/store.js'
import { holeTally, matchResult } from '../../lib/matchplay.js'
import { openSheet } from '../../lib/sheet.js'
import MatchSheet from '../sheets/MatchSheet.vue'

const props = defineProps({ event: { type: Object, required: true } })
const matches = computed(() => state.matches.filter((m) => m.event_id === props.event.id).sort((a, b) => a.match_number - b.match_number))
</script>

<template>
  <div class="card">
    <div class="ph"><h3>Matches</h3><button class="btn sm" @click="openSheet(MatchSheet, { eventId: event.id })"><Icon name="plus" size="xs" />Match</button></div>
    <div class="pb" style="padding-top: 4px">
      <button v-for="m in matches" :key="m.id" class="match in" style="display: block; width: 100%; text-align: left" @click="openSheet(MatchSheet, { id: m.id })">
        <div class="mh">
          <span class="res" :class="matchResult(m)">{{ matchResult(m) || '?' }}</span>
          <div class="who"><b>{{ m.opponent ? 'vs ' + m.opponent : 'Match ' + m.match_number }}</b><small>Match {{ m.match_number }}<template v-if="m.opponent_team"> · {{ m.opponent_team }}</template><template v-if="m.course_id"> · {{ courseById(m.course_id)?.name }}</template></small></div>
          <div v-if="m.holes" class="tal"><span class="num">{{ holeTally(m.holes).W }}–{{ holeTally(m.holes).L }}</span><small>{{ holeTally(m.holes).P }} PUSHED</small></div>
        </div>
        <div v-if="m.holes" class="holes" :style="{ gridTemplateColumns: `repeat(${m.holes.length}, 1fr)` }"><i v-for="(h, i) in m.holes" :key="i" :class="h" :title="`Hole ${i + 1}: ${{ W: 'won', L: 'lost', P: 'push' }[h]}`"></i></div>
        <p v-if="m.notes" class="meta" style="margin-top: 8px; display: block">{{ m.notes }}</p>
      </button>
      <p v-if="!matches.length" class="muted">No matches logged yet.</p>
      <div v-if="matches.some((m) => m.holes)" class="legend" style="margin-top: 12px">
        <span><i style="background: var(--good)"></i>Won hole</span><span><i style="background: var(--line-2); height: 3px; border-radius: 2px"></i>Push</span><span><i style="background: none; border-radius: 2px; box-shadow: inset 0 0 0 1.5px var(--bad)"></i>Lost hole</span>
      </div>
    </div>
  </div>
</template>
