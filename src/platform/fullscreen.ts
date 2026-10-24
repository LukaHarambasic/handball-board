import screenfull from 'screenfull'
import { useEffect, useState } from 'react'
import { isStandalone } from './standalone'

/** The Fullscreen API works on iPadOS (prefixed and unprefixed) but not on iPhone. */
export const fullscreenAvailable = () => screenfull.isEnabled && !isStandalone()

export function useFullscreen() {
  const [active, setActive] = useState(() => screenfull.isEnabled && screenfull.isFullscreen)
  useEffect(() => {
    if (!screenfull.isEnabled) return
    const onChange = () => setActive(screenfull.isFullscreen)
    screenfull.on('change', onChange)
    return () => screenfull.off('change', onChange)
  }, [])
  // Must run inside a tap handler.
  const toggle = () => {
    if (!screenfull.isEnabled) return
    if (screenfull.isFullscreen) void screenfull.exit()
    else void screenfull.request(document.documentElement).catch(() => {})
  }
  return { active, toggle }
}
