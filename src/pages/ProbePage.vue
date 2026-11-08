<script setup lang="ts">
import NoticeBox from '../components/NoticeBox.vue';
import SiteFooter from '../components/SiteFooter.vue';
import SiteNav from '../components/SiteNav.vue';
import CameraErrorNotice from '../components/probe/CameraErrorNotice.vue';
import CustomSlotsPanel from '../components/probe/CustomSlotsPanel.vue';
import ConnectPanel from '../components/probe/ConnectPanel.vue';
import DeviceSummary from '../components/probe/DeviceSummary.vue';
import EmptyState from '../components/probe/EmptyState.vue';
import LoadingSkeleton from '../components/probe/LoadingSkeleton.vue';
import LogPanel from '../components/probe/LogPanel.vue';
import OperationsList from '../components/probe/OperationsList.vue';
import PropertiesList from '../components/probe/PropertiesList.vue';
import { useCamera } from '../composables/useCamera';
import { useCustomSlots } from '../composables/useCustomSlots';
import { useLog } from '../composables/useLog';
import { useWebUsb } from '../composables/useWebUsb';
import { PROTOCOL, REPO } from '../links';

const { supported } = useWebUsb();
const { lines, log } = useLog();
const { status, error, info, device, usbMode, connect, disconnect, transaction, selectCustomSlot } = useCamera(log);
const slots = useCustomSlots(transaction, selectCustomSlot, info, log);
</script>

<template>
  <SiteNav
    home="../"
    :links="[
      { label: 'Probe', href: './', current: true },
      { label: 'Explore', href: './explore/' },
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
          <DeviceSummary :info="info" :device="device" :usb-mode="usbMode" />
          <CustomSlotsPanel
            v-if="slots.supported.value"
            :recipes="slots.recipes.value"
            :busy="slots.busy.value"
            :progress="slots.progress.value"
            :error="slots.error.value"
            @current="slots.readCurrent"
            @all="slots.readAll"
          />
          <NoticeBox v-else title="Custom settings aren't available in this connection" icon="warning">
            The camera didn't advertise 0xD18C. Unplug it, check Connection Mode is USB RAW CONV./BACKUP RESTORE, start
            <code>bun run free-camera</code> before plugging in again (macOS), then reconnect.
          </NoticeBox>
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
