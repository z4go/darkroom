<script setup lang="ts">
import { ref } from 'vue';
import type { usePresetLibrary } from '../../composables/usePresetLibrary';
import { defaultPreset, presetToRecipe, type Preset } from '../../ptp/preset';
import RecipeCard from '../probe/RecipeCard.vue';
import PresetEditor from './PresetEditor.vue';

const props = defineProps<{ library: ReturnType<typeof usePresetLibrary> }>();
const editing = ref<Preset | null>(null);
const message = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

function save(p: Preset) {
  props.library.save(p);
  editing.value = null;
  message.value = `Saved "${p.name}".`;
}

function remove(p: Preset) {
  if (confirm(`Delete "${p.name}" from this browser? This can't be undone.`)) props.library.remove(p.id);
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const { added, skipped } = await props.library.importFile(file);
    message.value = `Imported ${added} preset${added === 1 ? '' : 's'}${skipped ? `, skipped ${skipped} that didn't look like presets` : ''}.`;
  } catch {
    message.value = "That file isn't valid preset JSON.";
  } finally {
    (e.target as HTMLInputElement).value = '';
  }
}

defineExpose({ edit: (p: Preset) => (editing.value = p) });
</script>

<template>
  <section id="library" class="panel">
    <div class="panel-head">
      <div>
        <p class="title-3">Preset library</p>
        <p class="body-6 muted">
          Stored in this browser on this device.<template v-if="!library.persisted.value"> Storage is blocked here, so presets last only until you close the tab. Export them to keep them.</template>
        </p>
      </div>
    </div>
    <div class="panel-body stack">
      <div class="row">
        <button class="btn" type="button" @click="editing = defaultPreset()">New preset</button>
        <button class="btn secondary" type="button" @click="fileInput?.click()">Import</button>
        <button class="btn secondary" type="button" :disabled="!library.presets.value.length" @click="library.exportAll">Export all</button>
        <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" @change="onFile" />
      </div>
      <p v-if="message" class="body-6 muted" role="status">{{ message }}</p>
      <PresetEditor v-if="editing" :key="editing.id" :preset="editing" @save="save" @cancel="editing = null" />
      <p v-if="!library.presets.value.length && !editing" class="body-6 muted">
        No presets yet. Create one, import a file, or read the camera and use Save to library on a slot.
      </p>
    </div>
    <div v-if="library.presets.value.length" class="recipe-grid">
      <RecipeCard v-for="p in library.presets.value" :key="p.id" :recipe="presetToRecipe(p)" hide-slot>
        <button class="btn secondary sm" type="button" @click="editing = p">Edit</button>
        <button class="btn secondary sm" type="button" @click="library.duplicate(p)">Duplicate</button>
        <button class="btn secondary sm" type="button" @click="library.exportOne(p)">Export</button>
        <button class="btn secondary sm" type="button" @click="remove(p)">Delete</button>
      </RecipeCard>
    </div>
    <div v-if="library.backups.value.length" class="panel-body stack backups">
      <p class="title-4">Slot backups</p>
      <ul class="body-6">
        <li v-for="b in library.backups.value" :key="b.takenAt">
          {{ new Date(b.takenAt).toLocaleString() }} · {{ b.model }} {{ b.firmware }} · {{ b.slots.map((s) => s.name || `C${s.slot}`).join(', ') }}
          · <button class="link-btn" type="button" @click="library.downloadBackup(b)">Download</button>
        </li>
      </ul>
    </div>
  </section>
</template>
