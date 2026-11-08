import { onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { FUJIFILM_VENDOR_ID, OpCode, hex } from '../ptp/codes';
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

  return { status, error, info, device, connect, disconnect };
}
