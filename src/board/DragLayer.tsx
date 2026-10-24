import type { Layout } from '../input/coords'
import type { PointerRouter } from '../input/usePointerRouter'
import { useUi } from '../state/store'
import { TokenShape } from './TokenShape'

/** The token under the finger, lifted above every other layer including the toolbar. */
export function DragLayer({ layout, router }: { layout: Layout; router: PointerRouter }) {
  const drag = useUi((s) => s.drag)
  return (
    <svg className="drag-layer" viewBox={layout.viewBox} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="lift-shadow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="0.3" stdDeviation="0.3" floodColor="#0F172A" floodOpacity="0.4" />
        </filter>
      </defs>
      <circle ref={router.eraserRef} className="eraser-ring" visibility="hidden" />
      {drag && (
        <g ref={router.dragOuterRef}>
          <g ref={router.dragInnerRef} filter="url(#lift-shadow)">
            <TokenShape team={drag.team} size={layout.tokenSize} />
          </g>
        </g>
      )}
    </svg>
  )
}
