<script setup lang="ts">
import { computed } from 'vue';
import { useClipboard } from '../../composables/useClipboard';
import { FujiProp, USB_MODE_NAMES, hex } from '../../ptp/codes';
import type { DeviceInfo } from '../../ptp/deviceinfo';
import AppIcon from '../AppIcon.vue';

const props = defineProps<{ info: DeviceInfo; device: USBDevice; usbMode?: number | null }>();
const { state, copy } = useClipboard();

const rows = computed(() => {
  const i = props.info;
  return [
    ['Manufacturer', i.manufacturer],
    ['Model', i.model],
    ['Firmware', i.deviceVersion],
    ['Serial', i.serialNumber],
    ['USB IDs', `${hex(props.device.vendorId)}:${hex(props.device.productId)}`],
    ['PTP version', (i.standardVersion / 100).toFixed(2)],
    ['Fuji USB mode', props.usbMode == null ? 'not exposed (generic MTP mode)' : `${props.usbMode} · ${USB_MODE_NAMES[props.usbMode] ?? 'unknown'}`],
    ['Custom slots', i.devicePropertiesSupported.includes(FujiProp.CustomSlot) ? 'available (0xD18C)' : 'not available'],
    ['Vendor extension', `${hex(i.vendorExtensionId, 8)} v${i.vendorExtensionVersion}${i.vendorExtensionDesc ? ' — ' + i.vendorExtensionDesc : ''}`],
  ] as const;
});

const copyLabel = computed(() => ({ idle: 'Copy JSON', copied: 'Copied', failed: 'Copy failed' })[state.value]);
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <p class="title-3">Device</p>
      <button title="Copies device info without the serial number" class="btn secondary sm" type="button" @click="copy(JSON.stringify({ ...info, serialNumber: '(redacted)' }, null, 2))">
        <AppIcon name="copy" /><span>{{ copyLabel }}</span>
      </button>
    </div>
    <div class="panel-body">
      <dl class="kv">
        <template v-for="[k, v] in rows" :key="k">
          <dt>{{ k }}</dt>
          <dd>{{ v || '—' }}</dd>
        </template>
      </dl>
    </div>
  </section>
</template>
