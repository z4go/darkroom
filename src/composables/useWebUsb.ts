/** WebUSB is only in Chromium browsers (desktop Chrome/Edge, Android Chrome). */
export function useWebUsb() {
  const supported = typeof navigator !== 'undefined' && 'usb' in navigator;
  return { supported };
}
