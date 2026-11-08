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

### X100VI, firmware 1.20

Captured 2026-11-08 with the web probe on macOS (Arc), Connection Mode **USB RAW CONV./BACKUP RESTORE**.

- USB `0x04cb:0x0305`, product string "USB PTP Camera"
- One Still Image interface (number 0), bulk IN and bulk OUT both endpoint 1
- `OpenSession` right after stopping `ptpcamerad` returned `SessionAlreadyOpen (0x201e)`: the daemon had left a session open. Treat it as success.
- `GetDeviceInfo` data phase: 261 bytes

| Field | Value |
|---|---|
| StandardVersion | 100 (1.00) |
| VendorExtensionID | 6 |
| VendorExtensionVersion | 100 |
| VendorExtensionDesc | `fujifilm.co.jp: 1.0; ` |
| FunctionalMode | 0 |
| Manufacturer / Model | FUJIFILM / X100VI |
| DeviceVersion | 1.20 |

**Operations (25)**

| Code | Name | Notes |
|---|---|---|
| `0x1001`–`0x100D` | GetDeviceInfo … SendObject | standard |
| `0x100F` | FormatStore | standard |
| `0x1014` / `0x1015` / `0x1016` | GetDevicePropDesc / GetDevicePropValue / SetDevicePropValue | standard |
| `0x101B` | GetPartialObject | standard |
| `0x900C` | Fuji SendObjectInfo (per libgphoto2) | vendor; likely backup/restore upload |
| `0x900D` | Fuji SendObject (per libgphoto2) | vendor; likely backup/restore upload |
| `0x901D` | unknown | vendor |
| `0x9801` / `0x9802` / `0x9803` / `0x9805` | GetObjectPropsSupported / GetObjectPropDesc / GetObjectPropValue / GetObjectPropList | MTP |

**Events (7):** `0x4002` ObjectAdded, `0x4003` ObjectRemoved, `0x4004` StoreAdded, `0x4005` StoreRemoved, `0x4006` DevicePropChanged, `0x4008` DeviceInfoChanged, `0x4009` RequestObjectTransfer.

**Device properties (4):** `0x5001` BatteryLevel, `0xD303`, `0xD406`, `0xD407` (vendor, meaning unknown).

**Image formats:** `0x3801` EXIF/JPEG, `0x3808` JFIF, `0x3812` (non standard; possibly RAF).

**Capture formats:** none.

### Observations

- Only four properties are advertised. Custom settings (C1–C7) are not in the list, so they are either reachable through unadvertised vendor property codes or only through the backup/restore object path (`0x900C`/`0x900D` + GetObject).
- Next step (Rust probe): read `0xD303`, `0xD406`, `0xD407`; sweep GetDevicePropValue over vendor ranges (`0xD000`–`0xD3FF`) and log which codes answer; list storage/objects in this mode to see whether a settings backup object is exposed.

## Custom settings (C1–C7)

_TODO (Phase 2)._

## References

- ISO 15740 (PTP)
- FilmKit, latent, libfuji
