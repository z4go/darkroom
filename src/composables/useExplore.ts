import { reactive, ref, type Ref, type ShallowRef } from 'vue';
import { OpCode, hex, respName } from '../ptp/codes';
import {
  parseObjectInfo,
  parsePropDesc,
  parseStorageInfo,
  parseU32Array,
  type ObjectInfo,
  type PropDesc,
  type StorageInfo,
} from '../ptp/datasets';
import type { DeviceInfo } from '../ptp/deviceinfo';
import { guessValue, toHex } from '../ptp/hexdump';
import { PtpError, type PtpResult } from '../ptp/transport';
import type { LogFn } from './useLog';
import { useStoredRef } from './useStoredRef';

type Transaction = (op: number, params?: number[]) => Promise<PtpResult>;

export interface PropResult {
  code: number;
  desc?: PropDesc;
  raw?: string;
  error?: string;
}

export interface SweepHit {
  code: number;
  bytes: number;
  hex: string;
  guess: string;
  desc?: PropDesc;
  /** Compared with the previous saved sweep: 'same', 'changed', or 'new' (no baseline value). */
  diff?: 'same' | 'changed' | 'new';
  before?: string;
  beforeGuess?: string;
}

interface SavedSweep {
  at: string;
  from: number;
  to: number;
  hits: { code: number; hex: string; guess: string }[];
}

const OBJECT_LIMIT = 100;

function describe(e: unknown) {
  return e instanceof PtpError ? `${respName(e.code)} (${hex(e.code)})` : e instanceof Error ? e.message : String(e);
}

