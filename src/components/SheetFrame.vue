<script setup>
// Header, scrolling body and footer shared by every form sheet.
import Icon from './Icon.vue'
import { closeSheet } from '../lib/sheet.js'

defineProps({ title: { type: String, required: true } })
</script>

<template>
  <div class="shd"><h3>{{ title }}</h3><button class="icon-btn" aria-label="Close" @click="closeSheet()"><Icon name="x" size="sm" /></button></div>
  <div class="sb"><slot /></div>
  <div v-if="$slots.foot" class="sf"><slot name="foot" /></div>
</template>
