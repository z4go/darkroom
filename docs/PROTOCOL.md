# Protocol notes

Findings about Fujifilm's PTP-over-USB implementation. These come from reverse engineering, are unofficial, and may be wrong.

## Transport

- USB vendor ID `0x04cb` (Fujifilm).
- The camera exposes a Still Image class interface (class `0x06`, subclass `0x01`, protocol `0x01`) with bulk IN, bulk OUT and interrupt IN endpoints when Connection Mode is **USB RAW CONV./BACKUP RESTORE**.
- Standard PTP containers: `u32 length, u16 type, u16 code, u32 transactionId, params…` (little-endian). Types: 1 command, 2 data, 3 response, 4 event.

## Session

1. `OpenSession (0x1002)` with session ID 1 and transaction ID 0.
2. `GetDeviceInfo (0x1001)` → DeviceInfo dataset.

## Device dumps

_TODO: add the X100VI DeviceInfo JSON from the probe page (Copy as JSON)._

## Custom settings (C1–C7)

_TODO (Phase 2)._

## References

- ISO 15740 (PTP)
- FilmKit, latent, libfuji
