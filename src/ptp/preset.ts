// Editable preset model and its encoding to custom slot properties 0xD18D–0xD1A5.
// Encoding and write order follow FilmKit's translateUIToPresetProps / writePreset
// (eggricesoy/filmkit master: src/profile/preset-translate.ts, src/ptp/session.ts).

import {
  decodeSlot,
  FILM_SIMULATIONS,
  GRAIN,
  GRAIN_OFF_VALUES,
  IMAGE_QUALITY,
  HIGH_ISO_NR,
  MONO_SIMS,
  OFF_WEAK_STRONG,
  SLOT_FIRST_FIELD,
  SLOT_LAST_FIELD,
  WB_COLOR_TEMP,
  WB_MODES,
  type Recipe,
  type SlotRaw,
} from './recipe';

export const DR_AUTO = 0xffff;
export const QUALITY_FINE = 2;

export interface Preset {
  id: string;
  name: string;
  filmSimulation: number; // D192 enum
  monoWarmCool: number; // D193, real units
  monoMagentaGreen: number; // D194
  grain: number; // D195 enum 1–5
  colorChrome: number; // D196 1–3
  colorChromeFxBlue: number; // D197 1–3
  smoothSkin: number; // D198 1–3
  whiteBalance: number; // D199 enum
  wbShiftR: number; // D19A
  wbShiftB: number; // D19B
  colorTemperature: number; // D19C, K
  dynamicRange: number; // D190: 100 / 200 / 400 / 0xFFFF auto
  highlight: number; // D19D
  shadow: number; // D19E
  color: number; // D19F
  sharpness: number; // D1A0
  highIsoNr: number; // D1A1, −4…+4
  clarity: number; // D1A2
  /** D18F. Optional for presets stored before this field existed; those write JPEG Fine. */
  imageQuality?: number;
  /** Fields we don't edit, kept as read from the camera so a write doesn't change them. */
  base: { d18e: number; d18f: number; d191: number; d1a3: number; d1a4: number; d1a5: number };
  source?: string;
  /** Suggested camera slot (1–7), used to pre-fill batch loading. */
  slotHint?: number;
  /** Bundled with the site (read only; duplicate to edit). */
  builtin?: boolean;
  /** Name of the set a preset belongs to, e.g. "Japan, November". */
  setName?: string;
  updatedAt: string;
}

/** Ranges for the editor (camera menu ranges; FilmKit does not clamp). */
export const RANGES = {
  highlight: { min: -2, max: 4, step: 0.5 },
  shadow: { min: -2, max: 4, step: 0.5 },
  color: { min: -4, max: 4, step: 1 },
  sharpness: { min: -4, max: 4, step: 1 },
  clarity: { min: -5, max: 5, step: 1 },
  highIsoNr: { min: -4, max: 4, step: 1 },
  wbShift: { min: -9, max: 9, step: 1 },
  mono: { min: -9, max: 9, step: 1 },
  colorTemperature: { min: 2500, max: 10000, step: 10 },
} as const;

export const NAME_MAX = 25;

const options = (m: Record<number, string>) => Object.entries(m).map(([v, label]) => ({ value: Number(v), label }));
export const OPTIONS = {
  filmSimulation: options(FILM_SIMULATIONS),
  grain: options(GRAIN),
  offWeakStrong: options(OFF_WEAK_STRONG),
  imageQuality: options(IMAGE_QUALITY),
  whiteBalance: options(WB_MODES).filter((o) => o.value !== 0), // "As shot" only makes sense for RAW conversion
  dynamicRange: [
    { value: 100, label: 'DR100' },
    { value: 200, label: 'DR200' },
    { value: 400, label: 'DR400' },
    { value: DR_AUTO, label: 'Auto' },
  ],
};

const NR_ENCODE: Record<number, number> = Object.fromEntries(Object.entries(HIGH_ISO_NR).map(([raw, v]) => [v, Number(raw)]));
const i16 = (v: number) => (v & 0x8000 ? v - 0x10000 : v);
const u16 = (v: number) => v & 0xffff;
const fromTenths = (v: number) => i16(v) / 10;
const toTenths = (v: number) => u16(Math.round(v * 10));

/** Deep copy that also works on Vue reactive proxies (structuredClone throws on them). */
export const clonePreset = (p: Preset): Preset => JSON.parse(JSON.stringify(p)) as Preset;

