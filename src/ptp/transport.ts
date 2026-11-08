import { ContainerType, FujiProp, OpCode, READ_ONLY_OPS, RespCode, SET_DEVICE_PROP_VALUE, USB_CLASS_STILL_IMAGE, hex, opName, respName } from './codes';

const HEADER_LEN = 12;
const READ_CHUNK = 512 * 1024;
const TIMEOUT_MS = 5000;

export interface PtpResult {
  code: number;
  params: number[];
  data?: DataView;
}

export type LogFn = (line: string) => void;

/** Thrown when the OS or another app already holds the PTP interface. */
export class DeviceBusyError extends Error {
  constructor(cause: unknown) {
    super('Could not claim the camera USB interface', { cause });
    this.name = 'DeviceBusyError';
  }
}

export class PtpError extends Error {
  constructor(readonly op: number, readonly code: number) {
    super(`${opName(op)} failed: ${respName(code)} (${hex(code)})`);
    this.name = 'PtpError';
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timed out waiting for ${what}`)), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}

/** Minimal PTP-over-USB (bulk-only) transport on top of WebUSB. */
export class PtpTransport {
  private txId = 0;
  private sessionOpen = false;

  private constructor(
    readonly device: USBDevice,
    private readonly ifaceNumber: number,
    private readonly epIn: number,
    private readonly epOut: number,
    private readonly log: LogFn,
  ) {}

  static async open(device: USBDevice, log: LogFn = () => {}): Promise<PtpTransport> {
    await device.open();
    if (device.configuration === null) await device.selectConfiguration(1);

    const config = device.configuration!;
    let found: { iface: number; alt: number; epIn: number; epOut: number } | undefined;
    for (const iface of config.interfaces) {
      for (const alt of iface.alternates) {
        if (alt.interfaceClass !== USB_CLASS_STILL_IMAGE) continue;
        const bulkIn = alt.endpoints.find((e) => e.type === 'bulk' && e.direction === 'in');
        const bulkOut = alt.endpoints.find((e) => e.type === 'bulk' && e.direction === 'out');
        if (bulkIn && bulkOut) {
          found = { iface: iface.interfaceNumber, alt: alt.alternateSetting, epIn: bulkIn.endpointNumber, epOut: bulkOut.endpointNumber };
          break;
        }
      }
      if (found) break;
    }
    if (!found) {
      await device.close().catch(() => {});
      throw new Error(
        'No PTP (Still Image) interface found. Check the camera Connection Mode — see the setup notes on the home page.',
      );
    }

    try {
      await device.claimInterface(found.iface);
    } catch (e) {
      await device.close().catch(() => {});
      throw new DeviceBusyError(e);
    }
    if (found.alt !== 0) await device.selectAlternateInterface(found.iface, found.alt);

    log(`claimed interface ${found.iface} (bulk in ${found.epIn}, out ${found.epOut})`);
    return new PtpTransport(device, found.iface, found.epIn, found.epOut, log);
  }

  /**
   * Opens a fresh session. If another host (e.g. macOS ptpcamerad) left one open, don't reuse it:
   * close it, reset the USB connection and open again, as FilmKit and rawji do. The inherited
   * session can leave the camera presenting its generic MTP personality instead of Fuji's.
   */
  async openSession(sessionId = 1) {
    // OpenSession must use transaction id 0.
    this.txId = -1;
    const res = await this.transaction(OpCode.OpenSession, [sessionId], { allowCodes: [RespCode.SessionAlreadyOpen] });
    if (res.code !== RespCode.SessionAlreadyOpen) {
      this.sessionOpen = true;
      return res;
    }

    this.log('session left open by another host: closing it and resetting USB');
    await this.transaction(OpCode.CloseSession, []).catch((e) => this.log(`CloseSession: ${e instanceof Error ? e.message : e}`));
    await this.reopenUsb();
    this.txId = -1;
    const fresh = await this.transaction(OpCode.OpenSession, [sessionId]);
    this.sessionOpen = true;
    return fresh;
  }

  /** Release, close, reopen and reclaim the interface. */
  private async reopenUsb() {
    await this.device.releaseInterface(this.ifaceNumber).catch(() => {});
    await this.device.close().catch(() => {});
    await this.device.open();
    if (this.device.configuration === null) await this.device.selectConfiguration(1);
    try {
      await this.device.claimInterface(this.ifaceNumber);
    } catch (e) {
      await this.device.close().catch(() => {});
      throw new DeviceBusyError(e);
    }
    this.log(`reclaimed interface ${this.ifaceNumber}`);
  }

  async closeSession() {
    if (!this.sessionOpen) return;
    this.sessionOpen = false;
    await this.transaction(OpCode.CloseSession, []).catch(() => {});
  }

  async close() {
    await this.closeSession();
    await this.device.releaseInterface(this.ifaceNumber).catch(() => {});
    await this.device.close().catch(() => {});
  }

  /** Command → optional data-in phase → response. Read-only: no data-out phase in Phase 1. */
  /** Read only transaction: refuses any op that is not on the allowlist. */
  async transaction(op: number, params: number[], opts: { allowCodes?: number[] } = {}): Promise<PtpResult> {
    if (!READ_ONLY_OPS.has(op)) throw new Error(`Refusing to send ${opName(op)} (${hex(op)}): not on the read only allowlist`);
    return this.run(op, params, undefined, opts);
  }

  /**
   * The one write this app allows: point the custom settings editor at slot C1–C7
   * (SetDevicePropValue 0xD18C, uint16). It changes which slot the following reads see,
   * not the contents of any slot. Same call FilmKit and latent use for scanning presets.
   */
  async selectCustomSlot(slot: number): Promise<void> {
    if (!Number.isInteger(slot) || slot < 1 || slot > 7) throw new Error(`Invalid custom slot ${slot}: must be 1–7`);
    const data = new DataView(new ArrayBuffer(2));
    data.setUint16(0, slot, true);
    await this.run(SET_DEVICE_PROP_VALUE, [FujiProp.CustomSlot], data);
  }

  private async run(op: number, params: number[], dataOut?: DataView, opts: { allowCodes?: number[] } = {}): Promise<PtpResult> {
    const txId = ++this.txId;
    const len = HEADER_LEN + params.length * 4;
    const cmd = new DataView(new ArrayBuffer(len));
    cmd.setUint32(0, len, true);
    cmd.setUint16(4, ContainerType.Command, true);
    cmd.setUint16(6, op, true);
    cmd.setUint32(8, txId, true);
    params.forEach((p, i) => cmd.setUint32(HEADER_LEN + i * 4, p >>> 0, true));

    this.log(`→ ${opName(op)} tx=${txId}${params.length ? ' params=' + params.map((p) => hex(p, 8)).join(',') : ''}`);
    const out = await withTimeout(this.device.transferOut(this.epOut, cmd.buffer), TIMEOUT_MS, `${opName(op)} command`);
    if (out.status !== 'ok') throw new Error(`transferOut status ${out.status}`);

    if (dataOut) {
      const dlen = HEADER_LEN + dataOut.byteLength;
      const buf = new Uint8Array(dlen);
      const dv = new DataView(buf.buffer);
      dv.setUint32(0, dlen, true);
      dv.setUint16(4, ContainerType.Data, true);
      dv.setUint16(6, op, true);
      dv.setUint32(8, txId, true);
      buf.set(new Uint8Array(dataOut.buffer, dataOut.byteOffset, dataOut.byteLength), HEADER_LEN);
      this.log(`→ data ${dataOut.byteLength} bytes`);
      const dout = await withTimeout(this.device.transferOut(this.epOut, buf), TIMEOUT_MS, `${opName(op)} data`);
      if (dout.status !== 'ok') throw new Error(`transferOut status ${dout.status}`);
    }

    let data: DataView | undefined;
    for (;;) {
      const container = await this.readContainer(opName(op));
      const type = container.getUint16(4, true);
      const code = container.getUint16(6, true);

      if (type === ContainerType.Data) {
        data = new DataView(container.buffer, container.byteOffset + HEADER_LEN, container.byteLength - HEADER_LEN);
        this.log(`← data ${data.byteLength} bytes`);
        continue;
      }
      if (type === ContainerType.Response) {
        const n = (container.byteLength - HEADER_LEN) / 4;
        const rparams = Array.from({ length: n }, (_, i) => container.getUint32(HEADER_LEN + i * 4, true));
        this.log(`← ${respName(code)} (${hex(code)})`);
        if (code !== RespCode.OK && !opts.allowCodes?.includes(code)) throw new PtpError(op, code);
        return { code, params: rparams, data };
      }
      this.log(`← ignoring container type ${type}`);
    }
  }

  /** Reads one full container, which may span several bulk transfers. */
  private async readContainer(what: string): Promise<DataView> {
    let first = await this.bulkIn(what);
    // Some devices send a zero-length packet before the next container; skip a few.
    for (let i = 0; first.byteLength === 0 && i < 3; i++) first = await this.bulkIn(what);
    if (first.byteLength < HEADER_LEN) throw new Error(`Short PTP container (${first.byteLength} bytes)`);
    const total = first.getUint32(0, true);
    if (first.byteLength >= total) return new DataView(first.buffer, first.byteOffset, total);

    const buf = new Uint8Array(total);
    buf.set(new Uint8Array(first.buffer, first.byteOffset, first.byteLength), 0);
    let got = first.byteLength;
    while (got < total) {
      const chunk = await this.bulkIn(what);
      const n = Math.min(chunk.byteLength, total - got);
      buf.set(new Uint8Array(chunk.buffer, chunk.byteOffset, n), got);
      got += n;
    }
    return new DataView(buf.buffer);
  }

  private async bulkIn(what: string): Promise<DataView> {
    const res = await withTimeout(this.device.transferIn(this.epIn, READ_CHUNK), TIMEOUT_MS, `${what} reply`);
    if (res.status === 'stall') {
      await this.device.clearHalt('in', this.epIn);
      throw new Error('Endpoint stalled');
    }
    if (!res.data) throw new Error('Empty USB transfer');
    return res.data;
  }
}
