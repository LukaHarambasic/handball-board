import { registerSW } from 'virtual:pwa-register'

/**
 * The service worker precaches the whole app so it loads with no signal. A new version
 * found during use waits; one already waiting at launch is applied before the board is
 * touched. An update never interrupts a timeout.
 */
export function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  const loadedAt = performance.now()
  let touched = false
  window.addEventListener('pointerdown', () => (touched = true), { once: true, capture: true })
  const update = registerSW({
    onNeedRefresh() {
      if (!touched && performance.now() - loadedAt < 3000) void update(true)
    },
  })
}
