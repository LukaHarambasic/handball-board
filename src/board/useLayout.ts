import { useLayoutEffect, useMemo, useState, type RefObject } from 'react'
import { computeLayout, type Insets, type Layout, type Rect } from '../input/coords'
import { useBoard } from '../state/store'

type Measure = { width: number; height: number; insets: Insets; barTop: number; deleteZone: Rect }

const same = (a: Measure | null, b: Measure) => a !== null && JSON.stringify(a) === JSON.stringify(b)

/** Measures the screen, safe areas, bottom bar and delete zone, and fits the court around them. */
export function useLayout(refs: {
  root: RefObject<HTMLElement | null>
  bar: RefObject<HTMLElement | null>
  deleteZone: RefObject<HTMLElement | null>
  insetProbe: RefObject<HTMLElement | null>
}): Layout | null {
  const view = useBoard((s) => s.view)
  const halfSide = useBoard((s) => s.halfSide)
  const [m, setM] = useState<Measure | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const root = refs.root.current
      const bar = refs.bar.current
      const zone = refs.deleteZone.current
      const probe = refs.insetProbe.current
      if (!root || !bar || !zone || !probe) return
      const r = root.getBoundingClientRect()
      const cs = getComputedStyle(probe)
      const z = zone.getBoundingClientRect()
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
        deleteZone: { left: z.left, top: z.top, right: z.right, bottom: z.bottom },
      }
      setM((prev) => (same(prev, next) ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    for (const el of [refs.root.current, refs.bar.current, refs.deleteZone.current]) if (el) ro.observe(el)
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [refs.root, refs.bar, refs.deleteZone, refs.insetProbe])

  return useMemo(() => (m ? computeLayout({ ...m, view, halfSide }) : null), [m, view, halfSide])
}
