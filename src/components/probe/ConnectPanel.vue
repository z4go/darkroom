<script setup lang="ts">
import type { CameraStatus } from '../../composables/useCamera';
import AppIcon from '../AppIcon.vue';

defineProps<{ status: CameraStatus; model?: string }>();
defineEmits<{ connect: []; disconnect: [] }>();
</script>

<template>
  <section class="panel connect-panel" aria-label="Connection">
    <div class="panel-body">
      <div>
        <p class="title-3">Fujifilm camera</p>
        <p class="body-6 muted" style="margin-top: var(--s-25)">
          Connection Mode: USB RAW CONV./BACKUP RESTORE · <a href="../#camera-setup">Setup help</a>
        </p>
        <p class="status-dot" :class="{ on: status === 'connected' }" style="margin-top: var(--s-75)">
          <template v-if="status === 'connected'">Connected · {{ model || 'camera' }}</template>
          <template v-else-if="status === 'connecting'">Connecting…</template>
          <template v-else>Not connected</template>
        </p>
      </div>
      <div class="row">
        <button v-if="status !== 'connected'" class="btn" type="button" :disabled="status === 'connecting'" @click="$emit('connect')">
          <AppIcon name="plugs-connected" />Connect camera
        </button>
        <button v-else class="btn secondary" type="button" @click="$emit('disconnect')">
          <AppIcon name="plugs" />Disconnect
        </button>
      </div>
    </div>
  </section>
</template>
