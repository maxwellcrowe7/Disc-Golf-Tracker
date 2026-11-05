<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { sheet, closeSheet } from '../lib/sheet.js'

const el = ref(null)
const drag = ref(0)
let y0 = null, t0 = 0

// Swipe down on the handle or header to dismiss (phones only).
function down(e) {
  if (innerWidth >= 720 || !e.target.closest('.grab, .shd') || e.target.closest('button')) return
  y0 = e.clientY; t0 = performance.now(); drag.value = 0
  el.value.classList.add('dragging')
  el.value.setPointerCapture(e.pointerId)
}
function move(e) {
  if (y0 === null) return
  const dy = e.clientY - y0
  drag.value = dy > 0 ? dy : dy * 0.15
}
function up() {
  if (y0 === null) return
  y0 = null
  el.value.classList.remove('dragging')
  const fast = drag.value / (performance.now() - t0) > 0.6
  if ((drag.value > 140 || fast) && closeSheet()) return
  drag.value = 0
}

const esc = (e) => { if (e.key === 'Escape' && sheet.open) closeSheet() }
onMounted(() => addEventListener('keydown', esc))
onBeforeUnmount(() => removeEventListener('keydown', esc))
watch(() => sheet.open, (o) => { document.body.classList.toggle('sheet-open', o); if (!o) drag.value = 0 })

// Leaving the page with unsaved changes in a sheet asks first.
addEventListener('beforeunload', (e) => { if (sheet.open && sheet.dirty) e.preventDefault() })
</script>

<template>
  <div class="scrim" :class="{ open: sheet.open }" @click="closeSheet()"></div>
  <div
    ref="el"
    class="sheet enter"
    :class="{ open: sheet.open }"
    role="dialog"
    aria-modal="true"
    :inert="!sheet.open"
    :style="{ '--drag': drag + 'px' }"
    @pointerdown="down"
    @pointermove="move"
    @pointerup="up"
    @pointercancel="up"
  >
    <div class="grab"></div>
    <component :is="sheet.component" v-if="sheet.component" :key="sheet.key" v-bind="sheet.props" />
  </div>
</template>
