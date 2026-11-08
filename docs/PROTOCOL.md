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

### Explorer results (X100VI fw 1.20, 2026-11-08)

Captured with `/app/explore/`, same mode and session as above.

**Advertised property descriptors** (GetDevicePropDesc):

| Code | Raw descriptor | Type | Access | Default / current | Form |
|---|---|---|---|---|---|
| `0x5001` BatteryLevel | `01 50 02 00 00 0a 0a 01 00 0a 01` | uint8 | get | 10 / 10 | range 0–10 step 1 |
| `0xD303` | `03 d3 02 00 00 01 01 00` | uint8 | get | 1 / 1 | none |
| `0xD406` | `06 d4 ff ff 01 01 00 00 01 00 00 00` | str | **get/set** | "" / "" | none |
| `0xD407` | `07 d4 06 00 00 01 00 00 00 01 00 00 00 00` | uint32 | get | 1 / 1 | none |

`0xD406` is the only writable property. Guess (unconfirmed): a host/client identification string that the desktop app sets on connect.

**Property sweep `0xD000`–`0xD3FF`** (GetDevicePropValue): 1024 tried, 1 answered (`0xD303` → `01`), 1023 `DevicePropNotSupported (0x200a)`. No hidden properties in this range in this mode.

**Property sweep `0x5000`–`0x50FF`:** 256 tried, 1 answered (`0x5001` BatteryLevel → `0a`), 255 `DevicePropNotSupported`. None of the other standard PTP properties are exposed.

**Property sweep `0xD400`–`0xD7FF`:** 1024 tried, 2 answered (`0xD406` → `01 00 00` = "", `0xD407` → `01 00 00 00` = 1), 1022 `DevicePropNotSupported`.

**Property sweep `0xD800`–`0xDFFF`:** 2048 tried, 0 answered, 2048 `DevicePropNotSupported`.

**Summary:** the whole vendor property space `0xD000`–`0xDFFF` plus `0x5000`–`0x50FF` was swept. In this mode and session state the camera answers exactly the four advertised properties and nothing else.

**Storage:** one store `0x10000001`, description "External Memory", StorageType `0x0004` (removable RAM / SD), FilesystemType `0x0003` (DCF), AccessCapability 0 (read/write). Root objects: 1, `DCIM` (format `0x3001`, association/folder). No settings backup object at the root.

### Observations

- Only four properties are advertised. Custom settings (C1–C7) are not in the list, so they are either reachable through unadvertised vendor property codes or only through the backup/restore object path (`0x900C`/`0x900D` + GetObject).
- Done: advertised descriptors, sweep `0xD000`–`0xD3FF`, storage listing (see above). Custom settings are not reachable by plain GetDevicePropValue in this range, and there is no backup object at the root.
- Prior art (see Custom settings below) says these four are the generic MTP personality and no handshake via `0xD406` is needed. Next test: fresh session after USB reset, camera never touched by `ptpcamerad`; expect `0xD16E` = 6 and `0xD18C` in DeviceInfo.

### X100VI fw 1.20, Fuji RAW CONV. personality (2026-11-08)

Reproduced by: power cycle, re-select **USB RAW CONV./BACKUP RESTORE**, start `bun run free-camera` **before** plugging in, then connect. With a fresh session (no inherited `SessionAlreadyOpen`), DeviceInfo is completely different:

