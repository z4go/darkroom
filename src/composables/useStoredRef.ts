import { ref, watch, type Ref } from 'vue';

/**
 * A ref persisted to localStorage. Storage can be unavailable (private mode, blocked site data),
 * so every access is guarded and the app keeps working in memory.
 */
export function useStoredRef<T>(key: string, initial: T): { value: Ref<T>; persisted: Ref<boolean> } {
  const persisted = ref(true);
  let start = initial;
  try {
    const s = localStorage.getItem(key);
    if (s) start = JSON.parse(s) as T;
  } catch {
    persisted.value = false;
  }
  const value = ref(start) as Ref<T>;
  watch(
    value,
    (v) => {
      try {
        localStorage.setItem(key, JSON.stringify(v));
        persisted.value = true;
      } catch {
        persisted.value = false;
      }
    },
    { deep: true },
  );
  return { value, persisted };
}

export function downloadJson(filename: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
