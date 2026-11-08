<script setup lang="ts">
import { hex } from '../../ptp/codes';
import AppIcon from '../AppIcon.vue';

defineProps<{ items: number[] }>();
</script>

<template>
  <section class="panel">
    <details>
      <summary>Supported device properties <span class="row"><span class="pill">{{ items.length }}</span><AppIcon name="caret-down" /></span></summary>
      <div class="props mono">
        <span v-for="p in items" :key="p" class="pill">{{ hex(p) }}</span>
      </div>
    </details>
  </section>
</template>
