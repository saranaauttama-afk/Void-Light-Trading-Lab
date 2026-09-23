# Void Light — Mobile (Expo)

React Native / Expo companion app for the Void Light Trading Lab server.
4 tabs: **Market**, **Paper**, **Live**, **Research**, plus a **Settings**
tab to point the app at your server.

## Run it on your phone (fastest way — no build needed)

1. Install the **Expo Go** app on your phone (App Store / Play Store).
2. On your computer, in this folder:
   ```bash
   npm install
   npx expo start
   ```
3. A QR code appears in the terminal. Scan it:
   - iPhone: open the Camera app and point it at the QR code.
   - Android: open Expo Go and use its built-in scanner.
4. The app opens inside Expo Go. Your phone and computer must be on the
   **same Wi-Fi network** for this to work.

## Point it at your Void Light server

The app has no working default — "localhost" on a phone means the phone
itself, not your computer. On first launch:

1. On your computer, start the Void Light server (from the main repo):
   ```bash
   npm run dev:server
   ```
2. Find your computer's LAN IP:
   - **Mac**: System Settings → Wi-Fi → Details → "IP Address"
   - **Windows**: Command Prompt → `ipconfig` → "IPv4 Address"
   - **Linux**: `ip addr` or `hostname -I`
3. In the app, go to the **Settings** tab, enter e.g.
   `http://192.168.1.23:8787`, tap **Test connection**, then **Save**.

If "Test connection" fails: check the phone is on the same Wi-Fi as the
computer, that the server is actually running, and that no firewall on
your computer is blocking incoming connections on port 8787.

## Once you have no home computer available

The Settings screen accepts any reachable address — that's exactly where
a Tailscale IP or a hosted server URL goes later, with no code changes
needed. See the main repo's README for hosting options.

## Getting a real .apk without a local Android SDK

`.github/workflows/build-mobile-apk.yml` (repo root) builds this app on
GitHub's own runners — which have full internet access to the Android
SDK/Gradle/Maven, unlike a locked-down local sandbox — and attaches the
resulting debug APK to a GitHub Release. It runs automatically on any
push that touches `mobile/**`, or manually from the Actions tab
("Run workflow"). Once it finishes (a few minutes), find the APK under
the repo's **Releases** page, tagged `mobile-build-<run number>`.

It's a **debug build**: auto-signed with Android's built-in debug
keystore, which is exactly what you want for sideloading onto your own
phone — no signing setup needed. A Play Store release would need a real
keystore and `assembleRelease` instead; that's a separate step for later.

## What each tab does

- **Market** — live ticker + EMA/RSI/ATR signal per timeframe (15m/1h/4h).
- **Paper** — start/pause the paper session, place simulated buy/sell
  orders, see the paper trade journal.
- **Live** — real Binance Spot orders (testnet by default on the
  server). Requires typing "CONFIRM" plus a native confirmation dialog
  before any order fires — this moves real money (or real testnet
  funds) on the exchange.
- **Research** — backtest + 70/30 out-of-sample walk-forward per
  timeframe.

## Notes

- All state (paper trades, live trades, session status) lives on the
  **server**, not the phone. The app is a thin client — closing it
  doesn't stop or reset a running session.
- Verified: `npx tsc --noEmit` clean, `npx expo export --platform
  android` bundles cleanly (1,114 modules, no errors). Not yet tested
  inside an actual Expo Go client against a live server — do that
  smoke test before relying on it for real trades.
