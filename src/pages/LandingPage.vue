<script setup lang="ts">
import NoticeBox from '../components/NoticeBox.vue';
import SiteFooter from '../components/SiteFooter.vue';
import SiteNav from '../components/SiteNav.vue';
import CompatibilityTables from '../components/landing/CompatibilityTables.vue';
import CtaBand from '../components/landing/CtaBand.vue';
import FaqList from '../components/landing/FaqList.vue';
import FeatureGrid from '../components/landing/FeatureGrid.vue';
import HeroSection from '../components/landing/HeroSection.vue';
import HowItWorks from '../components/landing/HowItWorks.vue';
import TaglineReveal from '../components/landing/TaglineReveal.vue';
import TroubleshootingCards from '../components/landing/TroubleshootingCards.vue';
import { LICENSE, PROTOCOL, REPO } from '../links';
</script>

<template>
  <SiteNav
    home="./"
    :links="[
      { label: 'How it works', href: '#how' },
      { label: 'Compatibility', href: '#compat' },
      { label: 'FAQ', href: '#faq' },
      { label: 'GitHub', href: REPO },
    ]"
    :cta="{ label: 'Open app', href: './app/' }"
  />

  <main id="main">
    <HeroSection />
    <FeatureGrid />
    <TaglineReveal :lines="['Seven custom slots. One cable.', 'Every recipe exactly where you left it.']" />
    <HowItWorks />
    <CompatibilityTables />
    <TroubleshootingCards />

    <section id="safety" class="section">
      <div class="wrap">
        <NoticeBox v-reveal title="Back up your settings before writing anything">
          darkroom uses an unofficial, reverse engineered protocol and isn't affiliated with or endorsed by Fujifilm.
          Writing settings this way could leave the camera in a bad state and may affect your warranty. Save a backup
          with the camera's Save/Load settings menu or Fujifilm X Acquire first.
        </NoticeBox>
      </div>
    </section>

    <FaqList />
    <CtaBand />
  </main>

  <SiteFooter
    note="darkroom · Not affiliated with Fujifilm"
    :links="[
      { label: 'Protocol', href: PROTOCOL },
      { label: 'MIT license', href: LICENSE },
      { label: 'GitHub', href: REPO },
    ]"
  />
</template>
