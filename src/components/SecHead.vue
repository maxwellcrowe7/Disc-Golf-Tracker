<script setup>
defineProps({ no: { type: Number, required: true }, title: { type: String, required: true }, em: { type: String, default: '' } })
</script>

<template>
  <div class="sec-h in">
    <span class="no">{{ String(no).padStart(2, '0') }}</span>
    <h2>{{ title }}{{ em ? '\u00a0' : '' }}<em v-if="em">{{ em }}</em></h2>
    <span class="rule"></span>
    <slot />
  </div>
</template>
