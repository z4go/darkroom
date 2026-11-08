// Little-endian cursor over a PTP dataset.
export class Reader {
  private view: DataView;
  offset = 0;

  constructor(buf: ArrayBuffer | DataView) {
    this.view = buf instanceof DataView ? buf : new DataView(buf);
  }

  get remaining() {
    return this.view.byteLength - this.offset;
  }

  u8() {
    const v = this.view.getUint8(this.offset);
    this.offset += 1;
    return v;
  }
  u16() {
    const v = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return v;
  }
  u32() {
    const v = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return v;
  }

  /** PTP string: u8 char count (incl. NUL), then UTF-16LE code units. */
  string() {
    const n = this.u8();
    let s = '';
    for (let i = 0; i < n; i++) {
      const c = this.u16();
      if (c !== 0) s += String.fromCharCode(c);
    }
    return s;
  }

  u16Array() {
    const n = this.u32();
    const out: number[] = [];
    for (let i = 0; i < n; i++) out.push(this.u16());
    return out;
  }
}
