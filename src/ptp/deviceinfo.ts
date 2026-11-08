import { Reader } from './reader';

export interface DeviceInfo {
  standardVersion: number;
  vendorExtensionId: number;
  vendorExtensionVersion: number;
  vendorExtensionDesc: string;
  functionalMode: number;
  operationsSupported: number[];
  eventsSupported: number[];
  devicePropertiesSupported: number[];
  captureFormats: number[];
  imageFormats: number[];
  manufacturer: string;
  model: string;
  deviceVersion: string;
  serialNumber: string;
}

export function parseDeviceInfo(payload: DataView): DeviceInfo {
  const r = new Reader(payload);
  return {
    standardVersion: r.u16(),
    vendorExtensionId: r.u32(),
    vendorExtensionVersion: r.u16(),
    vendorExtensionDesc: r.string(),
    functionalMode: r.u16(),
    operationsSupported: r.u16Array(),
    eventsSupported: r.u16Array(),
    devicePropertiesSupported: r.u16Array(),
    captureFormats: r.u16Array(),
    imageFormats: r.u16Array(),
    manufacturer: r.string(),
    model: r.string(),
    deviceVersion: r.string(),
    serialNumber: r.string(),
  };
}
