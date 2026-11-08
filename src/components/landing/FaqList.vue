<script setup lang="ts">
import AppIcon from '../AppIcon.vue';
import SectionHead from '../SectionHead.vue';

// Answers may contain trusted inline HTML (links, emphasis) written here.
const faqs: { q: string; a: string }[] = [
  { q: 'What does it change on my camera?', a: 'Only the custom setting slots C1 to C7, and only when you load a preset and confirm. Before the first write of a session it backs up all seven slots, and after writing it reads every value back to check it. Nothing else on the camera is touched.' },
  { q: 'Which cameras work?', a: "The X100VI is confirmed. Other recent X series bodies likely use the same protocol but haven't been tested. If you try one, please open an issue with the device info from the app." },
  { q: "Why doesn't it work on my iPhone or in Safari?", a: "Those browsers don't implement WebUSB. Use Chrome or Edge on a computer, or Chrome on Android." },
  { q: 'Is my data sent anywhere?', a: 'No. The site is static files on GitHub Pages. The camera talks to your browser and nothing else, and there are no analytics.' },
  { q: 'The app says the camera is busy. What now?', a: 'Another program holds the USB connection. See <a href="#troubleshooting">troubleshooting</a> for the macOS and Android fixes.' },
  { q: 'Which Connection Mode do I need?', a: "<strong>USB RAW CONV./BACKUP RESTORE</strong>. Other modes such as USB card reader don't expose the PTP interface." },
  { q: 'Is this an official Fujifilm tool?', a: "No. It's an independent open source project, built on protocol work by FilmKit, latent and libfuji." },
];
</script>

<template>
  <section id="faq" class="section">
    <div class="wrap-narrow">
      <SectionHead eyebrow="FAQ" title="Questions" />
      <div v-reveal class="faq">
        <details v-for="f in faqs" :key="f.q">
          <summary>{{ f.q }}<AppIcon name="plus" /></summary>
          <div class="answer"><p v-html="f.a" /></div>
        </details>
      </div>
    </div>
  </section>
</template>