- **Operations (20):** `0x1001`, `0x1002`, `0x1003`, `0x1004`, `0x1005`, `0x1006`, `0x1007`, `0x1008`, `0x1009`, `0x100A`, `0x100B`, `0x1014`, `0x1015`, `0x1016`, `0x1017`, `0x900C`, `0x900D`, `0x901D`, `0x100C`, `0x100D`. Gone vs the MTP personality: `0x100F`, `0x101B`, MTP `0x98xx`. New: `0x1017` ResetDevicePropValue (standard). Not on our allowlist.
- **Events:** none advertised.
- **Device properties (61):** `0x5005`, `0x5015`, `0xD001`, `0xD007`, `0xD008`, `0xD00A`, `0xD00B`, `0xD00C`, `0xD017`, `0xD018`, `0xD01C`, `0xD023`, `0xD029`, `0xD02E`, `0xD030`, `0xD031`, `0xD032`, `0xD104`, `0xD16E`, `0xD17B`, `0xD183`, `0xD184`, `0xD185`, `0xD186`, `0xD187`, `0xD189`, `0xD18C`, `0xD18D`, `0xD18E`, `0xD18F`, `0xD190`, `0xD191`, `0xD192`, `0xD193`, `0xD194`, `0xD195`, `0xD196`, `0xD197`, `0xD198`, `0xD199`, `0xD19A`, `0xD19B`, `0xD19C`, `0xD19D`, `0xD19E`, `0xD19F`, `0xD1A0`, `0xD1A1`, `0xD1A2`, `0xD1A3`, `0xD1A4`, `0xD1A5`, `0xD208`, `0xD20B`, `0xD212`, `0xD21C`, `0xD320`, `0xD321`, `0xD34D`, `0xD36A`, `0xD36B`.
  - `0xD16E` USB mode, `0xD18C` slot select, `0xD18D` slot name, `0xD18E`–`0xD1A5` slot settings (all 24), `0xD183`–`0xD187` RAW conversion, `0xD212`, `0xD21C`: matches FilmKit/vcam.
- **Capture formats:** `0x3801`, `0x3812`, `0x3800`, `0xB103`, `0x380D`.
- **Image formats:** `0x3801`, `0x3812`, `0x5000` (backup object), `0xF802` (Fuji upload `FUP_FILE.dat`), `0x3800`, `0xB103`, `0x380D`.

**Property values in this mode** (GetDevicePropValue; read only, no slot switching):

- **GetDevicePropDesc returns `GeneralError (0x2002)` for every property** in this mode. Only GetDevicePropValue works, so types and allowed values have to come from prior art, not from the camera.
- `0xD16E` = 6 → USB mode RAW CONV./BACKUP RESTORE, confirmed.
- `0xD184` = "FF179503,FA179503" (IOP codes), `0xD186` / `0xD187` = "X100VI_0100", `0xD189` = 1, `0xD21C` = 1, `0xD212` = 0, `0xD208` = `0x0304`, `0xD20B` = "", `0xD36A` = 12 (u32), `0xD36B` = "93,0,0".
- `0xD17B`, `0xD183`, `0xD185`: GeneralError on value read too (RAW conversion profile; probably only valid after a RAF upload).
- Storage in this mode: two virtual stores, "Still" (`0x10000001`) and "Live" (`0x10000002`), StorageType 3, max/free all `0xFF…`. Their volume label is the serial number with a 1/2 prefix: **redact it in dumps**.

**Currently selected slot, decoded with FilmKit's table** (`0xD18C` = 1 → C1, not yet confirmed against the camera menu):

| Code | Raw | Decoded |
|---|---|---|
| `D18D` name | "SMMM" | SMMM |
| `D18E` ImageSize | 7 | |
| `D18F` ImageQuality | 3 | (FilmKit default is 4) |
| `D190` Dynamic range | 400 | DR400 |
| `D191` | 0 | unknown |
| `D192` Film simulation | 11 | Classic Chrome (if the enum counts 1 Provia … 11 Classic Chrome … 0x13 Nostalgic Neg, 0x14 Reala Ace) |
| `D193` / `D194` Mono WC / MG | 0 / 0 | n/a (colour sim) |
| `D195` Grain | 5 | Strong, Large |
| `D196` Color Chrome | 3 | Strong |
| `D197` Color Chrome FX Blue | 3 | Strong |
| `D198` Smooth Skin | 1 | Off |
| `D199` WB mode | 2 | Auto |
| `D19A` / `D19B` WB shift R / B | 5 / `0xFFFA` | R +5, B −6 |
| `D19C` Colour temp | 10000 | 10000 K (unused with Auto WB) |
| `D19D` / `D19E` Highlight / Shadow | `0xFFEC` / `0xFFEC` | −2 / −2 |
| `D19F` Color | 40 | +4 |
| `D1A0` Sharpness | 0 | 0 |
| `D1A1` High ISO NR | `0x8000` | −4 |
| `D1A2` Clarity | `0xFFD8` | −4 |
| `D1A3` Long exposure NR | 1 | On |
| `D1A4` Color space | 1 | sRGB |
| `D1A5` | 7 | unknown |

