import { forwardRef, type RefObject } from 'react'
import { MAX_ZOOM, zoomAround, type Layout } from '../input/coords'
import { announce, useUi } from '../state/store'
import { strings } from '../strings'
import { MinusIcon, PlusIcon } from './icons'

const STEP = 1.25

/** Zoom out, the zoom level (tap to see the whole court again) and zoom in. Top centre. */
export const ZoomControls = forwardRef<HTMLDivElement, { layoutRef: RefObject<Layout | null> }>(function ZoomControls(
  { layoutRef },
  ref,
) {
  const z = useUi((s) => s.zoom?.z ?? 1)
  const percent = Math.round(z * 100)

  const zoomBy = (k: number) => {
    const l = layoutRef.current
    if (!l) return
    const next = zoomAround(l, k, [l.fit.cx, l.fit.cy])
    useUi.setState({ zoom: next })
    announce(strings.announceZoom(Math.round((next?.z ?? 1) * 100)))
  }
  const reset = () => {
    useUi.setState({ zoom: null })
    announce(strings.announceZoom(100))
  }

  return (
    <div ref={ref} className="zoom-controls" role="group" aria-label={strings.zoom} data-zoomed={z > 1}>
      <button type="button" className="zoom-step" onClick={() => zoomBy(1 / STEP)} disabled={z <= 1} aria-label={strings.zoomOut}>
        <MinusIcon />
      </button>
      <button type="button" className="zoom-level" onClick={reset} disabled={z <= 1} aria-label={strings.zoomReset(percent)}>
        {percent}%
      </button>
      <button type="button" className="zoom-step" onClick={() => zoomBy(STEP)} disabled={z >= MAX_ZOOM} aria-label={strings.zoomIn}>
        <PlusIcon />
      </button>
    </div>
  )
})
