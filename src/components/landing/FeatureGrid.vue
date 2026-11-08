<script setup lang="ts">
import type { IconName } from '../../icons';
import AppIcon from '../AppIcon.vue';
import SectionHead from '../SectionHead.vue';

interface Feature {
  icon: IconName;
  title: string;
  body: string;
  phase?: string;
}

const features: Feature[] = [
  { icon: 'usb', title: 'Direct USB connection', body: 'Talks PTP to the camera through WebUSB. No desktop app, no driver, no wireless pairing.' },
  { icon: 'sliders', title: 'All seven slots at once', body: 'See film simulation, grain, white balance, tone and color for C1 to C7 side by side.', phase: 'Phase 2' },
  { icon: 'download', title: 'Recipes as files', body: "Export a slot to a file, share it, and load someone else's recipe into any slot.", phase: 'Phase 3' },
  { icon: 'lock', title: 'Stays on your device', body: 'Static site with no backend, no trackers and no external CDNs. Your camera data never leaves the browser.' },
  { icon: 'device-mobile', title: 'Phone friendly', body: 'Plug the camera into an Android phone with a USB C cable and edit recipes in the field.' },
  { icon: 'terminal', title: 'Open protocol notes', body: "Every finding about Fujifilm's PTP extensions is written up in the repo for others to build on." },
];
</script>

<template>
  <section class="section">
    <div class="wrap">
      <SectionHead
        eyebrow="Why darkroom"
        title="Manage recipes without the menu dial"
        lede="Setting up a recipe on the camera means a dozen menus per slot. darkroom puts all seven slots on one screen."
      />
      <div class="grid grid-3">
        <article v-for="f in features" :key="f.title" v-reveal class="card">
          <span class="card-icon"><AppIcon :name="f.icon" /></span>
          <h3 class="title-2">{{ f.title }}</h3>
          <p class="body-6">{{ f.body }}</p>
          <span v-if="f.phase" class="pill tag">{{ f.phase }}</span>
        </article>
      </div>
    </div>
  </section>
</template>