**Takeaway:** never reuse a session another host left open. If `ptpcamerad` touches the camera first, the camera presents its generic MTP personality (4 properties) and the Fuji properties do not exist.

## Custom settings (C1–C7)

From prior art (not yet confirmed on our side). Sources: FilmKit `eggricesoy/filmkit@9e3bbcf` (`QUICK_REFERENCE.md`, `src/ptp/constants.ts`, `src/ptp/session.ts`), latent `formray/latent@8b7c644`, libfuji `petabyt/libfuji@7a421a7`, vcam `petabyt/vcam@c25376e`, rawji `pinpox/rawji@02cb559`, libgphoto2 `@26a57b2`.

### Why our sweep found nothing

The four properties we saw (`0xD303`, `0xD406`, `0xD407`) are Microsoft MTP properties (`UseDeviceStage`, `SessionInitiatorInfo`, `PerceivedDeviceType`, libgphoto2 `ptp.c`), the camera's generic MTP personality. In real RAW CONV./BACKUP RESTORE mode the projects expect:

- `0xD16E` USB mode = 6 (5 tether, 8 webcam). libfuji treats a failed read as card reader mode.
- `0xD18C` listed in DeviceInfo, plus `0xD184`, `0xD185`, `0xD212`.

Most likely cause: we reused the session `ptpcamerad` left open (`SessionAlreadyOpen`). FilmKit and rawji never reuse it: on `0x201E` they CloseSession, reset USB (release, close, reopen, claim, transaction id 0) and OpenSession again. The transport now does the same. Also start `bun run free-camera` before plugging the camera in so the daemon never opens a session.

### Slot properties (FilmKit, X RAW Studio captures on an X100VI)

Plain Get/SetDevicePropValue, no vendor op:

- `0xD18C` select slot, uint16 1–7 (wait ~100 ms after writing)
- `0xD18D` slot name, PTP string
- `0xD18E`–`0xD1A5` 24 settings of the selected slot

| Code | Field | Encoding |
|---|---|---|
| `D18E` | ImageSize | default 7 |
| `D18F` | ImageQuality | default 4 |
| `D190` | Dynamic range | percent: 100, 200, 400 |
| `D191` | unknown | 0 |
| `D192` | Film simulation | 1 Provia … `0x13` Nostalgic Neg, `0x14` Reala Ace |
| `D193` / `D194` | Mono warm/cool, magenta/green | ×10, B&W sims only, 0 rejected on write |
| `D195` | Grain | 1 Off, 2 WeakSmall, 3 StrongSmall, 4 WeakLarge, 5 StrongLarge |
| `D196` / `D197` | Color Chrome / FX Blue | 1 Off, 2 Weak, 3 Strong |
| `D198` | Smooth Skin | 1 Off, 2 Weak, 3 Strong |
| `D199` | WB mode | 0 AsShot, 2 Auto, 4 Daylight, 6 Incandescent, 8 Underwater, `0x8001`–`3` Fluorescent, `0x8006` Shade, `0x8007` ColorTemp, `0x8021` Ambience |
| `D19A` / `D19B` | WB shift R / B | int16 |
| `D19C` | Color temperature K | uint16, only when WB = ColorTemp |
| `D19D` / `D19E` | Highlight / Shadow | int16 ×10 |
| `D19F` | Color | int16 ×10, rejected for mono sims |
| `D1A0` | Sharpness | int16 ×10 |
| `D1A1` | High ISO NR | −4 `0x8000`, −3 `0x7000`, −2 `0x4000`, −1 `0x3000`, 0 `0x2000`, +1 `0x1000`, +2 `0x0000`, +3 `0x6000`, +4 `0x5000` |
| `D1A2` | Clarity | ×10 |
| `D1A3` | Long exposure NR | 1 on |
| `D1A4` | Color space | 1 sRGB, 2 AdobeRGB |
| `D1A5` | unknown | 7 |

