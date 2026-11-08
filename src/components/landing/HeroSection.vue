<script setup lang="ts">
import AppIcon from '../AppIcon.vue';

const proof = ['Open source, MIT', 'No account, no server', 'Works on Android Chrome'];
</script>

<template>
  <section class="hero">
    <div class="wrap">
      <span class="badge"><span class="dot" />Early preview · read only</span>
      <h1 class="heading-1"><span class="line">Your film recipes,</span><span class="line">written straight to the camera</span></h1>
      <p class="sub body-7">
        darkroom reads and writes the C1 to C7 custom settings on Fujifilm X series cameras over a USB cable.
        It runs entirely in Chrome. Nothing to install, nothing uploaded.
      </p>
      <div class="row">
        <a class="btn" href="./app/">Connect your camera <AppIcon name="arrow-right" /></a>
      </div>
      <div class="proof">
        <span v-for="p in proof" :key="p"><AppIcon name="check-circle" />{{ p }}</span>
      </div>

      <div v-reveal class="preview" aria-label="Example of the device info the app reads">
        <div class="preview-inner">
          <div class="preview-bar"><span class="dots"><i /><i /><i /></span>z4go.github.io/darkroom/app</div>
          <dl class="preview-body">
            <dt>status</dt><dd class="ok">● connected over PTP</dd>
            <dt>model</dt><dd>X100VI</dd>
            <dt>firmware</dt><dd>read from the camera</dd>
            <dt>usb</dt><dd>0x04cb · Still Image class</dd>
            <dt>slots</dt><dd>C1 · C2 · C3 · C4 · C5 · C6 · C7 <span class="muted">(Phase 2)</span></dd>
          </dl>
        </div>
      </div>
    </div>
  </section>
</template>
