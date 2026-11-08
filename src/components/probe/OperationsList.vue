<script setup lang="ts">
import { hex, opName } from '../../ptp/codes';
import AppIcon from '../AppIcon.vue';

defineProps<{ ops: number[] }>();
const known = (op: number) => (opName(op) === hex(op) ? '' : opName(op));
</script>

<template>
  <section class="panel">
    <details>
      <summary>Supported operations <span class="row"><span class="pill">{{ ops.length }}</span><AppIcon name="caret-down" /></span></summary>
      <div class="table-scroll">
        <table>
          <tbody>
            <tr v-for="op in ops" :key="op">
              <td class="mono">{{ hex(op) }}</td>
              <td>
                <template v-if="known(op)">{{ known(op) }}</template>
                <span v-else-if="op >= 0x9000" class="pill accent">vendor</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </section>
</template>
