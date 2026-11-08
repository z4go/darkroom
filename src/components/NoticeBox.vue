<script setup lang="ts">
import type { IconName } from '../icons';
import AppIcon from './AppIcon.vue';

withDefaults(defineProps<{ title: string; variant?: 'warn' | 'error'; icon?: IconName }>(), {
  variant: 'warn',
  icon: 'warning',
});
</script>

<template>
  <div class="notice" :class="{ error: variant === 'error' }">
    <AppIcon :name="icon" />
    <div class="notice-body">
      <p class="title-3">{{ title }}</p>
      <div class="body-6 muted"><slot /></div>
    </div>
  </div>
</template>
