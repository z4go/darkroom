import { ref } from 'vue';

export type LogFn = (line: string) => void;

export function useLog() {
  const lines = ref<string[]>([]);
  const log: LogFn = (line) => {
    const t = new Date().toISOString().slice(11, 23);
    lines.value.push(`${t}  ${line}`);
  };
  const clear = () => (lines.value = []);
  return { lines, log, clear };
}
