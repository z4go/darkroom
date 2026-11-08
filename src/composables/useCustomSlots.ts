import { computed, ref, type ShallowRef } from 'vue';
import { FujiProp, OpCode, hex } from '../ptp/codes';
import type { DeviceInfo } from '../ptp/deviceinfo';
import { presetWrites, validatePreset, type Preset } from '../ptp/preset';
import { decodeSlot, GRAIN_OFF_VALUES, SLOT_FIRST_FIELD, SLOT_LAST_FIELD, SLOT_NAME, type Recipe, type SlotRaw } from '../ptp/recipe';
import { Reader } from '../ptp/reader';
import { PtpError, type PtpResult } from '../ptp/transport';
import type { LogFn } from './useLog';
import type { SlotBackup } from './usePresetLibrary';

type Transaction = (op: number, params?: number[]) => Promise<PtpResult>;

export interface SlotData {
  slot: number;
  name: string;
  raw: SlotRaw;
  recipe: Recipe;
}

export interface WriteResult {
  ok: boolean;
  slot: number;
  name: string;
  warnings: string[];
  mismatches: string[];
  error?: string;
}

const SETTLE_MS = 100; // FilmKit waits this long after switching slots
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function u16(value: number) {
  const d = new DataView(new ArrayBuffer(2));
  d.setUint16(0, value & 0xffff, true);
  return d;
}

/** PTP string: u8 char count incl. NUL, UTF-16LE chars, NUL. Empty string is a single 0x00. */
function ptpString(s: string) {
  if (!s) return new DataView(new Uint8Array([0]).buffer);
  const d = new DataView(new ArrayBuffer(1 + (s.length + 1) * 2));
  d.setUint8(0, s.length + 1);
  for (let i = 0; i < s.length; i++) d.setUint16(1 + i * 2, s.charCodeAt(i), true);
  return d;
}

const describe = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Custom slots C1–C7: read (switching via 0xD18C and restoring) and write a preset into one slot.
 * Writes follow FilmKit's writePreset, plus: a full backup before the first write of the session,
 * read back verification of every field, and restoring the originally selected slot.
 */
