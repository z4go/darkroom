<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { SweepHit } from '../../composables/useExplore';
import { hex } from '../../ptp/codes';
import { fmtForm, fmtValue } from './format';

const props = defineProps<{
  sweep: { from: number; to: number; current: number; done: number; total: number; hits: SweepHit[]; misses: Record<string, number>; error: string };
  busy: boolean;
  disabled: boolean;
}>();
const emit = defineEmits<{ run: []; stop: []; range: [from: number, to: number] }>();

const presets = [
  { label: 'D000–D3FF', from: 0xd000, to: 0xd3ff },
  { label: 'D400–D7FF', from: 0xd400, to: 0xd7ff },
  { label: '5000–50FF', from: 0x5000, to: 0x50ff },
];

const fromText = ref(props.sweep.from.toString(16).toUpperCase());
const toText = ref(props.sweep.to.toString(16).toUpperCase());
const parse = (s: string) => {
  const n = parseInt(s.replace(/^0x/i, ''), 16);
  return Number.isFinite(n) && n >= 0 && n <= 0xffff ? n : null;
};
const rangeError = computed(() => {
  const a = parse(fromText.value);
  const b = parse(toText.value);
  if (a === null || b === null) return 'Enter hex codes between 0000 and FFFF.';
  if (Math.abs(b - a) > 0x1000) return 'Keep a sweep to 4096 codes or fewer.';
  return '';
});
watch([fromText, toText], () => {
  const a = parse(fromText.value);
  const b = parse(toText.value);
  if (!rangeError.value && a !== null && b !== null) emit('range', a, b);
});
function preset(p: (typeof presets)[number]) {
  fromText.value = p.from.toString(16).toUpperCase();
  toText.value = p.to.toString(16).toUpperCase();
}
const pct = computed(() => (props.sweep.total ? Math.round((props.sweep.done / props.sweep.total) * 100) : 0));
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <div>
        <p class="title-3">Property sweep</p>
        <p class="body-6 muted">Asks GetDevicePropValue for every code in a range, including codes the camera doesn't advertise.</p>
      </div>
    </div>
    <div class="panel-body stack">
      <div class="sweep-controls">
        <label class="field">
          <span class="caption-4 muted">From</span>
          <input v-model="fromText" class="input mono" inputmode="text" autocapitalize="characters" spellcheck="false" :disabled="busy" />
        </label>
        <label class="field">
          <span class="caption-4 muted">To</span>
          <input v-model="toText" class="input mono" inputmode="text" autocapitalize="characters" spellcheck="false" :disabled="busy" />
        </label>
        <button v-if="!busy" class="btn" type="button" :disabled="disabled || !!rangeError" @click="$emit('run')">Start sweep</button>
        <button v-else class="btn secondary" type="button" @click="$emit('stop')">Stop</button>
      </div>
      <div class="row">
        <button v-for="p in presets" :key="p.label" class="pill pill-btn" type="button" :disabled="busy" @click="preset(p)">{{ p.label }}</button>
      </div>
      <p v-if="rangeError" class="body-6 field-error" role="alert">{{ rangeError }}</p>

      <div v-if="sweep.total" class="stack">
        <div class="progress" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100"><span :style="{ transform: `scaleX(${pct / 100})` }" /></div>
        <p class="body-6 muted">
          {{ sweep.done }} / {{ sweep.total }} tried<template v-if="busy"> · at <span class="mono">{{ hex(sweep.current) }}</span></template>
          · <strong>{{ sweep.hits.length }} answered</strong>
          <template v-for="(n, k) in sweep.misses" :key="k"> · {{ n }} {{ k }}</template>
        </p>
        <p v-if="sweep.error" class="body-6 field-error" role="alert">{{ sweep.error }}</p>
      </div>
    </div>
    <div v-if="sweep.hits.length" class="table-scroll">
      <table>
        <thead><tr><th>Code</th><th>Bytes</th><th>Value</th><th>Descriptor</th></tr></thead>
        <tbody>
          <tr v-for="h in sweep.hits" :key="h.code">
            <td class="mono">{{ hex(h.code) }}</td>
            <td class="mono">{{ h.bytes }}</td>
            <td><span class="mono">{{ h.guess }}</span><div class="mono caption-5 muted hexline">{{ h.hex }}</div></td>
            <td class="body-6">
              <template v-if="h.desc">
                <span class="mono">{{ h.desc.dataTypeName }}</span> · {{ h.desc.writable ? 'get/set' : 'get' }}
                · now <span class="mono">{{ fmtValue(h.desc.current) }}</span>
                <template v-if="fmtForm(h.desc.form)"><br /><span class="mono caption-5">{{ fmtForm(h.desc.form) }}</span></template>
              </template>
              <span v-else class="muted">none</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
