import { onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { FUJIFILM_VENDOR_ID, FujiProp, OpCode, USB_MODE_NAMES, hex } from '../ptp/codes';
import { parseDeviceInfo, type DeviceInfo } from '../ptp/deviceinfo';
import { DeviceBusyError, PtpTransport } from '../ptp/transport';
import type { LogFn } from './useLog';

export type CameraStatus = 'idle' | 'connecting' | 'connected';

export type CameraErrorKind = 'busy' | 'cancelled' | 'denied' | 'unplugged' | 'other';
export interface CameraError {
  kind: CameraErrorKind;
  message: string;
}

function classify(e: unknown): CameraError {
  const message = e instanceof Error ? e.message : String(e);
  if (e instanceof DeviceBusyError) return { kind: 'busy', message };
  if (e instanceof DOMException && e.name === 'NotFoundError') return { kind: 'cancelled', message };
  if (e instanceof DOMException && e.name === 'SecurityError') return { kind: 'denied', message };
  return { kind: 'other', message };
}

/** Read-only camera session: pick a Fujifilm device, open PTP, read DeviceInfo. */
export function useCamera(log: LogFn) {
  const status = ref<CameraStatus>('idle');
  const error = ref<CameraError | null>(null);
  const info = shallowRef<DeviceInfo | null>(null);
  const device = shallowRef<USBDevice | null>(null);
  /** Fuji USB mode from 0xD16E, or null when the camera doesn't expose it (generic MTP personality). */
  const usbMode = ref<number | null>(null);
  let transport: PtpTransport | null = null;

  async function connect() {
    if (status.value !== 'idle') return;
    error.value = null;
    try {
      const picked = await navigator.usb.requestDevice({ filters: [{ vendorId: FUJIFILM_VENDOR_ID }] });
      log(`selected ${picked.manufacturerName ?? ''} ${picked.productName ?? ''} (${hex(picked.vendorId)}:${hex(picked.productId)})`);
      status.value = 'connecting';

      transport = await PtpTransport.open(picked, log);
      await transport.openSession();
      const res = await transport.transaction(OpCode.GetDeviceInfo, []);
      if (!res.data) throw new Error('GetDeviceInfo returned no data');

      info.value = parseDeviceInfo(res.data);
      device.value = picked;

      usbMode.value = null;
      try {
        const m = await transport.transaction(OpCode.GetDevicePropValue, [FujiProp.UsbMode]);
        if (m.data && m.data.byteLength >= 1) usbMode.value = m.data.byteLength >= 2 ? m.data.getUint16(0, true) : m.data.getUint8(0);
        log(`USB mode 0xD16E = ${usbMode.value} (${USB_MODE_NAMES[usbMode.value ?? -1] ?? 'unknown'})`);
      } catch {
        log('USB mode 0xD16E not available: camera is presenting a generic MTP/PTP interface, not Fuji RAW CONV.');
      }
      const hasSlots = info.value.devicePropertiesSupported.includes(FujiProp.CustomSlot);
      log(hasSlots ? 'custom slot property 0xD18C is advertised' : 'custom slot property 0xD18C is NOT advertised');
      status.value = 'connected';
    } catch (e) {
      log(`error: ${e instanceof Error ? `${e.name}: ${e.message}` : String(e)}`);
      if (e instanceof Error && e.cause) log(`cause: ${String(e.cause)}`);
      await transport?.close().catch(() => {});
      transport = null;
      status.value = 'idle';
      error.value = classify(e);
    }
  }

  /** Runs one PTP transaction on the open session. The transport only allows read only ops. */
  async function transaction(op: number, params: number[] = []) {
    if (!transport || status.value !== 'connected') throw new Error('Camera not connected');
    return transport.transaction(op, params);
  }

  /** The single allowed write: select custom slot 1–7 (0xD18C). */
  async function selectCustomSlot(slot: number) {
    if (!transport || status.value !== 'connected') throw new Error('Camera not connected');
    return transport.selectCustomSlot(slot);
  }

  /** Write one custom slot property (0xD18C–0xD1A5 only; enforced by the transport). */
  async function writeProp(code: number, data: DataView) {
    if (!transport || status.value !== 'connected') throw new Error('Camera not connected');
    return transport.writeProp(code, data);
  }

  async function disconnect() {
    await transport?.close().catch(() => {});
    transport = null;
    status.value = 'idle';
    log('disconnected');
  }

  const onUsbDisconnect = (ev: USBConnectionEvent) => {
    if (!transport || ev.device !== transport.device) return;
    transport = null;
    status.value = 'idle';
    error.value = { kind: 'unplugged', message: 'Camera unplugged' };
    log('device disconnected');
  };

  onMounted(() => navigator.usb?.addEventListener('disconnect', onUsbDisconnect));
  onUnmounted(() => {
    navigator.usb?.removeEventListener('disconnect', onUsbDisconnect);
    void transport?.close();
  });

  return { status, error, info, device, usbMode, connect, disconnect, transaction, selectCustomSlot, writeProp };
}
