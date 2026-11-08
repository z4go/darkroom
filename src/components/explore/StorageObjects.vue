<script setup lang="ts">
import { hex } from '../../ptp/codes';
import type { ObjectInfo, StorageInfo } from '../../ptp/datasets';

defineProps<{
  storages: StorageInfo[];
  objects: ObjectInfo[];
  objectTotal: number;
  error: string;
  busy: boolean;
  disabled: boolean;
  ran: boolean;
}>();
defineEmits<{ run: [] }>();

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${(n / 1024).toFixed(1)} KB`);
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <div>
        <p class="title-3">Storage and objects</p>
        <p class="body-6 muted">GetStorageIDs, GetStorageInfo and root level GetObjectHandles. Looks for a settings backup object.</p>
      </div>
      <button class="btn secondary sm" type="button" :disabled="disabled" @click="$emit('run')">{{ busy ? 'Listing…' : ran ? 'List again' : 'List' }}</button>
    </div>
    <div v-if="ran && !busy" class="panel-body stack">
      <p v-if="error" class="body-6 field-error">{{ error }}</p>
      <div v-for="s in storages" :key="s.id" class="body-6">
        <span class="mono">{{ hex(s.id, 8) }}</span> · {{ s.description || 'storage' }} {{ s.volumeLabel }}
        · type {{ hex(s.storageType) }} · fs {{ hex(s.filesystemType) }} · access {{ s.accessCapability }}
      </div>
      <p v-if="!storages.length && !error" class="body-6 muted">No storage info returned.</p>
      <p class="body-6 muted">{{ objectTotal }} root level object(s){{ objectTotal > objects.length ? `, showing ${objects.length}` : '' }}.</p>
    </div>
    <div v-if="objects.length" class="table-scroll">
      <table>
        <thead><tr><th>Handle</th><th>Name</th><th>Format</th><th>Size</th></tr></thead>
        <tbody>
          <tr v-for="o in objects" :key="o.handle">
            <td class="mono">{{ hex(o.handle, 8) }}</td>
            <td>{{ o.filename }}<br /><span class="caption-5 muted">{{ o.modificationDate || o.captureDate }}</span></td>
            <td class="mono">{{ hex(o.format) }}</td>
            <td class="mono">{{ kb(o.size) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
