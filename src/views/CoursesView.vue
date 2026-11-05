<script setup>
import { ref, computed } from 'vue'
import PageHead from '../components/PageHead.vue'
import Plate from '../components/Plate.vue'
import Icon from '../components/Icon.vue'
import ScoreMark from '../components/ScoreMark.vue'
import { state, plateNumber } from '../data/store.js'
import { fmtDate } from '../lib/format.js'
import { roundsAtCourse, avgToPar } from '../lib/stats.js'
import { toast } from '../lib/toast.js'

const q = ref('')
const states = computed(() => [...new Set(state.courses.map((c) => c.state).filter(Boolean))].join(' · '))

const plates = computed(() => {
  const s = q.value.trim().toLowerCase()
  return state.courses
    .filter((c) => !s || `${c.name} ${c.city} ${c.state}`.toLowerCase().includes(s))
    .map((c) => {
      const rounds = roundsAtCourse(c.id)
      const next = state.events
        .filter((e) => e.start_date >= state.today && e.courses.some((x) => x.course_id === c.id))
        .sort((a, b) => a.start_date.localeCompare(b.start_date))[0]
      return { c, rounds: rounds.length, avg: avgToPar(rounds.filter((r) => !r.is_team)), next }
    })
})
</script>

<template>
  <PageHead :kick="[`${state.courses.length} plates`, states]" :lines="['Course', '*atlas*']">
    <button class="icon-btn" aria-label="Add course" @click="toast('Adding courses arrives with the log sheets')"><Icon name="plus" size="sm" /></button>
  </PageHead>

  <label class="search"><Icon name="search" size="sm" /><input v-model="q" placeholder="Search by name or city" autocomplete="off" /></label>

  <div class="atlas">
    <RouterLink v-for="p in plates" :key="p.c.id" class="plate-card" :to="`/course/${p.c.id}`">
      <div class="frame">
        <Plate :course="p.c" :dot="0.75" marks />
        <span v-if="p.next" class="tag"><span class="chip"><Icon name="calendar" size="xs" />{{ fmtDate(p.next.start_date) }}</span></span>
      </div>
      <div class="cap">
        <span class="pl">{{ plateNumber(p.c.id) }}</span>
        <b>{{ p.c.name }}</b>
        <span class="st3"><ScoreMark v-if="p.avg !== null" :diff="+p.avg.toFixed(1)" /><span v-else class="mono">—</span></span>
        <span class="sub">{{ p.c.city }}{{ p.c.state ? ', ' + p.c.state : '' }} · {{ p.c.holes }} holes · {{ p.rounds }} rds</span>
      </div>
    </RouterLink>
  </div>
  <p v-if="!plates.length" class="page-stub">No courses match “{{ q }}”.</p>
</template>
