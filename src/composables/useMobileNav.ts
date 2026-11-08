import { onMounted, onUnmounted, ref, watch } from 'vue';

/** Open/close state for the full-height mobile menu. Locks page scroll while open. */
export function useMobileNav() {
  const open = ref(false);
  const toggle = () => (open.value = !open.value);
  const close = () => (open.value = false);

  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
  onMounted(() => document.addEventListener('keydown', onKey));
  onUnmounted(() => document.removeEventListener('keydown', onKey));

  watch(open, (v) => {
    document.body.classList.toggle('nav-open', v);
    document.documentElement.style.overflow = v ? 'hidden' : '';
  });

  return { open, toggle, close };
}
