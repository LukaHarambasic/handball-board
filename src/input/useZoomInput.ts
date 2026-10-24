import { useEffect, type RefObject } from 'react'
import { useUi } from '../state/store'
import { panBy, zoomAround, type Layout } from './coords'

type GestureEvent = UIEvent & { scale: number; clientX: number; clientY: number }

/**
 * Trackpad zoom and pan. Chrome and Firefox report a pinch as a wheel event with ctrlKey;
 * Safari reports gesture events. A plain two-finger scroll pans a zoomed court. Touch pinch
 * is handled by the pointer router, so gesture events from touch screens are skipped here.
 */
export function useZoomInput(layoutRef: RefObject<Layout | null>) {
  useEffect(() => {
    let touches = 0
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      touches = Math.max(0, touches + (e.type === 'pointerdown' ? 1 : -1))
    }
    const onBoard = (t: EventTarget | null) => !!(t as Element | null)?.closest?.('.board')

    const onWheel = (e: WheelEvent) => {
      const l = layoutRef.current
      if (!l) return
      if (e.ctrlKey) {
        // Pinch on a trackpad (or Ctrl + scroll): never zoom the page itself.
        e.preventDefault()
        useUi.setState({ zoom: zoomAround(l, Math.exp(-e.deltaY * 0.01), [e.clientX, e.clientY]) })
      } else if (onBoard(e.target) && l.zoom > 1) {
        e.preventDefault()
        useUi.setState({ zoom: panBy(l, -e.deltaX, -e.deltaY) })
      }
    }

    let start: { layout: Layout; at: [number, number] } | null = null
    const onGestureStart = (e: Event) => {
      const g = e as GestureEvent
      const l = layoutRef.current
      start = touches === 0 && l ? { layout: l, at: [g.clientX, g.clientY] } : null
    }
    const onGestureChange = (e: Event) => {
      const g = e as GestureEvent
      if (!start || touches > 0) return
      useUi.setState({ zoom: zoomAround(start.layout, g.scale, start.at) })
    }
    const onGestureEnd = () => (start = null)

    window.addEventListener('pointerdown', onPointer, true)
    window.addEventListener('pointerup', onPointer, true)
    window.addEventListener('pointercancel', onPointer, true)
    window.addEventListener('wheel', onWheel, { passive: false })
    document.addEventListener('gesturestart', onGestureStart)
    document.addEventListener('gesturechange', onGestureChange)
    document.addEventListener('gestureend', onGestureEnd)
    return () => {
      window.removeEventListener('pointerdown', onPointer, true)
      window.removeEventListener('pointerup', onPointer, true)
      window.removeEventListener('pointercancel', onPointer, true)
      window.removeEventListener('wheel', onWheel)
      document.removeEventListener('gesturestart', onGestureStart)
      document.removeEventListener('gesturechange', onGestureChange)
      document.removeEventListener('gestureend', onGestureEnd)
    }
  }, [layoutRef])
}
