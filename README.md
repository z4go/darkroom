# darkroom

WebUSB web app to read and write Fujifilm custom settings (C1–C7) over PTP. Runs entirely in the browser.

**Site:** https://z4go.github.io/darkroom/ · **App:** https://z4go.github.io/darkroom/app/

<!-- TODO: screenshot of the probe page -->
<!-- ![darkroom probe page](docs/screenshot.png) -->

> **Status:** reads and writes custom settings C1–C7 on the X100VI (firmware 1.20). Preset library with built-in recipes. See [PLAN.md](PLAN.md).

## Use it

1. On the camera, set **MENU → Network/USB Setting → Connection Mode → USB RAW CONV./BACKUP RESTORE**.
2. Connect a USB-C data cable.
3. Open the [app](https://z4go.github.io/darkroom/app/) in Chrome or Edge (desktop) or Chrome on Android.

On macOS, `ptpcamerad` may hold the camera. The [site](https://z4go.github.io/darkroom/#macos-ptpcamerad) has a workaround.

## Develop

```sh
bun install
bun run dev        # http://localhost:5173/darkroom/
bun run build      # typecheck + static build into dist/
bun run free-camera [minutes]   # macOS: keep ptpcamerad off the camera (default 30 min)
```

WebUSB needs a secure context. `localhost` counts; GitHub Pages serves HTTPS.

## Disclaimer

Not affiliated with or endorsed by Fujifilm. This uses an unofficial, reverse-engineered protocol. Back up your camera settings before writing anything. Writing settings may affect your warranty. Use at your own risk.

## Credits

Built on prior protocol work by FilmKit, latent and libfuji.

## License

MIT
