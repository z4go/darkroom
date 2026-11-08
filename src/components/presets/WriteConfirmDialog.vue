<script setup lang="ts">
import { ref, watch } from 'vue';
import { presetToRecipe, type Preset } from '../../ptp/preset';
import RecipeCard from '../probe/RecipeCard.vue';

const props = defineProps<{ open: boolean; slot: number; currentName: string; preset: Preset | null; backupTaken: boolean }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);

watch(
  () => props.open,
  (o) => (o ? dialog.value?.showModal() : dialog.value?.close()),
);
</script>

<template>
  <dialog ref="dialog" class="dialog" aria-labelledby="write-title" @cancel.prevent="emit('cancel')">
    <div v-if="preset" class="stack">
      <p id="write-title" class="heading-6">Load "{{ preset.name }}" into C{{ slot }}?</p>
      <p class="body-6 muted">
        C{{ slot }} is currently "{{ currentName || 'untitled' }}". It will be overwritten on the camera.
        {{ backupTaken ? 'A backup of all slots from this session is already saved.' : 'All seven slots are read and backed up first.' }}
        Every field is read back afterwards to check it.
      </p>
      <RecipeCard :recipe="presetToRecipe(preset, slot)" />
      <div class="row">
        <button class="btn" type="button" @click="emit('confirm')">Write to C{{ slot }}</button>
        <button class="btn secondary" type="button" @click="emit('cancel')">Cancel</button>
      </div>
    </div>
  </dialog>
</template>
