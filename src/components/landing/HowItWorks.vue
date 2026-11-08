<script setup lang="ts">
import SectionHead from '../SectionHead.vue';
</script>

<template>
  <section id="how" class="section">
    <div class="wrap">
      <SectionHead eyebrow="How it works" title="Connected in three steps" />
      <div class="grid grid-3">
        <article id="camera-setup" v-reveal class="card">
          <span class="step-num">1</span>
          <h3 class="title-2">Set Connection Mode</h3>
          <p class="body-6">
            On the camera open <strong>MENU → Network/USB Setting → Connection Mode</strong> and choose
            <strong>USB RAW CONV./BACKUP RESTORE</strong>.
          </p>
        </article>
        <article v-reveal class="card">
          <span class="step-num">2</span>
          <h3 class="title-2">Plug in a data cable</h3>
          <p class="body-6">Use a USB C cable that carries data, not a charge only cable. Close Photos, Image Capture and other camera apps.</p>
        </article>
        <article v-reveal class="card">
          <span class="step-num">3</span>
          <h3 class="title-2">Connect in the app</h3>
          <p class="body-6">Open the app in Chrome or Edge, press <strong>Connect camera</strong> and pick the Fujifilm device.</p>
        </article>
      </div>
    </div>
  </section>
</template>
