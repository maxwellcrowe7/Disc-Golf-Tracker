<script setup>
import { computed } from 'vue'
import { plateSvg } from '../lib/plate.js'
import { plateNumber } from '../data/store.js'

const props = defineProps({
  course: { type: Object, required: true },
  lite: Boolean, // thumbnails: no halftone
  dot: { type: Number, default: 0 }, // halftone size for large plates
  marks: Boolean, // north arrow, scale bar, plate number
  noScale: Boolean,
})

const svg = computed(() => plateSvg(props.course, { lite: props.lite, dot: props.dot || undefined }))
</script>

<template>
  <div class="art">
    <div style="display: contents" v-html="svg" />
    <div v-if="marks" class="marks">
      <span class="north">
        <svg viewBox="0 0 14 18"><path d="M7 0 13 16 7 12 1 16Z" fill="currentColor" opacity=".9" /><path d="M7 0V12L1 16Z" fill="var(--pp)" opacity=".5" /></svg>N
      </span>
      <span v-if="!noScale" class="scale"><i></i>0 · 100 ft</span>
      <span class="plate-no">{{ plateNumber(course.id) }}</span>
    </div>
    <slot />
  </div>
</template>
