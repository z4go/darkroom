// PTP (ISO 15740) codes used by the read-only probe and explorer.
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
  GetStorageIDs: 0x1004,
  GetStorageInfo: 0x1005,
  GetNumObjects: 0x1006,
  GetObjectHandles: 0x1007,
  GetObjectInfo: 0x1008,
  GetDevicePropDesc: 0x1014,
  GetDevicePropValue: 0x1015,
} as const;

/**
 * Safety allowlist: the only operations the transport will send.
 * Everything here is read only. Ops like FormatStore or DeleteObject have no data
 * phase, so "no data out" alone would not protect the camera.
 */
export const READ_ONLY_OPS: ReadonlySet<number> = new Set(Object.values(OpCode));

/** Write op, deliberately kept out of OpCode / READ_ONLY_OPS. Only PtpTransport.selectCustomSlot sends it. */
export const SET_DEVICE_PROP_VALUE = 0x1016;

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
  0x2004: 'InvalidTransactionID',
  0x2005: 'OperationNotSupported',
  0x2006: 'ParameterNotSupported',
  0x2007: 'IncompleteTransfer',
  0x2008: 'InvalidStorageID',
  0x2009: 'InvalidObjectHandle',
  0x200a: 'DevicePropNotSupported',
  0x200b: 'InvalidObjectFormatCode',
  0x200f: 'AccessDenied',
  0x2013: 'StoreNotAvailable',
  0x2014: 'SpecificationByFormatUnsupported',
  0x2017: 'UnknownVendorCode',
  0x2019: 'DeviceBusy',
  0x201a: 'InvalidParentObject',
  0x201d: 'InvalidParameter',
  0x201e: 'SessionAlreadyOpen',
  0x201f: 'TransactionCancelled',
};

export const DataType = {
  INT8: 0x0001, UINT8: 0x0002, INT16: 0x0003, UINT16: 0x0004, INT32: 0x0005, UINT32: 0x0006,
  INT64: 0x0007, UINT64: 0x0008, INT128: 0x0009, UINT128: 0x000a, STR: 0xffff,
} as const;

const DATATYPE_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(DataType).map(([k, v]) => [v, k.toLowerCase()]),
);

export const dataTypeName = (t: number) =>
  t === DataType.STR ? 'str' : t & 0x4000 ? `${DATATYPE_NAMES[t & 0x0fff] ?? hex(t & 0x0fff)}[]` : (DATATYPE_NAMES[t] ?? hex(t));

const PROP_NAMES: Record<number, string> = {
  0x5001: 'BatteryLevel',
  // Fujifilm (names from FilmKit / libfuji)
  0xd16e: 'FujiUSBMode',
  0xd185: 'FujiRawConvProfile',
  0xd18c: 'FujiCustomSlot',
  0xd18d: 'FujiCustomSlotName',
  // Generic MTP personality (libgphoto2 ptp.c)
  0xd303: 'MTP UseDeviceStage',
  0xd406: 'MTP SessionInitiatorInfo',
  0xd407: 'MTP PerceivedDeviceType',
  0x5003: 'ImageSize',
  0x5005: 'WhiteBalance',
  0x500f: 'ExposureIndex',
  0x5011: 'DateTime',
};
export const propName = (code: number) => PROP_NAMES[code] ?? '';

export const FujiProp = { UsbMode: 0xd16e, CustomSlot: 0xd18c } as const;

/** 0xD16E values (libfuji fuji_usb.c). */
export const USB_MODE_NAMES: Record<number, string> = { 5: 'Tether', 6: 'RAW CONV./BACKUP RESTORE', 8: 'Webcam' };

export const hex = (n: number, width = 4) => '0x' + n.toString(16).padStart(width, '0');
export const opName = (code: number) => OP_NAMES[code] ?? hex(code);
export const respName = (code: number) => RESP_NAMES[code] ?? hex(code);
