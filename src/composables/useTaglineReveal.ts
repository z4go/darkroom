import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * Lights words up one by one, in reading order, as the element scrolls past a trigger line.
 * Scroll work is throttled through requestAnimationFrame.
 */
export function useTaglineReveal(el: Ref<HTMLElement | null>, lines: string[]) {
  const words = lines.map((line) => line.split(/\s+/));
  const total = words.reduce((n, l) => n + l.length, 0);
  const lit = ref(0);
  const reduced = usePrefersReducedMotion();

  let ticking = false;
  const update = () => {
    ticking = false;
    if (!el.value) return;
    const rect = el.value.getBoundingClientRect();
    const trigger = window.innerHeight * 0.7;
    const span = rect.height + window.innerHeight * 0.35;
    const progress = Math.min(1, Math.max(0, (trigger - rect.top) / span));
    lit.value = Math.round(progress * total);
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  });
  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  });

  /** Word list per line, each with its global index and whether it is lit. */
  const rendered = computed(() => {
    let i = 0;
    return words.map((line) => line.map((text) => ({ text, on: reduced.value || i++ < lit.value })));
  });

  return { lines: rendered };
}
