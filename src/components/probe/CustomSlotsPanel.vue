<script setup lang="ts">
import { reactive } from 'vue';
import type { SlotData, WriteResult } from '../../composables/useCustomSlots';
import type { Preset } from '../../ptp/preset';
import RecipeCard from './RecipeCard.vue';

defineProps<{
  slots: SlotData[];
  presets: Preset[];
  busy: null | 'current' | 'all' | 'write';
  progress: number;
  error: string;
  lastWrite: WriteResult | null;
  backupTaken: boolean;
}>();
const emit = defineEmits<{ current: []; all: []; save: [slot: SlotData]; load: [slot: number, presetId: string] }>();

const pick = reactive<Record<number, string>>({});
function load(slot: number) {
  if (pick[slot]) emit('load', slot, pick[slot]);
}
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <div>
        <p class="title-3">Custom settings on the camera</p>
        <p class="body-6 muted">Read C1–C7, save any slot to your library, or load a preset into a slot.</p>
      </div>
    </div>
    <div class="panel-body stack">
      <div class="row">
        <button class="btn" type="button" :disabled="!!busy" @click="emit('all')">
          {{ busy === 'all' ? `Reading C${Math.min(progress + 1, 7)}…` : slots.length ? 'Read C1–C7 again' : 'Read C1–C7' }}
        </button>
        <button class="btn secondary" type="button" :disabled="!!busy" @click="emit('current')">Read selected slot only</button>
      </div>
      <div v-if="busy === 'all'" class="progress" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="7">
        <span :style="{ transform: `scaleX(${progress / 7})` }" />
      </div>
      <p v-if="busy === 'write'" class="body-6 muted" role="status">Writing to the camera. Keep the cable connected and the camera on.</p>
      <p v-if="error" class="body-6 field-error" role="alert">{{ error }}</p>
      <div v-if="lastWrite && !busy" class="notice" :class="{ error: !lastWrite.ok }" role="status">
        <div class="notice-body">
          <p class="title-3">
            {{ lastWrite.ok ? `C${lastWrite.slot} is now "${lastWrite.name}"` : `Writing C${lastWrite.slot} didn't complete` }}
          </p>
          <p v-if="lastWrite.error" class="body-6 muted">{{ lastWrite.error }}</p>
          <p v-if="lastWrite.ok" class="body-6 muted">Every field was read back from the camera and matches.</p>
          <ul v-if="lastWrite.mismatches.length" class="body-6 muted"><li v-for="m in lastWrite.mismatches" :key="m">{{ m }}</li></ul>
          <ul v-if="lastWrite.warnings.length" class="body-6 muted"><li v-for="w in lastWrite.warnings" :key="w">{{ w }}</li></ul>
        </div>
      </div>
      <p v-if="backupTaken" class="caption-5 muted">A backup of all seven slots from this session is saved in the library section.</p>
      <p v-else-if="!slots.length && !busy" class="body-6 muted">No slots read yet.</p>
    </div>
    <div v-if="slots.length" class="recipe-grid">
      <RecipeCard v-for="s in slots" :key="s.slot" :recipe="s.recipe">
        <button class="btn secondary sm" type="button" :disabled="!!busy" @click="emit('save', s)">Save to library</button>
        <div class="load-row">
          <select v-model="pick[s.slot]" class="input select" :disabled="!!busy || !presets.length" :aria-label="`Preset to load into C${s.slot}`">
            <option value="" disabled>{{ presets.length ? 'Choose a preset' : 'Library is empty' }}</option>
            <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <button class="btn sm" type="button" :disabled="!!busy || !pick[s.slot]" @click="load(s.slot)">Load</button>
        </div>
      </RecipeCard>
    </div>
  </section>
</template>
