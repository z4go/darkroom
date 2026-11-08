<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { SlotData, WriteResult } from '../../composables/useCustomSlots';
import type { Preset } from '../../ptp/preset';

const props = defineProps<{
  slots: SlotData[];
  presets: Preset[];
  busy: null | 'current' | 'all' | 'write';
  batch: { total: number; results: WriteResult[] } | null;
  backupTaken: boolean;
  sets: string[];
}>();
const emit = defineEmits<{ run: [jobs: { slot: number; preset: Preset }[]] }>();

const choice = reactive<Record<number, string>>({});
const dialog = ref<HTMLDialogElement | null>(null);

const jobs = computed(() =>
  props.slots
    .filter((s) => choice[s.slot])
    .map((s) => ({ slot: s.slot, from: s.name, preset: props.presets.find((p) => p.id === choice[s.slot])! }))
    .filter((j) => j.preset),
);

/** Pre-fill every slot the set suggests; other slots go back to Keep. */
function useSet(set: string) {
  for (const s of props.slots) {
    const hinted = props.presets.find((p) => p.setName === set && p.slotHint === s.slot);
    choice[s.slot] = hinted?.id ?? '';
  }
}
const mine = computed(() => props.presets.filter((p) => !p.builtin));
const groups = computed(() => {
  const m = new Map<string, Preset[]>();
  for (const p of props.presets.filter((x) => x.builtin)) m.set(p.setName ?? 'Built-in', [...(m.get(p.setName ?? 'Built-in') ?? []), p]);
  return [...m.entries()];
});

function ask() {
  if (jobs.value.length) dialog.value?.showModal();
}
function confirm() {
  dialog.value?.close();
  emit('run', jobs.value.map(({ slot, preset }) => ({ slot, preset })));
}
const done = computed(() => props.batch?.results.length ?? 0);
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <div>
        <p class="title-3">Load a set into several slots</p>
        <p class="body-6 muted">Choose a preset for each slot you want to replace. Slots left on "Keep" are not touched.</p>
      </div>
    </div>
    <div class="panel-body stack">
      <div class="batch-rows">
        <label v-for="s in slots" :key="s.slot" class="batch-row">
          <span class="slot-badge">C{{ s.slot }}</span>
          <span class="body-6 batch-current">{{ s.name || 'untitled' }}</span>
          <select v-model="choice[s.slot]" class="input select" :disabled="!!busy" :aria-label="`Preset for C${s.slot}`">
            <option value="">Keep</option>
            <optgroup v-if="mine.length" label="My presets">
              <option v-for="p in mine" :key="p.id" :value="p.id">{{ p.name }}</option>
            </optgroup>
            <optgroup v-for="[g, list] in groups" :key="g" :label="g">
              <option v-for="p in list" :key="p.id" :value="p.id">{{ p.name }}{{ p.slotHint ? ` (C${p.slotHint})` : '' }}</option>
            </optgroup>
          </select>
        </label>
      </div>
      <div class="row">
        <button class="btn" type="button" :disabled="!!busy || !jobs.length" @click="ask">
          {{ busy === 'write' && batch ? `Writing ${Math.min(done + 1, batch.total)} of ${batch.total}…` : `Load into ${jobs.length || ''} slot${jobs.length === 1 ? '' : 's'}`.replace('  ', ' ') }}
        </button>
        <button v-for="set in sets" :key="set" class="btn secondary" type="button" :disabled="!!busy" @click="useSet(set)">Use set: {{ set }}</button>
      </div>
      <div v-if="batch && busy === 'write'" class="progress" role="progressbar" :aria-valuenow="done" aria-valuemin="0" :aria-valuemax="batch.total">
        <span :style="{ transform: `scaleX(${done / batch.total})` }" />
      </div>
      <ul v-if="batch && batch.results.length" class="batch-results body-6" role="status">
        <li v-for="r in batch.results" :key="r.slot" :class="{ 'field-error': !r.ok }">
          C{{ r.slot }} "{{ r.name }}":
          <template v-if="r.ok">written and verified{{ r.warnings.length ? ` · ${r.warnings.join('; ')}` : '' }}</template>
          <template v-else>{{ r.error || r.mismatches.join('; ') }}</template>
        </li>
        <li v-if="!busy && batch.results.length < batch.total" class="field-error">Stopped before the remaining {{ batch.total - batch.results.length }} slot(s).</li>
      </ul>
    </div>

    <dialog ref="dialog" class="dialog" aria-labelledby="batch-title">
      <div class="stack">
        <p id="batch-title" class="heading-6">Overwrite {{ jobs.length }} slot{{ jobs.length === 1 ? '' : 's' }} on the camera?</p>
        <ul class="body-6">
          <li v-for="j in jobs" :key="j.slot">C{{ j.slot }}: "{{ j.from || 'untitled' }}" → <strong>{{ j.preset.name }}</strong></li>
        </ul>
        <p class="body-6 muted">
          {{ backupTaken ? 'A backup of all slots from this session is already saved.' : 'All seven slots are read and backed up first.' }}
          Each slot is read back and checked after writing.
        </p>
        <div class="row">
          <button class="btn" type="button" @click="confirm">Write {{ jobs.length }} slot{{ jobs.length === 1 ? '' : 's' }}</button>
          <button class="btn secondary" type="button" @click="dialog?.close()">Cancel</button>
        </div>
      </div>
    </dialog>
  </section>
</template>
