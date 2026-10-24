import { useEffect } from 'react'

/** Keeps the screen on while the board is visible, so the iPad doesn't dim mid-timeout. Fails silently. */
export function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = async () => {
      if (document.visibilityState !== 'visible' || (lock && !lock.released)) return
      try {
        lock = await navigator.wakeLock.request('screen')
        if (cancelled) void lock.release()
      } catch {
        /* unsupported, denied or low battery */
      }
    }
    void acquire()
    // The lock is dropped whenever the page is hidden; take it again on return.
    document.addEventListener('visibilitychange', acquire)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      void lock?.release().catch(() => {})
    }
  }, [])
}
