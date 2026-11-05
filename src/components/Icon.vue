<script setup>
import { ICONS } from '../lib/icons.js'

defineProps({ name: { type: String, required: true }, size: { type: String, default: '' } })
</script>

<template>
  <svg class="i" :class="size" viewBox="0 0 24 24" aria-hidden="true" v-html="ICONS[name] || ''" />
</template>
