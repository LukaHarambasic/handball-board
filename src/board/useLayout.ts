import { useLayoutEffect, useMemo, useState, type RefObject } from 'react'
import { computeLayout, type Insets, type Layout, type Rect } from '../input/coords'
import { useBoard, useUi } from '../state/store'

type Measure = { width: number; height: number; insets: Insets; barTop: number; topObstacles: Rect[] }

const same = (a: Measure | null, b: Measure) => a !== null && JSON.stringify(a) === JSON.stringify(b)

/** Measures the screen, safe areas, bottom bar and top controls, and fits the court around them. */
export function useLayout(refs: {
  root: RefObject<HTMLElement | null>
  bar: RefObject<HTMLElement | null>
  /** Floating controls along the top; the court line stays below the ones it would sit under. */
  topControls: RefObject<HTMLElement | null>[]
  insetProbe: RefObject<HTMLElement | null>
}): Layout | null {
  const view = useBoard((s) => s.view)
  const halfSide = useBoard((s) => s.halfSide)
  const activeId = useBoard((s) => s.activeId)
  const zoom = useUi((s) => s.zoom)
  const [m, setM] = useState<Measure | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const root = refs.root.current
      const bar = refs.bar.current
      const probe = refs.insetProbe.current
      const controls = refs.topControls.map((r) => r.current)
      if (!root || !bar || !probe || controls.some((c) => !c)) return
      const r = root.getBoundingClientRect()
      const cs = getComputedStyle(probe)
      const rect = (el: Element): Rect => {
        const r = el.getBoundingClientRect()
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
      }
      const next: Measure = {
        width: Math.round(r.width),
        height: Math.round(r.height),
        insets: {
          top: parseFloat(cs.paddingTop) || 0,
          right: parseFloat(cs.paddingRight) || 0,
          bottom: parseFloat(cs.paddingBottom) || 0,
          left: parseFloat(cs.paddingLeft) || 0,
        },
        barTop: Math.round(bar.getBoundingClientRect().top),
        topObstacles: (controls as HTMLElement[]).map(rect),
      }
      setM((prev) => (same(prev, next) ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    for (const el of [refs.root.current, refs.bar.current, ...refs.topControls.map((r) => r.current)]) if (el) ro.observe(el)
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [refs.root, refs.bar, refs.topControls, refs.insetProbe])

  // A different court view or canvas starts from the whole court.
  useLayoutEffect(() => useUi.setState({ zoom: null }), [view, halfSide, activeId])

  return useMemo(() => (m ? computeLayout({ ...m, view, halfSide }, zoom) : null), [m, view, halfSide, zoom])
}
