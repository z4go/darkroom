import { computed, ref, type ShallowRef } from 'vue';
import { FujiProp, OpCode, hex } from '../ptp/codes';
import type { DeviceInfo } from '../ptp/deviceinfo';
import { decodeSlot, SLOT_FIRST_FIELD, SLOT_LAST_FIELD, SLOT_NAME, type Recipe, type SlotRaw } from '../ptp/recipe';
import { Reader } from '../ptp/reader';
import type { PtpResult } from '../ptp/transport';
import type { LogFn } from './useLog';

type Transaction = (op: number, params?: number[]) => Promise<PtpResult>;

const SETTLE_MS = 100; // FilmKit waits this long after switching slots
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Reads C1–C7. `readCurrent` never writes; `readAll` switches slots via 0xD18C and always restores the original. */
export function useCustomSlots(
  transaction: Transaction,
  selectCustomSlot: (slot: number) => Promise<void>,
  info: ShallowRef<DeviceInfo | null>,
  log: LogFn,
) {
  const recipes = ref<Recipe[]>([]);
  const busy = ref<null | 'current' | 'all'>(null);
  const progress = ref(0);
  const error = ref('');
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

  async function readSelected(): Promise<Recipe> {
    const slot = await readU16(FujiProp.CustomSlot);
    const name = await readName();
    const raw: SlotRaw = {};
    for (let code = SLOT_FIRST_FIELD; code <= SLOT_LAST_FIELD; code++) raw[code] = await readU16(code);
    return decodeSlot(slot, name, raw);
  }

  function upsert(r: Recipe) {
    const rest = recipes.value.filter((x) => x.slot !== r.slot);
    recipes.value = [...rest, r].sort((a, b) => a.slot - b.slot);
  }

  async function readCurrent() {
    if (busy.value) return;
    busy.value = 'current';
    error.value = '';
    try {
      const r = await readSelected();
      upsert(r);
      log(`read C${r.slot} "${r.name}" (no slot switch)`);
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      busy.value = null;
    }
  }

  async function readAll() {
    if (busy.value) return;
    busy.value = 'all';
    error.value = '';
    progress.value = 0;
    let original: number | null = null;
    try {
      original = await readU16(FujiProp.CustomSlot);
      log(`current slot is C${original}; scanning C1–C7`);
      for (let slot = 1; slot <= 7; slot++) {
        await selectCustomSlot(slot);
        await sleep(SETTLE_MS);
        const r = await readSelected();
        if (r.slot !== slot) throw new Error(`Asked for C${slot} but the camera reports C${r.slot}`);
        upsert(r);
        progress.value = slot;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      log(`slot scan failed: ${error.value}`);
    } finally {
      if (original !== null && original >= 1 && original <= 7) {
        try {
          await selectCustomSlot(original);
          log(`restored slot C${original}`);
        } catch (e) {
          error.value ||= `Couldn't restore slot C${original}: ${e instanceof Error ? e.message : e}`;
        }
      }
      busy.value = null;
    }
  }

  return { recipes, busy, progress, error, supported, readCurrent, readAll };
}
