<script setup lang="ts">
import { useMobileNav } from '../composables/useMobileNav';
import AppIcon from './AppIcon.vue';

export interface NavLink {
  label: string;
  href: string;
  current?: boolean;
}

defineProps<{
  home: string;
  homeCurrent?: boolean;
  links: NavLink[];
  cta?: NavLink;
}>();

const { open, toggle, close } = useMobileNav();
</script>

<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="nav-shell">
    <nav class="nav" aria-label="Main">
      <a class="brand" :href="home" :aria-current="homeCurrent ? 'page' : undefined"><AppIcon name="aperture" class="brand-mark" />darkroom</a>
      <div class="nav-links">
        <a v-for="l in links" :key="l.href" :href="l.href" :aria-current="l.current ? 'page' : undefined">{{ l.label }}</a>
        <a v-if="cta" class="btn sm" :href="cta.href">{{ cta.label }}</a>
      </div>
      <button
        class="nav-toggle"
        type="button"
        :aria-label="open ? 'Close menu' : 'Open menu'"
        :aria-expanded="open"
        aria-controls="mobile-menu"
        @click="toggle"
      >
        <span /><span />
      </button>
    </nav>
  </div>
  <div id="mobile-menu" class="mobile-menu">
    <a v-if="cta" :href="cta.href" @click="close">{{ cta.label }}</a>
    <a v-for="l in links" :key="l.href" :href="l.href" @click="close">{{ l.label }}</a>
  </div>
</template>
