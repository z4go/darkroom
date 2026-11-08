<script setup lang="ts">
import type { NavLink } from './SiteNav.vue';

defineProps<{ note: string; links: NavLink[] }>();
</script>

<template>
  <footer class="footer">
    <div class="wrap">
      <span>{{ note }}</span>
      <nav aria-label="Footer">
        <a v-for="l in links" :key="l.href" :href="l.href">{{ l.label }}</a>
      </nav>
    </div>
  </footer>
</template>
