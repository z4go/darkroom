<script setup lang="ts">
import SectionHead from '../SectionHead.vue';

const cameras = [
  { name: 'X100VI', firmware: '{{firmware}}', status: 'Confirmed', ok: true },
  { name: 'Other X Trans V bodies', firmware: 'None yet', status: 'Untested', ok: false },
];
const browsers = [
  { name: 'Chrome, Edge', platform: 'macOS, Windows, Linux', ok: true },
  { name: 'Chrome', platform: 'Android', ok: true },
  { name: 'Safari, Firefox', platform: 'Any', ok: false },
  { name: 'Any browser', platform: 'iOS, iPadOS', ok: false },
];
</script>

<template>
  <section id="compat" class="section">
    <div class="wrap">
      <SectionHead eyebrow="Compatibility" title="Cameras and browsers" />
      <div class="grid grid-2">
        <div v-reveal class="table-card">
          <div class="table-scroll">
            <table>
              <thead><tr><th>Camera</th><th>Firmware tested</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="c in cameras" :key="c.name">
                  <td>{{ c.name }}</td>
                  <td :class="c.ok ? 'mono' : 'muted'">{{ c.firmware }}</td>
                  <td><span class="pill" :class="{ ok: c.ok }">{{ c.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-reveal class="table-card">
          <div class="table-scroll">
            <table>
              <thead><tr><th>Browser</th><th>Platform</th><th>WebUSB</th></tr></thead>
              <tbody>
                <tr v-for="b in browsers" :key="b.name + b.platform">
                  <td>{{ b.name }}</td>
                  <td>{{ b.platform }}</td>
                  <td><span class="pill" :class="{ ok: b.ok }">{{ b.ok ? 'Supported' : 'Not supported' }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
