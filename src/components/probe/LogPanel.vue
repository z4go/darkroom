<script setup lang="ts">
import AppIcon from '../AppIcon.vue';

defineProps<{ lines: string[] }>();
</script>

<template>
  <section class="panel">
    <details>
      <summary>Log <AppIcon name="caret-down" /></summary>
      <pre class="log"><code>{{ lines.length ? lines.join('\n') : 'No activity yet.' }}</code></pre>
    </details>
  </section>
</template>