export const newId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `p-${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function isMono(p: Pick<Preset, 'filmSimulation'>) {
  return MONO_SIMS.has(p.filmSimulation);
}

export function defaultPreset(): Preset {
  return {
    id: newId(),
    name: 'New preset',
    filmSimulation: 1,
    monoWarmCool: 0,
    monoMagentaGreen: 0,
    grain: 1,
    colorChrome: 1,
    colorChromeFxBlue: 1,
    smoothSkin: 1,
    whiteBalance: 2,
    wbShiftR: 0,
    wbShiftB: 0,
    colorTemperature: 5500,
    dynamicRange: 100,
    highlight: 0,
    shadow: 0,
    color: 0,
    sharpness: 0,
    highIsoNr: 0,
    clarity: 0,
    imageQuality: QUALITY_FINE,
    base: { d18e: 7, d18f: 4, d191: 0, d1a3: 1, d1a4: 1, d1a5: 7 },
    updatedAt: new Date().toISOString(),
  };
}

/** Camera slot (raw 0xD18E–0xD1A5 values) → editable preset. */
export function presetFromRaw(name: string, raw: SlotRaw, source?: string): Preset {
  const g = (code: number) => raw[code] ?? 0;
  const nr = HIGH_ISO_NR[g(0xd1a1)];
  return {
    id: newId(),
    name,
    filmSimulation: g(0xd192) || 1,
    monoWarmCool: fromTenths(g(0xd193)),
    monoMagentaGreen: fromTenths(g(0xd194)),
    grain: GRAIN_OFF_VALUES.has(g(0xd195)) ? 1 : g(0xd195) || 1,
    colorChrome: g(0xd196) || 1,
    colorChromeFxBlue: g(0xd197) || 1,
    smoothSkin: g(0xd198) || 1,
    whiteBalance: g(0xd199),
    wbShiftR: i16(g(0xd19a)),
    wbShiftB: i16(g(0xd19b)),
    colorTemperature: g(0xd19c) || 5500,
    dynamicRange: g(0xd190) || 100,
    highlight: fromTenths(g(0xd19d)),
    shadow: fromTenths(g(0xd19e)),
    color: fromTenths(g(0xd19f)),
    sharpness: fromTenths(g(0xd1a0)),
    highIsoNr: nr ?? 0,
    clarity: fromTenths(g(0xd1a2)),
    imageQuality: IMAGE_QUALITY[g(0xd18f)] ? g(0xd18f) : QUALITY_FINE,
    base: { d18e: g(0xd18e), d18f: g(0xd18f), d191: g(0xd191), d1a3: g(0xd1a3), d1a4: g(0xd1a4), d1a5: g(0xd1a5) },
    source,
    updatedAt: new Date().toISOString(),
  };
}

export interface PropWrite {
  code: number;
  value: number; // uint16 as sent
}

/** Ordered property writes, X RAW Studio order as used by FilmKit; conditional fields skipped like FilmKit does. */
export function presetWrites(p: Preset): PropWrite[] {
  const mono = isMono(p);
  const w: PropWrite[] = [];
  const add = (code: number, value: number) => w.push({ code, value: u16(value) });
  add(0xd18e, p.base.d18e || 7);
  add(0xd18f, p.imageQuality && IMAGE_QUALITY[p.imageQuality] ? p.imageQuality : QUALITY_FINE);
  add(0xd190, p.dynamicRange);
  add(0xd191, p.base.d191);
  add(0xd192, p.filmSimulation || 1);
  if (mono && p.monoWarmCool !== 0) add(0xd193, toTenths(p.monoWarmCool));
  if (mono && p.monoMagentaGreen !== 0) add(0xd194, toTenths(p.monoMagentaGreen));
  add(0xd195, p.grain);
  add(0xd196, p.colorChrome);
  add(0xd197, p.colorChromeFxBlue);
  add(0xd198, p.smoothSkin);
  add(0xd199, p.whiteBalance);
  if (p.whiteBalance === WB_COLOR_TEMP && p.colorTemperature > 0) add(0xd19c, p.colorTemperature);
  add(0xd19a, p.wbShiftR);
  add(0xd19b, p.wbShiftB);
  add(0xd19d, toTenths(p.highlight));
  add(0xd19e, toTenths(p.shadow));
  if (!mono) add(0xd19f, toTenths(p.color));
  add(0xd1a0, toTenths(p.sharpness));
  add(0xd1a1, NR_ENCODE[p.highIsoNr] ?? 0x2000);
  add(0xd1a2, toTenths(p.clarity));
  add(0xd1a3, p.base.d1a3 || 1);
  add(0xd1a4, p.base.d1a4 || 1);
  add(0xd1a5, p.base.d1a5 || 7);
  return w;
}

/** Full raw slot for display (fields that would be skipped keep neutral values). */
export function presetToRaw(p: Preset): SlotRaw {
  const raw: SlotRaw = {};
  for (let c = SLOT_FIRST_FIELD; c <= SLOT_LAST_FIELD; c++) raw[c] = 0;
  raw[0xd19c] = p.colorTemperature;
  raw[0xd19f] = toTenths(p.color);
  for (const { code, value } of presetWrites(p)) raw[code] = value;
  return raw;
}

export function presetToRecipe(p: Preset, slot = 0): Recipe {
  return decodeSlot(slot, p.name, presetToRaw(p));
}

function inRange(v: number, r: { min: number; max: number; step: number }) {
  const k = (v - r.min) / r.step;
  return v >= r.min && v <= r.max && Math.abs(k - Math.round(k)) < 1e-6;
}

/** Problems that would make the camera refuse the preset, or that we shouldn't send. */
export function validatePreset(p: Preset): string[] {
  const e: string[] = [];
  if (!p.name.trim()) e.push('Name is required.');
  if (p.name.length > NAME_MAX) e.push(`Name must be ${NAME_MAX} characters or fewer.`);
  if (!/^[\x20-\x7e]*$/.test(p.name)) e.push('Name can only use plain ASCII letters, digits and symbols.');
  if (!FILM_SIMULATIONS[p.filmSimulation]) e.push('Unknown film simulation.');
  if (!GRAIN[p.grain]) e.push('Unknown grain setting.');
  if (p.imageQuality !== undefined && !IMAGE_QUALITY[p.imageQuality]) e.push('Unknown image quality.');
  for (const [k, v] of [['Color Chrome', p.colorChrome], ['Color Chrome FX Blue', p.colorChromeFxBlue], ['Smooth skin', p.smoothSkin]] as const)
    if (!OFF_WEAK_STRONG[v]) e.push(`Unknown ${k} setting.`);
  if (!WB_MODES[p.whiteBalance]) e.push('Unknown white balance mode.');
  if (!OPTIONS.dynamicRange.some((o) => o.value === p.dynamicRange)) e.push('Unknown dynamic range.');
  const checks: [string, number, { min: number; max: number; step: number }][] = [
    ['Highlight', p.highlight, RANGES.highlight],
    ['Shadow', p.shadow, RANGES.shadow],
    ['Sharpness', p.sharpness, RANGES.sharpness],
    ['Clarity', p.clarity, RANGES.clarity],
    ['High ISO NR', p.highIsoNr, RANGES.highIsoNr],
    ['WB shift R', p.wbShiftR, RANGES.wbShift],
    ['WB shift B', p.wbShiftB, RANGES.wbShift],
  ];
  if (!isMono(p)) checks.push(['Color', p.color, RANGES.color]);
  else checks.push(['Mono warm/cool', p.monoWarmCool, RANGES.mono], ['Mono magenta/green', p.monoMagentaGreen, RANGES.mono]);
  if (p.whiteBalance === WB_COLOR_TEMP) checks.push(['Color temperature', p.colorTemperature, RANGES.colorTemperature]);
  for (const [label, v, r] of checks) if (!inRange(v, r)) e.push(`${label} must be ${r.min} to ${r.max} in steps of ${r.step}.`);
  return e;
}

/** Light shape check for imported JSON, then fills defaults for missing fields. */
export function normalizePreset(x: unknown): Preset | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Partial<Preset>;
  if (typeof o.name !== 'string' || typeof o.filmSimulation !== 'number') return null;
  const d = defaultPreset();
  const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  return {
    ...d,
    ...Object.fromEntries(Object.entries(d).filter(([k]) => typeof d[k as keyof Preset] === 'number').map(([k, v]) => [k, num(o[k as keyof Preset], v as number)])),
    name: o.name,
    base: { ...d.base, ...(o.base && typeof o.base === 'object' ? o.base : {}) },
    source: typeof o.source === 'string' ? o.source : undefined,
    slotHint: typeof o.slotHint === 'number' && o.slotHint >= 1 && o.slotHint <= 7 ? o.slotHint : undefined,
    setName: typeof o.setName === 'string' ? o.setName : undefined,
    id: newId(),
    updatedAt: new Date().toISOString(),
  } as Preset;
}
