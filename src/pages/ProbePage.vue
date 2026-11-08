<script setup lang="ts">
import { computed, ref } from 'vue';
import NoticeBox from '../components/NoticeBox.vue';
import SiteFooter from '../components/SiteFooter.vue';
import SiteNav from '../components/SiteNav.vue';
import BatchLoadPanel from '../components/presets/BatchLoadPanel.vue';
import PresetLibrary from '../components/presets/PresetLibrary.vue';
import WriteConfirmDialog from '../components/presets/WriteConfirmDialog.vue';
import CameraErrorNotice from '../components/probe/CameraErrorNotice.vue';
import ConnectPanel from '../components/probe/ConnectPanel.vue';
import CustomSlotsPanel from '../components/probe/CustomSlotsPanel.vue';
import EmptyState from '../components/probe/EmptyState.vue';
import LoadingSkeleton from '../components/probe/LoadingSkeleton.vue';
import LogPanel from '../components/probe/LogPanel.vue';
import { useCamera } from '../composables/useCamera';
import { useCustomSlots, type SlotData } from '../composables/useCustomSlots';
import { useLog } from '../composables/useLog';
import { usePresetLibrary } from '../composables/usePresetLibrary';
import { useWebUsb } from '../composables/useWebUsb';
import { PROTOCOL, REPO } from '../links';
import { presetFromRaw, type Preset } from '../ptp/preset';

const { supported } = useWebUsb();
const { lines, log } = useLog();
const { status, error, info, device, connect, disconnect, transaction, selectCustomSlot, writeProp } = useCamera(log);
const library = usePresetLibrary();
const slots = useCustomSlots(transaction, selectCustomSlot, writeProp, info, log, library.addBackup);
const libraryRef = ref<InstanceType<typeof PresetLibrary> | null>(null);

function saveSlot(s: SlotData) {
  const p = presetFromRaw(s.name || `C${s.slot}`, s.raw, `${info.value?.model ?? 'camera'} C${s.slot}`);
  library.save(p);
  libraryRef.value?.edit(p);
  document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' });
}

// Write confirmation
const pending = ref<{ slot: number; preset: Preset } | null>(null);
const pendingName = computed(() => slots.slots.value.find((s) => s.slot === pending.value?.slot)?.name ?? '');
function askLoad(slot: number, presetId: string) {
  const preset = library.all.value.find((p) => p.id === presetId);
  if (preset) pending.value = { slot, preset };
}
async function confirmLoad() {
  const job = pending.value;
  pending.value = null;
  if (job) await slots.writePreset(job.slot, job.preset);
}
</script>

<template>
  <SiteNav
    home="../"
    :links="[
      { label: 'App', href: './', current: true },
      { label: 'Setup', href: '../#how' },
      { label: 'GitHub', href: REPO },
    ]"
  />

  <main id="main" class="wrap-narrow">
    <header class="app-head">
      <span class="eyebrow">Camera and presets</span>
      <h1 class="heading-4" style="margin-top: var(--s-100)">Your recipes, on the camera</h1>
      <p class="body-3">Read the custom settings on your camera, keep presets here, and load them into any slot.</p>
    </header>

    <div class="stack">
      <NoticeBox v-if="!supported" title="This browser can't talk to USB devices" variant="error" icon="globe" role="alert">
        You can still manage presets below. To read or write the camera, open this page in Chrome or Edge on a computer, or
        Chrome on Android.
      </NoticeBox>

      <template v-else>
        <ConnectPanel :status="status" :model="info?.model" @connect="connect" @disconnect="disconnect" />
        <CameraErrorNotice v-if="error" :error="error" />

        <LoadingSkeleton v-if="status === 'connecting'" />
        <template v-else-if="status === 'connected' && info && device">
          <CustomSlotsPanel
            v-if="slots.supported.value"
            :slots="slots.slots.value"
            :presets="library.all.value"
            :busy="slots.busy.value"
            :progress="slots.progress.value"
            :error="slots.error.value"
            :last-write="slots.lastWrite.value"
            :backup-taken="slots.backupTaken.value"
            @current="slots.readCurrent"
            @all="slots.readAll"
            @save="saveSlot"
            @load="askLoad"
          />
          <BatchLoadPanel
            v-if="slots.supported.value && slots.slots.value.length"
            :slots="slots.slots.value"
            :presets="library.all.value"
            :busy="slots.busy.value"
            :batch="slots.batch.value"
            :backup-taken="slots.backupTaken.value"
            :sets="library.sets.value"
            @run="slots.writeMany"
          />
          <NoticeBox v-if="!slots.supported.value" title="Custom settings aren't available in this connection" icon="warning">
            The camera didn't advertise 0xD18C. Unplug it, check Connection Mode is USB RAW CONV./BACKUP RESTORE, start
            <code>bun run free-camera</code> before plugging in again (macOS), then reconnect.
          </NoticeBox>
        </template>
        <EmptyState v-else />
      </template>

      <PresetLibrary ref="libraryRef" :library="library" />
      <LogPanel v-if="supported" :lines="lines" />
    </div>

    <WriteConfirmDialog
      :open="!!pending"
      :slot="pending?.slot ?? 0"
      :current-name="pendingName"
      :preset="pending?.preset ?? null"
      :backup-taken="slots.backupTaken.value"
      @confirm="confirmLoad"
      @cancel="pending = null"
    />
  </main>

  <SiteFooter
    note="Unofficial protocol · Back up your settings first"
    :links="[
      { label: 'Home', href: '../' },
      { label: 'Protocol', href: PROTOCOL },
      { label: 'Privacy', href: '../privacy/' },
      { label: 'Developer tools', href: './explore/' },
      { label: 'GitHub', href: REPO },
    ]"
  />
</template>
