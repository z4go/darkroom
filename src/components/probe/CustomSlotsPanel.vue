<script setup lang="ts">
import { useClipboard } from '../../composables/useClipboard';
import type { Recipe } from '../../ptp/recipe';
import AppIcon from '../AppIcon.vue';
import RecipeCard from './RecipeCard.vue';

defineProps<{
  recipes: Recipe[];
  busy: null | 'current' | 'all';
  progress: number;
  error: string;
}>();
defineEmits<{ current: []; all: [] }>();

const { state, copy } = useClipboard();
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <div>
        <p class="title-3">Custom settings</p>
        <p class="body-6 muted">
          Read all switches the camera's custom settings selector through C1–C7, then puts it back. Slot contents are never changed.
        </p>
      </div>
    </div>
    <div class="panel-body stack">
      <div class="row">
        <button class="btn" type="button" :disabled="!!busy" @click="$emit('all')">
          {{ busy === 'all' ? `Reading C${Math.min(progress + 1, 7)}…` : 'Read C1–C7' }}
        </button>
        <button class="btn secondary" type="button" :disabled="!!busy" @click="$emit('current')">
          {{ busy === 'current' ? 'Reading…' : 'Read selected slot only' }}
        </button>
        <button v-if="recipes.length" class="btn secondary" type="button" :disabled="!!busy" @click="copy(JSON.stringify(recipes, null, 2))">
          <AppIcon name="copy" />{{ { idle: 'Copy JSON', copied: 'Copied', failed: 'Copy failed' }[state] }}
        </button>
      </div>
      <div v-if="busy === 'all'" class="progress" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="7">
        <span :style="{ transform: `scaleX(${progress / 7})` }" />
      </div>
      <p v-if="error" class="body-6 field-error" role="alert">{{ error }}</p>
      <p v-if="!recipes.length && !busy" class="body-6 muted">No slots read yet.</p>
    </div>
    <div v-if="recipes.length" class="recipe-grid">
      <RecipeCard v-for="r in recipes" :key="r.slot" :recipe="r" />
    </div>
  </section>
</template>
