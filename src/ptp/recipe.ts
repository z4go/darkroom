// Fujifilm custom setting slot (C1–C7) fields: properties 0xD18D–0xD1A5.
// Field list and encodings from FilmKit (eggricesoy/filmkit, src/ptp/constants.ts,
// preset-translate.ts, enums.ts), captured from X RAW Studio on an X100VI.

export const SLOT_NAME = 0xd18d;
export const SLOT_FIRST_FIELD = 0xd18e;
export const SLOT_LAST_FIELD = 0xd1a5;

export const FILM_SIMULATIONS: Record<number, string> = {
  1: 'Provia / Standard',
  2: 'Velvia / Vivid',
  3: 'Astia / Soft',
  4: 'Pro Neg. Hi',
  5: 'Pro Neg. Std',
  6: 'Monochrome',
  7: 'Monochrome + Ye',
  8: 'Monochrome + R',
  9: 'Monochrome + G',
  10: 'Sepia',
  11: 'Classic Chrome',
  12: 'Acros',
  13: 'Acros + Ye',
  14: 'Acros + R',
  15: 'Acros + G',
  16: 'Eterna / Cinema',
  17: 'Classic Neg.',
  18: 'Eterna Bleach Bypass',
  19: 'Nostalgic Neg.',
  20: 'Reala Ace',
};

const MONO_SIMS = new Set([6, 7, 8, 9, 10, 12, 13, 14, 15]);

const GRAIN: Record<number, string> = { 1: 'Off', 2: 'Weak, Small', 3: 'Strong, Small', 4: 'Weak, Large', 5: 'Strong, Large' };
const OFF_WEAK_STRONG: Record<number, string> = { 1: 'Off', 2: 'Weak', 3: 'Strong' };
const WB_MODES: Record<number, string> = {
  0x0000: 'As shot',
  0x0002: 'Auto',
  0x0004: 'Daylight',
  0x0006: 'Incandescent',
  0x0008: 'Underwater',
  0x8001: 'Fluorescent 1',
  0x8002: 'Fluorescent 2',
  0x8003: 'Fluorescent 3',
  0x8006: 'Shade',
  0x8007: 'Color temperature',
  0x8021: 'Auto (ambience priority)',
};
const WB_COLOR_TEMP = 0x8007;
const HIGH_ISO_NR: Record<number, number> = {
  0x8000: -4, 0x7000: -3, 0x4000: -2, 0x3000: -1, 0x2000: 0, 0x1000: 1, 0x0000: 2, 0x6000: 3, 0x5000: 4,
};
const COLOR_SPACE: Record<number, string> = { 1: 'sRGB', 2: 'Adobe RGB' };

/** Raw uint16 values for 0xD18E–0xD1A5, keyed by property code. */
export type SlotRaw = Record<number, number>;

export interface Recipe {
  slot: number;
  name: string;
  filmSimulation: string;
  monochrome: boolean;
  monoWarmCool: number | null;
  monoMagentaGreen: number | null;
  grain: string;
  colorChrome: string;
  colorChromeFxBlue: string;
  smoothSkin: string;
  whiteBalance: string;
  whiteBalanceShift: { r: number; b: number };
  colorTemperature: number | null;
  dynamicRange: string;
  highlight: number;
  shadow: number;
  color: number | null;
  sharpness: number;
  highIsoNr: number | string;
  clarity: number;
  longExposureNr: boolean;
  colorSpace: string;
  /** Untouched raw values, so nothing is lost when an encoding is still unknown. */
  raw: Record<string, number>;
}

const i16 = (v: number) => (v & 0x8000 ? v - 0x10000 : v);
const tenths = (v: number) => i16(v) / 10;
const label = (map: Record<number, string>, v: number) => map[v] ?? `unknown (${v})`;

export function decodeSlot(slot: number, name: string, raw: SlotRaw): Recipe {
  const g = (offset: number) => raw[SLOT_FIRST_FIELD + offset] ?? 0;
  const sim = g(4); // D192
  const mono = MONO_SIMS.has(sim);
  const wb = g(11); // D199
  const dr = g(2); // D190
  return {
    slot,
    name,
    filmSimulation: label(FILM_SIMULATIONS, sim),
    monochrome: mono,
    monoWarmCool: mono ? tenths(g(5)) : null, // D193
    monoMagentaGreen: mono ? tenths(g(6)) : null, // D194
    grain: label(GRAIN, g(7)), // D195
    colorChrome: label(OFF_WEAK_STRONG, g(8)), // D196
    colorChromeFxBlue: label(OFF_WEAK_STRONG, g(9)), // D197
    smoothSkin: label(OFF_WEAK_STRONG, g(10)), // D198
    whiteBalance: label(WB_MODES, wb),
    whiteBalanceShift: { r: i16(g(12)), b: i16(g(13)) }, // D19A, D19B
    colorTemperature: wb === WB_COLOR_TEMP ? g(14) : null, // D19C
    // 0xFFFF seen on a real slot (C2); the camera offers DR Auto, so treat it (and 0) as Auto.
    dynamicRange: dr === 0 || dr === 0xffff ? 'Auto' : `DR${dr}`,
    highlight: tenths(g(15)), // D19D
    shadow: tenths(g(16)), // D19E
    color: mono ? null : tenths(g(17)), // D19F
    sharpness: tenths(g(18)), // D1A0
    highIsoNr: HIGH_ISO_NR[g(19)] ?? `unknown (0x${g(19).toString(16)})`, // D1A1
    clarity: tenths(g(20)), // D1A2
    longExposureNr: g(21) === 1, // D1A3
    colorSpace: label(COLOR_SPACE, g(22)), // D1A4
    raw: Object.fromEntries(
      Object.entries(raw).map(([code, v]) => [`0x${Number(code).toString(16).toUpperCase()}`, v]),
    ),
  };
}

/** "+2", "0", "−1.5": signed display with a real minus sign. */
export function signed(n: number): string {
  if (n === 0) return '0';
  const s = Number.isInteger(n) ? String(Math.abs(n)) : Math.abs(n).toFixed(1);
  return n > 0 ? `+${s}` : `−${s}`;
}
