<script setup lang="ts">
import { computed, ref } from 'vue';
import { clonePreset, isMono, NAME_MAX, OPTIONS, RANGES, validatePreset, type Preset } from '../../ptp/preset';
import { WB_COLOR_TEMP } from '../../ptp/recipe';

const props = defineProps<{ preset: Preset }>();
const emit = defineEmits<{ save: [p: Preset]; cancel: [] }>();

const p = ref<Preset>(clonePreset(props.preset));
const tried = ref(false);
const errors = computed(() => validatePreset(p.value));
const mono = computed(() => isMono(p.value));

function submit() {
  tried.value = true;
  if (!errors.value.length) emit('save', p.value);
}

const numberFields = computed(() => {
  const f: { key: keyof Preset; label: string; r: { min: number; max: number; step: number } }[] = [
    { key: 'highlight', label: 'Highlight', r: RANGES.highlight },
    { key: 'shadow', label: 'Shadow', r: RANGES.shadow },
  ];
  if (!mono.value) f.push({ key: 'color', label: 'Color', r: RANGES.color });
  f.push(
    { key: 'sharpness', label: 'Sharpness', r: RANGES.sharpness },
    { key: 'highIsoNr', label: 'High ISO NR', r: RANGES.highIsoNr },
    { key: 'clarity', label: 'Clarity', r: RANGES.clarity },
  );
  return f;
});
</script>

<template>
  <form class="editor" novalidate @submit.prevent="submit">
    <div class="editor-grid">
      <label class="field span-2">
        <span class="caption-4 muted">Name (shown on the camera)</span>
        <input v-model="p.name" class="input wide" :maxlength="NAME_MAX" required autocomplete="off" />
      </label>
      <label class="field span-2">
        <span class="caption-4 muted">Film simulation</span>
        <select v-model.number="p.filmSimulation" class="input wide select">
          <option v-for="o in OPTIONS.filmSimulation" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>
      <template v-if="mono">
        <label class="field">
          <span class="caption-4 muted">Mono warm / cool</span>
          <input v-model.number="p.monoWarmCool" class="input wide" type="number" :min="RANGES.mono.min" :max="RANGES.mono.max" :step="RANGES.mono.step" />
        </label>
        <label class="field">
          <span class="caption-4 muted">Mono magenta / green</span>
          <input v-model.number="p.monoMagentaGreen" class="input wide" type="number" :min="RANGES.mono.min" :max="RANGES.mono.max" :step="RANGES.mono.step" />
        </label>
      </template>
      <label class="field">
        <span class="caption-4 muted">Grain</span>
        <select v-model.number="p.grain" class="input wide select"><option v-for="o in OPTIONS.grain" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      </label>
      <label class="field">
        <span class="caption-4 muted">Color Chrome</span>
        <select v-model.number="p.colorChrome" class="input wide select"><option v-for="o in OPTIONS.offWeakStrong" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      </label>
      <label class="field">
        <span class="caption-4 muted">Color Chrome FX Blue</span>
        <select v-model.number="p.colorChromeFxBlue" class="input wide select"><option v-for="o in OPTIONS.offWeakStrong" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      </label>
      <label class="field">
        <span class="caption-4 muted">Smooth skin</span>
        <select v-model.number="p.smoothSkin" class="input wide select"><option v-for="o in OPTIONS.offWeakStrong" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      </label>
      <label class="field">
        <span class="caption-4 muted">White balance</span>
        <select v-model.number="p.whiteBalance" class="input wide select"><option v-for="o in OPTIONS.whiteBalance" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      </label>
      <label v-if="p.whiteBalance === WB_COLOR_TEMP" class="field">
        <span class="caption-4 muted">Color temperature (K)</span>
        <input v-model.number="p.colorTemperature" class="input wide" type="number" :min="RANGES.colorTemperature.min" :max="RANGES.colorTemperature.max" :step="RANGES.colorTemperature.step" />
      </label>
      <label class="field">
        <span class="caption-4 muted">WB shift R</span>
        <input v-model.number="p.wbShiftR" class="input wide" type="number" :min="RANGES.wbShift.min" :max="RANGES.wbShift.max" step="1" />
      </label>
      <label class="field">
        <span class="caption-4 muted">WB shift B</span>
        <input v-model.number="p.wbShiftB" class="input wide" type="number" :min="RANGES.wbShift.min" :max="RANGES.wbShift.max" step="1" />
      </label>
      <label class="field">
        <span class="caption-4 muted">Dynamic range</span>
        <select v-model.number="p.dynamicRange" class="input wide select"><option v-for="o in OPTIONS.dynamicRange" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      </label>
      <label v-for="f in numberFields" :key="f.key" class="field">
        <span class="caption-4 muted">{{ f.label }} ({{ f.r.min }} to {{ f.r.max }})</span>
        <input v-model.number="(p as any)[f.key]" class="input wide" type="number" :min="f.r.min" :max="f.r.max" :step="f.r.step" />
      </label>
    </div>
    <ul v-if="tried && errors.length" class="body-6 field-error" role="alert"><li v-for="e in errors" :key="e">{{ e }}</li></ul>
    <div class="row">
      <button class="btn" type="submit">Save preset</button>
      <button class="btn secondary" type="button" @click="emit('cancel')">Cancel</button>
    </div>
  </form>
</template>
