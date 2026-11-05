<script setup>
// Trip money as a receipt: entry (your share), caddy, stay, gas estimate, payout, total or net.
import { computed } from 'vue'
import { costFor, tripMiles, isUpcoming } from '../../lib/season.js'
import { money, fmtDate } from '../../lib/format.js'

const props = defineProps({ event: { type: Object, required: true }, today: String })
const e = computed(() => props.event)
const c = computed(() => costFor(e.value))
const upcoming = computed(() => isUpcoming(e.value, props.today))
const lines = computed(() => [
  { k: 'Entry', v: c.value.entry, note: e.value.fee_split > 1 ? 'your share' : '', col: 'var(--moss)' },
  { k: 'Caddy', v: c.value.caddy, note: '', col: 'var(--sky, #4C84B3)' },
  { k: 'Stay', v: c.value.lodging, note: e.value.lodging ? `${e.value.lodging.nights || ''} nt${e.value.lodging.split > 1 ? ' / split ' + e.value.lodging.split : ''}` : '', col: 'var(--plum)' },
  { k: 'Gas', v: c.value.gas, note: tripMiles(e.value) ? `${tripMiles(e.value)} mi est.` : '', col: 'var(--st-planning)' },
].filter((l) => l.v > 0))
const net = computed(() => c.value.payout - c.value.total)
</script>

<template>
  <div class="receipt-wrap">
    <div class="receipt in">
      <div class="rh"><b>{{ upcoming ? 'Trip estimate' : 'Trip receipt' }}</b><span>{{ e.name.split(' ').slice(0, 3).join(' ') }} · {{ fmtDate(e.start_date) }}</span></div>
      <div v-for="l in lines" :key="l.k" class="ln2"><span>{{ l.k }}</span><small v-if="l.note">{{ l.note }}</small><span class="lead"></span><span class="v">{{ money(l.v) }}</span></div>
      <div v-if="c.payout" class="ln2 pay"><span>Payout</span><span class="lead"></span><span class="v">+{{ money(c.payout) }}</span></div>
      <p v-if="!lines.length && !c.payout" class="meta" style="text-align: center; padding: 8px 0">No costs entered yet.</p>
      <div v-if="lines.length" class="bars"><i v-for="l in lines" :key="l.k" :style="{ flex: l.v, background: l.col }"></i></div>
      <div class="totl">
        <span>{{ c.payout ? 'Net' : upcoming ? 'Est. total' : 'Total' }}</span>
        <span class="num">{{ c.payout ? (net >= 0 ? '+' : '−') + money(Math.abs(net)) : money(c.total) }}</span>
      </div>
      <div class="thanks">{{ upcoming ? '— See you on the tee —' : '— Thanks for playing —' }}</div>
    </div>
  </div>
</template>
