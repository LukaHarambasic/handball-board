import type { Ref } from 'react'
import { courtTopPx, type Layout } from '../input/coords'
import { useUi } from '../state/store'
import { strings } from '../strings'

/** Never thinner than this, so the zone stays easy to hit when zoomed in past the sideline. */
const MIN_HEIGHT = 72

/**
 * Drop target across the full width, from the top of the screen down to the court's top line,
 * shown only while a player is dragged. Players can be dropped anywhere on the court; releasing
 * above it deletes them. Keyboard users delete with the Delete key, so it is hidden from
 * assistive tech.
 */
export function DeleteZone({ zoneRef, layout }: { zoneRef: Ref<HTMLDivElement>; layout: Layout | null }) {
  const dragging = useUi((s) => s.drag !== null)
  const over = useUi((s) => s.overDelete)
  const height = Math.max(MIN_HEIGHT, layout ? courtTopPx(layout) : 0)
  return (
    <div ref={zoneRef} className="delete-zone" style={{ height }} data-visible={dragging} data-over={over} aria-hidden="true">
      <span className="delete-pill">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
        <span>{over ? strings.deleteActive : strings.deleteIdle}</span>
      </span>
    </div>
  )
}
