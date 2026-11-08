import { computed } from 'vue';
import { clonePreset, newId, normalizePreset, type Preset } from '../ptp/preset';
import type { SlotRaw } from '../ptp/recipe';
import { downloadJson, useStoredRef } from './useStoredRef';

export interface SlotBackup {
  takenAt: string;
  model: string;
  firmware: string;
  slots: { slot: number; name: string; raw: SlotRaw }[];
}

const BACKUP_KEEP = 10;

/** Presets and slot backups, kept in this browser (localStorage). */
export function usePresetLibrary() {
  const { value: presets, persisted } = useStoredRef<Preset[]>('darkroom.presets.v1', []);
  const { value: backups } = useStoredRef<SlotBackup[]>('darkroom.backups.v1', []);

  const sorted = computed(() => [...presets.value].sort((a, b) => a.name.localeCompare(b.name)));

  function save(p: Preset) {
    const next = { ...p, updatedAt: new Date().toISOString() };
    const i = presets.value.findIndex((x) => x.id === p.id);
    if (i >= 0) presets.value.splice(i, 1, next);
    else presets.value.push(next);
    return next;
  }

  function remove(id: string) {
    presets.value = presets.value.filter((p) => p.id !== id);
  }

  function duplicate(p: Preset) {
    return save({ ...clonePreset(p), id: newId(), name: `${p.name} copy`.slice(0, 25) });
  }

  function exportAll() {
    downloadJson(`darkroom-presets-${new Date().toISOString().slice(0, 10)}.json`, { format: 'darkroom-presets', version: 1, presets: presets.value });
  }

  function exportOne(p: Preset) {
    downloadJson(`${p.name.replace(/[^\w.-]+/g, '_') || 'preset'}.json`, { format: 'darkroom-presets', version: 1, presets: [p] });
  }

  /** Accepts our export format, a bare array, or a single preset. Returns how many were added. */
  async function importFile(file: File): Promise<{ added: number; skipped: number }> {
    const data = JSON.parse(await file.text()) as unknown;
    const list: unknown[] = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && Array.isArray((data as { presets?: unknown }).presets)
        ? (data as { presets: unknown[] }).presets
        : [data];
    let added = 0;
    for (const x of list) {
      const p = normalizePreset(x);
      if (p) {
        save(p);
        added++;
      }
    }
    return { added, skipped: list.length - added };
  }

  function addBackup(b: SlotBackup) {
    backups.value = [b, ...backups.value].slice(0, BACKUP_KEEP);
  }

  function downloadBackup(b: SlotBackup) {
    downloadJson(`darkroom-backup-${b.model}-${b.takenAt.replace(/[:.]/g, '-')}.json`, { format: 'darkroom-slot-backup', version: 1, ...b });
  }

  return { presets: sorted, persisted, save, remove, duplicate, exportAll, exportOne, importFile, backups, addBackup, downloadBackup };
}
