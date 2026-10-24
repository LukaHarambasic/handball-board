import type { Ref } from 'react'
import { useUi } from '../state/store'
import { strings } from '../strings'

/**
 * Top-right drop target, shown only while a token is dragged. The layout keeps the court
 * line clear of it, so a wing dropped in the corner is never deleted by accident.
 * Keyboard users delete with the Delete key instead, so it is hidden from assistive tech.
 */
export function DeleteZone({ zoneRef }: { zoneRef: Ref<HTMLDivElement> }) {
  const dragging = useUi((s) => s.drag !== null)
  const over = useUi((s) => s.overDelete)
  return (
    <div ref={zoneRef} className="delete-zone" data-visible={dragging} data-over={over} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
      </svg>
      <span className="whitespace-pre-line">{over ? strings.deleteActive : strings.deleteIdle}</span>
    </div>
  )
}
