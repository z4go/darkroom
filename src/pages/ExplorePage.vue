<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '../components/AppIcon.vue';
import NoticeBox from '../components/NoticeBox.vue';
import SiteFooter from '../components/SiteFooter.vue';
import SiteNav from '../components/SiteNav.vue';
import AdvertisedProps from '../components/explore/AdvertisedProps.vue';
import PropertySweep from '../components/explore/PropertySweep.vue';
import StorageObjects from '../components/explore/StorageObjects.vue';
import CameraErrorNotice from '../components/probe/CameraErrorNotice.vue';
import DeviceSummary from '../components/probe/DeviceSummary.vue';
import OperationsList from '../components/probe/OperationsList.vue';
import PropertiesList from '../components/probe/PropertiesList.vue';
import ConnectPanel from '../components/probe/ConnectPanel.vue';
import LogPanel from '../components/probe/LogPanel.vue';
import { useCamera } from '../composables/useCamera';
import { useClipboard } from '../composables/useClipboard';
import { useExplore } from '../composables/useExplore';
import { useLog } from '../composables/useLog';
import { useWebUsb } from '../composables/useWebUsb';
import { PROTOCOL, REPO } from '../links';

const { supported } = useWebUsb();
const { lines, log } = useLog();
const camera = useCamera(log);
const { status, error, info, device, usbMode, connect, disconnect, transaction } = camera;
const ex = useExplore(transaction, info, log);
const { busy, sweep } = ex;

const storageRan = ref(false);
async function listStorage() {
  storageRan.value = true;
  await ex.listStorage();
}

const { state: copyState, copy } = useClipboard();
const json = () => JSON.stringify(ex.report(), null, 2);
function download() {
  const url = URL.createObjectURL(new Blob([json()], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `darkroom-explore-${info.value?.model ?? 'camera'}-${info.value?.deviceVersion ?? ''}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <SiteNav
    home="../../"
    :links="[
      { label: 'App', href: '../' },
      { label: 'Explore', href: './', current: true },
      { label: 'Protocol', href: PROTOCOL },
      { label: 'GitHub', href: REPO },
    ]"
  />

  <main id="main" class="wrap-narrow">
    <header class="app-head">
      <span class="eyebrow">Developer tools · Protocol explorer</span>
      <h1 class="heading-4" style="margin-top: var(--s-100)">Find where the custom settings live</h1>
      <p class="body-3">Read only. The app refuses to send any command that could change the camera.</p>
    </header>

    <div class="stack">
      <NoticeBox v-if="!supported" title="This browser can't talk to USB devices" variant="error" icon="globe" role="alert">
        Open this page in Chrome or Edge on a computer, or Chrome on Android.
      </NoticeBox>

      <template v-else>
        <ConnectPanel :status="status" :model="info?.model" @connect="connect" @disconnect="disconnect" />
        <CameraErrorNotice v-if="error" :error="error" />

        <template v-if="status === 'connected' && info">
          <DeviceSummary v-if="device" :info="info" :device="device" :usb-mode="usbMode" />
          <OperationsList :ops="info.operationsSupported" />
          <PropertiesList :items="info.devicePropertiesSupported" />
          <AdvertisedProps
            :results="ex.props.value"
            :count="info.devicePropertiesSupported.length"
            :busy="busy === 'props'"
            :disabled="!!busy"
            @run="ex.readAdvertised"
          />
          <PropertySweep
            :sweep="sweep"
            :compared-with="ex.baseline.value?.at ?? null"
            :gone="ex.gone.value"
            :busy="busy === 'sweep'"
            :disabled="!!busy"
            @run="ex.runSweep"
            @stop="ex.stopSweep"
            @range="(a, b) => Object.assign(sweep, { from: a, to: b })"
          />
          <StorageObjects
            :storages="ex.storages.value"
            :objects="ex.objects.value"
            :object-total="ex.objectTotal.value"
            :error="ex.storageError.value"
            :busy="busy === 'storage'"
            :disabled="!!busy"
            :ran="storageRan"
            @run="listStorage"
          />

          <section class="panel">
            <div class="panel-body connect-panel-row">
              <div>
                <p class="title-3">Export results</p>
                <p class="body-6 muted">Everything above as JSON, serial number redacted. Attach it to an issue or add it to PROTOCOL.md.</p>
              </div>
              <div class="row">
                <button class="btn secondary sm" type="button" :disabled="!!busy" @click="copy(json())">
                  <AppIcon name="copy" />{{ { idle: 'Copy JSON', copied: 'Copied', failed: 'Copy failed' }[copyState] }}
                </button>
                <button class="btn sm" type="button" :disabled="!!busy" @click="download"><AppIcon name="download" />Download</button>
              </div>
            </div>
          </section>
        </template>

        <section v-else-if="status !== 'connecting'" class="panel empty" aria-label="Getting started">
          <p class="title-2">Connect the camera to start exploring</p>
          <p class="body-6">Same setup as the probe: Connection Mode USB RAW CONV./BACKUP RESTORE, and nothing else holding the camera.</p>
        </section>
      </template>

      <LogPanel :lines="lines" />
    </div>
  </main>

  <SiteFooter
    note="Read only explorer · Unofficial protocol"
    :links="[
      { label: 'Home', href: '../../' },
      { label: 'Privacy', href: '../../privacy/' },
      { label: 'GitHub', href: REPO },
    ]"
  />
</template>
