<script setup>
// Rubber stamp on tickets and scorecards. `slam` plays the landing once (after a status change).
defineProps({ event: { type: Object, required: true }, slam: Boolean, recorded: Boolean })
</script>

<template>
  <span v-if="recorded" class="stamp recorded" :class="{ slam }">Recorded</span>
  <span v-else-if="event.status === 'registered'" class="stamp" :class="{ slam }">Registered<small>Confirmed entry</small></span>
  <span v-else-if="event.status === 'waitlisted'" class="stamp waitlisted" :class="{ slam }">Waitlist<small v-if="event.waitlist_pos">Position #{{ event.waitlist_pos }}</small></span>
</template>
