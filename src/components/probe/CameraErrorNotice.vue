<script setup lang="ts">
import { computed } from 'vue';
import type { CameraError } from '../../composables/useCamera';
import NoticeBox from '../NoticeBox.vue';

const props = defineProps<{ error: CameraError }>();

const title = computed(
  () =>
    ({
      busy: 'The camera is busy',
      cancelled: 'No camera selected',
      denied: 'Access to the camera was denied',
      unplugged: 'Camera unplugged',
      other: "Couldn't read the camera",
    })[props.error.kind],
);
</script>

<template>
  <NoticeBox :title="title" variant="error" role="alert">
    <template v-if="error.kind === 'busy'">
      <p>Another program is holding its USB connection.</p>
      <ul>
        <li><strong>macOS:</strong> quit Photos and Image Capture, then stop <code>ptpcamerad</code> (<a href="../#macos-ptpcamerad">how</a>). Reconnect the camera.</li>
        <li><strong>Android:</strong> force stop apps like Fuji X Weekly or a file manager that opened the camera, then reconnect.</li>
        <li><strong>Windows:</strong> close Fujifilm desktop apps and photo importers.</li>
      </ul>
    </template>
    <p v-else-if="error.kind === 'cancelled'">If the camera wasn't in the list, check the cable and Connection Mode.</p>
    <p v-else-if="error.kind === 'denied'">
      On macOS this usually means <code>ptpcamerad</code> has the camera. See <a href="../#macos-ptpcamerad">the workaround</a>.
    </p>
    <p v-else-if="error.kind === 'unplugged'">Reconnect the cable and press Connect camera.</p>
    <p v-else>{{ error.message }}. Open the log below for details.</p>
  </NoticeBox>
</template>
