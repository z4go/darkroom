#!/bin/sh
# Keep macOS's ptpcamerad from grabbing the camera so the browser can claim it.
# Usage: bun run free-camera [minutes]   (default 30, Ctrl+C to stop early)
# macOS restarts ptpcamerad by itself once this stops.

set -u
MINUTES="${1:-30}"

if [ "$(uname)" != "Darwin" ]; then
  echo "free-camera is only needed on macOS. On Android, close apps that opened the camera; on Windows, close photo importers."
  exit 0
fi

case "$MINUTES" in
  ''|*[!0-9]*) echo "Minutes must be a whole number, got: $MINUTES" >&2; exit 1 ;;
esac

camera_owner() {
  ioreg -l -w0 2>/dev/null | grep -A30 '"USB Product Name" = "USB PTP Camera"' | grep -m1 UsbExclusiveOwner | sed 's/.*= "//; s/"$//'
}

trap 'echo; echo "Stopped. macOS will restart ptpcamerad on its own."; exit 0' INT TERM

echo "Keeping ptpcamerad stopped for $MINUTES min. Quit Photos and Image Capture too. Ctrl+C to stop."
end=$(( $(date +%s) + MINUTES * 60 ))
last=""
while [ "$(date +%s)" -lt "$end" ]; do
  killall -9 ptpcamerad 2>/dev/null
  owner="$(camera_owner)"
  if system_profiler SPUSBDataType 2>/dev/null | grep -q "USB PTP Camera"; then
    if [ -n "$owner" ]; then state="camera connected, held by: $owner"; else state="camera connected and free. Press Connect in the browser."; fi
  else
    state="no camera detected. Plug it in (Connection Mode: USB RAW CONV./BACKUP RESTORE)."
  fi
  if [ "$state" != "$last" ]; then echo "$(date +%H:%M:%S)  $state"; last="$state"; fi
  sleep 1
done
echo "Time is up. macOS will restart ptpcamerad on its own."
