# darkroom plan

PTP-over-USB toolkit to read and write Fujifilm custom settings (C1–C7): a Rust probe for protocol research, plus a WebUSB web app.

The GitHub Pages site (https://z4go.github.io/darkroom/) exists from Phase 1 and grows with each phase, so every milestone can be tested on a real phone (Android Chrome) or desktop browser right away.

## Site layout

| Path | Content |
|------|---------|
| `/` | Landing: what it does, supported cameras and firmware, browser support, safety notes, Connection Mode setup, macOS `ptpcamerad` and Android "busy" workarounds, GitHub link |
| `/app/` | The WebUSB tool |
| `docs/PROTOCOL.md` (linked from the site) | Protocol findings |

**Stack:** Vite + Vue 3 (SFC components + composables) + TypeScript, built with bun, static output, no backend, no CDNs or trackers. `base: '/darkroom/'`. Mobile-first, white theme.

**Deploy:** `.github/workflows/pages.yml`. A push to `main` builds and deploys to Pages; a PR only typechecks and builds.

## Phase 1: connect and identify (read-only)

- [x] Landing page
- [x] `/app/`: WebUSB connect (filter `vendorId 0x04cb`), OpenSession, GetDeviceInfo, show model, firmware, supported ops and properties, copy JSON
- [x] No-WebUSB fallback message (Safari, Firefox, iOS)
- [x] Friendly "device busy / claimInterface failed" explanation (macOS daemons, Android apps)
- [x] Pages deploy workflow
- [ ] Turn on Pages in repo settings (Source: GitHub Actions)
- [ ] Test on Android Chrome and on desktop Chrome/Edge on macOS; record the X100VI firmware version on the landing page
- [ ] Rust probe (`probe/`, `nusb` or `rusb`): same GetDeviceInfo dump from the CLI, plus raw GetDevicePropValue for vendor properties
- [ ] Start `docs/PROTOCOL.md` with the X100VI DeviceInfo dump

## Phase 2: read custom settings

- [ ] Find the vendor properties and ops for selecting a C-slot and reading its fields (cross-reference FilmKit, latent, libfuji)
- [ ] Decode film simulation, grain, color chrome, WB and shift, DR, tone curve, color, sharpness, NR, clarity
- [ ] Rust probe: dump C1–C7 to JSON
- [ ] Site: show C1–C7 as read-only recipe cards; export JSON
- [ ] Decide whether the PTP core moves to Rust → WASM (`wasm-pack`, loaded by the app) or stays in TS. Keep one source of truth for the field encoding.

## Phase 3: write custom settings

- [ ] Data-out PTP phase (SetDevicePropValue) in the transport
- [ ] Backup flow: read every slot and save a file before the first write
- [ ] Edit a slot in the UI, write it, then read it back and verify
- [ ] Import and export recipe files; share via URL
- [ ] Landing page: list cameras confirmed for writing, per firmware
