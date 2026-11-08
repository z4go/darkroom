// PTP (ISO 15740) codes used by the read-only probe.
export const ContainerType = {
  Command: 1,
  Data: 2,
  Response: 3,
  Event: 4,
} as const;

export const OpCode = {
  GetDeviceInfo: 0x1001,
  OpenSession: 0x1002,
  CloseSession: 0x1003,
} as const;

export const RespCode = {
  OK: 0x2001,
  SessionAlreadyOpen: 0x201e,
} as const;

export const FUJIFILM_VENDOR_ID = 0x04cb;

// USB Still Image Capture class (PTP).
export const USB_CLASS_STILL_IMAGE = 0x06;

const OP_NAMES: Record<number, string> = {
  0x1001: 'GetDeviceInfo',
  0x1002: 'OpenSession',
  0x1003: 'CloseSession',
  0x1004: 'GetStorageIDs',
  0x1005: 'GetStorageInfo',
  0x1006: 'GetNumObjects',
  0x1007: 'GetObjectHandles',
  0x1008: 'GetObjectInfo',
  0x1009: 'GetObject',
  0x100a: 'GetThumb',
  0x100b: 'DeleteObject',
  0x100c: 'SendObjectInfo',
  0x100d: 'SendObject',
  0x100e: 'InitiateCapture',
  0x100f: 'FormatStore',
  0x1014: 'GetDevicePropDesc',
  0x1015: 'GetDevicePropValue',
  0x1016: 'SetDevicePropValue',
  0x101b: 'GetPartialObject',
  // MTP extensions
  0x9801: 'GetObjectPropsSupported',
  0x9802: 'GetObjectPropDesc',
  0x9803: 'GetObjectPropValue',
  0x9805: 'GetObjectPropList',
};

const RESP_NAMES: Record<number, string> = {
  0x2001: 'OK',
  0x2002: 'GeneralError',
  0x2003: 'SessionNotOpen',
  0x2005: 'OperationNotSupported',
  0x2006: 'ParameterNotSupported',
  0x2019: 'DeviceBusy',
  0x201d: 'InvalidParameter',
  0x201e: 'SessionAlreadyOpen',
};

export const hex = (n: number, width = 4) => '0x' + n.toString(16).padStart(width, '0');
export const opName = (code: number) => OP_NAMES[code] ?? hex(code);
export const respName = (code: number) => RESP_NAMES[code] ?? hex(code);
