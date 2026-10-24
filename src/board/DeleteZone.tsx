import type { Ref } from 'react'
import { useUi } from '../state/store'
import { strings } from '../strings'

/**
 * Drop target covering the top third of the screen, shown only while a player is dragged.
 * Releasing anywhere in it deletes the player. Keyboard users delete with the Delete key
 * instead, so it is hidden from assistive tech.
 */
export function DeleteZone({ zoneRef }: { zoneRef: Ref<HTMLDivElement> }) {
  const dragging = useUi((s) => s.drag !== null)
  const over = useUi((s) => s.overDelete)
  return (
    <div ref={zoneRef} className="delete-zone" data-visible={dragging} data-over={over} aria-hidden="true">
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
