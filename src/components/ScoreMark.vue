<script setup>
// To-par number in scorecard notation: circle under, double circle 5+ under, box over.
import { computed } from 'vue'
import { relTxt, scClass } from '../lib/format.js'

const props = defineProps({ score: Number, par: Number, diff: Number })
const d = computed(() => (props.diff ?? props.score - props.par))
</script>

<template>
  <span class="sc" :class="scClass(d)">{{ relTxt(d) }}</span>
</template>
