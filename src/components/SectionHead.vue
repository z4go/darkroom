<script setup lang="ts">
defineProps<{ eyebrow: string; title: string; lede?: string }>();
</script>

<template>
  <div v-reveal class="section-head">
    <span class="eyebrow">{{ eyebrow }}</span>
    <h2 class="heading-3">{{ title }}</h2>
    <p v-if="lede" class="body-3 muted">{{ lede }}</p>
  </div>
</template>
