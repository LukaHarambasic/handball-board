# Handball Tactics Board

A digital handball tactics board for timeouts: drag players onto a to-scale IHF court, draw with a finger, wipe it clean. Built for iPad Safari; works on phones and desktop too.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run test:e2e   # touch flows in WebKit on iPad and iPhone (Playwright; run `npx playwright install webkit` once)
npm run test:update  # installed app picks up new releases (WebKit)
```

`npm run preview` serves the production build with the same Content-Security-Policy as Netlify.

## Deploy (Netlify)

Static hosting only; `netlify.toml` holds the build, caching and security headers.

1. Push this repo to GitHub.
2. In Netlify: **Add new project → Import an existing project**, pick the repo. Build settings come from `netlify.toml` (`npm run build`, publish `dist`, Node 24).
3. Production deploys from `main`; every pull request gets a Deploy Preview to test on the iPad before merging.

## On the board

- **Toolbar (icons only):** court view · defender and attacker trays · 6 v 6 (left half on the full court, else the visible half) · line colour · eraser · clear · full screen.
- **Eraser:** while it is on, every player and line you touch or swipe across is removed. Taking a player from a tray or picking a line colour switches back to drawing.
- **Clear:** removes every player and line on the visible court.
- **Undo / Redo:** top right, also ⌘Z / ⇧⌘Z. One eraser swipe is one step; each canvas has its own history, which starts fresh when you switch canvases.
- **Zoom:** pinch with two fingers, or pinch on a trackpad; two-finger scroll pans when zoomed. Top centre: zoom out, the level (tap for the whole court) and zoom in, 100–400 %. Phones show only the level, once zoomed. A second finger during a line turns it into a pinch and drops the line.
- **Delete:** while a player is dragged, the top third of the screen becomes the delete zone; release there to remove it.

## Releases and installed apps

Push to `main` and Netlify deploys. Copies already added to the Home Screen update themselves:

- Every time the app is opened or brought back, and hourly while open, it checks `/version.json` (never cached) and asks the service worker for the new files.
- A new version is never applied in the middle of a timeout. It loads straight away at launch if the board hasn't been touched yet, otherwise when the app is put away. Until then an **Update ready** button (top right) applies it with one tap.
- Boards are kept in local storage, so updating never loses them.
- The version and commit are shown at the bottom of the Canvases dialog, to confirm what is running.

`npm run test:update` checks all of this end to end in WebKit across several fake releases.

## Using it on the iPad

- **Full screen from a link:** tap the full-screen button in the toolbar.
- **Like an app:** Share → Add to Home Screen. It then opens without browser UI and works offline.
- **Canvases:** the top-left button lists your boards. Create, rename, duplicate and delete them there. They are saved only in this browser on this device (no account, no sync).

## Accessibility

- Every control is a real button with a text name; focus is always visible.
- Players are keyboard-operable: Tab to a player, arrow keys move it (Shift for larger steps), Delete removes it. Tray buttons place a player on Enter.
- Toolbar buttons are icons only; each has a full accessible name, and the eraser reports on/off (`aria-pressed`).
- The court menu supports arrow keys, Home/End and Escape.
- Board changes are announced through a polite live region.
- Touch targets are at least 44 px; teams differ by shape (square vs triangle), not just colour.
- Reduced-motion and forced-colours preferences are respected.
- Page zoom is disabled on purpose (pinch would fight with drawing); toolbar text is 17–19 px.

## Layout

```
src/
  board/      Board, CourtMarkings, court.ts (IHF geometry), Tokens, Strokes, DragLayer, DeleteZone, useLayout
  input/      usePointerRouter (token drag vs draw), coords (screen ↔ metres, layout fit)
  ui/         BottomBar, CourtMenu, TokenTray, InstallHint, LiveRegion
  setups/     sixVsSix (standard positions)
  state/      store (Zustand + localStorage), courtView (last-changed side, full ↔ half)
  platform/   fullscreen, wakeLock, standalone, serviceWorker
  strings.ts  every user-facing label
```
