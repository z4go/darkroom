<script setup lang="ts">
import { ref } from 'vue';
import { useTaglineReveal } from '../../composables/useTaglineReveal';

const props = defineProps<{ lines: string[] }>();
const el = ref<HTMLElement | null>(null);
const { lines } = useTaglineReveal(el, props.lines);
</script>

<template>
  <section class="tagline">
    <div class="wrap">
      <p ref="el" class="heading-2">
        <template v-for="(line, li) in lines" :key="li">
          <br v-if="li > 0" />
          <template v-for="(w, wi) in line" :key="wi">
            <span class="word" :class="{ on: w.on }">{{ w.text }}</span>{{ ' ' }}
          </template>
        </template>
      </p>
    </div>
  </section>
</template>
