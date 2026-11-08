<script setup lang="ts">
import SiteFooter from '../components/SiteFooter.vue';
import SiteNav from '../components/SiteNav.vue';
import { LICENSE, REPO } from '../links';
</script>

<template>
  <SiteNav
    home="../"
    :links="[
      { label: 'App', href: '../app/' },
      { label: 'Privacy', href: './', current: true },
      { label: 'GitHub', href: REPO },
    ]"
  />

  <main id="main" class="wrap-narrow legal">
    <header class="app-head">
      <span class="eyebrow">Privacy</span>
      <h1 class="heading-4">darkroom collects nothing</h1>
      <p class="body-3">Last updated 8 November 2026</p>
    </header>

    <section>
      <h2 class="heading-6">What runs where</h2>
      <p class="body-3 muted">
        darkroom is a set of static files served by GitHub Pages. All camera communication happens inside your
        browser over WebUSB. Device info, settings and recipes are never sent to a server, because there is no server.
      </p>
    </section>
    <section>
      <h2 class="heading-6">No tracking</h2>
      <p class="body-3 muted">
        There are no analytics, cookies, ads or third party scripts. Fonts and icons are bundled with the site, so the
        page makes no requests outside z4go.github.io.
      </p>
    </section>
    <section>
      <h2 class="heading-6">GitHub Pages</h2>
      <p class="body-3 muted">
        GitHub hosts the site and may log standard request data such as IP addresses, as described in the
        <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub privacy statement</a>.
      </p>
    </section>
    <section>
      <h2 class="heading-6">Terms</h2>
      <p class="body-3 muted">
        darkroom is provided as is under the <a :href="LICENSE">MIT license</a>, without warranty. It uses an unofficial
        protocol and isn't affiliated with Fujifilm. Back up your camera settings before writing anything.
      </p>
    </section>
  </main>

  <SiteFooter
    note="darkroom · Not affiliated with Fujifilm"
    :links="[
      { label: 'Home', href: '../' },
      { label: 'MIT license', href: LICENSE },
      { label: 'GitHub', href: REPO },
    ]"
  />
</template>
