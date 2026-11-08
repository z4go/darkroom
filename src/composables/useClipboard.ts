import { ref } from 'vue';

export function useClipboard(resetMs = 1500) {
  const state = ref<'idle' | 'copied' | 'failed'>('idle');
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      state.value = 'copied';
    } catch {
      state.value = 'failed';
    }
    clearTimeout(timer);
    timer = setTimeout(() => (state.value = 'idle'), resetMs);
  }

  return { state, copy };
}