Reading all slots (FilmKit `scanPresets`): remember current `D18C`, for 1..7 write `D18C`, wait 100 ms, read `D18D` and `D18E`–`D1A5`, then restore the original slot. latent also reads `D18C` back to confirm the switch. **Selecting a slot is a write** (SetDevicePropValue on `D18C`), even for read only scanning.

Write cautions (FilmKit): write in X RAW Studio order (`D19C` right after `D199`, then `D19A`/`D19B`); treat refused writes as warnings and read everything back.

### Full scan on X100VI fw 1.20 (2026-11-08)

`/app/` Read C1–C7 (select via `0xD18C`, wait 100 ms, read, restore). All seven names match FilmKit v0.3.2 on the same camera, and the decoded values are plausible recipes:

| Slot | Name | Film simulation | Notable |
|---|---|---|---|
| C1 | SMMM | Classic Chrome (11) | DR400, WB Auto R+5 B−6 |
| C2 | KP400 | Provia (1) | DR raw `0xFFFF` (treated as Auto), WB Daylight |
| C3 | KE 64 | Classic Chrome (11) | DR200 |
| C4 | 800T | Eterna (16) | WB Fluorescent 3 (`0x8003`) |
| C5 | BW | Acros (12) | mono sim: Color omitted, Mono WC/MG 0/0 |
| C6 | VT | Classic Chrome (11) | WB Color temperature 7350 K |
| C7 | MC | Velvia (2) | Highlight −0.5 (half steps exist) |

Confirms: film simulation enum (1 Provia, 2 Velvia, 11 Classic Chrome, 12 Acros, 16 Eterna), WB colour temperature only meaningful with `0x8007`, Highlight/Shadow in tenths. New: Dynamic range `0xFFFF` (likely DR Auto, unconfirmed).

### First write (X100VI fw 1.20, 2026-11-08)

Wrote preset "Anime" (Classic Chrome, Grain Off) into C1 with `/app/` Load. Name and film simulation read back correctly. **Grain:** wrote `D195` = 1 (FilmKit's Off), read back **7**. libgphoto2's table for the live property `0xD023` (`camlibs/ptp2/config.c` `fuji_graineffect`) has 2–5 exactly like FilmKit plus **6 = Off Small, 7 = Off Large**. The previous C1 grain was Strong Large, so the camera kept the size. FilmKit's own "Off = 1" was never captured (only 2–5 are marked confirmed). The app now reads 6/7 as Off and treats 1 ↔ 6/7 as equal when verifying. Still writing 1; writing 6 (Off Small) explicitly would make the stored value deterministic, untested.

**Image quality `D18F`:** presets created in the app first wrote FilmKit's default 4, which made the slot shoot RAW+JPEG. The app now writes an explicit image quality (default 2 = Fine). Mapping 1 RAW, 2 Fine, 3 Normal, 4 Fine+RAW, 5 Normal+RAW comes from libgphoto2's Fuji image quality table; for the slot property it is inferred, to be confirmed on the camera.

### Other paths

- `0x900C` / `0x900D`: Fuji SendObjectInfo / SendObject2 for uploading a RAF to convert (format `0xF802`, `FUP_FILE.dat`). `0xD185` is the RAW conversion profile, not the slot store. `0x901D`: unknown, unused by all projects.
- Backup (libfuji): GetObjectInfo + GetObject on virtual handle 0 (format `0x5000`, not listed by GetObjectHandles). Restore: SendObjectInfo `0x100C` + SendObject `0x100D`. Backup file format undocumented.

## References

- ISO 15740 (PTP)
- FilmKit, latent, libfuji
