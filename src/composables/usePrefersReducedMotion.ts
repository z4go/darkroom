import { onMounted, onUnmounted, ref } from 'vue';

export function usePrefersReducedMotion() {
  const reduced = ref(false);
  let mq: MediaQueryList | null = null;
  const update = () => (reduced.value = !!mq?.matches);
  onMounted(() => {
    mq = matchMedia('(prefers-reduced-motion: reduce)');
    update();
    mq.addEventListener('change', update);
  });
  onUnmounted(() => mq?.removeEventListener('change', update));
  return reduced;
}
