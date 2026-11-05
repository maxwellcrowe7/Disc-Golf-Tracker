<script setup>
import { STATUS } from '../lib/format.js'

defineProps({ event: { type: Object, required: true } })
</script>

<template>
  <span class="status" :class="event.status">{{ event.status === 'waitlisted' && event.waitlist_pos ? 'Waitlist #' + event.waitlist_pos : STATUS[event.status] }}</span>
</template>
