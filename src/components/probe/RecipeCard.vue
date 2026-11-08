<script setup lang="ts">
import { computed } from 'vue';
import { signed, type Recipe } from '../../ptp/recipe';

const props = defineProps<{ recipe: Recipe }>();

const rows = computed(() => {
  const r = props.recipe;
  const out: [string, string][] = [];
  if (r.monochrome) out.push(['Mono WC / MG', `${signed(r.monoWarmCool ?? 0)} / ${signed(r.monoMagentaGreen ?? 0)}`]);
  out.push(
    ['Grain', r.grain],
    ['Color Chrome', r.colorChrome],
    ['Color Chrome FX Blue', r.colorChromeFxBlue],
    ['White balance', r.colorTemperature ? `${r.colorTemperature} K` : r.whiteBalance],
    ['WB shift', `R ${signed(r.whiteBalanceShift.r)} · B ${signed(r.whiteBalanceShift.b)}`],
    ['Dynamic range', r.dynamicRange],
    ['Highlight / Shadow', `${signed(r.highlight)} / ${signed(r.shadow)}`],
  );
  if (r.color !== null) out.push(['Color', signed(r.color)]);
  out.push(
    ['Sharpness', signed(r.sharpness)],
    ['High ISO NR', typeof r.highIsoNr === 'number' ? signed(r.highIsoNr) : r.highIsoNr],
    ['Clarity', signed(r.clarity)],
    ['Smooth skin', r.smoothSkin],
  );
  return out;
});
</script>

<template>
  <article class="recipe">
    <header class="recipe-head">
      <span class="slot-badge">C{{ recipe.slot }}</span>
      <div>
        <p class="title-3">{{ recipe.name || 'Untitled' }}</p>
        <p class="body-6 muted">{{ recipe.filmSimulation }}</p>
      </div>
    </header>
    <dl class="recipe-kv">
      <template v-for="[k, v] in rows" :key="k">
        <dt>{{ k }}</dt>
        <dd>{{ v }}</dd>
      </template>
    </dl>
  </article>
</template>
