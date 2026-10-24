import { registerSW } from 'virtual:pwa-register'
import { useUi } from '../state/store'

const CHECK_EVERY_MS = 60 * 60 * 1000
const LAUNCH_WINDOW_MS = 3000
const STEP_TIMEOUT_MS = 4000

let apply: (() => void) | null = null

/** Reloads into the new version. The board is saved on every change, so nothing is lost. */
export function applyUpdate() {
  apply?.()
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Version of the latest deploy, from a file that is never cached. Null when offline or in dev. */
async function deployedVersion(): Promise<string | null> {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { version?: unknown }
    return typeof data.version === 'string' ? data.version : null
  } catch {
    return null
  }
}

/**
 * Last resort when the service worker hand-over stalls (WebKit sometimes never finishes an
 * update check): drop the cached app so the next load comes from the network. Boards live
 * in localStorage, not in these caches, so they are kept.
 */
async function reloadFromNetwork() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(regs.map((r) => r.unregister()))
    const keys = await caches.keys()
    await Promise.all(keys.map((k) => caches.delete(k)))
  } finally {
    window.location.reload()
  }
}

/**
 * The service worker precaches the whole app so it loads with no signal.
 *
 * An installed home-screen app is usually resumed rather than reloaded, so the browser rarely
 * looks for a new version on its own. On every return to the app, and hourly, we ask the
 * service worker to check and also compare against /version.json, which works even when the
 * service worker's own check stalls.
 *
 * A new version is applied only when it cannot interrupt a timeout: at launch before the board
 * is touched, or when the app is put away. Until then an "Update ready" button takes it at once.
 */
export function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  const loadedAt = performance.now()
  let touched = false
  window.addEventListener('pointerdown', () => (touched = true), { once: true, capture: true })

  let registration: ServiceWorkerRegistration | undefined
  let ready = false
  let applying = false

  const handOver = (waiting: ServiceWorker) => {
    waiting.addEventListener('statechange', () => waiting.state === 'activated' && window.location.reload())
    void updateSW(true)
    // If the new version never takes over, load it from the network instead.
    void wait(STEP_TIMEOUT_MS).then(reloadFromNetwork)
  }

  const run = async () => {
    if (applying) return
    applying = true
    // Not controlled (first visit): the new worker activates on its own, a reload picks it up.
    if (!navigator.serviceWorker.controller) return window.location.reload()
    if (registration?.waiting) return handOver(registration.waiting)
    // Found through version.json before the worker got it: let it download, else go to the network.
    await Promise.race([registration?.update().catch(() => {}), wait(STEP_TIMEOUT_MS)])
    await wait(500)
    if (registration?.waiting) return handOver(registration.waiting)
    await reloadFromNetwork()
  }
  apply = () => void run()

  const markReady = () => {
    if (ready) return
    ready = true
    if (!touched && performance.now() - loadedAt < LAUNCH_WINDOW_MS) return apply?.()
    useUi.setState({ updateReady: true })
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && apply?.())
  }

  const check = async () => {
    if (!navigator.onLine || ready) return
    if (registration && !registration.installing) void registration.update().catch(() => {})
    const latest = await deployedVersion()
    if (latest && latest !== __APP_VERSION__) markReady()
  }

  const updateSW = registerSW({
    onRegisteredSW(_url, reg) {
      registration = reg
    },
    onNeedRefresh: markReady,
  })

  void check()
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && void check())
  window.addEventListener('online', () => void check())
  setInterval(() => document.visibilityState === 'visible' && void check(), CHECK_EVERY_MS)
}
