/** Space separated hex bytes, truncated to `max` bytes. */
export function toHex(data: DataView | Uint8Array, max = 64): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const shown = Array.from(bytes.subarray(0, max), (b) => b.toString(16).padStart(2, '0')).join(' ');
  return bytes.length > max ? `${shown} … (+${bytes.length - max})` : shown;
}

/** Best effort reading of a raw property value whose type we don't know yet. */
export function guessValue(data: DataView): string {
  const n = data.byteLength;
  if (n === 1) return `u8 ${data.getUint8(0)}`;
  if (n === 2) return `u16 ${data.getUint16(0, true)}`;
  if (n === 4) return `u32 ${data.getUint32(0, true)} · i32 ${data.getInt32(0, true)}`;
  if (n === 8) return `u64 ${data.getBigUint64(0, true)}`;
  // PTP string: u8 length (chars incl. NUL) then UTF-16LE
  const len = data.getUint8(0);
  if (n >= 1 && 1 + len * 2 === n && len > 0) {
    let s = '';
    for (let i = 0; i < len; i++) {
      const c = data.getUint16(1 + i * 2, true);
      if (c) s += String.fromCharCode(c);
    }
    if (/^[\x20-\x7e]*$/.test(s)) return `str "${s}"`;
  }
  // u32-count array of u16/u32
  if (n >= 4) {
    const count = data.getUint32(0, true);
    if (4 + count * 2 === n) return `u16[${count}]`;
    if (4 + count * 4 === n) return `u32[${count}]`;
  }
  return `${n} bytes`;
}