export function useCustomSlots(
  transaction: Transaction,
  selectCustomSlot: (slot: number) => Promise<void>,
  writeProp: (code: number, data: DataView) => Promise<void>,
  info: ShallowRef<DeviceInfo | null>,
  log: LogFn,
  onBackup: (b: SlotBackup) => void,
) {
  const slots = ref<SlotData[]>([]);
  const recipes = computed(() => slots.value.map((s) => s.recipe));
  const busy = ref<null | 'current' | 'all' | 'write'>(null);
  const progress = ref(0);
  const error = ref('');
  const lastWrite = ref<WriteResult | null>(null);
  const backupTaken = ref(false);
  const supported = computed(() => !!info.value?.devicePropertiesSupported.includes(FujiProp.CustomSlot));

  async function readU16(code: number) {
    const r = await transaction(OpCode.GetDevicePropValue, [code]);
    if (!r.data || r.data.byteLength < 2) throw new Error(`${hex(code)} returned ${r.data?.byteLength ?? 0} bytes`);
    return r.data.getUint16(0, true);
  }

  async function readName() {
    const r = await transaction(OpCode.GetDevicePropValue, [SLOT_NAME]);
    return r.data ? new Reader(r.data).string() : '';
  }

  async function readSelected(): Promise<SlotData> {
    const slot = await readU16(FujiProp.CustomSlot);
    const name = await readName();
    const raw: SlotRaw = {};
    for (let code = SLOT_FIRST_FIELD; code <= SLOT_LAST_FIELD; code++) raw[code] = await readU16(code);
    return { slot, name, raw, recipe: decodeSlot(slot, name, raw) };
  }

  function upsert(d: SlotData) {
    slots.value = [...slots.value.filter((x) => x.slot !== d.slot), d].sort((a, b) => a.slot - b.slot);
  }

  /** Scan C1–C7 and restore the original selection. Throws on failure. */
  async function scanAll() {
    progress.value = 0;
    const original = await readU16(FujiProp.CustomSlot);
    log(`current slot is C${original}; scanning C1–C7`);
    try {
      for (let slot = 1; slot <= 7; slot++) {
        await selectCustomSlot(slot);
        await sleep(SETTLE_MS);
        const d = await readSelected();
        if (d.slot !== slot) throw new Error(`Asked for C${slot} but the camera reports C${d.slot}`);
        upsert(d);
        progress.value = slot;
      }
    } finally {
      if (original >= 1 && original <= 7) {
        await selectCustomSlot(original);
        log(`restored slot C${original}`);
      }
    }
  }

  function takeBackup() {
    const d = info.value;
    const b: SlotBackup = {
      takenAt: new Date().toISOString(),
      model: d?.model ?? 'camera',
      firmware: d?.deviceVersion ?? '',
      slots: slots.value.map(({ slot, name, raw }) => ({ slot, name, raw })),
    };
    onBackup(b);
    backupTaken.value = true;
    log(`backup of ${b.slots.length} slots saved in this browser`);
  }

  async function readCurrent() {
    if (busy.value) return;
    busy.value = 'current';
    error.value = '';
    try {
      const d = await readSelected();
      upsert(d);
      log(`read C${d.slot} "${d.name}" (no slot switch)`);
    } catch (e) {
      error.value = describe(e);
    } finally {
      busy.value = null;
    }
  }

  async function readAll() {
    if (busy.value) return;
    busy.value = 'all';
    error.value = '';
    try {
      await scanAll();
      if (!backupTaken.value && slots.value.length === 7) takeBackup();
    } catch (e) {
      error.value = describe(e);
      log(`slot scan failed: ${error.value}`);
    } finally {
      busy.value = null;
    }
  }

  async function writePreset(slot: number, preset: Preset, inBatch = false): Promise<WriteResult> {
    const result: WriteResult = { ok: false, slot, name: preset.name, warnings: [], mismatches: [] };
    if (busy.value && !inBatch) return { ...result, error: 'Camera is busy' };
    const problems = validatePreset(preset);
    if (problems.length) return { ...result, error: problems.join(' ') };
    if (slot < 1 || slot > 7) return { ...result, error: 'Slot must be C1–C7' };

    if (!inBatch) busy.value = 'write';
    error.value = '';
    let original: number | null = null;
    try {
      // 1. Backup every slot before the first write of this session.
      if (!backupTaken.value) {
        log('taking a backup of all slots before writing');
        await scanAll();
        if (slots.value.length !== 7) throw new Error('Backup incomplete, not writing');
        takeBackup();
      }

      original = await readU16(FujiProp.CustomSlot);

      // 2. Select the target slot and confirm the camera switched.
      await selectCustomSlot(slot);
      await sleep(SETTLE_MS);
      const selected = await readU16(FujiProp.CustomSlot);
      if (selected !== slot) throw new Error(`Asked for C${slot} but the camera selected C${selected}`);

      // 3. Name: a refused name write aborts (FilmKit treats it as fatal).
      log(`writing "${preset.name}" to C${slot}`);
      await writeProp(SLOT_NAME, ptpString(preset.name));

      // 4. Fields in X RAW Studio order. Refusals are warnings; transport failures abort.
      const writes = presetWrites(preset);
      const written: typeof writes = [];
      for (const w of writes) {
        try {
          await writeProp(w.code, u16(w.value));
          written.push(w);
        } catch (e) {
          if (!(e instanceof PtpError)) throw e;
          result.warnings.push(`${hex(w.code)} refused (${hex(e.code)})`);
        }
      }

      // 5. Read back and compare.
      const after = await readSelected();
      if (after.name !== preset.name) result.mismatches.push(`name is "${after.name}"`);
      for (const w of written) {
        const got = after.raw[w.code];
        const same = got === w.value || (w.code === 0xd195 && GRAIN_OFF_VALUES.has(w.value) && GRAIN_OFF_VALUES.has(got));
        if (!same) result.mismatches.push(`${hex(w.code)} is ${got}, expected ${w.value}`);
      }
      upsert(after);
      result.ok = result.mismatches.length === 0;
      log(result.ok ? `C${slot} written and verified${result.warnings.length ? ` (${result.warnings.length} refused)` : ''}` : `C${slot} verify failed: ${result.mismatches.join('; ')}`);
    } catch (e) {
      result.error = describe(e);
      log(`write failed: ${result.error}`);
    } finally {
      if (original !== null && original >= 1 && original <= 7) {
        try {
          await selectCustomSlot(original);
          log(`restored slot C${original}`);
        } catch (e) {
          result.warnings.push(`Couldn't restore selected slot C${original}: ${describe(e)}`);
        }
      }
      if (!inBatch) busy.value = null;
      lastWrite.value = result;
    }
    return result;
  }

  const batch = ref<{ total: number; results: WriteResult[] } | null>(null);

  /** Write several slots one after another (one backup, one confirmation). Stops at the first hard error. */
  async function writeMany(jobs: { slot: number; preset: Preset }[]) {
    if (busy.value || !jobs.length) return;
    busy.value = 'write';
    lastWrite.value = null;
    batch.value = { total: jobs.length, results: [] };
    try {
      for (const j of jobs) {
        const r = await writePreset(j.slot, j.preset, true);
        batch.value.results.push(r);
        if (r.error) {
          log(`batch stopped at C${j.slot}: ${r.error}`);
          break;
        }
      }
    } finally {
      lastWrite.value = null;
      busy.value = null;
    }
  }

  return { slots, recipes, busy, progress, error, supported, backupTaken, lastWrite, batch, readCurrent, readAll, writePreset, writeMany };
}
