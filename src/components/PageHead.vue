<script setup>
// Large editorial page title: mono kicker line(s) above, display headline below.
// `lines` is an array; a line wrapped in *asterisks* is set in italic.
defineProps({ kick: { type: Array, default: () => [] }, lines: { type: Array, required: true } })

const parse = (l) => (l.startsWith('*') && l.endsWith('*') ? { em: true, text: l.slice(1, -1) } : { em: false, text: l })
</script>

<template>
  <div class="pagehead">
    <div>
      <div class="kick"><span v-for="k in kick" :key="k" class="mono">{{ k }}</span></div>
      <h1 data-sentinel>
        <span v-for="(l, i) in lines" :key="i" class="ln"><span><em v-if="parse(l).em">{{ parse(l).text }}</em><template v-else>{{ l }}</template></span></span>
      </h1>
    </div>
    <slot />
  </div>
</template>
