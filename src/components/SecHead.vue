<script setup>
defineProps({ no: { type: Number, required: true }, title: { type: String, required: true }, em: { type: String, default: '' } })
</script>

<template>
  <div class="sec-h in">
    <span class="no">{{ String(no).padStart(2, '0') }}</span>
    <h2>{{ title }}<template v-if="em"> <em>{{ em }}</em></template></h2>
    <span class="rule"></span>
    <slot />
  </div>
</template>
