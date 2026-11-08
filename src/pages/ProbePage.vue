<script setup lang="ts">
import NoticeBox from '../components/NoticeBox.vue';
import SiteFooter from '../components/SiteFooter.vue';
import SiteNav from '../components/SiteNav.vue';
import CameraErrorNotice from '../components/probe/CameraErrorNotice.vue';
import ConnectPanel from '../components/probe/ConnectPanel.vue';
import DeviceSummary from '../components/probe/DeviceSummary.vue';
import EmptyState from '../components/probe/EmptyState.vue';
import LoadingSkeleton from '../components/probe/LoadingSkeleton.vue';
import LogPanel from '../components/probe/LogPanel.vue';
import OperationsList from '../components/probe/OperationsList.vue';
import PropertiesList from '../components/probe/PropertiesList.vue';
import { useCamera } from '../composables/useCamera';
import { useLog } from '../composables/useLog';
import { useWebUsb } from '../composables/useWebUsb';
import { PROTOCOL, REPO } from '../links';

const { supported } = useWebUsb();
const { lines, log } = useLog();
const { status, error, info, device, connect, disconnect } = useCamera(log);
</script>

<template>
  <SiteNav
    home="../"
    :links="[
      { label: 'App', href: './', current: true },
      { label: 'Setup', href: '../#how' },
      { label: 'Troubleshooting', href: '../#troubleshooting' },
      { label: 'GitHub', href: REPO },
    ]"
  />

  <main id="main" class="wrap-narrow">
    <header class="app-head">
      <span class="eyebrow">Camera probe</span>
      <h1 class="heading-4" style="margin-top: var(--s-100)">Read your camera's device info</h1>
      <p class="body-3">Read only. Nothing is written to the camera.</p>
    </header>

    <div class="stack">
      <NoticeBox v-if="!supported" title="This browser can't talk to USB devices" variant="error" icon="globe" role="alert">
        Open this page in Chrome or Edge on a computer, or Chrome on Android. Safari, Firefox and all iOS browsers
        don't support WebUSB.
      </NoticeBox>

      <template v-else>
        <ConnectPanel :status="status" :model="info?.model" @connect="connect" @disconnect="disconnect" />
        <CameraErrorNotice v-if="error" :error="error" />

        <LoadingSkeleton v-if="status === 'connecting'" />
        <div v-else-if="info && device" class="stack">
          <DeviceSummary :info="info" :device="device" />
          <OperationsList :ops="info.operationsSupported" />
          <PropertiesList :items="info.devicePropertiesSupported" />
        </div>
        <EmptyState v-else />
      </template>

      <LogPanel :lines="lines" />
    </div>
  </main>

  <SiteFooter
    note="Unofficial protocol · Back up your settings first"
    :links="[
      { label: 'Home', href: '../' },
      { label: 'Protocol', href: PROTOCOL },
      { label: 'Privacy', href: '../privacy/' },
      { label: 'GitHub', href: REPO },
    ]"
  />
</template>