/** Read only protocol exploration on an open camera session. */
export function useExplore(transaction: Transaction, info: ShallowRef<DeviceInfo | null>, log: LogFn) {
  const busy = ref<null | 'props' | 'sweep' | 'storage'>(null);

  // --- advertised properties -------------------------------------------------
  const props = ref<PropResult[]>([]);

  async function readProp(code: number): Promise<PropResult> {
    const out: PropResult = { code };
    try {
      const d = await transaction(OpCode.GetDevicePropDesc, [code]);
      if (d.data) {
        out.raw = toHex(d.data, 256);
        out.desc = parsePropDesc(d.data);
      }
    } catch (e) {
      out.error = describe(e);
      // Some cameras answer GetDevicePropValue even when the descriptor fails.
      try {
        const v = await transaction(OpCode.GetDevicePropValue, [code]);
        if (v.data) out.raw = `${toHex(v.data, 256)}  (${guessValue(v.data)})`;
      } catch (e2) {
        out.error += ` · value: ${describe(e2)}`;
      }
    }
    return out;
  }

  async function readAdvertised() {
    if (busy.value || !info.value) return;
    busy.value = 'props';
    try {
      props.value = [];
      for (const code of info.value.devicePropertiesSupported) props.value.push(await readProp(code));
    } finally {
      busy.value = null;
    }
  }

  // --- vendor property sweep ---------------------------------------------------
  const sweep = reactive({
    from: 0xd000,
    to: 0xd3ff,
    current: 0,
    done: 0,
    total: 0,
    hits: [] as SweepHit[],
    misses: {} as Record<string, number>,
    error: '' as string,
  });
  let stopRequested = false;

  // Previous completed sweep, kept in the browser so you can unplug, change a camera setting, and compare.
  const { value: lastSweep } = useStoredRef<SavedSweep | null>('darkroom.explore.lastSweep', null);
  const baseline = ref<SavedSweep | null>(null);
  const gone = ref<{ code: number; hex: string; guess: string }[]>([]);

  async function runSweep() {
    if (busy.value) return;
    const from = Math.min(sweep.from, sweep.to);
    const to = Math.max(sweep.from, sweep.to);
    busy.value = 'sweep';
    stopRequested = false;
    Object.assign(sweep, { done: 0, total: to - from + 1, hits: [], misses: {}, error: '' });
    baseline.value = lastSweep.value;
    gone.value = [];
    const before = new Map((baseline.value?.hits ?? []).map((h) => [h.code, h]));
    const inBaseline = (code: number) => !!baseline.value && code >= baseline.value.from && code <= baseline.value.to;
    log(`sweep ${hex(from)}–${hex(to)} start${baseline.value ? `, comparing with sweep from ${baseline.value.at}` : ''}`);
    try {
      for (let code = from; code <= to && !stopRequested; code++) {
        sweep.current = code;
        try {
          const res = await transaction(OpCode.GetDevicePropValue, [code]);
          const data = res.data ?? new DataView(new ArrayBuffer(0));
          const hit: SweepHit = { code, bytes: data.byteLength, hex: toHex(data, 512), guess: guessValue(data) };
          if (inBaseline(code)) {
            const b = before.get(code);
            hit.diff = !b ? 'new' : b.hex === hit.hex ? 'same' : 'changed';
            if (b && hit.diff === 'changed') {
              hit.before = b.hex;
              hit.beforeGuess = b.guess;
            }
          }
          try {
            const d = await transaction(OpCode.GetDevicePropDesc, [code]);
            if (d.data) hit.desc = parsePropDesc(d.data);
          } catch {
            /* descriptor is optional */
          }
          sweep.hits.push(hit);
        } catch (e) {
          if (!(e instanceof PtpError)) {
            // Transport level failure (timeout, stall, unplug): stop rather than desync the session.
            sweep.error = `Stopped at ${hex(code)}: ${describe(e)}`;
            log(sweep.error);
            break;
          }
          const key = respName(e.code);
          sweep.misses[key] = (sweep.misses[key] ?? 0) + 1;
        }
        sweep.done++;
      }
      log(`sweep done: ${sweep.hits.length} answered, ${sweep.done} tried${stopRequested ? ' (stopped)' : ''}`);
      if (baseline.value) {
        const now = new Set(sweep.hits.map((h) => h.code));
        gone.value = baseline.value.hits.filter((h) => h.code >= from && h.code <= Math.min(to, sweep.current) && !now.has(h.code));
        const changed = sweep.hits.filter((h) => h.diff === 'changed').length;
        log(`compared: ${changed} changed, ${sweep.hits.filter((h) => h.diff === 'new').length} new, ${gone.value.length} gone`);
      }
      if (!stopRequested && !sweep.error) {
        lastSweep.value = { at: new Date().toISOString(), from, to, hits: sweep.hits.map(({ code, hex: hx, guess }) => ({ code, hex: hx, guess })) };
      }
    } finally {
      busy.value = null;
    }
  }

  function stopSweep() {
    stopRequested = true;
  }

  // --- storage and objects -----------------------------------------------------
  const storages = ref<StorageInfo[]>([]);
  const objects = ref<ObjectInfo[]>([]);
  const objectTotal = ref(0);
  const storageError = ref('');

  async function listStorage() {
    if (busy.value) return;
    busy.value = 'storage';
    storages.value = [];
    objects.value = [];
    objectTotal.value = 0;
    storageError.value = '';
    try {
      const ids = await transaction(OpCode.GetStorageIDs);
      const storageIds = ids.data ? parseU32Array(ids.data) : [];
      if (!storageIds.length) storageError.value = 'The camera reports no storage in this mode.';
      for (const id of storageIds) {
        try {
          const s = await transaction(OpCode.GetStorageInfo, [id]);
          if (s.data) storages.value.push(parseStorageInfo(id, s.data));
        } catch (e) {
          log(`GetStorageInfo ${hex(id, 8)}: ${describe(e)}`);
        }
        // Root level objects only, all formats.
        try {
          const h = await transaction(OpCode.GetObjectHandles, [id, 0, 0xffffffff]);
          const handles = h.data ? parseU32Array(h.data) : [];
          objectTotal.value += handles.length;
          for (const handle of handles.slice(0, OBJECT_LIMIT - objects.value.length)) {
            const o = await transaction(OpCode.GetObjectInfo, [handle]);
            if (o.data) objects.value.push(parseObjectInfo(handle, o.data));
          }
        } catch (e) {
          log(`GetObjectHandles ${hex(id, 8)}: ${describe(e)}`);
          storageError.value ||= `Couldn't list objects: ${describe(e)}`;
        }
      }
    } catch (e) {
      storageError.value = `Couldn't list storage: ${describe(e)}`;
    } finally {
      busy.value = null;
    }
  }

  // --- export ------------------------------------------------------------------
  /** Everything gathered so far, with the serial number removed wherever it appears (it also hides in storage labels). */
  function report() {
    const serial = info.value?.serialNumber;
    const raw = buildReport();
    if (!serial) return raw;
    return JSON.parse(JSON.stringify(raw).replaceAll(serial, '(redacted)')) as typeof raw;
  }

  function buildReport() {
    return {
      capturedAt: new Date().toISOString(),
      device: info.value ? { ...info.value, serialNumber: '(redacted)' } : null,
      advertisedProps: props.value,
      sweep: { from: hex(sweep.from), to: hex(sweep.to), tried: sweep.done, hits: sweep.hits, misses: sweep.misses, error: sweep.error || undefined, comparedWith: baseline.value?.at, gone: gone.value },
      storages: storages.value,
      objects: objects.value,
      objectTotal: objectTotal.value,
    };
  }

  return {
    busy: busy as Ref<typeof busy.value>,
    props,
    readAdvertised,
    sweep,
    runSweep,
    baseline,
    gone,
    stopSweep,
    storages,
    objects,
    objectTotal,
    storageError,
    listStorage,
    report,
  };
}
