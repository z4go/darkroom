import { hex } from '../../ptp/codes';
import type { PropDesc, PropValue } from '../../ptp/datasets';

export function fmtValue(v: PropValue): string {
  if (Array.isArray(v)) return `[${v.map((x) => fmtValue(x)).join(', ')}]`;
  if (typeof v === 'number') return v > 9 ? `${v} (${hex(v, 2)})` : String(v);
  return /^\d+$/.test(v) ? v : `"${v}"`;
}

export function fmtForm(form: PropDesc['form']): string {
  if (form.kind === 'range') return `range ${fmtValue(form.min)} … ${fmtValue(form.max)} step ${fmtValue(form.step)}`;
  if (form.kind === 'enum') return `enum (${form.values.length}): ${form.values.map((v) => fmtValue(v)).join(', ')}`;
  return '';
}
