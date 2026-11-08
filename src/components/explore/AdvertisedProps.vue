<script setup lang="ts">
import type { PropResult } from '../../composables/useExplore';
import { hex, propName } from '../../ptp/codes';
import { fmtForm, fmtValue } from './format';

defineProps<{ results: PropResult[]; count: number; busy: boolean; disabled: boolean }>();
defineEmits<{ run: [] }>();
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <div>
        <p class="title-3">Advertised properties</p>
        <p class="body-6 muted">GetDevicePropDesc for the {{ count }} properties listed in DeviceInfo.</p>
      </div>
      <button class="btn secondary sm" type="button" :disabled="disabled" @click="$emit('run')">
        {{ busy ? 'Reading…' : results.length ? 'Read again' : 'Read' }}
      </button>
    </div>
    <div v-if="results.length" class="table-scroll">
      <table>
        <thead><tr><th>Code</th><th>Type</th><th>Current</th><th>Details</th></tr></thead>
        <tbody>
          <tr v-for="p in results" :key="p.code">
            <td class="mono">{{ hex(p.code) }}<br /><span class="caption-5 muted">{{ propName(p.code) }}</span></td>
            <template v-if="p.desc">
              <td class="mono">{{ p.desc.dataTypeName }}<br /><span class="caption-5 muted">{{ p.desc.writable ? 'get/set' : 'get' }}</span></td>
              <td class="mono">{{ fmtValue(p.desc.current) }}</td>
              <td class="body-6">
                <span class="muted">default</span> <span class="mono">{{ fmtValue(p.desc.factoryDefault) }}</span>
                <template v-if="fmtForm(p.desc.form)"><br /><span class="mono">{{ fmtForm(p.desc.form) }}</span></template>
              </td>
            </template>
            <template v-else>
              <td colspan="3" class="body-6">
                <span class="pill">{{ p.error }}</span>
                <div v-if="p.raw" class="mono caption-5 hexline">{{ p.raw }}</div>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
