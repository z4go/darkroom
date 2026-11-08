import { DataType, dataTypeName } from './codes';
import { Reader } from './reader';

export type PropValue = number | string | (number | string)[];

/** Reads one value of a PTP data type. 64/128-bit integers become decimal strings for JSON safety. */
export function readValue(r: Reader, type: number): PropValue {
  if (type === DataType.STR) return r.string();
  if (type & 0x4000) {
    const n = r.u32();
    const out: (number | string)[] = [];
    for (let i = 0; i < n; i++) out.push(readValue(r, type & 0x0fff) as number | string);
    return out;
  }
  switch (type) {
    case DataType.INT8: return r.i8();
    case DataType.UINT8: return r.u8();
    case DataType.INT16: return r.i16();
    case DataType.UINT16: return r.u16();
    case DataType.INT32: return r.i32();
    case DataType.UINT32: return r.u32();
    case DataType.INT64: return r.i64().toString();
    case DataType.UINT64: return r.u64().toString();
    case DataType.INT128:
    case DataType.UINT128: {
      const lo = r.u64();
      const hi = r.u64();
      return ((hi << 64n) | lo).toString();
    }
    default:
      throw new Error(`Unknown PTP data type 0x${type.toString(16)}`);
  }
}

export interface PropDesc {
  code: number;
  dataType: number;
  dataTypeName: string;
  writable: boolean;
  factoryDefault: PropValue;
  current: PropValue;
  form: { kind: 'none' } | { kind: 'range'; min: PropValue; max: PropValue; step: PropValue } | { kind: 'enum'; values: PropValue[] };
}

export function parsePropDesc(data: DataView): PropDesc {
  const r = new Reader(data);
  const code = r.u16();
  const dataType = r.u16();
  const writable = r.u8() === 1;
  const factoryDefault = readValue(r, dataType);
  const current = readValue(r, dataType);
  let form: PropDesc['form'] = { kind: 'none' };
  if (r.remaining > 0) {
    const flag = r.u8();
    if (flag === 1) form = { kind: 'range', min: readValue(r, dataType), max: readValue(r, dataType), step: readValue(r, dataType) };
    else if (flag === 2) {
      const n = r.u16();
      const values: PropValue[] = [];
      for (let i = 0; i < n; i++) values.push(readValue(r, dataType));
      form = { kind: 'enum', values };
    }
  }
  return { code, dataType, dataTypeName: dataTypeName(dataType), writable, factoryDefault, current, form };
}

export interface StorageInfo {
  id: number;
  storageType: number;
  filesystemType: number;
  accessCapability: number;
  maxCapacity: string;
  freeSpaceBytes: string;
  freeSpaceImages: number;
  description: string;
  volumeLabel: string;
}

export function parseStorageInfo(id: number, data: DataView): StorageInfo {
  const r = new Reader(data);
  return {
    id,
    storageType: r.u16(),
    filesystemType: r.u16(),
    accessCapability: r.u16(),
    maxCapacity: r.u64().toString(),
    freeSpaceBytes: r.u64().toString(),
    freeSpaceImages: r.u32(),
    description: r.string(),
    volumeLabel: r.string(),
  };
}

export interface ObjectInfo {
  handle: number;
  storageId: number;
  format: number;
  protection: number;
  size: number;
  parent: number;
  associationType: number;
  filename: string;
  captureDate: string;
  modificationDate: string;
}

export function parseObjectInfo(handle: number, data: DataView): ObjectInfo {
  const r = new Reader(data);
  const storageId = r.u32();
  const format = r.u16();
  const protection = r.u16();
  const size = r.u32();
  r.u16(); // thumb format
  r.u32(); // thumb size
  r.u32(); // thumb width
  r.u32(); // thumb height
  r.u32(); // image width
  r.u32(); // image height
  r.u32(); // bit depth
  const parent = r.u32();
  const associationType = r.u16();
  r.u32(); // association desc
  r.u32(); // sequence number
  const filename = r.string();
  const captureDate = r.string();
  const modificationDate = r.string();
  return { handle, storageId, format, protection, size, parent, associationType, filename, captureDate, modificationDate };
}

export function parseU32Array(data: DataView): number[] {
  return new Reader(data).u32Array();
}
