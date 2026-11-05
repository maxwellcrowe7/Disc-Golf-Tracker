<script setup>
import { computed } from 'vue'
import PageHead from '../components/PageHead.vue'
import { eventById } from '../data/store.js'
import { fmtRange } from '../lib/format.js'

const props = defineProps({ id: { type: String, required: true } })
const e = computed(() => eventById(props.id))
</script>

<template>
  <PageHead v-if="e" :kick="[fmtRange(e.start_date, e.end_date), e.city]" :lines="[e.name]" />
  <div class="card page-stub"><b>Event pages arrive in build step 5</b>Ticket, status, travel, receipt and scorecard.</div>
</template>
