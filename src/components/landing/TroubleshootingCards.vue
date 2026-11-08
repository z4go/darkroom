<script setup lang="ts">
import SectionHead from '../SectionHead.vue';

const killLoop = 'while true; do killall -9 ptpcamerad 2>/dev/null; sleep 1; done';
</script>

<template>
  <section id="troubleshooting" class="section">
    <div class="wrap">
      <SectionHead
        eyebrow="Troubleshooting"
        title="When the camera says busy"
        lede="Only one program can hold the camera's USB interface. If the app can't claim it, something else got there first."
      />
      <div class="grid grid-2">
        <article id="macos-ptpcamerad" v-reveal class="card">
          <h3 class="title-2">macOS: stop <code>ptpcamerad</code></h3>
          <p class="body-6">
            macOS runs a background daemon that grabs PTP cameras as soon as they're plugged in. Quit Photos and
            Image Capture, then keep the daemon stopped while you use darkroom:
          </p>
          <pre><code>{{ killLoop }}</code></pre>
          <p class="body-6 gap-top">Press <kbd>Ctrl</kbd> <kbd>C</kbd> when you're done. Reconnect the camera, then press Connect again.</p>
        </article>
        <article id="android-busy" v-reveal class="card">
          <h3 class="title-2">Android: close the other app</h3>
          <p class="body-6">Apps like Fuji X Weekly or a file manager may open the camera when you plug it in.</p>
          <ol class="body-6 gap-top">
            <li>Force stop any app that opened the camera.</li>
            <li>If Android asks which app to use for USB, dismiss the prompt.</li>
            <li>Reconnect the cable and press Connect again.</li>
          </ol>
        </article>
      </div>
    </div>
  </section>
</template>
